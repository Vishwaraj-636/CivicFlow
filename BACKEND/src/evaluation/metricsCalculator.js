import { createRNG } from "./makeSplits.js";

export const SUPPORTED_CLASSES = ["duplicate", "related", "independent"];

/**
 * Safe division with explicit fallback
 * @param {number} numerator 
 * @param {number} denominator 
 * @param {number} [fallback=0] 
 * @returns {number}
 */
export function safeDivide(numerator, denominator, fallback = 0) {
   if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return fallback;
   }
   return numerator / denominator;
}

/**
 * Validates prediction items have valid actual and predicted labels
 * @param {Array<{ actual: string, predicted: string }>} results 
 */
export function validateResults(results) {
   if (!Array.isArray(results) || results.length === 0) {
      throw new Error("Results must be a non-empty array of predictions");
   }
   const valid = new Set(SUPPORTED_CLASSES);
   for (let i = 0; i < results.length; i++) {
      const item = results[i];
      if (!item || typeof item !== "object") {
         throw new Error(`Invalid result object at index ${i}`);
      }
      if (!valid.has(item.actual)) {
         throw new Error(`Invalid actual label '${item.actual}' at index ${i}`);
      }
      if (!valid.has(item.predicted)) {
         throw new Error(`Invalid predicted label '${item.predicted}' at index ${i}`);
      }
   }
}

/**
 * Constructs 3x3 confusion matrix: matrix[actual][predicted] = count
 * @param {Array<{ actual: string, predicted: string }>} results 
 * @param {string[]} [classes=SUPPORTED_CLASSES]
 */
export function computeConfusionMatrix(results, classes = SUPPORTED_CLASSES) {
   validateResults(results);
   const matrix = {};
   for (const actual of classes) {
      matrix[actual] = {};
      for (const predicted of classes) {
         matrix[actual][predicted] = 0;
      }
   }
   for (const item of results) {
      if (matrix[item.actual] && matrix[item.actual][item.predicted] !== undefined) {
         matrix[item.actual][item.predicted]++;
      }
   }
   return matrix;
}

/**
 * Computes per-class TP, FP, FN, TN, support, precision, recall, and F1
 * @param {Record<string, Record<string, number>>} confusion 
 * @param {string[]} [classes=SUPPORTED_CLASSES]
 */
export function computePerClassMetrics(confusion, classes = SUPPORTED_CLASSES) {
   const perClass = {};

   // Compute total N across matrix
   let totalN = 0;
   for (const actual of classes) {
      for (const predicted of classes) {
         totalN += confusion[actual]?.[predicted] ?? 0;
      }
   }

   for (const target of classes) {
      const tp = confusion[target]?.[target] ?? 0;

      let fp = 0;
      let fn = 0;
      for (const other of classes) {
         if (other !== target) {
            fp += confusion[other]?.[target] ?? 0;
            fn += confusion[target]?.[other] ?? 0;
         }
      }

      const tn = totalN - (tp + fp + fn);
      const support = tp + fn; // Actual occurrences of target class

      const precision = safeDivide(tp, tp + fp, 0);
      const recall = safeDivide(tp, tp + fn, 0);
      const f1 = safeDivide(2 * precision * recall, precision + recall, 0);

      perClass[target] = {
         true_positive: tp,
         false_positive: fp,
         false_negative: fn,
         true_negative: tn,
         support,
         precision: Number(precision.toFixed(4)),
         recall: Number(recall.toFixed(4)),
         f1: Number(f1.toFixed(4)),
         raw_precision: precision,
         raw_recall: recall,
         raw_f1: f1,
      };
   }

   return perClass;
}

/**
 * Computes unweighted Macro precision, recall, and F1
 * @param {ReturnType<typeof computePerClassMetrics>} perClass 
 * @param {string[]} [classes=SUPPORTED_CLASSES]
 */
