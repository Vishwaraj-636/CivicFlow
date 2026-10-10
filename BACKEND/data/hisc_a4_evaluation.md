# HISC Algorithm Phase A4 — Evaluation and Baseline Comparison Report

## 1. Evaluation Protocol and Metadata

- **Evaluation Harness:** V2.0.0
- **Date:** `2026-10-10T23:20:00.000Z`
- **Source Dataset:** `civicflow_400_labeled_complaint_pairs.csv` (SHA-256: `b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2`)
- **Random Seed:** `42` (Deterministic Mulberry32 PRNG)
- **Bootstrap Iterations:** `1000` iterations (95% Empirical Percentile CI)
- **HISC Production Defaults:** Duplicate Threshold = `0.6`, Related Threshold = `0.35`
- **Feature Weights:** Category=`0.2`, Geo=`0.25`, Lexical=`0.1`, Semantic=`0.3`, Temporal=`0.15`

## 2. Baseline Summary across Partitions

*Primary metric: Unweighted Macro F1 (accounting for non-uniform challenge class distribution).*

| Partition | Samples | Accuracy | Macro Prec | Macro Rec | Macro F1 | 95% Bootstrap CI (Macro F1) | Correct / Total |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Train (60%)** | 240 | 99.58% | 0.9961 | 0.9954 | **0.9957** | [0.9861, 1.0000] | 239 / 240 |
| **Validation (20%)** | 80 | 100.00% | 1.0000 | 1.0000 | **1.0000** | [1.0000, 1.0000] | 80 / 80 |
| **Held-out Test (20%)** | 80 | 100.00% | 1.0000 | 1.0000 | **1.0000** | [1.0000, 1.0000] | 80 / 80 |
| **Full Original (400)** | 400 | 99.75% | 0.9976 | 0.9972 | **0.9974** | [0.9914, 1.0000] | 399 / 400 |
| **Synthetic Challenge (150)** | 150 | 83.33% | 0.8267 | 0.8329 | **0.8278** | [0.7633, 0.8831] | 125 / 150 |

## 3. Detailed Per-Class Breakdown and Confusion Matrices

### Train (60%)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 72 | 1.0000 | 0.9861 | 0.9930 |
| `related` | 84 | 0.9882 | 1.0000 | 0.9941 |
| `independent` | 84 | 1.0000 | 1.0000 | 1.0000 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 71 | 1 | 0 |
| **Actual `related`** | 0 | 84 | 0 |
| **Actual `independent`** | 0 | 0 | 84 |

**Misclassified Items (1 pairs):**

| Pair ID | Actual | Predicted | Score | Key Features & Distance |
|---|:---:|:---:|:---:|---|
| `P0082` | `duplicate` | `related` | 0.5997 | dist=172m, dt=16h, sem=0.10 |

### Validation (20%)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 1.0000 | 1.0000 | 1.0000 |
| `related` | 28 | 1.0000 | 1.0000 | 1.0000 |
| `independent` | 28 | 1.0000 | 1.0000 | 1.0000 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

### Held-out Test (20%)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 1.0000 | 1.0000 | 1.0000 |
| `related` | 28 | 1.0000 | 1.0000 | 1.0000 |
| `independent` | 28 | 1.0000 | 1.0000 | 1.0000 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

### Full Original (400)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 120 | 1.0000 | 0.9917 | 0.9958 |
| `related` | 140 | 0.9929 | 1.0000 | 0.9964 |
| `independent` | 140 | 1.0000 | 1.0000 | 1.0000 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 119 | 1 | 0 |
| **Actual `related`** | 0 | 140 | 0 |
| **Actual `independent`** | 0 | 0 | 140 |

**Misclassified Items (1 pairs):**

| Pair ID | Actual | Predicted | Score | Key Features & Distance |
|---|:---:|:---:|:---:|---|
| `P0082` | `duplicate` | `related` | 0.5997 | dist=172m, dt=16h, sem=0.10 |

### Synthetic Challenge (150)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 50 | 0.9091 | 1.0000 | 0.9524 |
| `related` | 43 | 0.7111 | 0.7442 | 0.7273 |
| `independent` | 57 | 0.8600 | 0.7544 | 0.8037 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 50 | 0 | 0 |
| **Actual `related`** | 4 | 32 | 7 |
| **Actual `independent`** | 1 | 13 | 43 |

**Misclassified Items (25 pairs):**

| Pair ID | Actual | Predicted | Score | Key Features & Distance |
|---|:---:|:---:|:---:|---|
| `CH0053` | `independent` | `related` | 0.5934 | dist=47m, dt=1h, sem=0.20 |
| `CH0054` | `independent` | `related` | 0.6204 | dist=31m, dt=1.3h, sem=0.25 |
| `CH0055` | `independent` | `related` | 0.5805 | dist=31m, dt=1h, sem=0.25 |
| `CH0056` | `independent` | `related` | 0.6292 | dist=39m, dt=1.2h, sem=0.29 |
| `CH0061` | `independent` | `related` | 0.6608 | dist=31m, dt=1.3h, sem=0.38 |
| `CH0065` | `related` | `independent` | 0.5806 | dist=31m, dt=1.3h, sem=0.46 |
| `CH0067` | `independent` | `related` | 0.4244 | dist=31m, dt=0.5h, sem=0.08 |
| `CH0069` | `independent` | `related` | 0.6507 | dist=31m, dt=0.7h, sem=0.33 |
| `CH0071` | `independent` | `related` | 0.5875 | dist=47m, dt=0.8h, sem=0.29 |
| `CH0073` | `independent` | `related` | 0.4951 | dist=47m, dt=0.8h, sem=0.17 |
| `CH0075` | `independent` | `related` | 0.4183 | dist=47m, dt=0.6h, sem=0.07 |
| `CH0077` | `related` | `independent` | 0.5306 | dist=2621m, dt=2h, sem=0.40 |
| `CH0091` | `related` | `independent` | 0.5651 | dist=31m, dt=1101h, sem=0.22 |
| `CH0092` | `related` | `independent` | 0.515 | dist=31m, dt=1175.5h, sem=0.11 |
| `CH0093` | `related` | `independent` | 0.5663 | dist=25m, dt=1225h, sem=0.25 |
*... and 10 additional misclassified pairs (see JSON artifact for complete list).*

