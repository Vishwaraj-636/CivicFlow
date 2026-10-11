# CivicFlow Project Facts & Implementation Architecture

This document serves as the authoritative, verified engineering reference for project reports, technical submissions, and presentations. All details have been verified directly from the codebase.

---

## 1. System Overview & Architecture Data Flow

CivicFlow is an end-to-end municipal grievance redressal and incident intelligence platform. It ingests citizen complaints, automates priority and SLA assignment, performs proximity duplicate detection, groups correlated grievances into actionable municipal incidents, and facilitates staff resolution workflows with verification safeguards.

### High-Level Architectural Flow
1. **Grievance Ingestion:**
   Citizens report complaints via React SPA (Vite + Leaflet). The client queries `GET /api/complaints/similar` with debounced text and coordinates to detect duplicates before filing.
2. **Duplicate & Similarity Processing:**
   Upon submission, the backend's HISC (Hybrid Incident Similarity and Clustering) engine calculates multi-modal similarity scores across category, geographic distance (spherical Haversine), lexical tokens (Jaccard), semantic concepts (domain dictionary / local embeddings), and temporal windows.
3. **Automated Triage & SLA:**
   Pre-validation hooks determine initial priority based on text keywords and evidence presence. SLAs are set deterministically (`urgent`: 24h, `high`: 48h, `medium`: 120h, `low`: 168h).
4. **Staff & Admin Operations:**
   Department staff manage queues, accept/reject assignments, escalate overdue complaints (via lazy background evaluation), and resolve issues with mandatory image/video proof.
5. **Real-Time Collaboration:**
   Socket.IO handles real-time incident coordination and direct communication across citizens, department staff, and municipal administrators.

---

## 2. Technology Stack & Package Versions

### Backend (`BACKEND/package.json`)
- **Runtime Environment:** Node.js `>=20` (ES Modules)
- **Web Framework:** Express `v5.2.1`
- **Database ODM:** Mongoose `v9.9.4` (MongoDB Atlas M0 / Local MongoDB 7+)
- **Security & Networking:**
  - Helmet `v8.3.0`
  - Express Rate Limit `v8.7.1`
  - CORS `v2.8.6`
  - Cookie-Parser `v1.4.7`
  - Zod `v4.6.5`
- **Authentication:**
  - JSONWebToken `v9.0.3`
  - Bcryptjs `v3.0.3`
  - Passport `v0.7.0` & Passport-Google-OAuth20 `v2.0.0`
- **Media & File Handling:**
  - Multer `v2.3.0`
  - `@imagekit/nodejs` `v7.11.0`
- **Real-Time WebSockets:** Socket.IO `v4.8.1`
- **AI & NLP Modules:**
  - `@langchain/google-genai` `v0.2.16` & `@langchain/core` `v0.3.68`
  - `@huggingface/transformers` `v4.3.1` (dynamically loaded for local embeddings)
- **Logging & Utilities:** Morgan `v1.12.0`, Dotenv `v17.4.2`

### Frontend (`FRONTEND/package.json`)
- **Build Tool & Framework:** Vite `v8.2.2`, React `v19.2.8`, React-DOM `v19.2.8`
- **Client Routing:** React Router `v7.18.3`
- **State Management:** Redux Toolkit `v2.12.0`, React-Redux `v9.3.0`
- **Styling:** Tailwind CSS `v4.3.3`, `@tailwindcss/vite` `v4.3.3`
- **Mapping & Geospatial UI:** Leaflet `v1.9.4`, React-Leaflet `v5.0.0`
- **Network & Realtime:** Axios `v1.20.0`, Socket.IO Client `v4.8.4`

---

## 3. Mongoose Data Models, Fields, and Indexes

The persistence layer defines 12 core collections and 1 embedded schema in `BACKEND/src/model/`:

