import assert from "node:assert/strict";
import test from "node:test";
import { scoreComplaintPriority } from "../src/service/priorityScoring.service.js";
import {
   calculateTextSimilarity,
   classifySimilarity,
   calculateSimilarityScore,
} from "../src/service/complaintSimilarity.service.js";
import { calculateResolutionDeadline, getSlaHours } from "../src/service/sla.service.js";
import { shouldEscalateComplaint } from "../src/service/complaintEscalation.service.js";

test("priority scoring escalates safety-critical complaints", () => {
   assert.equal(scoreComplaintPriority({ category: "Roads & Transport", title: "Road collapse", description: "Dangerous open crater" }), "urgent");
   assert.equal(scoreComplaintPriority({ category: "Waste & Cleanliness", title: "Overflowing bins", description: "Waste collection missed" }), "high");
   assert.equal(scoreComplaintPriority({ category: "Parks & Recreation", title: "Faded sign", description: "Sign needs repainting" }), "low");
});

test("duplicate classification uses normalized complaint text and weighted signals", () => {
   const textScore = calculateTextSimilarity("Large pothole on Main Road", "Potholes on Main road");
   const score = calculateSimilarityScore({ categoryScore: 1, locationScore: 0.95, textScore });
   assert.ok(textScore > 0.5);
   assert.equal(classifySimilarity(score), "duplicate");
   assert.equal(classifySimilarity(0.2), "independent");
});

test("priority and duplicate algorithms handle empty input safely", () => {
   assert.equal(scoreComplaintPriority({}), "low");
   assert.equal(calculateTextSimilarity("", ""), 0);
   assert.equal(classifySimilarity(0), "independent");
});

test("SLA deadlines get shorter as priority increases", () => {
   const createdAt = new Date("2026-01-01T00:00:00.000Z");
   assert.equal(getSlaHours("urgent"), 24);
   assert.equal(getSlaHours("low"), 168);
   assert.ok(calculateResolutionDeadline("urgent", createdAt) < calculateResolutionDeadline("low", createdAt));
   assert.equal(calculateResolutionDeadline("high", createdAt).toISOString(), "2026-01-03T00:00:00.000Z");
});

test("automatic escalation only applies to unresolved overdue complaints", () => {
   const now = new Date("2026-01-02T00:00:00.000Z");
   assert.equal(shouldEscalateComplaint({ status: "in_progress", resolutionDeadline: "2026-01-01T00:00:00.000Z" }, now), true);
   assert.equal(shouldEscalateComplaint({ status: "resolved", resolutionDeadline: "2026-01-01T00:00:00.000Z" }, now), false);
   assert.equal(shouldEscalateComplaint({ status: "submitted", escalated: true, resolutionDeadline: "2026-01-01T00:00:00.000Z" }, now), false);
   assert.equal(shouldEscalateComplaint({ status: "submitted", resolutionDeadline: "2026-01-03T00:00:00.000Z" }, now), false);
});
