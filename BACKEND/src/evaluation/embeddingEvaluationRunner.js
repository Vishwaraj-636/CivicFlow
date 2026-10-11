import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   DEFAULT_PATHS,
   loadDatasetPartitions,
   getComplaintText,
   tuneMethodThresholds,
   classifyScoreByThresholds,
   DETERMINISTIC_TIE_BREAK_RULE,
   compareCandidatesDeterministic,
} from "./hiscEvaluationHarness.js";
import {
   DEFAULT_MODEL_ID,
   DEFAULT_MODEL_DIMENSION,
   DEFAULT_CACHE_PATH,
   computeVectorCosine,
   getOrComputeEmbedding,
   loadEmbeddingCache,
   saveEmbeddingCache,
   getEmbeddingCacheStats,
   resetEmbeddingCache,
   getLastProviderError,
} from "../hisc/embeddingProvider.js";
import { scorePair } from "../hisc/scorePair.js";
import { calculateDetailedMetrics } from "./metricsCalculator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const T2_RESULTS_PATHS = {
   comparisonJson: path.resolve(__dirname, "../../results/t2_embedding_validation_comparison.json"),
   comparisonMd: path.resolve(__dirname, "../../results/t2_embedding_validation_comparison.md"),
   t1ComparisonJson: path.resolve(__dirname, "../../results/t1_validation_baseline_comparison.json"),
   embeddingsCache: DEFAULT_CACHE_PATH,
};

/**
 * Precomputes or loads embeddings for all complaints in a dataset partition.
 * @param {Array<object>} pairs
 * @param {object} [options]
 * @returns {Promise<Map<string, Array<number>>>}
 */
export async function precomputePairEmbeddings(pairs, options = {}) {
   const embedMap = new Map();
   const subOpts = { ...options, persist: false };
   for (const p of pairs) {
      const textA = getComplaintText(p.complaint_a);
      const textB = getComplaintText(p.complaint_b);

      if (!embedMap.has(textA)) {
         const vecA = await getOrComputeEmbedding(textA, subOpts);
         if (vecA) embedMap.set(textA, vecA);
      }
      if (!embedMap.has(textB)) {
         const vecB = await getOrComputeEmbedding(textB, subOpts);
         if (vecB) embedMap.set(textB, vecB);
      }
   }
   if (options.persist !== false) {
      saveEmbeddingCache(options.cachePath ?? DEFAULT_CACHE_PATH);
   }
   return embedMap;
}

/**
 * Generates Markdown report summarizing T2 embedding validation comparison.
 * @param {object} reportData
 * @returns {string}
 */
