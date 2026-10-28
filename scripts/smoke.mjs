#!/usr/bin/env node
/**
 * CivicFlow Post-Deploy Smoke Test Script
 *
 * Usage (Single-Origin Mode - Production Render Web Service):
 *   node scripts/smoke.mjs --single-origin --api <serviceUrl>
 *
 * Usage (Dual-Origin Mode - Legacy Render Backend + Vercel Frontend):
 *   node scripts/smoke.mjs --api <apiUrl> [--web <webUrl>]
 *
 * Optional Environment Variables:
 *   SMOKE_ADMIN_EMAIL=admin@demo.civicflow.local
 *   SMOKE_ADMIN_PASSWORD=Demo@12345
 */

const args = process.argv.slice(2);
function getArg(flag, fallback = null) {
   const idx = args.indexOf(flag);
   if (idx !== -1 && idx + 1 < args.length) {
      return args[idx + 1];
   }
   return fallback;
}

const isSingleOrigin = args.includes("--single-origin");
const rawApiUrl = getArg("--api", process.env.API_URL || "http://localhost:3000");
const rawWebUrl = getArg("--web", process.env.WEB_URL || null);

const apiUrl = rawApiUrl.replace(/\/+$/, "");
const webUrl = isSingleOrigin ? apiUrl : (rawWebUrl ? rawWebUrl.replace(/\/+$/, "") : null);

const adminEmail = process.env.SMOKE_ADMIN_EMAIL || null;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || null;

console.log("\n==========================================");
console.log("     CIVICFLOW POST-DEPLOY SMOKE TEST     ");
console.log(`Mode:       ${isSingleOrigin ? "Single-Origin (Render Full-Stack)" : "Dual-Origin / Standard"}`);
console.log(`Target URL: ${apiUrl}`);
if (!isSingleOrigin) {
   console.log(`Web URL:    ${webUrl || "(None provided)"}`);
}
console.log(`Auth Probe: ${adminEmail ? `Configured (${adminEmail})` : "Skipped (no SMOKE_ADMIN_EMAIL)"}`);
console.log("------------------------------------------\n");

const results = [];

async function recordCheck(name, fn) {
   const start = Date.now();
   try {
      const details = await fn();
      const elapsed = Date.now() - start;
      results.push({ name, pass: true, details: details || "OK", elapsed: `${elapsed}ms` });
   } catch (err) {
      const elapsed = Date.now() - start;
      results.push({ name, pass: false, details: err.message, elapsed: `${elapsed}ms` });
   }
}

// 1. API Health Check Probe (/health)
await recordCheck("Health Check (/health)", async () => {
   const res = await fetch(`${apiUrl}/health`);
   if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
   }
   const json = await res.json().catch(() => ({}));
   if (json.status !== "ok") {
      throw new Error(`Expected { status: "ok" }, got ${JSON.stringify(json)}`);
   }
   return `HTTP 200 OK (${json.status})`;
});

// Single-Origin Frontend Root & SPA Deep-Link Probes
if (isSingleOrigin) {
   // 2. SPA Root (GET /)
   await recordCheck("SPA Root Document (GET /)", async () => {
      const res = await fetch(`${apiUrl}/`);
      if (res.status !== 200) {
         throw new Error(`Expected HTTP 200, got ${res.status}`);
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("text/html")) {
         throw new Error(`Expected text/html content-type, got "${ct}"`);
      }
      return `HTTP 200 OK (${ct.split(";")[0]})`;
   });

   // 3. SPA Deep Link Fallback (GET /dashboard)
   await recordCheck("SPA Deep-Link Fallback (GET /dashboard)", async () => {
      const res = await fetch(`${apiUrl}/dashboard`);
      if (res.status !== 200) {
         throw new Error(`Expected HTTP 200, got ${res.status}`);
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("text/html")) {
         throw new Error(`Expected text/html content-type for SPA deep-link, got "${ct}"`);
      }
      return `HTTP 200 OK (${ct.split(";")[0]})`;
   });

   // 4. API 404 Route Isolation (GET /api/__smoke_unknown_endpoint__)
   await recordCheck("API Unknown Route JSON 404 Guard", async () => {
      const res = await fetch(`${apiUrl}/api/__smoke_unknown_endpoint__`);
      if (res.status !== 404) {
         throw new Error(`Expected HTTP 404, got ${res.status}`);
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
         throw new Error(`Expected application/json error response, got "${ct}"`);
      }
      const json = await res.json().catch(() => ({}));
      return `HTTP 404 Not Found (JSON error: "${json.error || "Route not found"}")`;
   });
}

