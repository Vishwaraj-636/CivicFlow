import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { normalizeCivicText } from "./scorePair.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const DEFAULT_MODEL_DIMENSION = 384;
export const DEFAULT_CACHE_PATH = path.resolve(__dirname, "../../data/embeddings.json");

let cachedPipeline = null;
let lastProviderError = null;

// In-memory cache store and metrics
let memoryCache = new Map();
let cacheMetadata = {
   model: DEFAULT_MODEL_ID,
   quantized: true,
   dimension: DEFAULT_MODEL_DIMENSION,
   normalization: "normalizeCivicText",
   version: "1.0.0",
};

let cacheMetrics = {
   hits: 0,
   misses: 0,
};

/**
 * Normalizes complaint text deterministically using civic normalization rules.
 * @param {string} text
 * @returns {string}
 */
export function normalizeEmbeddingInput(text) {
   if (typeof text !== "string") return "";
   return normalizeCivicText(text).trim();
}

/**
 * Generates deterministic cache key for normalized text under specified model.
 * @param {string} normText
 * @param {string} [modelId=DEFAULT_MODEL_ID]
 * @returns {string}
 */
export function computeEmbeddingCacheKey(normText, modelId = DEFAULT_MODEL_ID) {
   return crypto.createHash("sha256").update(`${modelId}:${normText}`).digest("hex");
}

/**
 * Computes cosine similarity between two numerical embedding vectors.
 * Formula: dot(a, b) / (||a||_2 * ||b||_2)
 * Handles empty, mismatched, zero-norm, or non-finite vectors safely.
 *
 * @param {Array<number>|Float32Array} vecA
 * @param {Array<number>|Float32Array} vecB
 * @returns {number|null} Similarity in [0, 1] or null if invalid vectors provided.
 */
export function computeVectorCosine(vecA, vecB) {
   if (!vecA || !vecB) return null;
   const lenA = vecA.length;
   const lenB = vecB.length;
   if (lenA === 0 || lenB === 0 || lenA !== lenB) return null;

   let dot = 0;
   let normASq = 0;
   let normBSq = 0;

   for (let i = 0; i < lenA; i++) {
      const a = vecA[i];
      const b = vecB[i];
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
         return null;
      }
      dot += a * b;
      normASq += a * a;
      normBSq += b * b;
   }

   if (normASq <= 0 || normBSq <= 0) {
      return 0;
   }

   const denominator = Math.sqrt(normASq) * Math.sqrt(normBSq);
   if (denominator <= 0) return 0;

   const rawCosine = dot / denominator;
   // Clamp to [0, 1] for incident similarity affinity
   return Math.min(1, Math.max(0, rawCosine));
}

/**
 * Loads embedding cache from disk safely with validation against model metadata.
 * @param {string} [cachePath=DEFAULT_CACHE_PATH]
 * @returns {boolean} true if cache was loaded, false otherwise
 */
export function loadEmbeddingCache(cachePath = DEFAULT_CACHE_PATH) {
   if (!fs.existsSync(cachePath)) {
      return false;
   }

   try {
      const content = fs.readFileSync(cachePath, "utf8");
      const data = JSON.parse(content);

      if (!data || typeof data !== "object") {
         return false;
      }

      // Check metadata compatibility
      if (
         data.metadata?.model &&
         (data.metadata.model !== DEFAULT_MODEL_ID || data.metadata.dimension !== DEFAULT_MODEL_DIMENSION)
      ) {
         // Incompatible cache version/model; do not load incompatible vectors
         return false;
      }

      if (data.metadata) {
         cacheMetadata = { ...cacheMetadata, ...data.metadata };
      }

      if (data.embeddings && typeof data.embeddings === "object") {
         for (const [key, vec] of Object.entries(data.embeddings)) {
            if (Array.isArray(vec) && vec.length === DEFAULT_MODEL_DIMENSION) {
               memoryCache.set(key, vec);
            }
         }
         return true;
      }
   } catch {
      return false;
   }
   return false;
}

/**
 * Safely persists memory cache to disk via atomic write.
 * @param {string} [cachePath=DEFAULT_CACHE_PATH]
 */
