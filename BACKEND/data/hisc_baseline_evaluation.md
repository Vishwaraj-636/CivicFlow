# HISC Incident-Clustering Algorithm — Evaluation Report V2

## 1. Evaluation Protocol and Metadata

- **Evaluation Harness:** V2.0.0
- **Date:** `2026-10-10T22:30:00.000Z`
- **Source Dataset:** `civicflow_400_labeled_complaint_pairs.csv` (SHA-256: `b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2`)
- **Random Seed:** `42` (Deterministic Mulberry32 PRNG)
- **Bootstrap Iterations:** `1000` iterations (95% Empirical Percentile CI)
- **HISC Production Defaults:** Duplicate Threshold = `0.6`, Related Threshold = `0.35`
- **Feature Weights:** Category=`0.2`, Geo=`0.25`, Lexical=`0.1`, Semantic=`0.3`, Temporal=`0.15`

## 2. Baseline Summary across Partitions

*Primary metric: Unweighted Macro F1 (accounting for non-uniform challenge class distribution).*

| Partition | Samples | Accuracy | Macro Prec | Macro Rec | Macro F1 | 95% Bootstrap CI (Macro F1) | Correct / Total |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Train (60%)** | 240 | 98.33% | 0.9827 | 0.9841 | **0.9831** | [0.9648, 0.9961] | 236 / 240 |
| **Validation (20%)** | 80 | 98.75% | 0.9885 | 0.9881 | **0.9881** | [0.9608, 1.0000] | 79 / 80 |
| **Held-out Test (20%)** | 80 | 97.50% | 0.9748 | 0.9762 | **0.9752** | [0.9341, 1.0000] | 78 / 80 |
| **Full Original (400)** | 400 | 98.25% | 0.9821 | 0.9833 | **0.9825** | [0.9684, 0.9949] | 393 / 400 |
| **Synthetic Challenge (150)** | 150 | 57.33% | 0.7034 | 0.6048 | **0.4956** | [0.4270, 0.5634] | 86 / 150 |

## 3. Detailed Per-Class Breakdown and Confusion Matrices

### Train (60%)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 72 | 0.9600 | 1.0000 | 0.9796 |
| `related` | 84 | 1.0000 | 0.9524 | 0.9756 |
| `independent` | 84 | 0.9882 | 1.0000 | 0.9941 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 72 | 0 | 0 |
| **Actual `related`** | 3 | 80 | 1 |
| **Actual `independent`** | 0 | 0 | 84 |

**Misclassified Items (4 pairs):**

| Pair ID | Actual | Predicted | Score | Key Features & Distance |
|---|:---:|:---:|:---:|---|
| `P0126` | `related` | `independent` | 0.3446 | dist=199m, dt=426h, sem=0.13 |
| `P0167` | `related` | `duplicate` | 0.6083 | dist=116m, dt=36h, sem=0.31 |
| `P0214` | `related` | `duplicate` | 0.6076 | dist=114m, dt=97h, sem=0.33 |
| `P0223` | `related` | `duplicate` | 0.6029 | dist=4m, dt=9h, sem=0.21 |

### Validation (20%)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 1.0000 | 1.0000 | 1.0000 |
| `related` | 28 | 1.0000 | 0.9643 | 0.9818 |
| `independent` | 28 | 0.9655 | 1.0000 | 0.9825 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 27 | 1 |
| **Actual `independent`** | 0 | 0 | 28 |

**Misclassified Items (1 pairs):**

| Pair ID | Actual | Predicted | Score | Key Features & Distance |
|---|:---:|:---:|:---:|---|
| `P0153` | `related` | `independent` | 0.333 | dist=212m, dt=442h, sem=0.12 |

### Held-out Test (20%)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 0.9600 | 1.0000 | 0.9796 |
| `related` | 28 | 0.9643 | 0.9643 | 0.9643 |
| `independent` | 28 | 1.0000 | 0.9643 | 0.9818 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 1 | 27 | 0 |
| **Actual `independent`** | 0 | 1 | 27 |

**Misclassified Items (2 pairs):**

| Pair ID | Actual | Predicted | Score | Key Features & Distance |
|---|:---:|:---:|:---:|---|
| `P0166` | `related` | `duplicate` | 0.6491 | dist=201m, dt=49h, sem=0.46 |
| `P0327` | `independent` | `related` | 0.3756 | dist=5321m, dt=49h, sem=0.29 |

### Full Original (400)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 120 | 0.9677 | 1.0000 | 0.9836 |
| `related` | 140 | 0.9926 | 0.9571 | 0.9745 |
| `independent` | 140 | 0.9858 | 0.9929 | 0.9893 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 120 | 0 | 0 |
| **Actual `related`** | 4 | 134 | 2 |
| **Actual `independent`** | 0 | 1 | 139 |

**Misclassified Items (7 pairs):**

| Pair ID | Actual | Predicted | Score | Key Features & Distance |
|---|:---:|:---:|:---:|---|
| `P0126` | `related` | `independent` | 0.3446 | dist=199m, dt=426h, sem=0.13 |
| `P0153` | `related` | `independent` | 0.333 | dist=212m, dt=442h, sem=0.12 |
| `P0166` | `related` | `duplicate` | 0.6491 | dist=201m, dt=49h, sem=0.46 |
| `P0167` | `related` | `duplicate` | 0.6083 | dist=116m, dt=36h, sem=0.31 |
| `P0214` | `related` | `duplicate` | 0.6076 | dist=114m, dt=97h, sem=0.33 |
| `P0223` | `related` | `duplicate` | 0.6029 | dist=4m, dt=9h, sem=0.21 |
| `P0327` | `independent` | `related` | 0.3756 | dist=5321m, dt=49h, sem=0.29 |

### Synthetic Challenge (150)

**Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 50 | 0.6024 | 1.0000 | 0.7519 |
| `related` | 43 | 0.5079 | 0.7442 | 0.6038 |
| `independent` | 57 | 1.0000 | 0.0702 | 0.1311 |

**Confusion Matrix (Actual Rows \ Predicted Cols):**

| Actual \ Pred | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 50 | 0 | 0 |
| **Actual `related`** | 11 | 32 | 0 |
| **Actual `independent`** | 22 | 31 | 4 |

**Misclassified Items (64 pairs):**

| Pair ID | Actual | Predicted | Score | Key Features & Distance |
|---|:---:|:---:|:---:|---|
| `CH0013` | `independent` | `related` | 0.517 | dist=24m, dt=0.3h, sem=0.31 |
| `CH0014` | `independent` | `related` | 0.3734 | dist=19070m, dt=0.8h, sem=0.06 |
| `CH0027` | `independent` | `related` | 0.3749 | dist=16369m, dt=0.5h, sem=0.06 |
| `CH0028` | `independent` | `related` | 0.5503 | dist=39m, dt=0.4h, sem=0.40 |
| `CH0030` | `independent` | `related` | 0.534 | dist=47m, dt=0.5h, sem=0.36 |
| `CH0041` | `related` | `duplicate` | 0.6243 | dist=40m, dt=1.3h, sem=0.29 |
| `CH0042` | `independent` | `related` | 0.4642 | dist=18623m, dt=0.5h, sem=0.29 |
| `CH0043` | `independent` | `related` | 0.4703 | dist=39m, dt=0.3h, sem=0.20 |
| `CH0044` | `independent` | `related` | 0.3719 | dist=19070m, dt=0.8h, sem=0.05 |
| `CH0053` | `independent` | `duplicate` | 0.6084 | dist=47m, dt=1h, sem=0.22 |
| `CH0054` | `independent` | `duplicate` | 0.6121 | dist=31m, dt=1.3h, sem=0.22 |
| `CH0055` | `independent` | `related` | 0.4921 | dist=31m, dt=1h, sem=0.22 |
| `CH0056` | `independent` | `duplicate` | 0.6434 | dist=39m, dt=1.2h, sem=0.33 |
| `CH0057` | `independent` | `related` | 0.4642 | dist=18623m, dt=0.5h, sem=0.29 |
| `CH0058` | `independent` | `related` | 0.5073 | dist=31m, dt=0.5h, sem=0.25 |
*... and 49 additional misclassified pairs (see JSON artifact for complete list).*

## 4. Validation Threshold Sweep Analysis

- **Baseline Configuration on Validation:** Dup=`0.6`, Rel=`0.35` $\rightarrow$ Macro F1 = `0.9881`, Accuracy = `98.75%`
- **Best Candidate on Validation:** Dup=`0.6`, Rel=`0.3` $\rightarrow$ Macro F1 = `1.0000`, Accuracy = `100.00%`

> [!NOTE]
> The threshold sweep is evaluated strictly on the Validation split. Production algorithm defaults were NOT modified.

## 5. Feature Ablation Analysis

### Validation Partition Ablations:

| Ablation Model | Macro F1 | $\Delta$ Macro F1 | Accuracy | Per-Class F1 (dup / rel / ind) |
|---|:---:|:---:|:---:|:---:|
| **Full Baseline** | **0.9881** | -- | 98.75% | 1.0000 / 0.9818 / 0.9825 |
| `no_category` | 0.8341 | -0.1540 | 85.00% | 0.6842 / 0.8182 / 1.0000 |
| `no_geographic` | 0.6335 | -0.3546 | 63.75% | 0.7368 / 0.4314 / 0.7324 |
| `no_lexical` | 0.9871 | -0.0010 | 98.75% | 0.9796 / 0.9818 / 1.0000 |
| `no_semantic` | 0.8333 | -0.1548 | 83.75% | 0.8136 / 0.7234 / 0.9630 |
| `no_temporal` | 0.8119 | -0.1762 | 81.25% | 0.8571 / 0.7170 / 0.8615 |

### Test Partition Ablations (For Reference):

| Ablation Model | Macro F1 | $\Delta$ Macro F1 | Accuracy | Per-Class F1 (dup / rel / ind) |
|---|:---:|:---:|:---:|:---:|
| **Full Baseline** | **0.9752** | -- | 97.50% | 0.9796 / 0.9643 / 0.9818 |
| `no_category` | 0.8222 | -0.1530 | 83.75% | 0.6667 / 0.8000 / 1.0000 |
| `no_geographic` | 0.7205 | -0.2547 | 72.50% | 0.7027 / 0.6333 / 0.8254 |
| `no_lexical` | 0.9496 | -0.0256 | 95.00% | 0.9412 / 0.9259 / 0.9818 |
| `no_semantic` | 0.7195 | -0.2557 | 73.75% | 0.7273 / 0.4878 / 0.9434 |
| `no_temporal` | 0.8727 | -0.1025 | 87.50% | 0.8571 / 0.8276 / 0.9333 |

## 6. Architecture Limitations and Clustering vs Pairwise Protocol

The current HISC algorithm implements online graph clustering via MongoDB collections (Complaint and IncidentCluster). The evaluation datasets (400 original pairs, 150 challenge pairs) are pairwise labeled relations. As a result, global partition-level clustering metrics (Adjusted Rand Index, Adjusted Mutual Information, BCubed F1) requiring full connected graph matrices cannot be computed without artificial graph synthesis. Instead, the evaluation rigorously measures pairwise link classification performance (duplicate, related, independent).

**Leakage Safeguards:** Zero incident_id leakage across train, val, and test partitions confirmed. Synthetic challenge set strictly separated from baseline fitting and validation threshold sweeping.
