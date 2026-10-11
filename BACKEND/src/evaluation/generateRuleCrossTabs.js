import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDatasetPartitions } from "./hiscEvaluationHarness.js";
import { scorePair } from "../hisc/scorePair.js";
import { HISC_EVAL_PRESET } from "../hisc/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const RULE_GROUPS = Object.freeze({
   HARD_OVERRIDES: [
      "rule_1_distant_boundary",
      "rule_2_temporal_boundary",
      "rule_3_operational_radius",
      "rule_4_incompatible_categories",
      "rule_5_opposing_direction",
      "rule_opposing_direction_related",
   ],
   GATE_RULES: [
      "rule_5_duplicate",
      "rule_5_downgraded_related",
   ],
   BARE_THRESHOLD: [
      "threshold",
   ],
});

export function computePartitionCrossTabs(pairs, partitionName) {
   const classNames = ["duplicate", "related", "independent"];

   const createMatrix = () => ({
      duplicate: { duplicate: 0, related: 0, independent: 0 },
      related: { duplicate: 0, related: 0, independent: 0 },
      independent: { duplicate: 0, related: 0, independent: 0 },
   });

   const fullConfusion = createMatrix();
   const truthCounts = { duplicate: 0, related: 0, independent: 0 };
   const predCounts = { duplicate: 0, related: 0, independent: 0 };
   const perRuleMatrices = {};

   const allRuleKeys = [
      ...RULE_GROUPS.HARD_OVERRIDES,
      ...RULE_GROUPS.GATE_RULES,
      ...RULE_GROUPS.BARE_THRESHOLD,
   ];

   for (const rk of allRuleKeys) {
      perRuleMatrices[rk] = createMatrix();
   }

   for (const p of pairs) {
      truthCounts[p.label]++;
      const res = scorePair(p.complaint_a, p.complaint_b, HISC_EVAL_PRESET);
      const rf = res.rule_fired;
      predCounts[res.label]++;

      fullConfusion[p.label][res.label]++;
      if (!perRuleMatrices[rf]) {
         perRuleMatrices[rf] = createMatrix();
      }
      perRuleMatrices[rf][p.label][res.label]++;
   }

   // Group summaries
   const groupSummaries = {};
   for (const [groupName, ruleList] of Object.entries(RULE_GROUPS)) {
      let count = 0;
      let correct = 0;
      const groupMatrix = createMatrix();

      for (const rk of ruleList) {
         const mat = perRuleMatrices[rk];
         for (const act of classNames) {
            for (const pr of classNames) {
               const val = mat[act][pr];
               count += val;
               groupMatrix[act][pr] += val;
               if (act === pr) correct += val;
            }
         }
      }

      groupSummaries[groupName] = {
         count,
         correct,
         accuracy: count > 0 ? Number((correct / count).toFixed(4)) : 0,
         matrix: groupMatrix,
      };
   }

   let totalCorrect = 0;
   for (const c of classNames) {
      totalCorrect += fullConfusion[c][c];
   }

   return {
      partitionName,
      sampleCount: pairs.length,
      totalCorrect,
      accuracy: Number((totalCorrect / pairs.length).toFixed(4)),
      truthDistribution: truthCounts,
      predictedDistribution: predCounts,
      fullConfusionMatrix: fullConfusion,
      perRuleMatrices,
      groupSummaries,
   };
}

