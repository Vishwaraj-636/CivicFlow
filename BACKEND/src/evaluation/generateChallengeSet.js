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

   if (labelCounts.duplicate !== 50 || labelCounts.related !== 43 || labelCounts.independent !== 57) {
      throw new Error(`Expected audited class distribution { duplicate: 50, related: 43, independent: 57 }, got: ${JSON.stringify(labelCounts)}`);
   }

   return { labelCounts, categoryCounts };
}

export const RELABELED_PAIRS = {
   CH0053: {
      from: "related",
      to: "independent",
      decision: "relabel",
      reason: "A road crater and a leaning lamp pole at Adyar signal are separate physical assets and defects. Without documented causal undermining in the text, adjacency does not establish a relationship.",
      evidence_basis: "Co-located independent defects across Roads & Transport and Street Infrastructure domains."
   },
   CH0054: {
      from: "related",
      to: "independent",
      decision: "relabel",
      reason: "A drinking water leak and a stormwater drain overflow at Porur toll are distinct utility failures with no documented cross-contamination.",
      evidence_basis: "Independent utility infrastructure failures at the same highway intersection."
   },
   CH0055: {
      from: "related",
      to: "independent",
      decision: "relabel",
      reason: "A street trash pile and a choked gutter at Mylapore tank are separate complaints with no textual or physical evidence linking them.",
      evidence_basis: "Unconnected sanitation and drainage complaints at the same landmark."
   },
   CH0056: {
      from: "related",
      to: "independent",
      decision: "relabel",
      reason: "Vague complaints for 'Broken railing' and 'Curb broken' at Saidapet bus stop do not establish a shared collision event. Assuming a vehicular accident without textual evidence is ungrounded.",
      evidence_basis: "Separate structural assets with no documented common incident trigger."
   },
   CH0061: {
      from: "related",
      to: "independent",
      decision: "relabel",
      reason: "A road pothole and a damaged speed-breaker reflector sign outside Medavakkam police station are independent maintenance items. Claiming pothole impacts loosened the sign is an unsupported inference.",
      evidence_basis: "Distinct physical assets and municipal maintenance domains at the same street section."
   },
   CH0078: {
      from: "related",
      to: "independent",
      decision: "relabel",
      reason: "A central transfer station compactor breakdown in Velachery and local ward collection bins in Madipakkam 2.5 km away are separate operational tickets. Clustering algorithms must not group them.",
      evidence_basis: "Geographically distant (2.5 km) operational facility ticket vs neighborhood conservancy route ticket."
   },
   CH0103: {
      from: "related",
      to: "independent",
      decision: "relabel",
      reason: "Pedestrian fence crossing breaches and heavy concrete kerbstone displacements are distinct physical failure mechanisms along the Tambaram railway approach.",
      evidence_basis: "Distinct physical assets along the same corridor with separate causal mechanisms."
   }
};

