import fs from "node:fs";
import path from "node:path";

export const DEFAULT_HISC_CONFIG = {
   radiusInMeters: 1000,
   temporalWindowHours: 720, // 24 * 30 hours
   duplicateThreshold: 0.60,
   relatedThreshold: 0.35,
   weights: {
      category: 0.20,
      geographic: 0.25,
      lexical: 0.10,
      semantic: 0.30,
      temporal: 0.15,
   },
   enabledFeatures: {},
   semanticMode: "synonym",
   embeddingProvider: "none",
};

/**
 * HISC-eval Configuration Preset
 *
 * Explicit preset representing the exact parameter configuration used during the
 * completed final evaluation freeze (T1 validation grid search, T3 error analysis,
 * T5 baseline comparison, and final held-out test/challenge freeze).
 *
 * KEY DISTINCTION FROM DEPLOYED PRODUCTION DEFAULTS (DEFAULT_HISC_CONFIG):
 * - Deployed Default: relatedThreshold = 0.35 (conservative boundary preventing false-positive clustering)
 * - Evaluation Preset: relatedThreshold = 0.10 (threshold selected via validation grid search to maximize Macro F1)
 *
 * PRODUCTION SAFETY NOTICE:
 * This preset is strictly separated from production defaults. Live services load
 * DEFAULT_HISC_CONFIG (relatedThreshold: 0.35) and will NEVER load HISC_EVAL_PRESET
 * unless explicitly requested by name via loadConfig("HISC-eval") or loadConfig({ preset: "HISC-eval" }).
 */
export const HISC_EVAL_PRESET = Object.freeze({
   presetName: "HISC-eval",
   radiusInMeters: 1000,
   temporalWindowHours: 720,
   duplicateThreshold: 0.60,
   relatedThreshold: 0.10,
   weights: Object.freeze({
      category: 0.20,
      geographic: 0.25,
      lexical: 0.10,
      semantic: 0.30,
      temporal: 0.15,
   }),
   enabledFeatures: Object.freeze({}),
   semanticMode: "synonym",
   embeddingProvider: "none",
});

export const HISC_PRESETS = Object.freeze({
   "production-default": DEFAULT_HISC_CONFIG,
   "HISC-eval": HISC_EVAL_PRESET,
});

/**
 * Returns the name of the active preset based on resolved threshold configuration.
 * @param {object} [config]
 * @returns {"production-default"|"HISC-eval"|"custom"}
 */
export const getActivePresetName = (config = null) => {
   const resolved = config ?? loadConfig();
   const dup = resolved.duplicateThreshold;
   const rel = resolved.relatedThreshold;

   if (dup === DEFAULT_HISC_CONFIG.duplicateThreshold && rel === DEFAULT_HISC_CONFIG.relatedThreshold) {
      return "production-default";
   }
   if (dup === HISC_EVAL_PRESET.duplicateThreshold && rel === HISC_EVAL_PRESET.relatedThreshold) {
      return "HISC-eval";
   }
   return "custom";
};

/**
 * Searches for BACKEND/config/hisc.weights.json if it exists.
 * @returns {object|null}
 */
const findFileConfig = () => {
   const candidates = [
      path.resolve(process.cwd(), "config", "hisc.weights.json"),
      path.resolve(process.cwd(), "BACKEND", "config", "hisc.weights.json"),
      path.resolve(import.meta.dirname, "../../config/hisc.weights.json"),
      path.resolve(import.meta.dirname, "../../../config/hisc.weights.json"),
   ];

   for (const targetPath of candidates) {
      if (fs.existsSync(targetPath)) {
         try {
            const content = fs.readFileSync(targetPath, "utf8");
            return JSON.parse(content);
         } catch {
            return null;
         }
      }
   }
   return null;
};

/**
 * Safely resolves and validates HISC configuration with fallback to production defaults.
 * Prevents NaN propagation from undefined or invalid numeric options.
 *
 * @param {string|object} [customConfig={}] - Optional custom config object or named preset string ("HISC-eval", "production-default")
 * @returns {typeof DEFAULT_HISC_CONFIG & { radiusMeters: number, windowHours: number, thresholds: { duplicate: number, related: number }, presetName: string }}
 */
