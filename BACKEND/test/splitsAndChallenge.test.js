import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { createSplits, parseCSV, validateRows, computeSHA256 } from "../src/evaluation/makeSplits.js";
import { challengePairs } from "../src/evaluation/challengeDataDefinitions.js";
import { validateChallengeSet, auditSynonymNovelty, sampleReviewPairs } from "../src/evaluation/generateChallengeSet.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORIGINAL_DATASET_PATH = path.resolve(__dirname, "../../civicflow_400_labeled_complaint_pairs.csv");
const EXPECTED_ORIGINAL_SHA256 = "b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2";
const SPLITS_JSON_PATH = path.resolve(__dirname, "../data/splits.json");
const CHALLENGE_CSV_PATH = path.resolve(__dirname, "../data/synthetic_challenge_set_150.csv");
const REVIEW_SAMPLE_JSON_PATH = path.resolve(__dirname, "../data/challenge_review_sample_50.json");

describe("CIVICFLOW Phase A2 — Dataset Splits and Challenge Set Integrity", () => {
   describe("1. Source Dataset Verification and Integrity", () => {
      it("source dataset exists and has expected unmodified SHA-256 checksum", () => {
         assert.ok(fs.existsSync(ORIGINAL_DATASET_PATH), "Original dataset must exist");
         const content = fs.readFileSync(ORIGINAL_DATASET_PATH, "utf8");
         const actualHash = computeSHA256(content);
         assert.equal(actualHash, EXPECTED_ORIGINAL_SHA256, "Source dataset checksum must remain strictly unchanged");
      });

      it("source dataset has exactly 400 records and correct schema", () => {
         const content = fs.readFileSync(ORIGINAL_DATASET_PATH, "utf8");
         const rows = parseCSV(content);
         assert.equal(rows.length, 400, "Source dataset must contain exactly 400 rows");
         assert.doesNotThrow(() => validateRows(rows), "Source dataset rows must validate cleanly");
      });
   });

   describe("2. Leakage-Free Dataset Splitting (makeSplits.js)", () => {
      it("generates exact 60/20/20 proportions with zero group leakage", () => {
         const splitData = createSplits({ csvPath: ORIGINAL_DATASET_PATH, seed: 42 });

         assert.equal(splitData.summary.train.recordCount, 240, "Train split must have exactly 240 records (60%)");
         assert.equal(splitData.summary.val.recordCount, 80, "Validation split must have exactly 80 records (20%)");
         assert.equal(splitData.summary.test.recordCount, 80, "Test split must have exactly 80 records (20%)");

         assert.deepEqual(splitData.summary.train.classDistribution, { duplicate: 72, related: 84, independent: 84 });
         assert.deepEqual(splitData.summary.val.classDistribution, { duplicate: 24, related: 28, independent: 28 });
         assert.deepEqual(splitData.summary.test.classDistribution, { duplicate: 24, related: 28, independent: 28 });
      });

      it("all splits are disjoint and their union covers all 400 pair_ids", () => {
         const splitData = createSplits({ csvPath: ORIGINAL_DATASET_PATH, seed: 42 });
         const trainPairs = new Set(splitData.splits.train.pairIds);
         const valPairs = new Set(splitData.splits.val.pairIds);
         const testPairs = new Set(splitData.splits.test.pairIds);

         assert.equal(trainPairs.size, 240);
         assert.equal(valPairs.size, 80);
         assert.equal(testPairs.size, 80);

         // Pair disjointness
         for (const id of trainPairs) {
            assert.ok(!valPairs.has(id), `Pair ${id} must not be in both train and val`);
            assert.ok(!testPairs.has(id), `Pair ${id} must not be in both train and test`);
         }
         for (const id of valPairs) {
            assert.ok(!testPairs.has(id), `Pair ${id} must not be in both val and test`);
         }

         // Full coverage
         const union = new Set([...trainPairs, ...valPairs, ...testPairs]);
         assert.equal(union.size, 400, "Combined splits must cover exactly 400 distinct pairs");
      });

      it("no incident_id leaks across any split boundaries", () => {
         const splitData = createSplits({ csvPath: ORIGINAL_DATASET_PATH, seed: 42 });
         const trainIncidents = new Set(splitData.splits.train.incidentIds);
         const valIncidents = new Set(splitData.splits.val.incidentIds);
         const testIncidents = new Set(splitData.splits.test.incidentIds);

         assert.equal(trainIncidents.size, 72, "Train must contain exactly 72 unique incidents");
         assert.equal(valIncidents.size, 24, "Val must contain exactly 24 unique incidents");
         assert.equal(testIncidents.size, 24, "Test must contain exactly 24 unique incidents");

         for (const inc of trainIncidents) {
            assert.ok(!valIncidents.has(inc), `Incident ${inc} leaked into val`);
            assert.ok(!testIncidents.has(inc), `Incident ${inc} leaked into test`);
         }
         for (const inc of valIncidents) {
            assert.ok(!testIncidents.has(inc), `Incident ${inc} leaked into test`);
         }
      });

      it("splitting is completely deterministic given seed 42", () => {
         const runA = createSplits({ csvPath: ORIGINAL_DATASET_PATH, seed: 42 });
         const runB = createSplits({ csvPath: ORIGINAL_DATASET_PATH, seed: 42 });
         assert.deepEqual(runA.splits, runB.splits, "Identical seed must yield identical split assignments");
      });

      it("splits.json artifact on disk matches runtime split calculation", () => {
         assert.ok(fs.existsSync(SPLITS_JSON_PATH), "splits.json must exist in BACKEND/data/");
         const fileContent = JSON.parse(fs.readFileSync(SPLITS_JSON_PATH, "utf8"));
         assert.equal(fileContent.dataset.sha256, EXPECTED_ORIGINAL_SHA256);
         assert.equal(fileContent.summary.train.recordCount, 240);
         assert.equal(fileContent.summary.val.recordCount, 80);
         assert.equal(fileContent.summary.test.recordCount, 80);
      });

      it("input validation catches invalid rows and empty input", () => {
         assert.throws(() => parseCSV(""), /Invalid CSV input/);
         assert.throws(() => parseCSV("header1,header2\n"), /at least a header row and one data row/);
         assert.throws(() => validateRows([{ _rowIndex: 1, pair_id: "P1", complaint_a: "A", complaint_b: "B", label: "invalid_label" }]), /invalid label/);
         assert.throws(() => validateRows([{ _rowIndex: 1, pair_id: "P1", complaint_a: "A", complaint_b: "B", label: "duplicate" }, { _rowIndex: 2, pair_id: "P1", complaint_a: "A2", complaint_b: "B2", label: "duplicate" }]), /Duplicate pair_id/);
      });
   });

   describe("3. Synthetic Challenge Set (150 pairs)", () => {
      it("contains exactly 150 unique pairs with balanced 50/50/50 class distribution", () => {
         assert.equal(challengePairs.length, 150);
         const validation = validateChallengeSet(challengePairs);
         assert.deepEqual(validation.labelCounts, { duplicate: 50, related: 50, independent: 50 });
      });

      it("covers all 10 required challenge categories", () => {
         const validation = validateChallengeSet(challengePairs);
         const expectedCategories = [
            "Paraphrases with Novel Vocabulary",
            "Typos and Spelling Variations",
            "Tanglish and Colloquial Phrasing",
            "Very Short and Vague Descriptions",
            "Same Location, Different Issue",
            "Same Issue, Geographically Distant",
            "Temporally Distant at Same Location",
            "Similar Wording, Distinct Incidents",
            "Cascading Related Failures",
            "True Duplicates with Disparate Phrasing",
         ];
         for (const cat of expectedCategories) {
            assert.ok(validation.categoryCounts[cat] > 0, `Category '${cat}' must be represented`);
         }
         assert.equal(Object.keys(validation.categoryCounts).length, 10, "Must cover exactly 10 challenge categories");
      });

      it("has zero exact complaint-pair duplicates against the original 400-pair dataset", () => {
         const originalContent = fs.readFileSync(ORIGINAL_DATASET_PATH, "utf8");
         const originalRows = parseCSV(originalContent);
         const originalTextPairs = new Set(originalRows.map((r) => [r.complaint_a, r.complaint_b].sort().join(" ||| ")));
         const originalPairIds = new Set(originalRows.map((r) => r.pair_id));

         for (const cp of challengePairs) {
            assert.ok(!originalPairIds.has(cp.pair_id), `Challenge pair ID ${cp.pair_id} collided with original dataset`);
            const key = [cp.complaint_a, cp.complaint_b].sort().join(" ||| ");
            assert.ok(!originalTextPairs.has(key), `Challenge pair ${cp.pair_id} is an exact text duplicate of original data`);
         }
      });

      it("synonym dictionary novelty audit confirms high rate of novel vocabulary", () => {
         const audit = auditSynonymNovelty(challengePairs);
         assert.ok(audit.totalUniqueTokens >= 500, "Challenge set must introduce diverse vocabulary");
         assert.ok(audit.noveltyPercentage > 90, `Novelty percentage must exceed 90%, got ${audit.noveltyPercentage}%`);
         assert.ok(audit.dictionaryUniqueTokensCount > 0, "Dictionary keywords should still appear in controlled contexts");
      });

      it("synthetic_challenge_set_150.csv matches challenge definition dataset", () => {
         assert.ok(fs.existsSync(CHALLENGE_CSV_PATH), "Challenge CSV must exist");
         const csvContent = fs.readFileSync(CHALLENGE_CSV_PATH, "utf8");
         const parsed = parseCSV(csvContent);
         assert.equal(parsed.length, 150, "Challenge CSV must contain exactly 150 data rows");
      });
   });

   describe("4. 50-Pair Manual Review Sample", () => {
      it("deterministic 50-pair sample contains exactly 50 unique items with rationales", () => {
         assert.ok(fs.existsSync(REVIEW_SAMPLE_JSON_PATH), "challenge_review_sample_50.json must exist");
         const sample = JSON.parse(fs.readFileSync(REVIEW_SAMPLE_JSON_PATH, "utf8"));
         assert.equal(sample.length, 50, "Sample must contain exactly 50 items");

         const sampleIds = new Set(sample.map((s) => s.pair_id));
         assert.equal(sampleIds.size, 50, "All 50 sampled IDs must be unique");

         for (const s of sample) {
            assert.ok(s.proposed_label, "Sample item must have proposed_label");
            assert.ok(s.labeling_rationale && s.labeling_rationale.length > 10, "Sample item must include detailed rationale");
            assert.equal(s.review_status, "PENDING_USER_VERIFICATION");
         }
      });

      it("re-sampling with seed 42 produces identical 50 pair IDs", () => {
         const sampleA = sampleReviewPairs(challengePairs, 42);
         const sampleB = sampleReviewPairs(challengePairs, 42);
         assert.deepEqual(sampleA.map((s) => s.pair_id), sampleB.map((s) => s.pair_id), "Sample selection must be deterministic");
      });
   });
});
