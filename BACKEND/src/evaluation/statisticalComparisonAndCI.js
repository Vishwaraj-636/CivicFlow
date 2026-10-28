import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Computes binomial coefficient n choose k
 * @param {number} n
 * @param {number} k
 * @returns {number}
 */
export function binomialCoefficient(n, k) {
   if (k < 0 || k > n) return 0;
   if (k === 0 || k === n) return 1;
   let c = 1;
   for (let i = 1; i <= k; i++) {
      c = (c * (n - (k - i))) / i;
   }
   return c;
}

/**
 * Evaluates binomial PMF: P(X = k) = (n choose k) * p^k * (1-p)^(n-k)
 * Uses log summation to prevent intermediate underflow/overflow.
 * @param {number} n
 * @param {number} k
 * @param {number} p
 * @returns {number}
 */
export function binomialPmf(n, k, p) {
   if (k < 0 || k > n) return 0;
   if (p === 0) return k === 0 ? 1 : 0;
   if (p === 1) return k === n ? 1 : 0;
   let logComb = 0;
   for (let i = 1; i <= k; i++) {
      logComb += Math.log(n - (k - i)) - Math.log(i);
   }
   return Math.exp(logComb + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

/**
 * Evaluates binomial CDF: P(X <= k)
 * @param {number} n
 * @param {number} k
 * @param {number} p
 * @returns {number}
 */
export function binomialCdf(n, k, p) {
   if (k < 0) return 0;
   if (k >= n) return 1;
   let sum = 0;
   for (let i = 0; i <= k; i++) {
      sum += binomialPmf(n, i, p);
   }
   return Math.min(1.0, Math.max(0.0, sum));
}

/**
 * Exact Two-Sided McNemar Test
 *
 * Given discordant pair counts b (HISC correct, Comp incorrect) and c (HISC incorrect, Comp correct):
 * Under H0: b ~ Binomial(n = b + c, p = 0.5)
 *
 * Two-sided exact p-value sums all probabilities P(K = k) <= P(K = min(b, c)):
 * p = 2 * sum_{k=0}^{min(b, c)} (n choose k) * 0.5^n
 *
 * @param {number} b Number of pairs where Method 1 is correct and Method 2 is incorrect
 * @param {number} c Number of pairs where Method 1 is incorrect and Method 2 is correct
 * @returns {{ b: number, c: number, totalDiscordant: number, pValue: number }}
 */
export function computeExactMcNemar(b, c) {
   if (typeof b !== "number" || typeof c !== "number" || b < 0 || c < 0) {
      throw new Error(`Invalid discordant counts: b=${b}, c=${c}`);
   }
   const n = b + c;
   if (n === 0) {
      return { b, c, totalDiscordant: 0, pValue: 1.0 };
   }
   const kMin = Math.min(b, c);
   let pSum = 0;
   for (let i = 0; i <= kMin; i++) {
      pSum += binomialCoefficient(n, i) * Math.pow(0.5, n);
   }
   const pValue = Math.min(1.0, 2 * pSum);
   return {
      b,
      c,
      totalDiscordant: n,
      pValue: Number(pValue.toPrecision(8)),
   };
}

/**
 * Computes exact Clopper-Pearson binomial confidence interval for accuracy
 *
 * Solves:
 * P(Binomial(n, lower) >= k) = alpha / 2  (for k > 0)
 * P(Binomial(n, upper) <= k) = alpha / 2  (for k < n)
 *
 * @param {number} k Number of correct predictions
 * @param {number} n Sample size
 * @param {number} [confidenceLevel=0.95]
 * @returns {[number, number]} [lower, upper]
 */
export function computeClopperPearsonCI(k, n, confidenceLevel = 0.95) {
   if (n <= 0) return [0, 1];
   if (k < 0 || k > n) throw new Error(`Invalid success count k=${k} for sample size n=${n}`);

   const alpha = 1 - confidenceLevel;
   let lower = 0;
   if (k > 0) {
      let low = 0;
      let high = k / n;
      for (let iter = 0; iter < 60; iter++) {
         const mid = (low + high) / 2;
         const pGte = 1 - binomialCdf(n, k - 1, mid);
         if (pGte > alpha / 2) high = mid;
         else low = mid;
      }
      lower = (low + high) / 2;
   }

   let upper = 1;
   if (k < n) {
      let low = k / n;
      let high = 1;
      for (let iter = 0; iter < 60; iter++) {
         const mid = (low + high) / 2;
         const pLte = binomialCdf(n, k, mid);
         if (pLte < alpha / 2) high = mid;
         else low = mid;
      }
      upper = (low + high) / 2;
   }

   return [Number(lower.toFixed(4)), Number(upper.toFixed(4))];
}

/**
 * Runs complete statistical evaluation using saved predictions from final_held_out_evaluation.json
 * @param {object} [options]
 * @param {string} [options.freezeJsonPath]
 * @returns {object} Analysis results
 */
export function runStatisticalAnalysis(options = {}) {
   const freezeJsonPath = options.freezeJsonPath ?? path.resolve(__dirname, "../../results/final_held_out_evaluation.json");

   if (!fs.existsSync(freezeJsonPath)) {
      throw new Error(`Frozen evaluation JSON not found at ${freezeJsonPath}`);
   }

   const freezeData = JSON.parse(fs.readFileSync(freezeJsonPath, "utf8"));
   const hiscMethod = freezeData.methods?.HISC;
   if (!hiscMethod) throw new Error("HISC method not found in evaluation JSON");

   const hiscChallengePreds = new Map(
      hiscMethod.synthetic_challenge.predictions.map((p) => [p.pair_id, p])
   );

   // 1. McNemar comparisons on synthetic challenge set (N = 150)
   const comparators = [
      { id: "HISC_embed", displayName: "HISC-embed (Local Embeddings)" },
      { id: "B3_cat_distance", displayName: "B3 (Category + Distance)" },
      { id: "B4_tfidf", displayName: "B4 (TF-IDF Cosine)" },
      { id: "B2_distance", displayName: "B2 (Distance-Only)" },
   ];

   const pairedComparisons = {};

   for (const comp of comparators) {
      const compData = freezeData.methods?.[comp.id];
      if (!compData) throw new Error(`Comparator method '${comp.id}' not found`);

      const compPreds = new Map(compData.synthetic_challenge.predictions.map((p) => [p.pair_id, p]));
      if (compPreds.size !== 150) {
         throw new Error(`Expected 150 predictions for ${comp.id}, got ${compPreds.size}`);
      }

      let bothCorrect = 0;
      let bothIncorrect = 0;
      let hiscCorrectCompIncorrect = 0; // b
      let hiscIncorrectCompCorrect = 0; // c

      for (const [pairId, hiscP] of hiscChallengePreds) {
         const compP = compPreds.get(pairId);
         if (!compP) throw new Error(`Missing paired prediction for pair_id ${pairId}`);

         const hiscOk = hiscP.actual === hiscP.predicted;
         const compOk = compP.actual === compP.predicted;

         if (hiscOk && compOk) bothCorrect += 1;
         else if (!hiscOk && !compOk) bothIncorrect += 1;
         else if (hiscOk && !compOk) hiscCorrectCompIncorrect += 1;
         else if (!hiscOk && compOk) hiscIncorrectCompCorrect += 1;
      }

      const mcNemarResult = computeExactMcNemar(hiscCorrectCompIncorrect, hiscIncorrectCompCorrect);

      pairedComparisons[comp.id] = {
         comparatorId: comp.id,
         comparatorName: comp.displayName,
         sampleSize: 150,
         contingencyTable: {
            bothCorrect,
            bothIncorrect,
            hiscCorrectComparatorIncorrect: hiscCorrectCompIncorrect,
            hiscIncorrectComparatorCorrect: hiscIncorrectCompCorrect,
            totalDiscordant: mcNemarResult.totalDiscordant,
         },
         exactTwoSidedPValue: mcNemarResult.pValue,
         significanceAlpha05: mcNemarResult.pValue < 0.05,
         bonferroniAdjustedAlpha: 0.05 / 4, // 0.0125
         significanceBonferroni: mcNemarResult.pValue < 0.05 / 4,
      };
   }

   // 2. Exact Clopper-Pearson Binomial Confidence Intervals for all 11 methods
   const confidenceIntervals = {
      confidenceLevel: 0.95,
      method: "Clopper-Pearson Exact Binomial (Beta Distribution Quantiles)",
      held_out_test: {},
      synthetic_challenge: {},
   };

   for (const [methodId, methodData] of Object.entries(freezeData.methods)) {
      // Held-out test (N = 80)
      const testPreds = methodData.held_out_test.predictions;
      const testCorrect = testPreds.filter((p) => p.actual === p.predicted).length;
      const testN = testPreds.length;
      const [testLower, testUpper] = computeClopperPearsonCI(testCorrect, testN, 0.95);

      confidenceIntervals.held_out_test[methodId] = {
         id: methodId,
         name: methodData.name,
         N: testN,
         correct: testCorrect,
         accuracy: Number((testCorrect / testN).toFixed(4)),
         ci_95_lower: testLower,
         ci_95_upper: testUpper,
         ci_string: `[${testLower.toFixed(4)}, ${testUpper.toFixed(4)}]`,
      };

      // Synthetic challenge (N = 150)
      const chalPreds = methodData.synthetic_challenge.predictions;
      const chalCorrect = chalPreds.filter((p) => p.actual === p.predicted).length;
      const chalN = chalPreds.length;
      const [chalLower, chalUpper] = computeClopperPearsonCI(chalCorrect, chalN, 0.95);

      confidenceIntervals.synthetic_challenge[methodId] = {
         id: methodId,
         name: methodData.name,
         N: chalN,
         correct: chalCorrect,
         accuracy: Number((chalCorrect / chalN).toFixed(4)),
         ci_95_lower: chalLower,
         ci_95_upper: chalUpper,
         ci_string: `[${chalLower.toFixed(4)}, ${chalUpper.toFixed(4)}]`,
      };
   }

   return {
      evaluatedAt: new Date().toISOString(),
      sourceFreezeFile: path.basename(freezeJsonPath),
      sampleSizes: {
         held_out_test: 80,
         synthetic_challenge: 150,
      },
      pairedComparisons,
      confidenceIntervals,
      methodologicalCaveats: {
         multipleComparisons: "Four primary paired comparisons evaluated. Bonferroni adjusted alpha threshold is alpha / 4 = 0.0125. At this threshold, HISC vs B2, B3, and B4 remain overwhelmingly significant (p < 1e-10), while HISC vs HISC_embed (p = 0.03125) does not meet the family-wise error adjusted significance cutoff.",
         independenceAndIncidentClustering: "In the synthetic challenge set (N = 150), every pair belongs to a unique incident ID (CH_INC0001 through CH_INC0150), meaning cluster size is exactly 1 and pair bootstrap / binomial intervals are mathematically equivalent to incident-clustered resampling. Conversely, in the held-out test split (N = 80), duplicate pairs are clustered within incident IDs and text templates are shared with training (84.6% overlap), so pair-level intervals underestimate true variance.",
      },
   };
}

/**
 * Formats statistical results into Markdown report
 * @param {object} data
 * @returns {string}
 */
export function formatStatisticalMarkdown(data) {
   let md = `# CivicFlow Research Evaluation — Paired Statistical Comparisons and Accuracy Intervals

**Audit Timestamp:** ${data.evaluatedAt}
**Source Predictions:** \`${data.sourceFreezeFile}\`

---

## 1. Paired Exact McNemar Significance Tests ($N = 150$ Synthetic Challenge)

We evaluate whether differences in classification accuracy between HISC and comparator baselines are statistically significant across the 150 paired challenge scenarios.

### Summary Contingency Table and Exact Two-Sided p-Values:

| Comparator Method | Both Correct ($n_{11}$) | Both Incorrect ($n_{00}$) | HISC Correct, Comp Incorrect ($b$) | HISC Incorrect, Comp Correct ($c$) | Discordant Total ($b+c$) | Exact 2-Sided $p$-value | Significant ($\alpha=0.05$)? | Significant (Bonferroni $\alpha=0.0125$)? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;

   for (const comp of Object.values(data.pairedComparisons)) {
      const c = comp.contingencyTable;
      const pStr = comp.exactTwoSidedPValue < 1e-6
         ? comp.exactTwoSidedPValue.toExponential(4)
         : comp.exactTwoSidedPValue.toFixed(5);
      const sig05 = comp.significanceAlpha05 ? "**Yes**" : "No";
      const sigBonf = comp.significanceBonferroni ? "**Yes**" : "No";

      md += `| **${comp.comparatorName}** | ${c.bothCorrect} | ${c.bothIncorrect} | **${c.hiscCorrectComparatorIncorrect}** | **${c.hiscIncorrectComparatorCorrect}** | ${c.totalDiscordant} | \`${pStr}\` | ${sig05} | ${sigBonf} |\n`;
   }

   md += `
### Interpretation and Multiple-Comparison Caveats:
1. **HISC vs. Spatial and Lexical Baselines (B2, B3, B4):**
   - **B3 (Category + Distance):** HISC outperforms B3 with 43 positive discordances vs. 2 negative discordances ($p = 5.89 \\times 10^{-11}$).
   - **B4 (TF-IDF Cosine):** HISC outperforms B4 with 82 positive discordances vs. 7 negative discordances ($p = 2.43 \\times 10^{-17}$).
   - **B2 (Distance-Only):** HISC outperforms B2 with 53 positive discordances vs. 0 negative discordances ($p = 2.22 \\times 10^{-16}$).
   - All three comparisons remain **overwhelmingly significant** even under the most conservative Bonferroni correction ($\\alpha_{\\text{adj}} = 0.0125$).

2. **HISC vs. HISC-embed:**
   - HISC correct / HISC-embed incorrect: **6 pairs**.
   - HISC incorrect / HISC-embed correct: **0 pairs**.
   - Unadjusted exact two-sided $p$-value: **$0.03125$** ($p < 0.05$).
   - Under Bonferroni family-wise adjustment for 4 comparisons ($\\alpha_{\\text{adj}} = 0.0125$), $p = 0.03125 > 0.0125$. Therefore, the observed 4.0% accuracy advantage of hand-tuned HISC (84.0%) over HISC-embed (80.0%) is suggestive but **not statistically significant** after adjusting for multiple comparisons.

---

## 2. Exact Clopper–Pearson 95% Binomial Confidence Intervals

Exact binomial confidence intervals for classification accuracy across all 11 evaluated methods on both evaluation partitions:

### Synthetic Challenge Set ($N = 150$):

| Method ID | Method Name | Correct / 150 | Accuracy | 95% Clopper–Pearson CI |
| :--- | :--- | :---: | :---: | :---: |
`;

   for (const item of Object.values(data.confidenceIntervals.synthetic_challenge)) {
      md += `| \`${item.id}\` | ${item.name} | ${item.correct} / 150 | ${(item.accuracy * 100).toFixed(1)}% | \`${item.ci_string}\` |\n`;
   }

   md += `\n### Held-Out Test Split ($N = 80$):\n\n`;
   md += `| Method ID | Method Name | Correct / 80 | Accuracy | 95% Clopper–Pearson CI |\n`;
   md += `| :--- | :--- | :---: | :---: | :---: |\n`;

   for (const item of Object.values(data.confidenceIntervals.held_out_test)) {
      md += `| \`${item.id}\` | ${item.name} | ${item.correct} / 80 | ${(item.accuracy * 100).toFixed(1)}% | \`${item.ci_string}\` |\n`;
   }

   md += `
---

## 3. Sampling Design and Group Structure Nuance

- **Challenge Set Equivalence:**
  In the synthetic challenge set ($N = 150$), every complaint pair has a distinct incident ID (\`CH_INC0001\` through \`CH_INC0150\`). Because cluster sizes are strictly $M_i = 1$, pair-level binomial intervals and incident-clustered bootstrap intervals are mathematically identical.
- **Held-Out Test Set Intra-Cluster Correlation:**
  In the 400-pair development dataset, duplicate pairs share incident IDs and complaint text templates are heavily duplicated (84.6% overlap with train). The apparent $100.0\\%$ test accuracy of HISC, B3, and HISC-embed produces an exact binomial interval of $[0.9549, 1.0000]$, but this interval treats observations as independent trials. In reality, intra-cluster template correlation inflates precision.
`;

   return md;
}

// CLI Execution entrypoint
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   const resultsDir = path.resolve(__dirname, "../../results");
   const analysis = runStatisticalAnalysis();

   const jsonPath = path.join(resultsDir, "statistical_comparison_and_ci.json");
   const mdPath = path.join(resultsDir, "statistical_comparison_and_ci.md");

   fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2), "utf8");
   fs.writeFileSync(mdPath, formatStatisticalMarkdown(analysis), "utf8");

   console.log(`[Task D] Statistical comparison and confidence intervals complete:`);
   console.log(`- ${jsonPath}`);
   console.log(`- ${mdPath}`);
}