| Model File | Collection Name | Core Fields | Indexes |
|---|---|---|---|
| `complaint.model.js` | `complaints` | `complaintId`, `citizenId`, `title`, `description`, `category`, `media` (array), `location` (`Point`), `address`, `status`, `priority`, `supportCount`, `submittedDespiteSimilar`, `slaDurationHours`, `resolutionDeadline`, `escalated`, `escalatedAt`, `escalationReason`, `assignedDepartment`, `assignedStaff`, `assignedAt`, `groupId`, `duplicateOf`, `similarityScore`, `resolutionDescription`, `resolutionVerificationStatus`, `resolutionVerifiedAt`, `resolutionVerificationRemark`, `rejectionReason`, `resolutionMedia` (array) | `location: "2dsphere"`<br>`{ createdAt: 1, category: 1, assignedDepartment: 1 }` |
| `complaintSupport.model.js` | `complaintsupports` | `complaintId`, `citizenId` | `{ complaintId: 1, citizenId: 1 }` (unique) |
| `complaintTimeline.model.js` | `complainttimelines` | `complaintId`, `action`, `performedBy`, `previousStatus`, `newStatus`, `remark`, `timestamp` | `{ complaintId: 1, timestamp: 1 }` |
| `conversation.model.js` | `conversations` | `participants` (array of user ObjectIds), `kind` (`direct`), `createdAt`, `updatedAt` | `{ participants: 1, updatedAt: -1 }` |
| `department.model.js` | `departments` | `fullname`, `code` (unique), `description`, `isActive` | `code: 1` (unique) |
| `deptStaffRequest.model.js` | `deptstaffrequests` | `email`, `contact`, `fullname`, `password`, `departmentId`, `status` (`pending`, `approved`, `rejected`), `userId`, `reviewedBy`, `reviewedAt`, `rejectionReason` | Default `_id` |
| `directMessage.model.js` | `directmessages` | `conversationId`, `senderId`, `recipientId`, `message`, `readAt` | Default `_id` |
| `incidentCluster.model.js` | `incidentclusters` | `clusterId`, `primaryComplaint`, `complaintIds` (array), `departmentIds` (array), `category`, `centroid` (`Point`), `complaintCount`, `affectedRadius`, `similarityConfidence`, `priorityScore`, `status` (`active`, `investigating`, `resolved`, `closed`) | `centroid: "2dsphere"` |
| `incidentHandoff.model.js` | `incidenthandoffs` | `incidentId`, `fromDepartmentId`, `toDepartmentId`, `requestedBy`, `status` (`pending`, `accepted`, `rejected`), `note`, `decidedBy`, `decidedAt` | Default `_id` |
| `incidentMessage.model.js` | `incidentmessages` | `incidentId`, `senderId`, `senderDepartmentId`, `message`, `messageType` (`message`, `system`, `action`) | Default `_id` |
| `location.schema.js` | Embedded Subdocument | `type` (`Point`), `coordinates` (`[lng, lat]`) | Embedded in Complaint & IncidentCluster |
| `notification.model.js` | `notifications` | `recipientId`, `complaintId`, `type`, `title`, `message`, `readAt` | Default `_id` |
| `user.model.js` | `users` | `email` (unique), `contact`, `profileImage`, `passwordHash`, `fullname`, `role` (`citizen`, `dept_staff`, `admin`), `authProvider` (`local`, `google`), `departmentId`, `profileCompleted`, `googleId`, `isActive` | `email: 1` (unique) |

---

## 4. API Routes Inventory

All REST endpoints are registered under `/api` in `BACKEND/src/app.js`:

