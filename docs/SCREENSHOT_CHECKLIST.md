# CivicFlow Evaluation & Report Screenshot Checklist

This checklist guides evaluators and team members in capturing high-fidelity visual evidence of CivicFlow's frontend interfaces, workflows, and terminal test outputs for final academic and technical project reports.

---

## 1. Frontend UI Screenshots Checklist

Before taking screenshots, run `npm run seed:demo` in `BACKEND/` to populate realistic Chennai-area complaints, clusters, and demo accounts.
All demo accounts share the password: `Demo@12345` (see [`docs/DEMO_CREDENTIALS.md`](file:///c:/Projects/CivicFlow/docs/DEMO_CREDENTIALS.md)).

| # | Feature / View | URL Path | Role | Demo Account | Data Prerequisite | Suggested Figure Caption |
|:---:|---|---|:---:|---|---|---|
| **1** | **Duplicate-Warning UI Panel** | `/citizen/complaints/report` | `citizen` | `citizen1@demo.civicflow.local` | Type: *"Water main leak on ECR road"*, click near Thiruvanmiyur on map | *Figure 1: Real-time duplicate grievance warning panel displaying similar community complaints with expandable multi-signal similarity scores and support options.* |
| **2** | **Citizen Dashboard & Tracking** | `/citizen` | `citizen` | `citizen1@demo.civicflow.local` | Seeded demo complaints | *Figure 2: Citizen portal dashboard showing grievance overview metrics, active complaint cards, and direct status trackers.* |
| **3** | **Rejection / Reopened Feedback Banner** | `/citizen/complaints/:id` | `citizen` | `citizen2@demo.civicflow.local` | Complaint with `resolutionVerificationStatus: "rejected"` | *Figure 3: Citizen grievance verification modal displaying rejection remark banner and option to confirm closure or reopen ticket.* |
| **4** | **Resolution Verification Modal** | `/citizen/complaints/:id` | `citizen` | `citizen3@demo.civicflow.local` | Complaint in `resolved` status with `resolutionMedia` | *Figure 4: Resolution review modal presenting photographic evidence submitted by staff before citizen confirms final closure.* |
| **5** | **Department Staff Queue** | `/staff/complaints/queue` | `dept_staff` | `staff.roads@demo.civicflow.local` | Unassigned Roads & Transport complaints | *Figure 5: Department staff triage queue displaying automated priority badges, time remaining on SLA countdown, and claim action.* |
| **6** | **Staff Resolution Modal** | `/staff/complaints/:id` | `dept_staff` | `staff.water@demo.civicflow.local` | Complaint in `assigned` or `in_progress` status | *Figure 6: Staff resolution dialogue requiring photographic/video verification proof upload and detailed resolution remarks.* |
| **7** | **Clustered Incident Room & War-Room Chat** | `/staff/incidents/:id` | `dept_staff` | `staff.sanitation@demo.civicflow.local` | Seeded incident cluster with multiple complaint IDs | *Figure 7: Clustered incident war-room showing multi-complaint incident overview, primary grievance, and real-time Socket.IO inter-department chat.* |
| **8** | **Admin Geospatial Heatmap & Analytics** | `/admin` | `admin` | `admin@demo.civicflow.local` | 120 demo complaints across Chennai clusters | *Figure 8: Administrative overview featuring interactive Leaflet geospatial complaint cluster map and category distribution charts.* |
| **9** | **Overdue Escalation Management** | `/admin/escalations` | `admin` | `admin@demo.civicflow.local` | Complaints with `escalated: true` | *Figure 9: Administrative SLA escalation list tracking breached grievance deadlines, responsible departments, and override priority controls.* |
| **10** | **Department Staff Application Review** | `/admin/staff-requests` | `admin` | `admin@demo.civicflow.local` | Pending staff applicant | *Figure 10: Administrative portal for reviewing and approving municipal staff role elevation requests with rollback safeguards.* |
| **11** | **AI Service Desk Assistant** | `/citizen` (Chat Bubble) | `citizen` | `citizen1@demo.civicflow.local` | `LLM_API_KEY` configured in `.env` | *Figure 11: AI-powered civic service desk assisting citizens with municipal queries and grievance routing via LangChain Gemini.* |

---

## 2. Terminal Evidence & Benchmark Outputs

Capture clean terminal screenshots or monospace text blocks for the following commands:

| Command | Working Directory | Primary Evidence Captured | Suggested Figure Caption |
|---|---|---|---|
| `npm test` | `BACKEND/` | 24 native test suites passing 245 test cases | *Terminal Evidence 1: Node.js native test runner passing 245 unit, integration, and security test cases.* |
| `npm run results:report` | `BACKEND/` | Output generating `docs/RESULTS.md` | *Terminal Evidence 2: Generation of comprehensive algorithmic evaluation report from frozen artifacts.* |
| `npm run facts:sheet` | `BACKEND/` | Output generating `docs/FACTS_SHEET_GENERATED.md` | *Terminal Evidence 3: Programmatic facts sheet generation ensuring 100% integrity without hand-typed figures.* |
| `node scripts/smoke.mjs --api <url> --web <url>` | Root | Smoke test PASS table | *Terminal Evidence 4: Automated pre-flight production smoke verification testing health check, CORS, and auth headers.* |
| `npm run seed:demo` | `BACKEND/` | 120 complaints & 11 clusters created | *Terminal Evidence 5: Reproducible demo data seeder run output confirming deterministic PRNG generation and idempotency.* |
| `npm run build` | `FRONTEND/` | Vite production bundle compilation | *Terminal Evidence 6: Frontend client bundle compilation under Vite 8 with Rollup asset minification.* |
