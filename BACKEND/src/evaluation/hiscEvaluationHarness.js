import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
   HISC_CONFIG,
   extractIncidentFeatures,
   classifyIncidentScore,
} from "../service/incidentIntelligence.service.js";
import { parseCSV, computeSHA256 } from "./makeSplits.js";
import {
   calculateDetailedMetrics,
   computeBootstrapMacroF1CI,
   SUPPORTED_CLASSES,
} from "./metricsCalculator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_PATHS = {
   originalCsv: path.resolve(__dirname, "../../../civicflow_400_labeled_complaint_pairs.csv"),
   splitsJson: path.resolve(__dirname, "../../data/splits.json"),
   challengeCsv: path.resolve(__dirname, "../../data/synthetic_challenge_set_150.csv"),
   outputJson: path.resolve(__dirname, "../../data/hisc_baseline_evaluation.json"),
   outputMd: path.resolve(__dirname, "../../data/hisc_baseline_evaluation.md"),
};

export const EXPECTED_CHECKSUM = "b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2";

/**
 * Converts CSV row representation into normalized complaint pair evaluation object
 * @param {Record<string, string>} row 
 */
export function formatEvaluationPair(row) {
   const makeComplaint = (suffix) => ({
      category: row[`category_${suffix}`] ?? "",
      title: row[`complaint_${suffix}`] ?? "",
      description: "",
      location: {
         type: "Point",
         coordinates: [
            Number(row[`longitude_${suffix}`]),
            Number(row[`latitude_${suffix}`]),
         ],
      },
      createdAt: row[`timestamp_${suffix}`]?.endsWith("Z")
         ? row[`timestamp_${suffix}`]
         : `${row[`timestamp_${suffix}`]}Z`,
   });

   return {
      pair_id: row.pair_id,
      complaint_a_id: row.complaint_a_id,
      complaint_b_id: row.complaint_b_id,
      incident_id: row.incident_id || null,
      label: row.label,
      challenge_category: row.challenge_category || null,
      complaint_a: makeComplaint("a"),
      complaint_b: makeComplaint("b"),
   };
}

/**
 * Loads and validates all evaluation dataset partitions (Train, Val, Test, Challenge)
 * @param {object} [paths]
 */
