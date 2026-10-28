# ANTIGRAVITY EXECUTION PLAN 2: CivicFlow integrity fixes, product completion, deployment readiness, handoff

## SECTION 0. EXECUTION PROTOCOL (read fully before doing anything)

MISSION. Execute every step below in order, without asking the user any question, until the FINAL STEP. Make decisions with the DECISION rules written in each step. Log every assumption in the ledger.

ENVIRONMENT. Windows (win32), PowerShell. Do not use bash-only commands. Use Node scripts (crypto, fs) for hashing and file work. Project root contains BACKEND/, FRONTEND/, docs/. Node 22. Local MongoDB at 127.0.0.1:27017.

LEDGER. Create or resume docs/EXECUTION_LEDGER_2.md with one row per step: ID | STATUS | commit hash | one-line note. Update it after every step and include it in that step's commit. On start, if the ledger exists, skip every step already DONE or SKIPPED and continue from the first step that is not.
STATUS values: DONE, DONE_WITH_NOTES, SKIPPED(reason), BLOCKED(reason).

FAILURE HANDLING. If a command fails, diagnose and fix, with at most 2 attempts. If the step still fails: mark it BLOCKED with the error summary, revert that step's uncommitted changes (git checkout -- <paths>; delete new untracked files of that step), and CONTINUE with the next step. Never stop the whole plan except for the STOP conditions below.

STOP CONDITIONS (the only reasons to halt early; then write the pack with what you have):
S1. A frozen artifact's hash differs and git cannot restore it from HEAD.
S2. You cannot restore a previously passing test suite after your own change (revert it, mark the step BLOCKED, continue; STOP only if the revert itself fails).
S3. MONGO_URI points to a remote or production database (mongodb+srv, or a host other than localhost/127.0.0.1) and a step would write to it: skip that step (SKIPPED(remote db)); never write to it.

TIME BUDGET. Record the start time with Get-Date in step 0.1. Phases 2 and 4 are time-boxed: before each Phase 2 or Phase 4 step, compute minutes elapsed. If elapsed is above 120 minutes, mark all remaining Phase 2 and Phase 4 steps SKIPPED(time budget) and jump to Phase 3 (if not done) and then Phase 5. Phases 0, 1, 3 and 5 are never skipped for time.

GIT RULES. Stay on the current branch. Never push, never merge, never change git config, never rewrite history. One commit per step with prefix, for example "fix(eval): ...". Stage by explicit path, never "git add -A". Run git diff --check and check that no .env file or secret is staged before each commit. Print git status after each commit.

PROTECTED, NEVER MODIFY (not even formatting):
- BACKEND/results/final_held_out_evaluation.json
- BACKEND/data/splits.json
- BACKEND/data/synthetic_challenge_set_150.csv
- civicflow_400_labeled_complaint_pairs.csv
- scoring behavior in BACKEND/src/hisc/scorePair.js (comments allowed, logic not)
- DEFAULT_HISC_CONFIG in BACKEND/src/hisc/config.js (relatedThreshold must stay 0.35)
Expected SHA-256 (uppercase hex):
- final_held_out_evaluation.json 0418907B358BC6CFA79A8C81C75AF9D05A641AEC4FCA6766E4D7EA8EFB64CEED
- splits.json 58039B02AC69BDC78E220E0D979E1E28AA7C6FCDFB0E30595A5082B53BD4A06A
- synthetic_challenge_set_150.csv 2774C8E133BBC2344C290DD27C52752BE7D5137899A369316836E99CA9D8E89B
- civicflow_400_labeled_complaint_pairs.csv B4653AC507F422A3B6F5FFADB291D5440EAB0CB07174F2398AD72739E86A33F2

GENERAL RULES.
- Never fabricate a number. Every number in any document must come from a script run or a file read in this plan.
- Never print secret values (tokens, keys, passwords, connection strings). Redact them as [REDACTED].
- New behavior goes behind existing config or env patterns; defaults keep current behavior unless a step says otherwise.
- Free tools only, minimal new dependencies (only the ones named in this plan).
- After every step that changes backend code run npm test in BACKEND; after every step that changes frontend code run npm run build in FRONTEND. If a previously passing test now fails because of your change, fix your change, not the test (unless the test encoded behavior this step intentionally changes; then update it and note it in the ledger).
- Do not touch the old docs/ANTIGRAVITY_EXECUTION_PLAN.md.

## PHASE 0. PREFLIGHT

