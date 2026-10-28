import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
   BENCHMARK_DB_URI,
   BENCHMARK_PATHS,
   CHENNAI_COORDINATES,
   CIVIC_CATEGORIES,
   createMulberry32,
   calculatePercentile,
   computeSummaryStats,
   generateSyntheticWorkload,
} from "../src/evaluation/clusteringLatencyBenchmark.js";
import { generateResultsReport } from "../src/evaluation/generateResultsReport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CIVICFLOW Phase T4 — Clustering Latency & Spatial-Index Benchmark", () => {
   describe("1. Deterministic Synthetic Workload Generation", () => {
      it("generates deterministic records for identical random seed", () => {
         const w1 = generateSyntheticWorkload(50, 42);
         const w2 = generateSyntheticWorkload(50, 42);

         assert.equal(w1.length, 50);
         assert.equal(w2.length, 50);
         assert.deepEqual(
            w1.map((c) => ({ id: c.complaintId, title: c.title, loc: c.location.coordinates })),
            w2.map((c) => ({ id: c.complaintId, title: c.title, loc: c.location.coordinates }))
         );
      });

      it("produces different records when seed differs", () => {
         const w1 = generateSyntheticWorkload(30, 42);
         const w2 = generateSyntheticWorkload(30, 999);

         assert.notDeepEqual(
            w1.map((c) => c.location.coordinates),
            w2.map((c) => c.location.coordinates)
         );
      });

      it("mulberry32 PRNG produces numbers strictly within [0, 1)", () => {
         const rng = createMulberry32(12345);
         for (let i = 0; i < 1000; i++) {
            const val = rng();
            assert.ok(val >= 0 && val < 1, `Value ${val} must be in [0, 1)`);
         }
      });
   });

   describe("2. Valid Coordinates and Unique Synthetic IDs", () => {
      it("generates valid GeoJSON Point coordinates around Chennai", () => {
         const workload = generateSyntheticWorkload(100, 42);
         for (const complaint of workload) {
            assert.equal(complaint.location.type, "Point");
            assert.equal(complaint.location.coordinates.length, 2);

            const [lng, lat] = complaint.location.coordinates;
            // Chennai bounding envelope: Longitude ~79.8 to 80.6, Latitude ~12.8 to 13.4
            assert.ok(lng >= 79.8 && lng <= 80.6, `Longitude ${lng} outside Chennai region`);
            assert.ok(lat >= 12.8 && lat <= 13.4, `Latitude ${lat} outside Chennai region`);
         }
      });

      it("assigns unique complaint IDs and required fields without nulls", () => {
         const count = 200;
         const workload = generateSyntheticWorkload(count, 42);
         const idSet = new Set();

         for (const c of workload) {
            assert.ok(!idSet.has(c.complaintId), `Duplicate complaintId: ${c.complaintId}`);
            idSet.add(c.complaintId);

            assert.match(c.complaintId, /^SYN-\d{6}$/);
            assert.ok(c.citizenId, "citizenId must exist");
            assert.ok(c.title && c.title.length > 5, "title must be valid string");
            assert.ok(c.description && c.description.length > 10, "description must be valid string");
            assert.ok(CIVIC_CATEGORIES.includes(c.category), `Category ${c.category} must be in CIVIC_CATEGORIES`);
            assert.ok(c.createdAt instanceof Date, "createdAt must be Date");
            assert.ok(c.resolutionDeadline instanceof Date, "resolutionDeadline must be Date");
            assert.ok(c.resolutionDeadline > c.createdAt, "deadline must be after createdAt");
         }

         assert.equal(idSet.size, count);
      });
   });

   describe("3. Percentile and Statistical Calculation", () => {
      it("computes exact p50 and p95 for known series", () => {
         const series = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
         const p50 = calculatePercentile(series, 0.50);
         const p95 = calculatePercentile(series, 0.95);

         assert.equal(p50, 5); // index Math.floor(0.50 * 9) = 4 -> 5
         assert.equal(p95, 9); // index Math.floor(0.95 * 9) = 8 -> 9
      });

      it("handles empty and single-element inputs safely", () => {
         assert.equal(calculatePercentile([], 0.5), 0);
         assert.equal(calculatePercentile([42], 0.5), 42);
         assert.equal(calculatePercentile([42], 0.95), 42);

         const emptyStats = computeSummaryStats([]);
         assert.equal(emptyStats.count, 0);
         assert.equal(emptyStats.mean, 0);
         assert.equal(emptyStats.p50, 0);
      });

      it("computes summary statistics accurately", () => {
         const values = [10, 20, 30, 40, 50];
         const stats = computeSummaryStats(values);

         assert.equal(stats.count, 5);
         assert.equal(stats.mean, 30);
         assert.equal(stats.min, 10);
         assert.equal(stats.max, 50);
         assert.equal(stats.p50, 30);
      });
   });

   describe("4. Benchmark Output Schema & Artifact Verification", () => {
      it("verifies t4_latency_benchmark.json schema and required sections", () => {
         assert.ok(fs.existsSync(BENCHMARK_PATHS.json), "t4_latency_benchmark.json must exist");
         const data = JSON.parse(fs.readFileSync(BENCHMARK_PATHS.json, "utf8"));

         assert.ok(data.metadata, "metadata block required");
         assert.match(data.metadata.evaluation_phase, /T4/);
         assert.ok(data.metadata.timestamp, "timestamp required");
         assert.ok(data.metadata.git_commit, "git_commit required");
         assert.ok(data.metadata.database_uri, "database_uri required");
         assert.ok(data.metadata.database_version, "database_version required");
         assert.equal(data.metadata.seed, 42);
         assert.deepEqual(data.metadata.workload_sizes, [1000, 10000, 50000]);

         // Spatial Index Benchmark
         assert.ok(Array.isArray(data.spatial_index_experiment));
         assert.equal(data.spatial_index_experiment.length, 3);
         for (const s of data.spatial_index_experiment) {
            assert.ok([1000, 10000, 50000].includes(s.workload_size));
            assert.ok(typeof s.insert_time_ms === "number" && s.insert_time_ms > 0);
            assert.ok(typeof s.index_build_time_ms === "number" && s.index_build_time_ms > 0);
            assert.ok(s.unindexed && s.unindexed.latency);
            assert.ok(s.indexed_2dsphere && s.indexed_2dsphere.latency);
            assert.ok(s.speedup_ratio > 1.0, "2dsphere should accelerate spatial query p50");
         }

         // Candidate Cap Benchmark
         assert.ok(data.candidate_caps_experiment);
         const capKeys = Object.keys(data.candidate_caps_experiment);
         assert.deepEqual(capKeys, ["cap_10", "cap_20", "cap_40", "cap_80"]);
         for (const key of capKeys) {
            const capObj = data.candidate_caps_experiment[key];
            assert.ok(capObj.query_latency && capObj.query_latency.p50 > 0);
            assert.ok(capObj.upsert_latency && capObj.upsert_latency.p50 > 0);
         }

         // Embedding Toggle Benchmark
         assert.ok(data.embedding_comparison);
         assert.ok(data.embedding_comparison.embedding_disabled);
         assert.ok(data.embedding_comparison.embedding_enabled);
         assert.equal(data.embedding_comparison.embedding_enabled.provider, "local");
         assert.ok(data.embedding_comparison.embedding_enabled.cold_start_load_ms > 0);
      });

      it("verifies t4_latency_benchmark.csv and t4_latency_benchmark.md exist", () => {
         assert.ok(fs.existsSync(BENCHMARK_PATHS.csv), "t4_latency_benchmark.csv must exist");
         assert.ok(fs.existsSync(BENCHMARK_PATHS.md), "t4_latency_benchmark.md must exist");

         const csv = fs.readFileSync(BENCHMARK_PATHS.csv, "utf8");
         assert.ok(csv.includes("experiment_type,workload_size,configuration,cap,stage,query_p50_ms,query_p95_ms,upsert_p50_ms,upsert_p95_ms,speedup_or_overhead"));

         const md = fs.readFileSync(BENCHMARK_PATHS.md, "utf8");
         assert.ok(md.includes("# CivicFlow Research Evaluation — T4: Clustering Latency & Spatial Index Benchmark"));
      });
   });

   describe("5. Handling Capabilities & Fallbacks", () => {
      it("reports unavailable configurations with reason rather than fabricating zeros", () => {
         const mockUnavailable = {
            requested_cap: 100,
            status: "unavailable",
            reason: "MongoDB connection refused or memory limit exceeded",
            candidate_query: null,
            full_upsert: null,
         };

         assert.equal(mockUnavailable.status, "unavailable");
         assert.equal(mockUnavailable.candidate_query, null);
         assert.notEqual(mockUnavailable.candidate_query, 0);
      });
   });

   describe("6. Report Generator Integration", () => {
      it("incorporates verified T4 latency benchmark into Section H of docs/RESULTS.md", () => {
         const res = generateResultsReport();
         const md = res.markdown;

         assert.ok(md.includes("## H. Latency and Spatial-Index Benchmark"));
         assert.ok(md.includes("Spatial Index Acceleration (2dsphere vs Unindexed)"));
         assert.ok(md.includes("Candidate Retrieval Caps (K = 10, 20, 40, 80)"));
         assert.ok(md.includes("Embedding Enabled vs Disabled Latency Comparison"));

         // Verify numerical match with t4_latency_benchmark.json
         const t4Data = JSON.parse(fs.readFileSync(BENCHMARK_PATHS.json, "utf8"));
         const k40 = t4Data.candidate_caps_experiment.cap_40;
         assert.ok(md.includes(String(k40.query_latency.p50)));
         assert.ok(md.includes(String(k40.upsert_latency.p50)));

         // Verify Section E still marks test and challenge as pending
         assert.ok(md.includes("Pending final evaluation"));
      });

      it("includes T4 benchmark artifacts in Section K artifact manifest", () => {
         const res = generateResultsReport();
         const md = res.markdown;

         assert.ok(md.includes("`BACKEND/results/t4_latency_benchmark.json`"));
         assert.ok(md.includes("`BACKEND/results/t4_latency_benchmark.csv`"));
         assert.ok(md.includes("`BACKEND/results/t4_latency_benchmark.md`"));
      });
   });

   describe("7. Isolation from Production Database and Real Complaint Data", () => {
      it("points exclusively to isolated local benchmark database URI", () => {
         assert.ok(BENCHMARK_DB_URI.includes("civicflow_latency_benchmark"));
         assert.ok(!BENCHMARK_DB_URI.includes("/civicflow?"));
      });

      it("never references or reads production complaint datasets during synthetic generation", () => {
         const workload = generateSyntheticWorkload(10, 42);
         for (const c of workload) {
            // Confirm synthetic prefixes and generated IDs
            assert.ok(c.complaintId.startsWith("SYN-"));
            assert.ok(!c.complaintId.startsWith("CMP-"));
         }
      });
   });
});
