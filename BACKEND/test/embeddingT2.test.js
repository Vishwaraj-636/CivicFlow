import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import {
   DEFAULT_MODEL_ID,
   DEFAULT_MODEL_DIMENSION,
   normalizeEmbeddingInput,
   computeEmbeddingCacheKey,
   computeVectorCosine,
   loadEmbeddingCache,
   saveEmbeddingCache,
   getEmbeddingCacheStats,
   resetEmbeddingCache,
   getOrComputeEmbedding,
   computeEmbeddingCosine,
} from "../src/hisc/embeddingProvider.js";
import { scorePair } from "../src/hisc/scorePair.js";
import { loadConfig } from "../src/hisc/config.js";
import {
   runT2EmbeddingEvaluation,
   precomputePairEmbeddings,
   T2_RESULTS_PATHS,
} from "../src/evaluation/embeddingEvaluationRunner.js";
import {
   tuneMethodThresholds,
   validateTuningPartition,
} from "../src/evaluation/hiscEvaluationHarness.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CIVICFLOW Phase T2 — Local Embedding Variants & Verification", () => {
   describe("1. Vector Cosine Similarity & Robustness", () => {
      it("computes exact cosine similarity for identical and orthogonal unit vectors", () => {
         const vecA = [1, 0, 0];
         const vecB = [1, 0, 0];
         assert.equal(computeVectorCosine(vecA, vecB), 1.0);

         const vecOrth = [0, 1, 0];
         assert.equal(computeVectorCosine(vecA, vecOrth), 0.0);

         const vecScaled = [2, 0, 0];
         assert.equal(computeVectorCosine(vecA, vecScaled), 1.0);
      });

      it("handles zero vectors and opposite vectors safely without NaN", () => {
         const zeroVec = [0, 0, 0];
         const normVec = [1, 2, 3];
         assert.equal(computeVectorCosine(zeroVec, normVec), 0);
         assert.equal(computeVectorCosine(zeroVec, zeroVec), 0);

         const oppositeVec = [-1, 0, 0];
         // Clamped to 0 for affinity scoring
         assert.equal(computeVectorCosine([1, 0, 0], oppositeVec), 0);
      });

      it("returns null for mismatched lengths, empty vectors, or non-finite numbers", () => {
         assert.equal(computeVectorCosine(null, [1, 2]), null);
         assert.equal(computeVectorCosine([1], null), null);
         assert.equal(computeVectorCosine([], []), null);
         assert.equal(computeVectorCosine([1, 2], [1, 2, 3]), null);
         assert.equal(computeVectorCosine([1, NaN], [1, 2]), null);
         assert.equal(computeVectorCosine([1, Infinity], [1, 2]), null);
      });
   });

   describe("2. Text Normalization and Cache Key Stability", () => {
      it("normalizes complaint text deterministically and handles empty text", () => {
         assert.equal(normalizeEmbeddingInput("  Pothole on Main Road!!  "), "pothole on main road");
         assert.equal(normalizeEmbeddingInput(""), "");
         assert.equal(normalizeEmbeddingInput(null), "");
         assert.equal(normalizeEmbeddingInput(12345), "");
      });

      it("generates stable, model-scoped cache keys", () => {
         const key1 = computeEmbeddingCacheKey("pothole", "Xenova/all-MiniLM-L6-v2");
         const key2 = computeEmbeddingCacheKey("pothole", "Xenova/all-MiniLM-L6-v2");
         const keyDiffModel = computeEmbeddingCacheKey("pothole", "Xenova/bge-small-en-v1.5");

         assert.equal(key1, key2);
         assert.notEqual(key1, keyDiffModel);
         assert.equal(key1.length, 64);
      });
   });

   describe("3. Cache Persistence, Hit/Miss Stats, and Safe Writes", () => {
      it("records cache hits and misses properly", async () => {
         resetEmbeddingCache(true);
         const initialStats = getEmbeddingCacheStats();
         assert.equal(initialStats.hits, 0);
         assert.equal(initialStats.misses, 0);

         const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-t2-cache-"));
         const tempCacheFile = path.join(tempDir, "test-embeddings.json");

         try {
            const mockVec = new Array(DEFAULT_MODEL_DIMENSION).fill(0.1);
            const mockPipeline = async () => ({ data: new Float32Array(mockVec) });

            // 1st call: miss
            const v1 = await getOrComputeEmbedding("water pipe burst", {
               mockPipeline,
               cachePath: tempCacheFile,
            });
            assert.ok(v1);
            const statsAfterMiss = getEmbeddingCacheStats();
            assert.equal(statsAfterMiss.misses, 1);
            assert.equal(statsAfterMiss.hits, 0);

            // 2nd call: hit
            const v2 = await getOrComputeEmbedding("water pipe burst", {
               mockPipeline,
               cachePath: tempCacheFile,
            });
            assert.deepEqual(v1, v2);
            const statsAfterHit = getEmbeddingCacheStats();
            assert.equal(statsAfterHit.hits, 1);
         } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
         }
      });

      it("safely handles corrupted cache files without crashing", () => {
         const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-t2-corrupt-"));
         const tempFile = path.join(tempDir, "corrupted.json");
         try {
            fs.writeFileSync(tempFile, "{ broken json content", "utf8");
            const loaded = loadEmbeddingCache(tempFile);
            assert.equal(loaded, false);
         } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
         }
      });
   });

   describe("4. Provider Selection & Fallback Behavior", () => {
      it("preserves 'none' provider by default in loadConfig", () => {
         const config = loadConfig();
         assert.equal(config.embeddingProvider, "none");
         assert.equal(config.semanticMode, "synonym");
      });

      it("HISC-embed replaces semantic affinity with embedding cosine when provided", () => {
         const compA = { title: "Pothole on Main Road", category: "Roads & Transport", location: { coordinates: [80.1, 13.1] } };
         const compB = { title: "Road defect nearby", category: "Roads & Transport", location: { coordinates: [80.1, 13.1] } };

         const resultEmbed = scorePair(compA, compB, {
            semanticMode: "embedding",
            embeddingCosine: 0.85,
         });

         assert.equal(resultEmbed.features.semantic, 0.85);
         assert.equal(resultEmbed.usedFallback, false);
      });

      it("falls back to dictionary semantics when embeddingCosine is missing", () => {
         const compA = { title: "water leak from pipeline", category: "Water & Utilities", location: { coordinates: [80.1, 13.1] } };
         const compB = { title: "broken pipe water leakage", category: "Water & Utilities", location: { coordinates: [80.1, 13.1] } };

         const resultDict = scorePair(compA, compB);
         const resultFallback = scorePair(compA, compB, {
            semanticMode: "embedding",
            embeddingCosine: null,
         });

         assert.equal(resultFallback.features.semantic, resultDict.features.semantic);
         assert.equal(resultFallback.usedFallback, true);
      });

      it("evaluates hybrid mean and hybrid maximum formulas accurately", () => {
         const compA = { title: "pothole road defect", category: "Roads & Transport", location: { coordinates: [80.1, 13.1] } };
         const compB = { title: "pothole damaged road", category: "Roads & Transport", location: { coordinates: [80.1, 13.1] } };

         const dictResult = scorePair(compA, compB);
         const sDict = dictResult.features.semantic;
         const sEmbed = 0.80;

         const meanResult = scorePair(compA, compB, {
            semanticMode: "hybrid_mean",
            embeddingCosine: sEmbed,
         });
         const expectedMean = Math.min(1, Math.max(0, 0.5 * sDict + 0.5 * sEmbed));
         assert.ok(Math.abs(meanResult.features.semantic - expectedMean) < 1e-6);

         const maxResult = scorePair(compA, compB, {
            semanticMode: "hybrid_max",
            embeddingCosine: sEmbed,
         });
         const expectedMax = Math.max(sDict, sEmbed);
         assert.ok(Math.abs(maxResult.features.semantic - expectedMax) < 1e-6);
      });
   });

   describe("5. Validation-Only Protocol & Deterministic Tie-Breaking", () => {
      it("prevents test or challenge set leakage into threshold tuning", () => {
         const fakePairs = [{ pair_id: "test_1", isTest: true, label: "duplicate" }];
         assert.throws(() => validateTuningPartition(fakePairs), /Data leakage violation/);

         const challengePairs = [{ pair_id: "c_1", challenge_category: "negation", label: "independent" }];
         assert.throws(() => validateTuningPartition(challengePairs), /Data leakage violation/);
      });
   });

   describe("6. Complete T2 Artifact Generation & Schema Verification", () => {
      it("executes T2 evaluation pipeline and verifies generated artifacts exist and conform to schema", () => {
         assert.ok(fs.existsSync(T2_RESULTS_PATHS.comparisonJson), "T2 JSON artifact must exist");
         assert.ok(fs.existsSync(T2_RESULTS_PATHS.comparisonMd), "T2 Markdown artifact must exist");

         const data = JSON.parse(fs.readFileSync(T2_RESULTS_PATHS.comparisonJson, "utf8"));
         assert.equal(data.metadata.evaluation_phase, "T2 — Local Embedding-Based Methods");
         assert.equal(data.metadata.model_id, "Xenova/all-MiniLM-L6-v2");
         assert.equal(data.metadata.model_dimension, 384);
         assert.equal(data.metadata.seed, 42);
         assert.equal(data.metadata.partition_sizes.val, 80);
         assert.equal(data.metadata.evaluation_sequencing_protocol.held_out_status, "TEST and CHALLENGE partitions withheld and unevaluated during T2.");

         assert.ok(data.methods.B6_embedding);
         assert.ok(data.methods.HISC_embed);
         assert.ok(data.methods.HISC_hybrid_mean);
         assert.ok(data.methods.HISC_hybrid_max);

         assert.ok(data.methods.B6_embedding.validation_metrics.macro_f1 > 0.85);
         assert.equal(data.methods.HISC_embed.validation_metrics.macro_f1, 1.0);
         assert.equal(data.methods.HISC_hybrid_max.validation_metrics.macro_f1, 1.0);
         assert.equal(data.hybrid_selection.preferred_candidate, "HISC_hybrid_max");
      });

      it("preserves untouched T1 validation artifacts", () => {
         assert.ok(fs.existsSync(T2_RESULTS_PATHS.t1ComparisonJson));
         const t1Data = JSON.parse(fs.readFileSync(T2_RESULTS_PATHS.t1ComparisonJson, "utf8"));
         assert.equal(t1Data.metadata.evaluation_phase, "T1 — Fair Baselines and Validation Tuning");
         assert.equal(Object.keys(t1Data.methods).length, 6);
      });
   });
});
