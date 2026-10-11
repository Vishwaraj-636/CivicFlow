# CivicFlow Research Evaluation — Challenge Category Breakdown Report

**Generated:** 2026-10-11T09:58:51.773Z
**Source Artifact:** `final_held_out_evaluation.json`
**Evaluation Dataset:** Synthetic Challenge Set ($N = 150$)

---

## 1. Overview and Validation Checks

- **Category Join Verification:** All 150 challenge predictions were mapped 1:1 against authoritative category definitions from `challengeDataDefinitions.js` using stable unique `pair_id`s.
- **Fail-Fast Validation:** Zero unmapped pair IDs, zero duplicate pair IDs, and zero default `"standard"` fallback buckets.
- **Aggregate Consistency Check:** Per-category correct counts sum to the exact saved aggregate challenge accuracy for all four target methods:
  - **HISC:** 126 / 150 (84.00%)
  - **B3 (Category + Distance):** 85 / 150 (56.67%)
  - **B4 (TF-IDF Cosine):** 51 / 150 (34.00%)
  - **HISC-embed:** 120 / 150 (80.00%)

---

## 2. Macro F1 Definition and Mathematical Conventions

1. **Standard 3-Class Macro F1 (`macro_f1_3class`):**
   Fixed unweighted average over all 3 problem classes: $K = 3$ (`duplicate`, `related`, `independent`). When a category has zero support for a class (e.g., `duplicate` in *Cascading Related Failures*), precision and recall are defined via `safeDivide` as $0.0$, yielding class $F_1 = 0.0$.
2. **Present-Classes Macro F1 (`macro_f1_present`):**
   Unweighted average across only classes with non-zero support in that specific challenge scenario ($K = 1, 2,$ or $3$).
3. **Accuracy (`accuracy`):**
   Exact fraction of predictions matching the reference label ($	ext{correct} / N$).

---

## 3. Per-Category Results Across Evaluated Methods

| Challenge Category | N | HISC Acc | HISC F1 (3) | B3 Acc | B3 F1 (3) | B4 Acc | B4 F1 (3) | HISC-embed Acc | HISC-embed F1 (3) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Paraphrases with Novel Vocabulary** | 15 | 100.0% | 1.0000 | 73.3% | 0.5556 | 40.0% | 0.3485 | 100.0% | 1.0000 |
| **Typos and Spelling Variations** | 15 | 100.0% | 1.0000 | 73.3% | 0.5556 | 46.7% | 0.4008 | 93.3% | 0.9373 |
| **Tanglish and Colloquial Phrasing** | 15 | 100.0% | 1.0000 | 80.0% | 0.7091 | 60.0% | 0.5259 | 80.0% | 0.8182 |
| **Very Short and Vague Descriptions** | 15 | 73.3% | 0.5556 | 46.7% | 0.3333 | 53.3% | 0.4103 | 73.3% | 0.5556 |
| **Same Location, Different Issue** | 15 | 60.0% | 0.3988 | 33.3% | 0.1667 | 13.3% | 0.0952 | 60.0% | 0.3988 |
| **Same Issue, Geographically Distant** | 15 | 93.3% | 0.5432 | 13.3% | 0.0784 | 13.3% | 0.2698 | 86.7% | 0.4744 |
| **Temporally Distant at Same Location** | 10 | 50.0% | 0.2222 | 0.0% | 0.0000 | 40.0% | 0.3571 | 50.0% | 0.2222 |
| **Similar Wording, Distinct Incidents** | 13 | 38.5% | 0.2381 | 0.0% | 0.0000 | 0.0% | 0.0000 | 38.5% | 0.2381 |
| **Cascading Related Failures** | 15 | 100.0% | 0.3333 | 100.0% | 0.3333 | 13.3% | 0.0784 | 100.0% | 0.3333 |
| **True Duplicates with Disparate Phrasing** | 22 | 100.0% | 0.3333 | 100.0% | 0.3333 | 50.0% | 0.2222 | 95.5% | 0.3256 |

---

## 4. Per-Category Present-Classes Macro F1 Comparison

| Challenge Category | N | Active Classes | HISC F1 (pres) | B3 F1 (pres) | B4 F1 (pres) | HISC-embed F1 (pres) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Paraphrases with Novel Vocabulary** | 15 | duplicate, related, independent | 1.0000 | 0.5556 | 0.3485 | 1.0000 |
| **Typos and Spelling Variations** | 15 | duplicate, related, independent | 1.0000 | 0.5556 | 0.4008 | 0.9373 |
| **Tanglish and Colloquial Phrasing** | 15 | duplicate, related, independent | 1.0000 | 0.7091 | 0.5259 | 0.8182 |
| **Very Short and Vague Descriptions** | 15 | duplicate, independent | 0.8334 | 0.5000 | 0.6154 | 0.8334 |
| **Same Location, Different Issue** | 15 | related, independent | 0.5982 | 0.2500 | 0.1429 | 0.5982 |
| **Same Issue, Geographically Distant** | 15 | related, independent | 0.8148 | 0.1177 | 0.4048 | 0.7116 |
| **Temporally Distant at Same Location** | 10 | related, independent | 0.3333 | 0.0000 | 0.5357 | 0.3333 |
| **Similar Wording, Distinct Incidents** | 13 | related, independent | 0.3572 | 0.0000 | 0.0000 | 0.3572 |
| **Cascading Related Failures** | 15 | related | 1.0000 | 1.0000 | 0.2353 | 1.0000 |
| **True Duplicates with Disparate Phrasing** | 22 | duplicate | 1.0000 | 1.0000 | 0.6667 | 0.9767 |

---

## 5. Analytical Observations

1. **Lexical Baselines Collapse on Adversarial Paraphrases and Slang:**
   - On *Paraphrases with Novel Vocabulary*, B4 (TF-IDF) achieves only **40.0%** accuracy, while HISC and HISC-embed achieve **100.0%**.
   - On *Typos and Spelling Variations*, B4 achieves **46.7%**, while HISC achieves **100.0%** and HISC-embed achieves **93.3%**.
2. **Spatial Baseline Failure Modes:**
   - B3 (Category + Distance) scores **0.0%** accuracy on *Temporally Distant at Same Location* and *Similar Wording, Distinct Incidents*, because it lacks temporal decay and semantic disambiguation.
3. **Cross-Department Cascades:**
   - On *Cascading Related Failures*, both HISC and HISC-embed achieve **100.0%** accuracy by identifying causal multi-department relations (e.g. water pipeline burst causing road cave-in).
