import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { parseAllowedOrigins, isOriginAllowed, resolveCookieOptions } from "../src/config/config.js";
import app from "../src/app.js";

describe("Production Connectivity and Configuration Validation", () => {
   test("parseAllowedOrigins defaults to http://localhost:5173 when undefined or empty", () => {
      assert.deepEqual(parseAllowedOrigins(undefined), ["http://localhost:5173"]);
      assert.deepEqual(parseAllowedOrigins(""), ["http://localhost:5173"]);
   });

   test("parseAllowedOrigins correctly trims whitespace and trailing slashes for comma-separated origins", () => {
      const raw = " https://civicflow.example.com/ , http://localhost:5173/ , https://admin.civicflow.example.com ";
      const parsed = parseAllowedOrigins(raw);
      assert.deepEqual(parsed, [
         "https://civicflow.example.com",
         "http://localhost:5173",
         "https://admin.civicflow.example.com",
      ]);
   });

   test("isOriginAllowed allows requests with missing origin (curl, mobile, health checks)", () => {
      assert.equal(isOriginAllowed(undefined), true);
      assert.equal(isOriginAllowed(null), true);
      assert.equal(isOriginAllowed(""), true);
   });

   test("isOriginAllowed permits matching origins regardless of trailing slashes", () => {
      const allowlist = ["https://civicflow.example.com", "http://localhost:5173"];
      assert.equal(isOriginAllowed("https://civicflow.example.com", allowlist), true);
      assert.equal(isOriginAllowed("https://civicflow.example.com/", allowlist), true);
      assert.equal(isOriginAllowed("http://localhost:5173", allowlist), true);
   });

   test("isOriginAllowed rejects untrusted/disallowed origins without wildcard fallback", () => {
      const allowlist = ["https://civicflow.example.com", "http://localhost:5173"];
      assert.equal(isOriginAllowed("http://evil-site.com", allowlist), false);
      assert.equal(isOriginAllowed("https://civicflow.example.com.evil.com", allowlist), false);
   });

   test("resolveCookieOptions defaults to lax and secure in production", () => {
      const dev = resolveCookieOptions({ NODE_ENV: "development" });
      assert.equal(dev.sameSite, "lax");
      assert.equal(dev.secure, false);
      assert.equal(dev.httpOnly, true);

      const prod = resolveCookieOptions({ NODE_ENV: "production" });
      assert.equal(prod.sameSite, "lax");
      assert.equal(prod.secure, true);
      assert.equal(prod.httpOnly, true);
   });

   test("resolveCookieOptions enforces secure: true when sameSite is none", () => {
      const crossSite = resolveCookieOptions({ NODE_ENV: "development", COOKIE_SAME_SITE: "none" });
      assert.equal(crossSite.sameSite, "none");
      assert.equal(crossSite.secure, true);
   });

   test("resolveCookieOptions falls back securely to lax when invalid value provided", () => {
      const invalid = resolveCookieOptions({ NODE_ENV: "production", COOKIE_SAME_SITE: "invalid_value" });
      assert.equal(invalid.sameSite, "lax");
      assert.equal(invalid.secure, true);
   });

   test("GET /health endpoint returns HTTP 200 with ok status", async () => {
      const server = app.listen(0);
      try {
         const port = server.address().port;
         const res = await fetch(`http://127.0.0.1:${port}/health`);
         assert.equal(res.status, 200);
         const body = await res.json();
         assert.deepEqual(body, { status: "ok" });
      } finally {
         server.close();
      }
   });
});
