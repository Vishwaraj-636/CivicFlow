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
 * @param {object} [customConfig={}]
 * @returns {typeof DEFAULT_HISC_CONFIG & { radiusMeters: number, windowHours: number, thresholds: { duplicate: number, related: number } }}
 */
export const loadConfig = (customConfig = {}) => {
   const fileConfig = findFileConfig() ?? {};
   const config = {
      ...fileConfig,
      ...customConfig,
      weights: {
         ...(fileConfig.weights ?? {}),
         ...(customConfig?.weights ?? {}),
      },
      thresholds: {
         ...(fileConfig.thresholds ?? {}),
         ...(customConfig?.thresholds ?? {}),
      },
   };

   const rawRadius = config.radiusMeters ?? config.radiusInMeters ?? fileConfig.radiusInMeters ?? DEFAULT_HISC_CONFIG.radiusInMeters;
   const radiusInMeters = (typeof rawRadius === "number" && rawRadius > 0 && Number.isFinite(rawRadius))
      ? rawRadius
      : DEFAULT_HISC_CONFIG.radiusInMeters;

   const rawWindow = config.windowHours ?? config.temporalWindowHours ?? fileConfig.temporalWindowHours ?? DEFAULT_HISC_CONFIG.temporalWindowHours;
   const temporalWindowHours = (typeof rawWindow === "number" && rawWindow > 0 && Number.isFinite(rawWindow))
      ? rawWindow
      : DEFAULT_HISC_CONFIG.temporalWindowHours;

   const rawDup = config.thresholds?.duplicate ?? config.thresholds?.duplicateThreshold ?? config.duplicateThreshold ?? fileConfig.duplicateThreshold ?? DEFAULT_HISC_CONFIG.duplicateThreshold;
   const duplicateThreshold = (typeof rawDup === "number" && Number.isFinite(rawDup) && rawDup >= 0 && rawDup <= 1)
      ? rawDup
      : DEFAULT_HISC_CONFIG.duplicateThreshold;

   const rawRel = config.thresholds?.related ?? config.thresholds?.relatedThreshold ?? config.relatedThreshold ?? fileConfig.relatedThreshold ?? DEFAULT_HISC_CONFIG.relatedThreshold;
   const relatedThreshold = (typeof rawRel === "number" && Number.isFinite(rawRel) && rawRel >= 0 && rawRel <= 1)
      ? rawRel
      : DEFAULT_HISC_CONFIG.relatedThreshold;

   const weights = (config?.weights && typeof config.weights === "object")
      ? { ...DEFAULT_HISC_CONFIG.weights, ...fileConfig.weights, ...config.weights }
      : { ...DEFAULT_HISC_CONFIG.weights, ...fileConfig.weights };

   const enabledFeatures = config.enabledFeatures ?? DEFAULT_HISC_CONFIG.enabledFeatures;
   const semanticMode = config.semanticMode ?? DEFAULT_HISC_CONFIG.semanticMode;

   return {
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
   };
};

export default {
   DEFAULT_HISC_CONFIG,
   loadConfig,
};
