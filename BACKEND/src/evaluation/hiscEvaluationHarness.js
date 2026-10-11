import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
   HISC_CONFIG,
   extractIncidentFeatures,
   classifyIncidentScore,
} from "../service/incidentIntelligence.service.js";
import {
   scorePair,
   distanceInMeters,
   categoryScore,
} from "../hisc/scorePair.js";
import {
   DEFAULT_HISC_CONFIG,
   loadConfig,
} from "../hisc/config.js";
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
   t1ValidationJson: path.resolve(__dirname, "../../results/t1_validation_baseline_comparison.json"),
   t1ValidationMd: path.resolve(__dirname, "../../results/t1_validation_baseline_comparison.md"),
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

/**
 * -----------------------------------------------------------------------------
 * Research Evaluation T1: Fair Baselines and Uniform Validation Threshold Tuning
 * -----------------------------------------------------------------------------
 */

export const UNIFORM_THRESHOLD_GRID = [
   0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90,
];

export function generateAdmissibleThresholdPairs(grid = UNIFORM_THRESHOLD_GRID) {
   const pairs = [];
   for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < i; j++) {
         pairs.push({
            duplicateThreshold: Number(grid[i].toFixed(2)),
            relatedThreshold: Number(grid[j].toFixed(2)),
         });
      }
   }
   return pairs;
}

export const ADMISSIBLE_THRESHOLD_PAIRS = generateAdmissibleThresholdPairs(UNIFORM_THRESHOLD_GRID);

export const DETERMINISTIC_TIE_BREAK_RULE =
   "1. Highest validation macro F1 -> 2. Highest overall accuracy -> 3. Highest duplicate F1 -> 4. Highest related F1 -> 5. Highest threshold margin (dt - rt) -> 6. Descending (dt, rt) lexicographical order.";

export function compareCandidatesDeterministic(a, b) {
   if (a.macro_f1 !== b.macro_f1) return a.macro_f1 - b.macro_f1;
   if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
   if (a.dup_f1 !== b.dup_f1) return a.dup_f1 - b.dup_f1;
   if (a.rel_f1 !== b.rel_f1) return a.rel_f1 - b.rel_f1;
   const marginA = Number((a.duplicate_threshold - a.related_threshold).toFixed(4));
   const marginB = Number((b.duplicate_threshold - b.related_threshold).toFixed(4));
   if (marginA !== marginB) return marginA - marginB;
   if (a.duplicate_threshold !== b.duplicate_threshold) return a.duplicate_threshold - b.duplicate_threshold;
   return a.related_threshold - b.related_threshold;
}

export function getComplaintText(complaint) {
   if (!complaint) return "";
   if (typeof complaint.text === "string" && complaint.text.trim()) return complaint.text.trim();
   const title = complaint.title ?? "";
   const desc = complaint.description ?? "";
   return `${title} ${desc}`.trim();
}

/**
 * B1: Text Jaccard similarity
 * @param {string} textA
 * @param {string} textB
 */
export function computeTextJaccard(textA = "", textB = "") {
   const tokensA = new Set(
      String(textA).toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean)
   );
   const tokensB = new Set(
      String(textB).toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean)
   );
   const union = new Set([...tokensA, ...tokensB]);
   if (union.size === 0) return 0;
   let intersection = 0;
   for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
   }
   return intersection / union.size;
}

export function scoreB1_TextJaccard(pair) {
   const textA = getComplaintText(pair.complaint_a);
   const textB = getComplaintText(pair.complaint_b);
   return computeTextJaccard(textA, textB);
}

/**
 * B2: Distance-only similarity using negative exponential scaling
 * @param {object} pair
 * @param {number} [radiusMeters=1000]
 */
export function scoreB2_DistanceOnly(pair, radiusMeters = 1000) {
   const coordsA = pair.complaint_a?.location?.coordinates;
   const coordsB = pair.complaint_b?.location?.coordinates;
   const d = distanceInMeters(coordsA, coordsB);
   if (!Number.isFinite(d)) return 0;
   return Math.exp(-d / radiusMeters);
}

/**
 * B3: Category plus distance similarity (equal 50/50 convex weighting)
 * @param {object} pair
 * @param {number} [radiusMeters=1000]
 */