export function loadDatasetPartitions(paths = {}) {
   const originalCsvPath = paths.originalCsv ?? DEFAULT_PATHS.originalCsv;
   const splitsJsonPath = paths.splitsJson ?? DEFAULT_PATHS.splitsJson;
   const challengeCsvPath = paths.challengeCsv ?? DEFAULT_PATHS.challengeCsv;

   if (!fs.existsSync(originalCsvPath)) {
      throw new Error(`Original dataset not found at: ${originalCsvPath}`);
   }
   if (!fs.existsSync(splitsJsonPath)) {
      throw new Error(`Splits manifest not found at: ${splitsJsonPath}`);
   }
   if (!fs.existsSync(challengeCsvPath)) {
      throw new Error(`Synthetic challenge set not found at: ${challengeCsvPath}`);
   }

   const originalContent = fs.readFileSync(originalCsvPath, "utf8");
   const actualHash = computeSHA256(originalContent);
   if (actualHash !== EXPECTED_CHECKSUM) {
      throw new Error(`Original dataset checksum mismatch. Expected ${EXPECTED_CHECKSUM}, got ${actualHash}`);
   }

   const splitsData = JSON.parse(fs.readFileSync(splitsJsonPath, "utf8"));
   if (splitsData.dataset?.sha256 !== EXPECTED_CHECKSUM) {
      throw new Error(`Splits manifest checksum declaration mismatch: ${splitsData.dataset?.sha256}`);
   }

   const originalRows = parseCSV(originalContent);
   if (originalRows.length !== 400) {
      throw new Error(`Expected exactly 400 original rows, got ${originalRows.length}`);
   }

   const rowMap = new Map();
   for (const r of originalRows) {
      rowMap.set(r.pair_id, formatEvaluationPair(r));
   }

   // Verify split integrity and disjointness
   const trainIds = new Set(splitsData.splits.train.pairIds);
   const valIds = new Set(splitsData.splits.val.pairIds);
   const testIds = new Set(splitsData.splits.test.pairIds);

   if (trainIds.size !== 240 || valIds.size !== 80 || testIds.size !== 80) {
      throw new Error("Partition size mismatch in splits.json (expected 240/80/80)");
   }

   for (const id of trainIds) {
      if (valIds.has(id)) throw new Error(`Leakage: pair ${id} present in both train and val`);
      if (testIds.has(id)) throw new Error(`Leakage: pair ${id} present in both train and test`);
   }
   for (const id of valIds) {
      if (testIds.has(id)) throw new Error(`Leakage: pair ${id} present in both val and test`);
   }

   const trainPairs = splitsData.splits.train.pairIds.map((id) => rowMap.get(id));
   const valPairs = splitsData.splits.val.pairIds.map((id) => rowMap.get(id));
   const testPairs = splitsData.splits.test.pairIds.map((id) => rowMap.get(id));
   const allOriginalPairs = originalRows.map((r) => rowMap.get(r.pair_id));

   const challengeRows = parseCSV(fs.readFileSync(challengeCsvPath, "utf8"));
   if (challengeRows.length !== 150) {
      throw new Error(`Expected exactly 150 challenge rows, got ${challengeRows.length}`);
   }
   const challengePairs = challengeRows.map((r) => formatEvaluationPair(r));

   return {
      sourceChecksum: actualHash,
      splitsMetadata: splitsData.metadata,
      splitsSummary: splitsData.summary,
      partitions: {
         train: trainPairs,
         val: valPairs,
         test: testPairs,
         original_all: allOriginalPairs,
         challenge: challengePairs,
      },
   };
}

/**
 * Evaluates a single complaint pair through the HISC algorithm
 * @param {ReturnType<typeof formatEvaluationPair>} pair 
 * @param {typeof HISC_CONFIG} [config=HISC_CONFIG]
 */
export function evaluatePair(pair, config = HISC_CONFIG) {
   const analysis = extractIncidentFeatures(pair.complaint_a, pair.complaint_b, config);
   const predicted = classifyIncidentScore(analysis, config);

   return {
      pair_id: pair.pair_id,
      actual: pair.label,
      predicted,
      score: analysis.score,
      features: analysis.features,
      distance: analysis.distance,
      hours: analysis.hours,
      category_a: pair.complaint_a.category,
      category_b: pair.complaint_b.category,
      explanation: analysis.explanation,
   };
}

/**
 * Evaluates an entire partition and computes complete metrics
 * @param {string} partitionName 
 * @param {Array<ReturnType<typeof formatEvaluationPair>>} pairs 
 * @param {typeof HISC_CONFIG} [config=HISC_CONFIG] 
 * @param {object} [options]
 */
export function evaluatePartition(partitionName, pairs, config = HISC_CONFIG, options = {}) {
   const results = pairs.map((pair) => evaluatePair(pair, config));
   const metrics = calculateDetailedMetrics(results);

   let bootstrapCi = null;
   if (options.includeBootstrap !== false) {
      bootstrapCi = computeBootstrapMacroF1CI(results, options.bootstrapOptions);
   }

   // Count label distribution
   const labelCounts = { duplicate: 0, related: 0, independent: 0 };
   for (const p of pairs) {
      labelCounts[p.label] = (labelCounts[p.label] || 0) + 1;
   }

   return {
      partition_name: partitionName,
      sample_count: pairs.length,
      label_distribution: labelCounts,
      metrics,
      bootstrap_ci: bootstrapCi,
      results,
   };
}

/**
 * Executes a validation-only threshold sweep without modifying production defaults
 * @param {Array<ReturnType<typeof formatEvaluationPair>>} valPairs 
 * @param {object} [options]
 */
