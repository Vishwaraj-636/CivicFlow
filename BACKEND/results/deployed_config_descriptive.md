# Deployed-Config Descriptive Run (Development Analysis Only)

> **DEVELOPMENT ANALYSIS ONLY:** This descriptive analysis evaluates the deployed production configuration (`DEFAULT_HISC_CONFIG`: duplicate threshold `0.60`, related threshold `0.35`, zero neural embedding overhead) on the validation ($N=80$) and synthetic challenge ($N=150$) partitions. This analysis was **STRICTLY NOT** executed on the held-out test partition and **MUST NOT** be cited as an unbiased held-out benchmark result.

## 1. Comparison: Evaluated Preset (`HISC-eval`) vs Deployed Configuration (`DEFAULT_HISC_CONFIG`)

| Partition | Metric | Evaluated Preset (`HISC-eval`, 0.60/0.10) | Deployed Config (`DEFAULT_HISC_CONFIG`, 0.60/0.35) | Difference |
|---|---|:---:|:---:|:---:|
| **Validation (N=80)** | Accuracy | 100.00% (80/80) | 100.00% (80/80) | 0.00% |
| **Validation (N=80)** | Macro F1 | 1.0000 | 1.0000 | 0.0000 |
| **Validation (N=80)** | Exact 95% Clopper-Pearson CI | [0.9549, 1] | [0.9549, 1] | Identical |
| **Challenge (N=150)** | Accuracy | 84.00% (126/150) | 84.00% (126/150) | 0.00% |
| **Challenge (N=150)** | Macro F1 | 0.8343 | 0.8343 | 0.0000 |
| **Challenge (N=150)** | Exact 95% Clopper-Pearson CI | [0.7714, 0.8947] | [0.7714, 0.8947] | Identical |

## 2. Confusion Matrices

### Validation Set (N=80) — Deployed Configuration
```json
{
  "duplicate": {
    "duplicate": 24,
    "related": 0,
    "independent": 0
  },
  "related": {
    "duplicate": 0,
    "related": 28,
    "independent": 0
  },
  "independent": {
    "duplicate": 0,
    "related": 0,
    "independent": 28
  }
}
```

### Synthetic Challenge Set (N=150) — Deployed Configuration
```json
{
  "duplicate": {
    "duplicate": 50,
    "related": 0,
    "independent": 0
  },
  "related": {
    "duplicate": 4,
    "related": 32,
    "independent": 7
  },
  "independent": {
    "duplicate": 1,
    "related": 12,
    "independent": 44
  }
}
```

## 3. Mathematical Explanation of Zero Divergence

On both validation and challenge sets, all predictions decided by the bare threshold had scores exceeding `0.35` (for related predictions) or were caught by hard negative boundary rules. Consequently, shifting the related threshold from `0.10` to `0.35` changes zero classification decisions on these development partitions.