export function saveEmbeddingCache(cachePath = DEFAULT_CACHE_PATH) {
   try {
      const dir = path.dirname(cachePath);
      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
      }

      const serialized = {
         metadata: {
            ...cacheMetadata,
            updatedAt: new Date().toISOString(),
            count: memoryCache.size,
         },
         embeddings: Object.fromEntries(memoryCache.entries()),
      };

      const tmpPath = `${cachePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(serialized, null, 2), "utf8");
      try {
         fs.renameSync(tmpPath, cachePath);
      } catch {
         // Fallback if atomic rename is blocked by Windows file locks
         fs.copyFileSync(tmpPath, cachePath);
         try {
            fs.unlinkSync(tmpPath);
         } catch {}
      }
      return true;
   } catch {
      return false;
   }
}

/**
 * Returns cache statistics (hits, misses, loaded items).
 */
export function getEmbeddingCacheStats() {
   return {
      hits: cacheMetrics.hits,
      misses: cacheMetrics.misses,
      size: memoryCache.size,
   };
}

/**
 * Clears or resets cache and performance metrics.
 * @param {boolean} [clearVectors=false]
 */
export function resetEmbeddingCache(clearVectors = false) {
   cacheMetrics = { hits: 0, misses: 0 };
   if (clearVectors) {
      memoryCache.clear();
   }
}

/**
 * Returns last error recorded during model loading or inference.
 */
export function getLastProviderError() {
   return lastProviderError;
}

/**
 * Lazily loads in-process transformers pipeline.
 * Caches pipeline instance across calls.
 *
 * @param {object} [options]
 * @returns {Promise<any|null>}
 */
export async function getEmbeddingPipeline(options = {}) {
   if (cachedPipeline) return cachedPipeline;

   const provider = options.provider ?? process.env.EMBEDDING_PROVIDER ?? "none";
   if (provider !== "local" && !options.forceLoad) {
      return null;
   }

   try {
      const { pipeline } = await import("@huggingface/transformers");
      cachedPipeline = await pipeline("feature-extraction", DEFAULT_MODEL_ID, {
         quantized: options.quantized ?? true,
      });
      lastProviderError = null;
      return cachedPipeline;
   } catch (err) {
      lastProviderError = `Failed to load embedding pipeline: ${err?.message || err}`;
      return null;
   }
}

/**
 * Generates an embedding vector for given text.
 * Checks memory cache -> disk cache -> local model pipeline.
 *
 * @param {string} text
 * @param {object} [options]
 * @returns {Promise<Array<number>|null>}
 */
export async function getOrComputeEmbedding(text, options = {}) {
   const normText = normalizeEmbeddingInput(text);
   if (!normText) return null;

   const modelId = options.modelId ?? DEFAULT_MODEL_ID;
   const cacheKey = computeEmbeddingCacheKey(normText, modelId);

   // 1. Check in-memory cache
   if (memoryCache.has(cacheKey)) {
      cacheMetrics.hits++;
      return memoryCache.get(cacheKey);
   }

   // 2. Check disk cache if memory didn't have it
   const cachePath = options.cachePath ?? DEFAULT_CACHE_PATH;
   if (memoryCache.size === 0) {
      loadEmbeddingCache(cachePath);
      if (memoryCache.has(cacheKey)) {
         cacheMetrics.hits++;
         return memoryCache.get(cacheKey);
      }
   }

   // 3. Inference via local pipeline or supplied mock
   const mockPipeline = options.mockPipeline ?? null;
   let pipe = mockPipeline;
   if (!pipe) {
      pipe = await getEmbeddingPipeline(options);
   }

   if (!pipe) {
      cacheMetrics.misses++;
      return null;
   }

   try {
      const output = await pipe(normText, {
         pooling: "mean",
         normalize: true,
      });

      const rawData = output?.data;
      if (!rawData || rawData.length !== DEFAULT_MODEL_DIMENSION) {
         cacheMetrics.misses++;
         return null;
      }

      const vector = Array.from(rawData);
      for (const val of vector) {
         if (!Number.isFinite(val)) {
            cacheMetrics.misses++;
            return null;
         }
      }

      // Store in memory and optionally persist
      memoryCache.set(cacheKey, vector);
      cacheMetrics.misses++;

      if (options.persist !== false) {
         saveEmbeddingCache(cachePath);
      }

      return vector;
   } catch (err) {
      lastProviderError = `Embedding inference error: ${err?.message || err}`;
      cacheMetrics.misses++;
      return null;
   }
}

/**
 * Manually injects vector into memory cache (useful for offline testing / fixtures).
 * @param {string} text
 * @param {Array<number>} vector
 * @param {string} [modelId=DEFAULT_MODEL_ID]
 */
export function injectEmbeddingFixture(text, vector, modelId = DEFAULT_MODEL_ID) {
   const norm = normalizeEmbeddingInput(text);
   if (!norm) return;
   const key = computeEmbeddingCacheKey(norm, modelId);
   memoryCache.set(key, vector);
}

/**
 * Computes embedding cosine similarity between two texts.
 * Returns null if either embedding is unavailable or cannot be computed.
 *
 * @param {string} textA
 * @param {string} textB
 * @param {object} [options]
 * @returns {Promise<number|null>}
 */
export async function computeEmbeddingCosine(textA, textB, options = {}) {
   const vecA = await getOrComputeEmbedding(textA, options);
   const vecB = await getOrComputeEmbedding(textB, options);

   if (!vecA || !vecB) {
      return null;
   }

   return computeVectorCosine(vecA, vecB);
}

export default {
   DEFAULT_MODEL_ID,
   DEFAULT_MODEL_DIMENSION,
   DEFAULT_CACHE_PATH,
   normalizeEmbeddingInput,
   computeEmbeddingCacheKey,
   computeVectorCosine,
   loadEmbeddingCache,
   saveEmbeddingCache,
   getEmbeddingCacheStats,
   resetEmbeddingCache,
   getLastProviderError,
   getEmbeddingPipeline,
   getOrComputeEmbedding,
   injectEmbeddingFixture,
   computeEmbeddingCosine,
};
