# CivicFlow Architectural & Workflow Diagrams

This document contains Mermaid diagrams detailing CivicFlow's system architecture, entity relationships, lifecycle state machines, scoring algorithms, deployment topology, and operational sequences.

---

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph ClientTier["Client Tier (Browser SPA)"]
        ReactApp["Vite + React 19 SPA"]
        LeafletMap["Leaflet & OpenStreetMap"]
        ReduxStore["Redux Toolkit State"]
        SocketClient["Socket.IO Client"]
    end

    subgraph EdgeTier["Edge & Proxy Routing"]
        VercelEdge["Vercel CDN / Edge (Static SPA)"]
        RenderEdge["Render Cloud Reverse Proxy (HTTPS/WSS)"]
    end

    subgraph ApplicationTier["Application Tier (Node.js & Express 5)"]
        AppServer["Express 5 Web Application"]
        SecurityMW["Security: Helmet, RateLimiters, $-Guard"]
        AuthModule["Passport.js + JWT Auth"]
        HiscEngine["HISC Similarity & Clustering Engine"]
        PriorityService["Priority & SLA Scoring Service"]
        SocketServer["Socket.IO WebSocket Server"]
        LazyEscalate["Lazy SLA Escalation Throttler (60s)"]
    end

    subgraph PersistenceAndCloud["Data & External Cloud Services"]
        MongoAtlas[("MongoDB Atlas M0 (Geospatial 2dsphere)")]
        ImageKit["ImageKit Cloud CDN (Media Storage)"]
        GoogleOAuth["Google Cloud OAuth 2.0"]
        GeminiAI["Google Gemini 2.5/Flash AI API"]
    end

    ReactApp -->|Static Assets| VercelEdge
    ReactApp -->|REST API Requests| RenderEdge
    SocketClient -->|WebSocket Handshake| RenderEdge
    RenderEdge --> SecurityMW
    SecurityMW --> AppServer
    AppServer --> AuthModule
    AppServer --> HiscEngine
    AppServer --> PriorityService
    AppServer --> SocketServer
    AppServer --> LazyEscalate
    AuthModule --> GoogleOAuth
    AppServer --> MongoAtlas
    AppServer --> ImageKit
    AppServer --> GeminiAI
```

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ Complaint : "files"
    User ||--o{ ComplaintSupport : "supports"
    User ||--o{ ComplaintTimeline : "performs"
    User ||--o{ DeptStaffRequest : "submits"
    User ||--o{ Notification : "receives"
    User }o--o| Department : "belongs to"
    User ||--o{ IncidentMessage : "sends"
    User ||--o{ DirectMessage : "sends/receives"

    Department ||--o{ Complaint : "assigned to"
    Department ||--o{ DeptStaffRequest : "requests"
    Department ||--o{ IncidentHandoff : "transfers"

    Complaint ||--o{ ComplaintSupport : "receives"
    Complaint ||--o{ ComplaintTimeline : "tracks"
    Complaint ||--o{ Notification : "triggers"
    Complaint }o--o| IncidentCluster : "grouped into"
    Complaint ||--o| Complaint : "duplicateOf"

    IncidentCluster ||--o{ IncidentMessage : "contains"
    IncidentCluster ||--o{ IncidentHandoff : "transfers"

    Conversation ||--o{ DirectMessage : "contains"

    User {
        ObjectId _id PK
        string email UK
        string fullname
        string role
        string authProvider
        ObjectId departmentId FK
        boolean isActive
    }

    Department {
        ObjectId _id PK
        string code UK
        string fullname
        string description
        boolean isActive
    }

    Complaint {
        ObjectId _id PK
        string complaintId UK
        ObjectId citizenId FK
        string title
        string description
        string category
        Point location
        string address
        string status
        string priority
        number supportCount
        boolean submittedDespiteSimilar
        number slaDurationHours
        date resolutionDeadline
        boolean escalated
        ObjectId assignedDepartment FK
        ObjectId assignedStaff FK
        ObjectId duplicateOf FK
        ObjectId groupId FK
    }

    IncidentCluster {
        ObjectId _id PK
        string clusterId UK
        ObjectId primaryComplaint FK
        ObjectId[] complaintIds FK
        ObjectId[] departmentIds FK
        string category
        Point centroid
        number complaintCount
        number priorityScore
        string status
    }

    ComplaintTimeline {
        ObjectId _id PK
        ObjectId complaintId FK
        string action
        ObjectId performedBy FK
        string previousStatus
        string newStatus
        string remark
        date timestamp
    }

    DeptStaffRequest {
        ObjectId _id PK
        string email
        ObjectId departmentId FK
        string status
        ObjectId userId FK
        ObjectId reviewedBy FK
    }
```

