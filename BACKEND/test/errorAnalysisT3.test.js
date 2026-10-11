import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   ERROR_ANALYSIS_PATHS,
   deriveMethodLevelMissingFields,
   deriveObservedEvidence,
   deriveLikelyCauseHypothesis,
   generateMethodErrorAnalysis,
   formatMethodErrorAnalysisMarkdown,
   runErrorAnalysisGeneration,
} from "../src/evaluation/errorAnalysisGenerator.js";
import { loadDatasetPartitions } from "../src/evaluation/hiscEvaluationHarness.js";
import { SUPPORTED_CLASSES } from "../src/evaluation/metricsCalculator.js";

import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_METHOD_IDS = [
   "HISC",
   "B1_jaccard",
   "B2_distance",
   "B3_cat_distance",
   "B4_tfidf",
   "B5_tfidf_distance",
];

describe("CIVICFLOW Phase T3 — Reproducible Error Analysis", () => {
   describe("1. Error Analysis Generator & Schema Validation", () => {
      it("generates complete error analysis reports for all 6 T1 methods", () => {
         const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "civicflow-t3-test-"));
         try {
            const results = runErrorAnalysisGeneration({ resultsDir: tempDir });
            for (const id of EXPECTED_METHOD_IDS) {
               assert.ok(results[id], `Missing generator output for method ${id}`);
               assert.ok(fs.existsSync(results[id].jsonPath), `JSON artifact not found for ${id}`);
               assert.ok(fs.existsSync(results[id].mdPath), `Markdown artifact not found for ${id}`);
            }
         } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
         }
      });

      it("validates all generated JSON artifacts conform to required schema", () => {
         for (const id of EXPECTED_METHOD_IDS) {
            const jsonPath = path.resolve(ERROR_ANALYSIS_PATHS.resultsDir, `error_analysis_validation_${id}.json`);
            const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

            assert.equal(data.source_evaluation_artifact, "BACKEND/results/t1_validation_baseline_comparison.json");
            assert.ok(typeof data.source_commit_hash === "string" && data.source_commit_hash.length >= 7);
            assert.ok(Date.parse(data.generation_timestamp), "Valid ISO 8601 timestamp required");
            assert.equal(data.random_seed, null, "Random seed must be null when no stochastic sampling is used");
            assert.equal(data.split_name, "validation");
            assert.equal(data.method_id, id);
            assert.equal(data.sample_count, 80);
            assert.ok(typeof data.misclassified_count === "number");
            assert.ok(data.selected_thresholds && typeof data.selected_thresholds.duplicate === "number");
            assert.ok(data.selected_thresholds && typeof data.selected_thresholds.related === "number");
            assert.ok(data.confusion_matrix && typeof data.confusion_matrix === "object");
            assert.ok(Array.isArray(data.misclassified_pairs));
            assert.equal(data.misclassified_pairs.length, data.misclassified_count);
            assert.ok(Array.isArray(data.missing_fields_or_unavailable_explanations));
         }
      });
   });

   describe("2. Zero-Error Methods Handling (HISC and B3)", () => {
      it("handles zero-error methods (HISC and B3_cat_distance) cleanly without fabricating errors", () => {
         for (const zeroId of ["HISC", "B3_cat_distance"]) {
            const jsonPath = path.resolve(ERROR_ANALYSIS_PATHS.resultsDir, `error_analysis_validation_${zeroId}.json`);
            const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

            assert.equal(data.misclassified_count, 0, `${zeroId} must have exactly 0 misclassifications on validation`);
            assert.deepEqual(data.misclassified_pairs, []);
            assert.equal(data.accuracy, 1.0);
            assert.equal(data.macro_f1, 1.0);

            // Verify Markdown report contains zero-error explanation
            const mdPath = path.resolve(ERROR_ANALYSIS_PATHS.resultsDir, `error_analysis_validation_${zeroId}.md`);
            const mdContent = fs.readFileSync(mdPath, "utf8");
            assert.ok(mdContent.includes("Zero Validation Errors Observed"));
            assert.ok(mdContent.includes("held-out test set"));
         }
      });
   });

   describe("3. Misclassified Pairs Completeness & Field Derivation", () => {
      it("derives all required fields for misclassified pairs across imperfect baselines", () => {
         const imperfectMethods = ["B1_jaccard", "B2_distance", "B4_tfidf", "B5_tfidf_distance"];
         for (const id of imperfectMethods) {
            const jsonPath = path.resolve(ERROR_ANALYSIS_PATHS.resultsDir, `error_analysis_validation_${id}.json`);
            const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

            assert.ok(data.misclassified_count > 0, `${id} must have misclassified pairs`);
            for (const item of data.misclassified_pairs) {
               assert.ok(item.pair_id && item.pair_id.startsWith("P"), "Valid pair_id required");
               assert.ok(item.complaint_a_text && item.complaint_a_text.length > 5);
               assert.ok(item.complaint_b_text && item.complaint_b_text.length > 5);
               assert.ok(SUPPORTED_CLASSES.includes(item.true_label));
               assert.ok(SUPPORTED_CLASSES.includes(item.predicted_label));
               assert.notEqual(item.true_label, item.predicted_label);
               assert.ok(Number.isFinite(item.raw_score));
               assert.equal(item.confusion_category, `actual_${item.true_label}_pred_${item.predicted_label}`);
               assert.ok(Number.isFinite(item.distance_meters) && item.distance_meters >= 0);
               assert.ok(Number.isFinite(item.time_difference_hours) && item.time_difference_hours >= 0);

               // Scorer feature breakdown
               assert.ok(item.feature_breakdown && typeof item.feature_breakdown === "object");
               assert.ok(Number.isFinite(item.feature_breakdown.category));
               assert.ok(Number.isFinite(item.feature_breakdown.geographic));
               assert.ok(Number.isFinite(item.feature_breakdown.lexical));
               assert.ok(Number.isFinite(item.feature_breakdown.semantic));
               assert.ok(Number.isFinite(item.feature_breakdown.temporal));
            }
         }
      });
   });

   describe("4. Separation of Directly Observed Evidence from Hypotheses", () => {
      it("strictly separates factual observed evidence from hypothesized failure causes", () => {
         const imperfectMethods = ["B1_jaccard", "B2_distance", "B4_tfidf", "B5_tfidf_distance"];
         for (const id of imperfectMethods) {
            const jsonPath = path.resolve(ERROR_ANALYSIS_PATHS.resultsDir, `error_analysis_validation_${id}.json`);
            const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

            for (const item of data.misclassified_pairs) {
               assert.ok(typeof item.evidence === "string" && item.evidence.length > 20, "Evidence string required");
               assert.ok(typeof item.likely_cause_hypothesis === "string" && item.likely_cause_hypothesis.length > 20, "Hypothesis string required");
               assert.notEqual(item.evidence, item.likely_cause_hypothesis, "Evidence and hypothesis must be distinct");

               // Evidence must reference verifiable metrics and thresholds
               assert.ok(
                  item.evidence.includes("Observed score = ") ||
                  item.evidence.includes("True label is ") ||
                  item.evidence.includes("Geographic distance between complaints is")
               );
            }
         }
      });

      it("documents unmodeled feature dimensions explicitly rather than fabricating placeholders", () => {
         // B1 lacks geographic, category, temporal, semantic features
         const b1Missing = deriveMethodLevelMissingFields("B1_jaccard");
         assert.ok(b1Missing.includes("geographic_distance_unmodeled"));
         assert.ok(b1Missing.includes("category_compatibility_unmodeled"));
         assert.ok(b1Missing.includes("temporal_proximity_unmodeled"));

         // B2 lacks lexical, category, semantic features
         const b2Missing = deriveMethodLevelMissingFields("B2_distance");
         assert.ok(b2Missing.includes("lexical_similarity_unmodeled"));
         assert.ok(b2Missing.includes("category_compatibility_unmodeled"));

         // HISC has no missing features
         const hiscMissing = deriveMethodLevelMissingFields("HISC");
         assert.equal(hiscMissing.length, 0);
      });
   });

   describe("5. Markdown Report Structure and Content Validation", () => {
      it("validates all 6 Markdown reports contain the required sections", () => {
         for (const id of EXPECTED_METHOD_IDS) {
            const mdPath = path.resolve(ERROR_ANALYSIS_PATHS.resultsDir, `error_analysis_validation_${id}.md`);
            const content = fs.readFileSync(mdPath, "utf8");

            assert.ok(content.includes("## 1. Executive Summary & Evaluation Context"));
            assert.ok(content.includes("## 2. Confusion Matrix & Per-Class Performance"));
            assert.ok(content.includes("## 3. Detailed Misclassified Pairs Analysis"));
            assert.ok(content.includes("## 4. Cross-Method Comparison of Recurring Error Patterns"));
            assert.ok(content.includes("## 5. Distinction Between Observed Facts and Hypotheses"));
         }
      });
   });

   describe("6. Strict Split Isolation (No Held-out Test or Challenge Leakage)", () => {
      it("confirms error analysis uses exclusively the 80 validation pairs", () => {
         const { partitions } = loadDatasetPartitions();
         const valIdSet = new Set(partitions.val.map((p) => p.pair_id));
         const testIdSet = new Set(partitions.test.map((p) => p.pair_id));
         const challengeIdSet = new Set(partitions.challenge.map((p) => p.pair_id));

         for (const id of EXPECTED_METHOD_IDS) {
            const jsonPath = path.resolve(ERROR_ANALYSIS_PATHS.resultsDir, `error_analysis_validation_${id}.json`);
            const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

            assert.equal(data.sample_count, 80);
            for (const item of data.misclassified_pairs) {
               assert.ok(valIdSet.has(item.pair_id), `Pair ${item.pair_id} must be in validation split`);
               assert.ok(!testIdSet.has(item.pair_id), `Held-out test pair ${item.pair_id} leaked into error analysis!`);
               assert.ok(!challengeIdSet.has(item.pair_id), `Challenge set pair ${item.pair_id} leaked into error analysis!`);
            }
         }
      });
   });
});
