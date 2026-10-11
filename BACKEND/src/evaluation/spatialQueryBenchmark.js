import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import mongoose from "mongoose";

import { createRNG } from "./makeSplits.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ISOLATED_BENCHMARK_DB_URI = process.env.BENCHMARK_DB_URI || "mongodb://127.0.0.1:27017/civicflow_spatial_benchmark_isolated";

export const BENCHMARK_VOLUMES = [1000, 10000, 50000];
export const EARTH_RADIUS_METERS = 6378137; // WGS84 Earth Equatorial Radius

export const CHENNAI_QUERY_CENTROIDS = [
   { name: "T. Nagar Junction", lng: 80.2337, lat: 13.0418 },
   { name: "Anna Nagar Tower", lng: 80.2124, lat: 13.0850 },
   { name: "Adyar Circle", lng: 80.2575, lat: 13.0012 },
   { name: "Guindy Industrial", lng: 80.2117, lat: 13.0067 },
   { name: "Chennai Central", lng: 80.2757, lat: 13.0827 },
];

export const CIVIC_CATEGORIES = [
   "Roads & Transport",
   "Water & Utilities",
   "Drainage & Flooding",
   "Waste & Cleanliness",
   "Street Infrastructure",
];

/**
 * Computes percentile from an array of numeric values
 * @param {number[]} values
 * @param {number} p (0 to 100)
 * @returns {number}
 */
export function calculatePercentile(values, p) {
   if (!values || values.length === 0) return 0;
   const sorted = [...values].sort((a, b) => a - b);
   const index = (p / 100) * (sorted.length - 1);
   const lower = Math.floor(index);
   const upper = Math.ceil(index);
   const weight = index - lower;
   if (lower === upper) return Number(sorted[lower].toFixed(3));
   return Number((sorted[lower] * (1 - weight) + sorted[upper] * weight).toFixed(3));
}

/**
 * Generates synthetic complaint documents clustered around Chennai coordinates.
 * @param {number} count
 * @param {number} [seed=42]
 * @returns {Array<object>}
 */
export function generateSyntheticLocations(count, seed = 42, baseTime = 1760000000000) {
   const rng = createRNG(seed);
   const docs = [];

   for (let i = 0; i < count; i++) {
      // Pick a base cluster center
      const cluster = CHENNAI_QUERY_CENTROIDS[Math.floor(rng() * CHENNAI_QUERY_CENTROIDS.length)];
      // Dispersion: gaussian-like via Box-Muller
      const u1 = Math.max(1e-6, rng());
      const u2 = rng();
      const radiusMeters = Math.sqrt(-2 * Math.log(u1)) * 1200; // std dev ~1.2km
      const angle = 2 * Math.PI * u2;

      const deltaLng = (radiusMeters * Math.cos(angle)) / (111320 * Math.cos((cluster.lat * Math.PI) / 180));
      const deltaLat = (radiusMeters * Math.sin(angle)) / 110540;

      const lng = Number((cluster.lng + deltaLng).toFixed(6));
      const lat = Number((cluster.lat + deltaLat).toFixed(6));

      docs.push({
         ticketId: `BENCH-${String(i + 1).padStart(6, "0")}`,
         category: CIVIC_CATEGORIES[Math.floor(rng() * CIVIC_CATEGORIES.length)],
         location: {
            type: "Point",
            coordinates: [lng, lat],
         },
         status: "open",
         createdAt: new Date(baseTime - Math.floor(rng() * 30 * 86400000)),
      });
   }

   return docs;
}

/**
 * Executes spatial query benchmark across all 3 document scales.
 *
 * @param {object} [options]
 * @param {string} [options.dbUri]
 * @param {number[]} [options.volumes]
 * @param {number} [options.repetitions=25]
 * @param {number} [options.warmup=5]
 * @returns {Promise<object>}
 */
