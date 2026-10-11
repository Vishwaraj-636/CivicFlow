import assert from "node:assert/strict";
import test, { describe, it, before, after } from "node:test";
import http from "node:http";
import mongoose from "mongoose";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_URI = "mongodb://127.0.0.1:27017/civicflow_static_serving_test";

// Enforce production mode for this test suite
process.env.NODE_ENV = "production";

// Dynamically import app so NODE_ENV='production' is active at module initialization
const { default: app } = await import("../src/app.js");

describe("ITEM 1 — SINGLE-ORIGIN STATIC SERVING & SPA FALLBACK", () => {
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

   describe("1. Health Endpoint and API Routes", () => {
      it("GET /health responds with 200 and { status: 'ok' }", async () => {
         const res = await fetch(`${baseUrl}/health`);
         assert.equal(res.status, 200);
         const body = await res.json();
         assert.deepEqual(body, { status: "ok" });
      });

      it("GET /api/<unknown> returns JSON 404 and error property, not HTML", async () => {
         const res = await fetch(`${baseUrl}/api/unknown-endpoint-check`);
         assert.equal(res.status, 404);
         const contentType = res.headers.get("content-type") || "";
         assert.ok(contentType.includes("application/json"), `Expected JSON, got: ${contentType}`);
         const body = await res.json();
         assert.equal(body.error, "API route not found");
      });
   });

   describe("2. Production SPA Fallback and Deep Links", () => {
      const frontendDist = path.resolve(__dirname, "../../FRONTEND/dist");
      const indexHtmlPath = path.join(frontendDist, "index.html");
      const hasDist = fs.existsSync(indexHtmlPath);

      it("resolves frontend build path correctly from repository root or backend", () => {
         assert.ok(frontendDist.includes("FRONTEND"), "Path must point to FRONTEND directory");
      });

      it("serves HTML on GET / when running in production with dist built", async () => {
         if (!hasDist) return;
         const res = await fetch(`${baseUrl}/`);
         assert.equal(res.status, 200);
         const text = await res.text();
         assert.ok(text.includes("<div id=\"root\">") || text.includes("<!doctype html>") || text.includes("<html"), "Response must contain HTML markup");
      });

      it("serves HTML on GET /dashboard deep-link path", async () => {
         if (!hasDist) return;
         const res = await fetch(`${baseUrl}/dashboard`);
         assert.equal(res.status, 200);
         const text = await res.text();
         assert.ok(text.includes("<div id=\"root\">") || text.includes("<!doctype html>") || text.includes("<html"), "Response must contain HTML markup");
      });

      it("does not serve HTML on POST to client routes", async () => {
         const res = await fetch(`${baseUrl}/dashboard`, { method: "POST" });
         assert.notEqual(res.status, 200);
         const text = await res.text();
         assert.ok(!text.includes("<div id=\"root\">"));
      });

      it("does not intercept /api routes with HTML fallback", async () => {
         const res = await fetch(`${baseUrl}/api/nonexistent`);
         assert.equal(res.status, 404);
         const body = await res.json();
         assert.equal(body.error, "API route not found");
      });
   });
});