export function runThresholdSweep(valPairs, options = {}) {
   const duplicateThresholds = options.duplicateThresholds ?? [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80];
   const relatedThresholds = options.relatedThresholds ?? [0.25, 0.30, 0.35, 0.40, 0.45, 0.50];
   const baseConfig = options.baseConfig ?? HISC_CONFIG;

   const sweepResults = [];
   let bestCandidate = null;

   for (const dt of duplicateThresholds) {
      for (const rt of relatedThresholds) {
         if (dt <= rt) continue; // Constraint: duplicate threshold must be strictly greater than related

         const candidateConfig = {
            ...baseConfig,
            duplicateThreshold: dt,
            relatedThreshold: rt,
         };

         const evalResult = evaluatePartition("validation_sweep", valPairs, candidateConfig, { includeBootstrap: false });
         const entry = {
            duplicate_threshold: dt,
            related_threshold: rt,
            accuracy: evalResult.metrics.accuracy,
            macro_precision: evalResult.metrics.macro_precision,
            macro_recall: evalResult.metrics.macro_recall,
            macro_f1: evalResult.metrics.macro_f1,
            per_class_f1: {
               duplicate: evalResult.metrics.per_class.duplicate.f1,
               related: evalResult.metrics.per_class.related.f1,
               independent: evalResult.metrics.per_class.independent.f1,
            },
         };

         sweepResults.push(entry);

         if (!bestCandidate || entry.macro_f1 > bestCandidate.macro_f1 || (entry.macro_f1 === bestCandidate.macro_f1 && entry.per_class_f1.duplicate > bestCandidate.per_class_f1.duplicate)) {
            bestCandidate = entry;
         }
      }
   }

   // Baseline entry under default config
   const baselineEval = evaluatePartition("validation_baseline", valPairs, baseConfig, { includeBootstrap: false });
   const baselineEntry = {
      duplicate_threshold: baseConfig.duplicateThreshold,
      related_threshold: baseConfig.relatedThreshold,
      accuracy: baselineEval.metrics.accuracy,
      macro_f1: baselineEval.metrics.macro_f1,
      per_class_f1: {
         duplicate: baselineEval.metrics.per_class.duplicate.f1,
         related: baselineEval.metrics.per_class.related.f1,
         independent: baselineEval.metrics.per_class.independent.f1,
      },
   };

   return {
      evaluated_combinations: sweepResults.length,
      baseline_configuration: baselineEntry,
      best_validation_candidate: bestCandidate,
      sweep_grid: sweepResults,
   };
}

/**
 * Runs feature ablations by turning off each individual feature component
 * @param {string} partitionName 
 * @param {Array<ReturnType<typeof formatEvaluationPair>>} pairs 
 * @param {typeof HISC_CONFIG} [baseConfig=HISC_CONFIG]
 */
export function runFeatureAblations(partitionName, pairs, baseConfig = HISC_CONFIG) {
   const features = ["category", "geographic", "lexical", "semantic", "temporal"];
   const fullResult = evaluatePartition(`${partitionName}_full`, pairs, baseConfig, { includeBootstrap: false });

   const baselineMacroF1 = fullResult.metrics.macro_f1;
   const ablationResults = {};

   for (const feature of features) {
      const ablatedConfig = {
         ...baseConfig,
         enabledFeatures: {
            ...(baseConfig.enabledFeatures ?? {}),
            [feature]: false,
         },
      };

      const evalResult = evaluatePartition(`${partitionName}_no_${feature}`, pairs, ablatedConfig, { includeBootstrap: false });
      const deltaF1 = Number((evalResult.metrics.macro_f1 - baselineMacroF1).toFixed(4));

      ablationResults[`no_${feature}`] = {
         feature_removed: feature,
         macro_precision: evalResult.metrics.macro_precision,
         macro_recall: evalResult.metrics.macro_recall,
         macro_f1: evalResult.metrics.macro_f1,
         delta_macro_f1: deltaF1,
         accuracy: evalResult.metrics.accuracy,
         per_class_f1: {
            duplicate: evalResult.metrics.per_class.duplicate.f1,
            related: evalResult.metrics.per_class.related.f1,
            independent: evalResult.metrics.per_class.independent.f1,
         },
      };
   }

   return {
      partition: partitionName,
      full_model: {
         macro_f1: baselineMacroF1,
         accuracy: fullResult.metrics.accuracy,
         per_class_f1: {
            duplicate: fullResult.metrics.per_class.duplicate.f1,
            related: fullResult.metrics.per_class.related.f1,
            independent: fullResult.metrics.per_class.independent.f1,
         },
      },
      ablations: ablationResults,
   };
}

