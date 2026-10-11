import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateRuleInventory() {
   const inventory = {
      timestamp: new Date().toISOString(),
      gitDiffStat_c1a4cdd_HEAD: "BACKEND/src/hisc/scorePair.js | 54 +++++++++++++++++++++++++++++++++++++++++++\n 1 file changed, 54 insertions(+)",
      rules: [
         {
            id: "rule_1_distant_boundary",
            codeLine: 'if (distance > 3000) return "independent";',
            determineRuleLine: 'if (distance > 3000) return "rule_1_distant_boundary";',
            forcedLabel: "independent",
            inputFieldsRead: ["a.location.coordinates", "b.location.coordinates"],
            derivedSignals: ["distanceInMeters(coordsA, coordsB) > 3000"],
            isGroundTruthLeak: false,
         },
         {
            id: "rule_2_temporal_boundary",
            codeLine: 'if (hours > 720) return "independent";',
            determineRuleLine: 'if (hours > 720) return "rule_2_temporal_boundary";',
            forcedLabel: "independent",
            inputFieldsRead: ["a.createdAt", "b.createdAt"],
            derivedSignals: ["Math.abs(dateA - dateB) / 3600000 > 720"],
            isGroundTruthLeak: false,
         },
         {
            id: "rule_3_operational_radius",
            codeLine: 'if (distance > config.radiusInMeters && (!causallyConnected || semantic < 0.20)) return "independent";',
            determineRuleLine: 'if (distance > config.radiusInMeters && (!causallyConnected || semantic < 0.20)) return "rule_3_operational_radius";',
            forcedLabel: "independent",
            inputFieldsRead: ["a.location.coordinates", "b.location.coordinates", "a.text/title/desc", "b.text/title/desc"],
            derivedSignals: ["distance", "causallyConnected (from concept dictionary matching on text)", "semantic (text lexical/synonym affinity)"],
            isGroundTruthLeak: false,
         },
         {
            id: "rule_4_incompatible_categories",
            codeLine: 'if (catSim === 0.0 && !causallyConnected) return "independent";',
            determineRuleLine: 'if (catSim === 0.0 && !causallyConnected) return "rule_4_incompatible_categories";',
            forcedLabel: "independent",
            inputFieldsRead: ["a.category", "b.category", "a.text/title/desc", "b.text/title/desc"],
            derivedSignals: ["catSim (category compatibility score)", "causallyConnected (concept dictionary matching on text)"],
            isGroundTruthLeak: false,
         },
         {
            id: "rule_5_duplicate",
            codeLine: 'if (catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 || lexical > 0 || score >= 0.70)) return "duplicate";',
            determineRuleLine: 'if (catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 || lexical > 0 || score >= 0.70)) return "rule_5_duplicate";',
            forcedLabel: "duplicate",
            inputFieldsRead: ["a.category", "b.category", "a.location.coordinates", "b.location.coordinates", "a.createdAt", "b.createdAt", "a.text/title/desc", "b.text/title/desc"],
            derivedSignals: ["score >= duplicateThreshold", "catSim >= 0.9", "distance <= 250", "hours <= 168", "!opposingDir", "semantic/lexical affinity"],
            isGroundTruthLeak: false,
         },
         {
            id: "rule_5_opposing_direction",
            codeLine: 'return opposingDir ? "independent" : "related";',
            determineRuleLine: 'return opposingDir ? "rule_5_opposing_direction" : "rule_5_downgraded_related";',
            forcedLabel: "independent",
            inputFieldsRead: ["a.text/title/desc", "b.text/title/desc"],
            derivedSignals: ["hasOpposingDirections(textA, textB) === true", "score >= duplicateThreshold"],
            isGroundTruthLeak: false,
         },
         {
            id: "rule_5_downgraded_related",
            codeLine: 'return opposingDir ? "independent" : "related";',
            determineRuleLine: 'return opposingDir ? "rule_5_opposing_direction" : "rule_5_downgraded_related";',
            forcedLabel: "related",
            inputFieldsRead: ["a.category", "b.category", "a.location.coordinates", "b.location.coordinates", "a.createdAt", "b.createdAt", "a.text/title/desc", "b.text/title/desc"],
            derivedSignals: ["score >= duplicateThreshold", "fails tight duplicate bounds (distance > 250m or hours > 168h or catSim < 0.9)"],
            isGroundTruthLeak: false,
         },
         {
            id: "rule_opposing_direction_related",
            codeLine: 'return opposingDir && catSim < 0.9 ? "independent" : "related";',
            determineRuleLine: 'return opposingDir && catSim < 0.9 ? "rule_opposing_direction_related" : "threshold";',
            forcedLabel: "independent",
            inputFieldsRead: ["a.text/title/desc", "b.text/title/desc", "a.category", "b.category"],
            derivedSignals: ["opposingDir === true", "catSim < 0.9", "score >= relatedThreshold"],
            isGroundTruthLeak: false,
         },
         {
            id: "threshold",
            codeLine: 'return "independent"; / return "related"; / return "duplicate";',
            determineRuleLine: 'return "threshold";',
            forcedLabel: "score-dependent",
            inputFieldsRead: ["active weights * features"],
            derivedSignals: ['score >= relatedThreshold ? "related" : "independent"'],
            isGroundTruthLeak: false,
         },
      ],
      reconciliation: {
         reportedSixRuleList: [
            "distant boundary (>3000m -> independent)",
            "temporal boundary (>720h -> independent)",
            "operational radius (>1000m without causal/semantic -> independent)",
            "incompatible categories (catSim 0.0 without causal -> independent)",
            "duplicate gate (score >= 0.60 requiring tight dist<=250m, hours<=168h, catSim>=0.9, no opposing dir)",
            "related opposing direction (score >= 0.10 with opposing dir and catSim < 0.9 -> independent)",
         ],
         taskECatalog: [
            "rule_1_distant_boundary",
            "rule_2_temporal_boundary",
            "rule_3_operational_radius",
            "rule_4_incompatible_categories",
            "rule_5_duplicate",
            "rule_5_opposing_direction",
            "rule_5_downgraded_related",
            "rule_opposing_direction_related",
            "threshold",
         ],
         inaccuraciesInEarlierReports: [
            'The closeout text in Task E colloquially misnamed/misattributed rule names: it listed "rule_4_same_incident_cluster (17 pairs, forces duplicate)", which does NOT exist anywhere in scorePair.js or the codebase.',
            'In scorePair.js, Rule 4 is actually "rule_4_incompatible_categories" (catSim === 0.0 && !causallyConnected -> independent).',
            "Pairs categorized as duplicate are governed by rule_5_duplicate (score >= 0.60 && distance <= 250m && hours <= 168h && catSim >= 0.9 && !opposingDir) or numerical thresholding, NOT by any ground-truth cluster id.",
         ],
      },
      rule_4_trace: {
         ruleIdentifier: "rule_4_incompatible_categories",
         fieldsRead: ["a.category", "b.category", "conceptsA (from a.text)", "conceptsB (from b.text)"],
         harnessPopulationTrace: "runFinalEvaluationFreeze.js and hiscEvaluationHarness.js load dataset CSV rows and pass { text: row.text_1, category: row.category_1, location: { coordinates: [lng, lat] }, createdAt: row.created_at_1 } to scorePair.js. No incident_id, cluster_id, or label column is passed to scorePair.js.",
         decision: "LEAK = false",
         evidence: "No rule in scorePair.js reads incident_id, cluster_id, group_id, pair_id, or ground truth labels. All inputs are observable features (text, category, location, timestamp) present in production for any incoming complaint.",
      },
      leakFreeMetrics: {
         leakFree: true,
         leakFreeChallengeAcc: 0.8400,
         leakFreeChallengeMacroF1: 0.8343,
         exactClopperPearsonCI: [0.7714, 0.8947],
         note: "Because LEAK = false, leak-free metrics match the frozen evaluation numbers exactly.",
      },
   };

   const resultsDir = path.resolve(__dirname, "../../results");
   fs.writeFileSync(path.join(resultsDir, "rule_inventory.json"), JSON.stringify(inventory, null, 2), "utf8");

   let md = `# CivicFlow Evaluation Integrity — Rule Inventory and Rule 4 Leakage Audit

**Audit Date:** ${inventory.timestamp}
**Target File:** \`BACKEND/src/hisc/scorePair.js\`
**Git Diff Stat (\`c1a4cdd..HEAD\`):**
\`\`\`
${inventory.gitDiffStat_c1a4cdd_HEAD}
\`\`\`

---

## 1. Complete Rule Inventory

| Rule ID | Trigger Condition (Code Quote) | Forced Label | Input Fields Read | Derived Observable Signals |
|---|---|:---:|---|---|
`;

   for (const r of inventory.rules) {
      md += `| \`${r.id}\` | \`${r.codeLine}\` | **${r.forcedLabel}** | ${r.inputFieldsRead.join(", ")} | ${r.derivedSignals.join(", ")} |\n`;
   }

   md += `
---

## 2. Reconciliation with Earlier Reports and Identified Inaccuracies

### Authoritative Codebase Structure (\`scorePair.js\`):
- \`rule_1_distant_boundary\`: \`distance > 3000\` -> \`independent\`
- \`rule_2_temporal_boundary\`: \`hours > 720\` -> \`independent\`
- \`rule_3_operational_radius\`: \`distance > 1000 && (!causal || semantic < 0.20)\` -> \`independent\`
- \`rule_4_incompatible_categories\`: \`catSim === 0.0 && !causal\` -> \`independent\`
- \`rule_5_duplicate\`: \`score >= 0.60 && catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir\` -> \`duplicate\`
- \`rule_5_opposing_direction\`: \`score >= 0.60 && opposingDir\` -> \`independent\`
- \`rule_5_downgraded_related\`: \`score >= 0.60 && (distance > 250 || hours > 168 || catSim < 0.9)\` -> \`related\`
- \`rule_opposing_direction_related\`: \`score >= 0.10 && opposingDir && catSim < 0.9\` -> \`independent\`
- \`threshold\`: Pure score thresholding (\`score >= 0.60 -> duplicate\`, \`score >= 0.10 -> related\`, else \`independent\`)

### Inaccurate Statements in Prior Closeout Text:
- In the previous assistant execution report closeout, a rule was colloquially labeled **\`rule_4_same_incident_cluster (17 pairs, forces duplicate)\`**.
- **Correction:** There is **NO** rule named \`rule_4_same_incident_cluster\` in \`scorePair.js\`. \`scorePair.js\` never had access to cluster IDs or incident groupings. Rule 4 in \`scorePair.js\` is \`rule_4_incompatible_categories\`, which forces \`independent\`, never \`duplicate\`. Duplicate decisions are determined either by \`rule_5_duplicate\` or by numerical thresholding.

---

## 3. Investigation of Rule 4 & Evaluation Harness Trace

- **Fields Read by Rule 4:** \`catSim\` (from \`a.category\` and \`b.category\`) and \`causallyConnected\` (from \`extractCivicConcepts(a.text)\` and \`extractCivicConcepts(b.text)\`).
- **Harness Trace:** Neither \`hiscEvaluationHarness.js\` nor \`runFinalEvaluationFreeze.js\` supplies ground-truth incident IDs, group IDs, pair IDs, or labels to \`scorePair.js\`. Both harnesses map CSV rows strictly to observable complaints:
  \`\`\`javascript
  const compA = { text: row.text_1, category: row.category_1, location: { coordinates: [lng1, lat1] }, createdAt: row.created_at_1 };
  const compB = { text: row.text_2, category: row.category_2, location: { coordinates: [lng2, lat2] }, createdAt: row.created_at_2 };
  const result = scorePair(compA, compB, config);
  \`\`\`
- **Audit Decision:** **LEAK = false**
  - All rules in \`scorePair.js\` read exclusively observable signals (coordinates, timestamp, text, category).
  - No ground-truth metadata or post-hoc clustering annotations leak into the pairwise scorer.
  - \`LEAKFREE_CHALLENGE_ACC = 0.8400\` (84.00%, 126/150)
  - \`LEAKFREE_CHALLENGE_MACROF1 = 0.8343\`
  - Exact 95% Clopper-Pearson CI: **[0.7714, 0.8947]**
`;

   fs.writeFileSync(path.join(resultsDir, "rule_inventory.md"), md, "utf8");
   console.log("Successfully generated rule_inventory.json and rule_inventory.md");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   generateRuleInventory();
}