STEP 0.1 Setup. Record Get-Date (start time), node -v, git branch, git rev-parse HEAD, git status --short. Create the tag pre-plan2 on HEAD (git tag pre-plan2). Create the ledger.
DECISION: If git status shows modified TRACKED files: list them. If they are protected files, restore with git checkout -- <file>. Otherwise leave them untouched and note them; do not commit them unless a later step edits the same file (then include only your own edits).

STEP 0.2 Frozen hash check. Compute SHA-256 of the four protected data files with a Node script. Compare with the expected values.
DECISION: All match: continue. A mismatch: git checkout -- <file> and recompute; if it still mismatches, trigger STOP S1.

STEP 0.3 Baseline. In BACKEND run npm test. Record the raw "# tests / # suites / # pass / # fail" lines. In FRONTEND run npm run build; record success or failure and the last 10 lines.
DECISION: Tests all pass: note the baseline count (BASE_TESTS). Some fail: record the failing test names as KNOWN_FAILURES; do not try to fix them unless a later step touches the same area. Frontend build fails: record the error; if the cause is in a file a later step will edit, fix it then; otherwise mark DONE_WITH_NOTES.

STEP 0.4 Environment facts. Print (redacting secrets) which of the env vars the backend reads exist in BACKEND/.env (names only, present/absent, never values). Check whether MongoDB at 127.0.0.1 is reachable. Read MONGO_URI host only.
DECISION: Mongo not reachable: mark every step that needs a database (2.3 tests, 2.5, 2.6, 3.3) BLOCKED(no local mongo) when you reach it, and continue. MONGO_URI is remote: apply S3 to every seeding or write step.

STEP 0.5 Earlier-work check. Determine from HEAD (git, not memory):
(a) whether BACKEND/test/preDeployment.test.js is tracked;
(b) whether BACKEND/src/controller/deptStaffRequest.controller.js still uses mongoose sessions or withTransaction (standalone MongoDB needs no sessions);
(c) whether the route POST /complaints/media allows roles dept_staff and admin;
(d) whether resolution-media payload items are validated per item (type, URL string, size) in resolveComplaint;
(e) whether staff approval has compensation or rollback when a second write fails;
(f) whether the frontend ReportComplaint prevents duplicate submits.
Record each as PRESENT or MISSING. If (a),(b),(c) or (f) is MISSING, set PENDING_H10 = true. If (d) or (e) is MISSING, set PENDING_H10_VALIDATION = true.

## PHASE 1. EVALUATION INTEGRITY (mandatory)

STEP 1.1 Rule inventory and rule_4 label-leak check (read-only analysis).
Read BACKEND/src/hisc/scorePair.js completely. Produce a table of EVERY rule_fired identifier: id, trigger condition (quote the code line), forced label, and the exact input fields it reads. Reconcile with the previously reported six-rule list (distant boundary, temporal boundary, operational radius, incompatible categories, duplicate gate, related-opposing-direction) versus the Task E catalog (rule_1_distant_boundary, rule_2_incompatible_categories, rule_3_expired_temporal_window, rule_4_same_incident_cluster, threshold_duplicate, threshold_related): say which statements in earlier reports were inaccurate. State whether the code of scorePair.js changed between commit c1a4cdd and HEAD (git diff c1a4cdd HEAD -- BACKEND/src/hisc/scorePair.js, show only the stat).
Specifically for rule_4_same_incident_cluster: list every field it reads from the two input objects and trace where the evaluation harness (hiscEvaluationHarness.js or runFinalEvaluationFreeze.js) populates those fields from dataset columns.
DECISION: Let LEAK = true if the rule reads, directly or indirectly, a dataset-ground-truth field that the production pipeline would not have for a NEW complaint: for example incident_id, groupId, label, pair_id grouping, or a flag derived from them. Let LEAK = false if it uses only observable signals (text, category, location, time, or an existing cluster id that the production service really assigns before scoring).
- If LEAK = true: write the finding verbatim in the pack ("rule_4 uses ground-truth incident grouping available only in the evaluation harness; challenge results with rule_4 enabled are not leak-free"). Do NOT change scorePair.js behavior. Compute the leak-free number: from the existing rule ablation artifact (results/rule_ablation.json) take the challenge-set predictions with rule_4 disabled; if per-pair predictions are in the artifact, compute accuracy, macro F1 (from the confusion matrix) and exact Clopper-Pearson CI from them; if not, run the existing ablation harness from Task E with rule_4 disabled on the challenge set and the validation set ONLY (never the test set), saving to a NEW file results/rule4_disabled_challenge.json (this is a descriptive development analysis, not a re-evaluation of frozen results). Record these as LEAKFREE_CHALLENGE_ACC and LEAKFREE_CHALLENGE_MACROF1.
- If LEAK = false: record the evidence and set LEAKFREE_* equal to the frozen numbers.
Output: results/rule_inventory.json and results/rule_inventory.md (table, code quotes, decision, leak-free numbers). Commit "audit(eval): rule inventory and rule_4 leakage check".