---

## 3. Complaint Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> submitted : Citizen Submits Grievance

    submitted --> assigned : Staff / Admin Assigns
    submitted --> rejected : Staff Rejects (Invalid)

    assigned --> in_progress : Staff Starts Investigation
    assigned --> rejected : Staff Rejects Assignment

    in_progress --> resolved : Staff Submits Resolution Proof

    resolved --> closed : Citizen Confirms Resolution
    resolved --> in_progress : Citizen Reopens / Disagrees

    submitted --> escalated : Overdue Resolution Deadline
    assigned --> escalated : Overdue Resolution Deadline
    in_progress --> escalated : Overdue Resolution Deadline

    submitted --> deleted : Citizen Soft-Deletes

    closed --> [*]
    rejected --> [*]
    deleted --> [*]
```

---

## 4. HISC Similarity Scoring & Contextual Rules Flowchart

```mermaid
flowchart TD
    Start([Complaint Pair A and B]) --> FeatExtract[Extract 5 Component Signals]

    FeatExtract --> C1["Category Agreement s_cat in 0, 1"]
    FeatExtract --> C2["Geographic Proximity s_geo via Haversine"]
    FeatExtract --> C3["Lexical Token Overlap s_lex via Jaccard"]
    FeatExtract --> C4["Semantic Concept Match s_sem via Dictionary/Embedding"]
    FeatExtract --> C5["Temporal Proximity s_temp via Exponential Decay"]

    C1 & C2 & C3 & C4 & C5 --> WeightedSum["Compute Weighted Score: S = w_cat s_cat + w_geo s_geo + w_lex s_lex + w_sem s_sem + w_temp s_temp"]

    WeightedSum --> RuleEval{Evaluate Contextual Rules}

    RuleEval -->|Rule 2: Category Mismatch| SetIndep[Override Label: independent]
    RuleEval -->|Rule 3: Distance > 1000m| SetIndep
    RuleEval -->|Rule 4: Time Delta > 720h| SetIndep
    RuleEval -->|Rule 5: Distinct Entities| SetIndep
    RuleEval -->|Rule 1: Same Category & Dist < 200m & Score >= Thresh| SetDup[Override Label: duplicate / related]
    RuleEval -->|No Rule Overrides| StandardThresh{Threshold Classify}

    StandardThresh -->|Score >= 0.60| DupDecision[Decision: duplicate]
    StandardThresh -->|Score >= 0.35 deployed| RelDecision[Decision: related]
    StandardThresh -->|Score < 0.35| IndepDecision[Decision: independent]

    SetIndep --> OutputResult([Final Classification & Feature Breakdown])
    SetDup --> OutputResult
    DupDecision --> OutputResult
    RelDecision --> OutputResult
    IndepDecision --> OutputResult