| Router File | Method | Path | Allowed Roles / Guards | Controller Function | Description |
|---|:---:|---|---|---|---|
| `auth.routes.js` | `POST` | `/api/auth/register` | Public (rate limited 20/15m, Zod guarded) | `register` | Citizen/staff account creation |
| `auth.routes.js` | `POST` | `/api/auth/login` | Public (rate limited 20/15m, Zod guarded) | `login` | Email/password login, returns JWT cookie |
| `auth.routes.js` | `GET` | `/api/auth/google` | Public | Passport Google | OAuth 2.0 authorization redirect |
| `auth.routes.js` | `GET` | `/api/auth/google/callback` | Public | Passport Callback | Google OAuth callback & session minting |
| `auth.routes.js` | `POST` | `/api/auth/complete-profile` | Authenticated | `completeGoogleProfile` | Complete Google OAuth profile fields |
| `auth.routes.js` | `GET` | `/api/auth/me` | Authenticated | `getCurrentUser` | Returns currently logged-in user profile |
| `auth.routes.js` | `PUT` | `/api/auth/me` | Authenticated | `updateProfile` | Updates personal profile information |
| `auth.routes.js` | `POST` | `/api/auth/logout` | Authenticated | `logout` | Clears authentication session cookie |
| `complaint.routes.js` | `GET` | `/api/complaints/similar` | Authenticated (any role, Zod query) | `getSimilarComplaints` | Duplicate-warning candidate search |
| `complaint.routes.js` | `POST` | `/api/complaints` | `citizen` (Zod guarded) | `createComplaint` | Submits new grievance |
| `complaint.routes.js` | `GET` | `/api/complaints/my` | `citizen` | `getMyComplaints` | Lists complaints filed by authenticated user |
| `complaint.routes.js` | `GET` | `/api/complaints/community` | `citizen` | `getSupportableComplaints` | Nearby community complaints open for support |
| `complaint.routes.js` | `POST` | `/api/complaints/:id/support` | `citizen` | `supportComplaint` | Adds citizen endorsement to existing complaint |
| `complaint.routes.js` | `GET` | `/api/complaints/:id` | `citizen` | `getComplaintById` | Retrieves single complaint detail |
| `complaint.routes.js` | `PATCH` | `/api/complaints/:id` | `citizen` | `updateComplaint` | Citizen edits title/description before action |
| `complaint.routes.js` | `DELETE` | `/api/complaints/:id` | `citizen` | `deleteComplaint` | Citizen soft-deletes complaint |
| `complaint.routes.js` | `PATCH` | `/api/complaints/:id/verification` | `citizen` | `verifyComplaintResolution` | Confirms or reopens resolved complaint |
| `complaint.routes.js` | `POST` | `/api/complaints/media` | `citizen`, `dept_staff`, `admin` | `uploadComplaintMedia` | Uploads photo/video to ImageKit |
| `complaint.routes.js` | `GET` | `/api/staff/complaints` | `dept_staff` (lazy SLA check) | `getStaffComplaints` | Department complaint unassigned queue |
| `complaint.routes.js` | `GET` | `/api/staff/complaints/assigned` | `dept_staff` (lazy SLA check) | `getAssignedComplaints` | Staff member's active assigned tasks |
| `complaint.routes.js` | `GET` | `/api/staff/complaints/:id` | `admin`, `dept_staff` | `getComplaintByIdForStaff` | Staff detailed complaint view |
| `complaint.routes.js` | `PATCH` | `/api/staff/complaints/:id/accept` | `dept_staff` | `acceptComplaint` | Staff claims complaint from department queue |
| `complaint.routes.js` | `PATCH` | `/api/staff/complaints/:id/reject` | `dept_staff` | `rejectComplaint` | Staff rejects assignment with reason |
| `complaint.routes.js` | `PATCH` | `/api/staff/complaints/:id/status` | `dept_staff` | `updateComplaintStatus` | Transitions to `in_progress` |
| `complaint.routes.js` | `PATCH` | `/api/staff/complaints/:id/resolve` | `dept_staff` | `resolveComplaint` | Marks resolved with proof media & remark |
| `complaint.routes.js` | `PATCH` | `/api/staff/complaints/:id/assign` | `admin`, `dept_staff` | `assignComplaint` | Assigns complaint to specific staff |
| `complaint.routes.js` | `PATCH` | `/api/staff/complaints/:id/priority` | `admin` | `updateComplaintPriority` | Admin overrides complaint priority |
| `complaint.routes.js` | `GET` | `/api/admin/complaints/escalated` | `admin` (lazy SLA check) | `getEscalatedComplaints` | Overdue complaints requiring escalation |
| `complaint.routes.js` | `GET` | `/api/admin/complaints/escalation-summary` | `admin` (lazy SLA check) | `getEscalationSummary` | Summary metrics on SLA breaches |
| `complaint.routes.js` | `GET` | `/api/admin/complaints/map` | `admin` | `getAdminComplaintMapData` | GeoJSON cluster data for admin heatmap |
| `complaint.routes.js` | `GET` | `/api/admin/complaints/trends` | `admin` | `getAdminComplaintTrends` | Analytics and resolution velocity metrics |
| `complaintTimeline.routes.js` | `GET` | `/api/complaints/:id/timeline` | `citizen`, `dept_staff` | `getComplaintTimeline` | Audit trail of status changes and events |
| `department.routes.js` | `GET` | `/api/departments` | Public | `getDepartments` | Lists active municipal departments |
| `department.routes.js` | `GET` | `/api/departments/:id` | Public | `getDepartmentById` | Department details |
| `department.routes.js` | `GET` | `/api/departments/:id/staff` | `admin`, `dept_staff` | `getDepartmentStaff` | Staff roster for given department |
| `department.routes.js` | `POST` | `/api/departments` | `admin` | `createDepartment` | Admin creates department |
| `department.routes.js` | `PATCH` | `/api/departments/:id` | `admin` | `updateDepartment` | Admin modifies department |
| `department.routes.js` | `DELETE` | `/api/departments/:id` | `admin` | `deleteDepartment` | Admin deactivates department |
| `request.routes.js` | `POST` | `/api/requests/staff` | Authenticated | `createStaffRequest` | Applies for department staff role |
| `request.routes.js` | `GET` | `/api/requests/staff/me` | Authenticated | `getMyStaffRequest` | Checks applicant's request status |
| `request.routes.js` | `GET` | `/api/admin/requests/staff` | `admin` | `getStaffRequests` | Admin views pending staff applications |
| `request.routes.js` | `PATCH` | `/api/admin/requests/staff/:id/approve` | `admin` | `approveStaffRequest` | Promotes user to staff with rollback safety |
| `request.routes.js` | `PATCH` | `/api/admin/requests/staff/:id/reject` | `admin` | `rejectStaffRequest` | Rejects staff application |
| `incident.routes.js` | `GET` | `/api/incidents` | Public / Authenticated | `listIncidents` | Lists grouped multi-complaint clusters |
| `incident.routes.js` | `GET` | `/api/incidents/:id` | Public / Authenticated | `getIncident` | Incident cluster detail |
| `incident.routes.js` | `PATCH` | `/api/incidents/:id/status` | `dept_staff`, `admin` | `updateIncidentStatus` | Updates overall cluster resolution status |
| `incident.routes.js` | `POST` | `/api/incidents/:id/handoff` | `dept_staff` | `requestIncidentHandoff` | Transfers incident to another department |
| `incident.routes.js` | `PATCH` | `/api/incidents/:id/handoff/:handoffId` | `dept_staff`, `admin` | `decideIncidentHandoff` | Approves or rejects inter-dept transfer |
| `chat.routes.js` | `GET` | `/api/chat/users` | Authenticated | `getChatUsers` | User directory for direct messaging |
| `chat.routes.js` | `GET` | `/api/chat/conversations/:userId` | Authenticated | `getConversation` | Conversation history between two users |
| `chat.routes.js` | `POST` | `/api/chat/conversations/:userId/messages` | Authenticated | `sendDirectMessage` | Sends direct message via REST fallback |
| `ai.routes.js` | `GET` | `/api/ai/health` | Public | `aiHealth` | Verifies LangChain Gemini connectivity |
| `ai.routes.js` | `POST` | `/api/ai/query` | `citizen`, `dept_staff`, `admin` | `queryAI` | AI Chatbot service desk for citizen queries |