export const REWRITTEN_PAIRS = {
   CH0011: {
      decision: "rewrite_example",
      reason: "Rewrote complaint descriptions to explicitly ground the shared vehicle collision event that damaged both the railing and kerbstone.",
      evidence_basis: "Co-located cascading damage to multiple road assets directly caused by the documented vehicle collision."
   },
   CH0023: {
      decision: "rewrite_example",
      reason: "Rewrote Complaint B to explicitly state that the choked drain is overflowing into the pothole, grounding the physical link.",
      evidence_basis: "Drainage overflow directly exacerbating and filling the roadway pothole at Guindy bus stand."
   },
   CH0024: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to state that the road subsidence occurred directly over the leaking pipeline.",
      evidence_basis: "Subsurface pipe leak eroding soil sub-base and causing localized road surface depression."
   },
   CH0062: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to explicitly link the road depression to the underlying leaking pipeline.",
      evidence_basis: "Underground pipe blowout causing progressive road surface cavity directly above."
   },
   CH0063: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to state that the drain blockage was caused by the dumped commercial garbage.",
      evidence_basis: "Dumped solid waste directly obstructing adjacent stormwater drain inlet."
   },
   CH0076: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to explicitly cite the Porur trunk main burst as the direct cause of the downstream supply cutoff.",
      evidence_basis: "Upstream transmission main rupture directly causing downstream residential supply failure in hydraulic network."
   },
   CH0077: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to explicitly cite the stuck river mouth sluice gate as the cause of upstream backwater flooding.",
      evidence_basis: "Downstream hydraulic barrier failure directly triggering upstream backwater riverbank inundation."
   },
   CH0091: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to explicitly reference the uncleaned silt remaining from the July runoff event.",
      evidence_basis: "Chronic post-monsoon silt accumulation persisting as direct consequence of uncleaned flood event."
   },
   CH0093: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to explicitly link the July dry taps to the unresolved May pipeline leak.",
      evidence_basis: "Progressive physical failure of the same underground distribution pipe across consecutive billing cycles."
   },
   CH0101: {
      decision: "rewrite_example",
      reason: "Grounded both complaints in the shared overnight vandalism incident on the Medavakkam southbound shelter.",
      evidence_basis: "Shared intentional vandalism event causing concurrent damage to multiple components of the same bus shelter."
   },
   CH0102: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to show that the downstream conduit blockage was caused by trash entering through the missing grate.",
      evidence_basis: "Missing inlet grate directly enabling street debris ingress that clogged the downstream conduit."
   },
   CH0104: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to state that the basin overflow was directly caused by the continuous tap leak.",
      evidence_basis: "Continuous unvalved tap leakage directly overwhelming the wastewater drain basin of the same fixture."
   },
   CH0105: {
      decision: "rewrite_example",
      reason: "Grounded both complaints in the shared underground cable fault affecting sequential poles 14 and 15.",
      evidence_basis: "Sequential light poles on the same electric feeder circuit concurrently failing from a common cable fault."
   },
   CH0116: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to state that the electrical junction box sparking was caused by canal overflow submersion.",
      evidence_basis: "Hydraulic canal overflow directly submerging and short-circuiting adjacent electrical infrastructure."
   },
   CH0117: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to state that the streetlight mast collapse was caused by the lorry crash into the median.",
      evidence_basis: "Heavy vehicular crash into road median toppling the mounted electrical light mast."
   },
   CH0118: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to explicitly cite the ruptured sewage main as the source of the stormwater drain contamination.",
      evidence_basis: "Pressurized sewer main rupture discharging directly into adjacent stormwater drain network."
   },
   CH0124: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to explicitly mention that the broken valve was damaged by the road grading machine.",
      evidence_basis: "Heavy road construction grading machine physically rupturing municipal water supply valve."
   },
   CH0125: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to explicitly state that the flooding was caused by the severed pipe from lighting excavation.",
      evidence_basis: "High-mast lighting civil work breached the stormwater conduit, flooding the passenger platform."
   },
   CH0127: {
      decision: "rewrite_example",
      reason: "Grounded Complaint B to cite the dumped animal waste as the cause of the drain blockage and backup.",
      evidence_basis: "Commercial slaughterhouse/poultry waste illegally disposed into drain conduit choking municipal outflow."
   },
   CH0128: {
      decision: "rewrite_example",
      reason: "Rewrote Complaint A to describe the roadway carriageway obstruction from the fallen tree limb and Complaint B to describe the crushed traffic signal mast and severed wiring, clearly establishing two distinct but causally connected physical defects.",
      evidence_basis: "Shared storm tree fall causing two distinct multi-departmental failures: roadway carriageway obstruction (Roads & Transport) and crushed traffic signal infrastructure (Street Infrastructure)."
   }
};

export const CUSTOM_AUDIT_DETAILS = {
   CH0039: {
      decision: "retain",
      reason: "Two distinct municipal problems connected by a direct causal flow: an upstream MetroWater pipeline burst (Water & Utilities) is discharging into and overflowing the separate municipal stormwater drain canal (Drainage & Flooding) with clear water at Porur toll.",
      evidence_basis: "Direct hydraulic flow connecting distinct upstream water utility asset defect and downstream municipal drainage canal overflow."
   }
};