## 4. Validation Threshold Sweep Analysis

- **Baseline Configuration on Validation:** Dup=`0.6`, Rel=`0.35` $\rightarrow$ Macro F1 = `1.0000`, Accuracy = `100.00%`
- **Best Candidate on Validation:** Dup=`0.5`, Rel=`0.25` $\rightarrow$ Macro F1 = `1.0000`, Accuracy = `100.00%`

> [!NOTE]
> The threshold sweep is evaluated strictly on the Validation split. Production algorithm defaults were NOT modified.

## 5. Feature Ablation Analysis

### Validation Partition Ablations:

| Ablation Model | Macro F1 | $\Delta$ Macro F1 | Accuracy | Per-Class F1 (dup / rel / ind) |
|---|:---:|:---:|:---:|:---:|
| **Full Baseline** | **1.0000** | -- | 100.00% | 1.0000 / 1.0000 / 1.0000 |
| `no_category` | 0.8618 | -0.1382 | 87.50% | 0.7368 / 0.8485 / 1.0000 |
| `no_geographic` | 0.7177 | -0.2823 | 72.50% | 0.7368 / 0.5926 / 0.8235 |
| `no_lexical` | 1.0000 | +0.0000 | 100.00% | 1.0000 / 1.0000 / 1.0000 |
| `no_semantic` | 1.0000 | +0.0000 | 100.00% | 1.0000 / 1.0000 / 1.0000 |
| `no_temporal` | 0.9201 | -0.0799 | 92.50% | 0.8571 / 0.9032 / 1.0000 |

### Test Partition Ablations (For Reference):

| Ablation Model | Macro F1 | $\Delta$ Macro F1 | Accuracy | Per-Class F1 (dup / rel / ind) |
|---|:---:|:---:|:---:|:---:|
| **Full Baseline** | **1.0000** | -- | 100.00% | 1.0000 / 1.0000 / 1.0000 |
| `no_category` | 0.9339 | -0.0661 | 93.75% | 0.8837 / 0.9180 / 1.0000 |
| `no_geographic` | 0.8623 | -0.1377 | 86.25% | 0.8837 / 0.8000 / 0.9032 |
| `no_lexical` | 1.0000 | +0.0000 | 100.00% | 1.0000 / 1.0000 / 1.0000 |
| `no_semantic` | 1.0000 | +0.0000 | 100.00% | 1.0000 / 1.0000 / 1.0000 |
| `no_temporal` | 0.9608 | -0.0392 | 96.25% | 0.9333 / 0.9492 / 1.0000 |

## 6. Architecture Limitations and Clustering vs Pairwise Protocol

The current HISC algorithm implements online graph clustering via MongoDB collections (Complaint and IncidentCluster). The evaluation datasets (400 original pairs, 150 challenge pairs) are pairwise labeled relations. As a result, global partition-level clustering metrics (Adjusted Rand Index, Adjusted Mutual Information, BCubed F1) requiring full connected graph matrices cannot be computed without artificial graph synthesis. Instead, the evaluation rigorously measures pairwise link classification performance (duplicate, related, independent).

**Leakage Safeguards:** Zero incident_id leakage across train, val, and test partitions confirmed. Synthetic challenge set strictly separated from baseline fitting and validation threshold sweeping.

## 7. Phase A3 Baseline vs. Phase A4 Improvement Comparison

| Partition | Metric | Phase A3 Baseline | Phase A4 Improved | Delta / Relative Change |
|---|:---:|:---:|:---:|:---:|
| **Train (60%, N=240)** | Macro F1 | 0.9831 | **0.9957** | **+0.0126** |
| | Accuracy | 98.33% | 99.58% | 1.25% |
| **Validation (20%, N=80)** | Macro F1 | 0.9881 | **1.0000** | **+0.0119** |
| | Accuracy | 98.75% | 100.00% | 1.25% |
| **Held-out Test (20%, N=80)** | Macro F1 | 0.9752 | **1.0000** | **+0.0248** |
| | Accuracy | 97.50% | 100.00% | 2.50% |
| **Full Original (N=400)** | Macro F1 | 0.9825 | **0.9974** | **+0.0149** |
| | Accuracy | 98.25% | 99.75% | 1.50% |
| **Synthetic Challenge (N=150)** | Macro F1 | 0.4956 | **0.8278** | **+0.3322** |
| | Accuracy | 57.33% | 83.33% | 26.00% |
| | Challenge Independent Recall | 7.02% | **75.44%** | **+68.42%** |
| | Challenge Independent F1 | 0.1311 | **0.8037** | **+0.6726** |