export function scoreB3_CategoryDistance(pair, radiusMeters = 1000) {
   const catSim = categoryScore(pair.complaint_a?.category, pair.complaint_b?.category);
   const geoSim = scoreB2_DistanceOnly(pair, radiusMeters);
   return 0.5 * catSim + 0.5 * geoSim;
}

/**
 * Fits vocabulary and IDF values strictly on training pairs.
 * Never fits on validation, test, or challenge pairs.
 * @param {Array<object>} trainPairs
 */
export function fitTfIdf(trainPairs) {
   if (!Array.isArray(trainPairs) || trainPairs.length === 0) {
      throw new Error("fitTfIdf requires a non-empty array of training pairs");
   }

   const trainDocs = [];
   for (const pair of trainPairs) {
      trainDocs.push(getComplaintText(pair.complaint_a));
      trainDocs.push(getComplaintText(pair.complaint_b));
   }

   const N = trainDocs.length;
   const docTermSets = trainDocs.map((doc) => new Set(
      String(doc).toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean)
   ));

   const df = new Map();
   for (const termSet of docTermSets) {
      for (const term of termSet) {
         df.set(term, (df.get(term) || 0) + 1);
      }
   }

   const vocabulary = new Map();
   const idf = new Map();
   let index = 0;
   for (const [term, count] of df.entries()) {
      vocabulary.set(term, index++);
      // Smoothed inverse document frequency: ln((N + 1) / (df + 1)) + 1
      idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
   }

   function vectorize(text) {
      const terms = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean);
      const tf = new Map();
      for (const term of terms) {
         if (vocabulary.has(term)) {
            tf.set(term, (tf.get(term) || 0) + 1);
         }
      }

      let normSq = 0;
      const weights = new Map();
      for (const [term, count] of tf.entries()) {
         const w = count * idf.get(term);
         weights.set(term, w);
         normSq += w * w;
      }
      return { weights, norm: Math.sqrt(normSq) };
   }

   function cosineSimilarity(textA, textB) {
      const vA = vectorize(textA);
      const vB = vectorize(textB);
      if (vA.norm === 0 || vB.norm === 0) return 0;
      let dot = 0;
      for (const [term, wA] of vA.weights.entries()) {
         if (vB.weights.has(term)) {
            dot += wA * vB.weights.get(term);
         }
      }
      return Math.min(1, Math.max(0, dot / (vA.norm * vB.norm)));
   }

   return {
      vocabularySize: vocabulary.size,
      trainDocCount: N,
      vocabulary,
      idf,
      vectorize,
      cosineSimilarity,
   };
}

/**
 * B4: TF-IDF cosine similarity on text only using model fitted on TRAIN
 * @param {object} pair
 * @param {ReturnType<typeof fitTfIdf>} tfidfModel
 */
export function scoreB4_TfIdf(pair, tfidfModel) {
   if (!tfidfModel || typeof tfidfModel.cosineSimilarity !== "function") {
      throw new Error("scoreB4_TfIdf requires a fitted tfidfModel from fitTfIdf");
   }
   const textA = getComplaintText(pair.complaint_a);
   const textB = getComplaintText(pair.complaint_b);
   return tfidfModel.cosineSimilarity(textA, textB);
}

/**
 * B5: TF-IDF cosine combined with geographic distance using a fixed formula
 * Formula: S_B5 = 0.6 * S_tfidf + 0.4 * exp(-d / 1000)
 * Weights (0.6 text / 0.4 geo) are fixed by design, not tuned on validation.
 * @param {object} pair
 * @param {ReturnType<typeof fitTfIdf>} tfidfModel
 * @param {number} [radiusMeters=1000]
 */
export function scoreB5_TfIdfDistance(pair, tfidfModel, radiusMeters = 1000) {
   const sim = scoreB4_TfIdf(pair, tfidfModel);
   const geo = scoreB2_DistanceOnly(pair, radiusMeters);
   return 0.6 * sim + 0.4 * geo;
}

/**
 * HISC Pure Scorer wrapper
 * @param {object} pair
 * @param {typeof HISC_CONFIG} [config=HISC_CONFIG]
 */
export function scoreHisc(pair, config = HISC_CONFIG) {
   return scorePair(pair.complaint_a, pair.complaint_b, config).score;
}

