import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import { scorePair } from "../src/hisc/scorePair.js";
import { loadConfig, DEFAULT_HISC_CONFIG } from "../src/hisc/config.js";
import {
   extractIncidentFeatures,
   classifyIncidentScore,
   HISC_CONFIG,
} from "../src/service/incidentIntelligence.service.js";

describe("HISC Pure Scoring Interface — scorePair and loadConfig", () => {
   const baseComplaintA = {
      text: "Large pothole crater breaking car suspension on Main Road",
      category: "Roads & Transport",
      location: { coordinates: [80.1382, 12.9231] },
      createdAt: "2026-03-15T10:00:00.000Z",
   };

   const baseComplaintB = {
      text: "Dangerous road defect and crater near Main Road junction",
      category: "Roads & Transport",
      location: { coordinates: [80.1385, 12.9234] }, // ~45 meters apart
      createdAt: "2026-03-15T11:30:00.000Z", // 1.5 hours later
   };

   describe("1. Contract and Output Shape", () => {
      it("returns the exact expected contract shape", () => {
         const result = scorePair(baseComplaintA, baseComplaintB);

         // Check enumerable keys
         const keys = Object.keys(result).sort();
         assert.deepEqual(keys, ["explanation", "features", "label", "score"]);

         // Value constraints
         assert.equal(typeof result.score, "number");
         assert.ok(Number.isFinite(result.score));
         assert.ok(result.score >= 0 && result.score <= 1);

         assert.ok(["duplicate", "related", "independent"].includes(result.label));

         // Features shape
         const featureKeys = Object.keys(result.features).sort();
         assert.deepEqual(featureKeys, ["category", "geographic", "lexical", "semantic", "temporal"]);
         for (const [key, val] of Object.entries(result.features)) {
            assert.equal(typeof val, "number", `Feature ${key} must be a number`);
            assert.ok(Number.isFinite(val), `Feature ${key} must be finite`);
            assert.ok(val >= 0 && val <= 1, `Feature ${key} must be in [0, 1]`);
         }

         // Explanation shape
         assert.ok(Array.isArray(result.explanation));
         assert.ok(result.explanation.length > 0);
         for (const exp of result.explanation) {
            assert.equal(typeof exp, "string");
         }
      });

      it("handles plain objects with text or title/description interchangeably", () => {
         const plainA = {
            title: "Large pothole crater",
            description: "breaking car suspension on Main Road",
            category: "Roads & Transport",
            location: { coordinates: [80.1382, 12.9231] },
            createdAt: "2026-03-15T10:00:00.000Z",
         };
         const plainB = {
            text: "Dangerous road defect and crater near Main Road junction",
            category: "Roads & Transport",
            coordinates: [80.1385, 12.9234],
            createdAt: "2026-03-15T11:30:00.000Z",
         };

         const result = scorePair(plainA, plainB);
         assert.equal(result.label, "duplicate");
         assert.ok(result.score > 0.60);
      });
   });

   describe("2. Function Purity and Immutability", () => {
      it("is completely pure and does not mutate inputs or options", () => {
         const frozenA = Object.freeze({
            text: "Pothole on street",
            category: "Roads & Transport",
            location: Object.freeze({ coordinates: Object.freeze([80.1, 13.0]) }),
            createdAt: "2026-01-01T00:00:00.000Z",
         });
         const frozenB = Object.freeze({
            text: "Road repair needed",
            category: "Roads & Transport",
            location: Object.freeze({ coordinates: Object.freeze([80.1001, 13.0001]) }),
            createdAt: "2026-01-01T01:00:00.000Z",
         });
         const frozenOpts = Object.freeze({
            weights: Object.freeze({ category: 0.20, geographic: 0.25, lexical: 0.10, semantic: 0.30, temporal: 0.15 }),
            thresholds: Object.freeze({ duplicate: 0.60, related: 0.35 }),
         });

         const run1 = scorePair(frozenA, frozenB, frozenOpts);
         const run2 = scorePair(frozenA, frozenB, frozenOpts);

         assert.deepEqual(run1, run2, "Repeated invocations with identical inputs must be strictly identical");
      });
   });

   describe("3. Thresholds and Behavior Preservation", () => {
      it("classifies nearby identical category reports as duplicate", () => {
         const result = scorePair(baseComplaintA, baseComplaintB);
         assert.equal(result.label, "duplicate");
      });

      it("classifies reports separated by >250m as related even if score is high", () => {
         const distantB = {
            ...baseComplaintB,
            location: { coordinates: [80.1420, 12.9260] }, // ~500m away
         };
         const result = scorePair(baseComplaintA, distantB);
         assert.equal(result.label, "related");
         assert.ok(result.score >= 0.35);
      });

      it("classifies reports with distance >3000m as independent", () => {
         const farB = {
            ...baseComplaintB,
            location: { coordinates: [80.1800, 12.9500] }, // >5000m away
         };
         const result = scorePair(baseComplaintA, farB);
         assert.equal(result.label, "independent");
      });

      it("respects custom thresholds options", () => {
         const highThresholdOpts = {
            thresholds: { duplicate: 0.95, related: 0.85 },
         };
         const result = scorePair(baseComplaintA, baseComplaintB, highThresholdOpts);
         assert.notEqual(result.label, "duplicate", "Custom high duplicate threshold should prevent duplicate classification");
         assert.ok(["related", "independent"].includes(result.label));
      });
   });

   describe("4. Configuration Loading and Fallbacks", () => {
      it("loadConfig returns production defaults when called with no arguments", () => {
         const config = loadConfig();
         assert.equal(config.radiusInMeters, 1000);
         assert.equal(config.radiusMeters, 1000);
         assert.equal(config.temporalWindowHours, 720);
         assert.equal(config.windowHours, 720);
         assert.equal(config.duplicateThreshold, 0.60);
         assert.equal(config.relatedThreshold, 0.35);
         assert.deepEqual(config.weights, DEFAULT_HISC_CONFIG.weights);
         assert.equal(config.semanticMode, "synonym");
      });

      it("safely handles invalid, NaN, negative, or partial options", () => {
         const malformed = {
            radiusMeters: -50,
            windowHours: "invalid",
            thresholds: { duplicate: NaN, related: 1.5 },
            weights: { lexical: 0.50 },
         };
         const config = loadConfig(malformed);
         assert.equal(config.radiusInMeters, 1000, "Negative radius must fallback to default");
         assert.equal(config.temporalWindowHours, 720, "Invalid window must fallback to default");
         assert.equal(config.duplicateThreshold, 0.60, "NaN duplicate threshold must fallback to default");
         assert.equal(config.relatedThreshold, 0.35, "Out-of-range threshold must fallback to default");
         assert.equal(config.weights.lexical, 0.50, "Valid custom feature weight should be applied");
         assert.equal(config.weights.category, 0.20, "Omitted feature weights should keep default");
      });
   });

   describe("5. Parity with Production Service", () => {
      it("produces identical feature scores and classifications as production service", () => {
         const prodAnalysis = extractIncidentFeatures(baseComplaintA, baseComplaintB, HISC_CONFIG);
         const prodLabel = classifyIncidentScore(prodAnalysis, HISC_CONFIG);

         const pureResult = scorePair(baseComplaintA, baseComplaintB, HISC_CONFIG);

         assert.equal(pureResult.score, prodAnalysis.score);
         assert.equal(pureResult.label, prodLabel);
         assert.deepEqual(pureResult.features, prodAnalysis.features);
         assert.deepEqual(pureResult.explanation, prodAnalysis.explanation);
      });
   });
});