export function computeMacroMetrics(perClass, classes = SUPPORTED_CLASSES) {
   const k = classes.length;
   if (k === 0) return { macro_precision: 0, macro_recall: 0, macro_f1: 0 };

   let sumP = 0;
   let sumR = 0;
   let sumF1 = 0;

   for (const c of classes) {
      sumP += perClass[c]?.raw_precision ?? 0;
      sumR += perClass[c]?.raw_recall ?? 0;
      sumF1 += perClass[c]?.raw_f1 ?? 0;
   }

   const macroP = sumP / k;
   const macroR = sumR / k;
   const macroF1 = sumF1 / k;

   return {
      macro_precision: Number(macroP.toFixed(4)),
      macro_recall: Number(macroR.toFixed(4)),
      macro_f1: Number(macroF1.toFixed(4)),
      raw_macro_f1: macroF1,
   };
}

/**
 * Computes Micro precision, recall, and F1
 * In multi-class single-label classification, Micro P == Micro R == Micro F1 == Overall Accuracy
 * @param {Record<string, Record<string, number>>} confusion 
 * @param {string[]} [classes=SUPPORTED_CLASSES]
 */
export function computeMicroMetrics(confusion, classes = SUPPORTED_CLASSES) {
   let totalTp = 0;
   let totalFp = 0;
   let totalFn = 0;

   for (const c of classes) {
      totalTp += confusion[c]?.[c] ?? 0;
      for (const other of classes) {
         if (other !== c) {
            totalFp += confusion[other]?.[c] ?? 0;
            totalFn += confusion[c]?.[other] ?? 0;
         }
      }
   }

   const microP = safeDivide(totalTp, totalTp + totalFp, 0);
   const microR = safeDivide(totalTp, totalTp + totalFn, 0);
   const microF1 = safeDivide(2 * microP * microR, microP + microR, 0);

   return {
      micro_precision: Number(microP.toFixed(4)),
      micro_recall: Number(microR.toFixed(4)),
      micro_f1: Number(microF1.toFixed(4)),
   };
}

/**
 * Computes Support-Weighted precision, recall, and F1
 * @param {ReturnType<typeof computePerClassMetrics>} perClass 
 * @param {string[]} [classes=SUPPORTED_CLASSES]
 */
export function computeWeightedMetrics(perClass, classes = SUPPORTED_CLASSES) {
   let totalSupport = 0;
   let weightedP = 0;
   let weightedR = 0;
   let weightedF1 = 0;

   for (const c of classes) {
      const sup = perClass[c]?.support ?? 0;
      totalSupport += sup;
      weightedP += sup * (perClass[c]?.raw_precision ?? 0);
      weightedR += sup * (perClass[c]?.raw_recall ?? 0);
      weightedF1 += sup * (perClass[c]?.raw_f1 ?? 0);
   }

   const wP = safeDivide(weightedP, totalSupport, 0);
   const wR = safeDivide(weightedR, totalSupport, 0);
   const wF1 = safeDivide(weightedF1, totalSupport, 0);

   return {
      weighted_precision: Number(wP.toFixed(4)),
      weighted_recall: Number(wR.toFixed(4)),
      weighted_f1: Number(wF1.toFixed(4)),
   };
}

/**
 * Computes complete detailed metrics suite for classification results
 * @param {Array<{ actual: string, predicted: string, pair_id?: string, [key: string]: any }>} results 
 */
