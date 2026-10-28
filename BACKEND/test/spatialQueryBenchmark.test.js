import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   calculatePercentile,
   generateSyntheticLocations,
   runSpatialQueryBenchmark,
   formatSpatialBenchmarkMarkdown,
   BENCHMARK_VOLUMES,
} from "../src/evaluation/spatialQueryBenchmark.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Task F — Spatial Query Latency Benchmark", () => {
   describe("1. Percentile Calculation Functionality", () => {
      it("calculates exact percentiles and edge cases", () => {
         assert.equal(calculatePercentile([], 50), 0);
         assert.equal(calculatePercentile([10], 50), 10);
         assert.equal(calculatePercentile([10], 99), 10);

         const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
         // p50 is median (5.5)
         assert.equal(calculatePercentile(values, 50), 5.5);
         // p0 is min (1)
         assert.equal(calculatePercentile(values, 0), 1);
         // p100 is max (10)
         assert.equal(calculatePercentile(values, 100), 10);
      });
   });

   describe("2. Synthetic Spatial Location Generation", () => {
      it("generates deterministic GeoJSON points with proper coordinates and schema", () => {
         const docs1 = generateSyntheticLocations(50, 42);
         const docs2 = generateSyntheticLocations(50, 42);

         assert.equal(docs1.length, 50);
         assert.deepEqual(docs1, docs2, "Random seed 42 must generate identical datasets");

         for (const doc of docs1) {
            assert.ok(doc.ticketId.startsWith("BENCH-"));
            assert.equal(doc.location.type, "Point");
            assert.equal(doc.location.coordinates.length, 2);
            const [lng, lat] = doc.location.coordinates;
            // Verify within Chennai geographic bounding box
            assert.ok(lng >= 80.0 && lng <= 80.5, `Longitude ${lng} within bounds`);
            assert.ok(lat >= 12.8 && lat <= 13.3, `Latitude ${lat} within bounds`);
            assert.ok(typeof doc.category === "string");
         }
      });
   });

   describe("3. Database Target Safety Gates", () => {
      it("strictly rejects connection to non-benchmark/non-isolated database URIs", async () => {
         await assert.rejects(
            async () => {
               await runSpatialQueryBenchmark({ dbUri: "mongodb://production-cluster:27017/civicflow_prod" });
            },
            {
               message: /\[SAFETY GATE\] Database URI must contain 'benchmark', 'isolated', or 'test'/,
            }
         );
      });
   });

   describe("4. Benchmark Artifact Schema and Plan Integrity", () => {
      it("validates saved spatial_query_benchmark.json against protocol criteria", () => {
         const jsonPath = path.resolve(__dirname, "../results/spatial_query_benchmark.json");
         assert.ok(fs.existsSync(jsonPath), "spatial_query_benchmark.json must exist");

         const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
         assert.ok(data.timestamp);
         assert.ok(data.environment.mongoVersion);
         assert.ok(data.environment.databaseUri.includes("isolated"));
         assert.equal(data.volumeExperiments.length, 3);

         const volumes = data.volumeExperiments.map((e) => e.volume);
         assert.deepEqual(volumes, [1000, 10000, 50000]);

         for (const exp of data.volumeExperiments) {
            // Check unindexed scan
            const u = exp.unindexed_geoWithin;
            assert.equal(u.plan.stage, "COLLSCAN", "Unindexed query must execute COLLSCAN");
            assert.equal(u.plan.totalDocsExamined, exp.volume, "COLLSCAN must examine all documents");
            assert.ok(u.latency.p50_ms > 0);

            // Check indexed geoWithin
            const i = exp.indexed_geoWithin;
            assert.ok(["FETCH", "IXSCAN"].includes(i.plan.stage), "Indexed query must execute FETCH/IXSCAN");
            assert.ok(i.plan.totalDocsExamined < exp.volume, "Indexed query must examine fewer docs than total volume");
            assert.ok(i.speedupRatioVsUnindexed >= 1.0, "Index must accelerate query or match");

            // Check indexed near
            const n = exp.indexed_near;
            assert.equal(n.plan.stage, "GEO_NEAR_2DSPHERE", "Indexed near query must use GEO_NEAR_2DSPHERE");
            assert.ok(n.plan.totalDocsExamined < exp.volume);
         }
      });

      it("validates markdown formatting produces valid summary table and sections", () => {
         const jsonPath = path.resolve(__dirname, "../results/spatial_query_benchmark.json");
         const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
         const md = formatSpatialBenchmarkMarkdown(data);

         assert.ok(md.includes("# CivicFlow Research Evaluation — Task F: Spatial Query Latency Benchmark Report"));
         assert.ok(md.includes("COLLSCAN"));
         assert.ok(md.includes("GEO_NEAR_2DSPHERE"));
         assert.ok(md.includes("50,000"));
      });
   });
});
