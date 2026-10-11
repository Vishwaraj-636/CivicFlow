import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   normalizeText,
   tokenizeText,
   computeJaccard,
   runDatasetLeakageAudit,
} from "../src/evaluation/datasetLeakageAudit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Task B — Dataset Leakage Audit and Split Isolation", () => {
   describe("1. Utility and Normalization Functions", () => {
      it("normalizes text cleanly and conservatively", () => {
         const raw = "  Water is LEAKING... from a pipe (near Tambaram)!  \n";
         const expected = "water is leaking from a pipe near tambaram";
         assert.equal(normalizeText(raw), expected);
      });

      it("tokenizes normalized text into word sets", () => {
         const tokens = tokenizeText("pipe leaking leaking water");
         assert.equal(tokens.size, 3);
         assert.ok(tokens.has("pipe"));
         assert.ok(tokens.has("leaking"));
         assert.ok(tokens.has("water"));
      });

      it("computes exact Jaccard similarity between token sets", () => {
         const setA = new Set(["road", "damaged", "repair", "pothole"]);
         const setB = new Set(["road", "damaged", "crater"]);
         // intersection: {road, damaged} (2)
         // union: {road, damaged, repair, pothole, crater} (5)
         // Jaccard: 2 / 5 = 0.40
         assert.equal(computeJaccard(setA, setB), 0.4);

         assert.equal(computeJaccard(setA, setA), 1.0);
         assert.equal(computeJaccard(new Set(), new Set()), 0);
      });
   });

   describe("2. Full Dataset Leakage Audit Execution", () => {
      it("executes audit on authoritative dataset and split files with zero identifier leakage", () => {
         const audit = runDatasetLeakageAudit();

         // Check split counts
         assert.equal(audit.splitVerifications.train.count, 240);
         assert.equal(audit.splitVerifications.val.count, 80);
         assert.equal(audit.splitVerifications.test.count, 80);
         assert.equal(audit.splitVerifications.total400, 400);
         assert.equal(audit.splitVerifications.totalChallenge, 150);

         // Check zero identifier overlap
         const incOverlap = audit.identifierOverlap.incidentIds.crossSplitOverlap;
         assert.equal(incOverlap.trainVal.length, 0);
         assert.equal(incOverlap.trainTest.length, 0);
         assert.equal(incOverlap.valTest.length, 0);
         assert.equal(incOverlap.datasetVsChallenge.length, 0);

         const compOverlap = audit.identifierOverlap.complaintIds.crossSplitOverlap;
         assert.equal(compOverlap.trainVal.length, 0);
         assert.equal(compOverlap.trainTest.length, 0);
         assert.equal(compOverlap.valTest.length, 0);
         assert.equal(compOverlap.datasetVsChallenge.length, 0);

         // Check challenge set text isolation
         assert.equal(audit.textOverlap.dataset400VsChallenge.exactMatchInstances, 0);
         assert.equal(audit.textOverlap.dataset400VsChallenge.nearDuplicateMatchInstances, 0);
         assert.equal(audit.textOverlap.dataset400VsChallenge.sharedUniqueTextsCount, 0);
      });

      it("verifies saved report artifacts exist and match schema", () => {
         const jsonPath = path.resolve(__dirname, "../results/dataset_leakage_audit.json");
         const mdPath = path.resolve(__dirname, "../results/dataset_leakage_audit.md");

         assert.ok(fs.existsSync(jsonPath), "dataset_leakage_audit.json should exist");
         assert.ok(fs.existsSync(mdPath), "dataset_leakage_audit.md should exist");

         const saved = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
         assert.equal(saved.splitVerifications.total400, 400);
         assert.ok(saved.checksums.datasetCsv);
         assert.ok(saved.keyFindings.templateTextLeakageIn400Dataset);
      });
   });
});
