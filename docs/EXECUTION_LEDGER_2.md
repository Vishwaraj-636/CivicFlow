# EXECUTION LEDGER 2

Started: Sunday, October 11, 2026 6:08:20 PM
Node: v22.16.0
Branch: feat/algorithm
HEAD at start: fba5d5d251fc120d1ed98ae31384a5a87e77eed6

| ID | STATUS | commit hash | one-line note |
|---|---|---|---|
| 0.1 | DONE | fba5d5d251fc120d1ed98ae31384a5a87e77eed6 | Recorded environment, created tag pre-plan2, initialized ledger |
| 0.2 | DONE | fba5d5d251fc120d1ed98ae31384a5a87e77eed6 | All 4 frozen dataset/evaluation SHA-256 hashes verified matching exactly |
| 0.3 | DONE_WITH_NOTES | fba5d5d251fc120d1ed98ae31384a5a87e77eed6 | Backend 225/226 tests pass (1 known flaky timestamp failure in spatial test), frontend build passes |
| 0.4 | DONE | fba5d5d251fc120d1ed98ae31384a5a87e77eed6 | Verified local MongoDB reachable at 127.0.0.1:27017, env names cataloged |
| 0.5 | DONE | fba5d5d251fc120d1ed98ae31384a5a87e77eed6 | Earlier work check: preDeployment tracked, media roles present, rollback present; PENDING_H10=false |
| 1.1 | DONE | 391f1a4 | Rule inventory completed; proved LEAK=false (no ground-truth grouping read); leak-free acc 84.0%, macro F1 0.8343 |
| 1.2 | DONE | 071b841 | Cross-tabs (rule_fired x actual x predicted) and leave-one-rule-out validation comparison added to rule_inventory.md |
| 1.3 | DONE | 1f9c040 | Removed undefined per-category F1 and aggregate F1; reported N, correct, accuracy, and predicted counts |
| 1.4 | DONE | 90960ae | Overlap-stratified accuracy computed (71.3% degenerate at 1.00; median & tertile splits reported; causal caveat included) |
| 1.5 | DONE | 7749969 | Stale claims swept, canonical name updated, chronology and disclaimers inserted, RESULTS.md regenerated |
| 1.6 | SKIPPED(no independent set provided) | 2709111 | Independent challenge set files not present; added limitations note to RESULTS.md |
| 1.7 | DONE | 2ce2777 | Phase 1 gate: 225/226 tests passed (1 known flaky spatial failure), all 4 protected hashes match |
| 2.1 | SKIPPED(already present) | 2ce2777 | Staff request rollback, resolution media validation, and media roles already present from earlier work |
| 2.2 | DONE | cc396ea | Helmet headers, general & auth rate limiting, Express 5 $ operator guard, zod validation, SECURITY.md |
| 2.3 | DONE | 34278bf | GET /api/complaints/similar endpoint with HISC scoring, privacy guard, and submittedDespiteSimilar flag |
| 2.4 | DONE | e15134a | Duplicate-warning UI with debounced 600ms similar search, expandable signals, support, and silent fallback |
| 2.5 | DONE | [pending commit] | Reproducible demo data seeder with PRNG seed 42, 120 complaints, 11 clusters, and DEMO_CREDENTIALS.md |