STEP 1.2 Rule cross-tabs. From results/rule_ablation.json and saved predictions only (no scoring run): for the challenge set produce the cross-tab rule_fired x actual x predicted, and the count of pairs decided by each rule and by thresholds; the same for the validation set if available. Add leave-one-rule-out accuracy on the VALIDATION split next to the challenge values and the accuracy with all rules removed on validation.
DECISION: If validation data is missing in the ablation artifact: re-run the Task E ablation harness on the validation split only and save to results/rule_ablation_validation.json. Never run it on the test split.
Output: append to results/rule_inventory.md under "Cross-tabs". Commit "audit(eval): rule cross-tabs".

STEP 1.3 Metric definitions.
(a) Find the code and the files that produced "0.4930" (challenge aggregate F1 in the category breakdown) and "85.3%" (test macro F1 in the leakage audit report): grep results/, docs/, BACKEND/src/evaluation/.
(b) Confirm from the saved predictions in final_held_out_evaluation.json that aggregate macro F1 for HISC is 0.8343 (challenge) and 1.0000 (test) using a fresh computation from the confusion matrix.
(c) Change the challenge category breakdown generator so it reports per category: N, correct, accuracy, and the predicted-class counts only; per-category F1 and "aggregate F1" are removed and replaced by the text "not reported: per-category F1 is undefined when classes are absent". Regenerate results/challenge_category_breakdown.json and .md.
DECISION: If "85.3%" cannot be traced to a computation: delete it from every document that contains it and record that fact. If it traces to a defined computation (for example mean of per-class F1 on some subset), correct the label to state exactly what it is.
Commit "fix(eval): correct aggregate F1 reporting in category breakdown".

STEP 1.4 Leakage stratification (saved predictions plus text only; no scoring).
For every pair in the held-out test split: tokenize both complaint texts the same way the leakage audit does; for each text compute its maximum token-Jaccard against all training texts; pair overlap = mean of the two maxima. Sort the 80 test pairs by pair overlap and split into three equal-size groups (tertiles). For each tertile report N, overlap range, and accuracy for HISC, B1, B3, B4, B6 (read predictions from final_held_out_evaluation.json).
DECISION: If more than two thirds of pairs share the same overlap value to 2 decimals (degenerate distribution): use a median split instead and also print the count with overlap above 0.8; if there is still no variation, write "insufficient variation to stratify" and do not force a result.
Also compute the same statistic as one line: Spearman or point-biserial correlation between pair overlap and correctness for HISC and B4 (if undefined because all correct, say so).
Output: append to the dataset leakage audit report (find the file under results/) as section "Overlap-stratified accuracy" with the sentence: "Overlap was measured; a causal effect on the test-to-challenge performance gap is not established." Commit "audit(eval): overlap-stratified test accuracy".

STEP 1.5 Stale-claims sweep and RESULTS.md rewrite.
(a) Run these searches over README.md, docs/**, BACKEND/results/**/*.md (not the frozen .json), FRONTEND/src and BACKEND/src comments and strings, case-insensitive:
"Hierarchical Incident Stream", "strictly withheld", "exactly once", "never used", "zero retuning", "post-hoc retuning", "without retuning", "97.5", "0.975", "223.9", "150.0%", "0.493", "85.3", "sub-15", "template leakage".
(b) For each hit decide:
 - Wrong name: replace by "Hybrid Incident Similarity and Clustering (HISC)" (check docs/TECHNICAL_ARCHITECTURE.md for the canonical expansion and use that if different).
 - Overclaim about test or challenge being unused or evaluated once: rewrite using the CHRONOLOGY text below.
 - Old headline numbers (97.5%, 0.975, 223.9%, +150%): keep only in a clearly labeled "historical, pre-split, whole-dataset development result" context; remove them from abstracts, summaries and any place that reads like a current result.
 - "template leakage explains the gap": rewrite as "text overlap between development splits was measured; whether it explains the test-to-challenge gap is not established".
 - "sub-15ms": keep only if tied to the measured scoring harness latency and labeled so.
 Frozen JSON files are not edited. The frozen markdown BACKEND/results/final_held_out_evaluation.md is left as is.
