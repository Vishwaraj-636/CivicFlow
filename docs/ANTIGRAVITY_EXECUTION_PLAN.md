# CivicFlow Research Follow-up — Antigravity Execution Plan

## 0. Purpose and execution contract

Execute the remaining approved research follow-up tasks in order, starting with Task B. Task A is already complete and must not be repeated or amended unless a later task reveals a concrete defect that requires stopping for review.

This plan is authoritative for this execution sequence. Follow it from top to bottom, update the progress ledger as work proceeds, and stop at the defined safety gates. Do not interpret an instruction to execute the plan as permission to change production behavior, rewrite history, push, deploy, or modify frozen evaluation artifacts.

### Mandatory safeguards

1. **Preserve the frozen evaluation.** Do not modify, regenerate, or overwrite:
   - `BACKEND/data/civicflow_400_labeled_complaint_pairs.csv`
   - `BACKEND/data/splits.json`
   - `BACKEND/data/synthetic_challenge_set_150.csv`
   - `BACKEND/results/final_held_out_evaluation.json`
   - Any frozen predictions, metrics, or artifacts used to produce the final held-out evaluation.
2. Do not modify `BACKEND/src/hisc/scorePair.js` during Tasks B–D or F. Task E may only add a strictly nonbehavioral diagnostic field after proving that labels and scores remain identical.
3. **Do not switch production defaults.** Keep `DEFAULT_HISC_CONFIG.relatedThreshold = 0.35`. `HISC-eval` is a separate evaluation preset. Changing the deployed default to `0.10` requires a separate, explicit user authorization; this plan does not grant it.
4. Do not tune thresholds, weights, rules, or methods against held-out test or challenge outcomes. Use the already-saved predictions for all post-freeze statistical analyses.
5. Never run destructive Git commands: no `git reset`, `git clean`, `git stash`, history rewriting, or equivalent. Do not discard, overwrite, or revert existing work.
6. Never use `git add .` or `git add -A`. Stage only explicitly named files that belong to the current task.
7. Do not push, deploy, or alter remotes. No external publication of results.
8. This is a shared workspace. Before each task, inspect `git status --short`, the current branch, and `git log -1 --oneline`. Preserve unrelated staged, unstaged, and untracked changes. Do not include unrelated work in a task commit.
9. If a target file has changed unexpectedly, a required artifact is missing, or another person's work would be overwritten, stop that task and report the evidence. Do not guess, recreate frozen inputs, or repair unrelated work.
10. Each completed task gets its own focused commit. Before committing, inspect the exact staged diff and run `git diff --check`. Stage only named task files. If unrelated pre-existing staged changes make a safe isolated commit impossible, stop and report instead of manipulating the index destructively.
11. Record commands and raw outputs, relevant file paths, hashes where applicable, test results, and commit hashes. Never claim a check passed unless its output was observed.
12. Do not silently skip a task. If a task cannot be completed safely, mark it `BLOCKED`, explain why, and continue only if the next task does not depend on the blocked task and can be performed safely.
13. Do not start Task G. It requires a new, independently authored challenge set and explicit user authorization as described below.

## 1. Progress ledger

