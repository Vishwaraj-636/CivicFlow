import assert from "node:assert/strict";
import test, { describe, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";

import User from "../src/model/user.model.js";
import Department from "../src/model/department.model.js";
import deptStaffRequestModel from "../src/model/deptStaffRequest.model.js";
import { approveStaffRequest, rejectStaffRequest } from "../src/controller/deptStaffRequest.controller.js";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/civicflow_staff_request_test";

describe("Staff Request Approval and Rejection Hardening", () => {
   let adminUser;
   let activeDept;
   let inactiveDept;

   before(async () => {
      await mongoose.connect(TEST_DB_URI);
      if (mongoose.connection.name !== "civicflow_staff_request_test") {
         throw new Error(`Connected to non-test database "${mongoose.connection.name}". Aborting.`);
      }
   });

   after(async () => {
      await Promise.all([
         User.deleteMany({}),
         Department.deleteMany({}),
         deptStaffRequestModel.deleteMany({}),
      ]);
      await mongoose.disconnect();
   });

   beforeEach(async () => {
      await Promise.all([
         User.deleteMany({}),
         Department.deleteMany({}),
         deptStaffRequestModel.deleteMany({}),
      ]);

      adminUser = await User.create({
         fullname: "Admin User",
         email: "admin.hardening@test.local",
         contact: "9999999901",
         passwordHash: "hash",
         role: "admin",
         isActive: true,
      });

      activeDept = await Department.create({
         fullname: "Department of Sanitation",
         code: "SANITATION",
         description: "Sanitation and waste management",
         isActive: true,
      });

      inactiveDept = await Department.create({
         fullname: "Deactivated Department",
         code: "INACTIVE",
         description: "Deactivated department",
         isActive: false,
      });
   });

   test("approveStaffRequest rejects approval if requested department is inactive", async () => {
      const citizen = await User.create({
         fullname: "Applicant User",
         email: "applicant.inactive@test.local",
         contact: "9999999902",
         passwordHash: "hash",
         role: "citizen",
         isActive: true,
      });

      const request = await deptStaffRequestModel.create({
         userId: citizen._id,
         email: citizen.email,
         fullname: citizen.fullname,
         contact: citizen.contact,
         departmentId: inactiveDept._id,
         status: "pending",
      });

      let responseStatus = null;
      let responseBody = null;
      const res = {
         status(code) { responseStatus = code; return this; },
         json(data) { responseBody = data; return this; },
      };

      await approveStaffRequest({ params: { id: request._id }, user: adminUser }, res);

      assert.equal(responseStatus, 400);
      assert.equal(responseBody.message, "Active department not found");

      const userAfter = await User.findById(citizen._id);
      assert.equal(userAfter.role, "citizen");
   });

   test("approveStaffRequest successfully approves pending request and promotes user", async () => {
      const citizen = await User.create({
         fullname: "Valid Applicant",
         email: "applicant.valid@test.local",
         contact: "9999999903",
         passwordHash: "hash",
         role: "citizen",
         isActive: true,
      });

      const request = await deptStaffRequestModel.create({
         userId: citizen._id,
         email: citizen.email,
         fullname: citizen.fullname,
         contact: citizen.contact,
         departmentId: activeDept._id,
         status: "pending",
      });

      let responseStatus = null;
      let responseBody = null;
      const res = {
         status(code) { responseStatus = code; return this; },
         json(data) { responseBody = data; return this; },
      };

      await approveStaffRequest({ params: { id: request._id }, user: adminUser }, res);

      assert.equal(responseStatus, 200);
      assert.equal(responseBody.message, "Request approved successfully");
      assert.equal(responseBody.request.status, "approved");

      const userAfter = await User.findById(citizen._id);
      assert.equal(userAfter.role, "dept_staff");
      assert.equal(String(userAfter.departmentId), String(activeDept._id));
      assert.equal(userAfter.profileCompleted, true);
   });

   test("approveStaffRequest executes compensating rollback when request save fails", async () => {
      const citizen = await User.create({
         fullname: "Rollback Applicant",
         email: "applicant.rollback@test.local",
         contact: "9999999904",
         passwordHash: "hash",
         role: "citizen",
         isActive: true,
      });

      const request = await deptStaffRequestModel.create({
         userId: citizen._id,
         email: citizen.email,
         fullname: citizen.fullname,
         contact: citizen.contact,
         departmentId: activeDept._id,
         status: "pending",
      });

      // Intentionally cause request.save to fail by modifying its prototype save method for this instance
      const originalSave = deptStaffRequestModel.prototype.save;
      deptStaffRequestModel.prototype.save = async function () {
         if (this._id.equals(request._id)) {
            throw new Error("Simulated database failure during request save");
         }
         return originalSave.apply(this, arguments);
      };

      let responseStatus = null;
      let responseBody = null;
      const res = {
         status(code) { responseStatus = code; return this; },
         json(data) { responseBody = data; return this; },
      };

      try {
         await approveStaffRequest({ params: { id: request._id }, user: adminUser }, res);
      } finally {
         deptStaffRequestModel.prototype.save = originalSave;
      }

      assert.equal(responseStatus, 500);

      // Verify user was rolled back to original role and department
      const userAfter = await User.findById(citizen._id);
      assert.equal(userAfter.role, "citizen");
      assert.ok(!userAfter.departmentId);
   });

   test("rejectStaffRequest updates request status before deleting user record", async () => {
      const citizen = await User.create({
         fullname: "Reject Applicant",
         email: "applicant.reject@test.local",
         contact: "9999999905",
         passwordHash: "hash",
         role: "citizen",
         isActive: true,
      });

      const request = await deptStaffRequestModel.create({
         userId: citizen._id,
         email: citizen.email,
         fullname: citizen.fullname,
         contact: citizen.contact,
         departmentId: activeDept._id,
         status: "pending",
      });

      let responseStatus = null;
      let responseBody = null;
      const res = {
         status(code) { responseStatus = code; return this; },
         json(data) { responseBody = data; return this; },
      };

      await rejectStaffRequest(
         { params: { id: request._id }, body: { rejectionReason: "Insufficient qualifications" }, user: adminUser },
         res
      );

      assert.equal(responseStatus, 200);
      assert.equal(responseBody.message, "Request rejected successfully");
      assert.equal(responseBody.request.status, "rejected");
      assert.equal(responseBody.request.rejectionReason, "Insufficient qualifications");

      // Verify request document is persisted as rejected
      const requestAfter = await deptStaffRequestModel.findById(request._id);
      assert.equal(requestAfter.status, "rejected");

      // Verify applicant user was deleted
      const userAfter = await User.findById(citizen._id);
      assert.equal(userAfter, null);
   });

   test("rejectStaffRequest rejects non-pending request", async () => {
      const request = await deptStaffRequestModel.create({
         userId: new mongoose.Types.ObjectId(),
         email: "already.rejected@test.local",
         fullname: "Already Processed",
         contact: "9999999906",
         departmentId: activeDept._id,
         status: "rejected",
         rejectionReason: "Previously rejected",
      });

      let responseStatus = null;
      let responseBody = null;
      const res = {
         status(code) { responseStatus = code; return this; },
         json(data) { responseBody = data; return this; },
      };

      await rejectStaffRequest(
         { params: { id: request._id }, body: { rejectionReason: "Try again" }, user: adminUser },
         res
      );

      assert.equal(responseStatus, 404);
      assert.equal(responseBody.message, "Pending request not found");
   });
});