---

## 5. Frontend Pages & Role-Based Routes

All user-facing views are configured in `FRONTEND/src/app/app.routes.jsx`:

| Role Access | Route Path | React Component | Primary Purpose |
|---|---|---|---|
| **Public** | `/` | `AuthRedirect` | Redirects to role dashboard if authenticated, else `/login` |
| **Public** | `/login` | `Login` | Form login, Google OAuth button, error alerts |
| **Public** | `/register` | `Register` | Citizen registration with phone and email |
| **Public** | `/complete-profile` | `CompleteGoogleProfile` | Post-Google OAuth onboarding form |
| **Public** | `/unauthorized` | `Unauthorized` | 403 Forbidden alert screen |
| **Protected** | `/request-dept-staff`| `DeptStaffRequest` | Citizen application form to join department staff |
| **Protected** | `/profile` | `Profile` | User contact information and credential management |
| **Citizen** | `/citizen` | `CitizenDashboard` | Citizen overview, active complaints count, quick actions |
| **Citizen** | `/citizen/complaints` | `MyComplaints` | Filterable list of complaints filed by the citizen |
| **Citizen** | `/citizen/complaints/report` | `ReportComplaint` | Filing form with Leaflet map, image upload, duplicate warning |
| **Citizen** | `/citizen/complaints/:id` | `ComplaintDetails` | Status tracker, resolution proof media, verification form |
| **Citizen** | `/citizen/complaints/:id/track` | `TrackComplaint` | Step-by-step visual audit timeline |
| **Dept Staff** | `/staff` | `StaffDashboard` | Department KPI cards, SLA alerts, queue summary |
| **Dept Staff** | `/staff/complaints/queue`| `ComplaintQueue` | Department backlog awaiting staff assignment |
| **Dept Staff** | `/staff/complaints/assigned` | `AssignedComplaints` | Staff member's assigned tasks to resolve |
| **Dept Staff** | `/staff/complaints/:id` | `StaffComplaintDetails`| Inspection view, status updates, resolution proof modal |
| **Dept Staff** | `/staff/incidents/:id` | `IncidentDetails` | Clustered incident view, chat room, handoff action |
| **Admin** | `/admin` | `AdminDashboard` | High-level metrics, department breakdown, geographic map |
| **Admin** | `/admin/staff-requests` | `StaffRequests` | Applications from users seeking staff permissions |
| **Admin** | `/admin/escalations` | `EscalatedComplaints` | Escalated/overdue complaints across all departments |
| **Admin** | `/admin/complaints/:id` | `StaffComplaintDetails`| Administrative inspection and priority override |