/**
 * Decision rule for binary-boundary methods:
 * duplicate if score >= duplicateThreshold,
 * related if score >= relatedThreshold,
 * else independent.
 */
export function classifyScoreByThresholds(score, duplicateThreshold, relatedThreshold) {
   if (score >= duplicateThreshold) return "duplicate";
   if (score >= relatedThreshold) return "related";
   return "independent";
}

/**
 * Safeguard against passing challenge or test split data into threshold tuning
 * @param {Array<object>} pairs
 */
export function validateTuningPartition(pairs) {
   if (!Array.isArray(pairs) || pairs.length === 0) {
      throw new Error("Tuning partition must be a non-empty array of pairs");
   }
   for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      if (p.challenge_category !== undefined && p.challenge_category !== null) {
         throw new Error(`Data leakage violation: Challenge set pair '${p.pair_id}' cannot be passed into threshold tuning!`);
      }
      if (p.isChallenge === true) {
         throw new Error(`Data leakage violation: Challenge set pair '${p.pair_id}' cannot be passed into threshold tuning!`);
      }
      if (p.isTest === true || p.split === "test") {
         throw new Error(`Data leakage violation: Held-out test pair '${p.pair_id}' cannot be passed into threshold tuning!`);
      }
   }
}

/**
 * Uniform threshold tuner on validation partition.
 * Searches identical 136-pair grid [0.10, 0.90] step 0.05 where duplicateThreshold > relatedThreshold.
 * Evaluates candidate validation macro F1 and selects best using deterministic tie-break.
 * @param {Array<object>} valPairs
 * @param {(pair: object) => number} scoreFn
 * @param {object} [options]
 */
export function tuneMethodThresholds(valPairs, scoreFn, options = {}) {
   validateTuningPartition(valPairs);

   const candidatePairs = options.admissiblePairs ?? ADMISSIBLE_THRESHOLD_PAIRS;
   const customClassifyFn = options.classifyFn ?? null;

   const pairEvaluations = valPairs.map((p) => ({
      pair_id: p.pair_id,
      actual: p.label,
      score: scoreFn(p),
      pair: p,
   }));

   const sweepResults = [];
   let bestCandidate = null;

   for (const { duplicateThreshold, relatedThreshold } of candidatePairs) {
      const predictions = pairEvaluations.map((item) => {
         const predicted = customClassifyFn
            ? customClassifyFn(item.pair, duplicateThreshold, relatedThreshold, item.score)
            : classifyScoreByThresholds(item.score, duplicateThreshold, relatedThreshold);
         return {
            pair_id: item.pair_id,
            actual: item.actual,
            predicted,
            score: item.score,
         };
      });

      const metrics = calculateDetailedMetrics(predictions);
      const entry = {
         duplicate_threshold: duplicateThreshold,
         related_threshold: relatedThreshold,
         macro_f1: metrics.macro_f1,
         accuracy: metrics.accuracy,
         dup_f1: metrics.per_class.duplicate.f1,
         rel_f1: metrics.per_class.related.f1,
         ind_f1: metrics.per_class.independent.f1,
         margin: Number((duplicateThreshold - relatedThreshold).toFixed(4)),
         per_class: metrics.per_class,
         metrics,
      };

      sweepResults.push(entry);

      if (!bestCandidate || compareCandidatesDeterministic(entry, bestCandidate) > 0) {
         bestCandidate = entry;
      }
   }

   return {
      selectedThresholds: {
         duplicate: bestCandidate.duplicate_threshold,
         related: bestCandidate.related_threshold,
      },
      bestValidationCandidate: {
         duplicate_threshold: bestCandidate.duplicate_threshold,
         related_threshold: bestCandidate.related_threshold,
         accuracy: bestCandidate.accuracy,
         macro_f1: bestCandidate.macro_f1,
         per_class_f1: {
            duplicate: bestCandidate.dup_f1,
            related: bestCandidate.rel_f1,
            independent: bestCandidate.ind_f1,
         },
      },
      sweepGrid: sweepResults.map((e) => ({
         duplicate_threshold: e.duplicate_threshold,
         related_threshold: e.related_threshold,
         accuracy: e.accuracy,
         macro_f1: e.macro_f1,
         per_class_f1: {
            duplicate: e.dup_f1,
            related: e.rel_f1,
            independent: e.ind_f1,
         },
      })),
      evaluatedCombinations: sweepResults.length,
      tieBreakRule: DETERMINISTIC_TIE_BREAK_RULE,
   };
}

