import { calculateSimilarityScore, calculateTextSimilarity, classifySimilarity } from "../service/complaintSimilarity.service.js";
import { evaluationDataset } from "./evaluationDataset.js";
import { calculateMetrics } from "./evaluationMetrics.js";
import { distanceInMeters } from "../service/incidentIntelligence.service.js";

export const evaluateBaseline = (dataset = evaluationDataset) => {
   const results = dataset.map(({ label, first, second }) => {
      const distance = distanceInMeters(first.location.coordinates, second.location.coordinates);
      const score = calculateSimilarityScore({
         categoryScore: first.category === second.category ? 1 : 0,
         locationScore: Math.max(0, 1 - distance / 1000),
         textScore: calculateTextSimilarity(`${first.title} ${first.description}`, `${second.title} ${second.description}`),
      });
      return { actual: label, predicted: classifySimilarity(score), score };
   });
   return { algorithm: "Baseline", metrics: calculateMetrics(results), results };
};