---

## 6. Complaint Status State Machine & SLA Policy

### Status State Machine Transitions
```
                [submitted]
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
  [assigned]                  [rejected]
       │
       ▼
 [in_progress]
       │
       ▼
  [resolved] (pending citizen verification)
       │
       ├───────────────────────────┐
       ▼                           ▼
    [closed]                 [in_progress]
(citizen confirmed)     (citizen rejected verification)
```

- Soft-delete: `deleted` state removes the complaint from active queries without destroying records.
- Overdue Escalation: Complaints remaining un-resolved past `resolutionDeadline` are flagged `escalated: true` automatically.

### Service Level Agreement (SLA) Matrix
Configured in `BACKEND/src/service/sla.service.js`:
- **Urgent Priority:** 24 hours deadline from submission.
- **High Priority:** 48 hours deadline from submission.
- **Medium Priority:** 120 hours (5 days) deadline from submission.
- **Low Priority:** 168 hours (7 days) deadline from submission.

### Priority Scoring Engine
Configured in `BACKEND/src/service/priorityScoring.service.js`:
- Evaluates title, description, category, and evidence attachments.
- **Urgent triggers:** Keywords such as *dangerous, injury, fire, collapse, exposed wire, sewage overflow, flooding*, or high keywords with media evidence.
- **High triggers:** Keywords such as *blocked, broken, leak, outage, accident, unsafe, contamination, overflow*.
- **Medium triggers:** Keywords such as *damaged, noise, waste, streetlight, pothole*, or any complaint with uploaded media proof.
- **Low:** Default baseline for complaints without high-severity keywords or media proof.

---

## 7. Socket.IO Real-Time Channels & Events

Configured in `BACKEND/src/socket/socket.server.js`:

### Authentication & Handshake
- Cookie extraction (`token=...`), Bearer authorization headers, or handshake `auth.token`.
- Verified using `jsonwebtoken` against `config.JWT_SECRET`.
- Sockets join user-specific private room: `user:<userId>`.

### Event Specifications
| Event Name | Direction | Room / Recipient | Payload / Parameters | Purpose |
|---|:---:|---|---|---|
| `incident:join` | Client -> Server | Socket joins `incident:<incidentId>` | `incidentId`, `callback` | Subscribes to real-time incident war-room |
| `incident:leave`| Client -> Server | Socket leaves `incident:<incidentId>` | `incidentId` | Unsubscribes from incident |
| `message:send` | Client -> Server | Emits to `incident:<incidentId>` | `{ incidentId, message, messageType }` | Sends incident war-room message |
| `message:new` | Server -> Client | Broadcast to `incident:<incidentId>` | Populated `IncidentMessage` document | Notifies collaborators of new incident chat |
| `direct:join` | Client -> Server | Socket joins `direct:<user1>:<user2>` | `userId`, `callback` | Establishes direct chat session |
| `direct:send` | Client -> Server | Emits to direct room and recipient | `{ recipientId, message }` | Sends 1-on-1 direct message |
| `direct:new` | Server -> Client | Broadcast to direct room and user | Populated `DirectMessage` document | Delivers direct chat message |