export function calculateDetailedMetrics(results) {
   validateResults(results);

   const confusion = computeConfusionMatrix(results);
   const perClass = computePerClassMetrics(confusion);
   const macro = computeMacroMetrics(perClass);
   const micro = computeMicroMetrics(confusion);
   const weighted = computeWeightedMetrics(perClass);

   let correct = 0;
   const misclassified = [];

   for (const item of results) {
      if (item.actual === item.predicted) {
         correct++;
      } else {
         misclassified.push({
            pair_id: item.pair_id ?? "unknown",
            actual_label: item.actual,
            predicted_label: item.predicted,
            score: item.score !== undefined ? Number(item.score.toFixed(4)) : null,
            features: item.features ?? null,
            distance_meters: item.distance !== undefined ? Math.round(item.distance) : null,
            hours: item.hours !== undefined ? Number(item.hours.toFixed(1)) : null,
            category_a: item.category_a ?? null,
            category_b: item.category_b ?? null,
            explanation: item.explanation ?? null,
         });
      }
   }

   const total = results.length;
   const accuracy = safeDivide(correct, total, 0);

   // Clean up per-class objects to remove internal raw keys
   const cleanPerClass = {};
   for (const c of SUPPORTED_CLASSES) {
      const { raw_precision, raw_recall, raw_f1, ...rest } = perClass[c];
      cleanPerClass[c] = rest;
   }

   return {
      sample_count: total,
      correct_count: correct,
      incorrect_count: total - correct,
      accuracy: Number(accuracy.toFixed(4)),
      macro_precision: macro.macro_precision,
      macro_recall: macro.macro_recall,
      macro_f1: macro.macro_f1,
      micro_precision: micro.micro_precision,
      micro_recall: micro.micro_recall,
      micro_f1: micro.micro_f1,
      weighted_precision: weighted.weighted_precision,
      weighted_recall: weighted.weighted_recall,
      weighted_f1: weighted.weighted_f1,
      per_class: cleanPerClass,
      confusion_matrix: confusion,
      misclassified_count: misclassified.length,
      misclassified_pairs: misclassified,
   };
}

/**
 * Computes deterministic bootstrap confidence interval for Macro F1
 * @param {Array<{ actual: string, predicted: string }>} results 
 * @param {object} [options]
 * @param {number} [options.iterations=1000]
 * @param {number} [options.confidenceLevel=0.95]
 * @param {number} [options.seed=42]
 */
export function computeBootstrapMacroF1CI(results, options = {}) {
   validateResults(results);
   const iterations = options.iterations ?? 1000;
   const confidenceLevel = options.confidenceLevel ?? 0.95;
   const seed = options.seed ?? 42;

   const n = results.length;
   const rng = createRNG(seed);
   const bootstrapMacroF1Values = new Float64Array(iterations);

   for (let b = 0; b < iterations; b++) {
      // Resample with replacement
      const sample = new Array(n);
      for (let i = 0; i < n; i++) {
         const idx = Math.floor(rng() * n);
         sample[i] = results[idx];
      }

      const conf = computeConfusionMatrix(sample);
      const perClass = computePerClassMetrics(conf);
      const macro = computeMacroMetrics(perClass);
      bootstrapMacroF1Values[b] = macro.raw_macro_f1;
   }

   bootstrapMacroF1Values.sort();

   const alpha = 1 - confidenceLevel;
   const lowerIndex = Math.max(0, Math.floor((alpha / 2) * iterations));
   const upperIndex = Math.min(iterations - 1, Math.floor((1 - alpha / 2) * iterations));

   let sum = 0;
   for (let i = 0; i < iterations; i++) {
      sum += bootstrapMacroF1Values[i];
   }
   const mean = sum / iterations;

   let varSum = 0;
   for (let i = 0; i < iterations; i++) {
      const diff = bootstrapMacroF1Values[i] - mean;
      varSum += diff * diff;
   }
   const standardError = Math.sqrt(varSum / Math.max(1, iterations - 1));

   const ciLower = bootstrapMacroF1Values[lowerIndex];
   const ciUpper = bootstrapMacroF1Values[upperIndex];

   return {
      metric: "macro_f1",
      mean: Number(mean.toFixed(4)),
      standard_error: Number(standardError.toFixed(4)),
      ci_lower: Number(ciLower.toFixed(4)),
      ci_upper: Number(ciUpper.toFixed(4)),
      confidence_level: confidenceLevel,
      iterations,
      seed,
   };
}