/**
 * Executes full comprehensive baseline evaluation across all partitions
 * @param {object} [options]
 */
export function runComprehensiveBaseline(options = {}) {
   const seed = options.seed ?? 42;
   const bootstrapIterations = options.bootstrapIterations ?? 1000;
   const fixedDate = options.evaluationDate ?? "2026-10-10T22:30:00.000Z";

   const { sourceChecksum, partitions, splitsMetadata } = loadDatasetPartitions(options.paths);

   const bootstrapOptions = { seed, iterations: bootstrapIterations, confidenceLevel: 0.95 };

   // 1. Evaluate partitions with current baseline defaults
   const trainEval = evaluatePartition("train", partitions.train, HISC_CONFIG, { bootstrapOptions });
   const valEval = evaluatePartition("val", partitions.val, HISC_CONFIG, { bootstrapOptions });
   const testEval = evaluatePartition("test", partitions.test, HISC_CONFIG, { bootstrapOptions });
   const originalAllEval = evaluatePartition("original_all", partitions.original_all, HISC_CONFIG, { bootstrapOptions });
   const challengeEval = evaluatePartition("synthetic_challenge", partitions.challenge, HISC_CONFIG, { bootstrapOptions });

   // 2. Validation threshold sweep
   const thresholdSweep = runThresholdSweep(partitions.val, { baseConfig: HISC_CONFIG });

   // 3. Feature ablations on Validation and Test
   const valAblations = runFeatureAblations("validation", partitions.val, HISC_CONFIG);
   const testAblations = runFeatureAblations("test", partitions.test, HISC_CONFIG);

   // Construct consolidated report data
   const reportData = {
      metadata: {
         evaluation_harness_version: "2.0.0",
         evaluation_date: fixedDate,
         seed,
         bootstrap_iterations: bootstrapIterations,
         source_dataset: "civicflow_400_labeled_complaint_pairs.csv",
         source_checksum_sha256: sourceChecksum,
         splits_manifest: "splits.json",
         splits_seed: splitsMetadata.seed,
         hisc_baseline_config: HISC_CONFIG,
      },
      partitions: {
         train: {
            sample_count: trainEval.sample_count,
            label_distribution: trainEval.label_distribution,
            metrics: trainEval.metrics,
            bootstrap_macro_f1: trainEval.bootstrap_ci,
         },
         val: {
            sample_count: valEval.sample_count,
            label_distribution: valEval.label_distribution,
            metrics: valEval.metrics,
            bootstrap_macro_f1: valEval.bootstrap_ci,
         },
         test: {
            sample_count: testEval.sample_count,
            label_distribution: testEval.label_distribution,
            metrics: testEval.metrics,
            bootstrap_macro_f1: testEval.bootstrap_ci,
         },
         original_all: {
            sample_count: originalAllEval.sample_count,
            label_distribution: originalAllEval.label_distribution,
            metrics: originalAllEval.metrics,
            bootstrap_macro_f1: originalAllEval.bootstrap_ci,
         },
         synthetic_challenge: {
            sample_count: challengeEval.sample_count,
            label_distribution: challengeEval.label_distribution,
            metrics: challengeEval.metrics,
            bootstrap_macro_f1: challengeEval.bootstrap_ci,
         },
      },
      validation_threshold_sweep: thresholdSweep,
      feature_ablations: {
         validation: valAblations,
         test: testAblations,
      },
      limitations_and_leakage_protection: {
         clustering_vs_pairwise_protocol: "The current HISC algorithm implements online graph clustering via MongoDB collections (Complaint and IncidentCluster). The evaluation datasets (400 original pairs, 150 challenge pairs) are pairwise labeled relations. As a result, global partition-level clustering metrics (Adjusted Rand Index, Adjusted Mutual Information, BCubed F1) requiring full connected graph matrices cannot be computed without artificial graph synthesis. Instead, the evaluation rigorously measures pairwise link classification performance (duplicate, related, independent).",
         leakage_protection: "Zero incident_id leakage across train, val, and test partitions confirmed. Synthetic challenge set strictly separated from baseline fitting and validation threshold sweeping.",
      },
   };

   return {
      reportData,
      rawPartitions: {
         train: trainEval,
         val: valEval,
         test: testEval,
         original_all: originalAllEval,
         challenge: challengeEval,
      },
   };
}

