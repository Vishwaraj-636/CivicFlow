# CivicFlow Research Evaluation T1 — Fair Baselines and Validation Tuning Report

## 1. Provenance and Protocol Metadata

- **Evaluation Phase:** T1 — Fair Baselines and Validation Tuning
- **Timestamp:** `2026-10-11T06:37:31.124Z`
- **Source Git Commit:** `040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb`
- **Random Seed:** `42`
- **Source Dataset:** `civicflow_400_labeled_complaint_pairs.csv` (SHA-256: `b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2`)
- **Splits Manifest:** `splits.json` (Train: 240, Val: 80, Held-out Test: 80)
- **Synthetic Challenge Set:** 150 pairs (WITHHELD)
- **Threshold Grid:** 136 admissible pairs in $[0.10, 0.90]$ with step $0.05$ subject to $\theta_{dup} > \theta_{rel}$
- **Deterministic Tie-Break:** 1. Highest validation macro F1 -> 2. Highest overall accuracy -> 3. Highest duplicate F1 -> 4. Highest related F1 -> 5. Highest threshold margin (dt - rt) -> 6. Descending (dt, rt) lexicographical order.

> [!IMPORTANT]
> **Evaluation Split Sequencing Protocol:** Held-out Test (N=80) and Synthetic Challenge (N=150) are evaluated strictly once at final freeze (T6) after all methods are finalized. During T1, only Train fitting and Validation tuning are performed.
> **Status:** TEST and CHALLENGE partitions withheld and unevaluated during T1.

## 2. Validation Baseline Performance Summary (N = 80)

| Method ID | Method Name | Selected Thresholds (Dup / Rel) | Accuracy | Macro Prec | Macro Rec | Macro F1 | Per-Class F1 (dup / rel / ind) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **HISC** | HISC (Hybrid Incident Similarity and Clustering) | `0.60` / `0.10` | 100.00% | 1.0000 | 1.0000 | **1.0000** | 1.0000 / 1.0000 / 1.0000 |
| **B1_jaccard** | B1: Text Jaccard Similarity | `0.35` / `0.20` | 70.00% | 0.7694 | 0.6865 | **0.6792** | 0.5882 / 0.6552 / 0.7941 |
| **B2_distance** | B2: Distance-Only Similarity | `0.85` / `0.20` | 76.25% | 0.7606 | 0.7599 | **0.7563** | 0.6415 / 0.6275 / 1.0000 |
| **B3_cat_distance** | B3: Category Plus Distance | `0.90` / `0.35` | 100.00% | 1.0000 | 1.0000 | **1.0000** | 1.0000 / 1.0000 / 1.0000 |
| **B4_tfidf** | B4: TF-IDF Cosine Similarity | `0.40` / `0.20` | 77.50% | 0.8373 | 0.7579 | **0.7499** | 0.5882 / 0.7463 / 0.9153 |
| **B5_tfidf_distance** | B5: TF-IDF Cosine + Geographic Distance | `0.60` / `0.15` | 82.50% | 0.8889 | 0.8056 | **0.7961** | 0.5882 / 0.8000 / 1.0000 |

## 3. Method Specifications and Formulas

### HISC: HISC (Hybrid Incident Similarity and Clustering)

- **Formula:** Weighted multi-attribute affinity: S = 0.20*Cat + 0.25*Geo + 0.10*Lex + 0.30*Sem + 0.15*Time with contextual classification rules. Default thresholds: 0.60 / 0.35.
- **Fitting:** Hand-fixed domain weights; no training set fitting.
- **Tuned Thresholds:** Duplicate = `0.6`, Related = `0.1` (out of 136 combinations)
- **Historical Default Thresholds:** Duplicate = `0.6`, Related = `0.35` $\rightarrow$ Default Macro F1 = `1.0000`, Accuracy = `100.00%`

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

### B1_jaccard: B1: Text Jaccard Similarity

- **Formula:** S = |Tokens_A ∩ Tokens_B| / |Tokens_A ∪ Tokens_B| on normalized alphanumeric word tokens.
- **Fitting:** None (zero-shot lexical baseline).
- **Tuned Thresholds:** Duplicate = `0.35`, Related = `0.2` (out of 136 combinations)

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 10 | 10 | 4 |
| **Actual `related`** | 0 | 19 | 9 |
| **Actual `independent`** | 0 | 1 | 27 |

### B2_distance: B2: Distance-Only Similarity

- **Formula:** S = exp(-d / 1000) where d is Haversine distance in meters.
- **Fitting:** None (zero-shot spatial baseline with fixed scale 1000m).
- **Tuned Thresholds:** Duplicate = `0.85`, Related = `0.2` (out of 136 combinations)

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 17 | 7 | 0 |
| **Actual `related`** | 12 | 16 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

### B3_cat_distance: B3: Category Plus Distance

- **Formula:** S = 0.5 * CategoryScore(cat_A, cat_B) + 0.5 * exp(-d / 1000). Equal 50/50 convex weighting.
- **Fitting:** None (zero-shot multi-attribute spatial-categorical baseline).
- **Tuned Thresholds:** Duplicate = `0.9`, Related = `0.35` (out of 136 combinations)

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

### B4_tfidf: B4: TF-IDF Cosine Similarity

- **Formula:** S = Cosine(v_A, v_B) where term vectors v use smoothed IDF = ln((N+1)/(df+1)) + 1, fitted strictly on TRAIN texts.
- **Fitting:** Fitted on 240 train pairs (480 complaint texts, vocabulary size: 97). Val/test/challenge out-of-vocabulary terms ignored.
- **Tuned Thresholds:** Duplicate = `0.4`, Related = `0.2` (out of 136 combinations)

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 10 | 13 | 1 |
| **Actual `related`** | 0 | 25 | 3 |
| **Actual `independent`** | 0 | 1 | 27 |

### B5_tfidf_distance: B5: TF-IDF Cosine + Geographic Distance

- **Formula:** S = 0.6 * S_tfidf + 0.4 * exp(-d / 1000). Fixed 60/40 convex combination formula.
- **Fitting:** TF-IDF vocabulary and IDF fitted strictly on TRAIN texts. Combination weights 0.6/0.4 fixed by design, not tuned on validation.
- **Tuned Thresholds:** Duplicate = `0.6`, Related = `0.15` (out of 136 combinations)

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 10 | 14 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