```

---

## 5. Deployment Topology Diagram

```mermaid
graph LR
    subgraph Users["End Users"]
        CitizenUser["Citizen Browser"]
        StaffUser["Staff & Admin Console"]
    end

    subgraph VercelCloud["Vercel Cloud (Frontend Hosting)"]
        VercelSPA["Vercel Production Edge<br>civicflow.vercel.app<br>Static React SPA"]
    end

    subgraph RenderCloud["Render Cloud (Backend Web Service)"]
        RenderService["Render Web Service<br>civicflow-api.onrender.com<br>Node.js >=20 / Express 5<br>512MB RAM Container"]
        RenderPort["HTTP :10000 / Socket.IO Engine"]
    end

    subgraph AtlasCloud["MongoDB Atlas (Cloud Database)"]
        MongoCluster["M0 Free Shared Cluster<br>AWS/GCP Region<br>2dsphere Geo Indexes<br>IP Allowlist: 0.0.0.0/0"]
    end

    subgraph ExternalAPIs["External SaaS Integrations"]
        GoogleConsole["Google Cloud Platform<br>OAuth 2.0 Client ID<br>Gemini Flash AI API"]
        ImageKitCDN["ImageKit Media CDN<br>File Storage & Image Optimization"]
        UptimeMonitor["UptimeRobot<br>GET /health Keep-Alive (every 10m)"]
    end

    CitizenUser -->|HTTPS| VercelSPA
    StaffUser -->|HTTPS| VercelSPA
    VercelSPA -->|REST API / CORS| RenderService
    VercelSPA -->|WebSocket WSS| RenderPort
    RenderService -->|Mongoose SRV| MongoCluster
    RenderService -->|Media Uploads| ImageKitCDN
    RenderService -->|OAuth Validation| GoogleConsole
    RenderService -->|AI Grievance Inquiries| GoogleConsole
    UptimeMonitor -->|Keep-Alive Ping| RenderService
```

---

## 6. Citizen-to-Resolution Operational Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen User
    participant Web as Frontend UI (React)
    participant API as Backend Server (Express)
    participant DB as MongoDB Atlas
    actor Staff as Dept Staff

    Citizen->>Web: Enter Title, Description & Select Map Location
    Web->>API: GET /api/complaints/similar?lat=...&lng=...&category=... (Debounced 600ms)
    API->>DB: Query $near within 1000m (Cap 40)
    DB-->>API: Candidate Complaints
    API->>API: Score with HISC Algorithm
    API-->>Web: Top 5 Similar Issues Near You
    Web-->>Citizen: Display Warning Panel (Expandable Signals)

    Citizen->>Web: Clicks "Submit Anyway" (submittedDespiteSimilar = true)
    Web->>API: POST /api/complaints (with media and coords)
    API->>API: Evaluate Priority & Assign SLA Deadline
    API->>DB: Save Complaint (status: submitted)
    DB-->>API: Saved Complaint
    API-->>Web: 201 Created (Complaint ID Generated)
    Web-->>Citizen: Show Success Screen & Tracking Link

    Staff->>Web: Open Staff Queue (/staff/complaints/queue)
    Web->>API: GET /api/staff/complaints
    API->>API: Lazy SLA Check (escalate overdue items if 60s elapsed)
    API->>DB: Query complaints matching staff department
    DB-->>API: Queue List
    API-->>Web: Display Complaints

    Staff->>Web: Click "Accept Complaint"
    Web->>API: PATCH /api/staff/complaints/:id/accept
    API->>DB: Update status -> assigned, assignedStaff -> staffId
    API-->>Web: 200 OK

    Staff->>Web: Inspect and Click "Resolve Issue"
    Staff->>Web: Upload Resolution Proof Photo & Remark
    Web->>API: PATCH /api/staff/complaints/:id/resolve
    API->>DB: Update status -> resolved, resolutionMedia -> [...]
    API->>DB: Create Notification for Citizen
    API-->>Web: 200 OK

    Citizen->>Web: Open Complaint View (/citizen/complaints/:id)
    Web-->>Citizen: Display Resolution Photo & "Verify Resolution" Modal
    Citizen->>Web: Clicks "Confirm Resolved"
    Web->>API: PATCH /api/complaints/:id/verification { status: confirmed }
    API->>DB: Update status -> closed, resolutionVerificationStatus -> confirmed
    API-->>Web: 200 OK
    Web-->>Citizen: Marked Closed & Thank You Alert
```