export const loadConfig = (customConfig = {}) => {
   const isPresetString = typeof customConfig === "string";
   const presetName = isPresetString
      ? customConfig
      : (typeof customConfig === "object" ? customConfig?.preset : null);
   const presetObj = presetName && HISC_PRESETS[presetName] ? HISC_PRESETS[presetName] : {};

   const fileConfig = findFileConfig() ?? {};
   const userConfig = typeof customConfig === "object" && customConfig !== null ? customConfig : {};

   const config = {
      ...fileConfig,
      ...presetObj,
      ...userConfig,
      weights: {
         ...(fileConfig.weights ?? {}),
         ...(presetObj.weights ?? {}),
         ...(userConfig.weights ?? {}),
      },
      thresholds: {
         ...(fileConfig.thresholds ?? {}),
         ...(presetObj.thresholds ?? {}),
         ...(userConfig.thresholds ?? {}),
      },
   };

   const rawRadius = config.radiusMeters ?? config.radiusInMeters ?? fileConfig.radiusInMeters ?? presetObj.radiusInMeters ?? DEFAULT_HISC_CONFIG.radiusInMeters;
   const radiusInMeters = (typeof rawRadius === "number" && rawRadius > 0 && Number.isFinite(rawRadius))
      ? rawRadius
      : DEFAULT_HISC_CONFIG.radiusInMeters;

   const rawWindow = config.windowHours ?? config.temporalWindowHours ?? fileConfig.temporalWindowHours ?? presetObj.temporalWindowHours ?? DEFAULT_HISC_CONFIG.temporalWindowHours;
   const temporalWindowHours = (typeof rawWindow === "number" && rawWindow > 0 && Number.isFinite(rawWindow))
      ? rawWindow
      : DEFAULT_HISC_CONFIG.temporalWindowHours;

   const rawDup = config.thresholds?.duplicate ?? config.thresholds?.duplicateThreshold ?? config.duplicateThreshold ?? fileConfig.duplicateThreshold ?? presetObj.duplicateThreshold ?? DEFAULT_HISC_CONFIG.duplicateThreshold;
   const duplicateThreshold = (typeof rawDup === "number" && Number.isFinite(rawDup) && rawDup >= 0 && rawDup <= 1)
      ? rawDup
      : DEFAULT_HISC_CONFIG.duplicateThreshold;

   const rawRel = config.thresholds?.related ?? config.thresholds?.relatedThreshold ?? config.relatedThreshold ?? fileConfig.relatedThreshold ?? presetObj.relatedThreshold ?? DEFAULT_HISC_CONFIG.relatedThreshold;
   const relatedThreshold = (typeof rawRel === "number" && Number.isFinite(rawRel) && rawRel >= 0 && rawRel <= 1)
      ? rawRel
      : DEFAULT_HISC_CONFIG.relatedThreshold;

   const weights = (config?.weights && typeof config.weights === "object")
      ? { ...DEFAULT_HISC_CONFIG.weights, ...fileConfig.weights, ...presetObj.weights, ...userConfig.weights }
      : { ...DEFAULT_HISC_CONFIG.weights, ...fileConfig.weights };

   const enabledFeatures = config.enabledFeatures ?? presetObj.enabledFeatures ?? DEFAULT_HISC_CONFIG.enabledFeatures;
   const semanticMode = config.semanticMode ?? presetObj.semanticMode ?? DEFAULT_HISC_CONFIG.semanticMode;
   const embeddingProvider = config.embeddingProvider ?? process.env.EMBEDDING_PROVIDER ?? presetObj.embeddingProvider ?? DEFAULT_HISC_CONFIG.embeddingProvider ?? "none";

   const resolved = {
      radiusInMeters,
      radiusMeters: radiusInMeters,
      temporalWindowHours,
      windowHours: temporalWindowHours,
      duplicateThreshold,
      relatedThreshold,
      thresholds: {
         duplicate: duplicateThreshold,
         related: relatedThreshold,
      },
      weights,
      enabledFeatures,
      semanticMode,
      embeddingProvider,
   };

   resolved.presetName = getActivePresetName(resolved);
   return resolved;
};

export default {
   DEFAULT_HISC_CONFIG,
   HISC_EVAL_PRESET,
   HISC_PRESETS,
   loadConfig,
   getActivePresetName,
};
