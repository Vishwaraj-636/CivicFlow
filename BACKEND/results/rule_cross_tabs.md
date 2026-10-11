# Contextual Rule System Cross-Tabs & Three-Tier Decision Breakdown

> **Methodological Verification:** Computed using the production `scorePair` scorer with frozen `HISC-eval` preset (`duplicateThreshold: 0.60`, `relatedThreshold: 0.10`).

## 1. Synthetic Challenge Set (N = 150)

- **Truth Distribution:** 50 duplicate, 43 related, 57 independent (Total 150)
- **Overall Correct:** 126 / 150 (84.00%)

### Three-Tier Decision Breakdown
| Tier | Tier Description | Count | Correct | Accuracy | Key Rules Included |
|---|---|:---:|:---:|:---:|---|
| **HARD OVERRIDES** | Spatial/temporal/categorical/directional boundaries | 51 | 44 | 86.27% | rule_1, rule_2, rule_3, rule_4, opposing_dir |
| **GATE RULES** | Score >= 0.60 duplicate verification or downgrade | 73 | 61 | 83.56% | rule_5_duplicate, rule_5_downgraded_related |
| **BARE THRESHOLD** | Numerical decision (score >= 0.10) | 26 | 21 | 80.77% | threshold |

### Per-Rule 3×3 Cross-Tab Matrices (Rows = Actual, Columns = Predicted)

#### `rule_1_distant_boundary` (Fired: 22, Correct: 22, 100.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 0 | 0 |
| **Actual independent** | 0 | 0 | 22 |

#### `rule_2_temporal_boundary` (Fired: 10, Correct: 5, 50.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 0 | 5 |
| **Actual independent** | 0 | 0 | 5 |

#### `rule_3_operational_radius` (Fired: 2, Correct: 1, 50.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 0 | 1 |
| **Actual independent** | 0 | 0 | 1 |

#### `rule_4_incompatible_categories` (Fired: 12, Correct: 11, 91.7%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 0 | 1 |
| **Actual independent** | 0 | 0 | 11 |

#### `rule_5_opposing_direction` (Fired: 5, Correct: 5, 100.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 0 | 0 |
| **Actual independent** | 0 | 0 | 5 |

#### `rule_5_duplicate` (Fired: 55, Correct: 50, 90.9%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 50 | 0 | 0 |
| **Actual related** | 4 | 0 | 0 |
| **Actual independent** | 1 | 0 | 0 |

#### `rule_5_downgraded_related` (Fired: 18, Correct: 11, 61.1%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 11 | 0 |
| **Actual independent** | 0 | 7 | 0 |

#### `threshold` (Fired: 26, Correct: 21, 80.8%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 21 | 0 |
| **Actual independent** | 0 | 5 | 0 |

## 2. Validation Set (N = 80)

- **Truth Distribution:** 24 duplicate, 28 related, 28 independent (Total 80)
- **Overall Correct:** 80 / 80 (100.00%)

### Three-Tier Decision Breakdown
| Tier | Tier Description | Count | Correct | Accuracy | Key Rules Included |
|---|---|:---:|:---:|:---:|---|
| **HARD OVERRIDES** | Spatial/temporal/categorical/directional boundaries | 28 | 28 | 100.00% | rule_1, rule_2, rule_3, rule_4, opposing_dir |
| **GATE RULES** | Score >= 0.60 duplicate verification or downgrade | 25 | 25 | 100.00% | rule_5_duplicate, rule_5_downgraded_related |
| **BARE THRESHOLD** | Numerical decision (score >= 0.10) | 27 | 27 | 100.00% | threshold |

### Per-Rule 3×3 Cross-Tab Matrices (Rows = Actual, Columns = Predicted)

#### `rule_1_distant_boundary` (Fired: 26, Correct: 26, 100.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 0 | 0 |
| **Actual independent** | 0 | 0 | 26 |

#### `rule_3_operational_radius` (Fired: 2, Correct: 2, 100.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 0 | 0 |
| **Actual independent** | 0 | 0 | 2 |

#### `rule_5_duplicate` (Fired: 24, Correct: 24, 100.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 24 | 0 | 0 |
| **Actual related** | 0 | 0 | 0 |
| **Actual independent** | 0 | 0 | 0 |

#### `rule_5_downgraded_related` (Fired: 1, Correct: 1, 100.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 1 | 0 |
| **Actual independent** | 0 | 0 | 0 |

#### `threshold` (Fired: 27, Correct: 27, 100.0%)
| Actual \ Predicted | Predicted duplicate | Predicted related | Predicted independent |
|---|:---:|:---:|:---:|
| **Actual duplicate** | 0 | 0 | 0 |
| **Actual related** | 0 | 27 | 0 |
| **Actual independent** | 0 | 0 | 0 |
