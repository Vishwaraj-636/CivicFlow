#!/usr/bin/env node
/**
 * CivicFlow Production Smoke Test Script
 *
 * Usage:
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

const rawApiUrl = getArg("--api", process.env.API_URL || "http://localhost:3000");
const rawWebUrl = getArg("--web", process.env.WEB_URL || null);

const apiUrl = rawApiUrl.replace(/\/+$/, "");
const webUrl = rawWebUrl ? rawWebUrl.replace(/\/+$/, "") : null;

const adminEmail = process.env.SMOKE_ADMIN_EMAIL || null;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || null;

console.log("\n==========================================");
console.log("     CIVICFLOW POST-DEPLOY SMOKE TEST     ");
console.log("==========================================");
console.log(`API Target: ${apiUrl}`);
console.log(`Web Target: ${webUrl || "(None provided)"}`);
console.log(`Auth Probe: ${adminEmail ? `Yes (${adminEmail})` : "Skipped (no SMOKE_ADMIN_EMAIL)"}`);
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

// 1. API Health Check Probe
await recordCheck("API Health Check (/health)", async () => {
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

// 2. CORS Preflight Probe
if (webUrl) {
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

// 3. Unauthenticated Protected Route Probe (/api/complaints/similar)
await recordCheck("Unauthenticated Similar Endpoint (401 Guard)", async () => {
   const res = await fetch(`${apiUrl}/api/complaints/similar?lat=13.00&lng=80.22&category=Roads%20%26%20Transport&text=pothole`);
   if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, got ${res.status}`);
   }
   return "HTTP 401 Unauthorized (properly guarded)";
});

// 4. Authentication Login & Cookie Probe (if credentials given)
if (adminEmail && adminPassword) {
   await recordCheck(`Authentication Login (${adminEmail})`, async () => {
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
      if (!isHttpOnly) {
         throw new Error("Login succeeded but Set-Cookie header missing HttpOnly attribute");
      }
      return "HTTP 200 OK (Auth cookie verified with HttpOnly)";
   });
}

// 5. Web Frontend Availability (if webUrl given)
if (webUrl) {
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
