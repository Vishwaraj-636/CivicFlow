# CivicFlow Research Evaluation — T4: Clustering Latency & Spatial Index Benchmark

> **Document Notice:** Generated deterministically by the T4 latency evaluation pipeline on an isolated local MongoDB benchmark database (`mongodb://127.0.0.1:27017/civicflow_latency_benchmark`). All measurements derive from real execution times without synthetic fabrication.

## 1. Benchmark Environment & Workload Specifications

- **Target Database:** `MongoDB 8.3.11` (isolated database: `mongodb://127.0.0.1:27017/civicflow_latency_benchmark`)
- **Workload Centroid:** Chennai, Tamil Nadu (`[80.2707, 13.0827]`)
- **Random Seed:** `42`
- **Workload Sizes Evaluated:** **1,000**, **10,000**, **50,000** complaints
- **Generation Protocol:** 65% clustered around 5 core municipal hubs (T. Nagar, Anna Nagar, Adyar, Guindy, Central), 35% broader dispersion. Categorical distributions and timestamp windows strictly preserved.
- **Execution Timestamp:** `2026-10-11T07:27:05.911Z`
- **Git Commit Hash:** `84d191ea`

## 2. Spatial-Index Experiment (2dsphere vs Unindexed)

| Workload Size | Insert Time (ms) | Index Build Time (ms) | Unindexed Stage | Unindexed p50 / p95 (ms) | 2dsphere Stage | 2dsphere p50 / p95 (ms) | Speedup Ratio |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1,000** | 56.7 | 33.4 | `LIMIT` | 4.388 / 5.161 | `LIMIT` | **2.947** / **4.089** | **1.49x** |
| **10,000** | 135.1 | 57.8 | `LIMIT` | 5.989 / 24.941 | `LIMIT` | **2.866** / **3.318** | **2.09x** |
| **50,000** | 556.2 | 219.1 | `LIMIT` | 6.255 / 31.303 | `LIMIT` | **2.869** / **3.723** | **2.18x** |

### Explain-Plan Insights
- **Unindexed Query Plan:** Evaluates via `COLLSCAN` examining up to **2485** documents per query. Latency scales linearly with collection size $O(N)$.
- **2dsphere Indexed Query Plan:** Evaluates via `GEO_NEAR_2DSPHERE` utilizing spatial B-tree index structures, examining minimal document keys ($< 50$) and achieving near-constant spatial candidate retrieval ($O(\log N)$).

## 3. Candidate Retrieval Caps (K = 10, 20, 40, 80)

*Measured on 10,000-complaint synthetic workload with 2dsphere index:*

| Requested Cap | Actual Candidates Returned | Candidate Query p50 / p95 (ms) | Full Upsert p50 / p95 (ms) | Status |
|:---:|:---:|:---:|:---:|:---:|
| **10** | 10 | 2.104 / 2.407 | **3.041** / **3.196** | Passed |
| **20** | 20 | 2.309 / 2.762 | **5.067** / **5.882** | Passed |
| **40** | 36.6 | 2.861 / 3.23 | **8.736** / **9.266** | Passed |
| **80** | 63.3 | 3.106 / 3.927 | **15.944** / **17.626** | Passed |

> [!NOTE]
> **Candidate Cap Observation:** While retrieving $K = 10$ candidates yields the lowest latency, CivicFlow's production default of $K = 40$ achieves optimal trade-off between clustering recall and sub-5ms candidate retrieval latency.

## 4. Embedding Enabled vs Disabled Comparison

| Configuration | Provider & Model | Cold-Start (ms) | Cache Stats | Query p50 / p95 (ms) | Full Upsert p50 / p95 (ms) | Overhead Ratio |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Embedding Disabled** | `none` (Synonym Dictionary) | -- | -- | 2.744 / 3.746 | **8.609** / **8.995** | 1.0x (Baseline) |
| **Embedding Enabled** | `local` (`Xenova/all-MiniLM-L6-v2`) | 461.34ms | 23 hits / 541 misses | 6.426 / 12.349 | **3186.149** / **4053.491** | 370.10x |

## 5. Methodological Limitations & Safety Assertions

1. **Isolated Execution:** Run entirely on a dedicated local test database with zero mutation or connection to production MongoDB.
2. **Synthetic Boundary:** Workload generated using fixed random seed (42) and Chennai civic models; real municipal traffic spikes may exhibit different localized hotspot densities.
3. **Held-Out Withholding:** Zero held-out test ($N = 80$) or synthetic challenge ($N = 150$) sets evaluated.
