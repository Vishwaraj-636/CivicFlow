# CivicFlow Research Evaluation — Challenge Category Breakdown Report

**Generated:** 2026-10-11T12:51:09.853Z
**Source Artifact:** `final_held_out_evaluation.json`
**Evaluation Dataset:** Synthetic Challenge Set ($N = 150$)
**Reporting Policy:** not reported: per-category F1 is undefined when classes are absent

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

## 2. Metric Reporting Policy

In accordance with rigorous statistical reporting guidelines:
> **not reported: per-category F1 is undefined when classes are absent**

Several challenge categories isolate specific pairs where one or two ground-truth classes have zero occurrences ($N = 0$). In such cases, per-class and Macro F1 calculations are ill-defined. This breakdown therefore reports exact sample size ($N$), number correct, accuracy, and full predicted-class distributions.

---

## 3. Per-Category Accuracy Across Target Methods

| Challenge Category | N | HISC Correct | HISC Acc | B3 Acc | B4 Acc | HISC-embed Acc | Category F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Paraphrases with Novel Vocabulary** | 15 | 15/15 | **100.0%** | 73.3% | 40.0% | 100.0% | *not reported* |
| **Typos and Spelling Variations** | 15 | 15/15 | **100.0%** | 73.3% | 46.7% | 93.3% | *not reported* |
| **Tanglish and Colloquial Phrasing** | 15 | 15/15 | **100.0%** | 80.0% | 60.0% | 80.0% | *not reported* |
| **Very Short and Vague Descriptions** | 15 | 11/15 | **73.3%** | 46.7% | 53.3% | 73.3% | *not reported* |
| **Same Location, Different Issue** | 15 | 9/15 | **60.0%** | 33.3% | 13.3% | 60.0% | *not reported* |
| **Same Issue, Geographically Distant** | 15 | 14/15 | **93.3%** | 13.3% | 13.3% | 86.7% | *not reported* |
| **Temporally Distant at Same Location** | 10 | 5/10 | **50.0%** | 0.0% | 40.0% | 50.0% | *not reported* |
| **Similar Wording, Distinct Incidents** | 13 | 5/13 | **38.5%** | 0.0% | 0.0% | 38.5% | *not reported* |
| **Cascading Related Failures** | 15 | 15/15 | **100.0%** | 100.0% | 13.3% | 100.0% | *not reported* |
| **True Duplicates with Disparate Phrasing** | 22 | 22/22 | **100.0%** | 100.0% | 50.0% | 95.5% | *not reported* |

---

## 4. Predicted-Class Distributions by Category (HISC)

| Challenge Category | N | Ground Truth (dup / rel / ind) | HISC Predicted Classes (dup / rel / ind) | HISC Accuracy |
| :--- | :---: | :---: | :---: | :---: |
| **Paraphrases with Novel Vocabulary** | 15 | 7 / 4 / 4 | 7 / 4 / 4 | **100.0%** |
| **Typos and Spelling Variations** | 15 | 7 / 4 / 4 | 7 / 4 / 4 | **100.0%** |
| **Tanglish and Colloquial Phrasing** | 15 | 7 / 4 / 4 | 7 / 4 / 4 | **100.0%** |
| **Very Short and Vague Descriptions** | 15 | 7 / 0 / 8 | 7 / 4 / 4 | **73.3%** |
| **Same Location, Different Issue** | 15 | 0 / 5 / 10 | 0 / 9 / 6 | **60.0%** |
| **Same Issue, Geographically Distant** | 15 | 0 / 2 / 13 | 0 / 1 / 14 | **93.3%** |
| **Temporally Distant at Same Location** | 10 | 0 / 5 / 5 | 0 / 0 / 10 | **50.0%** |
| **Similar Wording, Distinct Incidents** | 13 | 0 / 4 / 9 | 5 / 3 / 5 | **38.5%** |
| **Cascading Related Failures** | 15 | 0 / 15 / 0 | 0 / 15 / 0 | **100.0%** |
| **True Duplicates with Disparate Phrasing** | 22 | 22 / 0 / 0 | 22 / 0 / 0 | **100.0%** |

---

## 5. Analytical Observations

1. **Sum Consistency:** All 10 categories sum to exactly 150 pairs ($10 	imes 15 = 150$).
2. **HISC Accuracy:** 126 / 150 (84.00%) correctly classified across the synthetic challenge set.
3. **Macro F1 Policy:** Per-category F1 and aggregate category F1 are omitted (*not reported: per-category F1 is undefined when classes are absent*).
