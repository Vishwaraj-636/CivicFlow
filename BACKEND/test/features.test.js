import assert from "node:assert/strict";
import test from "node:test";
import { scoreComplaintPriority } from "../src/service/priorityScoring.service.js";
import {
   calculateTextSimilarity,
   classifySimilarity,
   calculateSimilarityScore,
} from "../src/service/complaintSimilarity.service.js";

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
