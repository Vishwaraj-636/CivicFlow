# CivicFlow Evaluation Integrity — Rule Inventory and Rule 4 Leakage Audit

**Audit Date:** 2026-10-11T12:46:16.207Z
**Target File:** `BACKEND/src/hisc/scorePair.js`
**Git Diff Stat (`c1a4cdd..HEAD`):**
```
BACKEND/src/hisc/scorePair.js | 54 +++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 54 insertions(+)
```

---

## 1. Complete Rule Inventory

| Rule ID | Trigger Condition (Code Quote) | Forced Label | Input Fields Read | Derived Observable Signals |
|---|---|:---:|---|---|
| `rule_1_distant_boundary` | `if (distance > 3000) return "independent";` | **independent** | a.location.coordinates, b.location.coordinates | distanceInMeters(coordsA, coordsB) > 3000 |
| `rule_2_temporal_boundary` | `if (hours > 720) return "independent";` | **independent** | a.createdAt, b.createdAt | Math.abs(dateA - dateB) / 3600000 > 720 |
| `rule_3_operational_radius` | `if (distance > config.radiusInMeters && (!causallyConnected || semantic < 0.20)) return "independent";` | **independent** | a.location.coordinates, b.location.coordinates, a.text/title/desc, b.text/title/desc | distance, causallyConnected (from concept dictionary matching on text), semantic (text lexical/synonym affinity) |
| `rule_4_incompatible_categories` | `if (catSim === 0.0 && !causallyConnected) return "independent";` | **independent** | a.category, b.category, a.text/title/desc, b.text/title/desc | catSim (category compatibility score), causallyConnected (concept dictionary matching on text) |
| `rule_5_duplicate` | `if (catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 || lexical > 0 || score >= 0.70)) return "duplicate";` | **duplicate** | a.category, b.category, a.location.coordinates, b.location.coordinates, a.createdAt, b.createdAt, a.text/title/desc, b.text/title/desc | score >= duplicateThreshold, catSim >= 0.9, distance <= 250, hours <= 168, !opposingDir, semantic/lexical affinity |
| `rule_5_opposing_direction` | `return opposingDir ? "independent" : "related";` | **independent** | a.text/title/desc, b.text/title/desc | hasOpposingDirections(textA, textB) === true, score >= duplicateThreshold |
| `rule_5_downgraded_related` | `return opposingDir ? "independent" : "related";` | **related** | a.category, b.category, a.location.coordinates, b.location.coordinates, a.createdAt, b.createdAt, a.text/title/desc, b.text/title/desc | score >= duplicateThreshold, fails tight duplicate bounds (distance > 250m or hours > 168h or catSim < 0.9) |
| `rule_opposing_direction_related` | `return opposingDir && catSim < 0.9 ? "independent" : "related";` | **independent** | a.text/title/desc, b.text/title/desc, a.category, b.category | opposingDir === true, catSim < 0.9, score >= relatedThreshold |
| `threshold` | `return "independent"; / return "related"; / return "duplicate";` | **score-dependent** | active weights * features | score >= relatedThreshold ? "related" : "independent" |

---

## 2. Reconciliation with Earlier Reports and Identified Inaccuracies

### Authoritative Codebase Structure (`scorePair.js`):
- `rule_1_distant_boundary`: `distance > 3000` -> `independent`
- `rule_2_temporal_boundary`: `hours > 720` -> `independent`
- `rule_3_operational_radius`: `distance > 1000 && (!causal || semantic < 0.20)` -> `independent`
- `rule_4_incompatible_categories`: `catSim === 0.0 && !causal` -> `independent`
- `rule_5_duplicate`: `score >= 0.60 && catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir` -> `duplicate`
- `rule_5_opposing_direction`: `score >= 0.60 && opposingDir` -> `independent`
- `rule_5_downgraded_related`: `score >= 0.60 && (distance > 250 || hours > 168 || catSim < 0.9)` -> `related`
- `rule_opposing_direction_related`: `score >= 0.10 && opposingDir && catSim < 0.9` -> `independent`
- `threshold`: Pure score thresholding (`score >= 0.60 -> duplicate`, `score >= 0.10 -> related`, else `independent`)

### Inaccurate Statements in Prior Closeout Text:
- In the previous assistant execution report closeout, a rule was colloquially labeled **`rule_4_same_incident_cluster (17 pairs, forces duplicate)`**.
- **Correction:** There is **NO** rule named `rule_4_same_incident_cluster` in `scorePair.js`. `scorePair.js` never had access to cluster IDs or incident groupings. Rule 4 in `scorePair.js` is `rule_4_incompatible_categories`, which forces `independent`, never `duplicate`. Duplicate decisions are determined either by `rule_5_duplicate` or by numerical thresholding.

---

## 3. Investigation of Rule 4 & Evaluation Harness Trace

- **Fields Read by Rule 4:** `catSim` (from `a.category` and `b.category`) and `causallyConnected` (from `extractCivicConcepts(a.text)` and `extractCivicConcepts(b.text)`).
- **Harness Trace:** Neither `hiscEvaluationHarness.js` nor `runFinalEvaluationFreeze.js` supplies ground-truth incident IDs, group IDs, pair IDs, or labels to `scorePair.js`. Both harnesses map CSV rows strictly to observable complaints:
  ```javascript
  const compA = { text: row.text_1, category: row.category_1, location: { coordinates: [lng1, lat1] }, createdAt: row.created_at_1 };
  const compB = { text: row.text_2, category: row.category_2, location: { coordinates: [lng2, lat2] }, createdAt: row.created_at_2 };
  const result = scorePair(compA, compB, config);
  ```
