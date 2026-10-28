import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { scorePair, determineRuleFired } from "../src/hisc/scorePair.js";
import { HISC_EVAL_PRESET, DEFAULT_HISC_CONFIG } from "../src/hisc/config.js";
import {
   RULE_DEFINITIONS,
   classifyWithAblation,
   countRulesFired,
   runRuleAttributionStudy,
} from "../src/evaluation/ruleAblation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Task E — Rule Attribution and Ablation Study", () => {
   describe("1. Gate E1: Nonbehavioral Instrumentation Proof", () => {
      it("preserves exact enumerable contract keys on scorePair result", () => {
         const compA = {
            text: "Pothole on Main Road",
            category: "Roads & Transport",
            location: { coordinates: [80.1, 13.0] },
            createdAt: "2026-03-01T10:00:00Z",
         };
         const compB = {
            text: "Road crater on Main Road",
            category: "Roads & Transport",
            location: { coordinates: [80.1001, 13.0001] },
            createdAt: "2026-03-01T11:00:00Z",
         };

         const result = scorePair(compA, compB);

         // Strictly verify enumerable keys
         const keys = Object.keys(result).sort();
         assert.deepEqual(keys, ["explanation", "features", "label", "score"]);

         // Verify rule_fired is accessible as non-enumerable diagnostic
         assert.ok(typeof result.rule_fired === "string");
         assert.equal(result.rule_fired, determineRuleFired(result, DEFAULT_HISC_CONFIG, result.context));
      });

      it("identifies rule decision paths correctly across scenarios", () => {
         // Distant boundary (>3000m)
         const distantA = { text: "Pothole", category: "Roads & Transport", location: { coordinates: [80.1, 13.0] } };
         const distantB = { text: "Pothole", category: "Roads & Transport", location: { coordinates: [80.5, 13.5] } };
         const resDistant = scorePair(distantA, distantB);
         assert.equal(resDistant.label, "independent");
         assert.equal(resDistant.rule_fired, "rule_1_distant_boundary");

         // Incompatible category without causal link (within same hour and 100m)
         const incompA = {
            text: "Garbage pile",
            category: "Waste & Cleanliness",
            location: { coordinates: [80.1, 13.0] },
            createdAt: "2026-03-01T10:00:00Z",
         };
         const incompB = {
            text: "Dark street lamp",
            category: "Street Infrastructure",
            location: { coordinates: [80.1001, 13.0001] },
            createdAt: "2026-03-01T10:30:00Z",
         };
         const resIncomp = scorePair(incompA, incompB);
         assert.equal(resIncomp.label, "independent");
         assert.equal(resIncomp.rule_fired, "rule_4_incompatible_categories");
      });
   });

   describe("2. Gate E2: Rule Counts and Leave-One-Rule-Out Ablation", () => {
      it("counts rules fired on test inputs and verifies all defined rules are accounted for", () => {
         const dummyPairs = [
            {
               complaint_a: { text: "Road damage", category: "Roads & Transport", location: { coordinates: [80.1, 13.0] } },
               complaint_b: { text: "Broken asphalt", category: "Roads & Transport", location: { coordinates: [80.1001, 13.0001] } },
            },
         ];
         const counts = countRulesFired(dummyPairs, HISC_EVAL_PRESET);
         for (const key of Object.keys(RULE_DEFINITIONS)) {
            assert.ok(typeof counts[key] === "number");
         }
      });

      it("runs full rule attribution study and produces verified artifacts without touching test set", () => {
         const study = runRuleAttributionStudy();

         // Check rule activations
         assert.equal(study.ruleActivations.val.count, 80);
         assert.equal(study.ruleActivations.challenge.count, 150);

         // Check ablations exist for validation and challenge
         assert.ok(study.ablations.validation.full_hisc);
         assert.ok(study.ablations.validation.ablate_rule_1);
         assert.ok(study.ablations.validation.ablate_all_rules);

         assert.ok(study.ablations.challenge.full_hisc);
         assert.ok(study.ablations.challenge.ablate_rule_5);
         assert.ok(study.ablations.challenge.ablate_all_rules);

         // Verify saved artifacts on disk
         const jsonPath = path.resolve(__dirname, "../results/rule_ablation.json");
         const mdPath = path.resolve(__dirname, "../results/rule_ablation.md");

         assert.ok(fs.existsSync(jsonPath), "rule_ablation.json should exist");
         assert.ok(fs.existsSync(mdPath), "rule_ablation.md should exist");

         const saved = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
         assert.equal(saved.ruleActivations.challenge.count, 150);
      });
   });
});
