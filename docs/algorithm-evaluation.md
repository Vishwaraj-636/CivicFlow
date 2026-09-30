# Baseline vs HISC Evaluation

The evaluator uses `civicflow_400_labeled_complaint_pairs.csv` supplied with the project. It contains 400 manually labeled pairs: 120 duplicate, 140 related, and 140 independent. These are labeled complaint-pair examples, not a production accuracy guarantee.

Run the evaluation with:

```text
cd BACKEND
npm.cmd run evaluate:incidents
```

## Aggregate results

| Metric | Baseline | HISC |
|---|---:|---:|
| Accuracy | 0.390 | 0.645 |
| Macro precision | 0.500 | 0.761 |
| Macro recall | 0.378 | 0.621 |
| Macro F1 | 0.301 | 0.568 |
| False-positive rate on independent pairs | 0.000 | 0.000 |
| Processing time in local run (ms) | 7.041 | 13.388 |

## Confusion matrices

Rows are actual labels and columns are predicted labels.

### Baseline

| Actual \\ Predicted | duplicate | related | independent |
|---|---:|---:|---:|
| duplicate | 16 | 104 | 0 |
| related | 0 | 0 | 140 |
| independent | 0 | 0 | 140 |

### HISC

| Actual \\ Predicted | duplicate | related | independent |
|---|---:|---:|---:|
| duplicate | 16 | 104 | 0 |
| related | 0 | 102 | 38 |
| independent | 0 | 0 | 140 |

HISC's improvement comes primarily from recovering cross-category related incidents while preserving the independent-pair boundary. The current implementation is a deterministic, explainable semantic proxy based on civic synonym groups; it is not a claim of neural-embedding accuracy.