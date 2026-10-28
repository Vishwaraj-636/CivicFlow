# CivicFlow Reconciliation & Corrections Pack (Second Pass)

## 1. Rule System Inventory (Code Order in scorePair.js)
| Rule Identifier | Trigger Condition | Forced Label | Input Fields Read | Chal | Val |
|---|---|:---:|---|:---:|:---:|
| `rule_1_distant_boundary` | `distance > 3000` | independent | coordinates A & B | 22 | 26 |
| `rule_2_temporal_boundary` | `hours > 720` | independent | createdAt A & B | 10 | 0 |
| `rule_3_operational_radius` | `distance > radiusInMeters && (!causallyConnected \|\| semantic < 0.20)` | independent | coordinates, text concepts | 2 | 2 |
| `rule_4_incompatible_categories` | `catSim === 0.0 && !causallyConnected` | independent | categories, text concepts | 12 | 0 |
| `rule_5_duplicate` | `score >= dupThresh && catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 \|\| lexical > 0 \|\| score >= 0.70)` | duplicate | score, coords, category, dates, text | 55 | 24 |
| `rule_5_opposing_direction` | `score >= dupThresh && opposingDir` | independent | text directions | 5 | 0 |
| `rule_5_downgraded_related` | `score >= dupThresh && !opposingDir` (fails duplicate bounds) | related | coords, category, dates, text | 18 | 1 |
| `rule_opposing_direction_related` | `score >= relThresh && opposingDir && catSim < 0.9` | independent | text directions, category | 0 | 0 |
| `threshold` | `score >= relThresh ? "related" : "independent"` | score-dependent | weighted sum features | 26 | 27 |

## 2. Real Rule Cross-Tabs & Three-Tier Decision Breakdown
- **Challenge Set ($N=150$):** Truth = 50 dup, 43 rel, 57 indep. Total correct = **126/150** (84.00%).
  Full confusion matrix: duplicate `[50, 0, 0]`, related `[4, 32, 7]`, independent `[1, 12, 44]`.
  - `rule_5_duplicate` (forces dup, N=55): actual=[50 dup, 4 rel, 1 indep] -> 50 correct (90.91%)
  - `threshold` (bare score, N=26): actual=[0 dup, 21 rel, 5 indep], pred=related -> 21 correct (80.77%)
  - `rule_5_downgraded_related` (forces rel, N=18): actual=[0 dup, 11 rel, 7 indep] -> 11 correct (61.11%)
  - `rule_1_distant_boundary` (forces indep, N=22): actual=[0 dup, 0 rel, 22 indep] -> 22 correct (100.0%)
  - `rule_4_incompatible_categories` (forces indep, N=12): actual=[0 dup, 1 rel, 11 indep] -> 11 correct (91.67%)
  - `rule_2_temporal_boundary` (forces indep, N=10): actual=[0 dup, 5 rel, 5 indep] -> 5 correct (50.00%)
  - `rule_5_opposing_direction` (forces indep, N=5): actual=[0 dup, 0 rel, 5 indep] -> 5 correct (100.0%)
  - `rule_3_operational_radius` (forces indep, N=2): actual=[0 dup, 1 rel, 1 indep] -> 1 correct (50.00%)
- **Validation Set ($N=80$):** Truth = 24 dup, 28 rel, 28 indep (from splits.json). Total correct = **80/80** (100.0%).
  Full confusion matrix: duplicate `[24, 0, 0]`, related `[0, 28, 0]`, independent `[0, 0, 28]`.
  Activations: `threshold` (27), `rule_1_distant_boundary` (26), `rule_5_duplicate` (24), `rule_3_operational_radius` (2), `rule_5_downgraded_related` (1).