(c) Edit the report generator (BACKEND/src/evaluation/generateResultsReport.js and any template files it uses), NOT the generated RESULTS.md by hand, then run npm run results:report. Required content changes in docs/RESULTS.md:
 1. Replace the wrong name everywhere.
 2. Section A "Training and Validation Rules" item 3 and Section J item 6: replace with the CHRONOLOGY text below.
 3. Add section "What these results do and do not show" with the DISCLAIMER block below.
 4. Add the RULE statement filled from STEP 1.1 (numbers: rules decided 106 of 150 challenge predictions = 70.7%; with all rules removed accuracy falls from 84.0% to 54.0%, near the category+distance baseline at 56.7%; rule_4 finding and leak-free numbers from STEP 1.1).
 5. Mark Section G (feature ablation) "Historical: pre-rule pipeline (Phase A3), not comparable to the final configuration".
 6. Replace the old Section H spatial benchmark table (unindexed stage "LIMIT") with the Task F results from results/spatial_query_benchmark.json (indexed vs unindexed $geoWithin like-for-like; $near listed separately with the note that it returns distance-sorted candidates). Keep the embedding-overhead row with the note "no embedding cache (541 misses, 23 hits); unoptimized prototype measurement; not representative of a tuned deployment".
 7. Add generated sections for: leakage audit (with the tertile table), challenge category accuracy (accuracy only), McNemar table with contingency counts, rule ablation, and the preset note (evaluated preset HISC-eval 0.60/0.10; deployed default 0.35; no result describes the deployed configuration).
 8. Update the artifact manifest with the new results files and their commits.
(d) Re-run the sweep searches; every remaining hit must be either in a historical/quoted context or in a frozen file. List remaining hits and why in the pack.
CHRONOLOGY text (insert verbatim): "Chronology and development-set status. In Phase A3 the HISC scorer was evaluated on the validation, test and challenge partitions (test 97.50%, challenge 57.33%). Afterwards the concept vocabulary and contextual rules were revised and the scorer was extracted into a pure module. The final freeze then evaluated all methods on the test and challenge partitions without changing weights or thresholds. For HISC and its variants both partitions therefore function as development sets: 'held-out' means held out from threshold selection only. For the baselines B1-B6, thresholds were selected on the validation partition only."
DISCLAIMER block (insert verbatim, bullets): "All data is synthetic and authored by the project team. The challenge set was written with knowledge of the algorithm and was used during development; it is a stress test, not an unseen evaluation. 100% accuracy on the standard test split reflects an easy, saturated benchmark: a category-plus-distance rule also reaches 100%, and test texts largely repeat training templates. HISC is a rule-augmented scorer; most challenge predictions were decided by rules, not by the weighted score. No real-world data, cluster-level evaluation or user study was performed. Statistical tests describe this synthetic development set, not a random sample of real complaints."
DECISION after regeneration: verify that every numeric table value in RESULTS.md that existed before is unchanged except where this step intentionally changed it; produce the old-versus-new diff summary (counts of changed lines per section) for the pack. If any evaluation metric changed unexpectedly, restore the generator from git, find the cause, and redo.
Commit "docs(eval): correct claims and chronology in results report".

STEP 1.6 Independent challenge set (Task G).
DECISION: If BACKEND/data/independent_challenge_set.csv does NOT exist OR BACKEND/data/independent_challenge_authorship.md does NOT exist: STATUS SKIPPED(no independent set provided). Add to RESULTS.md Limitations: "No independent unseen evaluation was performed." Continue.
If both exist, validate in this order and mark SKIPPED(reason) at the first failure:
 (i) CSV has the same columns as synthetic_challenge_set_150.csv; at least 30 rows; labels only duplicate/related/independent.
 (ii) The authorship file contains these lines with these answers: "Authors:" (names), "Labelers:" (names), "Labeled before scoring (yes/no): yes", "Authors saw scorePair.js (yes/no): no". If the last answer is yes, SKIPPED(not independent).
 (iii) Exact-normalized and Jaccard>0.8 text overlap with the 400-pair set and the 150-pair set; if overlap above 5% of texts, record it as a caveat but continue.
