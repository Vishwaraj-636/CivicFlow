import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
   runComprehensiveBaseline,
   formatEvaluationMarkdown,
   loadDatasetPartitions,
} from "./hiscEvaluationHarness.js";
import { HISC_CONFIG } from "../service/incidentIntelligence.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const A4_PATHS = {
   outputJson: path.resolve(__dirname, "../../data/hisc_a4_evaluation.json"),
   outputMd: path.resolve(__dirname, "../../data/hisc_a4_evaluation.md"),
   baselineJson: path.resolve(__dirname, "../../data/hisc_baseline_evaluation.json"),
};

export function runA4Evaluation() {
   const now = "2026-10-10T23:20:00.000Z";
   const { reportData } = runComprehensiveBaseline({
      evaluationDate: now,
      bootstrapIterations: 1000,
      seed: 42,
   });

   reportData.metadata.evaluation_phase = "Phase A4 — HISC Vocabulary and Cross-Asset Improvements";

   // Format markdown
   let md = formatEvaluationMarkdown(reportData);
   md = md.replace("# HISC Incident-Clustering Algorithm — Evaluation Report V2", "# HISC Algorithm Phase A4 — Evaluation and Baseline Comparison Report");

   // Add side-by-side comparison section
   if (fs.existsSync(A4_PATHS.baselineJson)) {
      const baselineData = JSON.parse(fs.readFileSync(A4_PATHS.baselineJson, "utf8"));
      md += `\n## 7. Phase A3 Baseline vs. Phase A4 Improvement Comparison\n\n`;
      md += `| Partition | Metric | Phase A3 Baseline | Phase A4 Improved | Delta / Relative Change |\n`;
      md += `|---|:---:|:---:|:---:|:---:|\n`;

      const compareKeys = [
         { key: "train", label: "Train (60%, N=240)" },
         { key: "val", label: "Validation (20%, N=80)" },
         { key: "test", label: "Held-out Test (20%, N=80)" },
         { key: "original_all", label: "Full Original (N=400)" },
         { key: "synthetic_challenge", label: "Synthetic Challenge (N=150)" },
      ];

      for (const { key, label } of compareKeys) {
         const bPart = baselineData.partitions[key];
         const aPart = reportData.partitions[key];

         const bF1 = bPart.metrics.macro_f1;
         const aF1 = aPart.metrics.macro_f1;
         const deltaF1 = (aF1 - bF1).toFixed(4);
         const deltaF1Str = aF1 >= bF1 ? `+${deltaF1}` : `${deltaF1}`;

         md += `| **${label}** | Macro F1 | ${bF1.toFixed(4)} | **${aF1.toFixed(4)}** | **${deltaF1Str}** |\n`;
         md += `| | Accuracy | ${(bPart.metrics.accuracy * 100).toFixed(2)}% | ${(aPart.metrics.accuracy * 100).toFixed(2)}% | ${((aPart.metrics.accuracy - bPart.metrics.accuracy) * 100).toFixed(2)}% |\n`;

         if (key === "synthetic_challenge") {
            const bIndRec = bPart.metrics.per_class.independent.recall;
            const aIndRec = aPart.metrics.per_class.independent.recall;
            const bIndF1 = bPart.metrics.per_class.independent.f1;
            const aIndF1 = aPart.metrics.per_class.independent.f1;
            md += `| | Challenge Independent Recall | ${(bIndRec * 100).toFixed(2)}% | **${(aIndRec * 100).toFixed(2)}%** | **+${((aIndRec - bIndRec) * 100).toFixed(2)}%** |\n`;
            md += `| | Challenge Independent F1 | ${bIndF1.toFixed(4)} | **${aIndF1.toFixed(4)}** | **+${(aIndF1 - bIndF1).toFixed(4)}** |\n`;
         }
      }
      md += "\n";
   }

   fs.writeFileSync(A4_PATHS.outputJson, JSON.stringify(reportData, null, 2), "utf8");
   fs.writeFileSync(A4_PATHS.outputMd, md, "utf8");

   console.log(`Saved A4 evaluation JSON to: ${A4_PATHS.outputJson}`);
   console.log(`Saved A4 evaluation Markdown to: ${A4_PATHS.outputMd}`);

   return reportData;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   runA4Evaluation();
}