- **Three-Tier Breakdown (Definitions & Accuracy):**
  - **HARD OVERRIDES** (spatial/temporal/categorical/directional bounds): Challenge 51 pairs (44 correct, 86.27%); Validation 28 pairs (28 correct, 100.00%).
  - **GATE RULES** (duplicate score >= 0.60 verification & downgrade): Challenge 73 pairs (61 correct, 83.56%); Validation 25 pairs (25 correct, 100.00%).
  - **BARE THRESHOLD** (numerical thresholding score >= 0.10): Challenge 26 pairs (21 correct, 80.77%); Validation 27 pairs (27 correct, 100.00%).
  - *Sum Checks:* Challenge rule-decided (124) + threshold-decided (26) = 150. Validation rule-decided (53) + threshold-decided (27) = 80.

## 3. Leave-One-Rule-Out & All-Rules-Removed Distribution
| Ablation State | Rules Active | Challenge Acc | Challenge Macro F1 | Delta Acc | Val Acc | Val Macro F1 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `full_hisc` | All (9) | 84.00% (126/150) | 0.8343 | +0.00% | 100.00% (80/80) | 1.0000 |
| `ablate_rule_1` | 8 | 76.67% (115/150) | 0.7620 | -7.33% | 100.00% (80/80) | 1.0000 |
| `ablate_rule_2` | 8 | 84.00% (126/150) | 0.8371 | +0.00% | 100.00% (80/80) | 1.0000 |
| `ablate_rule_3` | 8 | 84.00% (126/150) | 0.8351 | +0.00% | 97.50% (78/80) | 0.9762 |
| `ablate_rule_4` | 8 | 77.33% (116/150) | 0.7688 | -6.67% | 100.00% (80/80) | 1.0000 |
| `ablate_rule_5` | 8 | 73.33% (110/150) | 0.7157 | -10.67% | 98.75% (79/80) | 0.9871 |
| `ablate_all_rules` | 0 | 52.00% (78/150) | 0.4198 | -32.00% | 67.50% (54/80) | 0.6160 |
- **All-Rules-Removed Predicted Distribution:**
  - *Challenge ($N=150$):* duplicate: 85, related: 65, independent: **0**. Min score is 0.2298. Because relatedThreshold is 0.10, the score alone NEVER falls below 0.10 on the challenge set, so it **never predicts independent** (per-class F1: dup 0.7407, rel 0.5185, indep 0.0000; macro F1: 0.4198).
  - *Validation ($N=80$):* duplicate: 25, related: 52, independent: 3 (min score 0.0814; per-class F1: dup 0.9796, rel 0.6750, indep 0.1935; macro F1: 0.6160).

## 4. Deployed-Config Descriptive Run (Development Analysis Only)
*Development analysis only; NOT run on the held-out test split and NOT a held-out result.*
Evaluated with `DEFAULT_HISC_CONFIG` as deployed (thresholds `0.60` / `0.35`, weights default, zero embedding overhead):
| Partition | Accuracy | Macro F1 | Exact 95% Clopper-Pearson CI | Identical to HISC-eval |
|---|:---:|:---:|:---:|:---:|
| **Validation (N=80)** | 100.00% (80/80) | 1.0000 | [0.9549, 1.0000] | 80 / 80 (100.0%) |
| **Challenge (N=150)** | 84.00% (126/150) | 0.8343 | [0.7714, 0.8947] | 150 / 150 (100.0%) |
Confusion matrices match HISC-eval identically because every bare-threshold related prediction has score >= 0.35. Saved to `results/deployed_config_descriptive.json` and `.md`.

