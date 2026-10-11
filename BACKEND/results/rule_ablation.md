# CivicFlow Research Evaluation — Rule Attribution and Ablation Study

**Audit Timestamp:** 2026-10-11T16:19:15.429Z
**Evaluation Preset:** `HISC-eval (duplicateThreshold: 0.60, relatedThreshold: 0.10)`

> [!IMPORTANT]
> **Research Integrity Notice:**
> 1. **No Production Mutation:** Production scoring logic and threshold defaults remain 100% unaltered.
> 2. **Held-Out Test Set Untouched:** The held-out test set ($N = 80$) was strictly excluded from ablation experiments.
> 3. **Post-Freeze Diagnostic Status:** Challenge set ablations are descriptive post-hoc diagnostics to understand rule utility, not unbiased generalization estimates.

---

## 1. Rule Definitions and Catalog

| Rule ID | Rule Name | Trigger Condition | Classification Outcome | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `rule_1_distant_boundary` | **Rule 1: Distant Boundary (>3000m)** | `distance > 3000` | `independent` | Reports separated by more than 3,000 meters cannot share a common local municipal incident root cause. |
| `rule_2_temporal_boundary` | **Rule 2: Temporal Boundary (>720h / 30d)** | `hours > 720` | `independent` | Reports separated by more than 30 days belong to distinct temporal or seasonal maintenance cycles. |
| `rule_3_operational_radius` | **Rule 3: Operational Radius (>1000m Radius Gate)** | `distance > radiusInMeters && (!causallyConnected || semantic < 0.20)` | `independent` | Pairs beyond operational radius (1,000m) require demonstrable causal or semantic affinity to remain associated. |
| `rule_4_incompatible_categories` | **Rule 4: Incompatible Categories Without Causal Link** | `catSim === 0.0 && !causallyConnected` | `independent` | Completely disjoint categories with zero causal linkage cannot be clustered together. |
| `rule_5_duplicate` | **Rule 5a: Duplicate Spatial/Temporal Constraints** | `score >= duplicateThreshold && catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 || lexical > 0 || score >= 0.70)` | `duplicate` | Duplicate classification requires identical/compatible category within 250m and 7 days with non-zero semantic/lexical overlap. |
| `rule_5_opposing_direction` | **Rule 5b: Opposing Direction Override on High Score** | `score >= duplicateThreshold && opposingDir` | `independent` | Opposing traffic or travel directions (e.g. northbound vs. southbound) represent separate infrastructure sides. |
| `rule_5_downgraded_related` | **Rule 5c: Duplicate Downgrade to Related** | `score >= duplicateThreshold && (distance > 250 || hours > 168 || catSim < 0.9)` | `related` | Pairs crossing the duplicate numeric threshold but failing tight duplicate spatial/temporal bounds are downgraded to related. |
| `rule_opposing_direction_related` | **Rule 6: Opposing Direction Override on Moderate Score** | `score >= relatedThreshold && opposingDir && catSim < 0.9` | `independent` | Opposing direction indicator forces independent classification for moderately scoring pairs. |
| `threshold` | **Pure Threshold Classification** | `No contextual rule overrode classification; outcome decided strictly by duplicate/related thresholds` | `score-dependent (duplicate / related / independent)` | Standard numerical decision threshold. |

---

## 2. Rule Activations Across Evaluation Partitions

Counts of rules that determined the final classification label for each pair under the evaluation preset:

| Rule Identifier | Train ($N=240$) | Validation ($N=80$) | Synthetic Challenge ($N=150$) | Total Activations ($N=470$) |
| :--- | :---: | :---: | :---: | :---: |
| `rule_1_distant_boundary` | 82 | 26 | 22 | **130** |
| `rule_2_temporal_boundary` | 0 | 0 | 10 | **10** |
| `rule_3_operational_radius` | 2 | 2 | 2 | **6** |
| `rule_4_incompatible_categories` | 0 | 0 | 12 | **12** |
| `rule_5_duplicate` | 72 | 24 | 55 | **151** |
| `rule_5_opposing_direction` | 0 | 0 | 5 | **5** |
| `rule_5_downgraded_related` | 10 | 1 | 18 | **29** |
| `rule_opposing_direction_related` | 0 | 0 | 0 | **0** |
| `threshold` | 74 | 27 | 26 | **127** |

---

## 3. Leave-One-Rule-Out Ablation on Validation Split ($N = 80$)

