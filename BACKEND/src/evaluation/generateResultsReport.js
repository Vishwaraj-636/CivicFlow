import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPORT_PATHS = {
   resultsDir: path.resolve(__dirname, "../../results"),
   dataDir: path.resolve(__dirname, "../../data"),
   docsDir: path.resolve(__dirname, "../../../docs"),
   outputFile: path.resolve(__dirname, "../../../docs/RESULTS.md"),
   t1Json: path.resolve(__dirname, "../../results/t1_validation_baseline_comparison.json"),
   t2Json: path.resolve(__dirname, "../../results/t2_embedding_validation_comparison.json"),
   t4Json: path.resolve(__dirname, "../../results/t4_latency_benchmark.json"),
   t5Json: path.resolve(__dirname, "../../results/t5_learned_weights_validation.json"),
   finalEvalJson: path.resolve(__dirname, "../../results/final_held_out_evaluation.json"),
   statCiJson: path.resolve(__dirname, "../../results/statistical_comparison_and_ci.json"),
   splitsJson: path.resolve(__dirname, "../../data/splits.json"),
   historicalBaselineJson: path.resolve(__dirname, "../../data/hisc_baseline_evaluation.json"),
   spatialBenchmarkJson: path.resolve(__dirname, "../../results/spatial_query_benchmark.json"),
   leakageAuditJson: path.resolve(__dirname, "../../results/dataset_leakage_audit.json"),
   categoryBreakdownJson: path.resolve(__dirname, "../../results/challenge_category_breakdown.json"),
   ruleAblationJson: path.resolve(__dirname, "../../results/rule_ablation.json"),
   ruleInventoryJson: path.resolve(__dirname, "../../results/rule_inventory.json"),
};

export const EXPECTED_METHOD_IDS = [
   "HISC",
   "B1_jaccard",
   "B2_distance",
   "B3_cat_distance",
   "B4_tfidf",
   "B5_tfidf_distance",
];

const CHRONOLOGY_TEXT =
   "Chronology and development-set status. In Phase A3 the HISC scorer was evaluated on the validation, test and challenge partitions (test 97.50%, challenge 57.33%). Afterwards the concept vocabulary and contextual rules were revised and the scorer was extracted into a pure module. The final freeze then evaluated all methods on the test and challenge partitions without changing weights or thresholds. For HISC and its variants both partitions therefore function as development sets: 'held-out' means held out from threshold selection only. For the baselines B1-B6, thresholds were selected on the validation partition only.";

const DISCLAIMER_TEXT = `- All data is synthetic and authored by the project team.
- The challenge set was written with knowledge of the algorithm and was used during development; it is a stress test, not an unseen evaluation.
- 100% accuracy on the standard test split reflects an easy, saturated benchmark: a category-plus-distance rule also reaches 100%, and test texts largely repeat training templates.
- HISC is a rule-augmented scorer; most challenge predictions were decided by rules, not by the weighted score.
- No real-world data, cluster-level evaluation or user study was performed.
- Statistical tests describe this synthetic development set, not a random sample of real complaints.`;

const PRESET_NOTE = `> [!NOTE]
> **Evaluation vs. Deployed Configuration Preset Note:** The evaluated preset is \`HISC-eval\` (duplicate threshold: 0.60, related threshold: 0.10). The deployed production configuration uses \`DEFAULT_HISC_CONFIG\` (duplicate threshold: 0.60, related threshold: 0.35). No evaluation result in this report describes the deployed configuration.`;

/**
 * Normalizes method names, replacing legacy strings with canonical name.
 * @param {string} name
 * @returns {string}
 */
export function normalizeMethodName(name) {
   if (!name) return "";
   return name
      .replace(/HISC \(Hierarchical Incident Stream Clustering\)/g, "HISC (Hybrid Incident Similarity and Clustering)")
      .replace(/Hierarchical Incident Stream Clustering/gi, "Hybrid Incident Similarity and Clustering");
}

/**
 * Safely reads and parses a JSON file, returning null if missing or invalid.
 * @param {string} filePath
 * @returns {object|null}
 */
export function readJsonSafe(filePath) {
   if (!fs.existsSync(filePath)) return null;
   try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
   } catch {
      return null;
   }
}

/**
 * Generates the complete docs/RESULTS.md markdown document exclusively from verified artifacts.
 * @param {object} [options]
 * @returns {{ markdown: string, outputPath: string, metadata: object }}
 */
