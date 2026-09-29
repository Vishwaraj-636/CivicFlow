import { extractIncidentFeatures, classifyIncidentScore } from "../service/incidentIntelligence.service.js";
import { evaluationDataset } from "./evaluationDataset.js";
import { calculateMetrics } from "./evaluationMetrics.js";
import { loadEvaluationDataset } from "./evaluationDataset.js";
import { evaluateBaseline } from "./baselineEvaluation.js";
import { runHiscExperiment } from "./hiscExperiment.js";

export const evaluateIncidentAlgorithm = (dataset = evaluationDataset, config) => {
   const results = dataset.map(({ label, first, second }) => {
      const analysis = extractIncidentFeatures(first, second, config);
      return { actual: label, predicted: classifyIncidentScore(analysis.score, config), score: analysis.score, features: analysis.features };
   });
   return { algorithm: "HISC", metrics: calculateMetrics(results), results };
};

if (process.argv[1]?.endsWith("incidentAlgorithmEvaluation.js")) {
   const dataset = loadEvaluationDataset();
   const startedAt = performance.now();
   const baseline = evaluateBaseline(dataset);
   baseline.processingTimeMs = Number((performance.now() - startedAt).toFixed(3));
   const proposedStartedAt = performance.now();
   const proposed = runHiscExperiment(dataset);
   proposed.processingTimeMs = Number((performance.now() - proposedStartedAt).toFixed(3));
   console.log(JSON.stringify({
      dataset: { source: "civicflow_400_labeled_complaint_pairs.csv", samples: dataset.length },
      baseline: { algorithm: baseline.algorithm, metrics: baseline.metrics, processingTimeMs: baseline.processingTimeMs },
      proposed,
   }, null, 2));
}