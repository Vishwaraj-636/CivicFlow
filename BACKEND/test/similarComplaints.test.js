import assert from "node:assert/strict";
import test, { describe, it, before, after } from "node:test";
import http from "node:http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { config } from "../src/config/config.js";
import User from "../src/model/user.model.js";
import Department from "../src/model/department.model.js";
import Complaint from "../src/model/complaint.model.js";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/civicflow_similar_test";

describe("SIMILAR COMPLAINTS ENDPOINT TEST SUITE", () => {
   let server;
   let baseUrl;
   let citizenUser;
   let authToken;
   let testDept;
   let seedNear;
   let seedDistant;

   before(async () => {
      if (mongoose.connection.readyState === 0) {
         await mongoose.connect(TEST_DB_URI);
      }
      await Complaint.deleteMany({});
      await User.deleteMany({});
      await Department.deleteMany({});
      await Complaint.syncIndexes();

      testDept = await Department.create({
         fullname: "Roads and Infrastructure",
         code: "ROADS_TEST",
         categories: ["Roads & Transport", "Drainage & Flooding"],
         isActive: true,
      });

      citizenUser = await User.create({
         fullname: "Chennai Resident",
         email: "resident.test@demo.civicflow.local",
         contact: "9876543210",
         passwordHash: "testpasshash123",
         role: "citizen",
         isActive: true,
      });

      authToken = jwt.sign({ id: citizenUser._id }, config.JWT_SECRET, { expiresIn: "1h" });

      // Seed 1: Near complaint (within 200m) with high similarity (Pothole at Guindy)
      // Reference coord: [80.2184, 13.0067]
      // Near coord: [80.2190, 13.0070] (~75m away)
      seedNear = await Complaint.create({
         complaintId: "CF-SIM-NEAR-01",
         citizenId: citizenUser._id,
         title: "Massive pothole on Guindy main road near metro",
         description: "Large deep crater causing traffic slowdown and two-wheeler danger near Guindy metro station",
         category: "Roads & Transport",
         location: {
            type: "Point",
            coordinates: [80.2190, 13.0070],
         },
         address: "Guindy Main Road, Chennai",
         status: "in_progress",
         priority: "high",
         supportCount: 4,
         slaDurationHours: 48,
         resolutionDeadline: new Date(Date.now() + 48 * 3600000),
      });

      // Seed 2: Distant complaint (>5000m away, at Tambaram: [80.1200, 12.9249])
      seedDistant = await Complaint.create({
         complaintId: "CF-SIM-DIST-01",
         citizenId: citizenUser._id,
         title: "Massive pothole on GST road Tambaram",
         description: "Large deep crater causing severe traffic slowdown near Tambaram bus stand",
         category: "Roads & Transport",
         location: {
            type: "Point",
            coordinates: [80.1200, 12.9249],
         },
         address: "GST Road Tambaram, Chennai",
         status: "submitted",
         priority: "high",
         supportCount: 1,
         slaDurationHours: 48,
         resolutionDeadline: new Date(Date.now() + 48 * 3600000),
      });

      // Seed 3: Another near complaint (slightly less identical text)
      await Complaint.create({
         complaintId: "CF-SIM-NEAR-02",
         citizenId: citizenUser._id,
         title: "Road surface broken and damaged near Guindy station",
         description: "Asphalt washed away with rutting and uneven surface causing vehicle damage",
         category: "Roads & Transport",
         location: {
            type: "Point",
            coordinates: [80.2200, 13.0065],
         },
         address: "Station Road, Guindy, Chennai",
         status: "submitted",
         priority: "medium",
         supportCount: 2,
         slaDurationHours: 72,
         resolutionDeadline: new Date(Date.now() + 72 * 3600000),
      });

      await new Promise((resolve) => {
         server = http.createServer(app);
         server.listen(0, "127.0.0.1", () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            resolve();
         });
      });
   });

   after(async () => {
      if (server) {
         await new Promise((resolve) => server.close(resolve));
      }
      if (mongoose.connection.readyState !== 0) {
         await mongoose.connection.dropDatabase().catch(() => {});
         await mongoose.disconnect();
      }
   });

   describe("1. Authentication & Authorization", () => {
      it("returns 401 Unauthorized when request lacks authorization token", async () => {
         const res = await fetch(`${baseUrl}/api/complaints/similar?lat=13.0067&lng=80.2184&category=Roads%20%26%20Transport&text=pothole`);
         assert.equal(res.status, 401);
      });
   });

   describe("2. Request Validation", () => {
      it("returns 400 Bad Request when required query parameters are missing", async () => {
         const res = await fetch(`${baseUrl}/api/complaints/similar?lat=13.0067&lng=80.2184`, {
            headers: { Authorization: `Bearer ${authToken}` },
         });
         assert.equal(res.status, 400);
         const json = await res.json();
         assert.equal(json.error, "Validation failed");
      });

      it("returns 400 Bad Request when coordinates are invalid", async () => {
         const res = await fetch(`${baseUrl}/api/complaints/similar?lat=999&lng=80.2184&category=Roads%20%26%20Transport&text=pothole`, {
            headers: { Authorization: `Bearer ${authToken}` },
         });
         assert.equal(res.status, 400);
      });

      it("returns 400 Bad Request when category is not supported", async () => {
         const res = await fetch(`${baseUrl}/api/complaints/similar?lat=13.0067&lng=80.2184&category=UnsupportedCategory&text=pothole`, {
            headers: { Authorization: `Bearer ${authToken}` },
         });
         assert.equal(res.status, 400);
      });
   });

   describe("3. Privacy & Response Fields", () => {
      it("returns only allowed public fields and strictly excludes author identity and contact info", async () => {
         const url = `${baseUrl}/api/complaints/similar?lat=13.0067&lng=80.2184&category=Roads%20%26%20Transport&text=${encodeURIComponent("Dangerous pothole near Guindy metro station")}`;
         const res = await fetch(url, {
            headers: { Authorization: `Bearer ${authToken}` },
         });

         assert.equal(res.status, 200);
         const items = await res.json();
         assert.ok(Array.isArray(items));
         assert.ok(items.length > 0, "Should return at least one similar candidate");

         for (const item of items) {
            // Must have required public fields
            assert.ok(item.id || item._id, "Must contain id or _id");
            assert.equal(typeof item.title, "string");
            assert.equal(typeof item.description, "string");
            assert.ok(item.description.length <= 160, "Description must be capped at 160 chars");
            assert.equal(typeof item.category, "string");
            assert.equal(typeof item.status, "string");
            assert.equal(typeof item.distanceMeters, "number");
            assert.ok(item.createdAt);
            assert.equal(typeof item.supportCount, "number");
            assert.equal(typeof item.score, "number");
            assert.ok(["duplicate", "related"].includes(item.label));
            assert.ok(typeof item.features === "object");
            assert.ok(Array.isArray(item.explanation));

            // STRICT PRIVACY RULES: Author identity must NOT be leaked
            assert.equal(item.citizenId, undefined, "citizenId must NOT be exposed");
            assert.equal(item.author, undefined, "author must NOT be exposed");
            assert.equal(item.email, undefined, "email must NOT be exposed");
            assert.equal(item.contact, undefined, "contact must NOT be exposed");
            assert.equal(item.phone, undefined, "phone must NOT be exposed");
         }
      });
   });

   describe("4. Spatial Filtering & Scoring Order", () => {
      it("includes nearby related complaints within 1000m and excludes distant complaints (>1000m)", async () => {
         const url = `${baseUrl}/api/complaints/similar?lat=13.0067&lng=80.2184&category=Roads%20%26%20Transport&text=${encodeURIComponent("Deep pothole and road defect near metro")}`;
         const res = await fetch(url, {
            headers: { Authorization: `Bearer ${authToken}` },
         });

         assert.equal(res.status, 200);
         const items = await res.json();

         // SeedNear is within 100m, should appear
         const hasNear = items.some((i) => i.title.includes("Guindy main road"));
         assert.ok(hasNear, "Near complaint must appear in similar results");

         // SeedDistant is >5000m away, must NOT appear
         const hasDistant = items.some((i) => i.title.includes("Tambaram"));
         assert.equal(hasDistant, false, "Distant complaint (>1000m) must NOT appear");

         // Check ordering: scores must be in descending order
         for (let i = 1; i < items.length; i++) {
            assert.ok(items[i - 1].score >= items[i].score, "Results must be sorted by score descending");
         }
      });
   });

   describe("5. submittedDespiteSimilar field in Complaint Creation", () => {
      it("accepts and persists submittedDespiteSimilar when creating a complaint", async () => {
         const res = await fetch(`${baseUrl}/api/complaints`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
               title: "Water pipeline leakage near school gate",
               description: "Drinking water pipeline has broken causing continuous water wastage",
               category: "Drainage & Flooding",
               location: {
                  type: "Point",
                  coordinates: [80.2200, 13.0080],
               },
               address: "School Road, Guindy, Chennai",
               submittedDespiteSimilar: true,
            }),
         });

         assert.equal(res.status, 201);
         const created = await res.json();
         assert.equal(created.submittedDespiteSimilar, true);

         // Verify directly from the database
         const stored = await Complaint.findById(created._id);
         assert.equal(stored.submittedDespiteSimilar, true);
      });
   });
});