If all pass: record SHA-256 of the CSV; write BACKEND/src/evaluation/runIndependentEvaluation.js that runs the same 11-method roster with the same frozen parameters as runFinalEvaluationFreeze.js (import helpers; if not exported, copy construction logic into the new file without modifying the original); run it ONCE; save per-pair predictions and metrics (accuracy, per-class P/R/F1, macro F1, confusion matrix, exact Clopper-Pearson CI, bootstrap CI seed 42) to results/independent_evaluation.json and .md. Never tune afterward. Add a section to RESULTS.md with the caveat about the number of authors and independence statement as written in the authorship file. Commit "eval: independent challenge set single-run results".

STEP 1.7 Phase 1 gate. npm test (same or more passing than BASE_TESTS, KNOWN_FAILURES unchanged); recheck the four protected hashes. If a hash changed, git checkout the file and find which step touched it; fix that step. Update the ledger.

## PHASE 2. PRODUCT COMPLETION (time-boxed; order of importance 2.2, 2.3, 2.4, 2.5, 2.1, 2.6)

STEP 2.1 Pending fixes. DECISION: If PENDING_H10 or PENDING_H10_VALIDATION is false: SKIPPED(already present). Otherwise implement only the missing items from STEP 0.5:
 - staff request approval: no mongoose sessions; if the second write fails, compensate (revert the user role or request status) and return an error; validate that the target department exists and is active.
 - resolution media: validate every item (type in image/video, URL is a string starting with https, size within existing limits) in resolveComplaint; reject with 400 and the existing error shape.
 - POST /complaints/media allowed for citizen, dept_staff, admin.
Add tests for each fix. Commit separately per fix.

STEP 2.2 Security hardening (Tier 1 of Phase 2).
 - Install helmet and express-rate-limit (npm install in BACKEND). Install zod.
 - app.js: set app.set("trust proxy", Number(process.env.TRUST_PROXY ?? (NODE_ENV==="production" ? 1 : 0))); app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })).
 - Rate limits: general 300 requests per 15 minutes per IP; auth routes (login, register, google callback) 20 per 15 minutes; return JSON with the existing error shape and status 429. Disable limiters when NODE_ENV==="test" or RATE_LIMIT_DISABLED==="1"; the new security test enables them explicitly.
 - Operator-injection guard: a small custom middleware (do NOT use express-mongo-sanitize, it is incompatible with Express 5 because req.query is read-only) that recursively inspects req.body, req.params and req.query and answers 400 if any key starts with "$". Never assign to req.query.
 - zod validation on: register, login, create complaint (title 5-200 chars, description 10-5000, category from the existing enum, location coordinates numeric within lng -180..180 and lat -90..90), and the new similar endpoint (step 2.3). DECISION: if a validation rule breaks an existing legitimate test payload or the live frontend payload, loosen the schema to match the real payload; do not edit tests to fit stricter rules. Keep the existing error response shape.
 - Write BACKEND/test/securityHardening.test.js: helmet headers present (x-content-type-options), 429 after exceeding the auth limit with limiter enabled, $-key bodies rejected with 400, invalid register payload 400, valid payloads still pass.
 - Write SECURITY.md (measures, how to configure TRUST_PROXY, known gaps: no CSRF tokens (sameSite cookies used), no account lockout, no virus scanning).
 DECISION: If npm install of any package fails: retry once; then implement that part manually without the package (rate limit can be a small in-memory map) and note it.
Commit "feat(security): helmet, rate limiting, input guards, validation".

STEP 2.3 Similar-complaints endpoint.
 - Route GET /api/complaints/similar (authenticated, any role) with query lat, lng, category, text. Validate with zod.
 - Logic: reuse the candidate retrieval of the clustering service (2dsphere $near, radius 1000 m, last 30 days, cap 40, exclude deleted); score each candidate with scorePair using DEFAULT_HISC_CONFIG (production defaults, thresholds 0.60/0.35, embedding provider none); return the top 5 whose label is duplicate or related.
 - Response per item: id, title, short description (first 160 chars), category, status, distanceMeters, createdAt, supportCount, score, label, feature breakdown, explanation. Do NOT return the author identity or contact data.
 - Tests (BACKEND/test/similarComplaints.test.js): auth required (401); validation failures (400); returns only the allowed fields; ordering by score; a clearly related seeded complaint appears, a distant one does not.
 - Add the optional boolean field submittedDespiteSimilar (default false) to the Complaint schema and accept it in create; add one test.
Commit "feat(api): similar complaints endpoint for duplicate warning".

