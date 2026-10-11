import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   binomialCoefficient,
   binomialPmf,
   binomialCdf,
   computeExactMcNemar,
   computeClopperPearsonCI,
   runStatisticalAnalysis,
} from "../src/evaluation/statisticalComparisonAndCI.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Task D — Paired Statistical Comparisons and Accuracy Intervals", () => {
   describe("1. Exact Binomial and Combinatorial Math", () => {
      it("computes exact binomial coefficients and handles boundary conditions", () => {
         assert.equal(binomialCoefficient(10, 0), 1);
         assert.equal(binomialCoefficient(10, 10), 1);
         assert.equal(binomialCoefficient(10, 1), 10);
         assert.equal(binomialCoefficient(10, 5), 252);
         assert.equal(binomialCoefficient(6, 0), 1);
         assert.equal(binomialCoefficient(6, 6), 1);
      });

      it("computes stable PMF and CDF values without overflow", () => {
         // Sum of binomial PMF across all k should be 1.0
         let sum = 0;
         for (let k = 0; k <= 10; k++) {
            sum += binomialPmf(10, k, 0.5);
         }
         assert.ok(Math.abs(sum - 1.0) < 1e-10);

         assert.equal(binomialCdf(10, 10, 0.5), 1.0);
         assert.equal(binomialCdf(10, -1, 0.5), 0.0);
      });
   });

   describe("2. Exact Two-Sided McNemar Test Calculations", () => {
      it("handles zero discordances gracefully with p = 1.0", () => {
         const res = computeExactMcNemar(0, 0);
         assert.equal(res.totalDiscordant, 0);
         assert.equal(res.pValue, 1.0);
      });

      it("handles symmetric discordances with p = 1.0", () => {
         const res = computeExactMcNemar(5, 5);
         assert.equal(res.totalDiscordant, 10);
         assert.equal(res.pValue, 1.0);
      });

      it("computes exact p-value for b=6, c=0 (2 * 0.5^6 = 0.03125)", () => {
         const res = computeExactMcNemar(6, 0);
         assert.equal(res.totalDiscordant, 6);
         assert.equal(res.pValue, 0.03125);
      });

      it("computes exact p-value for highly discordant case (b=43, c=2)", () => {
         const res = computeExactMcNemar(43, 2);
         assert.equal(res.totalDiscordant, 45);
         assert.ok(res.pValue < 1e-10);
      });
   });

   describe("3. Exact Clopper-Pearson Binomial Confidence Intervals", () => {
      it("matches textbook values for n=10, k=5 -> [0.1871, 0.8129]", () => {
         const [lower, upper] = computeClopperPearsonCI(5, 10, 0.95);
         assert.equal(lower, 0.1871);
         assert.equal(upper, 0.8129);
      });

      it("handles boundary condition k=0 correctly", () => {
         const [lower, upper] = computeClopperPearsonCI(0, 10, 0.95);
         assert.equal(lower, 0.0);
         assert.ok(upper > 0 && upper < 0.5);
      });

      it("handles boundary condition k=n (100% accuracy) correctly", () => {
         const [lower, upper] = computeClopperPearsonCI(80, 80, 0.95);
         assert.equal(upper, 1.0);
         // (0.025)^(1/80) ≈ 0.9549
         assert.equal(lower, 0.9549);
      });
   });

   describe("4. End-to-End Saved Prediction Statistical Analysis", () => {
      it("computes paired comparisons for all 4 required comparators", () => {
         const analysis = runStatisticalAnalysis();
         const comps = analysis.pairedComparisons;

         assert.ok(comps.HISC_embed);
         assert.ok(comps.B3_cat_distance);
         assert.ok(comps.B4_tfidf);
         assert.ok(comps.B2_distance);

         // Verified contingency numbers
         assert.equal(comps.HISC_embed.contingencyTable.bothCorrect, 120);
         assert.equal(comps.HISC_embed.contingencyTable.hiscCorrectComparatorIncorrect, 6);
         assert.equal(comps.HISC_embed.contingencyTable.hiscIncorrectComparatorCorrect, 0);
         assert.equal(comps.HISC_embed.exactTwoSidedPValue, 0.03125);

         assert.equal(comps.B3_cat_distance.contingencyTable.bothCorrect, 83);
         assert.equal(comps.B3_cat_distance.contingencyTable.hiscCorrectComparatorIncorrect, 43);
         assert.equal(comps.B3_cat_distance.contingencyTable.hiscIncorrectComparatorCorrect, 2);

         assert.equal(comps.B4_tfidf.contingencyTable.bothCorrect, 44);
         assert.equal(comps.B4_tfidf.contingencyTable.hiscCorrectComparatorIncorrect, 82);
         assert.equal(comps.B4_tfidf.contingencyTable.hiscIncorrectComparatorCorrect, 7);

         assert.equal(comps.B2_distance.contingencyTable.bothCorrect, 73);
         assert.equal(comps.B2_distance.contingencyTable.hiscCorrectComparatorIncorrect, 53);
         assert.equal(comps.B2_distance.contingencyTable.hiscIncorrectComparatorCorrect, 0);
      });

      it("computes Clopper-Pearson intervals for all 11 methods on both sets", () => {
         const analysis = runStatisticalAnalysis();
         const testCIs = analysis.confidenceIntervals.held_out_test;
         const chalCIs = analysis.confidenceIntervals.synthetic_challenge;

         assert.equal(Object.keys(testCIs).length, 11);
         assert.equal(Object.keys(chalCIs).length, 11);

         // HISC challenge: 126 / 150 = 84% -> [0.7714, 0.8947]
         assert.equal(chalCIs.HISC.correct, 126);
         assert.equal(chalCIs.HISC.ci_95_lower, 0.7714);
         assert.equal(chalCIs.HISC.ci_95_upper, 0.8947);

         // HISC test: 80 / 80 = 100% -> [0.9549, 1.0000]
         assert.equal(testCIs.HISC.correct, 80);
         assert.equal(testCIs.HISC.ci_95_lower, 0.9549);
         assert.equal(testCIs.HISC.ci_95_upper, 1.0000);
      });

      it("verifies saved statistical_comparison_and_ci artifacts exist", () => {
         const jsonPath = path.resolve(__dirname, "../results/statistical_comparison_and_ci.json");
         const mdPath = path.resolve(__dirname, "../results/statistical_comparison_and_ci.md");

         assert.ok(fs.existsSync(jsonPath), "statistical_comparison_and_ci.json must exist");
         assert.ok(fs.existsSync(mdPath), "statistical_comparison_and_ci.md must exist");
      });
   });
});