---

## 8. Automated Test Suite Inventory

CivicFlow features 24 native Node.js test suites containing **247 automated test cases**:

| Test Suite File | Test Count | Pass | Fail | Scope |
|---|:---:|:---:|:---:|---|
| `baselineEvaluationT1.test.js` | 13 | 13 | 0 | Baseline methods B1–B6 on validation partition |
| `challengeCategoryBreakdown.test.js` | 7 | 7 | 0 | Category-level performance and metric policy integrity |
| `datasetLeakageAudit.test.js` | 5 | 5 | 0 | Pairwise text overlap and split independence audit |
| `demoSeeder.test.js` | 6 | 6 | 0 | PRNG seed 42 demo dataset generation & 2-run idempotency |
| `embeddingT2.test.js` | 14 | 14 | 0 | MiniLM-L6-v2 embeddings, cosine similarity, fallback safety |
| `errorAnalysisT3.test.js` | 8 | 8 | 0 | Validation error breakdown & confusion matrix |
| `evaluationHarness.test.js` | 13 | 13 | 0 | Evaluation scoring pipeline correctness |
| `features.test.js` | 5 | 5 | 0 | Feature extractors (geo, lexical, semantic, temporal) |
| `hiscIntelligenceA4.test.js` | 21 | 21 | 0 | End-to-end clustering intelligence and candidate selection |
| `hiscScorePair.test.js` | 17 | 17 | 0 | HISC scorePair function, thresholds, and feature breakdown |
| `latencyBenchmarkT4.test.js` | 15 | 15 | 0 | Sub-15ms scoring latency harness benchmarks |
| `lazySlaEscalation.test.js` | 2 | 2 | 0 | 60-second throttled lazy escalation on sleeping hosts |
| `learnedWeightsT5.test.js` | 10 | 10 | 0 | Simplex weight optimization validation |
| `preDeployment.test.js` | 8 | 8 | 0 | Production environment variable & configuration assertions |
| `productionConnectivity.test.js` | 7 | 7 | 0 | CORS preflight, cookie security flags, and /health |
| `resolutionMediaValidation.test.js` | 7 | 7 | 0 | Resolution proof media URL, mime-type, and size bounds |
| `resultsReportT6.test.js` | 9 | 9 | 0 | Markdown report generator validation |
| `ruleAblation.test.js` | 4 | 4 | 0 | Leave-one-rule-out contextual rule ablation |
| `securityHardening.test.js` | 7 | 7 | 0 | Helmet headers, rate limiting 429, $ injection guards |
| `similarComplaints.test.js` | 7 | 7 | 0 | Duplicate-warning API, privacy filters, and HISC top-5 |
| `spatialQueryBenchmark.test.js` | 5 | 4 | 1 | Spatial benchmark tests (*1 known mock failure*) |
| `splitsAndChallenge.test.js` | 19 | 19 | 0 | Stratified 60/20/20 split & challenge set integrity |
| `staffRequestHardening.test.js` | 5 | 5 | 0 | Staff request rollback compensation upon error |
| `statisticalComparisonAndCI.test.js` | 12 | 12 | 0 | Clopper-Pearson CIs & exact two-sided McNemar tests |

---

## 9. Team Focus Areas

*(Team-declared engineering roles; not derived from git history)*

- **Vishwaraj Singh Shekhawat:**
  Backend core architecture, authentication and RBAC middlewares, Mongoose data models, lifecycle REST API, HISC algorithm implementation, SLA policies, and priority scoring service.
- **Harshit Sharma:**
  Frontend SPA design and development, Leaflet geospatial integration, end-to-end system integration, cloud deployment pipelines, security hardening (Helmet, rate limits, injection guards), and test suite orchestration.
- **Anshika:**
  Evaluation framework, benchmark dataset preparation and synthetic challenge set authorship, baseline comparator implementations (B1–B6), statistical significance analysis (McNemar, Clopper-Pearson), documentation, and knowledge base curation.

> *Development was done collaboratively on a shared workstation; Git history shows a single account.*
