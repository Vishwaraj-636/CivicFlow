# CivicFlow Production Deployment Guide (Single-Origin Render)

This guide details the step-by-step procedure for deploying CivicFlow as a **single-origin unified service** on free-tier production infrastructure:
- **Unified Web Service (Frontend + Backend + Sockets):** [Render](https://render.com) (Node.js Web Service, Singapore region)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (M0 Free Shared Cluster)
- **Vercel Deployment Status:** **OBSOLETE / DEPRECATED**. Vercel is no longer used. Both the Vite React SPA and the Express 5 REST API + Socket.IO server are served from the same Render origin to eliminate cross-domain cookie restrictions.

---

## 1. System Architecture and Build Specifications

| Component | Repository Root | Build / Install Command | Start / Output Command | Health Check | Runtime Engine | Region |
|---|---|---|---|---|---|---|
| **Unified Service** | Repository root (`.`) | `npm install --prefix BACKEND && npm install --prefix FRONTEND && npm run build --prefix FRONTEND` | `npm start --prefix BACKEND` | `GET /health` | Node.js `>=20` (`engines` field enforced) | Singapore (`singapore`) |

### How Single-Origin Serving Operates:
1. **API Requests:** Requests starting with `/api` are handled by Express 5 REST routers. Unhandled `/api/*` routes return JSON 404 `{ "error": "API route not found" }`.
2. **Health Check:** `GET /health` responds immediately with HTTP 200 `{ "status": "ok" }`.
3. **Real-Time Sockets:** Handled by Socket.IO mounted at `/socket.io`.
4. **Production Frontend Static Assets:** Express serves pre-built static assets from `FRONTEND/dist` via `express.static`.
5. **SPA Route Fallback:** Non-API GET requests (such as `/`, `/dashboard`, `/login`, `/complaints/:id`) serve `FRONTEND/dist/index.html` for client-side routing.
6. **Cookie Security:** Because frontend and API share the exact same origin, cookies use `SameSite=Lax`, `HttpOnly=true`, and `Secure=true` in production, eliminating 3rd-party cookie blocking issues across strict browsers (Safari ITP, Brave, Firefox ETP).

---

## 2. Complete Environment Variables Specification

Configure the following variables in the Render Dashboard (**Environment** tab):

| Variable Name | Required? | Example Value | Where to Obtain Value | When to Set It | Notes |
|---|:---:|---|---|---|---|
| `NODE_ENV` | **Yes** | `production` | Static string | First deploy | Enforces production mode, static asset serving, and secure cookie flags. |
| `MONGO_URI` | **Yes** | `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/civicflow_prod?retryWrites=true&w=majority` | MongoDB Atlas Cluster Dashboard | First deploy | Connection string for MongoDB Atlas production database. |
| `JWT_SECRET` | **Yes** | *(Generate 32+ char random hex string)* | Render "Generate" button or `openssl rand -hex 32` | First deploy | Signs JWT session tokens in authentication cookies. |
| `GOOGLE_CLIENT_ID` | **Yes** | `1234567890-xyz.apps.googleusercontent.com` | Google Cloud Console (Credentials) | First deploy | OAuth 2.0 Client ID for Google authentication. |
| `GOOGLE_CLIENT_SECRET` | **Yes** | `GOCSPX-abc123def456` | Google Cloud Console (Credentials) | First deploy | OAuth 2.0 Client Secret for Google authentication. |
| `IMAGE_KIT_PRIVATE_KEY` | **Yes** | `private_abc123...` | ImageKit Dashboard (Developer Options) | First deploy | Server-side API key for media upload and verification. |
| `CLIENT_URL` | **Yes** | `https://<render-service>.onrender.com` | Assigned Render Web Service URL | After 1st deploy | Exact public origin without trailing slash; set after Render URL is generated. |
| `ALLOWED_ORIGINS` | Optional | `https://<render-service>.onrender.com` | Assigned Render Web Service URL | After 1st deploy | Comma-separated list of origins permitted by CORS and Socket.IO. Defaults to `CLIENT_URL`. |
| `GOOGLE_CALLBACK_URL` | Optional | `https://<render-service>.onrender.com/api/auth/google/callback` | Render URL + `/api/auth/google/callback` | After 1st deploy | Absolute HTTPS redirect URL registered in Google Cloud Console. |
| `COOKIE_SAME_SITE` | Optional | `lax` | Static string (default `lax`) | First deploy | SameSite cookie policy. Defaults to `lax` in production single-origin. |
| `TRUST_PROXY` | Optional | `1` | Static string (default `1`) | First deploy | Instructs Express and Passport to trust Render's reverse proxy for HTTPS detection. |
| `EMBEDDING_PROVIDER` | Optional | `none` | Static string (default `none`) | First deploy | Keeps neural embedding overhead at 0 MB RAM on free tier. |
| `LLM_PROVIDER` | Optional | `gemini` | Static string | Optional | AI assistant provider (`gemini` or `grounded-fallback`). |
| `LLM_API_KEY` | Optional | `AIzaSy...` | Google AI Studio | Optional | Gemini API key. If omitted, AI desk gracefully uses grounded knowledge fallback. |
| `LLM_MODEL` | Optional | `gemini-3.5-flash-lite` | Static string | Optional | Gemini model name. |

---

## 3. Step-by-Step Deployment Procedure

### Step 1: Database Setup on MongoDB Atlas
1. Log into [MongoDB Atlas](https://cloud.mongodb.com/).
2. Select your free **M0 Shared Cluster**.
3. Under **Database Access**, create or verify a database user with read and write permissions to `civicflow_prod` (and `civicflow_demo` if seeding demo data).
4. Under **Network Access**, ensure IP access list allows `0.0.0.0/0` (required because Render Free dynamically assigns outbound IPs).
5. Copy your connection string and ensure the database path is `civicflow_prod`:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/civicflow_prod?retryWrites=true&w=majority
   ```

### Step 2: Create Render Web Service
1. In the Render Dashboard, click **New +** -> **Web Service**.
2. Connect your repository (`CivicFlow`).
3. Configure the service settings:
   - **Name:** `civicflow-app` (or your chosen service name)
   - **Region:** `Singapore` (`singapore`)
   - **Branch:** `deploy/prod` (or `main` after authorized release)
   - **Root Directory:** *(leave blank / repository root)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install --prefix BACKEND && npm install --prefix FRONTEND && npm run build --prefix FRONTEND
     ```
   - **Start Command:**
     ```bash
     npm start --prefix BACKEND
     ```
   - **Instance Type:** `Free`
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** `No` (manual deploy recommended for controlled verification)
4. Under **Environment Variables**, add the initial boot variables:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = *(your Atlas URI with civicflow_prod)*
   - `JWT_SECRET` = *(click Generate or enter a secure random secret)*
   - `GOOGLE_CLIENT_ID` = *(from Google Cloud Console)*
   - `GOOGLE_CLIENT_SECRET` = *(from Google Cloud Console)*
   - `IMAGE_KIT_PRIVATE_KEY` = *(from ImageKit Dashboard)*
   - `COOKIE_SAME_SITE` = `lax`
   - `TRUST_PROXY` = `1`
   - `EMBEDDING_PROVIDER` = `none`
   - `LLM_PROVIDER` = `gemini`
   - *(Optional)* `LLM_API_KEY` = *(your Gemini key if available)*
5. Click **Create Web Service**.

### Step 3: Wire Public URL, CORS, and OAuth
1. Once Render creates the service, copy your assigned public URL:
   `https://<render-service-name>.onrender.com`
2. In the Render service dashboard (**Environment** tab):
   - Set `CLIENT_URL` = `https://<render-service-name>.onrender.com`
   - Set `ALLOWED_ORIGINS` = `https://<render-service-name>.onrender.com`
   - Set `GOOGLE_CALLBACK_URL` = `https://<render-service-name>.onrender.com/api/auth/google/callback`
   - Click **Save Changes** and trigger **Manual Deploy** -> **Deploy latest commit**.
3. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Under **Authorized JavaScript origins**, add: `https://<render-service-name>.onrender.com`
   - Under **Authorized redirect URIs**, add: `https://<render-service-name>.onrender.com/api/auth/google/callback`
   - Save changes.

---

## 4. Automated Production Smoke Testing

Execute the automated single-origin verification script against the live Render URL:

```bash
# Basic single-origin check (health, root HTML, deep links, API 404, Socket.IO handshake)
node scripts/smoke.mjs --single-origin --api https://<render-service-name>.onrender.com

# With optional authenticated session check:
SMOKE_ADMIN_EMAIL=admin@demo.civicflow.local SMOKE_ADMIN_PASSWORD=Demo@12345 \
node scripts/smoke.mjs --single-origin --api https://<render-service-name>.onrender.com
```

The script verifies:
1. `GET /health` returns HTTP 200 `{ "status": "ok" }`.
2. `GET /` returns HTTP 200 with HTML document.
3. `GET /dashboard` deep link returns HTTP 200 with HTML document.
4. `GET /api/<unknown>` returns HTTP 404 with JSON `{ "error": "API route not found" }`.
5. Socket.IO polling handshake returns valid engine protocol packet.
6. Optional login probe verifies `HttpOnly`, `Secure`, and `SameSite=Lax` cookie flags without exposing secret tokens.

---

## 5. Free-Tier Operational Notes & Troubleshooting

1. **Render Free-Tier Cold Starts:**
   - Free services spin down after 15 minutes of inactivity.
   - Initial wake-up takes 50–90 seconds.
   - Best practice: Set up a free uptime monitor (e.g., UptimeRobot) pinging `https://<render-service-name>.onrender.com/health` every 5 minutes.
2. **Deep-Link Refreshes:**
   - Direct navigation to `/dashboard`, `/login`, or `/profile` is natively supported by the Express SPA fallback.
3. **Demo Data Seeding Safety:**
   - To seed demo data, target ONLY the isolated demo database `civicflow_demo`, NEVER `civicflow_prod`.
   - The seeder refuses `NODE_ENV=production`. Remote seeding requires both flags:
     ```powershell
     $env:NODE_ENV="development"; $env:DEMO_SEED_ALLOW_REMOTE="1"; $env:MONGO_URI="mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/civicflow_demo?retryWrites=true&w=majority"; npm run seed:demo --prefix BACKEND -- --allow-remote
     ```
