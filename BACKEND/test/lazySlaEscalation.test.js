import assert from "node:assert/strict";
import test, { describe, it, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import Complaint from "../src/model/complaint.model.js";
import User from "../src/model/user.model.js";
import {
   lazyEscalateOverdueComplaints,
   resetLazyEscalationThrottle,
} from "../src/service/complaintEscalation.service.js";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/civicflow_lazy_escalation_test";

describe("LAZY SLA ESCALATION TEST SUITE", () => {
   let testUser;

   before(async () => {
      if (mongoose.connection.readyState === 0) {
         await mongoose.connect(TEST_DB_URI);
      }
      await Complaint.deleteMany({});
      await User.deleteMany({});

      testUser = await User.create({
         fullname: "Citizen Test",
         email: "citizen.test@local.test",
         contact: "9876543210",
         passwordHash: "hash123",
         role: "citizen",
      });
   });

   beforeEach(() => {
      resetLazyEscalationThrottle();
   });

   after(async () => {
      if (mongoose.connection.readyState !== 0) {
         await mongoose.connection.dropDatabase().catch(() => {});
         await mongoose.disconnect();
      }
   });

   it("escalates an overdue complaint on initial lazy call", async () => {
      const overdueComplaint = await Complaint.create({
         complaintId: "CF-SLA-01",
         citizenId: testUser._id,
         title: "Overdue Pothole Issue",
         description: "Deep pothole overdue for repair work",
         category: "Roads & Transport",
         location: { type: "Point", coordinates: [80.22, 13.00] },
         address: "Guindy, Chennai",
         status: "assigned",
         priority: "high",
         slaDurationHours: 48,
         resolutionDeadline: new Date(Date.now() - 3600000), // 1 hour ago
         escalated: false,
      });

      const modifiedCount = await lazyEscalateOverdueComplaints();
      assert.ok(modifiedCount >= 1, "Should have escalated at least 1 overdue complaint");

      const refreshed = await Complaint.findById(overdueComplaint._id);
      assert.equal(refreshed.escalated, true, "Complaint must be marked escalated");
      assert.ok(refreshed.escalatedAt instanceof Date);
      assert.ok(refreshed.escalationReason);
   });

   it("throttles subsequent calls within the 60-second window", async () => {
      // 1. Initial call sets throttle timestamp
      await lazyEscalateOverdueComplaints();

      // 2. Insert a second overdue complaint while throttle is active
      const secondOverdue = await Complaint.create({
         complaintId: "CF-SLA-02",
         citizenId: testUser._id,
         title: "Second Overdue Issue",
         description: "Water pipe leak overdue for repair",
         category: "Water & Utilities",
         location: { type: "Point", coordinates: [80.23, 13.01] },
         address: "Adyar, Chennai",
         status: "in_progress",
         priority: "medium",
         slaDurationHours: 72,
         resolutionDeadline: new Date(Date.now() - 7200000), // 2 hours ago
         escalated: false,
      });

      // 3. Immediate second call should be throttled (returns 0, second complaint not escalated)
      const immediateCount = await lazyEscalateOverdueComplaints();
      assert.equal(immediateCount, 0, "Immediate second call within 60s must be throttled");

      const untouched = await Complaint.findById(secondOverdue._id);
      assert.equal(untouched.escalated, false, "Second complaint must not be escalated during throttle window");

      // 4. Calling with time simulated past 60s runs escalation and updates the second complaint
      const futureTime = new Date(Date.now() + 65000);
      const futureCount = await lazyEscalateOverdueComplaints(futureTime);
      assert.ok(futureCount >= 1, "Call after 60s throttle window must execute escalation");

      const escalatedNow = await Complaint.findById(secondOverdue._id);
      assert.equal(escalatedNow.escalated, true, "Second complaint must now be escalated");
   });
});