// 5. Dual-Origin CORS Preflight Probe (if webUrl provided and not single-origin)
if (!isSingleOrigin && webUrl) {
   await recordCheck(`CORS Preflight (Origin: ${webUrl})`, async () => {
      const res = await fetch(`${apiUrl}/api/auth/me`, {
         method: "OPTIONS",
         headers: {
            Origin: webUrl,
            "Access-Control-Request-Method": "GET",
         },
      });
      const acao = res.headers.get("access-control-allow-origin");
      const acac = res.headers.get("access-control-allow-credentials");

      if (acao !== webUrl && acao !== `${webUrl}/`) {
         throw new Error(`Access-Control-Allow-Origin was "${acao}", expected "${webUrl}"`);
      }
      if (acac !== "true") {
         throw new Error(`Access-Control-Allow-Credentials was "${acac}", expected "true"`);
      }
      return `Allowed origin ${acao} (credentials: ${acac})`;
   });
}

// 6. Unauthenticated Protected Route Probe (/api/complaints/similar)
await recordCheck("Unauthenticated Similar Endpoint (401 Guard)", async () => {
   const res = await fetch(`${apiUrl}/api/complaints/similar?lat=13.00&lng=80.22&category=Roads%20%26%20Transport&text=pothole`);
   if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, got ${res.status}`);
   }
   return "HTTP 401 Unauthorized (properly guarded)";
});

// 7. Socket.IO Polling Handshake
await recordCheck("Socket.IO Engine.IO Polling Handshake", async () => {
   const handshakeUrl = `${apiUrl}/socket.io/?EIO=4&transport=polling&t=${Date.now()}`;
   const res = await fetch(handshakeUrl);
   if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 for Socket.IO polling handshake, got ${res.status}`);
   }
   const text = await res.text();
   if (!text.startsWith("0{")) {
      throw new Error(`Invalid Socket.IO / Engine.IO handshake response: "${text.slice(0, 30)}"`);
   }
   let payload;
   try {
      payload = JSON.parse(text.slice(1));
   } catch {
      throw new Error("Unable to parse Engine.IO handshake JSON payload");
   }
   if (!payload.sid) {
      throw new Error("Engine.IO handshake payload did not contain a session id");
   }
   const upgrades = Array.isArray(payload.upgrades) ? payload.upgrades.join(",") : "none";
   return `HTTP 200 OK (Engine.IO open packet, upgrades: [${upgrades}], pingInterval: ${payload.pingInterval}ms)`;
});

// 8. Authentication Login & Cookie Flags Probe (if credentials given)
if (adminEmail && adminPassword) {
   await recordCheck(`Authentication Login & Cookie Flags (${adminEmail})`, async () => {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      if (res.status !== 200) {
         throw new Error(`Expected HTTP 200 on login, got ${res.status}`);
      }
      const setCookie = res.headers.get("set-cookie") || "";
      const isHttpOnly = /httponly/i.test(setCookie);
      const isSameSiteLax = /samesite=lax/i.test(setCookie);
      const isSecure = /secure/i.test(setCookie);

      if (!isHttpOnly) {
         throw new Error("Login succeeded but Set-Cookie header missing HttpOnly attribute");
      }
      if (isSingleOrigin && !isSameSiteLax) {
         throw new Error("Single-origin login Set-Cookie missing SameSite=Lax attribute");
      }
      if (apiUrl.startsWith("https:") && !isSecure) {
         throw new Error("HTTPS login Set-Cookie missing Secure attribute");
      }

      const flags = [
         isHttpOnly ? "HttpOnly" : null,
         isSecure ? "Secure" : null,
         isSameSiteLax ? "SameSite=Lax" : null,
      ].filter(Boolean).join("; ");

      return `HTTP 200 OK (Auth cookies verified: ${flags})`;
   });
}

// 9. Legacy Dual-Origin Web Frontend Availability (if webUrl given and not single-origin)
if (!isSingleOrigin && webUrl) {
   await recordCheck(`Web Frontend Root (${webUrl})`, async () => {
      try {
         const res = await fetch(webUrl);
         if (res.status !== 200) {
            throw new Error(`Expected HTTP 200, got ${res.status}`);
         }
         const contentType = res.headers.get("content-type") || "";
         if (!contentType.includes("text/html")) {
            throw new Error(`Expected text/html content-type, got "${contentType}"`);
         }
         return `HTTP 200 OK (${contentType.split(";")[0]})`;
      } catch (err) {
         throw new Error(`Frontend unreachable: ${err.message}`);
      }
   });
}

// Print Report
console.log("| Check | Status | Elapsed | Details |");
console.log("|---|:---:|:---:|---|");
for (const r of results) {
   const statusIcon = r.pass ? "PASS" : "FAIL";
   console.log(`| ${r.name} | **${statusIcon}** | ${r.elapsed} | ${r.details} |`);
}

const failed = results.filter((r) => !r.pass);
console.log("\n------------------------------------------");
if (failed.length === 0) {
   console.log("RESULT: ALL SMOKE CHECKS PASSED (0 failures)");
   console.log("==========================================\n");
   process.exit(0);
} else {
   console.log(`RESULT: ${failed.length} SMOKE CHECK(S) FAILED`);
   console.log("==========================================\n");
   process.exit(1);
}