STEP 2.4 Duplicate-warning UI (FRONTEND/src/features/citizen/pages/ReportComplaint.jsx and a new component file under the same feature).
 - When title+description length is at least 15 characters and a location is set: call the endpoint with a 600 ms debounce; abort stale requests.
 - Show "Similar issues near you" cards (title, status, distance, label badge, support count, expandable feature breakdown bars using the existing similarity-explanation component if one exists). Buttons: "I am affected too" (call the existing support API; show success; then hide the card), and "My issue is different" (collapse the panel; set submittedDespiteSimilar=true in the create payload). The citizen can always submit.
 - Failure of the endpoint must not block submission (silent fallback).
 - Acceptance: npm run build passes; no changes to unrelated pages.
DECISION: If the existing support API route cannot be called from this page (route missing or role blocked): show only the cards without the support button and note it.
Commit "feat(ui): similar issues warning on complaint report page".

STEP 2.5 Demo data seeder (Tier 1 of Phase 2 for report screenshots).
 - Read the models first. Create BACKEND/src/scripts/seedDemo.js and npm script "seed:demo".
 - Safety: refuse to run if NODE_ENV==="production". DECISION on database: if MONGO_URI host is localhost/127.0.0.1 run; else require the flag --allow-remote AND env DEMO_SEED_ALLOW_REMOTE=1, otherwise exit with a clear message (S3).
 - Reproducible: seeded PRNG (seed 42). Idempotent: demo users use emails ending @demo.civicflow.local; delete previous demo users and their dependent documents (complaints, timelines, supports, notifications, messages, clusters that contain only demo complaints), then recreate.
 - Create: 1 admin (admin@demo.civicflow.local), 3 department staff (existing seeded departments: Roads, Water, Sanitation), 10 citizens, about 120 complaints over the last 60 days at about 12 Chennai-area locations (around VIT Chennai/Kelambakkam, Perungalathur, Medavakkam, Guindy, Velachery, Tambaram) with realistic English text and some Tanglish-style phrasing; all categories; priority and SLA from the real services; status mix: about 15% submitted, 15% assigned, 20% in_progress, 20% resolved pending verification, 15% closed, 5% rejected-then-reopened (with resolutionVerificationRemark), 10% escalated (overdue). Also 10 to 12 incident groups of 2 to 5 near-duplicate complaints created by calling the real clustering function so clusters are genuine; supports on some complaints; consistent timeline events for each status; resolution proof placeholder URLs (https://placehold.co/600x400?text=Resolution+Proof) for resolved and closed items; notifications for resolution verification.
 - Password for all demo users: Demo@12345 (hashed via the real auth hashing). Write docs/DEMO_CREDENTIALS.md with the demo emails and password and the warning not to use demo accounts on a public production database with real users.
 - Tests: unit tests for the pure generator (counts, status distribution within tolerance, deterministic output with the same seed). Run the seeder twice; the second run must leave identical counts.
 - Output for the pack: a table of counts per collection and per complaint status.
 DECISION: If the clustering service cannot be called outside a request context: call its exported function directly with the created complaint documents; if that still fails, create clusters through the models directly and note it.
Commit "feat(seed): reproducible demo data seeder".

STEP 2.6 Lazy SLA escalation. Implement a throttled helper (runs escalateOverdueComplaints at most once per 60 seconds per process) and call it from the staff queue, admin dashboard and admin escalation list controllers before they read data. Do not change the existing 60-second interval. Tests: an overdue seeded complaint is escalated after a call; a second call within the interval does not run again.
Commit "feat(sla): lazy escalation check for sleeping free hosts".

## PHASE 3. DEPLOYMENT READINESS (mandatory)

STEP 3.1 Environment variable matrix. Search BACKEND and FRONTEND source for process.env.* and import.meta.env.*. Produce a table: variable, used in (file), required (yes/no), default, set in render.yaml / vercel.json / DEPLOYMENT.md (yes/no). Output docs/ENV_MATRIX.md (names only).
DECISION: Any variable used in code but missing from DEPLOYMENT.md or the env templates: add it to DEPLOYMENT.md and the .env.example files (create the example files if missing, with placeholders only). Any variable documented but unused: note it.

STEP 3.2 Embedding lazy-load check. Find every import of @huggingface/transformers or @xenova/transformers.
DECISION: If any static top-level import exists in a file reachable from server.js or app.js (non-evaluation code): convert it to a dynamic import() inside the function that needs it, executed only when EMBEDDING_PROVIDER is "local"; behavior must be unchanged (npm test same count). Verify by starting the server with EMBEDDING_PROVIDER unset and printing process.memoryUsage().rss after startup; record the value. If imports are already lazy: note it. Document in DEPLOYMENT.md: production sets EMBEDDING_PROVIDER=none (the free 512 MB host cannot run the local model).

STEP 3.3 Production-mode local run. DECISION: if S3 or no Mongo applies, SKIPPED(reason). Otherwise: start the backend on a free port with NODE_ENV=production, a local Mongo database named civicflow_prodcheck, JWT_SECRET set to a throwaway test value, CLIENT_URL=http://localhost:5173 and the other required variables as placeholders. Using a Node script (fetch), verify and record:
 (a) GET /health returns 200;
 (b) CORS preflight from Origin http://localhost:5173 returns access-control-allow-origin with that origin and allow-credentials true; from Origin http://evil.example no allow-origin header;
 (c) a login with demo or throwaway user sets a cookie with HttpOnly, Secure and SameSite=None attributes;
 (d) helmet headers present;
 (e) the Socket.IO endpoint answers a polling handshake with websocket transport allowed.
Stop the server; drop the civicflow_prodcheck database.
DECISION: Any failed check: fix the configuration (config.js / app.js), re-run once, record.

STEP 3.4 Smoke-test script. Create scripts/smoke.mjs at the repository root: parameters --api <url> --web <url> (optional) and optional env SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD. Checks: API /health 200; CORS preflight allow-origin for the given web origin; unauthenticated GET /api/complaints/similar returns 401; if credentials given: login 200 and cookie flags; web URL returns 200 HTML. Prints a PASS/FAIL table; exit code 1 on any FAIL. Run it against the local production-mode server from step 3.3 (if run) and record the output.

STEP 3.5 Deployment documents consistency. Read DEPLOYMENT.md, render.yaml, FRONTEND/vercel.json. Check and fix: build and start commands match package.json scripts; Node version (add "engines": { "node": ">=20" } to BACKEND/package.json if missing); the health check path; branch deployed (record which branch render.yaml or the docs assume and the current branch); the Google OAuth production redirect URI instructions; MongoDB Atlas M0 notes (IP allowlist 0.0.0.0/0 for free hosting, database user, connection string format with placeholder); UptimeRobot keep-alive on /health; cross-domain cookie notes (SameSite=None; Secure); VITE_API_URL and VITE_SOCKET_URL for the frontend; the ordered deployment sequence (Atlas, Render, Vercel, update CLIENT_URL on Render, update Google OAuth URIs, run smoke script, optionally seed demo data with --allow-remote). Add a "Post-deploy smoke test" and a "Rollback" section.
Commit "docs(deploy): env matrix, smoke script, production checks".

STEP 3.6 Hardcoded URL and secret scan. (a) git grep for "localhost" and "127.0.0.1" in non-test BACKEND/src and FRONTEND/src; each hit must read an env var or be a documented development default. (b) Scan tracked files at HEAD for secret patterns (AIza[0-9A-Za-z_-]{30,}, private_key, "mongodb+srv://" with credentials, "-----BEGIN", long random strings assigned to variables named secret, key, token, password) and check whether any .env file is tracked (git ls-files | findstr .env). Also search git history for .env files ever committed (git log --all --diff-filter=A --name-only | findstr /i ".env").
DECISION: Never print secret values; print file:line and [REDACTED]. If a real-looking secret or a tracked .env is found: write CRITICAL in the ledger and the pack with the file and the instruction "rotate this credential before pushing to GitHub"; add the file to .gitignore and run git rm --cached for tracked .env files (do not rewrite history). Hardcoded dev URLs: replace with env-driven values where trivial.

STEP 3.7 Phase 3 gate. npm test, frontend npm run build, the four protected hashes. Update the ledger.

## PHASE 4. HANDOFF ARTIFACTS (time-boxed)

STEP 4.1 Generated facts sheet. Create BACKEND/src/evaluation/generateFactsSheet.js and npm script "facts:sheet" that reads results JSON files (final_held_out_evaluation.json, statistical_comparison_and_ci.json, challenge_category_breakdown.json, rule_ablation.json, rule_inventory.json, spatial_query_benchmark.json, t4_latency_benchmark.json, dataset leakage audit JSON, learned_weights.json, and independent_evaluation.json if present) and writes docs/FACTS_SHEET_GENERATED.md: dataset facts, preset thresholds, per-method test and challenge accuracy with exact CIs and macro F1 with bootstrap CI, McNemar table, rule counts, leak-free challenge numbers (from step 1.1), leakage overlap and tertile table, spatial benchmark table, mandatory caveats (the DISCLAIMER block plus chronology text). No hand-typed numbers. Run it.

STEP 4.2 Report facts document: docs/PROJECT_FACTS_FOR_REPORTS.md, built by reading the code (not memory): architecture and data flow; technology stack with versions from package.json; every Mongoose model with fields and indexes; every API route (method, path, allowed roles, controller) verified by grep; every frontend route and page by role; the complaint status state machine; SLA durations; priority rules; socket events; env variables (names); automated test files with test counts per file; module-to-file map; a section "Team focus areas (team-declared, not derived from git)" listing: Vishwaraj Singh Shekhawat: backend core, auth, models, lifecycle API, HISC, SLA, priority; Harshit Sharma: frontend, integration, deployment, security, test suite; Anshika: evaluation, dataset and challenge set, baselines, statistics, documentation, knowledge base. Add one line: "Development was done collaboratively on a shared workstation; Git history shows a single account."

STEP 4.3 Diagrams and screenshot checklist. Write docs/DIAGRAMS.md with Mermaid sources: system architecture, ER diagram from the real models, complaint state machine, HISC scoring flowchart (including rules), deployment diagram, citizen-to-resolution sequence diagram. Write docs/SCREENSHOT_CHECKLIST.md: one row per page to capture (URL path, role, demo account to log in with, data prerequisite, suggested figure caption), including the duplicate-warning panel, rejection feedback banner, admin heatmap, escalation list, staff resolve modal, incident room chat, and the AI service desk. Add a short list of terminal evidence to capture (npm test output, evaluation report, benchmark tables).

STEP 4.4 Reproduction guide: docs/REPRODUCE.md with the exact commands (install, env setup, run backend and frontend, npm test, evaluation commands, results:report, facts:sheet, seed:demo, benchmark scripts, smoke script) as discovered from package.json scripts.
Commit each artifact with prefix "docs:".

## PHASE 5. FINAL VERIFICATION (mandatory)

STEP 5.1 Final checks: recheck the four protected hashes; run npm test in BACKEND (raw tail); npm run build in FRONTEND (raw tail); git status; git log --oneline for commits since the tag pre-plan2; git diff --stat pre-plan2..HEAD summary; confirm DEFAULT_HISC_CONFIG.relatedThreshold is 0.35 (print the line); re-run the stale-claims search from step 1.5 and list remaining hits; run npm run results:report and npm run facts:sheet once more and confirm the protected hashes are unchanged.

STEP 5.2 Write docs/FINAL_VERIFICATION_PACK.md (target at most 900 lines; use tables; raw command output only as short tails). Sections:
 S0 Run metadata (start, end, elapsed, branch, HEAD, node version)
 S1 Ledger table (every step with status and one-line note)
 S2 Protected hashes before and after
 S3 Rule inventory table, rule_4 leak decision with the quoted code lines, leak-free challenge accuracy and macro F1 with CI
 S4 Rule cross-tab and leave-one-rule-out (validation and challenge)
 S5 Metric definition findings (0.4930, 85.3%)
 S6 Overlap-stratified test accuracy table
 S7 RESULTS.md change summary and remaining stale-claim hits
 S8 Task G status and reason
 S9 Product: endpoints added, tests added, npm test raw tail, frontend build tail, which of 2.1 to 2.6 were done or skipped
 S10 Security: observed headers, rate-limit test result, injection guard result
 S11 Seeder: counts per collection and per complaint status, two-run idempotency proof
 S12 Deployment readiness: env matrix summary, embedding lazy-load result and rss, production-mode check results (a to e), smoke script output, deploy branch information, secrets scan result (file:line only)
 S13 Final gates (tests, build, git status, git log, DEFAULT_HISC_CONFIG line)
 S14 Blockers, deviations from this plan, assumptions made
 S15 Human TODO list: set environment variables on Render and Vercel; merge feat/algorithm into the branch the deployment uses (the human does this, not you); push; deploy in the order of DEPLOYMENT.md; run scripts/smoke.mjs; seed demo data if wanted; capture screenshots from docs/SCREENSHOT_CHECKLIST.md; rotate any credential flagged CRITICAL.
Commit "docs: final verification pack".

FINAL STEP. Print to the chat: a 15-line summary (steps DONE, DONE_WITH_NOTES, SKIPPED and BLOCKED with reasons), the path of docs/FINAL_VERIFICATION_PACK.md, and the final git status. Then STOP. Do not start any new work.