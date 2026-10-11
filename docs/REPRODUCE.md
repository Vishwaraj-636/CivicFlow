# CivicFlow Complete Reproduction & Run Guide

This document contains step-by-step instructions and verified commands to reproduce all evaluations, run tests, build artifacts, seed demo environments, and execute production checks for CivicFlow.

---

## 1. Prerequisites & Environment Setup

- **Operating System:** Windows, macOS, or Linux
- **Runtime:** Node.js `>=20.0.0`
- **Package Manager:** npm `>=10.0.0`
- **Database:** Local MongoDB instance (v6.0+ or v7.0+) or MongoDB Atlas M0 cluster URI

### Clone and Directory Structure
```bash
git clone https://github.com/harshit-s11/CivicFlow.git
cd CivicFlow
```
Repository structure:
- `BACKEND/` – Express 5 REST API, Mongoose models, HISC algorithm engine, evaluation suite
- `FRONTEND/` – React 19 SPA, Tailwind CSS, Leaflet maps, Redux store
- `scripts/` – Deployment and operational smoke tests
- `docs/` – Architecture, benchmark reports, and generated facts sheets

---

## 2. Dependency Installation

Install dependencies separately in both backend and frontend roots:

```bash
# 1. Install Backend Dependencies
cd BACKEND
npm install

# 2. Install Frontend Dependencies
cd ../FRONTEND
npm install
cd ..
```

---

## 3. Environment Variable Configuration

Create `.env` files from provided examples:

### Backend Configuration (`BACKEND/.env`)
```bash
cp BACKEND/.env.example BACKEND/.env
```
Ensure the following minimal development variables are set:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/civicflow
JWT_SECRET=super-secret-development-key-min-32-chars-long
IMAGE_KIT_PRIVATE_KEY=mock-development-imagekit-key
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
COOKIE_SAME_SITE=lax
EMBEDDING_PROVIDER=none
```

### Frontend Configuration (`FRONTEND/.env`)
```bash
cp FRONTEND/.env.example FRONTEND/.env
```
Contains:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## 4. Running Locally in Development Mode

```bash
# Terminal 1: Launch Backend API & Socket Server (port 3000)
cd BACKEND
npm run dev
# (or: npm start)

# Terminal 2: Launch Frontend Vite Dev Server (port 5173)
cd FRONTEND
npm run dev
```
Open `http://localhost:5173` in a browser.

---

## 5. Automated Test Suite Execution

Run native Node.js tests across the 24 test suites in `BACKEND/test`:

```bash
cd BACKEND
npm test
```
*Expected Result:*
- 245 passing test cases across 24 suites.
- 1 known mock failure in isolated spatial benchmark (documents examined check under memory mock).

---

## 6. Seed Reproducible Demo Data

Populate 120 complaints, 11 clusters, and demo accounts across Chennai locations using deterministic PRNG (seed 42):

```bash
cd BACKEND
npm run seed:demo
```
*Safety Note:* Refuses to run against remote databases unless invoked with:
```bash
DEMO_SEED_ALLOW_REMOTE=1 npm run seed:demo -- --allow-remote
```
Demo accounts and credentials are documented in [`docs/DEMO_CREDENTIALS.md`](file:///c:/Projects/CivicFlow/docs/DEMO_CREDENTIALS.md).

---

## 7. Algorithmic Evaluation & Benchmarks

All evaluation runners and benchmarks are defined in `BACKEND/package.json`:

### A. Run Final Evaluation Freeze (All 11 Methods)
Evaluates HISC, baseline methods (B1–B6), and variants on test ($N=80$) and synthetic challenge ($N=150$) sets:
```bash
cd BACKEND
npm run evaluate:freeze
```

### B. Generate Comprehensive Evaluation Report (`docs/RESULTS.md`)
Regenerates the complete evaluation document from frozen JSON artifacts:
```bash
cd BACKEND
npm run results:report
```

### C. Generate Facts Sheet (`docs/FACTS_SHEET_GENERATED.md`)
Compiles numeric facts, confidence intervals, McNemar tables, and spatial metrics directly from JSON artifacts without hand typing:
```bash
cd BACKEND
npm run facts:sheet
```

### D. Benchmark Latency & Scoring Harness
Measures sub-15ms scoring latency across candidate retrieval caps:
```bash
cd BACKEND
npm run benchmark:latency
```

### E. Spatial Query Indexing Benchmark (Task F)
Evaluates unindexed vs indexed `$geoWithin` (2dsphere) and distance-sorted `$near` across 1,000, 10,000, and 50,000 documents:
```bash
cd BACKEND
node src/evaluation/spatialQueryBenchmark.js
```

### F. Simplex Weight Optimization
Learns feature weights on the training split using Nelder-Mead simplex search:
```bash
cd BACKEND
npm run learn:weights
```

### G. Embedding Semantic Affinity Evaluation
Evaluates local neural embeddings (`all-MiniLM-L6-v2`) on validation pairs:
```bash
cd BACKEND
npm run evaluate:embeddings
```

---

## 8. Frontend Production Build & Bundle Verification

Compile the React SPA for production:

```bash
cd FRONTEND
npm run build
```
*Expected Result:* Outputs optimized bundle to `FRONTEND/dist/` (`dist/index.html`, `dist/assets/*.css`, `dist/assets/*.js`) within ~1 second.

---

## 9. Automated Production Smoke Testing

Execute the automated smoke verification script against running local or deployed services:

```bash
# From repository root:
# 1. Basic endpoint and CORS preflight check
node scripts/smoke.mjs --api http://localhost:3000 --web http://localhost:5173

# 2. Authenticated check with demo admin credentials
SMOKE_ADMIN_EMAIL=admin@demo.civicflow.local SMOKE_ADMIN_PASSWORD=Demo@12345 \
node scripts/smoke.mjs --api http://localhost:3000 --web http://localhost:5173
```
*Expected Result:* Returns a formatted markdown PASS/FAIL table and exits with code `0`.
