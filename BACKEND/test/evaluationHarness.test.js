import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   safeDivide,
   validateResults,
   computeConfusionMatrix,
   computePerClassMetrics,
   computeMacroMetrics,
   computeMicroMetrics,
   computeWeightedMetrics,
   calculateDetailedMetrics,
   computeBootstrapMacroF1CI,
   SUPPORTED_CLASSES,
} from "../src/evaluation/metricsCalculator.js";

import {
   loadDatasetPartitions,
   evaluatePair,
   evaluatePartition,
   runThresholdSweep,
   runFeatureAblations,
   runComprehensiveBaseline,
   formatEvaluationMarkdown,
   DEFAULT_PATHS,
   EXPECTED_CHECKSUM,
} from "../src/evaluation/hiscEvaluationHarness.js";

import { HISC_CONFIG } from "../src/service/incidentIntelligence.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CIVICFLOW Phase A3 — HISC Evaluation Harness V2", () => {
   describe("1. Metrics Engine & Mathematical Correctness", () => {
      it("safeDivide handles zero and invalid denominators cleanly", () => {
         assert.equal(safeDivide(10, 2), 5);
         assert.equal(safeDivide(10, 0), 0);
         assert.equal(safeDivide(0, 0), 0);
         assert.equal(safeDivide(10, 0, -1), -1);
         assert.equal(safeDivide(NaN, 5), 0);
         assert.equal(safeDivide(5, Infinity), 0);
      });

      it("validateResults catches invalid input, missing items, or unknown labels", () => {
         assert.throws(() => validateResults([]), /non-empty array/);
         assert.throws(() => validateResults([{ actual: "foo", predicted: "duplicate" }]), /Invalid actual label/);
         assert.throws(() => validateResults([{ actual: "duplicate", predicted: "bar" }]), /Invalid predicted label/);
         assert.doesNotThrow(() => validateResults([{ actual: "duplicate", predicted: "duplicate" }]));
      });

      it("computes accurate confusion matrix and per-class metrics against hand-calculated fixture", () => {
         // Hand-crafted test fixture:
         // actual: duplicate (3 items): 2 predicted duplicate, 1 predicted related, 0 independent
         // actual: related (3 items): 0 predicted duplicate, 2 predicted related, 1 independent
         // actual: independent (4 items): 0 predicted duplicate, 1 predicted related, 3 independent
         // Total = 10 items
         const fixture = [
            { actual: "duplicate", predicted: "duplicate", pair_id: "P1" },
            { actual: "duplicate", predicted: "duplicate", pair_id: "P2" },
            { actual: "duplicate", predicted: "related", pair_id: "P3" }, // FN for dup, FP for rel
            { actual: "related", predicted: "related", pair_id: "P4" },
            { actual: "related", predicted: "related", pair_id: "P5" },
            { actual: "related", predicted: "independent", pair_id: "P6" }, // FN for rel, FP for ind
            { actual: "independent", predicted: "independent", pair_id: "P7" },
            { actual: "independent", predicted: "independent", pair_id: "P8" },
            { actual: "independent", predicted: "independent", pair_id: "P9" },
            { actual: "independent", predicted: "related", pair_id: "P10" }, // FN for ind, FP for rel
         ];

         const conf = computeConfusionMatrix(fixture);
         assert.deepEqual(conf, {
            duplicate: { duplicate: 2, related: 1, independent: 0 },
            related: { duplicate: 0, related: 2, independent: 1 },
            independent: { duplicate: 0, related: 1, independent: 3 },
         });

         const perClass = computePerClassMetrics(conf);

         // duplicate: TP=2, FP=0, FN=1, TN=7, support=3
         // Precision = 2/2 = 1.0, Recall = 2/3 = 0.6667, F1 = (2*1*2/3)/(1+2/3) = (4/3)/(5/3) = 0.8
         assert.equal(perClass.duplicate.true_positive, 2);
         assert.equal(perClass.duplicate.false_positive, 0);
         assert.equal(perClass.duplicate.false_negative, 1);
         assert.equal(perClass.duplicate.true_negative, 7);
         assert.equal(perClass.duplicate.support, 3);
         assert.equal(perClass.duplicate.precision, 1.0);
         assert.equal(perClass.duplicate.recall, 0.6667);
         assert.equal(perClass.duplicate.f1, 0.8);

         // related: TP=2, FP=2 (P3 from dup, P10 from ind), FN=1 (P6 to ind), TN=5, support=3
         // Precision = 2/(2+2) = 0.5, Recall = 2/3 = 0.6667, F1 = 2*(0.5)*(2/3)/(0.5 + 2/3) = (2/3)/(7/6) = 4/7 = 0.5714
         assert.equal(perClass.related.true_positive, 2);
         assert.equal(perClass.related.false_positive, 2);
         assert.equal(perClass.related.false_negative, 1);
         assert.equal(perClass.related.true_negative, 5);
         assert.equal(perClass.related.support, 3);
         assert.equal(perClass.related.precision, 0.5);
         assert.equal(perClass.related.recall, 0.6667);
         assert.equal(perClass.related.f1, 0.5714);

         // independent: TP=3, FP=1 (P6 from rel), FN=1 (P10 to rel), TN=5, support=4
         // Precision = 3/4 = 0.75, Recall = 3/4 = 0.75, F1 = 0.75
         assert.equal(perClass.independent.true_positive, 3);
         assert.equal(perClass.independent.false_positive, 1);
         assert.equal(perClass.independent.false_negative, 1);
         assert.equal(perClass.independent.true_negative, 5);
         assert.equal(perClass.independent.support, 4);
         assert.equal(perClass.independent.precision, 0.75);
         assert.equal(perClass.independent.recall, 0.75);
         assert.equal(perClass.independent.f1, 0.75);

         // Macro: average of (P: 1.0, 0.5, 0.75) = 2.25/3 = 0.75
         // Recall: (2/3 + 2/3 + 3/4)/3 = (4/3 + 3/4)/3 = (25/12)/3 = 25/36 = 0.6944
         // F1: (4/5 + 4/7 + 3/4)/3 = (0.8 + 0.571428 + 0.75)/3 = 2.121428 / 3 = 0.7071
         const macro = computeMacroMetrics(perClass);
         assert.equal(macro.macro_precision, 0.75);
         assert.equal(macro.macro_recall, 0.6944);
         assert.equal(macro.macro_f1, 0.7071);

         // Micro: total TP = 7, total N = 10 -> 0.7
         const micro = computeMicroMetrics(conf);
         assert.equal(micro.micro_precision, 0.7);
         assert.equal(micro.micro_recall, 0.7);
         assert.equal(micro.micro_f1, 0.7);

         // Accuracy: 7/10 = 0.7
         const detailed = calculateDetailedMetrics(fixture);
         assert.equal(detailed.accuracy, 0.7);
         assert.equal(detailed.correct_count, 7);
         assert.equal(detailed.incorrect_count, 3);
         assert.equal(detailed.misclassified_count, 3);
         assert.deepEqual(detailed.misclassified_pairs.map((p) => p.pair_id), ["P3", "P6", "P10"]);
      });

      it("handles zero-division gracefully when a class has zero predictions or occurrences", () => {
         // Fixture where "related" is never predicted and never actual
         const zeroFixture = [
            { actual: "duplicate", predicted: "duplicate" },
            { actual: "duplicate", predicted: "independent" },
            { actual: "independent", predicted: "independent" },
         ];
         const detailed = calculateDetailedMetrics(zeroFixture);
         assert.equal(detailed.per_class.related.support, 0);
         assert.equal(detailed.per_class.related.precision, 0);
         assert.equal(detailed.per_class.related.recall, 0);
         assert.equal(detailed.per_class.related.f1, 0);
         assert.ok(Number.isFinite(detailed.macro_f1));
      });
   });

   describe("2. Deterministic Bootstrap Confidence Intervals", () => {
      it("generates deterministic Macro F1 bootstrap CI given fixed seed", () => {
         const fixture = [
            { actual: "duplicate", predicted: "duplicate" },
            { actual: "duplicate", predicted: "related" },
            { actual: "related", predicted: "related" },
            { actual: "related", predicted: "independent" },
            { actual: "independent", predicted: "independent" },
            { actual: "independent", predicted: "independent" },
         ];

         const runA = computeBootstrapMacroF1CI(fixture, { seed: 42, iterations: 500, confidenceLevel: 0.95 });
         const runB = computeBootstrapMacroF1CI(fixture, { seed: 42, iterations: 500, confidenceLevel: 0.95 });

         assert.deepEqual(runA, runB, "Identical seed and iterations must produce identical CI bounds");
         assert.equal(runA.metric, "macro_f1");
         assert.ok(runA.ci_lower <= runA.mean, "Lower bound must be <= mean");
         assert.ok(runA.mean <= runA.ci_upper, "Mean must be <= upper bound");
      });

      it("wider confidence level yields wider confidence interval", () => {
         const fixture = [
            { actual: "duplicate", predicted: "duplicate" },
            { actual: "duplicate", predicted: "related" },
            { actual: "related", predicted: "related" },
            { actual: "related", predicted: "independent" },
            { actual: "independent", predicted: "independent" },
         ];

         const ci90 = computeBootstrapMacroF1CI(fixture, { seed: 42, iterations: 1000, confidenceLevel: 0.90 });
         const ci99 = computeBootstrapMacroF1CI(fixture, { seed: 42, iterations: 1000, confidenceLevel: 0.99 });

         assert.ok(ci99.ci_lower <= ci90.ci_lower, "99% CI lower bound must be <= 90% CI lower bound");
         assert.ok(ci99.ci_upper >= ci90.ci_upper, "99% CI upper bound must be >= 90% CI upper bound");
      });
   });

   describe("3. Dataset Partition Loading and Leakage-Free Isolation", () => {
      it("verifies original dataset SHA-256 and loads all partitions correctly", () => {
         const data = loadDatasetPartitions();
         assert.equal(data.sourceChecksum, EXPECTED_CHECKSUM);

         assert.equal(data.partitions.train.length, 240);
         assert.equal(data.partitions.val.length, 80);
         assert.equal(data.partitions.test.length, 80);
         assert.equal(data.partitions.original_all.length, 400);
         assert.equal(data.partitions.challenge.length, 150);
      });

      it("confirms train, val, and test partitions are completely disjoint", () => {
         const data = loadDatasetPartitions();
         const trainIds = new Set(data.partitions.train.map((p) => p.pair_id));
         const valIds = new Set(data.partitions.val.map((p) => p.pair_id));
         const testIds = new Set(data.partitions.test.map((p) => p.pair_id));

         for (const id of trainIds) {
            assert.ok(!valIds.has(id), `Pair ${id} leaked between train and val`);
            assert.ok(!testIds.has(id), `Pair ${id} leaked between train and test`);
         }
         for (const id of valIds) {
            assert.ok(!testIds.has(id), `Pair ${id} leaked between val and test`);
         }
      });
   });

   describe("4. Evaluation Harness Execution and Baseline Fidelity", () => {
      it("evaluates a pair without throwing and returns complete feature metadata", () => {
         const data = loadDatasetPartitions();
         const samplePair = data.partitions.train[0];
         const evalResult = evaluatePair(samplePair, HISC_CONFIG);

         assert.equal(evalResult.pair_id, samplePair.pair_id);
         assert.ok(SUPPORTED_CLASSES.includes(evalResult.predicted));
         assert.ok(Number.isFinite(evalResult.score));
         assert.ok(evalResult.features && typeof evalResult.features === "object");
         assert.ok(Number.isFinite(evalResult.distance));
         assert.ok(Number.isFinite(evalResult.hours));
      });

      it("reproducibility check: running comprehensive baseline twice produces identical report data", () => {
         const run1 = runComprehensiveBaseline({ bootstrapIterations: 100 });
         const run2 = runComprehensiveBaseline({ bootstrapIterations: 100 });

         assert.deepEqual(run1.reportData, run2.reportData, "Harness baseline evaluation must be completely deterministic");
      });

      it("threshold sweep interface runs strictly on validation partition without modifying production config", () => {
         const data = loadDatasetPartitions();
         const originalDuplicateThreshold = HISC_CONFIG.duplicateThreshold;
         const originalRelatedThreshold = HISC_CONFIG.relatedThreshold;

         const sweep = runThresholdSweep(data.partitions.val, {
            duplicateThresholds: [0.60, 0.70],
            relatedThresholds: [0.35, 0.40],
         });

         assert.ok(sweep.evaluated_combinations > 0);
         assert.ok(sweep.best_validation_candidate);
         assert.equal(HISC_CONFIG.duplicateThreshold, originalDuplicateThreshold, "Production duplicateThreshold must not be mutated");
         assert.equal(HISC_CONFIG.relatedThreshold, originalRelatedThreshold, "Production relatedThreshold must not be mutated");
      });

      it("feature ablation interface evaluates models without mutating production config", () => {
         const data = loadDatasetPartitions();
         const ablations = runFeatureAblations("validation", data.partitions.val, HISC_CONFIG);

         assert.ok(ablations.full_model);
         assert.ok(ablations.ablations.no_category);
         assert.ok(ablations.ablations.no_geographic);
         assert.ok(ablations.ablations.no_lexical);
         assert.ok(ablations.ablations.no_semantic);
         assert.ok(ablations.ablations.no_temporal);

         assert.equal(HISC_CONFIG.weights.category, 0.2);
         assert.equal(HISC_CONFIG.weights.geographic, 0.25);
      });

      it("output artifacts exist on disk and match expected schema", () => {
         assert.ok(fs.existsSync(DEFAULT_PATHS.outputJson), "hisc_baseline_evaluation.json must exist");
         assert.ok(fs.existsSync(DEFAULT_PATHS.outputMd), "hisc_baseline_evaluation.md must exist");

         const jsonContent = JSON.parse(fs.readFileSync(DEFAULT_PATHS.outputJson, "utf8"));
         assert.ok(jsonContent.metadata);
         assert.ok(jsonContent.partitions.train);
         assert.ok(jsonContent.partitions.val);
         assert.ok(jsonContent.partitions.test);
         assert.ok(jsonContent.partitions.original_all);
         assert.ok(jsonContent.partitions.synthetic_challenge);
         assert.ok(jsonContent.validation_threshold_sweep);
         assert.ok(jsonContent.feature_ablations);
      });
   });
});
