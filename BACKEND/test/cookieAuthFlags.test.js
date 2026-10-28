import assert from "node:assert/strict";
import test, { describe, it, before, after } from "node:test";
import http from "node:http";
import mongoose from "mongoose";

// Set production environment flags for this test
process.env.NODE_ENV = "production";
process.env.COOKIE_SAME_SITE = "lax";
process.env.JWT_SECRET = "test-jwt-secret-min-32-chars-long-for-testing";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/civicflow_cookie_flags_test";

const { default: app } = await import("../src/app.js");
const { default: User } = await import("../src/model/user.model.js");

describe("ITEM 4 — SAME-ORIGIN COOKIE FLAGS & AUTHENTICATION", () => {
   let server;
   let baseUrl;
   const testUser = {
      fullname: "Cookie Test Citizen",
      email: "cookie.test@example.com",
      password: "TestPassword@123",
      contact: "9876543210",
   };

   before(async () => {
      if (mongoose.connection.readyState === 0) {
         await mongoose.connect(TEST_DB_URI);
      }
      // Ensure clean state
      await User.deleteMany({ email: testUser.email });

      // Create test user directly with passwordHash
      const user = new User({
         fullname: testUser.fullname,
         email: testUser.email,
         passwordHash: testUser.password,
         contact: testUser.contact,
         role: "citizen",
         authProvider: "local",
         profileCompleted: true,
      });
      await user.save();

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
         await User.deleteMany({ email: testUser.email });
         await mongoose.connection.dropDatabase().catch(() => {});
         await mongoose.disconnect();
      }
   });

   it("verifies login session cookie includes HttpOnly, Secure, and SameSite=Lax", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            email: testUser.email,
            password: testUser.password,
         }),
      });

      assert.equal(res.status, 200, "Login request must succeed with HTTP 200");

      const setCookie = res.headers.get("set-cookie");
      assert.ok(setCookie, "Response must include Set-Cookie header");
      assert.ok(setCookie.startsWith("token="), "Cookie name must be 'token'");

      // Verify individual security attributes without exposing the token value
      const hasHttpOnly = /httponly/i.test(setCookie);
      const hasSecure = /secure/i.test(setCookie);
      const hasSameSiteLax = /samesite=lax/i.test(setCookie);

      assert.equal(hasHttpOnly, true, "Cookie must have HttpOnly attribute");
      assert.equal(hasSecure, true, "Cookie must have Secure attribute in production");
      assert.equal(hasSameSiteLax, true, "Cookie must have SameSite=Lax attribute");
   });
});