export async function runSpatialQueryBenchmark(options = {}) {
   const dbUri = options.dbUri ?? ISOLATED_BENCHMARK_DB_URI;
   const volumes = options.volumes ?? BENCHMARK_VOLUMES;
   const repetitions = options.repetitions ?? 25;
   const warmupCount = options.warmup ?? 5;
   const radiusMeters = 1000;
   const radiusRadians = radiusMeters / EARTH_RADIUS_METERS;

   // 1. Enforce strict database safety
   if (!dbUri.includes("benchmark") && !dbUri.includes("isolated") && !dbUri.includes("test")) {
      throw new Error(`[SAFETY GATE] Database URI must contain 'benchmark', 'isolated', or 'test'. Got: ${dbUri}`);
   }

   console.log(`[Task F] Connecting to isolated benchmark database: ${dbUri}`);
   await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });
   const db = mongoose.connection.db;

   const admin = db.admin();
   const buildInfo = await admin.buildInfo();
   const mongoVersion = buildInfo.version;
   const nodeVersion = process.version;

   const benchmarkResults = {
      timestamp: new Date().toISOString(),
      environment: {
         databaseUri: dbUri,
         mongoVersion,
         mongooseVersion: mongoose.version,
         nodeVersion,
         platform: process.platform,
         arch: process.arch,
         randomSeed: 42,
      },
      querySpecification: {
         radiusMeters,
         radiusRadians: Number(radiusRadians.toFixed(8)),
         centroidsCount: CHENNAI_QUERY_CENTROIDS.length,
         repetitionsPerCase: repetitions,
         warmupCount,
         queryShapes: {
            geoWithin: "location: { $geoWithin: { $centerSphere: [[lng, lat], radiusRadians] } }",
            near: "location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radiusMeters } }",
         },
         semanticComparisonNotice: "$geoWithin returns all points within spherical radius in arbitrary order. $near returns points sorted by distance from center. Both are evaluated at identical 1,000m radial thresholds.",
      },
      volumeExperiments: [],
   };

   const collName = "synthetic_spatial_benchmark";
   const collection = db.collection(collName);

   for (const volume of volumes) {
      console.log(`\n[Task F] Starting benchmark for volume: N = ${volume.toLocaleString()} documents...`);
      await collection.drop().catch(() => {}); // Clean slate

      // 1. Data Generation & Ingestion
      console.log(`  -> Generating and inserting ${volume} synthetic locations...`);
      const insertStart = performance.now();
      const docs = generateSyntheticLocations(volume, 42);
      // Batch insert in chunks of 5000
      const chunkSize = 5000;
      for (let i = 0; i < docs.length; i += chunkSize) {
         await collection.insertMany(docs.slice(i, i + chunkSize), { ordered: false });
      }
      const insertTimeMs = Number((performance.now() - insertStart).toFixed(2));
      console.log(`  -> Ingestion completed in ${insertTimeMs}ms`);

      // ----------------------------------------------------------------------
      // STRATEGY A: Unindexed $geoWithin (COLLSCAN)
      // ----------------------------------------------------------------------
      console.log(`  -> Benchmarking Strategy A: Unindexed $geoWithin / $centerSphere (COLLSCAN)...`);
      const centerA = [CHENNAI_QUERY_CENTROIDS[0].lng, CHENNAI_QUERY_CENTROIDS[0].lat];
      const qA = { location: { $geoWithin: { $centerSphere: [centerA, radiusRadians] } } };

      const explainUnindexed = await collection.find(qA).explain("executionStats");
      const unindexedStage = explainUnindexed.executionStats?.executionStages?.stage ?? "UNKNOWN";
      const unindexedDocsExamined = explainUnindexed.executionStats?.totalDocsExamined ?? 0;
      const unindexedKeysExamined = explainUnindexed.executionStats?.totalKeysExamined ?? 0;
      const unindexedReturned = explainUnindexed.executionStats?.nReturned ?? 0;

      // Warmup
      for (let w = 0; w < warmupCount; w++) {
         await collection.find(qA).toArray();
      }

      // Latency measurements across centroids
      const unindexedLatencies = [];
      for (let r = 0; r < repetitions; r++) {
         const centroid = CHENNAI_QUERY_CENTROIDS[r % CHENNAI_QUERY_CENTROIDS.length];
         const query = { location: { $geoWithin: { $centerSphere: [[centroid.lng, centroid.lat], radiusRadians] } } };
         const t0 = performance.now();
         await collection.find(query).toArray();
         unindexedLatencies.push(performance.now() - t0);
      }

      // ----------------------------------------------------------------------
      // INDEX SETUP: Build 2dsphere index
      // ----------------------------------------------------------------------
      console.log(`  -> Building 2dsphere spatial index on 'location'...`);
      const indexStart = performance.now();
      await collection.createIndex({ location: "2dsphere" });
      const indexBuildTimeMs = Number((performance.now() - indexStart).toFixed(2));
      console.log(`  -> 2dsphere index built in ${indexBuildTimeMs}ms`);

      // ----------------------------------------------------------------------
      // STRATEGY B: Indexed $geoWithin (2dsphere IXSCAN / FETCH)
      // ----------------------------------------------------------------------
      console.log(`  -> Benchmarking Strategy B: Indexed $geoWithin / $centerSphere (2dsphere)...`);
      const explainIndexed = await collection.find(qA).explain("executionStats");
      const indexedStage = explainIndexed.executionStats?.executionStages?.stage ?? "UNKNOWN";
      const indexedDocsExamined = explainIndexed.executionStats?.totalDocsExamined ?? 0;
      const indexedKeysExamined = explainIndexed.executionStats?.totalKeysExamined ?? 0;
      const indexedReturned = explainIndexed.executionStats?.nReturned ?? 0;

      // Warmup
      for (let w = 0; w < warmupCount; w++) {
         await collection.find(qA).toArray();
      }

      const indexedLatencies = [];
      for (let r = 0; r < repetitions; r++) {
         const centroid = CHENNAI_QUERY_CENTROIDS[r % CHENNAI_QUERY_CENTROIDS.length];
         const query = { location: { $geoWithin: { $centerSphere: [[centroid.lng, centroid.lat], radiusRadians] } } };
         const t0 = performance.now();
         await collection.find(query).toArray();
         indexedLatencies.push(performance.now() - t0);
      }

      // ----------------------------------------------------------------------
      // STRATEGY C: Existing Indexed $near Query (GEO_NEAR_2DSPHERE)
      // ----------------------------------------------------------------------
      console.log(`  -> Benchmarking Strategy C: Indexed $near Query (existing production pattern)...`);
      const qNear = {
         location: {
            $near: {
               $geometry: { type: "Point", coordinates: centerA },
               $maxDistance: radiusMeters,
            },
         },
      };

      const explainNear = await collection.find(qNear).explain("executionStats");
      const nearStage = explainNear.executionStats?.executionStages?.stage ?? "UNKNOWN";
      const nearDocsExamined = explainNear.executionStats?.totalDocsExamined ?? 0;
      const nearKeysExamined = explainNear.executionStats?.totalKeysExamined ?? 0;
      const nearReturned = explainNear.executionStats?.nReturned ?? 0;

      // Warmup
      for (let w = 0; w < warmupCount; w++) {
         await collection.find(qNear).toArray();
      }

      const nearLatencies = [];
      for (let r = 0; r < repetitions; r++) {
         const centroid = CHENNAI_QUERY_CENTROIDS[r % CHENNAI_QUERY_CENTROIDS.length];
         const query = {
            location: {
               $near: {
                  $geometry: { type: "Point", coordinates: [centroid.lng, centroid.lat] },
                  $maxDistance: radiusMeters,
               },
            },
         };
         const t0 = performance.now();
         await collection.find(query).toArray();
         nearLatencies.push(performance.now() - t0);
      }

      // Calculate stats
      const getLatencyStats = (latList) => ({
         p50_ms: calculatePercentile(latList, 50),
         p90_ms: calculatePercentile(latList, 90),
         p95_ms: calculatePercentile(latList, 95),
         p99_ms: calculatePercentile(latList, 99),
         mean_ms: Number((latList.reduce((a, b) => a + b, 0) / latList.length).toFixed(3)),
         min_ms: Number(Math.min(...latList).toFixed(3)),
         max_ms: Number(Math.max(...latList).toFixed(3)),
      });

      const statsUnindexed = getLatencyStats(unindexedLatencies);
      const statsIndexed = getLatencyStats(indexedLatencies);
      const statsNear = getLatencyStats(nearLatencies);

      const speedupVsUnindexed = statsIndexed.p50_ms > 0
         ? Number((statsUnindexed.p50_ms / statsIndexed.p50_ms).toFixed(2))
         : 1.0;

      console.log(`  -> Results for N = ${volume.toLocaleString()}:`);
      console.log(`     Unindexed geoWithin p50: ${statsUnindexed.p50_ms}ms (stage: ${unindexedStage}, docsExamined: ${unindexedDocsExamined})`);
      console.log(`     Indexed geoWithin p50:   ${statsIndexed.p50_ms}ms (stage: ${indexedStage}, docsExamined: ${indexedDocsExamined})`);
      console.log(`     Indexed $near p50:       ${statsNear.p50_ms}ms (stage: ${nearStage}, docsExamined: ${nearDocsExamined})`);
      console.log(`     Spatial Index Speedup:   ${speedupVsUnindexed}x`);

      benchmarkResults.volumeExperiments.push({
         volume,
         setup: {
            insertTimeMs,
            indexBuildTimeMs,
         },
         unindexed_geoWithin: {
            strategy: "Unindexed $geoWithin ($centerSphere)",
            plan: {
               stage: unindexedStage,
               totalDocsExamined: unindexedDocsExamined,
               totalKeysExamined: unindexedKeysExamined,
               nReturned: unindexedReturned,
            },
            latency: statsUnindexed,
         },
         indexed_geoWithin: {
            strategy: "Indexed $geoWithin ($centerSphere + 2dsphere)",
            plan: {
               stage: indexedStage,
               totalDocsExamined: indexedDocsExamined,
               totalKeysExamined: indexedKeysExamined,
               nReturned: indexedReturned,
            },
            latency: statsIndexed,
            speedupRatioVsUnindexed: speedupVsUnindexed,
         },
         indexed_near: {
            strategy: "Indexed $near ($near + 2dsphere, distance-sorted)",
            plan: {
               stage: nearStage,
               totalDocsExamined: nearDocsExamined,
               totalKeysExamined: nearKeysExamined,
               nReturned: nearReturned,
            },
            latency: statsNear,
         },
      });
   }

   // Cleanup isolated benchmark database
   console.log(`[Task F] Dropping benchmark collection and disconnecting...`);
   await collection.drop().catch(() => {});
   await mongoose.disconnect();

   return benchmarkResults;
}