- **Audit Decision:** **LEAK = false**
  - All rules in `scorePair.js` read exclusively observable signals (coordinates, timestamp, text, category).
  - No ground-truth metadata or post-hoc clustering annotations leak into the pairwise scorer.
  - `LEAKFREE_CHALLENGE_ACC = 0.8400` (84.00%, 126/150)
  - `LEAKFREE_CHALLENGE_MACROF1 = 0.8343`
  - Exact 95% Clopper-Pearson CI: **[0.7714, 0.8947]**

---

## 4. Cross-tabs: Rule Activations x Actual Label x Predicted Label

### 4.1 Synthetic Challenge Set ($N = 150$)

| Rule Fired | Actual Ground Truth | Predicted Label | Pair Count | Decision Role | Outcome |
|---|:---:|:---:|:---:|---|:---:|
| `rule_1_distant_boundary` | independent | independent | 22 | Forced by distance > 3000m | Correct |
| `rule_2_temporal_boundary` | independent | independent | 5 | Forced by hours > 720h | Correct |
| `rule_2_temporal_boundary` | related | independent | 5 | Forced by hours > 720h (long cascade) | Error |
| `rule_3_operational_radius` | independent | independent | 1 | Forced by distance > 1000m | Correct |
| `rule_3_operational_radius` | related | independent | 1 | Forced by distance > 1000m | Error |
| `rule_4_incompatible_categories` | independent | independent | 11 | Forced by zero category similarity | Correct |
| `rule_4_incompatible_categories` | related | independent | 1 | Forced by zero category similarity | Error |
| `rule_5_duplicate` | duplicate | duplicate | 50 | Gate: dist<=250m, hours<=168h, catSim>=0.9 | Correct |
| `rule_5_duplicate` | related | duplicate | 4 | Gate passed on adjacent related issue | Error |
| `rule_5_duplicate` | independent | duplicate | 1 | Gate passed on coincidence location | Error |
| `rule_5_opposing_direction` | independent | independent | 5 | Forced by opposing direction tokens | Correct |
| `rule_5_downgraded_related` | related | related | 11 | Downgraded from duplicate (>250m / >168h) | Correct |
| `rule_5_downgraded_related` | independent | related | 7 | Downgraded from duplicate | Error |
| `threshold` | related | related | 21 | Decided by score >= 0.10 threshold | Correct |
| `threshold` | independent | related | 5 | Decided by score >= 0.10 threshold | Error |

**Summary of Challenge Set Decisions:**
- **Decided by contextual rules:** 124 pairs (82.7%)
- **Decided strictly by continuous threshold:** 26 pairs (17.3%)
- **Total Correct:** 126 / 150 (84.00% accuracy)

### 4.2 Validation Split ($N = 80$)

| Rule Fired | Actual Ground Truth | Predicted Label | Pair Count | Decision Role | Outcome |
|---|:---:|:---:|:---:|---|:---:|
| `rule_1_distant_boundary` | independent | independent | 26 | Forced by distance > 3000m | Correct |
| `rule_3_operational_radius` | independent | independent | 2 | Forced by distance > 1000m | Correct |
| `rule_5_duplicate` | duplicate | duplicate | 24 | Gate: dist<=250m, hours<=168h, catSim>=0.9 | Correct |
| `rule_5_downgraded_related` | related | related | 1 | Downgraded from duplicate | Correct |
| `threshold` | related | related | 27 | Decided by score >= 0.10 threshold | Correct |

**Summary of Validation Set Decisions:**
- **Decided by contextual rules:** 53 pairs (66.25%)
- **Decided strictly by continuous threshold:** 27 pairs (33.75%)
- **Total Correct:** 80 / 80 (100.00% accuracy)

---

## 5. Leave-One-Rule-Out Ablation Study (Validation vs. Challenge)

| Ablation Scenario | Description / Disabled Component | Validation Acc ($N=80$) | Validation Macro F1 | Challenge Acc ($N=150$) | Challenge Macro F1 |
|---|---|:---:|:---:|:---:|:---:|
| **Full HISC Baseline** | All rules active | **100.00%** (80/80) | **1.0000** | **84.00%** (126/150) | **0.8343** |
| **Ablate Rule 1** | No Distant Boundary (>3000m) | 100.00% (80/80) | 1.0000 | 76.67% (115/150) | 0.7620 |
| **Ablate Rule 2** | No Temporal Boundary (>720h) | 100.00% (80/80) | 1.0000 | 84.00% (126/150) | 0.8371 |
| **Ablate Rule 3** | No Operational Radius (>1000m) | 97.50% (78/80) | 0.9762 | 84.00% (126/150) | 0.8351 |
| **Ablate Rule 4** | No Incompatible Categories override | 100.00% (80/80) | 1.0000 | 77.33% (116/150) | 0.7688 |
| **Ablate Rule 5** | No Tight Duplicate Gate / Downgrade | 98.75% (79/80) | 0.9871 | 73.33% (110/150) | 0.7157 |
| **Ablate All Rules** | Pure continuous weighted score thresholds | **67.50%** (54/80) | **0.6160** | **52.00%** (78/150) | **0.4198** |
