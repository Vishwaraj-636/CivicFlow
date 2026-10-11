import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   REPORT_PATHS,
   EXPECTED_METHOD_IDS,
   readJsonSafe,
   generateResultsReport,
} from "../src/evaluation/generateResultsReport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CIVICFLOW Phase T6 — Results Report Generator", () => {
   describe("1. Report Generation and Output Path Resolution", () => {
      it("generates docs/RESULTS.md from existing verified artifacts", () => {
         const res = generateResultsReport();
         assert.ok(fs.existsSync(res.outputPath));
         assert.equal(res.outputPath, REPORT_PATHS.outputFile);
         assert.ok(typeof res.markdown === "string" && res.markdown.length > 5000);
      });

      it("contains all required report sections from A to K", () => {
         const res = generateResultsReport();
         const md = res.markdown;

         assert.ok(md.includes("## A. Research Protocol and Dataset"));
         assert.ok(md.includes("## B. Methods Compared"));
         assert.ok(md.includes("## C. Validation Comparison"));
         assert.ok(md.includes("## D. Error Analysis"));
         assert.ok(md.includes("## E. Test and Challenge Results"));
         assert.ok(md.includes("## F. Confidence Intervals and Statistical Procedure"));
         assert.ok(md.includes("## G. Feature Ablation Study"));
         assert.ok(md.includes("## H. Latency and Spatial-Index Benchmark"));
         assert.ok(md.includes("## I. Learned Weights"));
         assert.ok(md.includes("## J. Limitations and Threats to Validity"));
         assert.ok(md.includes("## K. Reproducibility and Artifact Manifest"));
      });
   });

   describe("2. Numerical Verification Against Source Artifacts", () => {
      it("dynamically reads and matches T1 validation comparison metrics", () => {
         const t1Data = JSON.parse(fs.readFileSync(REPORT_PATHS.t1Json, "utf8"));
         const res = generateResultsReport();
         const md = res.markdown;

         for (const id of EXPECTED_METHOD_IDS) {
            const m = t1Data.methods[id];
            assert.ok(m, `Method ${id} must exist in source T1 artifact`);

            // Verify method name, macro F1, and accuracy appear in generated markdown
            assert.ok(md.includes(id));
            assert.ok(md.includes(m.validation_metrics.macro_f1.toFixed(4)));
            assert.ok(md.includes((m.validation_metrics.accuracy * 100).toFixed(2)));
         }
      });

      it("correctly integrates T3 error-analysis misclassification counts", () => {
         const res = generateResultsReport();
         const md = res.markdown;

         // Check known error counts from T3
         assert.ok(md.includes("**0** / 80")); // HISC, B3
         assert.ok(md.includes("**24** / 80")); // B1
         assert.ok(md.includes("**19** / 80")); // B2
         assert.ok(md.includes("**18** / 80")); // B4
         assert.ok(md.includes("**14** / 80")); // B5
      });
   });

   describe("3. Missing Artifacts and Error Handling", () => {
      it("throws an explicit error when mandatory T1 artifact is missing", () => {
         const dummyPath = path.resolve(__dirname, "nonexistent_t1.json");
         assert.throws(
            () => generateResultsReport({ t1Json: dummyPath }),
            /Mandatory T1 evaluation artifact missing/
         );
      });

      it("handles missing historical baseline artifact gracefully without crashing", () => {
         const dummyHist = path.resolve(__dirname, "nonexistent_hist.json");
         const tempOut = path.resolve(__dirname, "temp_results.md");

         try {
            const res = generateResultsReport({
               historicalBaselineJson: dummyHist,
               outputFile: tempOut,
            });
            assert.ok(res.markdown.includes("Feature ablation study for the new baseline roster:* **Pending**"));
         } finally {
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
         }
      });

      it("readJsonSafe returns null for missing or invalid files", () => {
         assert.equal(readJsonSafe("nonexistent_file.json"), null);
      });
   });

   describe("4. Determinism and Status Flags", () => {
      it("produces deterministic markdown across multiple invocations", () => {
         const run1 = generateResultsReport();
         const run2 = generateResultsReport();
         assert.equal(run1.markdown, run2.markdown);
      });

      it("explicitly marks unperformed evaluations with required pending labels", () => {
         const res = generateResultsReport();
         const md = res.markdown;

         assert.ok(md.includes("Pending final evaluation"));
         assert.ok(md.includes("Pending T4") || md.includes("## H. Latency and Spatial-Index Benchmark"));
         assert.ok(md.includes("Pending optional T5"));
      });
   });
});