Use only these statuses: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETE`.

Update this ledger in this file after each task. Record the actual commit hash and evidence. Do not claim a task or commit exists without verifying the repository.

| Task | Status | Required outcome / Verified Evidence |
|---|---|---|
| A — Config alignment and preset separation | COMPLETE | Verified commit `59d8071c79b311790e0bb033227cef0c443bd943` present on branch `feat/algorithm`. Production default preserved at 0.35. |
| B — Dataset leakage audit | COMPLETE | Verified commit `af986d389a8ef1887e14856fdb46a51203eb3068`. Zero ID leakage; 84.6% text template leakage in 400-dataset; pristine 0.0% leakage in challenge set. Artifacts: `BACKEND/results/dataset_leakage_audit.{json,md}`. |
| C — Challenge category breakdown | COMPLETE | Verified commit `698c90ea0da76ee2a2b027733dc7ec24a56a6459`. 1:1 join across 150 pairs, all 10 categories evaluated (N>0) for HISC, B3, B4, HISC-embed. Artifacts: `BACKEND/results/challenge_category_breakdown.{json,md}`. |
| D — Statistical comparison and confidence intervals | COMPLETE | Verified commit `56b565778a48b940026e6fbe53492723659223e7`. Exact McNemar tests on N=150 (HISC vs embed p=0.03125, B3 p=5.89e-11, B4 p=2.43e-17, B2 p=2.22e-16). Exact Clopper-Pearson CIs for all 11 methods. Artifacts: `BACKEND/results/statistical_comparison_and_ci.{json,md}`, updated `docs/RESULTS.md`. |
| E — Rule attribution and ablation | COMPLETE | Verified commit `d5531be8fe8bb1c5a968aebe35d03a11e860951b`. Gate E1 passed: non-enumerable `rule_fired` field added without altering contract keys, scores, or labels. Gate E2 passed: rule activations cataloged, leave-one-rule-out ablations run on validation (N=80) and challenge (N=150) without mutating production scorer. Held-out test set strictly preserved. Artifacts: `BACKEND/results/rule_ablation.{json,md}`. |
| F — Spatial-query latency benchmark | COMPLETE | Verified commit `a96c6f34eb6fa4f291c9f4d1e2b58252dcf0b157`. Isolated benchmark across N=1,000, 10,000, and 50,000 documents comparing unindexed $geoWithin (COLLSCAN), indexed $geoWithin (2dsphere FETCH), and indexed $near (GEO_NEAR_2DSPHERE). Measured execution plans, documents examined, p50/p95 latencies, and setup overhead. Speedup ratio reaches 3.4x at 50k without query limits. Artifacts: `BACKEND/results/spatial_query_benchmark.{json,md}`. |
| G — Independent challenge-set evaluation | BLOCKED | Requires a new independent challenge set and explicit authorization |

Task A evidence supplied by the user:
- Branch: `feat/algorithm`.
- Reported commit: `59d8071c79b311790e0bb033227cef0c443bd943`.
- Commit message: `feat(hisc): introduce HISC-eval preset and active configuration diagnostics`.
- Reported files: `BACKEND/server.js`, `BACKEND/src/hisc/config.js`, `BACKEND/src/service/incidentIntelligence.service.js`, `BACKEND/test/hiscScorePair.test.js`.
- Reported tests: 193 passed, 0 failed across 19 suites.
- Reported production default remains `relatedThreshold = 0.35`; evaluation preset uses `0.10`.
- Reported frozen evaluation JSON, original dataset, split manifest, challenge CSV, and `scorePair.js` were unchanged.

First, verify the actual repository state and Task A commit. If the branch or commit differs from the report, do not reset, cherry-pick, or rewrite anything. Reconcile the current state with the evidence and proceed only if the work is present and safe.

## 2. Task B — Read-only dataset leakage audit

**Goal:** Determine whether the original 400-pair dataset, its train/validation/test split, or the synthetic challenge set contains identifiable leakage. Do not edit any dataset or split file.

### Required checks

1. Inspect the authoritative dataset schema, split manifest, and existing split-generation/evaluation code before writing the audit.
2. Verify the reported split sizes: train 240, validation 80, test 80, grouped by `incident_id`, with seed 42. Report actual findings rather than assuming these values are correct.
3. Check complaint/incident identifiers across train, validation, and test. Report cross-split overlap counts and the relevant identifiers.
4. Normalize complaint text using a documented, conservative normalization procedure. Check exact normalized complaint-text overlap across splits and report counts and affected pair IDs.
5. Check near-duplicate complaint text across splits using Jaccard similarity greater than `0.80`. Document tokenization, normalization, threshold, and how candidate comparisons were generated. Report all detected pairs with split names, pair IDs, similarity, and the matching text fields or safely abbreviated excerpts.
6. Check exact and near-duplicate text overlap between the 150-pair synthetic challenge set and the 400-pair dataset using the same documented methodology.
7. Distinguish genuine cross-split leakage from legitimate repeated references or within-pair repetition. Do not declare leakage solely because the same incident is mentioned within a pair.
8. Report limitations, including any inability to establish provenance or identify the original source of a complaint.

### Deliverables

Create a task-specific report under `BACKEND/results/`, with a machine-readable JSON artifact and a readable Markdown report. Choose clear filenames that do not overwrite existing artifacts.

Include:
- dataset hashes and split counts;
- methodology and normalization rules;
- identifier overlap counts;
- exact-text overlap counts;
- near-duplicate counts and individual findings;
- challenge-versus-development/test overlap;
- interpretation, limitations, and recommended next action.

Do not change any dataset, labels, split membership, model, thresholds, or evaluation results. Run any appropriate tests for the audit code. Commit only the named new audit files and any narrowly scoped audit implementation files that are necessary.

Update the ledger with the verified commit hash and observed results before starting Task C.

## 3. Task C — Correct challenge category breakdown

**Goal:** Produce category-level metrics from the existing saved challenge predictions. Do not rescore complaints.

### Required source of truth

- Saved predictions: `BACKEND/results/final_held_out_evaluation.json`.
- Authoritative challenge category definitions: `challengeDataDefinitions.js`, located by inspecting the repository.
- Challenge input: `BACKEND/data/synthetic_challenge_set_150.csv`.

An earlier audit reported that the final category table contains ten categories with `N=0` because the challenge CSV lacks `challenge_category` and the freeze script defaults missing categories to `"standard"`. Verify this against the current files; do not assume the diagnosis without checking.

### Required implementation

1. Trace the saved prediction schema and authoritative challenge category definitions.
2. Join categories to the existing challenge pairs using a stable, verified pair ID or another demonstrably unique key. Do not rely on row order unless the repository proves that row order is authoritative and stable.
3. Check missing IDs, unknown IDs, duplicate IDs, duplicate mappings, missing predictions, and category coverage.
4. Calculate per-category `N`, accuracy, and macro F1 for exactly these methods:
   - HISC
   - B3
   - B4
   - HISC_embed
5. Define macro F1 and handling of empty/undefined class metrics explicitly. Do not silently substitute zero or omit categories without explaining the convention.
6. Fix the category-report generation path so missing categories cannot silently turn into a misleading `"standard"` bucket. Prefer a fail-fast validation error for missing or unmatched category mappings.
7. Keep the aggregate held-out evaluation JSON and its frozen predictions unchanged. If any report generator normally regenerates the frozen JSON, do not run that path.
8. Compare aggregate values against the saved aggregate results as a consistency check, without overwriting them.

### Deliverables

Create or update:
- `BACKEND/results/challenge_category_breakdown.json`
- `BACKEND/results/challenge_category_breakdown.md`

Also make a narrowly scoped change to the category-report generator if necessary. Include category coverage checks and a test that catches the original `N=0`/default-category failure mode.

Commit this task separately. Record category counts, validation checks, changed files, tests, and commit hash.

## 4. Task D — Paired statistical comparisons and accuracy intervals

**Goal:** Quantify uncertainty and compare methods using saved predictions, without rerunning the scorer or tuning the system.

### Required comparisons

Run two-sided exact McNemar tests on the same 150 challenge examples for:
- HISC versus HISC_embed
- HISC versus B3
- HISC versus B4
- HISC versus B2

For each comparison, report:
- number of examples on which both methods are correct;
- number on which both are incorrect;
- HISC correct / comparator incorrect;
- HISC incorrect / comparator correct;
- total discordant pairs;
- the exact two-sided McNemar p-value;
- the statistical method and any multiple-comparison caveat.

Use the paired per-example saved predictions and the correct reference labels. Verify example alignment by stable pair ID. Do not calculate the test from aggregate accuracy values alone.

### Confidence intervals

Add exact Clopper–Pearson binomial confidence intervals for accuracy for every method represented in the relevant final evaluation results. Use the correct sample size and number correct for each evaluation set. State the confidence level, interval method, and sample definition.

Do not describe a pair-level interval as incident-independent evidence unless the sampling design supports that conclusion. Specifically inspect whether resampling at the incident level is valid given the actual group structure. Explain whether incident-clustered bootstrap and pair bootstrap are equivalent here; do not claim equivalence without verification.

### Deliverables

- A task-specific JSON artifact containing the comparison contingency counts, p-values, interval bounds, sample sizes, and method names.
- A readable Markdown report with the results and methodological caveats.
- A focused update to `docs/RESULTS.md` adding the new confidence intervals and paired comparison findings, without rewriting unrelated content or changing frozen aggregate metrics.

Validate calculations independently with a second implementation or hand-checkable test cases. Include edge-case tests for zero discordances and boundary accuracies where appropriate.

Commit separately. Record exact outputs, validation evidence, files, and commit hash.

## 5. Task E — Rule attribution and ablation

**Goal:** Explain which existing scoring rules are being used and provide descriptive ablation results without changing classification behavior or tuning against held-out results.

This task is conditional on proving that the diagnostic instrumentation can be added safely.

### Gate E1 — Prove instrumentation is nonbehavioral

1. Inspect the current `scorePair` implementation and all callers/tests.
2. Identify the exact rule or decision path responsible for each returned label, or record `"threshold"` when no special rule determines the result.
3. Propose a minimal `rule_fired` diagnostic field. Do not change scores, labels, thresholds, weights, feature computations, evaluation configuration, or the production preset.
4. Verify through tests or a deterministic before/after comparison that every previously returned label and score remains identical for the same inputs. Also verify that existing callers do not break because of the added field.
5. If a nonbehavioral change cannot be proved, stop Task E, record the reason in the ledger, and continue to Task F if safe.

### Gate E2 — Rule counts and ablation

If E1 passes:

1. Count the rules that fired on appropriate existing development examples and the challenge examples.
2. Run leave-one-rule-out ablations on validation and the 150-example challenge set only. Never use the held-out test set for ablation.
3. Clearly label challenge ablations as descriptive post-freeze diagnostics, not unbiased generalization estimates.
4. Do not change the production scorer to reflect ablation results. Do not tune thresholds, weights, or rules based on these results.
5. Preserve all original predictions and frozen aggregate results.

### Deliverables

- `BACKEND/results/rule_ablation.json`
- `BACKEND/results/rule_ablation.md`
- Focused instrumentation/tests if the safety gate passes.

The report must define each rule, identify the examples/counts involved, document the ablation protocol, and explain limitations. If an ablation would require mutating shared scorer behavior, use a separate analysis-only implementation or stop rather than altering production logic.

Commit separately. If the safe instrumentation gate fails, document that failure and commit only the narrowly scoped block report if appropriate.

## 6. Task F — Spatial-query latency benchmark

**Goal:** Benchmark spatial query strategies fairly and reproducibly. Do not modify production query behavior as part of this task.

### Isolation and safety

1. Inspect the existing spatial-query implementation, index definitions, benchmark scripts, and database configuration.
2. Use a dedicated isolated synthetic benchmark database or disposable local database. Verify the database target before writing data or creating/dropping indexes.
3. Never run index or data modifications against production, shared development data, or an unknown connection.
4. Do not use a query limit to make an unindexed `COLLSCAN` look faster. Compare equivalent result semantics.
5. Do not modify the frozen datasets, held-out predictions, challenge predictions, scoring function, or production defaults.

### Required comparisons

Benchmark:
- `$geoWithin` / `$centerSphere` with a `2dsphere` index;
- `$geoWithin` / `$centerSphere` without that index;
- the existing indexed `$near` query as a separate comparison.

Use the same synthetic locations, data volumes, geographic query regions, and equivalent result semantics wherever a like-for-like comparison is claimed. Document differences that prevent a strict comparison.

Required document volumes: 1,000, 10,000, and 50,000.

### Methodology and reporting

Document:
- database and runtime versions;
- data-generation procedure and random seed;
- index setup and verification;
- query shape and equivalent semantics;
- warm-up procedure;
- repetitions per case;
- median and tail-latency percentiles, with units;
- execution plans (`explain`) and documents/keys examined where available;
- whether each query used the intended index or performed a collection scan;
- setup time versus query latency;
- any failed runs, outliers, or environment limitations.

Run the benchmark multiple times under a consistent procedure. Do not invent numbers if the environment cannot support a requested scale or execution-plan field. Report the limitation instead.

### Deliverables

- `BACKEND/results/spatial_query_benchmark.json`
- `BACKEND/results/spatial_query_benchmark.md`
- Any narrowly scoped benchmark script necessary to reproduce the results.

Commit separately. Do not alter production query strategy automatically in response to benchmark outcomes.

## 7. Task G — Independent challenge-set evaluation (BLOCKED)

Do not start this task during this execution.

It requires:
1. A new challenge file supplied or explicitly approved by the user.
2. Evidence that its pairs and labels were authored by a person who has not seen `scorePair.js` or used it to select the examples or labels.
3. Explicit user authorization to run the evaluation on that file.

Do not fabricate independent labels, create a purportedly independent challenge set yourself, or relabel existing examples as independent. Do not infer that permission for Tasks B–F authorizes Task G.

After all prerequisites are met, a separately authorized task may validate the schema, calculate and record a SHA-256 hash, freeze the file, run the production scorer exactly once, evaluate all requested methods using that frozen output, calculate confidence intervals, and prohibit subsequent tuning against those results. Until then, leave Task G `BLOCKED`.

## 8. Final verification and closeout

After Tasks B–F have either completed or been explicitly marked blocked:

1. Run `git status --short`, `git log --oneline` for the task commits, and inspect the final diff.
2. Confirm that every task has its own focused commit or a documented reason it could not safely be committed.
3. Confirm no remote push or deployment occurred.
4. Verify the frozen files still match their baseline hashes where the files remain accessible:
   - Original 400-pair dataset: `b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2`
   - Frozen evaluation JSON, as reported in Task A: `0418907B358BC6CFA79A8C81C75AF9D05A641AEC4FCA6766E4D7EA8EFB64CEED`
   - Splits manifest, as reported in Task A: `58039B02AC69BDC78E220E0D979E1E28AA7C6FCDFB0E30595A5082B53BD4A06A`
   - Synthetic challenge CSV, as reported in Task A: `2774C8E133BBC2344C290DD27C52752BE7D5137899A369316836E99CA9D8E89B`

   Hashes are case-insensitive. If a baseline hash differs, stop and investigate; do not overwrite the file to restore a hash. Preserve evidence and report the difference.
5. Confirm `BACKEND/src/hisc/scorePair.js` has not changed in Tasks B–D or F. For Task E, document any strictly diagnostic-only change and the evidence that labels and scores remain unchanged.
6. Verify the final `docs/RESULTS.md` changes and all new report artifacts. Do not regenerate or overwrite the frozen evaluation JSON.
7. Update this file's progress ledger with final statuses and actual commit hashes.
8. Provide a concise final execution report containing:
   - task-by-task status and commit hashes;
   - files added or changed;
   - tests and raw pass/fail counts;
   - leakage audit findings;
   - challenge category coverage and metrics;
   - exact McNemar results and confidence intervals;
   - rule-attribution/ablation results or the reason Task E was blocked;
   - spatial benchmark methodology and results or the reason it was blocked;
   - frozen artifact hash verification;
   - final branch, `git status --short`, and commit history evidence;
   - explicit confirmation that no push/deploy occurred;
   - confirmation that Task G remains blocked pending its prerequisites.

Do not claim all tasks are complete if any task is blocked. Do not claim real-world accuracy from synthetic results. Do not switch production defaults without explicit user authorization.

## 9. Execution order

Execute in this order:

1. Verify Task A's commit and repository state.
2. Task B — read-only leakage audit.
3. Task C — category breakdown from saved predictions.
4. Task D — paired tests and confidence intervals.
5. Task E — rule attribution, only if its safety gate passes.
6. Task F — isolated spatial-query benchmark.
7. Task G — remain blocked.
8. Final verification and closeout.

Before each task, confirm that the current workspace and frozen artifacts are safe to work with. After each task, validate the output, commit that task separately, and update the ledger before proceeding. Stop on any safety violation or unexpected conflict. Never perform a destructive recovery action to force the sequence to continue.