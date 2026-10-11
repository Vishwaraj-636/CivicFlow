# CivicFlow Reconciliation & Corrections Pack

## 1. Rule System Inventory (Code Order in scorePair.js)
| Rule ID | Trigger Condition | Forced Label | Input Fields Read | Chal (150) | Val (80) |
|---|---|:---:|---|:---:|:---:|
| `rule_1_distant_boundary` | `distance > 3000` | independent | coordinates A & B | 22 | 26 |
| `rule_2_temporal_boundary` | `hours > 720` | independent | createdAt A & B | 10 | 0 |
| `rule_3_operational_radius` | `distance > radiusInMeters && (!causallyConnected \|\| semantic < 0.20)` | independent | coordinates, text | 2 | 2 |
| `rule_4_incompatible_categories` | `catSim === 0.0 && !causallyConnected` | independent | categories, text | 12 | 0 |
| `rule_5_duplicate` | `score >= dupThresh && catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 \|\| lexical > 0 \|\| score >= 0.70)` | duplicate | score, coords, category, dates, text | 55 | 24 |
| `rule_5_opposing_direction` | `score >= dupThresh && opposingDir` | independent | text directions | 5 | 0 |
| `rule_5_downgraded_related` | `score >= dupThresh && !opposingDir` (fails duplicate bounds) | related | coords, category, dates, text | 18 | 1 |
| `rule_opposing_direction_related` | `score >= relThresh && opposingDir && catSim < 0.9` | independent | text, categories | 0 | 0 |
| `threshold` | `score >= relThresh ? "related" : "independent"` | score-dependent | weighted score components | 26 | 27 |
*Reconciliation:* `rule_ablation.json` & `determineRuleFired()` are the ground truth; earlier reports colloquially misattributed rule numbers (e.g. claiming Rule 4 was same-incident).

## 2. Rule Fired Cross-Tab (HISC-eval Preset)
- **Challenge Set ($N=150$):** Duplicate truth = 50, Related truth = 43, Independent truth = 57.
  - `rule_5_duplicate`: actual=[50 dup, 0 rel, 5 indep], pred=duplicate (55)
  - `threshold`: actual=[0 dup, 22 rel, 4 indep], pred=[22 rel, 4 indep] (26)
  - `rule_5_downgraded_related`: actual=[0 dup, 18 rel, 0 indep], pred=related (18)
  - `rule_1_distant_boundary`: actual=[0 dup, 0 rel, 22 indep], pred=independent (22)
  - `rule_4_incompatible_categories`: actual=[0 dup, 0 rel, 12 indep], pred=independent (12)
  - `rule_2_temporal_boundary`: actual=[0 dup, 0 rel, 10 indep], pred=independent (10)
  - `rule_5_opposing_direction`: actual=[0 dup, 3 rel, 2 indep], pred=independent (5)
  - `rule_3_operational_radius`: actual=[0 dup, 0 rel, 2 indep], pred=independent (2)
  - *Totals Check:* Rule-decided (124) + Threshold-decided (26) = 150. Correct = 126/150 (84.00%).
- **Validation Set ($N=80$):** Duplicate truth = 24, Related truth = 26, Independent truth = 30.
  - `threshold`: 27 | `rule_1_distant_boundary`: 26 | `rule_5_duplicate`: 24 | `rule_3_operational_radius`: 2 | `rule_5_downgraded_related`: 1. Sum = 80.

## 3. Leave-One-Rule-Out Ablation (Challenge Set, N=150)
| Ablation State | Rules Active | Challenge Acc | Challenge Macro F1 | Delta Acc vs HISC |
|---|:---:|:---:|:---:|:---:|
| `full_hisc` | All (9) | 84.00% (126/150) | 0.8343 | +0.00% |
| `ablate_rule_1` | 8 | 76.67% (115/150) | 0.7620 | -7.33% |
| `ablate_rule_2` | 8 | 84.00% (126/150) | 0.8371 | +0.00% |
| `ablate_rule_3` | 8 | 84.00% (126/150) | 0.8351 | +0.00% |
| `ablate_rule_4` | 8 | 77.33% (116/150) | 0.7688 | -6.67% |
| `ablate_rule_5` | 8 | 73.33% (110/150) | 0.7157 | -10.67% |
| `ablate_all_rules` | 0 | 52.00% (78/150) | 0.4198 | -32.00% |

## 4. Label Leakage Decision: LEAK = false
**Evidence & Quoted Code:** No rule reads incident_id, cluster_id, group_id, or evaluation pair metadata.
- For `rule_5_duplicate` (line 330 of `scorePair.js`):
  `if (catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 || lexical > 0 || score >= 0.70)) return "duplicate";`
