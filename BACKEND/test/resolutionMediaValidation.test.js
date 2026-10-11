import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { validateComplaintResolution } from "../src/validator/complaint.validator.js";

async function runValidation(body) {
   const req = { body };
   let responseStatus = null;
   let responseBody = null;
   let nextCalled = false;

   const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseBody = data; return this; },
   };

   // Run all validation chains before the final validateRequest middleware
   for (let i = 0; i < validateComplaintResolution.length - 1; i++) {
      await validateComplaintResolution[i].run(req);
   }

   // Run final validateRequest middleware
   const validateRequestMiddleware = validateComplaintResolution[validateComplaintResolution.length - 1];
   validateRequestMiddleware(req, res, () => {
      nextCalled = true;
   });

   return { nextCalled, responseStatus, responseBody };
}

describe("Resolution Media Validation", () => {
   test("accepts valid resolution payload with well-formed resolutionMedia array", async () => {
      const payload = {
         resolutionDescription: "Replaced blown streetlight fuse and verified illumination.",
         resolutionMedia: [
            {
               fileId: "media_img_001",
               url: "https://ik.imagekit.io/civicflow/streetlight_fixed.jpg",
               type: "image/jpeg",
            },
            {
               fileId: "media_vid_002",
               url: "https://ik.imagekit.io/civicflow/streetlight_test.mp4",
               type: "video/mp4",
            },
         ],
      };

      const result = await runValidation(payload);
      assert.equal(result.nextCalled, true);
      assert.equal(result.responseStatus, null);
   });

   test("accepts resolution payload without optional resolutionMedia", async () => {
      const payload = {
         resolutionDescription: "Cleaned and cleared the debris along the pedestrian walkway.",
      };

      const result = await runValidation(payload);
      assert.equal(result.nextCalled, true);
      assert.equal(result.responseStatus, null);
   });

   test("rejects resolutionMedia when it is not an array", async () => {
      const payload = {
         resolutionDescription: "Fixed the road pothole.",
         resolutionMedia: "https://ik.imagekit.io/civicflow/pothole.jpg",
      };

      const result = await runValidation(payload);
      assert.equal(result.nextCalled, false);
      assert.equal(result.responseStatus, 400);
      const errors = result.responseBody.errors.map((e) => e.msg);
      assert.ok(errors.includes("Resolution media must be an array"));
   });

   test("rejects resolutionMedia items missing fileId or with empty fileId", async () => {
      const payload = {
         resolutionDescription: "Fixed water leakage.",
         resolutionMedia: [
            {
               fileId: "   ",
               url: "https://ik.imagekit.io/civicflow/water_fixed.jpg",
               type: "image/jpeg",
            },
         ],
      };

      const result = await runValidation(payload);
      assert.equal(result.nextCalled, false);
      assert.equal(result.responseStatus, 400);
      const errors = result.responseBody.errors.map((e) => e.msg);
      assert.ok(errors.some((msg) => msg.includes("Resolution media must contain { fileId, url, type }")));
   });

   test("rejects resolutionMedia items with invalid URL", async () => {
      const payload = {
         resolutionDescription: "Pothole patched.",
         resolutionMedia: [
            {
               fileId: "file_123",
               url: "ftp://invalid-scheme.com/img.png",
               type: "image/png",
            },
         ],
      };

      const result = await runValidation(payload);
      assert.equal(result.nextCalled, false);
      assert.equal(result.responseStatus, 400);
      const errors = result.responseBody.errors.map((e) => e.msg);
      assert.ok(errors.some((msg) => msg.includes("Resolution media must contain { fileId, url, type }")));
   });

   test("rejects resolutionMedia items with unsupported media type", async () => {
      const payload = {
         resolutionDescription: "Document submitted.",
         resolutionMedia: [
            {
               fileId: "file_456",
               url: "https://ik.imagekit.io/civicflow/report.pdf",
               type: "application/pdf",
            },
         ],
      };

      const result = await runValidation(payload);
      assert.equal(result.nextCalled, false);
      assert.equal(result.responseStatus, 400);
      const errors = result.responseBody.errors.map((e) => e.msg);
      assert.ok(errors.some((msg) => msg.includes("Resolution media must contain { fileId, url, type }")));
   });

   test("rejects malformed array entries such as primitive values or nulls", async () => {
      const payload = {
         resolutionDescription: "Issue resolved.",
         resolutionMedia: [null, 123, "random string"],
      };

      const result = await runValidation(payload);
      assert.equal(result.nextCalled, false);
      assert.equal(result.responseStatus, 400);
      const errors = result.responseBody.errors.map((e) => e.msg);
      assert.ok(errors.some((msg) => msg.includes("Resolution media must contain { fileId, url, type }")));
   });
});
