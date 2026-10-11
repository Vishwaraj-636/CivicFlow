import assert from "node:assert/strict";
import test, { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("ITEM 3 — FRONTEND API AND SOCKET SAME-ORIGIN CONFIGURATION", () => {
   const configPath = path.resolve(__dirname, "../../FRONTEND/src/config/api.config.js");
   const distDir = path.resolve(__dirname, "../../FRONTEND/dist/assets");

   it("frontend api.config.js exists and exports expected constants and helper functions", () => {
      assert.ok(fs.existsSync(configPath), "api.config.js must exist");
      const content = fs.readFileSync(configPath, "utf8");
      assert.ok(content.includes("API_BASE_URL"), "must export API_BASE_URL");
      assert.ok(content.includes("SOCKET_URL"), "must export SOCKET_URL");
      assert.ok(content.includes("buildApiUrl"), "must export buildApiUrl");
      assert.ok(content.includes("GOOGLE_AUTH_URL"), "must export GOOGLE_AUTH_URL");
   });

   it("production build bundle does not retain localhost API defaults", () => {
      if (!fs.existsSync(distDir)) {
         console.log("Skipping bundle test because FRONTEND/dist/assets does not exist");
         return;
      }
      const jsFiles = fs.readdirSync(distDir).filter((file) => file.endsWith(".js"));
      assert.ok(jsFiles.length > 0, "Production bundle must contain at least one JS file");

      let foundLocalhost = false;
      for (const file of jsFiles) {
         const code = fs.readFileSync(path.join(distDir, file), "utf8");
         if (code.includes("http://localhost:3000/api")) {
            foundLocalhost = true;
         }
      }
      assert.equal(foundLocalhost, false, "Production JS bundle must not contain 'http://localhost:3000/api'");
   });
});
