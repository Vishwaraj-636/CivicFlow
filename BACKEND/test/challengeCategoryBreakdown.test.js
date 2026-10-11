import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   buildAuthoritativeCategoryMap,
   resolveAndValidateCategory,
   computeChallengeCategoryBreakdown,
   EXPECTED_CHALLENGE_CATEGORIES,
   TARGET_METHODS,
} from "../src/evaluation/challengeCategoryBreakdown.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Task C — Challenge Category Breakdown and Validation", () => {
   describe("1. Authoritative Challenge Category Definitions and Mapping", () => {
      it("builds a verified 1:1 map of all 150 challenge pairs to their categories", () => {
         const categoryMap = buildAuthoritativeCategoryMap();
         assert.equal(categoryMap.size, 150);

         const uniqueCategories = new Set(categoryMap.values());
         assert.equal(uniqueCategories.size, 10);

         for (const cat of EXPECTED_CHALLENGE_CATEGORIES) {
            assert.ok(uniqueCategories.has(cat), `Expected category '${cat}' should be present in map`);
         }
      });

      it("verifies expected sample count for all 10 challenge categories", () => {
         const categoryMap = buildAuthoritativeCategoryMap();
         const counts = {};
         for (const cat of categoryMap.values()) {
            counts[cat] = (counts[cat] || 0) + 1;
         }

         assert.equal(counts["Paraphrases with Novel Vocabulary"], 15);
         assert.equal(counts["Typos and Spelling Variations"], 15);
         assert.equal(counts["Tanglish and Colloquial Phrasing"], 15);
         assert.equal(counts["Very Short and Vague Descriptions"], 15);
         assert.equal(counts["Same Location, Different Issue"], 15);
         assert.equal(counts["Same Issue, Geographically Distant"], 15);
         assert.equal(counts["Temporally Distant at Same Location"], 10);
         assert.equal(counts["Similar Wording, Distinct Incidents"], 13);
         assert.equal(counts["Cascading Related Failures"], 15);
         assert.equal(counts["True Duplicates with Disparate Phrasing"], 22);

         const total = Object.values(counts).reduce((a, b) => a + b, 0);
         assert.equal(total, 150);
      });
   });

   describe("2. Fail-Fast Validation Against Missing / Default 'standard' Categories", () => {
      it("throws when a prediction pair_id is not present in authoritative map", () => {
         const categoryMap = buildAuthoritativeCategoryMap();
         assert.throws(
            () => resolveAndValidateCategory({ pair_id: "CH9999" }, categoryMap),
            /FAIL-FAST.*CH9999/
         );
      });

      it("throws when a category resolves to default 'standard' placeholder", () => {
         const mockMap = new Map([["CH0001", "standard"]]);
         assert.throws(
            () => resolveAndValidateCategory({ pair_id: "CH0001" }, mockMap),
            /FAIL-FAST.*standard/
         );
      });
   });

   describe("3. Category Breakdown Metrics and Aggregate Consistency", () => {
      it("computes breakdown for HISC, B3, B4, and HISC-embed with non-zero category counts", () => {
         const breakdown = computeChallengeCategoryBreakdown();

         assert.equal(breakdown.sampleCount, 150);
         const methods = Object.keys(breakdown.methods);
         assert.deepEqual(methods.sort(), ["B3", "B4", "HISC", "HISC_embed"].sort());

         for (const m of methods) {
            const methodResult = breakdown.methods[m];
            assert.equal(Object.keys(methodResult.categories).length, 10);

            for (const cat of EXPECTED_CHALLENGE_CATEGORIES) {
               const catData = methodResult.categories[cat];
               assert.ok(catData.N > 0, `Category '${cat}' for method '${m}' must have N > 0`);
               assert.ok(typeof catData.accuracy === "number");
               assert.ok(typeof catData.macro_f1_3class === "number");
               assert.ok(typeof catData.macro_f1_present === "number");
            }
         }
      });

      it("confirms category sums match saved aggregate challenge totals for all methods", () => {
         const breakdown = computeChallengeCategoryBreakdown();

         // HISC aggregate: 126 / 150 = 84.0%
         assert.equal(breakdown.methods.HISC.aggregateCorrect, 126);
         assert.equal(breakdown.methods.HISC.aggregateAccuracy, 0.84);

         // B3 aggregate: 85 / 150 = 56.67%
         assert.equal(breakdown.methods.B3.aggregateCorrect, 85);
         assert.equal(breakdown.methods.B3.aggregateAccuracy, 0.5667);

         // B4 aggregate: 51 / 150 = 34.0%
         assert.equal(breakdown.methods.B4.aggregateCorrect, 51);
         assert.equal(breakdown.methods.B4.aggregateAccuracy, 0.34);

         // HISC_embed aggregate: 120 / 150 = 80.0%
         assert.equal(breakdown.methods.HISC_embed.aggregateCorrect, 120);
         assert.equal(breakdown.methods.HISC_embed.aggregateAccuracy, 0.80);
      });

      it("verifies saved challenge_category_breakdown artifacts exist and are non-empty", () => {
         const jsonPath = path.resolve(__dirname, "../results/challenge_category_breakdown.json");
         const mdPath = path.resolve(__dirname, "../results/challenge_category_breakdown.md");

         assert.ok(fs.existsSync(jsonPath), "challenge_category_breakdown.json must exist");
         assert.ok(fs.existsSync(mdPath), "challenge_category_breakdown.md must exist");

         const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
         assert.equal(json.sampleCount, 150);
         assert.ok(json.methods.HISC);
         assert.ok(json.methods.HISC_embed);
      });
   });
});