## 5. Challenge Categories & Ground-Truth Mappings
`synthetic_challenge_set_150.csv` contains municipal categories (`category_a`, `category_b`) but NO stress-test category column. Stress-test categories are defined strictly in `challengeDataDefinitions.js`:
| Category Name | N | HISC Correct (Acc) | B3 Correct (Acc) | B4 Correct (Acc) | HISC-embed Correct (Acc) |
|---|:---:|:---:|:---:|:---:|:---:|
| Paraphrases with Novel Vocabulary | 15 | 15 (100.0%) | 11 (73.3%) | 6 (40.0%) | 15 (100.0%) |
| Typos and Spelling Variations | 15 | 15 (100.0%) | 11 (73.3%) | 7 (46.7%) | 14 (93.3%) |
| Tanglish and Colloquial Phrasing | 15 | 15 (100.0%) | 12 (80.0%) | 9 (60.0%) | 12 (80.0%) |
| Very Short and Vague Descriptions | 15 | 11 (73.3%) | 7 (46.7%) | 8 (53.3%) | 11 (73.3%) |
| Same Location, Different Issue | 15 | 9 (60.0%) | 5 (33.3%) | 2 (13.3%) | 9 (60.0%) |
| Same Issue, Geographically Distant | 15 | 14 (93.3%) | 2 (13.3%) | 2 (13.3%) | 13 (86.7%) |
| Temporally Distant at Same Location | 10 | 5 (50.0%) | 0 (0.0%) | 4 (40.0%) | 5 (50.0%) |
| Similar Wording, Distinct Incidents | 13 | 5 (38.5%) | 0 (0.0%) | 0 (0.0%) | 5 (38.5%) |
| Cascading Related Failures | 15 | 15 (100.0%) | 15 (100.0%) | 2 (13.3%) | 15 (100.0%) |
| True Duplicates with Disparate Phrasing | 22 | 22 (100.0%) | 22 (100.0%) | 11 (50.0%) | 21 (95.5%) |
| **TOTAL** | **150** | **126 (84.0%)** | **85 (56.7%)** | **51 (34.0%)** | **120 (80.0%)** |
*Reconciliation:* Correct counts sum to exactly 126. The earlier "10 x 15" claim was an informal approximation not matching definitions file (`6x15 + 10 + 13 + 22 = 150`).

## 6. Origin of "0.4930" and "85.3%"
- **Status:** **origin undetermined; do not cite**. Thorough search of git history and results reveals no calculation yielding exactly 0.4930 or 85.3%. Any previously offered narrative explanations are unverified and retracted.

## 7. Label Leakage Decision: LEAK = false
No rule in `scorePair.js` reads incident_id, cluster_id, group_id, or evaluation pair metadata.
- Quoting `rule_5_duplicate` (`scorePair.js:L330-332`):
  `if (catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 || lexical > 0 || score >= 0.70)) return "duplicate";`
Every input is an observable civic complaint signal (coordinates, timestamps, category, text).

## 8. Overlap Stratification Binary Split (< 1.00 vs = 1.00)
| Stratum | N | Jaccard Overlap | HISC Acc | B1 (Jaccard) | B3 (Cat+Dist) | B4 (TF-IDF) | B6 (Embed) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Overlap < 1.00 | 23 | [0.6154, 0.9091] | 100.0% | 69.6% | 100.0% | 69.6% | 87.0% |
| Overlap = 1.00 | 57 | [1.0000, 1.0000] | 100.0% | 56.1% | 100.0% | 70.2% | 75.4% |
*Finding:* Uninformative where HISC and B3 are 100% in every group.

## 9. Superseded Statements List
1. Previous pack Section 2 cross-tab (which mistakenly implied 142/150 correct) is superseded by Section 2 above (126/150).
2. Validation truth counts of 24/26/30 are superseded by 24/28/28 (from `splits.json`).
3. "Rules decided 106 of 150 challenge predictions" is superseded by 124 of 150 (51 hard overrides + 73 duplicate gate rules).
4. All-rules-removed accuracy of "54.0%" and macro F1 of "0.4930" are superseded by 52.00% and 0.4198.
5. "10 categories x 15 pairs = 150" is superseded by the exact counts: 6x15, 10, 13, 22 = 150.
6. Unverified hypotheses for 0.4930 and 85.3% are retracted ("origin undetermined; do not cite").
