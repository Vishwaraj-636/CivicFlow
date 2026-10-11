# CivicFlow Research Evaluation — Task F: Spatial Query Latency Benchmark Report

**Benchmark Timestamp:** 2026-10-11T10:19:58.611Z
**Database Engine:** MongoDB `8.3.11` (Mongoose `9.9.4`)
**Runtime:** Node.js `v22.16.0` on `win32 x64`
**Database Target:** Isolated benchmark database (`mongodb://127.0.0.1:27017/civicflow_spatial_benchmark_isolated`)

---

## 1. Executive Summary and Comparative Findings

This benchmark evaluates the latency, query execution plans, and document scanning overhead of three distinct spatial query strategies across synthetic complaint volumes of **1,000**, **10,000**, and **50,000** documents:

1. **Strategy A (Unindexed `$geoWithin` / `$centerSphere`):**
   Full collection scan (`COLLSCAN`) scanning every document in the collection to test spherical geometric containment.
2. **Strategy B (Indexed `$geoWithin` / `$centerSphere` with `2dsphere` index):**
   Index scan (`IXSCAN` / `FETCH`) utilizing spherical geospatial index keys.
3. **Strategy C (Indexed `$near` with `2dsphere` index):**
   The existing production query pattern (`GEO_NEAR_2DSPHERE`), which additionally sorts returned documents by spatial proximity.

### Summary Comparison Table:

| Scale ($N$) | Unindexed Stage | Unindexed p50 / p95 (ms) | Docs Examined | Indexed `$geoWithin` p50 / p95 (ms) | Docs Examined | Speedup Ratio | Indexed `$near` p50 / p95 (ms) | Docs Examined |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1,000** | `COLLSCAN` | 2.325 / 3.6 ms | 1,000 | **1.534 / 1.976 ms** | 66 | **1.52x** | 1.572 / 1.957 ms | 66 |
| **10,000** | `COLLSCAN` | 16 / 16.425 ms | 10,000 | **5.606 / 5.999 ms** | 741 | **2.85x** | 7.009 / 8.96 ms | 750 |
| **50,000** | `COLLSCAN` | 75.026 / 86.155 ms | 50,000 | **22.083 / 35.747 ms** | 3650 | **3.4x** | 26.268 / 27.26 ms | 3504 |

---

## 2. Ingestion and Index Setup Overhead

| Dataset Scale ($N$) | Sequential Ingestion Time (ms) | `2dsphere` Index Build Time (ms) | Total Setup Duration (s) |
|:---:|:---:|:---:|:---:|
| **1,000** | 62.82 ms | 37.2 ms | **0.10 s** |
| **10,000** | 128.19 ms | 66.09 ms | **0.19 s** |
| **50,000** | 467.14 ms | 238.14 ms | **0.71 s** |

---

## 3. Detailed Execution Plan Analysis (`explain("executionStats")`)

### Workload: $N = 1,000$ Documents

- **Unindexed `$geoWithin`:**
  - Plan Stage: `COLLSCAN` (Collection Scan)
  - Total Documents Examined: **1,000** (100% of collection)
  - Documents Returned: **53**
  - Latency: p50 = `2.325ms`, p95 = `3.6ms`, max = `3.749ms`
- **Indexed `$geoWithin` (2dsphere):**
  - Plan Stage: `FETCH` (`IXSCAN` + `FETCH`)
  - Keys Examined: **90** | Documents Examined: **66**
  - Documents Returned: **53**
  - Latency: p50 = `1.534ms`, p95 = `1.976ms`, max = `2.347ms`
  - Acceleration vs. Scan: **1.52x speedup**
- **Indexed `$near` (2dsphere):**
  - Plan Stage: `GEO_NEAR_2DSPHERE` (Distance-Sorted Geospatial Scan)
  - Documents Examined: **66** | Documents Returned: **53**
  - Latency: p50 = `1.572ms`, p95 = `1.957ms`, max = `2.404ms`

### Workload: $N = 10,000$ Documents

- **Unindexed `$geoWithin`:**
  - Plan Stage: `COLLSCAN` (Collection Scan)
  - Total Documents Examined: **10,000** (100% of collection)
  - Documents Returned: **594**
  - Latency: p50 = `16ms`, p95 = `16.425ms`, max = `16.767ms`
- **Indexed `$geoWithin` (2dsphere):**
  - Plan Stage: `FETCH` (`IXSCAN` + `FETCH`)
  - Keys Examined: **766** | Documents Examined: **741**
  - Documents Returned: **594**
  - Latency: p50 = `5.606ms`, p95 = `5.999ms`, max = `6.04ms`
  - Acceleration vs. Scan: **2.85x speedup**
- **Indexed `$near` (2dsphere):**
  - Plan Stage: `GEO_NEAR_2DSPHERE` (Distance-Sorted Geospatial Scan)
  - Documents Examined: **750** | Documents Returned: **594**
  - Latency: p50 = `7.009ms`, p95 = `8.96ms`, max = `11.37ms`

### Workload: $N = 50,000$ Documents

- **Unindexed `$geoWithin`:**
  - Plan Stage: `COLLSCAN` (Collection Scan)
  - Total Documents Examined: **50,000** (100% of collection)
  - Documents Returned: **2915**
  - Latency: p50 = `75.026ms`, p95 = `86.155ms`, max = `91.44ms`
- **Indexed `$geoWithin` (2dsphere):**
  - Plan Stage: `FETCH` (`IXSCAN` + `FETCH`)
  - Keys Examined: **3677** | Documents Examined: **3650**
  - Documents Returned: **2915**
  - Latency: p50 = `22.083ms`, p95 = `35.747ms`, max = `42.091ms`
  - Acceleration vs. Scan: **3.4x speedup**
- **Indexed `$near` (2dsphere):**
  - Plan Stage: `GEO_NEAR_2DSPHERE` (Distance-Sorted Geospatial Scan)
  - Documents Examined: **3504** | Documents Returned: **2915**
  - Latency: p50 = `26.268ms`, p95 = `27.26ms`, max = `27.336ms`

---

## 4. Methodological Rigor and Semantic Differences

1. **Equivalent Radial Semantics:**
   - Both `$geoWithin` (with `$centerSphere`) and `$near` were configured with identical 1,000-meter query radii ($r = 1000\text{m}$, $\text{radians} = 1000 / 6378137 \approx 0.0001568$).
2. **Sorting Overhead in `$near`:**
   - `$near` inherently sorts matching documents by distance in ascending order. In contrast, `$geoWithin` returns unsorted documents. Consequently, for large candidate sets, `$near` includes spatial sorting overhead inside the MongoDB query engine.
3. **No Artificial Limit Gating on Collection Scan:**
   - In accordance with audit standards, no query limits (`.limit()`) were used to truncate unindexed collection scans. The unindexed query was required to evaluate containment across all $N$ documents to fairly measure full geometric scan cost.
4. **Zero Production Mutation:**
   - All tests were executed in an isolated benchmark database (`mongodb://127.0.0.1:27017/civicflow_spatial_benchmark_isolated`). Production queries and defaults in `incidentIntelligence.service.js` remain unmodified.