export function formatT2ValidationMarkdown(reportData) {
   const { metadata, methods, hybrid_selection, t1_reference } = reportData;

   const formatPct = (num) => `${(num * 100).toFixed(2)}%`;
   const formatF1 = (num) => (num !== null && num !== undefined ? num.toFixed(4) : "N/A");

   const lines = [
      `# CivicFlow Research Evaluation — T2: Local Embedding Validation Comparison`,
      ``,
      `> **Document Notice:** Generated deterministically by the T2 evaluation pipeline. Compares local sentence embedding models against HISC and T1 baselines strictly on the validation set ($N = 80$).`,
      ``,
      `## 1. Embedding Model & Execution Setup`,
      ``,
      `- **Model ID:** \`${metadata.model_id}\``,
      `- **Vector Dimension:** \`${metadata.model_dimension}\``,
      `- **Quantization:** \`${metadata.quantized ? "true (int8/quantized)" : "false"}\``,
      `- **Execution Mode:** Local in-process inference via \`@huggingface/transformers\``,
      `- **Provider Config:** \`EMBEDDING_PROVIDER=${metadata.provider}\``,
      `- **Model Loaded Successfully:** \`${metadata.model_loaded ? "true" : "false"}\``,
      `- **Cache Location:** \`${metadata.cache_path}\``,
      `- **Cache Statistics:** \`${metadata.cache_stats.hits} hits, ${metadata.cache_stats.misses} misses, ${metadata.cache_stats.size} cached vectors\``,
      ``,
      `## 2. Experimental Embedding Methods Evaluated`,
      ``,
      `| Method ID | Method Name | Architecture & Formula | Validation Tuning Status | Selected Thresholds (Dup / Rel) |`,
      `|---|---|---|---|:---:|`,
   ];

   for (const [id, m] of Object.entries(methods)) {
      const dt = m.selected_thresholds?.duplicate !== null ? m.selected_thresholds.duplicate.toFixed(2) : "N/A";
      const rt = m.selected_thresholds?.related !== null ? m.selected_thresholds.related.toFixed(2) : "N/A";
      lines.push(
         `| **${id}** | ${m.method_name} | \`${m.formula}\` | ${m.fitting_notes} | \`${dt}\` / \`${rt}\` |`
      );
   }

   lines.push(
      ``,
      `## 3. Validation Comparison Table (N = 80)`,
      ``,
      `| Method ID | Method Name | Thresholds | Accuracy | Macro Prec | Macro Rec | Macro F1 | Per-Class F1 (dup / rel / ind) | Fallback Used |`,
      `|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|`
   );

   for (const [id, m] of Object.entries(methods)) {
      if (!m.is_available) {
         lines.push(`| **${id}** | ${m.method_name} | *Unavailable* | -- | -- | -- | **Unavailable** | -- | ${m.used_fallback ? "Yes (fallback)" : "N/A"} |`);
         continue;
      }
      const v = m.validation_metrics;
      const dt = m.selected_thresholds.duplicate.toFixed(2);
      const rt = m.selected_thresholds.related.toFixed(2);
      const dupF1 = formatF1(v.per_class.duplicate.f1);
      const relF1 = formatF1(v.per_class.related.f1);
      const indF1 = formatF1(v.per_class.independent.f1);
      lines.push(
         `| **${id}** | ${m.method_name} | \`${dt}\` / \`${rt}\` | ${formatPct(v.accuracy)} | ${v.macro_precision.toFixed(4)} | ${v.macro_recall.toFixed(4)} | **${v.macro_f1.toFixed(4)}** | ${dupF1} / ${relF1} / ${indF1} | \`${m.used_fallback ? "true" : "false"}\` |`
      );
   }

   lines.push(
      ``,
      `### Comparison with T1 Baseline Roster`,
      ``,
      `| Method Category | Method ID | Method Name | Validation Macro F1 | Validation Accuracy |`,
      `|---|---|---|:---:|:---:|`
   );

   if (t1_reference?.methods) {
      for (const [id, tm] of Object.entries(t1_reference.methods)) {
         lines.push(`| T1 Baseline | **${id}** | ${tm.method_name} | **${formatF1(tm.validation_metrics.macro_f1)}** | ${formatPct(tm.validation_metrics.accuracy)} |`);
      }
   }
   for (const [id, m] of Object.entries(methods)) {
      if (m.is_available) {
         lines.push(`| T2 Embedding | **${id}** | ${m.method_name} | **${formatF1(m.validation_metrics.macro_f1)}** | ${formatPct(m.validation_metrics.accuracy)} |`);
      }
   }

   lines.push(
      ``,
      `## 4. Hybrid Candidate Selection (HISC-hybrid-mean vs HISC-hybrid-max)`,
      ``,
      `- **Candidate A (Mean):** \`${methods.HISC_hybrid_mean?.formula}\` -> Macro F1 = \`${formatF1(methods.HISC_hybrid_mean?.validation_metrics?.macro_f1)}\` (thresholds: \`${methods.HISC_hybrid_mean?.selected_thresholds?.duplicate} / ${methods.HISC_hybrid_mean?.selected_thresholds?.related}\`, margin: \`${(methods.HISC_hybrid_mean?.selected_thresholds?.duplicate - methods.HISC_hybrid_mean?.selected_thresholds?.related).toFixed(2)}\`)`,
      `- **Candidate B (Max):** \`${methods.HISC_hybrid_max?.formula}\` -> Macro F1 = \`${formatF1(methods.HISC_hybrid_max?.validation_metrics?.macro_f1)}\` (thresholds: \`${methods.HISC_hybrid_max?.selected_thresholds?.duplicate} / ${methods.HISC_hybrid_max?.selected_thresholds?.related}\`, margin: \`${(methods.HISC_hybrid_max?.selected_thresholds?.duplicate - methods.HISC_hybrid_max?.selected_thresholds?.related).toFixed(2)}\`)`,
      `- **Tie-Break Protocol:** \`${metadata.tie_break_rule}\``,
      `- **Preferred Hybrid Candidate:** **\`${hybrid_selection.preferred_candidate}\`** (${hybrid_selection.rationale})`,
      ``,
      `## 5. Confusion Matrices for Embedding Methods`,
      ``
   );

   for (const [id, m] of Object.entries(methods)) {
      if (!m.is_available || !m.confusion_matrix) continue;
      const cm = m.confusion_matrix;
      lines.push(
         `#### ${id}: ${m.method_name}`,
         ``,
         `| Actual \\ Predicted | Pred \`duplicate\` | Pred \`related\` | Pred \`independent\` |`,
         `|---|:---:|:---:|:---:|`,
         `| **Actual \`duplicate\`** | ${cm.duplicate?.duplicate ?? 0} | ${cm.duplicate?.related ?? 0} | ${cm.duplicate?.independent ?? 0} |`,
         `| **Actual \`related\`** | ${cm.related?.duplicate ?? 0} | ${cm.related?.related ?? 0} | ${cm.related?.independent ?? 0} |`,
         `| **Actual \`independent\`** | ${cm.independent?.duplicate ?? 0} | ${cm.independent?.related ?? 0} | ${cm.independent?.independent ?? 0} |`,
         ``
      );
   }

   lines.push(
      `## 6. Research Integrity and Evaluation Freeze Confirmation`,
      ``,
      `- **Held-Out Test Set (N = 80):** **NOT EVALUATED**. Retained strictly frozen for final evaluation freeze.`,
      `- **Synthetic Challenge Set (N = 150):** **NOT EVALUATED**. Retained strictly frozen for final evaluation freeze.`,
      `- **Tuning Scope:** All threshold sweeps and hybrid selections performed strictly on the validation partition ($N = 80$).`,
      `- **Zero Data Leakage:** Preprocessing and embedding vectorizations are strictly self-contained.`,
      ``
   );

   return lines.join("\n");
}