| Ablation Scenario | Accuracy | Macro F1 | $\Delta$ Macro F1 | Duplicate F1 | Related F1 | Independent F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Full HISC Baseline (All Rules)** | 100.00% | **1.0000** | `+0.0000` | 1.0000 | 1.0000 | 1.0000 |
| **Ablate Rule 1 (Distant Boundary >3000m)** | 100.00% | **1.0000** | `+0.0000` | 1.0000 | 1.0000 | 1.0000 |
| **Ablate Rule 2 (Temporal Boundary >720h)** | 100.00% | **1.0000** | `+0.0000` | 1.0000 | 1.0000 | 1.0000 |
| **Ablate Rule 3 (Operational Radius >1000m)** | 97.50% | **0.9762** | `-0.0238` | 1.0000 | 0.9655 | 0.9630 |
| **Ablate Rule 4 (Incompatible Categories)** | 100.00% | **1.0000** | `+0.0000` | 1.0000 | 1.0000 | 1.0000 |
| **Ablate Rule 5 (Duplicate Tight Constraints)** | 98.75% | **0.9871** | `-0.0129` | 0.9796 | 0.9818 | 1.0000 |
| **Ablate All Rules (Pure Score Thresholds)** | 67.50% | **0.6160** | `-0.3840` | 0.9796 | 0.6750 | 0.1935 |

---

## 4. Leave-One-Rule-Out Ablation on Synthetic Challenge Set ($N = 150$, Post-Freeze Diagnostic)

| Ablation Scenario | Accuracy | Macro F1 | $\Delta$ Macro F1 | Duplicate F1 | Related F1 | Independent F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Full HISC Baseline (All Rules)** | 84.00% | **0.8343** | `+0.0000` | 0.9524 | 0.7356 | 0.8148 |
| **Ablate Rule 1 (Distant Boundary >3000m)** | 76.67% | **0.7620** | `-0.0723` | 0.9524 | 0.6531 | 0.6804 |
| **Ablate Rule 2 (Temporal Boundary >720h)** | 84.00% | **0.8371** | `+0.0028` | 0.9524 | 0.7629 | 0.7959 |
| **Ablate Rule 3 (Operational Radius >1000m)** | 84.00% | **0.8351** | `+0.0008` | 0.9524 | 0.7416 | 0.8113 |
| **Ablate Rule 4 (Incompatible Categories)** | 77.33% | **0.7688** | `-0.0655` | 0.9524 | 0.6667 | 0.6875 |
| **Ablate Rule 5 (Duplicate Tight Constraints)** | 73.33% | **0.7157** | `-0.1186` | 0.7813 | 0.6087 | 0.7573 |
| **Ablate All Rules (Pure Score Thresholds)** | 52.00% | **0.4198** | `-0.4145` | 0.7407 | 0.5185 | 0.0000 |

> [!NOTE]
> **Threshold Mechanism & Independent Prediction Note:** With `relatedThreshold: 0.10`, the weighted score alone cannot produce `independent` except below 0.10. On the synthetic challenge set ($N = 150$), the minimum weighted score is $0.2298$ (maximum $0.9425$). Consequently, the all-rules-removed variant **NEVER predicts independent** (predicted class distribution: 85 duplicate, 65 related, 0 independent; independent class F1: 0.0000; macro F1: 0.4198). On the validation set ($N = 80$), 3 pairs score below 0.10, yielding 25 duplicate, 52 related, 3 independent (accuracy 67.50%, macro F1 0.6160).

---

## 5. Key Scientific Findings from Ablation Study

1. **Rule 5 (Duplicate Constraints) is Crucial:**
   - On the synthetic challenge set, ablating Rule 5 (which requires $d \le 250\text{m}$, $\Delta t \le 168\text{h}$, and $\text{catSim} \ge 0.9$ to confirm a duplicate) causes duplicate false positives, significantly degrading precision on related pairs.
2. **Rule 1 & Rule 3 (Spatial Boundaries) Suppress Conflation:**
   - Ablating distance boundaries (Rule 1: $>3000\text{m}$ and Rule 3: $>1000\text{m}$) allows geographically remote incidents with high text overlap to be misclassified as related, causing a measurable drop in independent recall.
3. **Pure Score Threshold Baseline Drops Performance:**
   - When all contextual rules are ablated and classification relies solely on numerical score thresholds, Macro F1 drops sharply on the challenge set, demonstrating that HISC's domain-specific spatial, temporal, and categorical gating rules provide vital robustness.