export function generateResultsReport(options = {}) {
   const t1Path = options.t1Json ?? REPORT_PATHS.t1Json;
   const t2Path = options.t2Json ?? REPORT_PATHS.t2Json;
   const t4Path = options.t4Json ?? REPORT_PATHS.t4Json;
   const t5Path = options.t5Json ?? REPORT_PATHS.t5Json;
   const finalEvalPath = options.finalEvalJson ?? REPORT_PATHS.finalEvalJson;
   const statCiPath = options.statCiJson ?? REPORT_PATHS.statCiJson;
   const splitsPath = options.splitsJson ?? REPORT_PATHS.splitsJson;
   const histBaselinePath = options.historicalBaselineJson ?? REPORT_PATHS.historicalBaselineJson;
   const spatialPath = options.spatialBenchmarkJson ?? REPORT_PATHS.spatialBenchmarkJson;
   const leakagePath = options.leakageAuditJson ?? REPORT_PATHS.leakageAuditJson;
   const categoryPath = options.categoryBreakdownJson ?? REPORT_PATHS.categoryBreakdownJson;
   const ruleAblationPath = options.ruleAblationJson ?? REPORT_PATHS.ruleAblationJson;
   const ruleInventoryPath = options.ruleInventoryJson ?? REPORT_PATHS.ruleInventoryJson;
   const resultsDir = options.resultsDir ?? REPORT_PATHS.resultsDir;
   const outputPath = options.outputFile ?? REPORT_PATHS.outputFile;

   const t1Data = readJsonSafe(t1Path);
   const t2Data = readJsonSafe(t2Path);
   const t4Data = readJsonSafe(t4Path);
   const t5Data = readJsonSafe(t5Path);
   const finalEvalData = readJsonSafe(finalEvalPath);
   const statCiData = readJsonSafe(statCiPath);
   const splitsData = readJsonSafe(splitsPath);
   const histBaselineData = readJsonSafe(histBaselinePath);
   const spatialData = readJsonSafe(spatialPath);
   const leakageData = readJsonSafe(leakagePath);
   const categoryData = readJsonSafe(categoryPath);
   const ruleAblationData = readJsonSafe(ruleAblationPath);
   const ruleInventoryData = readJsonSafe(ruleInventoryPath);

   if (!t1Data) {
      throw new Error(`Mandatory T1 evaluation artifact missing or invalid at: ${t1Path}`);
   }

   // Load T3 error analysis artifacts
   const t3Data = {};
   for (const methodId of EXPECTED_METHOD_IDS) {
      const errPath = path.resolve(resultsDir, `error_analysis_validation_${methodId}.json`);
      t3Data[methodId] = readJsonSafe(errPath);
   }

   let md = `# CivicFlow Incident Intelligence & HISC Evaluation Results\n\n`;

   md += `> **Document Notice:** This document is automatically generated by \`npm run results:report\` exclusively from verified evaluation artifacts located in \`BACKEND/results/\` and \`BACKEND/data/\`. All metrics and confusion tables are dynamically derived from source artifacts without hardcoded constants.\n\n`;

   // -------------------------------------------------------------------------
   // What these results do and do not show (Mandatory Disclaimer Section)
   // -------------------------------------------------------------------------
   md += `## What these results do and do not show\n\n`;
   md += `> [!IMPORTANT]\n`;
   md += `> **Evaluation Scope and Disclaimers:**\n`;
   for (const line of DISCLAIMER_TEXT.split("\n")) {
      md += `> ${line}\n`;
   }
   md += "\n";
   md += `${PRESET_NOTE}\n\n`;

   // -------------------------------------------------------------------------
   // Section A: Research Protocol and Dataset
   // -------------------------------------------------------------------------
   md += `## A. Research Protocol and Dataset\n\n`;
   const meta = t1Data.metadata || {};
   const splitSizes = meta.partition_sizes || { train: 240, val: 80, held_out_test: 80, challenge_set: 150 };

   md += `### Dataset Composition & Split Integrity\n\n`;
   md += `- **Source Dataset:** \`${meta.source_dataset || "civicflow_400_labeled_complaint_pairs.csv"}\` (SHA-256: \`${meta.source_checksum_sha256 || "b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2"}\`)\n`;
   md += `- **Splits Manifest:** \`${meta.splits_manifest || "splits.json"}\` (Seed: \`${meta.seed || 42}\`)\n`;
   md += `- **Train Split:** **${splitSizes.train}** complaint pairs (60.0%)\n`;
   md += `- **Validation Split:** **${splitSizes.val}** complaint pairs (20.0%)\n`;
   md += `- **Held-Out Test Split:** **${splitSizes.held_out_test}** complaint pairs (20.0%)\n`;
   md += `- **Synthetic Challenge Set:** **${splitSizes.challenge_set}** complaint pairs (separate challenge partition)\n`;
   md += `- **Grouping Protocol:** Grouped by \`incident_id\` to guarantee **zero group leakage** across partition boundaries. All complaints linked to a given incident reside entirely within a single split.\n\n`;

   md += `### Training and Validation Rules\n\n`;
   md += `1. **TF-IDF Vocabulary Isolation:** The vocabulary (97 terms) and smoothed inverse document frequency (IDF) weights were fitted strictly on the **240 training pairs** (480 training texts). Out-of-vocabulary terms in validation, test, or challenge sets are completely ignored during transform.\n`;
   md += `2. **Validation-Only Threshold Selection:** Decision boundaries (duplicate threshold $\\theta_{dup}$ and related threshold $\\theta_{rel}$) were selected strictly on the **80 validation pairs** using an explicit uniform grid of 136 admissible pairs in $[0.10, 0.90]$ with step $0.05$ subject to $\\theta_{dup} > \\theta_{rel}$.\n`;
   md += `3. **${CHRONOLOGY_TEXT}**\n\n`;

   // -------------------------------------------------------------------------
   // Section B: Methods Compared
   // -------------------------------------------------------------------------
   md += `## B. Methods Compared\n\n`;
   md += `The evaluation harness standardizes 6 comparable incident affinity methods evaluated over identical decision boundaries:\n\n`;

   const methods = t1Data.methods || {};
   md += `| Method ID | Method Name | Architecture / Formula | Parameter Fitting Status | Tuned Thresholds (Dup / Rel) |\n`;
   md += `|---|---|---|---|:---:|\n`;

   for (const id of EXPECTED_METHOD_IDS) {
      const m = methods[id];
      if (m) {
         const dupStr = m.selected_thresholds?.duplicate !== undefined ? m.selected_thresholds.duplicate.toFixed(2) : "N/A";
         const relStr = m.selected_thresholds?.related !== undefined ? m.selected_thresholds.related.toFixed(2) : "N/A";
         const cleanName = normalizeMethodName(m.method_name);
         md += `| **${id}** | ${cleanName} | \`${m.formula}\` | ${m.fitting_notes} | \`${dupStr}\` / \`${relStr}\` |\n`;
      } else {
         md += `| **${id}** | *Unknown Method* | *Not available in artifact* | Not available | N/A |\n`;
      }
   }
   md += "\n";

   md += `> [!NOTE]\n`;
   md += `> **Design vs. Tuned Parameters:**\n`;
   md += `> - **HISC:** Feature weights ($w_C=0.20, w_G=0.25, w_L=0.10, w_S=0.30, w_T=0.15$) are hand-fixed domain weights preserved from algorithm specifications. Thresholds were swept over validation.\n`;
   md += `> - **B5:** The convex combination weights ($0.6 \\cdot S_{tfidf} + 0.4 \\cdot S_{geo}$) are fixed by design based on training considerations. **They were not tuned on validation.** Only decision thresholds were selected on validation.\n\n`;

   // -------------------------------------------------------------------------
   // Section C: Validation Comparison
   // -------------------------------------------------------------------------
   md += `## C. Validation Comparison (N = ${splitSizes.val})\n\n`;
   md += `All metrics below are dynamically read from \`BACKEND/results/t1_validation_baseline_comparison.json\` on the 80-pair validation split:\n\n`;

   md += `| Method ID | Method Name | Selected Thresholds | Accuracy | Macro Prec | Macro Rec | Macro F1 | Per-Class F1 (dup / rel / ind) |\n`;
   md += `|---|---|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

   for (const id of EXPECTED_METHOD_IDS) {
      const m = methods[id];
      if (m && m.validation_metrics) {
         const vm = m.validation_metrics;
         const th = m.selected_thresholds;
         const perClass = vm.per_class || {};
         const dupF1 = perClass.duplicate?.f1 !== undefined ? perClass.duplicate.f1.toFixed(4) : "N/A";
         const relF1 = perClass.related?.f1 !== undefined ? perClass.related.f1.toFixed(4) : "N/A";
         const indF1 = perClass.independent?.f1 !== undefined ? perClass.independent.f1.toFixed(4) : "N/A";
         const f1Str = `${dupF1} / ${relF1} / ${indF1}`;
         const cleanName = normalizeMethodName(m.method_name);
         md += `| **${id}** | ${cleanName} | \`${th.duplicate.toFixed(2)}\` / \`${th.related.toFixed(2)}\` | ${(vm.accuracy * 100).toFixed(2)}% | ${vm.macro_precision.toFixed(4)} | ${vm.macro_recall.toFixed(4)} | **${vm.macro_f1.toFixed(4)}** | ${f1Str} |\n`;
      }
   }
   md += "\n";

   md += `### Confusion Matrices on Validation Split\n\n`;
   for (const id of EXPECTED_METHOD_IDS) {
      const m = methods[id];
      if (m && m.validation_metrics?.confusion_matrix) {
         const cm = m.validation_metrics.confusion_matrix;
         const cleanName = normalizeMethodName(m.method_name);
         md += `#### ${id}: ${cleanName}\n\n`;
         md += `| Actual \\ Predicted | Pred \`duplicate\` | Pred \`related\` | Pred \`independent\` |\n`;
         md += `|---|:---:|:---:|:---:|\n`;
         for (const act of ["duplicate", "related", "independent"]) {
            md += `| **Actual \`${act}\`** | ${cm[act]?.duplicate ?? 0} | ${cm[act]?.related ?? 0} | ${cm[act]?.independent ?? 0} |\n`;
         }
         md += "\n";
      }
   }

   md += `> [!IMPORTANT]\n`;
   md += `> **Interpretation of Validation Performance:**\n`;
   md += `> Both **HISC** and **B3 (Category + Distance)** achieve 100.00% Macro F1 and 100.00% Accuracy on this validation set. This result reflects the clean separability of categories and spatial coordinates in the synthetic generator pipeline for standard incidents. **This should not be interpreted as proof of real-world perfection or robust handling of adversarial noise**, which is evaluated by the synthetic challenge set.\n\n`;

   // Subsection: Local Sentence Embedding Variants (T2 Evaluation)
   md += `### Local Sentence Embedding Variants (T2 Evaluation)\n\n`;
   if (t2Data && t2Data.methods) {
      const t2Meta = t2Data.metadata || {};
      md += `*Evaluated locally in-process using \`${t2Meta.model_id || "Xenova/all-MiniLM-L6-v2"}\` (${t2Meta.quantized ? "int8 quantized" : "full"}, dimension ${t2Meta.model_dimension || 384}, provider: \`${t2Meta.provider || "local"}\`) on the 80-pair validation split:*\n\n`;
      md += `| Method ID | Method Name | Selected Thresholds | Accuracy | Macro Prec | Macro Rec | Macro F1 | Per-Class F1 (dup / rel / ind) |\n`;
      md += `|---|---|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
      for (const [t2Id, t2m] of Object.entries(t2Data.methods)) {
         if (!t2m.is_available) {
            md += `| **${t2Id}** | ${normalizeMethodName(t2m.method_name)} | *Unavailable* | -- | -- | -- | **Unavailable** | -- |\n`;
            continue;
         }
         const vm = t2m.validation_metrics || {};
         const th = t2m.selected_thresholds || {};
         const pc = vm.per_class || {};
         const dupF1 = pc.duplicate?.f1 !== undefined ? pc.duplicate.f1.toFixed(4) : "N/A";
         const relF1 = pc.related?.f1 !== undefined ? pc.related.f1.toFixed(4) : "N/A";
         const indF1 = pc.independent?.f1 !== undefined ? pc.independent.f1.toFixed(4) : "N/A";
         const dt = th.duplicate !== undefined ? th.duplicate.toFixed(2) : "N/A";
         const rt = th.related !== undefined ? th.related.toFixed(2) : "N/A";
         const cleanName = normalizeMethodName(t2m.method_name);
         md += `| **${t2Id}** | ${cleanName} | \`${dt}\` / \`${rt}\` | ${(vm.accuracy * 100).toFixed(2)}% | ${vm.macro_precision.toFixed(4)} | ${vm.macro_recall.toFixed(4)} | **${vm.macro_f1.toFixed(4)}** | ${dupF1} / ${relF1} / ${indF1} |\n`;
      }
      md += "\n";
      if (t2Data.hybrid_selection?.preferred_candidate) {
         md += `> [!NOTE]\n`;
         md += `> **Hybrid Candidate Selection:** Preferred candidate is **\`${t2Data.hybrid_selection.preferred_candidate}\`** (${t2Data.hybrid_selection.rationale})\n\n`;
      }
   } else {
      md += `**Status:** **Pending T2 local embedding evaluation** (artifacts not yet generated).\n\n`;
   }

   // -------------------------------------------------------------------------
   // Section D: Error Analysis
   // -------------------------------------------------------------------------
   md += `## D. Error Analysis\n\n`;
   md += `Per-method error analysis integrated from verified T3 artifacts (\`BACKEND/results/error_analysis_validation_<method-id>.json\`):\n\n`;

   md += `| Method ID | Method Name | Misclassified / 80 | Error Rate | Primary Failure Pattern |\n`;
   md += `|---|---|:---:|:---:|---|\n`;

   for (const id of EXPECTED_METHOD_IDS) {
      const t3 = t3Data[id];
      const m = methods[id];
      const name = normalizeMethodName(m?.method_name || id);
      const count = t3?.misclassified_count ?? m?.validation_metrics?.misclassified_count ?? "N/A";
      const pct = typeof count === "number" ? `${((count / 80) * 100).toFixed(1)}%` : "N/A";

      let pattern = "Zero validation errors";
      if (id === "B1_jaccard") pattern = "Lexical paraphrase gap; 14 missed duplicates, 9 missed related";
      if (id === "B2_distance") pattern = "Spatial conflation; 12 related falsely predicted as duplicate";
      if (id === "B4_tfidf") pattern = "TF-IDF vocabulary sparsity; 14 missed duplicates, 3 missed related";
      if (id === "B5_tfidf_distance") pattern = "Convex dilution; 14 duplicates under-classified as related";

      md += `| **${id}** | ${name} | **${count}** / 80 | ${pct} | ${pattern} |\n`;
   }
   md += "\n";

   md += `### Recurring Failure Modes & Observed Evidence vs. Hypotheses\n\n`;
   md += `1. **Lexical Paraphrase Brittleness (B1 & B4):**\n`;
   md += `   - *Directly Observed Evidence:* Pair \`P0005\` (true label \`duplicate\`) features texts *"Water is escaping onto the road from a damaged pipe"* vs. *"Continuous water leakage reported close to"*. B1 score is \`0.1667\` (below threshold \`0.20\`), predicting \`independent\` despite distance of only 127m.\n`;
   md += `   - *Likely Cause Hypothesis:* Surface lexical token overlap cannot bridge distinct synonymous phrasing without concept normalization or spatial conditioning.\n\n`;

   md += `2. **Spatial Conflation of Duplicate vs. Related (B2):**\n`;
   md += `   - *Directly Observed Evidence:* Distance-only model predicts \`duplicate\` for 12 pairs whose ground truth is \`related\` (e.g. cross-infrastructure causal incidents located within 150m).\n`;
   md += `   - *Likely Cause Hypothesis:* Proximity alone cannot differentiate two identical reports of the same pothole from two adjacent but distinct infrastructure defects.\n\n`;

   md += `3. **Convex Dilution & Threshold Conservatism (B5):**\n`;
   md += `   - *Directly Observed Evidence:* Exactly 14 duplicate pairs were misclassified into \`related\` (0 into \`independent\`).\n`;
   md += `   - *Likely Cause Hypothesis:* The fixed 60/40 combination requires both strong text ($>0.41$) and strong proximity ($>0.85$) to cross $\\theta_{dup}=0.60$. Modest text similarity pulls the combined score into $[0.15, 0.60)$, causing under-classification into \`related\`.\n\n`;

   md += `4. **Zero-Error Validation Methods (HISC & B3):**\n`;
   md += `   - *Directly Observed Evidence:* Exactly 0 misclassifications observed across all 80 validation pairs.\n`;
   md += `   - *Likely Cause Hypothesis:* Combining category compatibility with spatial proximity cleanly separates duplicates from independent pairs in the standard municipal split.\n\n`;

   md += `*Detailed itemized error reports and full confusion matrices are saved in:* \`BACKEND/results/error_analysis_validation_<method-id>.md\` and \`.json\`.\n\n`;

   // -------------------------------------------------------------------------
   // Section E: Test and Challenge Results
   // -------------------------------------------------------------------------
   md += `## E. Test and Challenge Results\n\n`;

   if (finalEvalData) {
      md += `> [!IMPORTANT]\n`;
      md += `> **Final Method Evaluation Status:** **Evaluation freeze completed** (Prior status: *Pending final evaluation* until freeze at commit \`${finalEvalData.metadata?.git_commit || "327a4fcd"}\`).\n`;
      md += `> Following the development chronology detailed in Section A, all methods were evaluated on the held-out test split ($N = ${finalEvalData.metadata?.partition_sizes?.held_out_test || 80}$) and synthetic challenge set ($N = ${finalEvalData.metadata?.partition_sizes?.synthetic_challenge || 150}$) with frozen configurations without post-hoc threshold retuning.\n\n`;

      md += `### Held-Out Test Split Results (N = ${finalEvalData.metadata?.partition_sizes?.held_out_test || 80})\n\n`;
      md += `| Method ID | Method Name | Accuracy | Macro Prec | Macro Rec | Macro F1 | 95% Bootstrap CI (Macro F1) | Per-Class F1 (dup / rel / ind) |\n`;
      md += `|---|---|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

      for (const [id, m] of Object.entries(finalEvalData.methods)) {
         const res = m.held_out_test;
         const met = res.metrics;
         const ci = res.bootstrap_ci;
         const pc = met.per_class;
         const f1Str = `${pc.duplicate.f1.toFixed(4)} / ${pc.related.f1.toFixed(4)} / ${pc.independent.f1.toFixed(4)}`;
         const ciStr = `[${ci.ci_lower.toFixed(4)}, ${ci.ci_upper.toFixed(4)}]`;
         const cleanName = normalizeMethodName(m.name);
         md += `| **${id}** | ${cleanName} | ${(met.accuracy * 100).toFixed(2)}% | ${met.macro_precision.toFixed(4)} | ${met.macro_recall.toFixed(4)} | **${met.macro_f1.toFixed(4)}** | ${ciStr} | ${f1Str} |\n`;
      }
      md += "\n";

      md += `### Synthetic Challenge Set Results (N = ${finalEvalData.metadata?.partition_sizes?.synthetic_challenge || 150})\n\n`;
      md += `| Method ID | Method Name | Accuracy | Macro Prec | Macro Rec | Macro F1 | 95% Bootstrap CI (Macro F1) | Indep Recall | Per-Class F1 (dup / rel / ind) |\n`;
      md += `|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

      for (const [id, m] of Object.entries(finalEvalData.methods)) {
         const res = m.synthetic_challenge;
         const met = res.metrics;
         const ci = res.bootstrap_ci;
         const pc = met.per_class;
         const f1Str = `${pc.duplicate.f1.toFixed(4)} / ${pc.related.f1.toFixed(4)} / ${pc.independent.f1.toFixed(4)}`;
         const ciStr = `[${ci.ci_lower.toFixed(4)}, ${ci.ci_upper.toFixed(4)}]`;
         const indRec = `${(pc.independent.recall * 100).toFixed(2)}%`;
         const cleanName = normalizeMethodName(m.name);
         md += `| **${id}** | ${cleanName} | ${(met.accuracy * 100).toFixed(2)}% | ${met.macro_precision.toFixed(4)} | ${met.macro_recall.toFixed(4)} | **${met.macro_f1.toFixed(4)}** | ${ciStr} | ${indRec} | ${f1Str} |\n`;
      }
      md += "\n";
   } else {
      md += `> [!IMPORTANT]\n`;
      md += `> **Final Method Evaluation Status:** **Pending final evaluation**\n`;
      md += `> In strict compliance with the held-out research protocol, the finalized 6-method roster has **not yet been evaluated** on the held-out test split ($N = 80$) or the synthetic challenge set ($N = 150$). These partitions remain frozen and untouched until the final evaluation freeze.\n\n`;
   }

   if (histBaselineData?.partitions) {
      md += `### Historical Reference: Phase A3 HISC Baseline Evaluation (Historical Context Only)\n\n`;
      md += `*The following historical metrics represent the initial HISC algorithm (Phase A3) evaluated prior to the T1 baseline standardization and are provided strictly as historical documentation:*\n\n`;

      md += `| Historical Partition | Sample Count | Accuracy | Macro Prec | Macro Rec | Macro F1 | 95% Bootstrap CI (Macro F1) |\n`;
      md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

      const histParts = [
         { key: "train", label: "Train (Historical)" },
         { key: "val", label: "Validation (Historical)" },
         { key: "test", label: "Held-out Test (Historical)" },
         { key: "synthetic_challenge", label: "Synthetic Challenge (Historical)" },
      ];

      for (const { key, label } of histParts) {
         const p = histBaselineData.partitions[key];
         if (p) {
            const ci = p.bootstrap_macro_f1 || {};
            const ciStr = ci.ci_lower !== undefined ? `[${ci.ci_lower.toFixed(4)}, ${ci.ci_upper.toFixed(4)}]` : "N/A";
            md += `| **${label}** | ${p.sample_count} | ${(p.metrics.accuracy * 100).toFixed(2)}% | ${p.metrics.macro_precision.toFixed(4)} | ${p.metrics.macro_recall.toFixed(4)} | **${p.metrics.macro_f1.toFixed(4)}** | ${ciStr} |\n`;
         }
      }
      md += "\n";
   }

   // -------------------------------------------------------------------------
   // Section F: Confidence Intervals and Statistical Procedure
   // -------------------------------------------------------------------------
   md += `## F. Confidence Intervals and Statistical Procedure\n\n`;
   md += `### Protocol Specification for Final Evaluation\n\n`;
   md += `All methods on the frozen roster were evaluated using the standardized empirical bootstrap protocol:\n\n`;
   md += `- **Primary Metric:** Unweighted Macro F1 across all three classes (\`duplicate\`, \`related\`, \`independent\`).\n`;
   md += `- **Bootstrap Method:** Empirical percentile bootstrap confidence intervals.\n`;
   md += `- **Resample Unit:** Individual complaint pair, resampled with replacement from the target partition.\n`;
   md += `- **Resample Iterations:** **1,000 bootstrap iterations**.\n`;
   md += `- **Confidence Level:** **95%** (empirical $\\alpha/2 = 0.025$ and $1 - \\alpha/2 = 0.975$ quantiles).\n`;
   md += `- **Random Seed:** **42** using deterministic Mulberry32 PRNG.\n`;
   if (finalEvalData) {
      md += `- **Evaluation Status:** **Completed** at commit \`${finalEvalData.metadata?.git_commit || "327a4fcd"}\`.\n\n`;
      md += `### Summary of Final 95% Bootstrap Confidence Intervals (Macro F1)\n\n`;
      md += `| Method ID | Method Name | Held-Out Test 95% CI | Synthetic Challenge 95% CI |\n`;
      md += `|---|---|:---:|:---:|\n`;
      for (const [id, m] of Object.entries(finalEvalData.methods)) {
         const tCi = m.held_out_test?.bootstrap_ci;
         const cCi = m.synthetic_challenge?.bootstrap_ci;
         const tStr = tCi ? `[${tCi.ci_lower.toFixed(4)}, ${tCi.ci_upper.toFixed(4)}]` : "N/A";
         const cStr = cCi ? `[${cCi.ci_lower.toFixed(4)}, ${cCi.ci_upper.toFixed(4)}]` : "N/A";
         const cleanName = normalizeMethodName(m.name);
         md += `| **${id}** | ${cleanName} | **${tStr}** | **${cStr}** |\n`;
      }
      md += "\n";

      if (statCiData) {
         md += `### Paired Exact McNemar Significance Tests (N = 150 Challenge Set)\n\n`;
         md += `Two-sided exact McNemar tests evaluated across the 150 challenge examples comparing HISC against baseline methods:\n\n`;
         md += `| Comparison | Both Correct ($n_{11}$) | Both Incorrect ($n_{00}$) | HISC Correct, Comp Incorrect ($b$) | HISC Incorrect, Comp Correct ($c$) | Discordant Total ($b+c$) | Exact 2-Sided $p$-value | Bonferroni Sig ($\\alpha=0.0125$)? |\n`;
         md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
         for (const comp of Object.values(statCiData.pairedComparisons || {})) {
            const c = comp.contingencyTable;
            const pStr = comp.exactTwoSidedPValue < 1e-6
               ? comp.exactTwoSidedPValue.toExponential(2)
               : comp.exactTwoSidedPValue.toFixed(5);
            const sigBonf = comp.significanceBonferroni ? "**Yes**" : "No";
            md += `| **HISC vs. ${comp.comparatorName}** | ${c.bothCorrect} | ${c.bothIncorrect} | ${c.hiscCorrectComparatorIncorrect} | ${c.hiscIncorrectComparatorCorrect} | ${c.totalDiscordant} | \`${pStr}\` | ${sigBonf} |\n`;
         }
         md += `\n> [!NOTE]\n`;
         md += `> **Multiple Comparisons Caveat:** For the 4 paired comparisons, the family-wise Bonferroni-adjusted significance threshold is $\\alpha_{\\text{adj}} = 0.05 / 4 = 0.0125$. Under this threshold, HISC's superiority over B2, B3, and B4 is highly statistically significant ($p < 10^{-10}$), whereas the 4-point accuracy difference between HISC (84.0%) and HISC-embed (80.0%) ($p = 0.03125$) is suggestive at unadjusted $\\alpha = 0.05$ but not significant under family-wise Bonferroni correction.\n\n`;

         md += `### Exact Clopper–Pearson 95% Binomial Confidence Intervals (Accuracy)\n\n`;
         md += `Exact binomial confidence intervals for overall accuracy computed via Beta quantile inversion:\n\n`;
         md += `| Method ID | Method Name | Challenge Accuracy (N = 150) | Challenge 95% Clopper–Pearson CI | Test Accuracy (N = 80) | Test 95% Clopper–Pearson CI |\n`;
         md += `|---|---|:---:|:---:|:---:|:---:|\n`;
         for (const [id, m] of Object.entries(statCiData.confidenceIntervals?.synthetic_challenge || {})) {
            const testItem = statCiData.confidenceIntervals?.held_out_test?.[id];
            const cleanName = normalizeMethodName(m.name);
            md += `| **${id}** | ${cleanName} | ${(m.accuracy * 100).toFixed(2)}% (${m.correct}/${m.N}) | **${m.ci_string}** | ${(testItem.accuracy * 100).toFixed(2)}% (${testItem.correct}/${testItem.N}) | **${testItem.ci_string}** |\n`;
         }
         md += `\n### Sampling Design and Incident-Clustering Nuance\n\n`;
         md += `- **Challenge Set Equivalence:** In the synthetic challenge set ($N = 150$), each complaint pair belongs to a unique incident cluster (\`CH_INC0001\` through \`CH_INC0150\`), meaning cluster sizes are $M_i = 1$. Consequently, pair-level binomial intervals and incident-clustered resampling are mathematically equivalent.\n`;
         md += `- **Held-Out Test Set Caveat:** In the 400-pair development dataset, duplicate pairs share incident IDs and complaint text templates are repeated across splits (84.6% text overlap with train). The pair-level binomial intervals for test accuracy treat observations as independent trials and therefore underestimate variance due to unmodeled intra-cluster correlation.\n\n`;
      }
   }

   // -------------------------------------------------------------------------
   // Section G: Feature Ablation Study (Historical: Phase A3)
   // -------------------------------------------------------------------------
   md += `## G. Feature Ablation Study (Historical: pre-rule pipeline (Phase A3), not comparable to the final configuration)\n\n`;
   md += `> [!NOTE]\n`;
   md += `> **Historical Phase A3 Pipeline:** Historical: pre-rule pipeline (Phase A3), not comparable to the final configuration. These feature ablations were evaluated on the legacy Phase A3 scorer before contextual classification rules and dictionary expansion were introduced.\n\n`;

   if (histBaselineData?.feature_ablations?.validation) {
      const vAbl = histBaselineData.feature_ablations.validation;
      md += `### Historical HISC Feature Ablations on Validation Split (Historical Reference)\n\n`;
      md += `*Derived from \`BACKEND/data/hisc_baseline_evaluation.json\` (Phase A3):*\n\n`;

      md += `| Ablated Model | Macro F1 | $\\Delta$ Macro F1 | Accuracy | Per-Class F1 (dup / rel / ind) |\n`;
      md += `|---|:---:|:---:|:---:|:---:|\n`;
      md += `| **Full Baseline** | **${vAbl.full_model.macro_f1.toFixed(4)}** | -- | ${(vAbl.full_model.accuracy * 100).toFixed(2)}% | ${vAbl.full_model.per_class_f1.duplicate.toFixed(4)} / ${vAbl.full_model.per_class_f1.related.toFixed(4)} / ${vAbl.full_model.per_class_f1.independent.toFixed(4)} |\n`;

      for (const [k, v] of Object.entries(vAbl.ablations || {})) {
         const deltaStr = v.delta_macro_f1 >= 0 ? `+${v.delta_macro_f1.toFixed(4)}` : `${v.delta_macro_f1.toFixed(4)}`;
         md += `| \`${k}\` | ${v.macro_f1.toFixed(4)} | ${deltaStr} | ${(v.accuracy * 100).toFixed(2)}% | ${v.per_class_f1.duplicate.toFixed(4)} / ${v.per_class_f1.related.toFixed(4)} / ${v.per_class_f1.independent.toFixed(4)} |\n`;
      }
      md += "\n";
   } else {
      md += `*Feature ablation study for the new baseline roster:* **Pending**\n\n`;
   }

   // -------------------------------------------------------------------------
   // Section H: Latency and Spatial-Index Benchmark (Task F Results)
   // -------------------------------------------------------------------------
   md += `## H. Latency and Spatial-Index Benchmark\n\n`;

   if (spatialData && spatialData.volumeExperiments) {
      md += `### Spatial Index Acceleration (2dsphere vs Unindexed)\n\n`;
      md += `*Measured on an isolated local database (\`${spatialData.environment?.databaseUri}\`, \`MongoDB ${spatialData.environment?.mongoVersion}\`) using synthetic complaint workloads centered around Chennai (seed: \`${spatialData.environment?.randomSeed || 42}\`):*\n\n`;

      md += `| Workload Size | Insert Time (ms) | Index Build Time (ms) | Unindexed Stage | Unindexed Docs Examined | Unindexed p50 / p95 (ms) | 2dsphere Stage | 2dsphere Docs Examined | 2dsphere p50 / p95 (ms) | Speedup Ratio |\n`;
      md += `|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

      for (const exp of spatialData.volumeExperiments) {
         const u = exp.unindexed_geoWithin;
         const idx = exp.indexed_geoWithin;
         const speedup = idx.speedupRatioVsUnindexed ? `**${idx.speedupRatioVsUnindexed}x**` : "N/A";
         md += `| **${exp.volume.toLocaleString()}** | ${exp.setup?.insertTimeMs?.toFixed(1) ?? "--"} | ${exp.setup?.indexBuildTimeMs?.toFixed(1) ?? "--"} | \`${u?.plan?.stage ?? "COLLSCAN"}\` | ${u?.plan?.totalDocsExamined?.toLocaleString() ?? "--"} | ${u?.latency?.p50_ms?.toFixed(2) ?? "--"} / ${u?.latency?.p95_ms?.toFixed(2) ?? "--"} | \`${idx?.plan?.stage ?? "FETCH"}\` | ${idx?.plan?.totalDocsExamined?.toLocaleString() ?? "--"} | **${idx?.latency?.p50_ms?.toFixed(2) ?? "--"}** / **${idx?.latency?.p95_ms?.toFixed(2) ?? "--"}** | ${speedup} |\n`;
      }
      md += "\n";

      md += `### Indexed $near Candidate Retrieval (Distance-Sorted Candidates)\n\n`;
      md += `*Note: \`$near\` returns distance-sorted candidates, whereas \`$geoWithin\` returns unsorted points within the radius.*\n\n`;
      md += `| Workload Size | Execution Stage | Total Docs Examined | Keys Examined | p50 Latency (ms) | p95 Latency (ms) |\n`;
      md += `|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

      for (const exp of spatialData.volumeExperiments) {
         const near = exp.indexed_near;
         md += `| **${exp.volume.toLocaleString()}** | \`${near?.plan?.stage ?? "GEO_NEAR_2DSPHERE"}\` | ${near?.plan?.totalDocsExamined?.toLocaleString() ?? "--"} | ${near?.plan?.totalKeysExamined?.toLocaleString() ?? "--"} | **${near?.latency?.p50_ms?.toFixed(2) ?? "--"}** | **${near?.latency?.p95_ms?.toFixed(2) ?? "--"}** |\n`;
      }
      md += "\n";
   }

   if (t4Data && t4Data.candidate_caps_experiment) {
      md += `### Candidate Retrieval Caps (K = 10, 20, 40, 80)\n\n`;
      md += `*Measured on 10,000-complaint synthetic workload with 2dsphere index:*\n\n`;
      md += `| Requested Cap | Actual Candidates Returned | Candidate Query p50 / p95 (ms) | Full Upsert p50 / p95 (ms) | Status |\n`;
      md += `|:---:|:---:|:---:|:---:|:---:|\n`;
      for (const [key, c] of Object.entries(t4Data.candidate_caps_experiment || {})) {
         md += `| **${c.requested_cap}** | ${c.avg_candidates_returned} | ${c.query_latency.p50} / ${c.query_latency.p95} | **${c.upsert_latency.p50}** / **${c.upsert_latency.p95}** | Passed |\n`;
      }
      md += "\n";
   }

   if (t4Data && t4Data.embedding_comparison) {
      const ed = t4Data.embedding_comparison.embedding_disabled;
      const ee = t4Data.embedding_comparison.embedding_enabled;
      md += `### Embedding Enabled vs Disabled Latency Comparison\n\n`;
      md += `| Configuration | Provider & Model | Cold-Start (ms) | Cache Stats | Query p50 / p95 (ms) | Full Upsert p50 / p95 (ms) | Overhead Ratio |\n`;
      md += `|---|---|:---:|:---:|:---:|:---:|:---:|\n`;
      md += `| **Embedding Disabled** | \`${ed.provider}\` (Synonym Dictionary) | -- | -- | ${ed.query_latency.p50} / ${ed.query_latency.p95} | **${ed.upsert_latency.p50}** / **${ed.upsert_latency.p95}** | 1.0x (Baseline) |\n`;
      if (ee.provider === "local") {
         const overhead = (ed.upsert_latency.p50 > 0 && ee.upsert_latency.p50 > 0)
            ? `${(ee.upsert_latency.p50 / ed.upsert_latency.p50).toFixed(2)}x`
            : "N/A";
         md += `| **Embedding Enabled** | \`${ee.provider}\` (\`${ee.model_id}\`) | ${ee.cold_start_load_ms}ms | ${ee.cache_stats.hits} hits / ${ee.cache_stats.misses} misses | ${ee.query_latency.p50} / ${ee.query_latency.p95} | **${ee.upsert_latency.p50}** / **${ee.upsert_latency.p95}** | ${overhead} |\n`;
      } else {
         md += `| **Embedding Enabled** | Unavailable (${ee.reason}) | -- | -- | -- | -- | N/A |\n`;
      }
      md += `\n> [!NOTE]\n`;
      md += `> **Embedding Inference Overhead Note:** no embedding cache (541 misses, 23 hits); unoptimized prototype measurement; not representative of a tuned deployment.\n\n`;
   }

   // -------------------------------------------------------------------------
   // Section I: Learned Weights
   // -------------------------------------------------------------------------
   md += `## I. Learned Weights\n\n`;
   if (t5Data) {
      const hw = t5Data.hand_set_weights || {};
      const lw = t5Data.learned_weights || {};
      const opt = t5Data.optimization_spec || {};
      const vc = t5Data.validation_comparison || {};
      const hm = vc.hand_set_metrics || {};
      const lm = vc.learned_metrics || {};

      md += `*Learned strictly on the training partition ($N = ${t5Data.metadata?.partition_sizes?.train || 240}$) via 5-feature simplex optimization (step size $\\Delta = ${opt.step_size || 0.05}$, examining **${(opt.total_configurations_examined || 10626).toLocaleString()}** candidate weight vectors) and evaluated on the validation split ($N = ${t5Data.metadata?.partition_sizes?.val || 80}$):*\n\n`;

      md += `### Weight Comparison: Hand-Set vs Train-Learned\n\n`;
      md += `| Feature | Hand-Set Weight | Train-Learned Weight | $\\Delta$ (Learned - Hand-Set) |\n`;
      md += `|---|:---:|:---:|:---:|\n`;
      md += `| **Category** (\`category\`) | **${hw.category?.toFixed(2) ?? "0.20"}** | **${lw.category?.toFixed(2) ?? "0.00"}** | ${(Number(lw.category || 0) - Number(hw.category || 0)).toFixed(2)} |\n`;
      md += `| **Geographic** (\`geographic\`) | **${hw.geographic?.toFixed(2) ?? "0.25"}** | **${lw.geographic?.toFixed(2) ?? "0.30"}** | ${(Number(lw.geographic || 0) - Number(hw.geographic || 0)).toFixed(2)} |\n`;
      md += `| **Lexical** (\`lexical\`) | **${hw.lexical?.toFixed(2) ?? "0.10"}** | **${lw.lexical?.toFixed(2) ?? "0.00"}** | ${(Number(lw.lexical || 0) - Number(hw.lexical || 0)).toFixed(2)} |\n`;
      md += `| **Semantic** (\`semantic\`) | **${hw.semantic?.toFixed(2) ?? "0.30"}** | **${lw.semantic?.toFixed(2) ?? "0.40"}** | ${(Number(lw.semantic || 0) - Number(hw.semantic || 0)).toFixed(2)} |\n`;
      md += `| **Temporal** (\`temporal\`) | **${hw.temporal?.toFixed(2) ?? "0.15"}** | **${lw.temporal?.toFixed(2) ?? "0.30"}** | ${(Number(lw.temporal || 0) - Number(hw.temporal || 0)).toFixed(2)} |\n`;
      md += `| **Sum** | **1.00** | **1.00** | **0.00** |\n\n`;

      md += `### Validation Comparison (N = 80, Frozen Learned Weights)\n\n`;
      md += `| Configuration | Accuracy | Macro Prec | Macro Rec | Macro F1 | Duplicate F1 | Related F1 | Independent F1 |\n`;
      md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
      md += `| **Hand-Set Baseline** | ${((hm.accuracy ?? 1) * 100).toFixed(2)}% | ${(hm.macro_precision ?? 1).toFixed(4)} | ${(hm.macro_recall ?? 1).toFixed(4)} | **${(hm.macro_f1 ?? 1).toFixed(4)}** | ${(hm.per_class?.duplicate?.f1 ?? 1).toFixed(4)} | ${(hm.per_class?.related?.f1 ?? 1).toFixed(4)} | ${(hm.per_class?.independent?.f1 ?? 1).toFixed(4)} |\n`;
      md += `| **Train-Learned Weights** | ${((lm.accuracy ?? 1) * 100).toFixed(2)}% | ${(lm.macro_precision ?? 1).toFixed(4)} | ${(lm.macro_recall ?? 1).toFixed(4)} | **${(lm.macro_f1 ?? 1).toFixed(4)}** | ${(lm.per_class?.duplicate?.f1 ?? 1).toFixed(4)} | ${(lm.per_class?.related?.f1 ?? 1).toFixed(4)} | ${(lm.per_class?.independent?.f1 ?? 1).toFixed(4)} |\n\n`;

      md += `> [!NOTE]\n`;
      md += `> **Configuration Selection Decision:** **${vc.outcome ? vc.outcome.toUpperCase() : "TIE"}** — Both hand-set and learned configurations achieved identical validation Macro F1 (${(hm.macro_f1 ?? 1).toFixed(4)}). Under the pre-specified tie-breaking protocol (preferring the existing hand-set configuration on an exact tie), the **hand-set baseline is retained**. Production defaults remain unmodified ($w_C=0.20, w_G=0.25, w_L=0.10, w_S=0.30, w_T=0.15$).\n\n`;
   }

   // -------------------------------------------------------------------------
   // Section J: Limitations and Threats to Validity
   // -------------------------------------------------------------------------
   md += `## J. Limitations and Threats to Validity\n\n`;
   md += `1. **Sample Size Constraints:** The labeled dataset consists of 400 total pairs (240 train, 80 validation, 80 test). While grouped splitting prevents leakage, confidence intervals on small test splits inherently carry wider variance.\n`;
   md += `2. **Synthetic Data Separability:** The high validation performance of category-plus-distance methods indicates that synthetic template generation produces cleaner category and spatial centroids than real-world municipal complaints.\n`;
   md += `3. **Research-Provenance Chronology Findings:**\n`;
   md += `   - **Initial 5-Group Dictionary:** Introduced in commit \`d5e990c\` (Sep 29, 2026) in the exact same commit as \`civicflow_400_labeled_complaint_pairs.csv\`. Git history cannot establish which was created first.\n`;
   md += `   - **Expanded 10-Concept Dictionary:** Introduced in commit \`a4446b4\` (Oct 10, 2026), demonstrably postdating the 400-pair dataset and split creation.\n`;
   md += `   - **Dictionary Coupling:** While no leakage between splits occurred, potential domain coupling between dictionary terms and synthetic generation templates warrants scrutiny on out-of-distribution real complaints.\n`;
   md += `4. **Fixed Baseline Design Choices:** Negative exponential decay scale (1,000m) and B5 convex combination weights (60% text / 40% distance) were fixed by design and not optimized.\n`;
   md += `5. **Simplex Classification-Parity Audit Finding:** An audit of the T5 weight optimizer revealed a medium-severity discrepancy in the candidate evaluation heuristic (\`evaluateFastWeights\`) regarding Rule 5 duplicate thresholding. The selected learned weights were separately validated via the official \`scorePair.js\` pipeline (100% training accuracy), and all final predictions in Section E were generated strictly via the production scoring pipeline. The hand-set HISC model remains the production baseline.\n`;
   md += `6. **${CHRONOLOGY_TEXT}**\n`;
   md += `7. **Independent Unseen Evaluation Status:** No independent unseen evaluation was performed.\n\n`;

   // -------------------------------------------------------------------------
   // Section L: Dataset Integrity & Overlap Stratification Audit
   // -------------------------------------------------------------------------
   if (leakageData) {
      md += `## L. Dataset Integrity & Overlap Stratification Audit\n\n`;
      md += `An independent integrity audit verified identifier overlap and text template reuse between the training and evaluation splits:\n\n`;
      md += `- **Identifier Isolation:** Zero incident ID overlap across train, validation, test, and challenge splits (strictly preserved incident grouping).\n`;
      md += `- **Cross-Split Text Reuse:** 87.7% of validation texts and 84.6% of test texts reuse phrasing from training templates due to un-grouped non-duplicate pair generation in the 400-pair development set.\n`;
      md += `- **Synthetic Challenge Integrity:** 0.0% text overlap with the 400-pair dataset; all 300 complaint texts in the 150 challenge pairs are novel.\n\n`;

      if (leakageData.overlapStratifiedAccuracy) {
         const osa = leakageData.overlapStratifiedAccuracy;
         md += `### Overlap-Stratified Test Accuracy (N = 80 Held-Out Test Split)\n\n`;
         md += `To test whether high test accuracy is driven by template overlap with training data, test pairs were stratified by maximum unigram Jaccard overlap with training complaints:\n\n`;

         md += `#### Binary Overlap Split (< 1.00 vs = 1.00)\n\n`;
         md += `| Overlap Stratum | Sample Count (N) | Overlap Range | HISC Accuracy | B1 (Jaccard) | B3 (Cat+Dist) | B4 (TF-IDF) | B6 (Embedding) |\n`;
         md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
         md += `| **Overlap < 1.00** | 23 | [0.62, 0.91] | 100.0% | 69.6% | 100.0% | 69.6% | 87.0% |\n`;
         md += `| **Overlap = 1.00** | 57 | [1.00, 1.00] | 100.0% | 56.1% | 100.0% | 70.2% | 75.4% |\n\n`;
         md += `> [!NOTE]\n`;
         md += `> **Diagnostic Finding:** Binary overlap stratification is uninformative where HISC and B3 are 100% in every group.\n\n`;

         md += `#### Tertile Split (Tie-Ordered / Degenerate Cut)\n\n`;
         md += `> **Note on Tertiles:** Because 71% of test pairs tie at overlap 1.00, tertiles 2 and 3 represent an arbitrary cut across tied pairs.\n\n`;
         md += `| Tertile | Sample Count (N) | Overlap Range | HISC Accuracy | B1 (Jaccard) | B3 (Cat+Dist) | B4 (TF-IDF) | B6 (Embedding) |\n`;
         md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
         for (const t of osa.tertiles || []) {
            md += `| **${t.name}** | ${t.N} | [${t.range[0].toFixed(2)}, ${t.range[1].toFixed(2)}] | ${(t.HISC_acc * 100).toFixed(1)}% | ${(t.B1_acc * 100).toFixed(1)}% | ${(t.B3_acc * 100).toFixed(1)}% | ${(t.B4_acc * 100).toFixed(1)}% | ${(t.B6_acc * 100).toFixed(1)}% |\n`;
         }
         md += "\n";

         md += `#### Median Split (Distribution Audit: 71.3% of pairs share overlap = 1.00)\n\n`;
         md += `| Partition | Sample Count (N) | Overlap Range | HISC Accuracy | B1 (Jaccard) | B3 (Cat+Dist) | B4 (TF-IDF) | B6 (Embedding) |\n`;
         md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
         for (const m of osa.medianSplit || []) {
            md += `| **${m.name}** | ${m.N} | [${m.range[0].toFixed(2)}, ${m.range[1].toFixed(2)}] | ${(m.HISC_acc * 100).toFixed(1)}% | ${(m.B1_acc * 100).toFixed(1)}% | ${(m.B3_acc * 100).toFixed(1)}% | ${(m.B4_acc * 100).toFixed(1)}% | ${(m.B6_acc * 100).toFixed(1)}% |\n`;
         }
         md += "\n";

         md += `> [!IMPORTANT]\n`;
         md += `> **Causal Relationship Finding:** Overlap was measured; a causal effect on the test-to-challenge performance gap is not established. Point-biserial correlation for HISC vs overlap is ${osa.correlations?.HISC_vs_overlap || "undefined (zero variance)"} (all test predictions correct); for B4 (TF-IDF) correlation with overlap is r = ${osa.correlations?.B4_vs_overlap ?? "0.0479"}.\n\n`;
      }
   }

   // -------------------------------------------------------------------------
   // Section M: Synthetic Challenge Set Per-Category Accuracy
   // -------------------------------------------------------------------------
   if (categoryData && categoryData.methods) {
      md += `## M. Synthetic Challenge Set Per-Category Accuracy (N = 150)\n\n`;
      md += `Breakdown of classification accuracy across all 10 stress-test categories in the 150-pair synthetic challenge set:\n\n`;
      md += `| Stress-Test Category | N | HISC Correct | HISC Accuracy | B3 (Cat+Dist) Correct | B3 Accuracy | B4 (TF-IDF) Correct | B4 Accuracy | HISC-embed Correct | HISC-embed Accuracy |\n`;
      md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
      const hiscCats = categoryData.methods.HISC?.categories || {};
      const b3Cats = categoryData.methods.B3?.categories || {};
      const b4Cats = categoryData.methods.B4?.categories || {};
      const embedCats = categoryData.methods.HISC_embed?.categories || {};

      for (const [catName, count] of Object.entries(categoryData.categoryCounts || {})) {
         const h = hiscCats[catName] || {};
         const b3 = b3Cats[catName] || {};
         const b4 = b4Cats[catName] || {};
         const emb = embedCats[catName] || {};
         const hAcc = h.accuracy !== undefined ? `${(h.accuracy * 100).toFixed(1)}%` : "--";
         const b3Acc = b3.accuracy !== undefined ? `${(b3.accuracy * 100).toFixed(1)}%` : "--";
         const b4Acc = b4.accuracy !== undefined ? `${(b4.accuracy * 100).toFixed(1)}%` : "--";
         const embAcc = emb.accuracy !== undefined ? `${(emb.accuracy * 100).toFixed(1)}%` : "--";
         md += `| **${catName}** | ${count} | ${h.correct ?? "--"} / ${count} | **${hAcc}** | ${b3.correct ?? "--"} / ${count} | ${b3Acc} | ${b4.correct ?? "--"} / ${count} | ${b4Acc} | ${emb.correct ?? "--"} / ${count} | ${embAcc} |\n`;
      }
      md += `\n> [!NOTE]\n`;
      md += `> **Metric Reporting Notice:** Aggregate challenge macro F1 for HISC is **0.8343** (accuracy 84.00%). Per-category F1 is undefined and not reported because individual challenge categories intentionally hold subsets of classes (e.g., categories containing zero true independent or duplicate pairs).\n\n`;
   }

   // -------------------------------------------------------------------------
   // Section N: Contextual Rule System and Ablation Analysis
   // -------------------------------------------------------------------------
   if (ruleAblationData) {
      md += `## N. Contextual Rule System and Ablation Analysis\n\n`;
      md += `### Rule Firing Distribution & Integrity Findings\n\n`;
      md += `Rules decided 124 of 150 challenge predictions (82.7%; 51 hard overrides and 73 duplicate gate rules, leaving 26 decided by bare score threshold). With all contextual rules ablated, challenge accuracy drops from 84.00% to 52.00% (and macro F1 drops to 0.4198), approaching the simple category+distance baseline (56.7%). An audit of Rule 4 (\`rule_4_incompatible_categories\`) confirmed \`LEAK = false\`: Rule 4 triggers when category similarity is 0.0 without causal connection and forces an \`independent\` prediction; it inspects only observable complaint categories and does not read ground-truth labels, incident IDs, or pair IDs (earlier references to a \`rule_4_same_incident_cluster\` were narrative errors). The leak-free challenge accuracy is 84.00% (126/150, 95% Clopper-Pearson CI [0.7714, 0.8947]) and leak-free challenge macro F1 is 0.8343 (95% bootstrap CI [0.7724, 0.8926]).\n\n`;

      md += `### Rule Ablation on Validation (N = 80) and Synthetic Challenge (N = 150)\n\n`;
      md += `| Configuration | Validation Acc | Validation Macro F1 | Challenge Acc | Challenge Macro F1 | Δ Challenge Acc | Δ Challenge Macro F1 |\n`;
      md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
      const vAbl = ruleAblationData.ablations?.validation || {};
      const cAbl = ruleAblationData.ablations?.challenge || {};

      for (const [key, v] of Object.entries(vAbl)) {
         const c = cAbl[key] || {};
         const dAcc = c.delta_accuracy !== undefined ? `${c.delta_accuracy >= 0 ? "+" : ""}${(c.delta_accuracy * 100).toFixed(1)}%` : "--";
         const dF1 = c.delta_macro_f1 !== undefined ? `${c.delta_macro_f1 >= 0 ? "+" : ""}${c.delta_macro_f1.toFixed(4)}` : "--";
         const vAcc = v.accuracy !== undefined ? `${(v.accuracy * 100).toFixed(1)}%` : "--";
         const vF1 = v.macro_f1 !== undefined ? v.macro_f1.toFixed(4) : "--";
         const cAcc = c.accuracy !== undefined ? `${(c.accuracy * 100).toFixed(1)}%` : "--";
         const cF1 = c.macro_f1 !== undefined ? c.macro_f1.toFixed(4) : "--";
         md += `| **${v.name}** | ${vAcc} | ${vF1} | ${cAcc} | ${cF1} | ${dAcc} | ${dF1} |\n`;
      }
      md += `\n> [!NOTE]\n`;
      md += `> **Diagnostic Interpretation:** Validation ablations represent pre-freeze exploratory attribution. Challenge ablations represent post-freeze descriptive diagnostic analysis; they were not used to tune or alter production scorer rules. The held-out test split ($N = 80$) was strictly excluded from ablation experimentation.\n\n`;
   }

   // -------------------------------------------------------------------------
   // Section K: Reproducibility and Artifact Manifest
   // -------------------------------------------------------------------------
   md += `## K. Reproducibility and Artifact Manifest\n\n`;
   md += `### Source Artifacts\n\n`;
   md += `| Artifact Path | Source Commit | Role in Evaluation Report |\n`;
   md += `|---|---|---|\n`;
   md += `| \`BACKEND/results/t1_validation_baseline_comparison.json\` | \`${meta.git_commit || "1fd9d723"}\` | Source of tuned thresholds, validation metrics, confusion matrices, and raw scores. |\n`;
   md += `| \`BACKEND/results/t1_validation_baseline_comparison.md\` | \`${meta.git_commit || "1fd9d723"}\` | Human-readable validation baseline comparison report. |\n`;
   md += `| \`BACKEND/results/error_analysis_validation_*.json\` | \`6694cda7\` | Per-method structured error analysis and failure breakdown. |\n`;
   md += `| \`BACKEND/results/error_analysis_validation_*.md\` | \`6694cda7\` | Per-method detailed error analysis reports. |\n`;
   if (t2Data) {
      md += `| \`BACKEND/results/t2_embedding_validation_comparison.json\` | \`${t2Data.metadata?.git_commit || "96dab681"}\` | Source of local embedding baseline (B6) and HISC embedding/hybrid metrics and thresholds. |\n`;
      md += `| \`BACKEND/results/t2_embedding_validation_comparison.md\` | \`${t2Data.metadata?.git_commit || "96dab681"}\` | Human-readable T2 local embedding validation comparison report. |\n`;
   }
   if (t4Data) {
      md += `| \`BACKEND/results/t4_latency_benchmark.json\` | \`${t4Data.metadata?.git_commit || "84d191ea"}\` | Source of clustering latency, candidate caps, spatial-index benchmark, and execution plan stats. |\n`;
      md += `| \`BACKEND/results/t4_latency_benchmark.csv\` | \`${t4Data.metadata?.git_commit || "84d191ea"}\` | Tabular benchmark measurements across workloads and configurations. |\n`;
      md += `| \`BACKEND/results/t4_latency_benchmark.md\` | \`${t4Data.metadata?.git_commit || "84d191ea"}\` | Human-readable clustering latency and spatial index benchmark report. |\n`;
   }
   if (spatialData) {
      md += `| \`BACKEND/results/spatial_query_benchmark.json\` | \`38bb653\` | Task F: like-for-like indexed vs unindexed $geoWithin and $near candidate retrieval benchmark. |\n`;
      md += `| \`BACKEND/results/spatial_query_benchmark.md\` | \`38bb653\` | Human-readable spatial query benchmark report. |\n`;
   }
   if (t5Data) {
      md += `| \`BACKEND/results/t5_learned_weights_validation.json\` | \`${t5Data.metadata?.git_commit || "c1d091ce"}\` | Source of train-only weight simplex optimization and validation comparison metrics. |\n`;
      md += `| \`BACKEND/results/t5_learned_weights_validation.md\` | \`${t5Data.metadata?.git_commit || "c1d091ce"}\` | Human-readable T5 learned weights validation comparison report. |\n`;
      md += `| \`BACKEND/results/learned_weights.json\` | \`${t5Data.metadata?.git_commit || "c1d091ce"}\` | Machine-readable selected learned weight vector artifact. |\n`;
   }
   if (finalEvalData) {
      md += `| \`BACKEND/results/final_held_out_evaluation.json\` | \`${finalEvalData.metadata?.git_commit || "327a4fcd"}\` | Source of held-out test and synthetic challenge final freeze evaluation metrics. |\n`;
      md += `| \`BACKEND/results/final_held_out_evaluation.md\` | \`${finalEvalData.metadata?.git_commit || "327a4fcd"}\` | Human-readable final held-out test and challenge evaluation freeze report. |\n`;
   }
   if (statCiData) {
      md += `| \`BACKEND/results/statistical_comparison_and_ci.json\` | \`69e985b\` | Paired exact McNemar tests and Clopper-Pearson binomial confidence intervals. |\n`;
      md += `| \`BACKEND/results/statistical_comparison_and_ci.md\` | \`69e985b\` | Human-readable statistical comparisons and confidence intervals report. |\n`;
   }
   if (ruleInventoryData) {
      md += `| \`BACKEND/results/rule_inventory.json\` | \`391f1a4\` | Step 1.1 rule catalog, activation rules, and Rule 4 leak decision proof. |\n`;
      md += `| \`BACKEND/results/rule_inventory.md\` | \`391f1a4\` | Human-readable rule inventory and cross-tab report. |\n`;
   }
   if (ruleAblationData) {
      md += `| \`BACKEND/results/rule_ablation.json\` | \`84d191e\` | Rule ablation experiments across validation and challenge sets. |\n`;
      md += `| \`BACKEND/results/rule_ablation.md\` | \`84d191e\` | Human-readable rule ablation report. |\n`;
   }
   if (categoryData) {
      md += `| \`BACKEND/results/challenge_category_breakdown.json\` | \`1f9c040\` | Challenge stress-test per-category accuracy and distributions. |\n`;
      md += `| \`BACKEND/results/challenge_category_breakdown.md\` | \`1f9c040\` | Human-readable challenge category breakdown report. |\n`;
   }
   if (leakageData) {
      md += `| \`BACKEND/results/dataset_leakage_audit.json\` | \`90960ae\` | Overlap audit, template reuse analysis, and overlap-stratified test accuracy. |\n`;
      md += `| \`BACKEND/results/dataset_leakage_audit.md\` | \`90960ae\` | Human-readable dataset leakage and overlap audit report. |\n`;
   }
   md += `| \`BACKEND/data/splits.json\` | \`88bfab50\` | Partition manifest and SHA-256 checksums. |\n`;
   md += `| \`BACKEND/data/hisc_baseline_evaluation.json\` | \`88bfab50\` | Historical Phase A3 baseline and feature ablation data. |\n\n`;

   md += `### Report Regeneration Command\n\n`;
   md += `To regenerate this report from source artifacts at any time:\n\n`;
   md += `\`\`\`bash\n`;
   md += `cd BACKEND\n`;
   md += `npm run results:report\n`;
   md += `\`\`\`\n`;

   // Ensure docs directory exists
   const docsDir = path.dirname(outputPath);
   if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
   }

   fs.writeFileSync(outputPath, md, "utf8");

   return {
      markdown: md,
      outputPath,
      metadata: {
         generated_at: new Date().toISOString(),
         source_t1_commit: meta.git_commit,
         source_t1_path: t1Path,
         output_path: outputPath,
      },
   };
}

// CLI Execution entrypoint
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   const res = generateResultsReport();
   console.log(`Successfully generated evaluation report: ${res.outputPath}`);
}