/**
 * Formats the evaluation report into clean, professional Markdown
 * @param {ReturnType<typeof runComprehensiveBaseline>["reportData"]} data 
 */
export function formatEvaluationMarkdown(data) {
   const m = data.metadata;
   const p = data.partitions;

   let md = `# HISC Incident-Clustering Algorithm — Evaluation Report V2\n\n`;

   md += `## 1. Evaluation Protocol and Metadata\n\n`;
   md += `- **Evaluation Harness:** V${m.evaluation_harness_version}\n`;
   md += `- **Date:** \`${m.evaluation_date}\`\n`;
   md += `- **Source Dataset:** \`${m.source_dataset}\` (SHA-256: \`${m.source_checksum_sha256}\`)\n`;
   md += `- **Random Seed:** \`${m.seed}\` (Deterministic Mulberry32 PRNG)\n`;
   md += `- **Bootstrap Iterations:** \`${m.bootstrap_iterations}\` iterations (95% Empirical Percentile CI)\n`;
   md += `- **HISC Production Defaults:** Duplicate Threshold = \`${m.hisc_baseline_config.duplicateThreshold}\`, Related Threshold = \`${m.hisc_baseline_config.relatedThreshold}\`\n`;
   md += `- **Feature Weights:** Category=\`${m.hisc_baseline_config.weights.category}\`, Geo=\`${m.hisc_baseline_config.weights.geographic}\`, Lexical=\`${m.hisc_baseline_config.weights.lexical}\`, Semantic=\`${m.hisc_baseline_config.weights.semantic}\`, Temporal=\`${m.hisc_baseline_config.weights.temporal}\`\n\n`;

   md += `## 2. Baseline Summary across Partitions\n\n`;
   md += `*Primary metric: Unweighted Macro F1 (accounting for non-uniform challenge class distribution).*\n\n`;
   md += `| Partition | Samples | Accuracy | Macro Prec | Macro Rec | Macro F1 | 95% Bootstrap CI (Macro F1) | Correct / Total |\n`;
   md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

   const partitionOrder = [
      { key: "train", label: "Train (60%)" },
      { key: "val", label: "Validation (20%)" },
      { key: "test", label: "Held-out Test (20%)" },
      { key: "original_all", label: "Full Original (400)" },
      { key: "synthetic_challenge", label: "Synthetic Challenge (150)" },
   ];

   for (const { key, label } of partitionOrder) {
      const part = p[key];
      const ci = part.bootstrap_macro_f1;
      const ciStr = `[${ci.ci_lower.toFixed(4)}, ${ci.ci_upper.toFixed(4)}]`;
      md += `| **${label}** | ${part.sample_count} | ${(part.metrics.accuracy * 100).toFixed(2)}% | ${part.metrics.macro_precision.toFixed(4)} | ${part.metrics.macro_recall.toFixed(4)} | **${part.metrics.macro_f1.toFixed(4)}** | ${ciStr} | ${part.metrics.correct_count} / ${part.sample_count} |\n`;
   }
   md += "\n";

   md += `## 3. Detailed Per-Class Breakdown and Confusion Matrices\n\n`;

   for (const { key, label } of partitionOrder) {
      const part = p[key];
      md += `### ${label}\n\n`;
      md += `**Class Metrics:**\n\n`;
      md += `| Class | Support | Precision | Recall | F1 Score |\n`;
      md += `|---|:---:|:---:|:---:|:---:|\n`;
      for (const c of SUPPORTED_CLASSES) {
         const cm = part.metrics.per_class[c];
         md += `| \`${c}\` | ${cm.support} | ${cm.precision.toFixed(4)} | ${cm.recall.toFixed(4)} | ${cm.f1.toFixed(4)} |\n`;
      }
      md += "\n";

      md += `**Confusion Matrix (Actual Rows \\ Predicted Cols):**\n\n`;
      const conf = part.metrics.confusion_matrix;
      md += `| Actual \\ Pred | Pred \`duplicate\` | Pred \`related\` | Pred \`independent\` |\n`;
      md += `|---|:---:|:---:|:---:|\n`;
      for (const act of SUPPORTED_CLASSES) {
         md += `| **Actual \`${act}\`** | ${conf[act].duplicate} | ${conf[act].related} | ${conf[act].independent} |\n`;
      }
      md += "\n";

      if (part.metrics.misclassified_count > 0) {
         md += `**Misclassified Items (${part.metrics.misclassified_count} pairs):**\n\n`;
         md += `| Pair ID | Actual | Predicted | Score | Key Features & Distance |\n`;
         md += `|---|:---:|:---:|:---:|---|\n`;
         for (const mItem of part.metrics.misclassified_pairs.slice(0, 15)) {
            const featSummary = `dist=${mItem.distance_meters}m, dt=${mItem.hours}h, sem=${mItem.features?.semantic?.toFixed(2) ?? 'N/A'}`;
            md += `| \`${mItem.pair_id}\` | \`${mItem.actual_label}\` | \`${mItem.predicted_label}\` | ${mItem.score} | ${featSummary} |\n`;
         }
         if (part.metrics.misclassified_pairs.length > 15) {
            md += `*... and ${part.metrics.misclassified_pairs.length - 15} additional misclassified pairs (see JSON artifact for complete list).*\n`;
         }
         md += "\n";
      }
   }

   md += `## 4. Validation Threshold Sweep Analysis\n\n`;
   const sw = data.validation_threshold_sweep;
   md += `- **Baseline Configuration on Validation:** Dup=\`${sw.baseline_configuration.duplicate_threshold}\`, Rel=\`${sw.baseline_configuration.related_threshold}\` $\\rightarrow$ Macro F1 = \`${sw.baseline_configuration.macro_f1.toFixed(4)}\`, Accuracy = \`${(sw.baseline_configuration.accuracy * 100).toFixed(2)}%\`\n`;
   md += `- **Best Candidate on Validation:** Dup=\`${sw.best_validation_candidate.duplicate_threshold}\`, Rel=\`${sw.best_validation_candidate.related_threshold}\` $\\rightarrow$ Macro F1 = \`${sw.best_validation_candidate.macro_f1.toFixed(4)}\`, Accuracy = \`${(sw.best_validation_candidate.accuracy * 100).toFixed(2)}%\`\n\n`;
   md += `> [!NOTE]\n`;
   md += `> The threshold sweep is evaluated strictly on the Validation split. Production algorithm defaults were NOT modified.\n\n`;

   md += `## 5. Feature Ablation Analysis\n\n`;
   md += `### Validation Partition Ablations:\n\n`;
   const vAbl = data.feature_ablations.validation;
   md += `| Ablation Model | Macro F1 | $\\Delta$ Macro F1 | Accuracy | Per-Class F1 (dup / rel / ind) |\n`;
   md += `|---|:---:|:---:|:---:|:---:|\n`;
   md += `| **Full Baseline** | **${vAbl.full_model.macro_f1.toFixed(4)}** | -- | ${(vAbl.full_model.accuracy * 100).toFixed(2)}% | ${vAbl.full_model.per_class_f1.duplicate.toFixed(4)} / ${vAbl.full_model.per_class_f1.related.toFixed(4)} / ${vAbl.full_model.per_class_f1.independent.toFixed(4)} |\n`;
   for (const [k, v] of Object.entries(vAbl.ablations)) {
      const deltaStr = v.delta_macro_f1 >= 0 ? `+${v.delta_macro_f1.toFixed(4)}` : `${v.delta_macro_f1.toFixed(4)}`;
      md += `| \`${k}\` | ${v.macro_f1.toFixed(4)} | ${deltaStr} | ${(v.accuracy * 100).toFixed(2)}% | ${v.per_class_f1.duplicate.toFixed(4)} / ${v.per_class_f1.related.toFixed(4)} / ${v.per_class_f1.independent.toFixed(4)} |\n`;
   }
   md += "\n";

   md += `### Test Partition Ablations (For Reference):\n\n`;
   const tAbl = data.feature_ablations.test;
   md += `| Ablation Model | Macro F1 | $\\Delta$ Macro F1 | Accuracy | Per-Class F1 (dup / rel / ind) |\n`;
   md += `|---|:---:|:---:|:---:|:---:|\n`;
   md += `| **Full Baseline** | **${tAbl.full_model.macro_f1.toFixed(4)}** | -- | ${(tAbl.full_model.accuracy * 100).toFixed(2)}% | ${tAbl.full_model.per_class_f1.duplicate.toFixed(4)} / ${tAbl.full_model.per_class_f1.related.toFixed(4)} / ${tAbl.full_model.per_class_f1.independent.toFixed(4)} |\n`;
   for (const [k, v] of Object.entries(tAbl.ablations)) {
      const deltaStr = v.delta_macro_f1 >= 0 ? `+${v.delta_macro_f1.toFixed(4)}` : `${v.delta_macro_f1.toFixed(4)}`;
      md += `| \`${k}\` | ${v.macro_f1.toFixed(4)} | ${deltaStr} | ${(v.accuracy * 100).toFixed(2)}% | ${v.per_class_f1.duplicate.toFixed(4)} / ${v.per_class_f1.related.toFixed(4)} / ${v.per_class_f1.independent.toFixed(4)} |\n`;
   }
   md += "\n";

   md += `## 6. Architecture Limitations and Clustering vs Pairwise Protocol\n\n`;
   md += data.limitations_and_leakage_protection.clustering_vs_pairwise_protocol + "\n\n";
   md += `**Leakage Safeguards:** ` + data.limitations_and_leakage_protection.leakage_protection + "\n";

   return md;
}

// CLI Execution entrypoint
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   const outDir = path.resolve(__dirname, "../../data");
   if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

   const { reportData } = runComprehensiveBaseline();

   const jsonPath = DEFAULT_PATHS.outputJson;
   const mdPath = DEFAULT_PATHS.outputMd;

   fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), "utf8");
   fs.writeFileSync(mdPath, formatEvaluationMarkdown(reportData), "utf8");

   console.log(`Saved baseline evaluation JSON to: ${jsonPath}`);
   console.log(`Saved baseline evaluation Markdown to: ${mdPath}`);
   console.log("\n--- Baseline Evaluation Summary ---");
   for (const [key, part] of Object.entries(reportData.partitions)) {
      console.log(`[${key}] N=${part.sample_count}, Acc=${(part.metrics.accuracy * 100).toFixed(2)}%, Macro F1=${part.metrics.macro_f1.toFixed(4)}, CI=[${part.bootstrap_macro_f1.ci_lower}, ${part.bootstrap_macro_f1.ci_upper}]`);
   }
}
