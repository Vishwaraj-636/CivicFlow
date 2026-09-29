import { HISC_CONFIG } from "../service/incidentIntelligence.service.js";
import { evaluateIncidentAlgorithm } from "./incidentAlgorithmEvaluation.js";

export const DUPLICATE_THRESHOLDS = [0.55, 0.6, 0.65, 0.7, 0.75, 0.78, 0.8];
export const RELATED_THRESHOLDS = [0.35, 0.4, 0.45, 0.5, 0.55];

const labels = ["duplicate", "related", "independent"];

const splitByClass = (dataset) => {
   const counts = {};
   const calibration = [];
   const test = [];
   dataset.forEach((item) => {
      const classIndex = counts[item.label] ?? 0;
      counts[item.label] = classIndex + 1;
      (classIndex % 5 === 0 ? test : calibration).push(item);
   });
   return { calibration, test };
};

export const splitTrainingValidationTest = (dataset) => {
   const { calibration, test } = splitByClass(dataset);
   const counts = {};
   const training = [];
   const validation = [];
   calibration.forEach((item) => {
      const classIndex = counts[item.label] ?? 0;
      counts[item.label] = classIndex + 1;
      (classIndex % 4 === 0 ? validation : training).push(item);
   });
   return { training, validation, test };
};

const f1For = (metrics, label) => metrics.byClass[label]?.f1 ?? 0;

const weightCandidates = [
   HISC_CONFIG.weights,
   { category: 0.2, geographic: 0.25, lexical: 0.1, semantic: 0.3, temporal: 0.15 },
   { category: 0.2, geographic: 0.2, lexical: 0.1, semantic: 0.35, temporal: 0.15 },
   { category: 0.2, geographic: 0.25, lexical: 0.15, semantic: 0.25, temporal: 0.15 },
];

const isBetter = (candidate, current) => {
   if (!current) return true;
   if (candidate.metrics.f1 !== current.metrics.f1) return candidate.metrics.f1 > current.metrics.f1;
   return f1For(candidate.metrics, "duplicate") > f1For(current.metrics, "duplicate");
};

export const analyzeDuplicateThresholds = (validation, weights = HISC_CONFIG.weights) => DUPLICATE_THRESHOLDS.map((threshold) => {
   const result = evaluateIncidentAlgorithm(validation, {
      ...HISC_CONFIG,
      weights,
      duplicateThreshold: threshold,
   });
   return { duplicateThreshold: threshold, duplicateF1: f1For(result.metrics, "duplicate"), macroF1: result.metrics.f1 };
});

export const selectFrozenConfig = (training, validation) => {
   let selected = null;
   let selectedWeights = null;
   for (const weights of weightCandidates) {
      const result = evaluateIncidentAlgorithm(training, { ...HISC_CONFIG, weights });
      const candidate = { metrics: result.metrics, weights };
      if (isBetter(candidate, selectedWeights)) selectedWeights = candidate;
   }
   let selectedThresholds = null;
   for (const duplicateThreshold of DUPLICATE_THRESHOLDS) {
      for (const relatedThreshold of RELATED_THRESHOLDS) {
         const result = evaluateIncidentAlgorithm(validation, {
            ...HISC_CONFIG,
            weights: selectedWeights.weights,
            duplicateThreshold,
            relatedThreshold,
         });
         const candidate = { metrics: result.metrics, duplicateThreshold, relatedThreshold };
         if (isBetter(candidate, selectedThresholds)) selectedThresholds = candidate;
      }
   }
   return {
      ...HISC_CONFIG,
      weights: selectedWeights.weights,
      duplicateThreshold: selectedThresholds.duplicateThreshold,
      relatedThreshold: selectedThresholds.relatedThreshold,
      calibrationSamples: training.length,
      validationSamples: validation.length,
   };
};

export const runHiscExperiment = (dataset) => {
   const { training, validation, test } = splitTrainingValidationTest(dataset);
   const frozenConfig = selectFrozenConfig(training, validation);
   const thresholdAnalysis = analyzeDuplicateThresholds(validation, frozenConfig.weights);
   const full = evaluateIncidentAlgorithm(test, frozenConfig);
   const ablations = Object.fromEntries(["semantic", "temporal", "geographic", "lexical", "category"].map((feature) => {
      const enabledFeatures = { [feature]: false };
      const result = evaluateIncidentAlgorithm(test, { ...frozenConfig, enabledFeatures });
      return [`HISC - ${feature}`, { ...result.metrics, meanScore: result.meanScore }];
   }));
   return {
      split: { training: training.length, validation: validation.length, test: test.length },
      frozenConfig: {
         duplicateThreshold: frozenConfig.duplicateThreshold,
         relatedThreshold: frozenConfig.relatedThreshold,
         weights: frozenConfig.weights,
      },
      thresholdAnalysis,
      finalTest: { ...full.metrics, meanScore: full.meanScore },
      ablations: { "Full HISC": { ...full.metrics, meanScore: full.meanScore }, ...ablations },
      labels,
   };
};