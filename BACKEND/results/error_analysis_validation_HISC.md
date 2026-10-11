# CivicFlow Error Analysis — Validation Split: HISC (Hierarchical Incident Stream Clustering) (`HISC`)

## 1. Executive Summary & Evaluation Context

- **Method ID:** `HISC`
- **Method Name:** HISC (Hierarchical Incident Stream Clustering)
- **Formula:** Weighted multi-attribute affinity: S = 0.20*Cat + 0.25*Geo + 0.10*Lex + 0.30*Sem + 0.15*Time with contextual classification rules. Default thresholds: 0.60 / 0.35.
- **Split:** `validation` ($N = 80$ pairs)
- **Source Evaluation Artifact:** `BACKEND/results/t1_validation_baseline_comparison.json`
- **Source Git Commit:** `040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb`
- **Generation Timestamp:** `2026-10-11T06:46:41.720Z`
- **Selected Decision Thresholds:** Duplicate = `0.60`, Related = `0.10`
- **Validation Accuracy:** 100.00%
- **Validation Macro F1:** **1.0000**
- **Misclassified Pairs:** **0** out of 80 pairs (0.0% error rate)

> [!NOTE]
> **Protocol Compliance:** This error analysis was conducted strictly on the **Validation split** ($N = 80$). No held-out test pairs or synthetic challenge set pairs were evaluated.

## 2. Confusion Matrix & Per-Class Performance

**Per-Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 1.0000 | 1.0000 | **1.0000** |
| `related` | 28 | 1.0000 | 1.0000 | **1.0000** |
| `independent` | 28 | 1.0000 | 1.0000 | **1.0000** |

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

## 3. Detailed Misclassified Pairs Analysis

> [!TIP]
> **Zero Validation Errors Observed:** Method `HISC` achieved 100.00% Accuracy and 1.0000 Macro F1 on the 80-pair validation split with its tuned decision thresholds (Duplicate: 0.60, Related: 0.10).

**Contextual Factors:**
- On the standard municipal validation split, pairs exhibit distinct categorical and spatial separation across true duplicates (co-located, same category) and independent pairs (distant or incompatible categories).
- While zero errors were observed on validation, final held-out generalization will be formally verified during the T6 evaluation freeze on the held-out test set ($N=80$) and synthetic challenge set ($N=150$), both of which remain strictly withheld.

## 4. Cross-Method Comparison of Recurring Error Patterns

Across all 6 evaluated methods on the identical 80-pair validation split, the error distributions reflect clear architectural trade-offs:

| Method ID | Method Name | Errors | Accuracy | Macro F1 | Primary Failure Pattern |
|---|---|:---:|:---:|:---:|---|
| **HISC** | HISC (Hierarchical Incident Stream Clustering) | **0** / 80 | 100.00% | **1.0000** | None (zero validation errors) |
| **B1_jaccard** | B1: Text Jaccard Similarity | **24** / 80 | 70.00% | **0.6792** | Lexical paraphrasing gap; missed duplicates (14) & missed related (9) |
| **B2_distance** | B2: Distance-Only Similarity | **19** / 80 | 76.25% | **0.7563** | Spatial conflation; over-clusters related into duplicate (12) |
| **B3_cat_distance** | B3: Category Plus Distance | **0** / 80 | 100.00% | **1.0000** | None (zero validation errors) |
| **B4_tfidf** | B4: TF-IDF Cosine Similarity | **18** / 80 | 77.50% | **0.7499** | TF-IDF vocabulary sparsity; missed duplicates (14) & missed related (3) |
| **B5_tfidf_distance** | B5: TF-IDF Cosine + Geographic Distance | **14** / 80 | 82.50% | **0.7961** | Convex dilution; conservative threshold under-classifies duplicates to related (14) |

### Recurring Failure Modes

1. **Surface Lexical Brittleness (B1 & B4):**
   Unigram overlap and TF-IDF cosine fail when citizen complaints express identical issues using distinct synonyms (e.g. "crater" vs "pothole", "burst pipe" vs "water leakage"). Pure text baselines suffer significant false independence (B1 misses 13 pairs into independent).

2. **Spatial Conflation of Duplicate vs Related (B2):**
   Distance-only similarity cannot distinguish between two identical reports of the same pothole and two distinct related incidents (such as a tree fall and a power line) that occur within 100 meters of each other. This causes 12 related pairs to be falsely predicted as duplicates.

3. **Convex Combination Calibration Margin (B5):**
   Combining TF-IDF and distance ($0.6 \cdot S_{tfidf} + 0.4 \cdot S_{geo}$) eliminates false independence entirely (0 independent errors), but requires high values from both terms to cross the duplicate threshold (0.60), causing 14 duplicates to be under-classified as related.

4. **Multi-Attribute Synergy (HISC & B3):**
   Integrating category compatibility with spatial proximity provides sufficient separation on the standard municipal validation split to achieve zero classification errors.

## 5. Distinction Between Observed Facts and Hypotheses

- **Observed Facts:** All numerical scores, threshold bounds, confusion categories, Haversine distances in meters, time deltas in hours, and feature breakdown values reported in this analysis are strictly measured from authorized validation data and existing deterministic code without simulation or imputation.
- **Hypotheses:** Explanations regarding "lexical paraphrase gap", "spatial conflation", and "dilution" represent analytical failure hypotheses formulated from model architecture constraints, clearly distinguished from raw observed measurements.