/**
 * Formats benchmark data into Markdown report
 * @param {object} data
 * @returns {string}
 */
export function formatSpatialBenchmarkMarkdown(data) {
   let md = `# CivicFlow Research Evaluation — Task F: Spatial Query Latency Benchmark Report

**Benchmark Timestamp:** ${data.timestamp}
**Database Engine:** MongoDB \`${data.environment.mongoVersion}\` (Mongoose \`${data.environment.mongooseVersion}\`)
**Runtime:** Node.js \`${data.environment.nodeVersion}\` on \`${data.environment.platform} ${data.environment.arch}\`
**Database Target:** Isolated benchmark database (\`${data.environment.databaseUri}\`)

---

## 1. Executive Summary and Comparative Findings

This benchmark evaluates the latency, query execution plans, and document scanning overhead of three distinct spatial query strategies across synthetic complaint volumes of **1,000**, **10,000**, and **50,000** documents:

1. **Strategy A (Unindexed \`$geoWithin\` / \`$centerSphere\`):**
   Full collection scan (\`COLLSCAN\`) scanning every document in the collection to test spherical geometric containment.
2. **Strategy B (Indexed \`$geoWithin\` / \`$centerSphere\` with \`2dsphere\` index):**
   Index scan (\`IXSCAN\` / \`FETCH\`) utilizing spherical geospatial index keys.
3. **Strategy C (Indexed \`$near\` with \`2dsphere\` index):**
   The existing production query pattern (\`GEO_NEAR_2DSPHERE\`), which additionally sorts returned documents by spatial proximity.

### Summary Comparison Table:

| Scale ($N$) | Unindexed Stage | Unindexed p50 / p95 (ms) | Docs Examined | Indexed \`$geoWithin\` p50 / p95 (ms) | Docs Examined | Speedup Ratio | Indexed \`$near\` p50 / p95 (ms) | Docs Examined |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
`;

   for (const exp of data.volumeExperiments) {
      const u = exp.unindexed_geoWithin;
      const i = exp.indexed_geoWithin;
      const n = exp.indexed_near;

      md += `| **${exp.volume.toLocaleString()}** | \`${u.plan.stage}\` | ${u.latency.p50_ms} / ${u.latency.p95_ms} ms | ${u.plan.totalDocsExamined.toLocaleString()} | **${i.latency.p50_ms} / ${i.latency.p95_ms} ms** | ${i.plan.totalDocsExamined} | **${i.speedupRatioVsUnindexed}x** | ${n.latency.p50_ms} / ${n.latency.p95_ms} ms | ${n.plan.totalDocsExamined} |\n`;
   }

   md += `
---

## 2. Ingestion and Index Setup Overhead

| Dataset Scale ($N$) | Sequential Ingestion Time (ms) | \`2dsphere\` Index Build Time (ms) | Total Setup Duration (s) |
|:---:|:---:|:---:|:---:|
`;

   for (const exp of data.volumeExperiments) {
      const totalSec = ((exp.setup.insertTimeMs + exp.setup.indexBuildTimeMs) / 1000).toFixed(2);
      md += `| **${exp.volume.toLocaleString()}** | ${exp.setup.insertTimeMs.toLocaleString()} ms | ${exp.setup.indexBuildTimeMs.toLocaleString()} ms | **${totalSec} s** |\n`;
   }

   md += `
---

## 3. Detailed Execution Plan Analysis (\`explain("executionStats")\`)

`;

   for (const exp of data.volumeExperiments) {
      const u = exp.unindexed_geoWithin;
      const i = exp.indexed_geoWithin;
      const n = exp.indexed_near;

      md += `### Workload: $N = ${exp.volume.toLocaleString()}$ Documents\n\n`;
      md += `- **Unindexed \`$geoWithin\`:**\n`;
      md += `  - Plan Stage: \`${u.plan.stage}\` (Collection Scan)\n`;
      md += `  - Total Documents Examined: **${u.plan.totalDocsExamined.toLocaleString()}** (100% of collection)\n`;
      md += `  - Documents Returned: **${u.plan.nReturned}**\n`;
      md += `  - Latency: p50 = \`${u.latency.p50_ms}ms\`, p95 = \`${u.latency.p95_ms}ms\`, max = \`${u.latency.max_ms}ms\`\n`;
      md += `- **Indexed \`$geoWithin\` (2dsphere):**\n`;
      md += `  - Plan Stage: \`${i.plan.stage}\` (\`IXSCAN\` + \`FETCH\`)\n`;
      md += `  - Keys Examined: **${i.plan.totalKeysExamined}** | Documents Examined: **${i.plan.totalDocsExamined}**\n`;
      md += `  - Documents Returned: **${i.plan.nReturned}**\n`;
      md += `  - Latency: p50 = \`${i.latency.p50_ms}ms\`, p95 = \`${i.latency.p95_ms}ms\`, max = \`${i.latency.max_ms}ms\`\n`;
      md += `  - Acceleration vs. Scan: **${i.speedupRatioVsUnindexed}x speedup**\n`;
      md += `- **Indexed \`$near\` (2dsphere):**\n`;
      md += `  - Plan Stage: \`${n.plan.stage}\` (Distance-Sorted Geospatial Scan)\n`;
      md += `  - Documents Examined: **${n.plan.totalDocsExamined}** | Documents Returned: **${n.plan.nReturned}**\n`;
      md += `  - Latency: p50 = \`${n.latency.p50_ms}ms\`, p95 = \`${n.latency.p95_ms}ms\`, max = \`${n.latency.max_ms}ms\`\n\n`;
   }

   md += `---

## 4. Methodological Rigor and Semantic Differences

1. **Equivalent Radial Semantics:**
   - Both \`$geoWithin\` (with \`$centerSphere\`) and \`$near\` were configured with identical 1,000-meter query radii ($r = 1000\\text{m}$, $\\text{radians} = 1000 / 6378137 \\approx 0.0001568$).
2. **Sorting Overhead in \`$near\`:**
   - \`$near\` inherently sorts matching documents by distance in ascending order. In contrast, \`$geoWithin\` returns unsorted documents. Consequently, for large candidate sets, \`$near\` includes spatial sorting overhead inside the MongoDB query engine.
3. **No Artificial Limit Gating on Collection Scan:**
   - In accordance with audit standards, no query limits (\`.limit()\`) were used to truncate unindexed collection scans. The unindexed query was required to evaluate containment across all $N$ documents to fairly measure full geometric scan cost.
4. **Zero Production Mutation:**
   - All tests were executed in an isolated benchmark database (\`${data.environment.databaseUri}\`). Production queries and defaults in \`incidentIntelligence.service.js\` remain unmodified.
`;

   return md;
}

// CLI Execution entrypoint
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   const resultsDir = path.resolve(__dirname, "../../results");
   runSpatialQueryBenchmark()
      .then((data) => {
         const jsonPath = path.join(resultsDir, "spatial_query_benchmark.json");
         const mdPath = path.join(resultsDir, "spatial_query_benchmark.md");
         fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
         fs.writeFileSync(mdPath, formatSpatialBenchmarkMarkdown(data), "utf8");
         console.log(`[Task F] Spatial query benchmark completed successfully!`);
         console.log(`- ${jsonPath}`);
         console.log(`- ${mdPath}`);
         process.exit(0);
      })
      .catch((err) => {
         console.error(`[Task F] Benchmark error:`, err);
         process.exit(1);
      });
}
