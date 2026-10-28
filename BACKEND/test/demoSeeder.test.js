import assert from "node:assert/strict";
import test, { describe, it, before, after } from "node:test";
import mongoose from "mongoose";
import { generateDemoDataset, seedDemoDatabase } from "../src/scripts/seedDemo.js";
import User from "../src/model/user.model.js";
import Complaint from "../src/model/complaint.model.js";
import IncidentCluster from "../src/model/incidentCluster.model.js";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/civicflow_demo_seeder_test";

describe("DEMO DATA SEEDER TEST SUITE", () => {
   describe("1. Pure Generator Tests", () => {
      it("generates exact required counts of users and complaints", () => {
         const data = generateDemoDataset({ seed: 42 });
         assert.equal(typeof data.admin, "object");
         assert.equal(data.admin.email, "admin@demo.civicflow.local");
         assert.equal(data.staff.length, 3);
         assert.equal(data.citizens.length, 10);
         assert.equal(data.complaints.length, 120);
      });

      it("maintains the required status distribution across 120 complaints", () => {
         const data = generateDemoDataset({ seed: 42 });
         const counts = {};
         data.complaints.forEach((c) => {
            counts[c.plannedStatus] = (counts[c.plannedStatus] || 0) + 1;
         });

         // Target distribution:
         // 18 submitted (15%), 18 assigned (15%), 24 in_progress (20%),
         // 24 resolved (20%), 18 closed (15%), 6 rejected_reopened (5%), 12 escalated (10%)
         assert.equal(counts.submitted, 18);
         assert.equal(counts.assigned, 18);
         assert.equal(counts.in_progress, 24);
         assert.equal(counts.resolved, 24);
         assert.equal(counts.closed, 18);
         assert.equal(counts.rejected_reopened, 6);
         assert.equal(counts.escalated, 12);
      });

      it("produces identical output deterministically with identical seed", () => {
         const runA = generateDemoDataset({ seed: 42 });
         const runB = generateDemoDataset({ seed: 42 });
         assert.deepEqual(runA, runB);
      });

      it("includes genuine near-duplicate cluster seeds in Chennai locations", () => {
         const data = generateDemoDataset({ seed: 42 });
         const clustered = data.complaints.filter((c) => c.clusterGroup != null);
         assert.ok(clustered.length >= 25 && clustered.length <= 35, "Should have ~30 clustered complaints");
         const uniqueGroups = new Set(clustered.map((c) => c.clusterGroup));
         assert.ok(uniqueGroups.size >= 10, "Should have at least 10 cluster groups");
      });
   });

   describe("2. Database Idempotency and Safety", () => {
      before(async () => {
         if (mongoose.connection.readyState === 0) {
            await mongoose.connect(TEST_DB_URI);
         }
         await Complaint.deleteMany({});
         await User.deleteMany({});
         await IncidentCluster.deleteMany({});
      });

      after(async () => {
         if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.dropDatabase().catch(() => {});
            await mongoose.disconnect();
         }
      });

      it("runs first time and creates demo records with expected counts", async () => {
         const res1 = await seedDemoDatabase({
            mongoUri: TEST_DB_URI,
            seed: 42,
            verbose: false,
         });

         assert.equal(res1.collections.users, 14); // 1 admin + 3 staff + 10 citizens
         assert.equal(res1.collections.complaints, 120);
         assert.ok(res1.collections.timelines > 120);
         assert.ok(res1.collections.supports > 0);
         assert.ok(res1.collections.clusters > 0);
      });

      it("runs second time and leaves identical counts (idempotence proof)", async () => {
         const res2 = await seedDemoDatabase({
            mongoUri: TEST_DB_URI,
            seed: 42,
            verbose: false,
         });

         assert.equal(res2.collections.users, 14);
         assert.equal(res2.collections.complaints, 120);
         assert.ok(res2.collections.timelines > 120);
         assert.ok(res2.collections.supports > 0);
         assert.ok(res2.collections.clusters > 0);

         // Check database directly
         const totalDemoUsers = await User.countDocuments({ email: /@demo\.civicflow\.local$/i });
         assert.equal(totalDemoUsers, 14);

         const totalDemoComplaints = await Complaint.countDocuments({});
         assert.equal(totalDemoComplaints, 120);
      });
   });
});