- For `rule_4_incompatible_categories` (line 321):
  `if (catSim === 0.0 && !causallyConnected) return "independent";`
Every input is an observable civic complaint signal (text, category, GPS, timestamp). Evaluation harness passes only observable fields.

## 5. Computation of "0.4930" and "85.3%"
- **0.4930 Discrepancy:** All-rules-removed on challenge set yields **52.00% accuracy** (78/150) and **Macro F1 = 0.4198** (duplicate F1: 0.7407, related F1: 0.5185, independent F1: 0.0000; mean = 0.4198). The claim in `FINAL_VERIFICATION_PACK.md` that all-rules-removed equals 0.4930 was **WRONG** (0.4930 was derived from an earlier ablation configuration with partial overrides active).
- **85.3% Computation:** 128 / 150 = 85.33% (reported in early draft before final freeze of 126 / 150 = 84.00%).

## 6. Test Failure Fix & Verification (3 Clean Runs)
- **Root Cause:** In `BACKEND/src/evaluation/spatialQueryBenchmark.js`, `generateSyntheticLocations` computed `createdAt` using `Date.now()`. When generating benchmark docs back-to-back, clock ticks caused millisecond timestamp mismatches between deterministic runs.
- **Fix:** Added default deterministic `baseTime = 1760000000000` to `generateSyntheticLocations`.
- **Run 1 Tail:** `# tests 247 | # suites 111 | # pass 247 | # fail 0 | duration_ms 15725.3`
- **Run 2 Tail:** `# tests 247 | # suites 111 | # pass 247 | # fail 0 | duration_ms 16615.6`
- **Run 3 Tail:** `# tests 247 | # suites 111 | # pass 247 | # fail 0 | duration_ms 17987.5`

## 7. Overlap Stratification Split (< 1.00 vs = 1.00)
Because 57 of 80 test pairs (71.25%) tie at identical overlap 1.00, tertiles are tie-ordered. Re-stratified binary split:
| Stratum | N | Jaccard Overlap | HISC Acc | B1 (Jaccard) | B3 (Cat+Dist) | B4 (TF-IDF) | B6 (Embed) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Overlap < 1.00** | 23 | [0.6154, 0.9091] | 100.00% | 69.57% | 100.00% | 69.57% | 86.96% |
| **Overlap = 1.00** | 57 | [1.0000, 1.0000] | 100.00% | 56.14% | 100.00% | 70.18% | 75.44% |
*Finding:* Uninformative where HISC and B3 are 100% in every group.

## 8. Superseded Statements in FINAL_VERIFICATION_PACK.md
1. **S3 Rule List:** Superseded by Section 1 table. Rule 4 is `incompatible_categories`, not `same_incident_cluster`.
2. **S4 Ablation Numbers:** Superseded by Section 3 table. All-rules-removed macro F1 is **0.4198**, NOT 0.4930.
3. **S5 Category Counts:** The colloquial "10 x 15" claim is superseded by actual definition counts: `[15, 15, 15, 15, 15, 15, 10, 13, 15, 22] = 150`.
4. **S5 Tertiles:** Main-text tertiles are superseded by the binary split (< 1.00 vs = 1.00).

## 9. Git Log Since pre-plan2
```
a4d6210 docs(eval): update overlap stratification binary split and regenerate results
a2cf82e fix(eval): repair generateFactsSheet rules, categories, and T5 label
a799c0a fix(eval): make synthetic spatial benchmark locations strictly deterministic
1567cd8 docs: final verification pack
afbd468 docs: reproduction guide
f1e6e38 docs: diagrams and screenshot checklist
ea914e1 docs: project facts for reports
a66b403 docs: generated facts sheet
8fa9765 chore(test): deterministic seeder baseTime and phase 3 verification gate
5cb4ada docs(deploy): env matrix, smoke script, production checks
ce27fff feat(sla): lazy escalation check for sleeping free hosts
c27773f feat(seed): reproducible demo data seeder
e15134a feat(ui): similar issues warning on complaint report page
34278bf feat(api): similar complaints endpoint for duplicate warning
cc396ea feat(security): helmet, rate limiting, input guards, validation
2ce2777 audit(gate): phase 1 verification gate passed
2709111 docs(eval): note independent evaluation status in results report
7749969 docs(eval): correct claims and chronology in results report
90960ae audit(eval): overlap-stratified test accuracy
1f9c040 fix(eval): correct aggregate F1 reporting in category breakdown
071b841 audit(eval): rule cross-tabs
391f1a4 audit(eval): rule inventory and rule_4 leakage check
```
