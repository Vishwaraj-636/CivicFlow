import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   T5_PATHS,
   FEATURE_NAMES,
   HAND_SET_WEIGHTS,
   generateWeightSimplex,
   precomputePartitionFeatures,
   evaluateFastWeights,
   optimizeWeightsOnTrain,
   evaluateValidationComparison,
   runLearnedWeightsPipeline,
} from "../src/evaluation/learnHiscWeights.js";
import { DEFAULT_HISC_CONFIG } from "../src/hisc/config.js";
import { scorePair } from "../src/hisc/scorePair.js";
import { loadDatasetPartitions } from "../src/evaluation/hiscEvaluationHarness.js";
import { generateResultsReport } from "../src/evaluation/generateResultsReport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CIVICFLOW Phase T5 — Train-Only Learned HISC Weights", () => {
   describe("1. Simplex Generation and Mathematical Validity", () => {
      it("generates exactly 10,626 valid 5-feature simplex configurations with step 0.05", () => {
         const configs = generateWeightSimplex(0.05);
         assert.equal(configs.length, 10626);

         for (const c of configs) {
            // Verify all 5 features exist
            for (const feat of FEATURE_NAMES) {
               assert.ok(typeof c[feat] === "number", `Feature ${feat} must be number`);
               assert.ok(c[feat] >= 0 && c[feat] <= 1, `Weight ${feat}=${c[feat]} must be in [0, 1]`);

               // Must be exact multiple of 0.05
               const remainder = Math.round(c[feat] * 100) % 5;
               assert.equal(remainder, 0, `Weight ${c[feat]} must be a multiple of 0.05`);
            }

            // Must sum to exactly 1.0 within tolerance
            const sum = c.category + c.geographic + c.lexical + c.semantic + c.temporal;
            assert.ok(Math.abs(sum - 1.0) < 1e-6, `Weights sum ${sum} must equal 1.0`);
         }
      });

      it("simplex generation is strictly deterministic across multiple invocations", () => {
         const c1 = generateWeightSimplex(0.05);
         const c2 = generateWeightSimplex(0.05);

         assert.equal(c1.length, c2.length);
         assert.deepEqual(c1[0], c2[0]);
         assert.deepEqual(c1[5000], c2[5000]);
         assert.deepEqual(c1[10625], c2[10625]);
      });
   });

   describe("2. Sensitivity: Candidate Weights Actively Affect Scoring", () => {
      it("proves changing candidate weights alters the score when feature values differ", () => {
         const complaintA = {
            category: "Roads & Transport",
            text: "Deep pothole on outer ring road junction",
            location: { coordinates: [80.20, 13.00] },
            createdAt: "2026-10-01T10:00:00Z",
         };

         // Same category (catSim = 1.0), different text (lexical = 0), same location (geo = 1.0)
         const complaintB = {
            category: "Roads & Transport",
            text: "Unrelated asphalt breakdown near flyover pillar",
            location: { coordinates: [80.20, 13.00] },
            createdAt: "2026-10-01T10:00:00Z",
         };

         // Weight set 1: heavy category & geographic (features are ~1.0)
         const weightsHigh = { category: 0.50, geographic: 0.50, lexical: 0.00, semantic: 0.00, temporal: 0.00 };
         // Weight set 2: heavy lexical & semantic (features are ~0.0)
         const weightsLow = { category: 0.00, geographic: 0.00, lexical: 0.50, semantic: 0.50, temporal: 0.00 };

         const resHigh = scorePair(complaintA, complaintB, { weights: weightsHigh });
         const resLow = scorePair(complaintA, complaintB, { weights: weightsLow });

         assert.ok(resHigh.score > resLow.score + 0.50, "Scores must differ significantly when weights change");
         assert.ok(resHigh.score >= 0.90, "resHigh score should be near 1.0");
         assert.ok(resLow.score <= 0.30, "resLow score should be low");
      });
   });

   describe("3. Train-Only Optimization & Reproducibility", () => {
      it("optimizes weights strictly on train partition without consulting validation labels", () => {
         const ds = loadDatasetPartitions();
         const trainPairs = ds.partitions.train;
         assert.equal(trainPairs.length, 240);

         const optResult = optimizeWeightsOnTrain(trainPairs);

         assert.equal(optResult.totalCandidatesExamined, 10626);
         assert.ok(optResult.perfectCandidatesCount > 0);
         assert.ok(optResult.learnedWeights);

         // Weights must be valid simplex
         const sum = Object.values(optResult.learnedWeights).reduce((a, b) => a + b, 0);
         assert.ok(Math.abs(sum - 1.0) < 1e-6);

         // Training accuracy and macro F1 must reproduce the recorded training metrics
         assert.equal(optResult.trainMetrics.accuracy, 1);
         assert.equal(optResult.trainMetrics.macro_f1, 1);
      });

      it("reproduces identical learned weights from disk artifact", () => {
         assert.ok(fs.existsSync(T5_PATHS.t5ValidationJson), "t5_learned_weights_validation.json must exist");
         const data = JSON.parse(fs.readFileSync(T5_PATHS.t5ValidationJson, "utf8"));

         assert.deepEqual(data.learned_weights, {
            category: 0,
            geographic: 0.3,
            lexical: 0,
            semantic: 0.4,
            temporal: 0.3,
         });
         assert.equal(data.optimization_spec.total_configurations_examined, 10626);
      });
   });

   describe("4. Validation-Only Selection & Exact Tie-Break Rule", () => {
      it("compares frozen learned weights against hand-set baseline on validation split", () => {
         const ds = loadDatasetPartitions();
         const valPairs = ds.partitions.val;
         assert.equal(valPairs.length, 80);

         const learnedWeights = {
            category: 0,
            geographic: 0.3,
            lexical: 0,
            semantic: 0.4,
            temporal: 0.3,
         };

         const comparison = evaluateValidationComparison(valPairs, learnedWeights, HAND_SET_WEIGHTS);

         assert.equal(comparison.handSetMetrics.macro_f1, 1);
         assert.equal(comparison.learnedMetrics.macro_f1, 1);
         assert.equal(comparison.outcome, "tie");
         assert.equal(comparison.winningConfig, "hand_set");
         assert.match(comparison.justification, /tie-break rule/i);
      });

      it("production default HISC weights remain completely unmodified", () => {
         assert.deepEqual(DEFAULT_HISC_CONFIG.weights, {
            category: 0.20,
            geographic: 0.25,
            lexical: 0.10,
            semantic: 0.30,
            temporal: 0.15,
         });
         assert.deepEqual(HAND_SET_WEIGHTS, DEFAULT_HISC_CONFIG.weights);
      });
   });

   describe("5. Artifact Schema and Safety Declarations", () => {
      it("verifies t5_learned_weights_validation.json schema and required metadata", () => {
         const data = JSON.parse(fs.readFileSync(T5_PATHS.t5ValidationJson, "utf8"));

         assert.equal(data.metadata.evaluation_phase, "T5 — Train-Only Learned HISC Weights");
         assert.ok(data.metadata.timestamp);
         assert.ok(data.metadata.git_commit);
         assert.equal(data.metadata.seed, 42);
         assert.equal(data.metadata.source_dataset, "civicflow_400_labeled_complaint_pairs.csv");

         // Safety declarations
         assert.equal(data.metadata.safety_declarations.train_only_optimization, true);
         assert.equal(data.metadata.safety_declarations.validation_only_selection, true);
         assert.equal(data.metadata.safety_declarations.test_and_challenge_withheld, true);
         assert.equal(data.metadata.safety_declarations.production_defaults_unmodified, true);

         // Deferred experiments declaration
         assert.ok(data.deferred_experiments.embedding_weight_optimization);
      });

      it("verifies learned_weights.json and t5_learned_weights_validation.md exist", () => {
         assert.ok(fs.existsSync(T5_PATHS.learnedWeightsJson));
         assert.ok(fs.existsSync(T5_PATHS.t5ValidationMd));

         const summary = JSON.parse(fs.readFileSync(T5_PATHS.learnedWeightsJson, "utf8"));
         assert.equal(summary.selected_for_production, false);
         assert.equal(summary.retained_configuration, "hand_set_baseline");

         const md = fs.readFileSync(T5_PATHS.t5ValidationMd, "utf8");
         assert.ok(md.includes("# CivicFlow Research Evaluation — T5: Train-Only Learned HISC Weights"));
         assert.ok(md.includes("## 2. Weight Comparison: Hand-Set vs Train-Learned"));
      });
   });

   describe("6. Report Generator Integration", () => {
      it("incorporates verified T5 learned weights into Section I of docs/RESULTS.md", () => {
         const res = generateResultsReport();
         const md = res.markdown;

         assert.ok(md.includes("## I. Learned Weights"));
         assert.ok(md.includes("Weight Comparison: Hand-Set vs Train-Learned"));
         assert.ok(md.includes("Hand-Set Baseline"));
         assert.ok(md.includes("Train-Learned Weights"));
         assert.ok(md.includes("Configuration Selection Decision:"));
         assert.ok(md.includes("hand-set baseline is retained"));

         // Verify Section K manifest
         assert.ok(md.includes("`BACKEND/results/t5_learned_weights_validation.json`"));
         assert.ok(md.includes("`BACKEND/results/learned_weights.json`"));
         assert.ok(md.includes("`BACKEND/results/t5_learned_weights_validation.md`"));

         // Verify Section E still marks test and challenge as pending
         assert.ok(md.includes("Pending final evaluation"));
      });
   });
});
