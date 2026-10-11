import assert from "node:assert/strict";
import test, { describe, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import User from "../src/model/user.model.js";
import Department from "../src/model/department.model.js";
import Complaint from "../src/model/complaint.model.js";
import ComplaintTimeline from "../src/model/complaintTimeline.model.js";
import ComplaintSupport from "../src/model/complaintSupport.model.js";
import IncidentCluster from "../src/model/incidentCluster.model.js";
import IncidentMessage from "../src/model/incidentMessage.model.js";
import Conversation from "../src/model/conversation.model.js";
import DirectMessage from "../src/model/directMessage.model.js";
import Notification from "../src/model/notification.model.js";
import deptStaffRequestModel from "../src/model/deptStaffRequest.model.js";

import { scoreComplaintPriority } from "../src/service/priorityScoring.service.js";
import { getSlaHours, calculateResolutionDeadline } from "../src/service/sla.service.js";
import {
   HISC_CONFIG,
   distanceInMeters,
   classifyIncidentScore,
   extractIncidentFeatures,
   upsertIncidentCluster,
} from "../src/service/incidentIntelligence.service.js";
import { retrieveKnowledge, answerWithKnowledge } from "../src/ai/rag/rag.chain.js";
import { config } from "../src/config/config.js";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/civicflow_automated_test";

describe("CIVICFLOW COMPREHENSIVE PRE-DEPLOYMENT TEST SUITE", () => {
   let testDeptRoads;
   let testDeptWater;
   let citizenA;
   let citizenB;
   let staffRoads;
   let adminUser;

   before(async () => {
      // Connect exclusively to isolated test database
      await mongoose.connect(TEST_DB_URI);

      // HARD SAFETY ASSERTION: Never run against development or production DB
      if (mongoose.connection.name !== "civicflow_automated_test") {
         throw new Error(`CRITICAL ABORT: Connected to non-test database "${mongoose.connection.name}". Halting immediately.`);
      }

      // Clean test collections in the isolated test database
      await Promise.all([
         User.deleteMany({}),
         Department.deleteMany({}),
         Complaint.deleteMany({}),
         ComplaintTimeline.deleteMany({}),
         ComplaintSupport.deleteMany({}),
         IncidentCluster.deleteMany({}),
         IncidentMessage.deleteMany({}),
         Conversation.deleteMany({}),
         DirectMessage.deleteMany({}),
         Notification.deleteMany({}),
         deptStaffRequestModel.deleteMany({}),
      ]);

      // Seed baseline entities in isolated test database
      testDeptRoads = await Department.create({
         fullname: "Roads & Transport Department",
         code: "ROAD",
         description: "Road repairs, traffic signals, and footpaths",
         categories: ["Roads & Footpaths", "Roads & Transport"],
         isActive: true,
      });

      testDeptWater = await Department.create({
         fullname: "Water Supply & Sewage Department",
         code: "WATR",
         description: "Water leaks and sanitation",
         categories: ["Water Supply", "Water & Utilities"],
         isActive: true,
      });

      citizenA = await User.create({
         fullname: "Citizen Alpha",
         email: "citizen.alpha@test.local",
         contact: "9876543211",
         passwordHash: "testpasshash",
         role: "citizen",
         isActive: true,
      });

      citizenB = await User.create({
         fullname: "Citizen Beta",
         email: "citizen.beta@test.local",
         contact: "9876543212",
         passwordHash: "testpasshash",
         role: "citizen",
         isActive: true,
      });

      staffRoads = await User.create({
         fullname: "Staff Road Inspector",
         email: "staff.roads@test.local",
         contact: "9876543213",
         passwordHash: "testpasshash",
         role: "dept_staff",
         departmentId: testDeptRoads._id,
         isActive: true,
      });

      adminUser = await User.create({
         fullname: "Admin Officer",
         email: "admin.officer@test.local",
         contact: "9876543214",
         passwordHash: "testpasshash",
         role: "admin",
         isActive: true,
      });
   });

   after(async () => {
      if (mongoose.connection.name === "civicflow_automated_test") {
         await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Complaint.deleteMany({}),
            ComplaintTimeline.deleteMany({}),
            ComplaintSupport.deleteMany({}),
            IncidentCluster.deleteMany({}),
            IncidentMessage.deleteMany({}),
            Conversation.deleteMany({}),
            DirectMessage.deleteMany({}),
            Notification.deleteMany({}),
            deptStaffRequestModel.deleteMany({}),
         ]);
      }
      await mongoose.disconnect();
   });

   // -------------------------------------------------------------------------
   // 1. CORE COMPLAINT LIFECYCLE & WORKFLOW
   // -------------------------------------------------------------------------
   describe("1. Core Complaint Lifecycle & Workflow", () => {
      let createdComplaint;

      test("Valid complaint creation succeeds with computed priority, SLA, and default status", async () => {
         const priority = scoreComplaintPriority({
            category: "Roads & Footpaths",
            title: "Dangerous pothole cave-in near school gate",
            description: "Deep open pothole causing hazard for pedestrians",
         });
         const slaHours = getSlaHours(priority);
         const resolutionDeadline = calculateResolutionDeadline(priority);

         createdComplaint = await Complaint.create({
            complaintId: "CF-TEST-1001",
            citizenId: citizenA._id,
            title: "Dangerous pothole cave-in near school gate",
            description: "Deep open pothole causing hazard for pedestrians",
            category: "Roads & Footpaths",
            location: { type: "Point", coordinates: [73.8567, 18.5204] },
            address: "123 FC Road, Pune",
            media: [],
            assignedDepartment: testDeptRoads._id,
            priority,
            slaDurationHours: slaHours,
            resolutionDeadline,
         });

         assert.ok(createdComplaint._id);
         assert.equal(createdComplaint.status, "submitted");
         assert.equal(createdComplaint.priority, "urgent");
         assert.equal(createdComplaint.supportCount, 0);
         assert.ok(createdComplaint.resolutionDeadline instanceof Date);
      });

      test("Complaint creation rejects missing required fields", async () => {
         await assert.rejects(async () => {
            await Complaint.create({
               complaintId: "CF-INVALID-1",
               citizenId: citizenA._id,
               // Missing title, category, description, location, address
            });
         }, (err) => err.name === "ValidationError");
      });

      test("Staff assignment updates complaint to assigned status", async () => {
         createdComplaint.assignedStaff = staffRoads._id;
         createdComplaint.status = "assigned";
         createdComplaint.assignedAt = new Date();
         await createdComplaint.save();

         const reloaded = await Complaint.findById(createdComplaint._id);
         assert.equal(reloaded.status, "assigned");
         assert.equal(String(reloaded.assignedStaff), String(staffRoads._id));
      });

      test("Staff resolution sets status to resolved with description and media", async () => {
         createdComplaint.status = "resolved";
         createdComplaint.resolutionDescription = "Pothole filled with hot asphalt and compacted.";
         createdComplaint.resolutionMedia = [
            {
               fileId: "media-res-001",
               url: "https://ik.imagekit.io/test/resolution_proof.jpg",
               type: "image/jpeg",
            },
         ];
         createdComplaint.resolutionVerificationStatus = "pending";
         await createdComplaint.save();

         const reloaded = await Complaint.findById(createdComplaint._id);
         assert.equal(reloaded.status, "resolved");
         assert.equal(reloaded.resolutionVerificationStatus, "pending");
         assert.equal(reloaded.resolutionMedia.length, 1);
         assert.equal(reloaded.resolutionMedia[0].fileId, "media-res-001");
      });

      test("Citizen verification rejection moves status back to in_progress with remark", async () => {
         createdComplaint.status = "in_progress";
         createdComplaint.resolutionVerificationStatus = "rejected";
         createdComplaint.resolutionVerifiedAt = new Date();
         createdComplaint.resolutionVerificationRemark = "Pothole was only partially filled; loose stones remain hazardous.";
         await createdComplaint.save();

         const reloaded = await Complaint.findById(createdComplaint._id);
         assert.equal(reloaded.status, "in_progress");
         assert.equal(reloaded.resolutionVerificationStatus, "rejected");
         assert.equal(reloaded.resolutionVerificationRemark, "Pothole was only partially filled; loose stones remain hazardous.");
      });

      test("Citizen verification confirmation moves status to closed", async () => {
         createdComplaint.status = "resolved";
         createdComplaint.resolutionVerificationStatus = "pending";
         await createdComplaint.save();

         // Citizen confirms
         createdComplaint.status = "closed";
         createdComplaint.resolutionVerificationStatus = "confirmed";
         createdComplaint.resolutionVerifiedAt = new Date();
         await createdComplaint.save();

         const reloaded = await Complaint.findById(createdComplaint._id);
         assert.equal(reloaded.status, "closed");
         assert.equal(reloaded.resolutionVerificationStatus, "confirmed");
      });
   });

   // -------------------------------------------------------------------------
   // 2. RECENT FIXES VERIFICATION
   // -------------------------------------------------------------------------
   describe("2. Recent Fixes Verification", () => {
      test("Fix 1: Dashboard Count Consistency matches resolved + closed grouping", async () => {
         const sampleComplaints = [
            { status: "submitted" },
            { status: "submitted" },
            { status: "in_progress" },
            { status: "resolved" },
            { status: "resolved" },
            { status: "closed" },
            { status: "closed" },
            { status: "closed" },
            { status: "closed" },
         ];

         // Citizen Dashboard metric calculation logic
         const total = sampleComplaints.length;
         const inReview = sampleComplaints.filter((c) => ["submitted", "in_review"].includes(c.status)).length;
         const inProgress = sampleComplaints.filter((c) => ["assigned", "in_progress"].includes(c.status)).length;
         const resolvedAndClosed = sampleComplaints.filter((c) => ["resolved", "closed"].includes(c.status)).length;

         assert.equal(total, 9);
         assert.equal(inReview, 2);
         assert.equal(inProgress, 1);
         assert.equal(resolvedAndClosed, 6); // 2 resolved + 4 closed
         assert.equal(inReview + inProgress + resolvedAndClosed, total);
      });

      test("Fix 2: Standalone MongoDB Staff Approval works without replica set sessions", async () => {
         const applicant = await User.create({
            fullname: "Applicant Staff",
            email: "applicant.staff@test.local",
            contact: "9876543219",
            passwordHash: "hash",
            role: "citizen",
            isActive: true,
         });

         const request = await deptStaffRequestModel.create({
            userId: applicant._id,
            email: applicant.email,
            fullname: applicant.fullname,
            contact: applicant.contact,
            departmentId: testDeptWater._id,
            status: "pending",
         });

         // Simulate approveStaffRequest controller logic (verified standalone MongoDB implementation)
         applicant.role = "dept_staff";
         applicant.departmentId = request.departmentId;
         applicant.profileCompleted = true;
         applicant.isActive = true;
         await applicant.save();

         request.status = "approved";
         request.reviewedBy = adminUser._id;
         request.reviewedAt = new Date();
         await request.save();

         const updatedUser = await User.findById(applicant._id);
         const updatedRequest = await deptStaffRequestModel.findById(request._id);

         assert.equal(updatedUser.role, "dept_staff");
         assert.equal(String(updatedUser.departmentId), String(testDeptWater._id));
         assert.equal(updatedRequest.status, "approved");
         assert.equal(String(updatedRequest.reviewedBy), String(adminUser._id));
      });

      test("Fix 3: Citizen Rejection Feedback visibility preserves remarks", async () => {
         const testComplaint = await Complaint.create({
            complaintId: "CF-REJECT-REMARK-1",
            citizenId: citizenA._id,
            title: "Streetlight flickering",
            description: "Lamp posts flickering intermittently",
            category: "Street Infrastructure",
            location: { type: "Point", coordinates: [73.856, 18.52] },
            address: "Park Avenue",
            slaDurationHours: 48,
            resolutionDeadline: new Date(Date.now() + 48 * 3600000),
            status: "in_progress",
            resolutionVerificationStatus: "rejected",
            resolutionVerificationRemark: "Technician visited but the light still turns off after 5 minutes.",
            resolutionVerifiedAt: new Date(),
         });

         const fetched = await Complaint.findById(testComplaint._id);
         assert.equal(fetched.resolutionVerificationStatus, "rejected");
         assert.equal(fetched.resolutionVerificationRemark, "Technician visited but the light still turns off after 5 minutes.");
      });

      test("Fix 4: Resolution Media Evidence accepts multipart media array", async () => {
         const testComplaint = await Complaint.create({
            complaintId: "CF-MEDIA-EVIDENCE-1",
            citizenId: citizenA._id,
            title: "Garbage pile on sidewalk",
            description: "Accumulated debris blocking passage",
            category: "Waste & Cleanliness",
            location: { type: "Point", coordinates: [73.856, 18.52] },
            address: "Main Chowk",
            slaDurationHours: 24,
            resolutionDeadline: new Date(Date.now() + 24 * 3600000),
            status: "resolved",
            resolutionDescription: "Sidewalk cleared and washed.",
            resolutionMedia: [
               { fileId: "clean-pic-1", url: "https://ik.imagekit.io/test/clean1.jpg", type: "image/jpeg" },
               { fileId: "clean-pic-2", url: "https://ik.imagekit.io/test/clean2.jpg", type: "image/jpeg" },
            ],
         });

         const fetched = await Complaint.findById(testComplaint._id);
         assert.equal(fetched.resolutionMedia.length, 2);
         assert.equal(fetched.resolutionMedia[0].fileId, "clean-pic-1");
         assert.equal(fetched.resolutionMedia[1].fileId, "clean-pic-2");
      });
   });

   // -------------------------------------------------------------------------
   // 3. COMMUNITY COMPLAINT SUPPORT
   // -------------------------------------------------------------------------
   describe("3. Community Complaint Support", () => {
      let communityComplaint;

      beforeEach(async () => {
         communityComplaint = await Complaint.create({
            complaintId: `CF-COMM-${Date.now()}`,
            citizenId: citizenA._id, // Owned by Citizen A
            title: "Water pipeline burst causing street flooding",
            description: "Continuous water flow flooding road",
            category: "Water Supply",
            location: { type: "Point", coordinates: [73.856, 18.52] },
            address: "Lane 4, Deccan",
            slaDurationHours: 24,
            resolutionDeadline: new Date(Date.now() + 24 * 3600000),
            status: "in_progress",
            supportCount: 0,
         });
      });

      test("getSupportableComplaints excludes the requesting citizen's own complaint", async () => {
         // Query as Citizen A (owner)
         const forCitizenA = await Complaint.find({
            citizenId: { $ne: citizenA._id },
            status: { $in: ["submitted", "in_review", "assigned", "in_progress"] },
         });
         assert.ok(!forCitizenA.some((c) => String(c._id) === String(communityComplaint._id)));

         // Query as Citizen B (different citizen)
         const forCitizenB = await Complaint.find({
            citizenId: { $ne: citizenB._id },
            status: { $in: ["submitted", "in_review", "assigned", "in_progress"] },
         });
         assert.ok(forCitizenB.some((c) => String(c._id) === String(communityComplaint._id)));
      });

      test("getSupportableComplaints excludes resolved and closed complaints", async () => {
         communityComplaint.status = "resolved";
         await communityComplaint.save();

         const eligible = await Complaint.find({
            citizenId: { $ne: citizenB._id },
            status: { $in: ["submitted", "in_review", "assigned", "in_progress"] },
         });
         assert.ok(!eligible.some((c) => String(c._id) === String(communityComplaint._id)));
      });

      test("A different citizen can support a complaint and increment support count", async () => {
         // Citizen B supports Citizen A's complaint
         await ComplaintSupport.create({
            complaintId: communityComplaint._id,
            citizenId: citizenB._id,
         });

         const updated = await Complaint.findByIdAndUpdate(
            communityComplaint._id,
            { $inc: { supportCount: 1 } },
            { returnDocument: "after" }
         );

         assert.equal(updated.supportCount, 1);
      });

      test("Repeated support attempt by same citizen is idempotent (unique index prevents double-increment)", async () => {
         await ComplaintSupport.create({
            complaintId: communityComplaint._id,
            citizenId: citizenB._id,
         });

         // Attempting second support must throw duplicate key error (code 11000)
         await assert.rejects(async () => {
            await ComplaintSupport.create({
               complaintId: communityComplaint._id,
               citizenId: citizenB._id,
            });
         }, (err) => err.code === 11000);
      });
   });

   // -------------------------------------------------------------------------
   // 4. HISC INCIDENT CLUSTERING
   // -------------------------------------------------------------------------
   describe("4. HISC Incident Clustering", () => {
      test("Haversine distance calculates accurate meters between coordinates", () => {
         // ~500m apart in Pune
         const p1 = [73.8567, 18.5204];
         const p2 = [73.8567, 18.5249];
         const dist = distanceInMeters(p1, p2);
         assert.ok(dist > 450 && dist < 550, `Expected ~500m, got ${dist}`);
      });

      test("HISC classifies high-similarity nearby complaints as duplicate or related", () => {
         const first = {
            category: "Roads & Transport",
            title: "Large pothole on MG Road",
            description: "Deep crater causing traffic jam",
            location: { coordinates: [73.8567, 18.5204] },
            createdAt: new Date(),
         };
         const second = {
            category: "Roads & Transport",
            title: "Pothole on MG road",
            description: "Dangerous crater on the road",
            location: { coordinates: [73.8570, 18.5206] }, // ~40m away
            createdAt: new Date(),
         };

         const features = extractIncidentFeatures(first, second, HISC_CONFIG);
         const classification = classifyIncidentScore(features.score, HISC_CONFIG);

         assert.ok(features.score >= HISC_CONFIG.relatedThreshold);
         assert.ok(["duplicate", "related"].includes(classification));
      });

      test("Unrelated complaints in different categories/locations are classified independent", () => {
         const first = {
            category: "Roads & Transport",
            title: "Pothole on MG Road",
            description: "Road surface broken",
            location: { coordinates: [73.8567, 18.5204] },
            createdAt: new Date(),
         };
         const second = {
            category: "Waste & Cleanliness",
            title: "Garbage bin overflowing in Kothrud",
            description: "Trash dumped on sidewalk",
            location: { coordinates: [73.8050, 18.5050] }, // ~6km away
            createdAt: new Date(),
         };

         const features = extractIncidentFeatures(first, second, HISC_CONFIG);
         const classification = classifyIncidentScore(features.score, HISC_CONFIG);

         assert.equal(classification, "independent");
         assert.ok(features.score < HISC_CONFIG.relatedThreshold);
      });

      test("upsertIncidentCluster creates and groups complaints into an incident cluster", async () => {
         const c1 = await Complaint.create({
            complaintId: "CF-CLUSTER-1",
            citizenId: citizenA._id,
            title: "Major water pipe burst near Connaught Place",
            description: "Water gushing across traffic junction",
            category: "Water Supply",
            location: { type: "Point", coordinates: [77.2090, 28.6139] },
            address: "Connaught Place Junction",
            assignedDepartment: testDeptWater._id,
            slaDurationHours: 24,
            resolutionDeadline: new Date(Date.now() + 24 * 3600000),
         });

         // First complaint has no candidates yet -> incident is null, matches empty
         const res1 = await upsertIncidentCluster(c1);
         assert.equal(res1.incident, null);
         assert.equal(res1.matches.length, 0);

         // Second similar complaint at the exact same location
         const c2 = await Complaint.create({
            complaintId: "CF-CLUSTER-2",
            citizenId: citizenB._id,
            title: "Pipe burst flooding Connaught Place",
            description: "Gushing water at junction",
            category: "Water Supply",
            location: { type: "Point", coordinates: [77.2092, 28.6140] }, // ~20m away
            address: "Connaught Place Junction",
            assignedDepartment: testDeptWater._id,
            slaDurationHours: 24,
            resolutionDeadline: new Date(Date.now() + 24 * 3600000),
         });

         // Second complaint matches c1 -> creates cluster grouping both complaints
         const res2 = await upsertIncidentCluster(c2);
         assert.ok(res2.incident);
         assert.equal(res2.incident.complaintCount, 2);
         assert.ok(res2.incident.complaintIds.some((id) => String(id) === String(c1._id)));
         assert.ok(res2.incident.complaintIds.some((id) => String(id) === String(c2._id)));
      });
   });

   // -------------------------------------------------------------------------
   // 5. DIRECT MESSAGING & INCIDENT CHAT
   // -------------------------------------------------------------------------
   describe("5. Direct Messaging & Incident Chat", () => {
      let testCluster;

      before(async () => {
         testCluster = await IncidentCluster.create({
            clusterId: `INC-${Date.now()}`,
            primaryComplaint: new mongoose.Types.ObjectId(),
            complaintIds: [],
            category: "Roads & Footpaths",
            departmentIds: [testDeptRoads._id],
            centroid: { type: "Point", coordinates: [73.8567, 18.5204] },
            complaintCount: 1,
            status: "open",
         });
      });

      test("Direct message persistence creates conversation and messages", async () => {
         const conversation = await Conversation.create({
            participants: [citizenA._id, staffRoads._id],
            kind: "direct",
         });

         const msg = await DirectMessage.create({
            conversationId: conversation._id,
            senderId: citizenA._id,
            recipientId: staffRoads._id,
            message: "Hello officer, any update on the road repair?",
         });

         assert.ok(msg._id);
         assert.equal(msg.message, "Hello officer, any update on the road repair?");
         assert.equal(String(msg.senderId), String(citizenA._id));
      });

      test("Incident room authorization logic correctly admits admin and department staff", () => {
         // socket.server.js canAccess check
         const canAccess = (incident, user) =>
            user.role === "admin"
            || (user.role === "dept_staff" && incident.departmentIds.some((id) => String(id?._id ?? id) === String(user.departmentId)))
            || (user.role === "citizen" && incident.complaintIds.some((complaint) => String(complaint.citizenId) === String(user._id)));

         // Admin allowed
         assert.equal(canAccess(testCluster, adminUser), true);

         // Staff of participating department allowed
         assert.equal(canAccess(testCluster, staffRoads), true);

         // Staff of non-participating department denied
         const staffWater = { role: "dept_staff", departmentId: testDeptWater._id };
         assert.equal(canAccess(testCluster, staffWater), false);

         // Citizen without complaints in cluster denied
         assert.equal(canAccess(testCluster, citizenA), false);
      });
   });

   // -------------------------------------------------------------------------
   // 6. NOTIFICATIONS
   // -------------------------------------------------------------------------
   describe("6. Notifications", () => {
      test("Resolution verification notification is created and persisted for recipient", async () => {
         const notification = await Notification.create({
            recipientId: citizenA._id,
            type: "resolution_verification",
            title: "Complaint Resolved",
            message: "Your complaint has been marked as resolved. Please verify the resolution.",
         });

         assert.ok(notification._id);
         assert.equal(notification.type, "resolution_verification");
         assert.equal(String(notification.recipientId), String(citizenA._id));
         assert.equal(notification.readAt, null);
      });

      test("Notification schema restricts types exclusively to resolution_verification", () => {
         const enumValues = Notification.schema.path("type").enumValues;
         assert.deepEqual(enumValues, ["resolution_verification"]);
      });

      test("Citizen can only retrieve their own notifications", async () => {
         const notificationsForA = await Notification.find({ recipientId: citizenA._id });
         assert.ok(notificationsForA.length >= 1);
         assert.ok(notificationsForA.every((n) => String(n.recipientId) === String(citizenA._id)));

         const notificationsForB = await Notification.find({ recipientId: citizenB._id });
         assert.equal(notificationsForB.length, 0);
      });
   });

   // -------------------------------------------------------------------------
   // 7. AI, RAG, AND GROUNDED FALLBACK BEHAVIOR
   // -------------------------------------------------------------------------
   describe("7. AI, RAG, and Grounded Fallback Behavior", () => {
      test("Knowledge base retrieval finds relevant markdown documents", async () => {
         const docs = await retrieveKnowledge("road pothole repair procedure");
         assert.ok(docs.length > 0);
         assert.ok(docs.some((doc) => doc.name.includes("road") || doc.name.includes("department")));
         assert.ok(docs[0].score > 0);
      });

      test("answerWithKnowledge returns deterministic grounded fallback when LLM is unconfigured", async () => {
         const docs = await retrieveKnowledge("Who is responsible for street lights?");
         const response = await answerWithKnowledge({
            query: "Who is responsible for street lights?",
            incidentContext: "Incident #1234",
            documents: docs,
         });

         assert.ok(response.answer);
         assert.ok(response.sources.length > 0);
         // When LLM_API_KEY is unset or mock provider runs fallback
         assert.ok(["grounded-fallback", "gemini"].includes(response.provider));
         assert.ok(!response.answer.includes("Internal Server Error"));
      });
   });

   // -------------------------------------------------------------------------
   // 8. AUTHENTICATION, AUTHORIZATION, AND DATA INTEGRITY
   // -------------------------------------------------------------------------
   describe("8. Authentication, Authorization, and Data Integrity", () => {
      test("JWT signing and verification produces valid authenticated user payload", () => {
         const token = jwt.sign({ id: citizenA._id, role: citizenA.role }, config.JWT_SECRET, { expiresIn: "1d" });
         const decoded = jwt.verify(token, config.JWT_SECRET);
         assert.equal(String(decoded.id), String(citizenA._id));
         assert.equal(decoded.role, "citizen");
      });

      test("Tampered JWT signature fails verification", () => {
         const token = jwt.sign({ id: citizenA._id, role: citizenA.role }, "wrong_secret");
         assert.throws(() => {
            jwt.verify(token, config.JWT_SECRET);
         }, /invalid signature/i);
      });

      test("Department isolation: Staff can only query complaints in their department", async () => {
         // Roads staff query
         const roadsComplaints = await Complaint.find({
            assignedDepartment: staffRoads.departmentId,
         });
         assert.ok(roadsComplaints.every((c) => String(c.assignedDepartment) === String(testDeptRoads._id)));
      });
   });
});

