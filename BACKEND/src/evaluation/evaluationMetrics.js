export const calculateMetrics = (results) => {
   const labels = ["duplicate", "related", "independent"];
   const correct = results.filter((item) => item.actual === item.predicted).length;
   const byClass = Object.fromEntries(labels.map((label) => {
      const truePositive = results.filter((item) => item.actual === label && item.predicted === label).length;
      const falsePositive = results.filter((item) => item.actual !== label && item.predicted === label).length;
      const falseNegative = results.filter((item) => item.actual === label && item.predicted !== label).length;
      const precision = truePositive / Math.max(1, truePositive + falsePositive);
      const recall = truePositive / Math.max(1, truePositive + falseNegative);
      return [label, { precision, recall, f1: (2 * precision * recall) / Math.max(1, precision + recall) }];
   }));
   const precision = labels.reduce((sum, label) => sum + byClass[label].precision, 0) / labels.length;
   const recall = labels.reduce((sum, label) => sum + byClass[label].recall, 0) / labels.length;
   const f1 = labels.reduce((sum, label) => sum + byClass[label].f1, 0) / labels.length;
   const independent = byClass.independent;
   return {
      samples: results.length,
      accuracy: correct / Math.max(1, results.length),
      precision,
      recall,
      f1,
      falsePositiveRate: 1 - independent.recall,
      byClass,
      confusion: labels.reduce((output, actual) => ({
         ...output,
         [actual]: labels.reduce((row, predicted) => ({
            ...row,
            [predicted]: results.filter((item) => item.actual === actual && item.predicted === predicted).length,
         }), {}),
      }), {}),
   };
};