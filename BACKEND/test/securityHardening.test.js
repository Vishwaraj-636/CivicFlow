import assert from "node:assert/strict";
import test, { describe, it, before, after } from "node:test";
import http from "node:http";
import mongoose from "mongoose";
import app from "../src/app.js";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/civicflow_security_test";

describe("SECURITY HARDENING TEST SUITE", () => {
   let server;
   let baseUrl;

   before(async () => {
      if (mongoose.connection.readyState === 0) {
         await mongoose.connect(TEST_DB_URI);
      }
      await new Promise((resolve) => {
         server = http.createServer(app);
         server.listen(0, "127.0.0.1", () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            resolve();
         });
      });
   });

   after(async () => {
      if (server) {
         await new Promise((resolve) => server.close(resolve));
      }
      if (mongoose.connection.readyState !== 0) {
         await mongoose.connection.dropDatabase().catch(() => {});
         await mongoose.disconnect();
      }
   });

   describe("1. Helmet Security Headers", () => {
      it("presents Helmet security headers on responses (x-content-type-options, x-dns-prefetch-control)", async () => {
         const res = await fetch(`${baseUrl}/health`);
         assert.equal(res.status, 200);
         assert.equal(res.headers.get("x-content-type-options"), "nosniff");
         assert.equal(res.headers.get("x-dns-prefetch-control"), "off");
      });

      it("presents Content-Security-Policy with required image and connect sources", async () => {
         const res = await fetch(`${baseUrl}/health`);
         const csp = res.headers.get("content-security-policy");
         assert.ok(csp, "CSP header should be present");
         assert.ok(csp.includes("ik.imagekit.io"), "CSP should include ImageKit host");
         assert.ok(csp.includes("nominatim.openstreetmap.org"), "CSP should include Nominatim host");
      });
   });

   describe("2. Operator-Injection ($ Key) Guard", () => {
      it("rejects top-level $-operator keys in body with 400 Bad Request", async () => {
         const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               $where: "sleep(5000)",
               email: "user@example.com",
            }),
         });
         assert.equal(res.status, 400);
         const json = await res.json();
         assert.ok(json.message.includes("$"));
      });

      it("rejects nested $-operator keys in body with 400 Bad Request", async () => {
         const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               email: { $gt: "" },
               password: "password123",
            }),
         });
         assert.equal(res.status, 400);
         const json = await res.json();
         assert.ok(json.message.includes("$"));
      });
   });

   describe("3. Zod Input Validation", () => {
      it("rejects invalid register payload with 400 Bad Request", async () => {
         const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               email: "not-an-email",
               password: "123", // too short (< 6)
               fullname: "a", // too short (< 3)
               contact: "123", // not 10 digits
            }),
         });
         assert.equal(res.status, 400);
         const json = await res.json();
         assert.ok(json.message);
      });

      it("rejects invalid login payload with 400 Bad Request", async () => {
         const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               email: "invalid-email-format",
            }),
         });
         assert.equal(res.status, 400);
      });
   });

   describe("4. Rate Limiting", () => {
      it("answers 429 when auth rate limit is exceeded with rate limiting enabled in test", async () => {
         process.env.ENABLE_RATE_LIMIT_IN_TEST = "1";
         try {
            let hit429 = false;
            // Auth limit is 20 requests per 15 minutes
            for (let i = 0; i < 25; i++) {
               const res = await fetch(`${baseUrl}/api/auth/login`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                     email: "invalid-user@example.com",
                     password: "somepassword",
                  }),
               });
               if (res.status === 429) {
                  hit429 = true;
                  const json = await res.json();
                  assert.ok(json.message.includes("15 minutes") || json.message.includes("Too many"));
                  break;
               }
            }
            assert.ok(hit429, "Expected to receive 429 after exceeding 20 auth attempts");
         } finally {
            delete process.env.ENABLE_RATE_LIMIT_IN_TEST;
         }
      });
   });
});
