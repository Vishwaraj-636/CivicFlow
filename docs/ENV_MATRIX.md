# CivicFlow Environment Variable Matrix

This matrix documents every environment variable consumed across the CivicFlow codebase (`BACKEND` and `FRONTEND`), including source files, default fallbacks, requirement status, and deployment documentation coverage.

---

## 1. Backend Environment Variables (`BACKEND/`)

| Variable Name | Used In (Source Files) | Required | Default Fallback | Documented in DEPLOYMENT.md | Set in render.yaml |
|---|---|:---:|---|:---:|:---:|
| `PORT` | `server.js` | Auto (Host) | Injected by host (e.g. 10000 / 3000) | Yes (Auto) | Injected by Render |
| `MONGO_URI` | `src/config/config.js`, `src/config/database.js` | **Yes** | None (throws on boot) | Yes | Yes (sync: false) |
| `JWT_SECRET` | `src/config/config.js`, `src/middleware/auth.middleware.js` | **Yes** | None (throws on boot) | Yes | Yes (generateValue: true) |
| `NODE_ENV` | `src/config/config.js`, `src/app.js`, `src/middleware/security.middleware.js`, `src/scripts/seedDemo.js` | **Yes** | None (throws on boot in config) | Yes | Yes (`production`) |
| `GOOGLE_CLIENT_ID` | `src/config/config.js`, `src/app.js` | **Yes** | None (throws on boot in config) | Yes | Yes (sync: false) |
| `GOOGLE_CLIENT_SECRET` | `src/config/config.js`, `src/app.js` | **Yes** | None (throws on boot in config) | Yes | Yes (sync: false) |
| `GOOGLE_CALLBACK_URL` | `src/config/config.js`, `src/app.js` | Optional | `"/api/auth/google/callback"` | Yes | Yes (sync: false) |
| `IMAGE_KIT_PRIVATE_KEY` | `src/config/config.js`, `src/service/imagekit.service.js` | **Yes** | None (throws on boot in config) | Yes | Yes (sync: false) |
| `CLIENT_URL` | `src/config/config.js` | Optional | `"http://localhost:5173"` | Yes | Yes (sync: false) |
| `ALLOWED_ORIGINS` | `src/config/config.js` | Optional | `process.env.CLIENT_URL` | Yes | Yes (sync: false) |
| `TRUST_PROXY` | `src/app.js`, `src/config/config.js` | Optional | `1` if production, `0` otherwise | Yes | Yes (`"true"`) |
| `COOKIE_SAME_SITE` | `src/config/config.js` | Optional | `"none"` in prod / cross-site | Yes | Yes (`none`) |
| `LLM_PROVIDER` | `src/ai/llm/model.provider.js`, `src/ai/rag/rag.chain.js`, `src/controller/ai.controller.js` | Optional | `"grounded-fallback"` | Yes | Yes (`gemini`) |
| `LLM_API_KEY` | `src/ai/llm/model.provider.js`, `src/controller/ai.controller.js` | Optional | None (falls back to local RAG rules) | Yes | Yes (sync: false) |
| `LLM_MODEL` | `src/ai/llm/model.provider.js` | Optional | `"gemini-3.5-flash-lite"` | Yes | Yes (`gemini-3.5-flash-lite`) |
| `EMBEDDING_PROVIDER` | `src/hisc/config.js`, `src/hisc/embeddingProvider.js`, `src/evaluation/embeddingEvaluationRunner.js` | Optional | `"none"` | Yes | Yes (defaults to `none`) |
| `RATE_LIMIT_DISABLED` | `src/middleware/security.middleware.js` | Optional | `"0"` (Rate limiting active) | Yes | N/A (Dev/Testing only) |
| `ENABLE_RATE_LIMIT_IN_TEST` | `src/middleware/security.middleware.js` | Optional | `"0"` (Disabled in tests) | Yes | N/A (Testing only) |
| `DEMO_SEED_ALLOW_REMOTE` | `src/scripts/seedDemo.js` | Optional | `"0"` (Rejects remote seed) | Yes | N/A (CLI safety flag) |
| `BENCHMARK_DB_URI` | `src/evaluation/clusteringLatencyBenchmark.js`, `src/evaluation/spatialQueryBenchmark.js` | Optional | Isolated local test DB | Yes | N/A (Offline evaluation only) |

---

## 2. Frontend Environment Variables (`FRONTEND/`)

| Variable Name | Used In (Source Files) | Required | Default Fallback | Documented in DEPLOYMENT.md | Set in vercel.json |
|---|---|:---:|---|:---:|:---:|
| `VITE_API_URL` | `src/config/api.config.js` | **Yes** | `"http://localhost:3000/api"` | Yes | Injected in Vercel UI |
| `VITE_SOCKET_URL` | `src/config/api.config.js` | **Yes** | `"http://localhost:3000"` | Yes | Injected in Vercel UI |
| `VITE_JAWG_ACCESS_TOKEN` | `src/components/maps/mapTiles.js` | Optional | `"YOUR_JAWG_ACCESS_TOKEN"` (Falls back to OSM standard) | Yes | Injected in Vercel UI (optional) |

---

## 3. Discrepancies and Usage Notes

1. **Development/Test-only Variables:**
   - `RATE_LIMIT_DISABLED`, `ENABLE_RATE_LIMIT_IN_TEST`, and `DEMO_SEED_ALLOW_REMOTE` are operational guard rails. They are not required on Render.
2. **Evaluation-only Variables:**
   - `BENCHMARK_DB_URI` and `EMBEDDING_PROVIDER` are used during offline benchmarking and local transformer evaluation. On production free hosts (Render 512 MB), `EMBEDDING_PROVIDER` defaults to `"none"` to prevent out-of-memory errors.
3. **Template Sync:**
   - All runtime variables have corresponding placeholder entries in `BACKEND/.env.example` and `FRONTEND/.env.example`.