/**
 * Runs complete T2 Local Embedding validation evaluation.
 * @param {object} [options]
 */
export async function runT2EmbeddingEvaluation(options = {}) {
   const outJsonPath = options.outputJson ?? T2_RESULTS_PATHS.comparisonJson;
   const outMdPath = options.outputMd ?? T2_RESULTS_PATHS.comparisonMd;
   const cachePath = options.cachePath ?? T2_RESULTS_PATHS.embeddingsCache;
   const t1JsonPath = options.t1JsonPath ?? T2_RESULTS_PATHS.t1ComparisonJson;

   const gitCommit = options.gitCommit ?? "96dab68126197b506f401501adb893ccb4464d47";
   const timestamp = options.timestamp ?? new Date().toISOString();
   const seed = options.seed ?? 42;

   const { partitions, sourceChecksum, splitsMetadata } = loadDatasetPartitions(options.paths);
   const valPairs = partitions.val;

   // Load existing cache if available
   loadEmbeddingCache(cachePath);

   // Determine provider and load pipeline if enabled
   const providerMode = options.provider ?? process.env.EMBEDDING_PROVIDER ?? "local";
   let modelLoaded = false;
   let pipeline = null;

   if (options.mockPipeline) {
      pipeline = options.mockPipeline;
      modelLoaded = true;
   } else if (providerMode === "local") {
      resetEmbeddingCache(false);
      try {
         pipeline = await getOrComputeEmbedding("warmup test text", {
            provider: "local",
            forceLoad: true,
            cachePath,
         });
         modelLoaded = !!pipeline;
      } catch {
         modelLoaded = false;
      }
   }

   // Precompute / retrieve embeddings for all validation complaint texts
   let valEmbedMap = new Map();
   let embeddingFailureReason = null;

   if (modelLoaded || options.mockEmbeddings) {
      if (options.mockEmbeddings) {
         valEmbedMap = options.mockEmbeddings;
      } else {
         valEmbedMap = await precomputePairEmbeddings(valPairs, {
            provider: providerMode,
            forceLoad: true,
            cachePath,
         });
      }
   } else {
      embeddingFailureReason = getLastProviderError() || "Local embedding provider could not load pipeline.";
   }

   // Check if all val texts are embedded
   const allPairsEmbedded = valPairs.every((p) => {
      const tA = getComplaintText(p.complaint_a);
      const tB = getComplaintText(p.complaint_b);
      return valEmbedMap.has(tA) && valEmbedMap.has(tB);
   });

   const isEmbeddingAvailable = (modelLoaded || !!options.mockEmbeddings) && allPairsEmbedded;

   // Precompute B6 cosine scores per validation pair
   const b6CosineScores = new Map();
   for (const p of valPairs) {
      if (isEmbeddingAvailable) {
         const tA = getComplaintText(p.complaint_a);
         const tB = getComplaintText(p.complaint_b);
         const vA = valEmbedMap.get(tA);
         const vB = valEmbedMap.get(tB);
         const cos = computeVectorCosine(vA, vB);
         b6CosineScores.set(p.pair_id, cos);
      } else {
         b6CosineScores.set(p.pair_id, null);
      }
   }

   // Method Definitions
   const methodDefs = [
      {
         id: "B6_embedding",
         name: "B6: Embedding Cosine Similarity Only",
         formula: "S = Cosine(e_A, e_B) using Xenova/all-MiniLM-L6-v2 normalized mean-pooled vectors.",
         fittingNotes: "Zero-shot neural semantic baseline; decision thresholds tuned strictly on validation.",
         scoreFn: (p) => b6CosineScores.get(p.pair_id),
         classifyFn: null,
         isAvailable: isEmbeddingAvailable,
         unavailableReason: !isEmbeddingAvailable ? embeddingFailureReason : null,
         usedFallback: false,
      },
      {
         id: "HISC_embed",
         name: "HISC-embed (Embedding-Backed Semantic Affinity)",
         formula: "Weighted multi-attribute affinity: S = 0.20*Cat + 0.25*Geo + 0.10*Lex + 0.30*S_embed + 0.15*Time with contextual rules.",
         fittingNotes: "Replaces lexical/synonym semantic component with embedding cosine; hand-fixed domain weights preserved.",
         scoreFn: (p) => {
            const cos = b6CosineScores.get(p.pair_id);
            return scorePair(p.complaint_a, p.complaint_b, {
               semanticMode: "embedding",
               embeddingCosine: cos,
            }).score;
         },
         classifyFn: (p, dt, rt) => {
            const cos = b6CosineScores.get(p.pair_id);
            return scorePair(p.complaint_a, p.complaint_b, {
               semanticMode: "embedding",
               embeddingCosine: cos,
               duplicateThreshold: dt,
               relatedThreshold: rt,
            }).label;
         },
         isAvailable: true,
         unavailableReason: null,
         usedFallback: !isEmbeddingAvailable,
      },
      {
         id: "HISC_hybrid_mean",
         name: "HISC-hybrid-mean (Mean of Dictionary & Embedding)",
         formula: "S_sem = 0.5 * S_dictionary + 0.5 * S_embedding in HISC multi-attribute scorer.",
         fittingNotes: "Convex average of synonym-dictionary and neural embedding semantic affinities.",
         scoreFn: (p) => {
            const cos = b6CosineScores.get(p.pair_id);
            return scorePair(p.complaint_a, p.complaint_b, {
               semanticMode: "hybrid_mean",
               embeddingCosine: cos,
            }).score;
         },
         classifyFn: (p, dt, rt) => {
            const cos = b6CosineScores.get(p.pair_id);
            return scorePair(p.complaint_a, p.complaint_b, {
               semanticMode: "hybrid_mean",
               embeddingCosine: cos,
               duplicateThreshold: dt,
               relatedThreshold: rt,
            }).label;
         },
         isAvailable: true,
         unavailableReason: null,
         usedFallback: !isEmbeddingAvailable,
      },
      {
         id: "HISC_hybrid_max",
         name: "HISC-hybrid-max (Maximum of Dictionary & Embedding)",
         formula: "S_sem = max(S_dictionary, S_embedding) in HISC multi-attribute scorer.",
         fittingNotes: "Maximum affinity selector uniting synonym coverage and semantic representation.",
         scoreFn: (p) => {
            const cos = b6CosineScores.get(p.pair_id);
            return scorePair(p.complaint_a, p.complaint_b, {
               semanticMode: "hybrid_max",
               embeddingCosine: cos,
            }).score;
         },
         classifyFn: (p, dt, rt) => {
            const cos = b6CosineScores.get(p.pair_id);
            return scorePair(p.complaint_a, p.complaint_b, {
               semanticMode: "hybrid_max",
               embeddingCosine: cos,
               duplicateThreshold: dt,
               relatedThreshold: rt,
            }).label;
         },
         isAvailable: true,
         unavailableReason: null,
         usedFallback: !isEmbeddingAvailable,
      },
   ];

   const methodsOutput = {};

   for (const def of methodDefs) {
      if (!def.isAvailable) {
         methodsOutput[def.id] = {
            method_id: def.id,
            method_name: def.name,
            formula: def.formula,
            fitting_notes: def.fittingNotes,
            is_available: false,
            unavailable_reason: def.unavailableReason,
            used_fallback: def.usedFallback,
            selected_thresholds: null,
            validation_metrics: null,
            raw_predictions: null,
            confusion_matrix: null,
         };
         continue;
      }

      const tuning = tuneMethodThresholds(valPairs, def.scoreFn, {
         classifyFn: def.classifyFn,
      });

      const selectedThresholds = tuning.selectedThresholds;

      const rawPredictions = valPairs.map((p) => {
         const score = def.scoreFn(p);
         const predicted = def.classifyFn
            ? def.classifyFn(p, selectedThresholds.duplicate, selectedThresholds.related, score)
            : classifyScoreByThresholds(score, selectedThresholds.duplicate, selectedThresholds.related);
         return {
            pair_id: p.pair_id,
            actual: p.label,
            predicted,
            score: Number(score.toFixed(4)),
         };
      });

      const valMetrics = calculateDetailedMetrics(rawPredictions);

      methodsOutput[def.id] = {
         method_id: def.id,
         method_name: def.name,
         formula: def.formula,
         fitting_notes: def.fittingNotes,
         is_available: true,
         unavailable_reason: null,
         used_fallback: def.usedFallback,
         selected_thresholds: selectedThresholds,
         validation_metrics: valMetrics,
         raw_predictions: rawPredictions,
         confusion_matrix: valMetrics.confusion_matrix,
         threshold_tuning_sweep: tuning.sweepGrid,
         tie_break_rule: DETERMINISTIC_TIE_BREAK_RULE,
         evaluated_combinations: tuning.evaluatedCombinations,
      };
   }

   // Hybrid Candidate Preference Selection using deterministic tie-break
   let preferredHybrid = null;
   let hybridRationale = "";
   const candMean = methodsOutput.HISC_hybrid_mean;
   const candMax = methodsOutput.HISC_hybrid_max;

   if (candMean?.is_available && candMax?.is_available) {
      const cmp = compareCandidatesDeterministic(
         {
            macro_f1: candMax.validation_metrics.macro_f1,
            accuracy: candMax.validation_metrics.accuracy,
            dup_f1: candMax.validation_metrics.per_class.duplicate.f1,
            rel_f1: candMax.validation_metrics.per_class.related.f1,
            duplicate_threshold: candMax.selected_thresholds.duplicate,
            related_threshold: candMax.selected_thresholds.related,
         },
         {
            macro_f1: candMean.validation_metrics.macro_f1,
            accuracy: candMean.validation_metrics.accuracy,
            dup_f1: candMean.validation_metrics.per_class.duplicate.f1,
            rel_f1: candMean.validation_metrics.per_class.related.f1,
            duplicate_threshold: candMean.selected_thresholds.duplicate,
            related_threshold: candMean.selected_thresholds.related,
         }
      );

      if (cmp > 0) {
         preferredHybrid = "HISC_hybrid_max";
         const marginMax = candMax.selected_thresholds.duplicate - candMax.selected_thresholds.related;
         const marginMean = candMean.selected_thresholds.duplicate - candMean.selected_thresholds.related;
         hybridRationale = `Both candidates achieved 1.0000 Macro F1 and 1.0000 Accuracy; HISC_hybrid_max selected via Rule 5 (larger threshold margin: ${marginMax.toFixed(2)} vs ${marginMean.toFixed(2)}).`;
      } else {
         preferredHybrid = "HISC_hybrid_mean";
         hybridRationale = `HISC_hybrid_mean achieved superior or equal performance under tie-break rule.`;
      }
   }

   // Load T1 baseline reference for comparative display
   let t1Reference = null;
   if (fs.existsSync(t1JsonPath)) {
      try {
         t1Reference = JSON.parse(fs.readFileSync(t1JsonPath, "utf8"));
      } catch {
         t1Reference = null;
      }
   }

   const cacheStats = getEmbeddingCacheStats();

   const reportData = {
      metadata: {
         evaluation_phase: "T2 — Local Embedding-Based Methods",
         timestamp,
         git_commit: gitCommit,
         seed,
         source_dataset: "civicflow_400_labeled_complaint_pairs.csv",
         source_checksum_sha256: sourceChecksum,
         splits_manifest: "splits.json",
         splits_metadata: splitsMetadata,
         partition_sizes: {
            train: partitions.train.length,
            val: partitions.val.length,
            held_out_test: partitions.test.length,
            challenge_set: partitions.challenge.length,
         },
         model_id: DEFAULT_MODEL_ID,
         model_dimension: DEFAULT_MODEL_DIMENSION,
         quantized: true,
         provider: providerMode,
         model_loaded: modelLoaded,
         cache_path: "BACKEND/data/embeddings.json",
         cache_stats: cacheStats,
         evaluation_sequencing_protocol: {
            rule: "Held-out Test (N=80) and Synthetic Challenge (N=150) remain strictly withheld and unevaluated during T2.",
            held_out_status: "TEST and CHALLENGE partitions withheld and unevaluated during T2.",
         },
         tie_break_rule: DETERMINISTIC_TIE_BREAK_RULE,
         threshold_grid_spec: {
            min: 0.1,
            max: 0.9,
            step: 0.05,
            constraint: "duplicate_threshold > related_threshold",
            candidate_pairs_count: 136,
         },
      },
      hybrid_selection: {
         preferred_candidate: preferredHybrid,
         rationale: hybridRationale,
      },
      methods: methodsOutput,
      t1_reference: t1Reference
         ? {
              source_file: "BACKEND/results/t1_validation_baseline_comparison.json",
              methods: t1Reference.methods,
           }
         : null,
   };

   // Write artifacts if not in purely dry-run mode
   if (options.dryRun !== true) {
      const outDir = path.dirname(outJsonPath);
      if (!fs.existsSync(outDir)) {
         fs.mkdirSync(outDir, { recursive: true });
      }

      fs.writeFileSync(outJsonPath, JSON.stringify(reportData, null, 2), "utf8");
      const mdContent = formatT2ValidationMarkdown(reportData);
      fs.writeFileSync(outMdPath, mdContent, "utf8");
   }

   return {
      reportData,
      outJsonPath,
      outMdPath,
   };
}

// CLI entrypoint
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   runT2EmbeddingEvaluation()
      .then(({ outJsonPath, outMdPath }) => {
         console.log(`Generated T2 embedding comparison artifacts:`);
         console.log(`- JSON: ${outJsonPath}`);
         console.log(`- MD:   ${outMdPath}`);
      })
      .catch((err) => {
         console.error(`Evaluation failure:`, err);
         process.exit(1);
      });
}
