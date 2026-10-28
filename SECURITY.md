# CivicFlow Security Policy & Measures

## 1. Implemented Security Controls

CivicFlow implements defense-in-depth controls across transport, API layer, data persistence, and application logic:

### HTTP Transport & Response Headers
- **Helmet Middleware:** Enforces strict HTTP security headers including `X-Content-Type-Options: nosniff`, `X-DNS-Prefetch-Control: off`, clickjacking defenses, and cross-origin resource policy (`cross-origin`).
- **CORS Allowlist:** Origin reflection is restricted strictly to configured web origins (`CLIENT_URL` / `ALLOWED_ORIGINS`). Arbitrary origins are rejected without `Access-Control-Allow-Origin`.
- **HttpOnly & Secure Session Cookies:** JWT tokens are issued in HTTP-only cookies with `Secure: true` and `SameSite: None` (or `Lax` in local development) to prevent cross-site script access.

### Rate Limiting & Denial-of-Service Defense
- **General Endpoint Rate Limiting:** Throttles all client requests to **300 requests per 15 minutes per IP** via `express-rate-limit`. Exceeding limits returns HTTP `429 Too Many Requests`.
- **Authentication Rate Limiting:** Restricts sensitive auth routes (`/api/auth/login`, `/api/auth/register`, `/api/auth/google/callback`) to **20 requests per 15 minutes per IP** to prevent brute-force credential stuffing.
- **Payload Size Limits:** JSON and URL-encoded request bodies are bounded to prevent memory exhaustion; media uploads are enforced via Multer with a 50 MB hard cap and max 7 files.

### Input Validation & Injection Defenses
- **Operator-Injection Guard:** Express 5 compatible middleware that recursively inspects incoming `req.body`, `req.params`, and `req.query` without mutating them. Any key beginning with the MongoDB operator prefix `$` is immediately rejected with HTTP `400 Bad Request`.
- **Zod Schema Validation:** Strongly typed input validation on critical entrypoints (`/api/auth/register`, `/api/auth/login`, `POST /api/complaints`, `GET /api/complaints/similar`):
  - Email format and password length requirements (min 6 characters).
  - Complaint title (5–200 characters) and description (10–5,000 characters).
  - Strict enum validation against supported municipal categories (`Roads & Transport`, `Waste & Cleanliness`, `Water & Utilities`, `Street Infrastructure`, `Drainage & Flooding`).
  - Spatial coordinate boundaries (longitude $-180 \dots 180$, latitude $-90 \dots 90$).
- **Backend-Controlled Fields Protection:** Explicit guard rejecting client submissions that contain internal fields (`citizenId`, `status`, `assignedDepartment`, `assignedStaff`, `similarityScore`, `groupId`, `duplicateOf`, `resolutionDescription`, `resolutionMedia`).

### Authorization & State Lifecycle
- **Role-Based Access Control (RBAC):** Middleware validates roles (`citizen`, `dept_staff`, `admin`) per endpoint.
- **Department Staff Isolation:** Staff members are restricted to querying and managing complaints matching their assigned department ID.
- **Resolution Verification State Machine:** Lifecycle transitions enforce strict prerequisite checks and audit event recording in persistent timelines.

---

## 2. Reverse Proxy & TRUST_PROXY Configuration

When deployed behind reverse proxies or load balancers (such as Render, Vercel, AWS ALB, Nginx, or Cloudflare), Express needs to correctly determine client IP addresses from `X-Forwarded-For` headers for rate limiting and cookie attributes:

- **Configuration:** Set the environment variable `TRUST_PROXY`:
  ```bash
  # Standard single-hop reverse proxy (Render / Heroku)
  TRUST_PROXY=1

  # Multiple hops or specific upstream CIDR
  TRUST_PROXY=2
  ```
- **Default Behavior:** In production (`NODE_ENV=production`), `TRUST_PROXY` defaults to `1` if not explicitly set. In development and test, it defaults to `0`.

---

## 3. Known Gaps & Residual Risks

As an academic prototype, CivicFlow acknowledges the following security boundaries:

1. **No CSRF Tokens:** The application relies on `SameSite` cookie flags and CORS origin allowlisting rather than explicit Anti-CSRF challenge tokens (e.g. Double Submit Cookie or Synchronizer Tokens).
2. **No Account Lockout:** Rate limiting restricts attempt frequency to 20 per 15 minutes, but progressive delays or permanent account lockout after repeated failures are not implemented.
3. **No Antivirus / Malware File Scanning:** Media attachments uploaded to ImageKit are validated by MIME type and magic number signatures but are not scanned through an inline AV scanner (e.g. ClamAV).
4. **No Captcha on Registration:** Automated registration is mitigated via rate limiting rather than proof-of-work or CAPTCHA challenges.
