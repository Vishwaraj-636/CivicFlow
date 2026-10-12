# CivicFlow Production Deployment Record

**Last Verified Date:** October 13, 2026
**Deployment Branch:** `deploy/prod`
**Deployment Target:** Render (Single-Origin Web Service)
**Database Infrastructure:** MongoDB Atlas

---

## 1. Production Service Identity & Verified Endpoints

The following endpoints are confirmed by the project owner's observations and recorded smoke-test execution.

- **Application Public URL:** `https://civicflow-app-75l2.onrender.com`
- **Health Check URL:** `https://civicflow-app-75l2.onrender.com/health`
- **Hosting Platform:** [Render](https://render.com) (Node.js Web Service; Free plan reported, confirm in dashboard)
- **Deployment Region:** Configuration-declared as Singapore (`singapore` in `render.yaml` and `DEPLOYMENT.md`); actual service region requires confirmation in the Render Dashboard.
- **Architecture Model:** **Single-Origin Unified Service**
  - The Vite/React SPA frontend and Express 5 REST API + Socket.IO server are served from the same origin.
  - This architecture supports same-origin authentication cookies using `SameSite=Lax`, `Secure`, and `HttpOnly` settings.
  - The legacy dual-origin Vercel configuration was removed in commit `4cf744b`.

---

## 2. Database Infrastructure & Configuration

- **Platform:** MongoDB Atlas (M0 Free Shared Cluster, as previously reported).
- **Cluster:** `civicflow-cluster` (Mumbai region, `ap-south-1`, as previously reported).
- **Connection Method:** Mongoose using `mongoose.connect(config.MONGO_URI)` in `BACKEND/src/config/database.js`. No explicit `dbName` option is specified in this connection call.

### Effective Database Name

- `DEPLOYMENT.md` recommends using a database path such as `/civicflow_prod` in the connection URI.
- If `MONGO_URI` omits an explicit database path, MongoDB connections commonly default to the `test` database.
- Previous database inspection found application user records in the Atlas `test` database.
- The current `MONGO_URI` value configured in Render has not been independently verified for this record.
- **Status:** The effective production database name remains unconfirmed. Do not assume it is `civicflow_prod` or change the connection URI without checking the live configuration and existing data.

### Demo Database

- `BACKEND/src/scripts/seedDemo.js` includes a script-level default targeting `civicflow_demo` and safeguards against accidental remote seeding.
- No confirmed evidence establishes that an isolated `civicflow_demo` database is currently provisioned and connected to the live service.
- Do not run demo seeding against the production database or any database containing real user records.

### Network Access

- The Atlas IP access list has previously been configured to permit Render connectivity using `0.0.0.0/0`.
- This permits connection attempts from any IP, subject to database authentication and other controls. It is a security trade-off, not a least-privilege network configuration.
- Review database-user permissions and network access periodically. Never include database credentials or connection-string values in this document.

---

## 3. Production Environment Variables (Names Only)

The production service configuration uses the following environment-variable names. Values must be managed privately in the Render Dashboard.

### Core Runtime & Security

- `NODE_ENV` â€” production runtime mode.
- `PORT` â€” port supplied by Render.
- `MONGO_URI` â€” MongoDB Atlas connection URI.
- `JWT_SECRET` â€” secret used to sign session tokens.
- `COOKIE_SAME_SITE` â€” configured as `lax` for single-origin operation.
- `TRUST_PROXY` â€” configured as `1` for Render's reverse-proxy environment.

### Domain & Origin Configuration

- `CLIENT_URL` â€” public application origin.
- `ALLOWED_ORIGINS` â€” allowed CORS and Socket.IO origins.

### Authentication & Third-Party Integrations

- `GOOGLE_CLIENT_ID` â€” Google OAuth client identifier.
- `GOOGLE_CLIENT_SECRET` â€” Google OAuth client secret.
- `GOOGLE_CALLBACK_URL` â€” OAuth callback endpoint.
- `IMAGE_KIT_PRIVATE_KEY` â€” server-side ImageKit credential.

### Model & Feature Flags

- `EMBEDDING_PROVIDER` â€” configured as `none` to reduce memory use.
- `LLM_PROVIDER` â€” AI provider selection; Gemini has been configured previously.
- `LLM_API_KEY` â€” optional AI provider key.
- `LLM_MODEL` â€” configured model identifier.

**Security note:** This record intentionally excludes all environment-variable values. Do not commit secrets, `.env` files, database URIs, passwords, or tokens.

---

## 4. Deployment & Rollback Procedures

### Deployment Procedure

1. Production changes are developed and reviewed on `deploy/prod`.
2. Changes must be committed and pushed only after the owner approves the exact changes and push.
3. Render deployment is triggered through **Manual Deploy â†’ Deploy latest commit**, unless auto-deploy has explicitly been enabled.
4. The configured build command is:

   ```bash
   npm install --prefix BACKEND && npm install --prefix FRONTEND --include=dev && npm run build --prefix FRONTEND
   ```

5. The configured start command is:

   ```bash
   npm start --prefix BACKEND
   ```

6. Render's health check uses `/health`. Confirm deployment status in the dashboard and verify the endpoint after deployment.
7. Test the application root, frontend deep links, API behavior, authentication, and other critical workflows relevant to the release.

A successful health check confirms basic service availability; it does not establish that every feature or authenticated workflow is working.

### Rollback Procedure

**Via Render Dashboard**

1. Open the CivicFlow service and select **Deploys**.
2. Locate the previous healthy deployment.
3. Review the deployment details.
4. Use the rollback action available for that deployment, if supported.
5. Confirm the service is healthy and verify critical workflows.

**Via Git**

1. Identify the problematic commit on `deploy/prod`.
2. Review its changes and impact.
3. Create a revert commit using `git revert <commit-hash>`.
4. Run relevant checks.
5. Push only with explicit owner approval.
6. Trigger or verify the corresponding Render deployment.

Do not rewrite shared Git history or use destructive Git commands for a production rollback.

---

## 5. Verification & Testing Status

This section distinguishes owner-confirmed behavior, recorded automated smoke tests, and production workflows that still require verification.

### A. Verified by Project Owner

- [x] Application root loads in the browser without errors.
- [x] `GET /health` returns HTTP 200 with `{"status":"ok"}`.
- [x] Google sign-in was verified on `https://civicflow-app-75l2.onrender.com` after correcting the OAuth redirect URI configuration.

### B. Recorded Automated Production Smoke Tests

The following results were recorded in `smoke-test-output.txt` against `https://civicflow-app-75l2.onrender.com`.

| Check | Recorded Status | Elapsed | Details |
|---|---|---:|---|
| Health check (`/health`) | PASS | 298 ms | HTTP 200 |
| SPA root (`GET /`) | PASS | 253 ms | HTTP 200, HTML |
| SPA deep-link fallback (`GET /dashboard`) | PASS | 180 ms | HTTP 200, HTML |
| Unknown API route JSON 404 guard | PASS | 218 ms | HTTP 404, JSON error |
| Unauthenticated protected endpoint | PASS | 99 ms | HTTP 401 |
| Socket.IO polling handshake | PASS | 94 ms | HTTP 200, valid Engine.IO opening packet |

**Recorded summary:** 6 checks passed, 0 failures, exit code 0.

The authenticated admin probe was skipped because `SMOKE_ADMIN_EMAIL` was not set. Consequently, this run does not establish that authenticated admin API workflows passed.

These are recorded results, not a guarantee that the same checks will pass on every future deployment.

### C. Production Workflows Still Requiring Verification

The following workflows have not been independently confirmed against the live domain as part of this record.

- [ ] **Complaint Creation & Media Upload:** End-to-end complaint creation, ImageKit upload, and persistence using the live frontend.
- [ ] **Department Staff & Admin Operations:** Live status changes, SLA escalation reviews, resolution verification, and staff-role operations.
- [ ] **Interactive Admin Dashboard Map:** Live in-browser scrolling and interaction with production complaint markers.
- [ ] **Authenticated API Smoke Test:** Authenticated token/session acquisition and protected-route testing on the production domain.
- [ ] **Production Database Confirmation:** Verify the effective database name from the current Render configuration and corresponding Atlas data.
- [ ] **Cold-Start Measurement:** Measure first-request latency after an actual period of inactivity.

**Google OAuth status is not listed here as untested:** the project owner previously confirmed that live Google sign-in worked after the redirect URI correction.

The map stacking-context change is recorded in commit [`61a54c9`](https://github.com/harshit-s11/CivicFlow/commit/61a54c909dff5e479eeadf4017a5020e42ba814f). The code change does not independently establish that the live map interaction has been verified.

---

## 6. Operational Limitations, Platform Constraints, and Observed Behavior

### 1. Render Free-Tier Spin-Down & Cold Starts

- Render Free services can spin down after inactivity.
- The first request after spin-down may be significantly slower than requests to a warm instance.
- The frontend includes an advisory intended to inform users when backend responses are delayed.
- The recorded health-check response was 298 ms while the service was already responding. Cold-start latency was not measured in that run.
- An external monitor can periodically request `/health` during a demonstration window, but it does not guarantee uninterrupted availability or eliminate every cold start.

### 2. Instance Filesystem

- Treat the Render instance filesystem as ephemeral.
- Persistent application data belongs in MongoDB Atlas.
- Uploaded media should use the configured media service rather than relying on local files surviving a restart or redeployment.

### 3. Memory Limits

- The deployment uses `EMBEDDING_PROVIDER=none` to reduce memory consumption.
- Actual memory usage should be checked in Render metrics rather than assumed from a baseline estimate.
- Avoid enabling memory-intensive features without validating their resource impact.

### 4. Single-Instance Concurrency

- A single-instance deployment does not provide horizontal scaling.
- In-memory rate limits and socket connections are scoped to the running process.
- Do not assume in-memory state is shared across multiple instances.

---

## 7. Status Summary

- **Live URL:** `https://civicflow-app-75l2.onrender.com`
- **Health endpoint:** `https://civicflow-app-75l2.onrender.com/health`
- **Application health:** Confirmed responding with HTTP 200 by the project owner.
- **Deployment architecture:** Single-origin Render service.
- **Google sign-in:** Confirmed working by the project owner after the OAuth callback correction.
- **Recorded smoke tests:** Six checks passed; authenticated admin probe was skipped.
- **Production database name:** Requires verification against the current Render configuration.
- **Isolated demo database:** Provisioning and live use not confirmed.
- **Live complaint, media, staff/admin, and authenticated API workflows:** Require further production verification.
- **Jawg Maps token issue:** Previously observed; resolution has not been confirmed in this record.
- **Final release to `main`:** Requires explicit owner approval.

**Operational principle:** Preserve production data, protect credentials, avoid unverified configuration changes, and distinguish implemented code from behavior actually verified on the live service.
