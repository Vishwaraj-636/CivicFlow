import deptStaffRequestModel from '../model/deptStaffRequest.model.js';
import userModel from '../model/user.model.js';
import Department from '../model/department.model.js';
import mongoose from 'mongoose';


export const createStaffRequest = async (req, res) => {
   const { departmentId } = req.body;
   const userId = req.user._id;

   try {
      const department = await Department.findOne({ _id: departmentId, isActive: true });

      if (!department) {
         return res.status(400).json({ message: "Active department not found" });
      }

      const existingRequest = await deptStaffRequestModel.findOne({
         userId,
         status: 'pending'
      });

      if (existingRequest) {
         return res.status(400).json({
            message: "You already have a pending request for department staff role"
         });
      }

      if (req.user.role === 'admin') {
         return res.status(400).json({
            message: "Admin users cannot request department staff role"
         });
      }

      const request = await deptStaffRequestModel.create({
         userId,
         email: req.user.email,
         contact: req.user.contact,
         fullname: req.user.fullname,
         departmentId: department._id,
         status: 'pending'
      });

      res.status(201).json({
         message: "Department staff request submitted successfully",
         request: {
            id: request._id,
            email: req.user.email,
            fullname: req.user.fullname,
            departmentId: request.departmentId,
            status: request.status,
            createdAt: request.createdAt
         }
      });
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};

export const getMyStaffRequest = async (req, res) => {
   try {
      const request = await deptStaffRequestModel.findOne({ userId: req.user._id })
         .populate('departmentId', 'fullname code description isActive categories')
         .sort({ createdAt: -1 });

      if (!request) {
         return res.status(404).json({ message: "Staff request not found" });
      }

      res.status(200).json({ request });
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};

export const getStaffRequests = async (req, res) => {
   const { status = 'pending', departmentId } = req.query;

   if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid request status" });
   }

   if (departmentId && !mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({ message: "Invalid department ID" });
   }

   try {
      const query = { status };
      if (departmentId) {
         query.departmentId = departmentId;
      }

      const requests = await deptStaffRequestModel.find(query)
         .select('-password -__v')
         .populate('userId', 'fullname email contact role departmentId')
         .populate('departmentId', 'fullname code description isActive categories')
         .populate('reviewedBy', 'fullname email role')
         .sort({ createdAt: -1 });
      res.status(200).json({ requests });
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};

export const getStaffRequestById = async (req, res) => {
   try {
      const request = await deptStaffRequestModel.findById(req.params.id)
         .select('-password -__v')
         .populate('userId', 'fullname email contact role departmentId')
         .populate('departmentId', 'fullname code description isActive categories')
         .populate('reviewedBy', 'fullname email role');

      if (!request) {
         return res.status(404).json({ message: "Request not found" });
      }

      res.status(200).json({ request });
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};

export const approveStaffRequest = async (req, res) => {
   const adminId = req.user._id;
   const session = await mongoose.startSession();

   try {
      let approvedRequest;

      await session.withTransaction(async () => {
         const request = await deptStaffRequestModel.findById(req.params.id).session(session);

         if (!request) {
            throw Object.assign(new Error("Request not found"), { statusCode: 404 });
         }

         if (request.status !== 'pending') {
            throw Object.assign(
               new Error(`Cannot modify request with status: ${request.status}`),
               { statusCode: 400 }
            );
         }

         const department = await Department.findById(request.departmentId).session(session);

         if (!department) {
            throw Object.assign(new Error("Requested department not found"), { statusCode: 400 });
         }

         const user = await userModel.findById(request.userId).session(session);

         if (!user) {
            throw Object.assign(new Error("Applicant not found"), { statusCode: 404 });
         }

         user.role = 'dept_staff';
         user.departmentId = department._id;
         user.profileCompleted = true;
         user.isActive = true;
         await user.save({ session });

         request.status = 'approved';
         request.userId = user._id;
         request.reviewedBy = adminId;
         request.reviewedAt = new Date();
         await request.save({ session });
         approvedRequest = request;
      });

      res.status(200).json({
         message: "Request approved successfully",
         request: {
            id: approvedRequest._id,
            userId: approvedRequest.userId,
            departmentId: approvedRequest.departmentId,
            status: approvedRequest.status,
            reviewedBy: approvedRequest.reviewedBy,
            reviewedAt: approvedRequest.reviewedAt
         }
      });
   } catch (err) {
      console.log(err);
      res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Internal server error" });
   } finally {
      await session.endSession();
   }
};

export const rejectStaffRequest = async (req, res) => {
   const { rejectionReason } = req.body;
   const adminId = req.user._id;

   try {
      const request = await deptStaffRequestModel.findOne({
         _id: req.params.id,
         status: 'pending'
      });

      if (!request) {
         return res.status(404).json({ message: "Pending request not found" });
      }
      if (request.userId) {
         await userModel.findByIdAndDelete(request.userId);
      }

      request.status = 'rejected';
      request.rejectionReason = rejectionReason.trim();
      request.reviewedBy = adminId;
      request.reviewedAt = new Date();
      await request.save();

      res.status(200).json({
         message: "Request rejected successfully",
         request: {
            id: request._id,
            status: request.status,
            rejectionReason: request.rejectionReason,
            reviewedBy: request.reviewedBy,
            reviewedAt: request.reviewedAt
         }
      });
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};
