import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   DEFAULT_PATHS,
   loadDatasetPartitions,
   UNIFORM_THRESHOLD_GRID,
   ADMISSIBLE_THRESHOLD_PAIRS,
   DETERMINISTIC_TIE_BREAK_RULE,
   compareCandidatesDeterministic,
   getComplaintText,
   computeTextJaccard,
   scoreB1_TextJaccard,
   scoreB2_DistanceOnly,
   scoreB3_CategoryDistance,
   fitTfIdf,
   scoreB4_TfIdf,
   scoreB5_TfIdfDistance,
   scoreHisc,
   classifyScoreByThresholds,
   validateTuningPartition,
   tuneMethodThresholds,
   runT1ValidationEvaluation,
   formatT1ValidationMarkdown,
} from "../src/evaluation/hiscEvaluationHarness.js";
import { DEFAULT_HISC_CONFIG } from "../src/hisc/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CIVICFLOW Phase T1 — Fair Baselines and Validation Tuning", () => {
   describe("1. Baseline Scoring Functions Mathematical Correctness", () => {
      it("B1 text Jaccard computes exact token set intersection over union", () => {
         const t1 = "Pothole on main road";
         const t2 = "Pothole on main road";
         assert.equal(computeTextJaccard(t1, t2), 1.0);

         const t3 = "Water leakage in pipe";
         assert.equal(computeTextJaccard(t1, t3), 0.0);

         // t1 has tokens {pothole, on, main, road} (4 tokens)
         // t4 has tokens {pothole, near, main, road} (4 tokens)
         // intersection = {pothole, main, road} (3), union = {pothole, on, main, road, near} (5) -> 3/5 = 0.6
         const t4 = "Pothole near main road";
         assert.equal(computeTextJaccard(t1, t4), 0.6);

         // Empty texts return 0
         assert.equal(computeTextJaccard("", ""), 0.0);
      });

      it("B2 distance similarity scales continuously with negative exponential", () => {
         // Same coordinates (distance = 0)
         const pairZeroDist = {
            complaint_a: { location: { coordinates: [80.12, 12.92] } },
            complaint_b: { location: { coordinates: [80.12, 12.92] } },
         };
         assert.equal(scoreB2_DistanceOnly(pairZeroDist), 1.0);

         // Coordinates with missing/invalid location return 0
         const pairInvalid = {
            complaint_a: { location: { coordinates: null } },
            complaint_b: { location: { coordinates: [80.12, 12.92] } },
         };
         assert.equal(scoreB2_DistanceOnly(pairInvalid), 0.0);
      });

      it("B3 category plus distance combines categorical and spatial affinity equally (50/50)", () => {
         const pair = {
            complaint_a: { category: "Roads & Transport", location: { coordinates: [80.12, 12.92] } },
            complaint_b: { category: "Roads & Transport", location: { coordinates: [80.12, 12.92] } },
         };
         // Same category (1.0) and distance 0 (1.0) -> 0.5 * 1 + 0.5 * 1 = 1.0
         assert.equal(scoreB3_CategoryDistance(pair), 1.0);
      });

      it("B4 TF-IDF cosine produces bounded similarity in [0, 1]", () => {
         const dummyTrain = [
            {
               complaint_a: { title: "Road crater damage" },
               complaint_b: { title: "Pothole road issue" },
            },
            {
               complaint_a: { title: "Streetlight broken dark" },
               complaint_b: { title: "Light pole off" },
            },
         ];
         const model = fitTfIdf(dummyTrain);
         assert.ok(model.vocabularySize > 0);

         const identicalPair = {
            complaint_a: { title: "Road crater damage" },
            complaint_b: { title: "Road crater damage" },
         };
         assert.equal(scoreB4_TfIdf(identicalPair, model), 1.0);

         const disjointPair = {
            complaint_a: { title: "Road crater damage" },
            complaint_b: { title: "Streetlight broken dark" },
         };
         assert.equal(scoreB4_TfIdf(disjointPair, model), 0.0);
      });

      it("B5 TF-IDF + geographic distance strictly follows fixed 60/40 combination formula", () => {
         const dummyTrain = [
            {
               complaint_a: { title: "Road crater damage" },
               complaint_b: { title: "Pothole road issue" },
            },
         ];
         const model = fitTfIdf(dummyTrain);

         const pair = {
            complaint_a: { title: "Road crater damage", location: { coordinates: [80.12, 12.92] } },
            complaint_b: { title: "Road crater damage", location: { coordinates: [80.12, 12.92] } },
         };
         const sim = scoreB4_TfIdf(pair, model);
         const geo = scoreB2_DistanceOnly(pair);
         const expected = 0.6 * sim + 0.4 * geo;

         assert.equal(scoreB5_TfIdfDistance(pair, model), expected);
      });

      it("HISC baseline preserves hand-fixed defaults (0.20 cat, 0.25 geo, 0.10 lex, 0.30 sem, 0.15 time)", () => {
         assert.equal(DEFAULT_HISC_CONFIG.weights.category, 0.20);
         assert.equal(DEFAULT_HISC_CONFIG.weights.geographic, 0.25);
         assert.equal(DEFAULT_HISC_CONFIG.weights.lexical, 0.10);
         assert.equal(DEFAULT_HISC_CONFIG.weights.semantic, 0.30);
         assert.equal(DEFAULT_HISC_CONFIG.weights.temporal, 0.15);
         assert.equal(DEFAULT_HISC_CONFIG.duplicateThreshold, 0.60);
         assert.equal(DEFAULT_HISC_CONFIG.relatedThreshold, 0.35);
      });
   });

   describe("2. Train-Only TF-IDF Isolation and No Leakage", () => {
      it("fits TF-IDF strictly on train pairs and ignores novel validation/challenge words", () => {
         const { partitions } = loadDatasetPartitions();
         const tfidfModel = fitTfIdf(partitions.train);

         // Confirm fitted vocabulary is non-empty and finite
         assert.equal(tfidfModel.trainDocCount, 480);
         assert.ok(tfidfModel.vocabularySize > 50);

         const vocabBefore = new Set(tfidfModel.vocabulary.keys());

         // Vectorize text with completely novel words that never appear in train
         const novelText = "quantumteleportation unseensuperstring artificialexoticconcept";
         const v = tfidfModel.vectorize(novelText);

         // Vector must have norm 0 because none of the words exist in train vocabulary
         assert.equal(v.norm, 0);
         assert.equal(v.weights.size, 0);

         // Model vocabulary must remain completely unaltered
         assert.equal(tfidfModel.vocabulary.size, vocabBefore.size);
         for (const word of ["quantumteleportation", "unseensuperstring", "artificialexoticconcept"]) {
            assert.equal(tfidfModel.vocabulary.has(word), false);
         }
      });
   });

   describe("3. Deterministic Threshold Tuning and Tie-Breaking", () => {
      it("uniform threshold grid contains exactly 136 admissible pairs in [0.10, 0.90] with step 0.05", () => {
         assert.equal(UNIFORM_THRESHOLD_GRID.length, 17);
         assert.equal(UNIFORM_THRESHOLD_GRID[0], 0.10);
         assert.equal(UNIFORM_THRESHOLD_GRID[16], 0.90);

         assert.equal(ADMISSIBLE_THRESHOLD_PAIRS.length, 136);
         for (const pair of ADMISSIBLE_THRESHOLD_PAIRS) {
            assert.ok(pair.duplicateThreshold > pair.relatedThreshold, "Duplicate threshold must be strictly greater than related");
            assert.ok(pair.duplicateThreshold >= 0.10 && pair.duplicateThreshold <= 0.90);
            assert.ok(pair.relatedThreshold >= 0.10 && pair.relatedThreshold <= 0.90);
         }
      });

      it("deterministic tie-break resolves ties predictably across multi-level criteria", () => {
         // Level 1: macro_f1
         const a1 = { macro_f1: 0.85, accuracy: 0.80, dup_f1: 0.80, rel_f1: 0.80, duplicate_threshold: 0.6, related_threshold: 0.3 };
         const b1 = { macro_f1: 0.80, accuracy: 0.90, dup_f1: 0.90, rel_f1: 0.90, duplicate_threshold: 0.6, related_threshold: 0.3 };
         assert.ok(compareCandidatesDeterministic(a1, b1) > 0);

         // Level 2: accuracy (macro_f1 tied)
         const a2 = { macro_f1: 0.80, accuracy: 0.85, dup_f1: 0.70, rel_f1: 0.70, duplicate_threshold: 0.6, related_threshold: 0.3 };
         const b2 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.90, rel_f1: 0.90, duplicate_threshold: 0.6, related_threshold: 0.3 };
         assert.ok(compareCandidatesDeterministic(a2, b2) > 0);

         // Level 3: duplicate F1 (macro_f1 and accuracy tied)
         const a3 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.85, rel_f1: 0.70, duplicate_threshold: 0.6, related_threshold: 0.3 };
         const b3 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.75, rel_f1: 0.80, duplicate_threshold: 0.6, related_threshold: 0.3 };
         assert.ok(compareCandidatesDeterministic(a3, b3) > 0);

         // Level 4: related F1 (macro_f1, accuracy, dup_f1 tied)
         const a4 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.80, rel_f1: 0.85, duplicate_threshold: 0.6, related_threshold: 0.3 };
         const b4 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.80, rel_f1: 0.75, duplicate_threshold: 0.6, related_threshold: 0.3 };
         assert.ok(compareCandidatesDeterministic(a4, b4) > 0);

         // Level 5: margin (dt - rt) (all metrics tied)
         const a5 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.80, rel_f1: 0.80, duplicate_threshold: 0.7, related_threshold: 0.2 }; // margin 0.5
         const b5 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.80, rel_f1: 0.80, duplicate_threshold: 0.6, related_threshold: 0.3 }; // margin 0.3
         assert.ok(compareCandidatesDeterministic(a5, b5) > 0);

         // Level 6: lexicographical (all metrics and margin tied)
         const a6 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.80, rel_f1: 0.80, duplicate_threshold: 0.7, related_threshold: 0.4 }; // margin 0.3
         const b6 = { macro_f1: 0.80, accuracy: 0.80, dup_f1: 0.80, rel_f1: 0.80, duplicate_threshold: 0.6, related_threshold: 0.3 }; // margin 0.3
         assert.ok(compareCandidatesDeterministic(a6, b6) > 0);
      });
   });

   describe("4. Partition Isolation and Data Leakage Guards", () => {
      it("validateTuningPartition throws error when challenge pairs are passed", () => {
         const challengePair = {
            pair_id: "CH001",
            challenge_category: "cross_infrastructure",
            label: "related",
         };
         assert.throws(() => validateTuningPartition([challengePair]), /Data leakage violation.*Challenge set pair/);
      });

      it("validateTuningPartition throws error when held-out test pairs are passed", () => {
         const testPair = {
            pair_id: "P0001",
            split: "test",
            label: "duplicate",
         };
         assert.throws(() => validateTuningPartition([testPair]), /Data leakage violation.*Held-out test pair/);
      });

      it("validateTuningPartition permits valid validation pairs", () => {
         const { partitions } = loadDatasetPartitions();
         assert.doesNotThrow(() => validateTuningPartition(partitions.val));
      });
   });

   describe("5. End-to-End T1 Validation Evaluation Runner", () => {
      it("executes T1 validation evaluation and generates complete results artifact", () => {
         const report = runT1ValidationEvaluation({
            gitCommit: "040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb",
            seed: 42,
         });

         assert.ok(report.metadata);
         assert.equal(report.metadata.evaluation_phase, "T1 — Fair Baselines and Validation Tuning");
         assert.equal(report.metadata.git_commit, "040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb");
         assert.equal(report.metadata.seed, 42);
         assert.equal(report.metadata.partition_sizes.val, 80);

         // Confirm all 6 methods are present
         const expectedMethods = ["HISC", "B1_jaccard", "B2_distance", "B3_cat_distance", "B4_tfidf", "B5_tfidf_distance"];
         for (const id of expectedMethods) {
            assert.ok(report.methods[id], `Method ${id} must be included in T1 report`);
            const m = report.methods[id];
            assert.ok(m.selected_thresholds.duplicate > m.selected_thresholds.related);
            assert.equal(m.tuning_summary.evaluated_combinations, 136);
            assert.ok(m.validation_metrics.macro_f1 >= 0 && m.validation_metrics.macro_f1 <= 1);
            assert.equal(m.raw_predictions.length, 80);
         }

         // Confirm test and challenge splits are NOT evaluated in report
         assert.ok(!report.partitions?.test, "Test partition must NOT be evaluated in T1 report");
         assert.ok(!report.partitions?.challenge, "Challenge set must NOT be evaluated in T1 report");

         // Confirm output artifact exists on disk
         assert.ok(fs.existsSync(DEFAULT_PATHS.t1ValidationJson));
         assert.ok(fs.existsSync(DEFAULT_PATHS.t1ValidationMd));
      });
   });
});
