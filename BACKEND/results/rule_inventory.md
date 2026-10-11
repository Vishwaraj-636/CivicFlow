# CivicFlow Evaluation Integrity — Rule Inventory and Rule 4 Leakage Audit

**Audit Date:** 2026-10-11T12:42:56.586Z
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