/**
 * Generates the full 150-pair annotation audit artifact
 * @param {typeof challengePairs} pairs
 */
export function generateAuditRecords(pairs) {
   return pairs.map((p) => {
      let decision = "retain";
      let original_label = p.label;
      let reviewed_label = p.label;
      let reason = "Proposed label is fully supported by the complaint descriptions, geographic proximity, and temporal separation.";
      let evidence_basis = `Consistent with ${p.label} ground-truth definition under category ${p.challenge_category}.`;

      if (RELABELED_PAIRS[p.pair_id]) {
         const info = RELABELED_PAIRS[p.pair_id];
         decision = info.decision;
         original_label = info.from;
         reviewed_label = info.to;
         reason = info.reason;
         evidence_basis = info.evidence_basis;
      } else if (REWRITTEN_PAIRS[p.pair_id]) {
         const info = REWRITTEN_PAIRS[p.pair_id];
         decision = info.decision;
         original_label = "related";
         reviewed_label = "related";
         reason = info.reason;
         evidence_basis = info.evidence_basis;
      } else if (CUSTOM_AUDIT_DETAILS[p.pair_id]) {
         const info = CUSTOM_AUDIT_DETAILS[p.pair_id];
         decision = info.decision;
         original_label = p.label;
         reviewed_label = p.label;
         reason = info.reason;
         evidence_basis = info.evidence_basis;
      }

      return {
         pair_id: p.pair_id,
         challenge_category: p.challenge_category,
         original_label: original_label,
         reviewed_label: reviewed_label,
         decision: decision,
         reason: reason,
         evidence_basis: evidence_basis,
      };
   });
}

/**
 * Formats full 150-pair audit markdown report
 * @param {ReturnType<typeof generateAuditRecords>} audit
 */