export function generateRuleCrossTabs() {
   const ds = loadDatasetPartitions();
   const challenge = computePartitionCrossTabs(ds.partitions.challenge, "synthetic_challenge");
   const validation = computePartitionCrossTabs(ds.partitions.val, "validation");

   // Verifications
   // (a) Challenge correct = 126 / 150
   if (challenge.totalCorrect !== 126) {
      throw new Error(`Challenge correct count mismatch: expected 126, got ${challenge.totalCorrect}`);
   }
   // (b) Challenge truth = 50 dup, 43 rel, 57 indep
   if (
      challenge.truthDistribution.duplicate !== 50 ||
      challenge.truthDistribution.related !== 43 ||
      challenge.truthDistribution.independent !== 57
   ) {
      throw new Error(`Challenge truth mismatch: ${JSON.stringify(challenge.truthDistribution)}`);
   }
   // (c) Validation truth = 24 dup, 28 rel, 28 indep
   if (
      validation.truthDistribution.duplicate !== 24 ||
      validation.truthDistribution.related !== 28 ||
      validation.truthDistribution.independent !== 28
   ) {
      throw new Error(`Validation truth mismatch: ${JSON.stringify(validation.truthDistribution)}`);
   }
   // (d) rule-decided + threshold-decided = N
   const chalRuleDecided = challenge.groupSummaries.HARD_OVERRIDES.count + challenge.groupSummaries.GATE_RULES.count;
   const chalThresholdDecided = challenge.groupSummaries.BARE_THRESHOLD.count;
   if (chalRuleDecided + chalThresholdDecided !== 150) {
      throw new Error(`Challenge rule+threshold sum mismatch: ${chalRuleDecided} + ${chalThresholdDecided} != 150`);
   }

   const valRuleDecided = validation.groupSummaries.HARD_OVERRIDES.count + validation.groupSummaries.GATE_RULES.count;
   const valThresholdDecided = validation.groupSummaries.BARE_THRESHOLD.count;
   if (valRuleDecided + valThresholdDecided !== 80) {
      throw new Error(`Validation rule+threshold sum mismatch: ${valRuleDecided} + ${valThresholdDecided} != 80`);
   }

   const out = {
      evaluatedAt: new Date().toISOString(),
      preset: HISC_EVAL_PRESET,
      definitions: {
         HARD_OVERRIDES: "Direct short-circuit on geographic, temporal, categorical, or directional bounds without requiring duplicate score threshold.",
         GATE_RULES: "Rules gating duplicate qualification when score >= duplicateThreshold (0.60), requiring strict spatial (<=250m), temporal (<=168h), categorical (>=0.9), and non-opposing direction constraints, else downgrading to related.",
         BARE_THRESHOLD: "Standard numerical decision threshold: score >= relatedThreshold (0.10) ? related : independent without contextual rule firing.",
      },
      challenge,
      validation,
   };

   const jsonPath = path.resolve(__dirname, "../../results/rule_cross_tabs.json");
   const mdPath = path.resolve(__dirname, "../../results/rule_cross_tabs.md");

   fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), "utf8");

   // Markdown report
   const lines = [];
   lines.push("# Contextual Rule System Cross-Tabs & Three-Tier Decision Breakdown");
   lines.push("");
   lines.push("> **Methodological Verification:** Computed using the production `scorePair` scorer with frozen `HISC-eval` preset (`duplicateThreshold: 0.60`, `relatedThreshold: 0.10`).");
   lines.push("");

   for (const split of [challenge, validation]) {
      const isChal = split.partitionName === "synthetic_challenge";
      lines.push(`## ${isChal ? "1. Synthetic Challenge Set (N = 150)" : "2. Validation Set (N = 80)"}`);
      lines.push("");
      lines.push(`- **Truth Distribution:** ${split.truthDistribution.duplicate} duplicate, ${split.truthDistribution.related} related, ${split.truthDistribution.independent} independent (Total ${split.sampleCount})`);
      lines.push(`- **Overall Correct:** ${split.totalCorrect} / ${split.sampleCount} (${(split.accuracy * 100).toFixed(2)}%)`);
      lines.push("");
      lines.push("### Three-Tier Decision Breakdown");
      lines.push("| Tier | Tier Description | Count | Correct | Accuracy | Key Rules Included |");
      lines.push("|---|---|:---:|:---:|:---:|---|");
      lines.push(`| **HARD OVERRIDES** | Spatial/temporal/categorical/directional boundaries | ${split.groupSummaries.HARD_OVERRIDES.count} | ${split.groupSummaries.HARD_OVERRIDES.correct} | ${(split.groupSummaries.HARD_OVERRIDES.accuracy * 100).toFixed(2)}% | rule_1, rule_2, rule_3, rule_4, opposing_dir |`);
      lines.push(`| **GATE RULES** | Score >= 0.60 duplicate verification or downgrade | ${split.groupSummaries.GATE_RULES.count} | ${split.groupSummaries.GATE_RULES.correct} | ${(split.groupSummaries.GATE_RULES.accuracy * 100).toFixed(2)}% | rule_5_duplicate, rule_5_downgraded_related |`);
      lines.push(`| **BARE THRESHOLD** | Numerical decision (score >= 0.10) | ${split.groupSummaries.BARE_THRESHOLD.count} | ${split.groupSummaries.BARE_THRESHOLD.correct} | ${(split.groupSummaries.BARE_THRESHOLD.accuracy * 100).toFixed(2)}% | threshold |`);
      lines.push("");

      lines.push("### Per-Rule 3×3 Cross-Tab Matrices (Rows = Actual, Columns = Predicted)");
      lines.push("");
      for (const [rId, mat] of Object.entries(split.perRuleMatrices)) {
         const firedCount = mat.duplicate.duplicate + mat.duplicate.related + mat.duplicate.independent +
            mat.related.duplicate + mat.related.related + mat.related.independent +
            mat.independent.duplicate + mat.independent.related + mat.independent.independent;
         if (firedCount === 0) continue;
         const ruleCorrect = mat.duplicate.duplicate + mat.related.related + mat.independent.independent;
         lines.push(`#### \`${rId}\` (Fired: ${firedCount}, Correct: ${ruleCorrect}, ${(ruleCorrect / firedCount * 100).toFixed(1)}%)`);
         lines.push("| Actual \\ Predicted | Predicted duplicate | Predicted related | Predicted independent |");
         lines.push("|---|:---:|:---:|:---:|");
         lines.push(`| **Actual duplicate** | ${mat.duplicate.duplicate} | ${mat.duplicate.related} | ${mat.duplicate.independent} |`);
         lines.push(`| **Actual related** | ${mat.related.duplicate} | ${mat.related.related} | ${mat.related.independent} |`);
         lines.push(`| **Actual independent** | ${mat.independent.duplicate} | ${mat.independent.related} | ${mat.independent.independent} |`);
         lines.push("");
      }
   }

   fs.writeFileSync(mdPath, lines.join("\n"), "utf8");
   console.log(`Saved rule cross-tabs to:\n  ${jsonPath}\n  ${mdPath}`);
   return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
   generateRuleCrossTabs();
}
