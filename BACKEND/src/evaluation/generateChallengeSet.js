import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRNG, seededShuffle } from "./makeSplits.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import challenge definition dataset
import { challengePairs } from "./challengeDataDefinitions.js";

/**
 * Validates the 150 synthetic challenge pairs
 * @param {typeof challengePairs} pairs 
 */
export function validateChallengeSet(pairs) {
   if (pairs.length !== 150) {
      throw new Error(`Expected exactly 150 challenge pairs, got ${pairs.length}`);
   }
   const validLabels = new Set(["duplicate", "related", "independent"]);
   const labelCounts = { duplicate: 0, related: 0, independent: 0 };
   const categoryCounts = {};
   const seenPairIds = new Set();
   const seenComplaintIds = new Set();

   for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      if (!p.pair_id || seenPairIds.has(p.pair_id)) {
         throw new Error(`Invalid or duplicate pair_id: ${p.pair_id} at index ${i}`);
      }
      seenPairIds.add(p.pair_id);

      if (seenComplaintIds.has(p.complaint_a_id) || seenComplaintIds.has(p.complaint_b_id)) {
         throw new Error(`Complaint ID reused at pair ${p.pair_id}`);
      }
      seenComplaintIds.add(p.complaint_a_id);
      seenComplaintIds.add(p.complaint_b_id);

      if (!validLabels.has(p.label)) {
         throw new Error(`Invalid label: ${p.label} at pair ${p.pair_id}`);
      }
      labelCounts[p.label]++;

      if (!p.challenge_category) {
         throw new Error(`Missing challenge_category at pair ${p.pair_id}`);
      }
      categoryCounts[p.challenge_category] = (categoryCounts[p.challenge_category] || 0) + 1;

      // Duplicate pairs must have incident_id; related/independent must have empty incident_id
      if (p.label === "duplicate" && (!p.incident_id || !p.incident_id.trim())) {
         throw new Error(`Duplicate pair ${p.pair_id} must have non-empty incident_id`);
      }
      if (p.label !== "duplicate" && p.incident_id && p.incident_id.trim() !== "") {
         throw new Error(`Non-duplicate pair ${p.pair_id} should have empty incident_id`);
      }

      if (!p.rationale || p.rationale.trim().length < 10) {
         throw new Error(`Missing or inadequate rationale for pair ${p.pair_id}`);
      }
   }

   if (labelCounts.duplicate !== 50 || labelCounts.related !== 50 || labelCounts.independent !== 50) {
      throw new Error(`Expected balanced 50/50/50 class distribution, got: ${JSON.stringify(labelCounts)}`);
   }

   return { labelCounts, categoryCounts };
}

/**
 * Audits challenge set vocabulary overlap against HISC synonym dictionary
 * @param {typeof challengePairs} pairs 
 */
export function auditSynonymNovelty(pairs) {
   const synonymGroups = [
      ["pothole", "crater", "road damage", "road defect"],
      ["streetlight", "street lamp", "lamp post", "light pole"],
      ["garbage", "waste", "trash", "rubbish"],
      ["leak", "leakage", "burst", "broken pipe"],
      ["flood", "flooding", "waterlogging", "inundation"],
   ];
   const dictionaryTokens = new Set(synonymGroups.flat().flatMap((w) => w.split(/\s+/)));

   const tokenize = (text) => String(text).toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

   const challengeTokens = new Set();
   let dictionaryMatchesCount = 0;
   let novelTokensCount = 0;

   for (const p of pairs) {
      const tokensA = tokenize(p.complaint_a);
      const tokensB = tokenize(p.complaint_b);
      for (const t of [...tokensA, ...tokensB]) {
         challengeTokens.add(t);
         if (dictionaryTokens.has(t)) {
            dictionaryMatchesCount++;
         } else {
            novelTokensCount++;
         }
      }
   }

   const uniqueNovelTokens = [...challengeTokens].filter((t) => !dictionaryTokens.has(t));
   const uniqueDictionaryTokens = [...challengeTokens].filter((t) => dictionaryTokens.has(t));

   return {
      totalUniqueTokens: challengeTokens.size,
      novelUniqueTokensCount: uniqueNovelTokens.length,
      dictionaryUniqueTokensCount: uniqueDictionaryTokens.length,
      noveltyPercentage: Number(((uniqueNovelTokens.length / challengeTokens.size) * 100).toFixed(2)),
      sampleNovelKeywords: uniqueNovelTokens.slice(0, 30),
      matchedDictionaryKeywords: uniqueDictionaryTokens,
   };
}

/**
 * Converts pairs to CSV string
 * @param {typeof challengePairs} pairs 
 * @returns {string}
 */
export function formatCSV(pairs) {
   const headers = [
      "pair_id", "complaint_a_id", "complaint_b_id",
      "complaint_a", "complaint_b",
      "category_a", "category_b",
      "latitude_a", "longitude_a",
      "latitude_b", "longitude_b",
      "timestamp_a", "timestamp_b",
      "label", "incident_id"
   ];

   const escapeCSV = (val) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
         return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
   };

   const lines = [headers.join(",")];
   for (const p of pairs) {
      lines.push(headers.map((h) => escapeCSV(p[h])).join(","));
   }
   return lines.join("\n");
}

/**
 * Generates the deterministic 50-pair review sample
 * @param {typeof challengePairs} pairs 
 * @param {number} [seed=42] 
 */
export function sampleReviewPairs(pairs, seed = 42) {
   const rng = createRNG(seed);
   const shuffled = seededShuffle(pairs, rng);
   const sampled = shuffled.slice(0, 50).map((p, idx) => ({
      sample_index: idx + 1,
      pair_id: p.pair_id,
      challenge_category: p.challenge_category,
      category_a: p.category_a,
      complaint_a: p.complaint_a,
      category_b: p.category_b,
      complaint_b: p.complaint_b,
      location_a: { latitude: Number(p.latitude_a), longitude: Number(p.longitude_a) },
      location_b: { latitude: Number(p.latitude_b), longitude: Number(p.longitude_b) },
      timestamp_a: p.timestamp_a,
      timestamp_b: p.timestamp_b,
      proposed_label: p.label,
      incident_id: p.incident_id || null,
      labeling_rationale: p.rationale,
      review_status: "PENDING_USER_VERIFICATION",
   }));
   return sampled;
}

// Main execution when run directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   const outDir = path.resolve(__dirname, "../../data");
   if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

   const validation = validateChallengeSet(challengePairs);
   const audit = auditSynonymNovelty(challengePairs);
   const csvContent = formatCSV(challengePairs);
   const csvPath = path.join(outDir, "synthetic_challenge_set_150.csv");
   fs.writeFileSync(csvPath, csvContent, "utf8");

   const sample = sampleReviewPairs(challengePairs, 42);
   const samplePath = path.join(outDir, "challenge_review_sample_50.json");
   fs.writeFileSync(samplePath, JSON.stringify(sample, null, 2), "utf8");

   console.log(`Saved synthetic challenge set to: ${csvPath}`);
   console.log(`Saved 50-pair review sample to: ${samplePath}`);
   console.log("Validation:", validation);
   console.log("Vocabulary Novelty Audit:", {
      totalUniqueTokens: audit.totalUniqueTokens,
      novelUniqueTokensCount: audit.novelUniqueTokensCount,
      noveltyPercentage: `${audit.noveltyPercentage}%`,
      dictionaryUniqueTokensCount: audit.dictionaryUniqueTokensCount,
   });
   console.log("\nSampled 50 Pair IDs for manual inspection:");
   console.log(sample.map((s) => s.pair_id).join(", "));
}