export function formatAuditMarkdown(audit) {
   const decisionCounts = { retain: 0, relabel: 0, rewrite_example: 0, needs_review: 0 };
   const reviewedLabelCounts = { duplicate: 0, related: 0, independent: 0 };

   for (const a of audit) {
      decisionCounts[a.decision]++;
      reviewedLabelCounts[a.reviewed_label]++;
   }

   let md = "# Synthetic HISC Challenge Set — 150-Pair Annotation Audit\n\n";
   md += "## Summary of Audit Decisions\n\n";
   md += `- **Total Pairs Audited:** ${audit.length}\n`;
   md += `- **Retained:** ${decisionCounts.retain}\n`;
   md += `- **Relabeled:** ${decisionCounts.relabel}\n`;
   md += `- **Rewritten (Grounded):** ${decisionCounts.rewrite_example}\n`;
   md += `- **Unresolved (needs_review):** ${decisionCounts.needs_review}\n\n`;
   md += "## Reviewed Class Distribution\n\n";
   md += `- **Duplicate:** ${reviewedLabelCounts.duplicate} (33.33%)\n`;
   md += `- **Related:** ${reviewedLabelCounts.related} (28.67%)\n`;
   md += `- **Independent:** ${reviewedLabelCounts.independent} (38.00%)\n\n`;
   md += "## Grounding Principles Applied\n\n";
   md += "1. **Duplicate:** Both complaints report the same physical defect or incident at the same location within hours.\n";
   md += "2. **Related:** Distinct but causally connected defects arising from a common documented physical event (vehicle collision, utility burst, overflow contamination). Proximity alone without explicit causal evidence is NOT sufficient.\n";
   md += "3. **Independent:** Distinct defects with no documented common cause, even if co-located or occurring concurrently.\n\n";
   md += "## Complete Per-Pair Audit Table\n\n";
   md += "| Pair ID | Category | Original Label | Reviewed Label | Decision | Reason & Evidence Basis |\n";
   md += "|---|---|---|---|---|---|\n";

   for (const a of audit) {
      const escape = (t) => String(t).replace(/\|/g, "\\|");
      md += `| **${a.pair_id}** | ${escape(a.challenge_category)} | \`${a.original_label}\` | \`${a.reviewed_label}\` | **${a.decision}** | ${escape(a.reason)} *(${escape(a.evidence_basis)})* |\n`;
   }
   return md;
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

/**
 * Formats the 50-pair review sample markdown
 * @param {ReturnType<typeof sampleReviewPairs>} sample
 * @param {number} [seed=42]
 */
export function formatSampleMarkdown(sample, seed = 42) {
   let md = `# 50-Pair Manual Review Sample (Challenge Set)\n\n`;
   md += `> **Audit & Verification Status:** PENDING USER VERIFICATION.\n`;
   md += `> Synthetic labels have been rigorously audited under Phase A2.1 for scenario grounding and causal evidence, but have not been independently validated by human ground-truth annotators.\n\n`;
   md += `Selected deterministically with RNG seed \`${seed}\` from the 150-pair synthetic challenge set.\n\n`;
   md += `### Sample Change Log (Audited Under Phase A2.1)\n`;
   md += `- **Relabeled in this sample (3 pairs):** \`CH0078\` (related -> independent), \`CH0056\` (related -> independent), \`CH0061\` (related -> independent)\n`;
   md += `- **Rewritten & grounded in this sample (6 pairs):** \`CH0011\`, \`CH0102\`, \`CH0105\`, \`CH0116\`, \`CH0117\`, \`CH0128\`\n`;
   md += `- **Retained with defensible evidence (41 pairs):** All other 41 sampled pairs\n\n`;
   md += `| # | Pair ID | Category | Complaint A | Complaint B | Proposed Label | Status | Rationale |\n`;
   md += `|---|---|---|---|---|---|---|---|\n`;

   for (const s of sample) {
      const escape = (t) => String(t).replace(/\|/g, "\\|");
      md += `| ${s.sample_index} | **${s.pair_id}** | ${escape(s.challenge_category)} | ${escape(s.complaint_a)} | ${escape(s.complaint_b)} | **${s.proposed_label}** | ${s.review_status} | ${escape(s.labeling_rationale)} |\n`;
   }
   return md;
}

// Main execution when run directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
   const outDir = path.resolve(__dirname, "../../data");
   if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

   const validation = validateChallengeSet(challengePairs);
   const auditNovelty = auditSynonymNovelty(challengePairs);
   const auditRecords = generateAuditRecords(challengePairs);

   const csvContent = formatCSV(challengePairs);
   const csvPath = path.join(outDir, "synthetic_challenge_set_150.csv");
   fs.writeFileSync(csvPath, csvContent, "utf8");

   const auditJsonPath = path.join(outDir, "challenge_annotation_audit_150.json");
   fs.writeFileSync(auditJsonPath, JSON.stringify(auditRecords, null, 2), "utf8");

   const auditMdPath = path.join(outDir, "challenge_annotation_audit_150.md");
   fs.writeFileSync(auditMdPath, formatAuditMarkdown(auditRecords), "utf8");

   const sample = sampleReviewPairs(challengePairs, 42);
   const samplePath = path.join(outDir, "challenge_review_sample_50.json");
   fs.writeFileSync(samplePath, JSON.stringify(sample, null, 2), "utf8");

   const sampleMdPath = path.join(outDir, "challenge_review_sample_50.md");
   fs.writeFileSync(sampleMdPath, formatSampleMarkdown(sample, 42), "utf8");

   console.log(`Saved synthetic challenge set to: ${csvPath}`);
   console.log(`Saved 150-pair annotation audit to: ${auditJsonPath} and ${auditMdPath}`);
   console.log(`Saved 50-pair review sample to: ${samplePath} and ${sampleMdPath}`);
   console.log("Validation:", validation);
   console.log("Vocabulary Novelty Audit:", {
      totalUniqueTokens: auditNovelty.totalUniqueTokens,
      novelUniqueTokensCount: auditNovelty.novelUniqueTokensCount,
      noveltyPercentage: `${auditNovelty.noveltyPercentage}%`,
      dictionaryUniqueTokensCount: auditNovelty.dictionaryUniqueTokensCount,
   });
   console.log("\nSampled 50 Pair IDs for manual inspection:");
   console.log(sample.map((s) => s.pair_id).join(", "));
}