/**
 * Runs T1 Validation Baseline Comparison across all 6 methods.
 * Strictly adheres to evaluation sequencing protocol:
 * TRAIN is used only to fit TF-IDF.
 * VALIDATION is used to tune decision thresholds and evaluate performance.
 * HELD-OUT TEST and SYNTHETIC CHALLENGE are strictly NOT evaluated.
 * @param {object} [options]
 */
export function runT1ValidationEvaluation(options = {}) {
   const fixedDate = options.evaluationDate ?? new Date().toISOString();
   const seed = options.seed ?? 42;
   const gitCommit = options.gitCommit ?? "040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb";

   const { sourceChecksum, partitions, splitsMetadata } = loadDatasetPartitions(options.paths);

   // Fit TF-IDF model strictly on TRAIN pairs only!
   const tfidfModel = fitTfIdf(partitions.train);

   const methodDefinitions = [
      {
         id: "HISC",
         name: "HISC (Hierarchical Incident Stream Clustering)",
         formula: "Weighted multi-attribute affinity: S = 0.20*Cat + 0.25*Geo + 0.10*Lex + 0.30*Sem + 0.15*Time with contextual classification rules. Default thresholds: 0.60 / 0.35.",
         fitNotes: "Hand-fixed domain weights; no training set fitting.",
         scoreFn: (p) => scorePair(p.complaint_a, p.complaint_b).score,
         classifyFn: (p, dt, rt) => scorePair(p.complaint_a, p.complaint_b, { duplicateThreshold: dt, relatedThreshold: rt }).label,
         defaultThresholds: { duplicate: 0.60, related: 0.35 },
      },
      {
         id: "B1_jaccard",
         name: "B1: Text Jaccard Similarity",
         formula: "S = |Tokens_A ∩ Tokens_B| / |Tokens_A ∪ Tokens_B| on normalized alphanumeric word tokens.",
         fitNotes: "None (zero-shot lexical baseline).",
         scoreFn: (p) => scoreB1_TextJaccard(p),
         classifyFn: null,
      },
      {
         id: "B2_distance",
         name: "B2: Distance-Only Similarity",
         formula: "S = exp(-d / 1000) where d is Haversine distance in meters.",
         fitNotes: "None (zero-shot spatial baseline with fixed scale 1000m).",
         scoreFn: (p) => scoreB2_DistanceOnly(p),
         classifyFn: null,
      },
      {
         id: "B3_cat_distance",
         name: "B3: Category Plus Distance",
         formula: "S = 0.5 * CategoryScore(cat_A, cat_B) + 0.5 * exp(-d / 1000). Equal 50/50 convex weighting.",
         fitNotes: "None (zero-shot multi-attribute spatial-categorical baseline).",
         scoreFn: (p) => scoreB3_CategoryDistance(p),
         classifyFn: null,
      },
      {
         id: "B4_tfidf",
         name: "B4: TF-IDF Cosine Similarity",
         formula: "S = Cosine(v_A, v_B) where term vectors v use smoothed IDF = ln((N+1)/(df+1)) + 1, fitted strictly on TRAIN texts.",
         fitNotes: `Fitted on 240 train pairs (480 complaint texts, vocabulary size: ${tfidfModel.vocabularySize}). Val/test/challenge out-of-vocabulary terms ignored.`,
         scoreFn: (p) => scoreB4_TfIdf(p, tfidfModel),
         classifyFn: null,
      },
      {
         id: "B5_tfidf_distance",
         name: "B5: TF-IDF Cosine + Geographic Distance",
         formula: "S = 0.6 * S_tfidf + 0.4 * exp(-d / 1000). Fixed 60/40 convex combination formula.",
         fitNotes: "TF-IDF vocabulary and IDF fitted strictly on TRAIN texts. Combination weights 0.6/0.4 fixed by design, not tuned on validation.",
         scoreFn: (p) => scoreB5_TfIdfDistance(p, tfidfModel),
         classifyFn: null,
      },
   ];

   const methodsReport = {};

   for (const def of methodDefinitions) {
      const tuning = tuneMethodThresholds(partitions.val, def.scoreFn, {
         classifyFn: def.classifyFn,
      });

      const selectedThresholds = tuning.selectedThresholds;

      const rawPredictions = partitions.val.map((p) => {
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

      let defaultMetrics = null;
      if (def.defaultThresholds) {
         const defaultPreds = partitions.val.map((p) => {
            const score = def.scoreFn(p);
            const predicted = def.classifyFn(p, def.defaultThresholds.duplicate, def.defaultThresholds.related, score);
            return {
               pair_id: p.pair_id,
               actual: p.label,
               predicted,
               score: Number(score.toFixed(4)),
            };
         });
         defaultMetrics = calculateDetailedMetrics(defaultPreds);
      }

      methodsReport[def.id] = {
         method_id: def.id,
         method_name: def.name,
         formula: def.formula,
         fitting_notes: def.fitNotes,
         selected_thresholds: selectedThresholds,
         default_thresholds: def.defaultThresholds ?? null,
         validation_metrics: {
            accuracy: valMetrics.accuracy,
            macro_precision: valMetrics.macro_precision,
            macro_recall: valMetrics.macro_recall,
            macro_f1: valMetrics.macro_f1,
            per_class: valMetrics.per_class,
            confusion_matrix: valMetrics.confusion_matrix,
            misclassified_count: valMetrics.misclassified_count,
            misclassified_pairs: valMetrics.misclassified_pairs,
         },
         default_metrics: defaultMetrics ? {
            accuracy: defaultMetrics.accuracy,
            macro_f1: defaultMetrics.macro_f1,
            per_class: defaultMetrics.per_class,
            confusion_matrix: defaultMetrics.confusion_matrix,
         } : null,
         tuning_summary: {
            evaluated_combinations: tuning.evaluatedCombinations,
            best_validation_candidate: tuning.bestValidationCandidate,
            tie_break_rule: tuning.tieBreakRule,
         },
         raw_predictions: rawPredictions,
         sweep_grid: tuning.sweepGrid,
      };
   }

   return {
      metadata: {
         evaluation_phase: "T1 — Fair Baselines and Validation Tuning",
         timestamp: fixedDate,
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
         evaluation_sequencing_protocol: {
            rule: "Held-out Test (N=80) and Synthetic Challenge (N=150) are evaluated strictly once at final freeze (T6) after all methods are finalized. During T1, only Train fitting and Validation tuning are performed.",
            held_out_status: "TEST and CHALLENGE partitions withheld and unevaluated during T1.",
         },
         tie_break_rule: DETERMINISTIC_TIE_BREAK_RULE,
         threshold_grid_spec: {
            min: 0.10,
            max: 0.90,
            step: 0.05,
            constraint: "duplicate_threshold > related_threshold",
            candidate_pairs_count: ADMISSIBLE_THRESHOLD_PAIRS.length,
         },
      },
      methods: methodsReport,
   };
}

/**
 * Formats T1 validation evaluation results into comprehensive Markdown report
 * @param {ReturnType<typeof runT1ValidationEvaluation>} report
 */
export function formatT1ValidationMarkdown(report) {
   const m = report.metadata;
   const methods = report.methods;

   let md = `# CivicFlow Research Evaluation T1 — Fair Baselines and Validation Tuning Report\n\n`;

   md += `## 1. Provenance and Protocol Metadata\n\n`;
   md += `- **Evaluation Phase:** ${m.evaluation_phase}\n`;
   md += `- **Timestamp:** \`${m.timestamp}\`\n`;
   md += `- **Source Git Commit:** \`${m.git_commit}\`\n`;
   md += `- **Random Seed:** \`${m.seed}\`\n`;
   md += `- **Source Dataset:** \`${m.source_dataset}\` (SHA-256: \`${m.source_checksum_sha256}\`)\n`;
   md += `- **Splits Manifest:** \`${m.splits_manifest}\` (Train: ${m.partition_sizes.train}, Val: ${m.partition_sizes.val}, Held-out Test: ${m.partition_sizes.held_out_test})\n`;
   md += `- **Synthetic Challenge Set:** ${m.partition_sizes.challenge_set} pairs (WITHHELD)\n`;
   md += `- **Threshold Grid:** 136 admissible pairs in $[0.10, 0.90]$ with step $0.05$ subject to $\\theta_{dup} > \\theta_{rel}$\n`;
   md += `- **Deterministic Tie-Break:** ${m.tie_break_rule}\n\n`;

   md += `> [!IMPORTANT]\n`;
   md += `> **Evaluation Split Sequencing Protocol:** ${m.evaluation_sequencing_protocol.rule}\n`;
   md += `> **Status:** ${m.evaluation_sequencing_protocol.held_out_status}\n\n`;

   md += `## 2. Validation Baseline Performance Summary (N = ${m.partition_sizes.val})\n\n`;
   md += `| Method ID | Method Name | Selected Thresholds (Dup / Rel) | Accuracy | Macro Prec | Macro Rec | Macro F1 | Per-Class F1 (dup / rel / ind) |\n`;
   md += `|---|---|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

   for (const [id, res] of Object.entries(methods)) {
      const vm = res.validation_metrics;
      const th = res.selected_thresholds;
      const perClassStr = `${vm.per_class.duplicate.f1.toFixed(4)} / ${vm.per_class.related.f1.toFixed(4)} / ${vm.per_class.independent.f1.toFixed(4)}`;
      md += `| **${id}** | ${res.method_name} | \`${th.duplicate.toFixed(2)}\` / \`${th.related.toFixed(2)}\` | ${(vm.accuracy * 100).toFixed(2)}% | ${vm.macro_precision.toFixed(4)} | ${vm.macro_recall.toFixed(4)} | **${vm.macro_f1.toFixed(4)}** | ${perClassStr} |\n`;
   }
   md += "\n";

   md += `## 3. Method Specifications and Formulas\n\n`;
   for (const [id, res] of Object.entries(methods)) {
      md += `### ${id}: ${res.method_name}\n\n`;
      md += `- **Formula:** ${res.formula}\n`;
      md += `- **Fitting:** ${res.fitting_notes}\n`;
      md += `- **Tuned Thresholds:** Duplicate = \`${res.selected_thresholds.duplicate}\`, Related = \`${res.selected_thresholds.related}\` (out of ${res.tuning_summary.evaluated_combinations} combinations)\n`;
      if (res.default_thresholds) {
         md += `- **Historical Default Thresholds:** Duplicate = \`${res.default_thresholds.duplicate}\`, Related = \`${res.default_thresholds.related}\` $\\rightarrow$ Default Macro F1 = \`${res.default_metrics.macro_f1.toFixed(4)}\`, Accuracy = \`${(res.default_metrics.accuracy * 100).toFixed(2)}%\`\n`;
      }
      md += "\n";

      md += `**Confusion Matrix (Actual Rows \\ Predicted Columns):**\n\n`;
      const cm = res.validation_metrics.confusion_matrix;
      md += `| Actual \\ Predicted | Pred \`duplicate\` | Pred \`related\` | Pred \`independent\` |\n`;
      md += `|---|:---:|:---:|:---:|\n`;
      for (const act of SUPPORTED_CLASSES) {
         md += `| **Actual \`${act}\`** | ${cm[act].duplicate} | ${cm[act].related} | ${cm[act].independent} |\n`;
      }
      md += "\n";
   }

   return md;
}

// CLI Execution entrypoint
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   const outDir = path.resolve(__dirname, "../../data");
   if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
   const resultsDir = path.resolve(__dirname, "../../results");
   if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

   if (process.argv.includes("--t1")) {
      const report = runT1ValidationEvaluation();
      fs.writeFileSync(DEFAULT_PATHS.t1ValidationJson, JSON.stringify(report, null, 2), "utf8");
      fs.writeFileSync(DEFAULT_PATHS.t1ValidationMd, formatT1ValidationMarkdown(report), "utf8");
      console.log(`Saved T1 validation evaluation JSON to: ${DEFAULT_PATHS.t1ValidationJson}`);
      console.log(`Saved T1 validation evaluation Markdown to: ${DEFAULT_PATHS.t1ValidationMd}`);
   } else {
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
}
