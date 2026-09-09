import deptStaffRequestModel from '../model/deptStaffRequest.model.js';
import userModel from '../model/user.model.js';
import Department from '../model/department.model.js';
import bcrypt from 'bcryptjs';

/**
 * @route POST /api/request/dept-staff
 * @desc User request to become department staff
 * @access Public
 */
export const requestDeptStaff = async (req, res) => {
   const { email, contact, password, fullname, departmentId } = req.body;

   try {
      const department = await Department.findById(departmentId);

      if (!department) {
         return res.status(400).json({ message: "Department not found" });
      }

      // Check if email already exists in users
      const existingUser = await userModel.findOne({
         $or: [{ email }, { contact }]
      });

      // Check if email already has a pending request
      const existingRequest = await deptStaffRequestModel.findOne({
         email,
         status: 'pending'
      });

      if (existingRequest) {
         return res.status(400).json({
            message: "You already have a pending request for department staff role"
         });
      }

      if (existingUser && existingUser.role === 'admin') {
         return res.status(400).json({
            message: "Admin users cannot request department staff role"
         });
      }

      // Create or update request
      let request;
      if (existingUser) {
         // User exists, create request linked to user
         request = await deptStaffRequestModel.findOneAndUpdate(
            { email, userId: existingUser._id },
            {
               contact,
               fullname,
               password,
               departmentId: department._id,
               status: 'pending',
               userId: existingUser._id
            },
            { upsert: true, new: true }
         );
      } else {
         // New user, hash password and create request
         const hashedPassword = await bcrypt.hash(password, 10);
         request = await deptStaffRequestModel.create({
            email,
            contact,
            password: hashedPassword,
            fullname,
            departmentId: department._id
         });
      }

      res.status(201).json({
         message: "Department staff request submitted successfully",
         request: {
            id: request._id,
            email: request.email,
            fullname: request.fullname,
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

/**
 * @route GET /api/request/dept-staff
 * @desc Admin get all pending department staff requests
 * @access Admin only
 */
export const getAllDeptStaffRequests = async (req, res) => {
   try {
      const requests = await deptStaffRequestModel.find()
         .populate('departmentId', 'fullname code categories')
         .sort({ createdAt: -1 });
      res.status(200).json({ requests });
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};

/**
 * @route GET /api/request/dept-staff/:id
 * @desc Admin get specific request
 * @access Admin only
 */
export const getDeptStaffRequestById = async (req, res) => {
   try {
      const request = await deptStaffRequestModel.findById(req.params.id)
         .populate('departmentId', 'fullname code categories');

      if (!request) {
         return res.status(404).json({ message: "Request not found" });
      }

      res.status(200).json({ request });
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};

/**
 * @route POST /api/request/dept-staff/approve/:id
 * @desc Admin approve or reject department staff request
 * @access Admin only
 */
export const approveDeptStaffRequest = async (req, res) => {
   const { approve, rejectionReason } = req.body;
   const adminId = req.user?.id; // From JWT middleware

   try {
      const request = await deptStaffRequestModel.findById(req.params.id);

      if (!request) {
         return res.status(404).json({ message: "Request not found" });
      }

      if (request.status !== 'pending') {
         return res.status(400).json({
            message: `Cannot modify request with status: ${request.status}`
         });
      }

      if (approve) {
         // Approve request
         const department = await Department.findById(request.departmentId);

         if (!department) {
            return res.status(400).json({ message: "Requested department not found" });
         }

         let user = await userModel.findOne({ email: request.email });

         if (!user) {
            // Create new user as department staff
            user = await userModel.create({
               email: request.email,
               contact: request.contact,
               passwordHash: request.password,
               fullname: request.fullname,
               role: 'dept_staff',
               authProvider: 'local',
               profileCompleted: true,
               departmentId: department._id,
               isActive: true
            });
         } else if (user.role === 'citizen' || user.role === 'incomplete') {
            // Update existing citizen to department staff
            user.role = 'dept_staff';
            user.departmentId = department._id;
            user.profileCompleted = true;
            user.isActive = true;
            await user.save();
         } else if (user.role === 'dept_staff') {
            user.departmentId = department._id;
            await user.save();
         }

         request.status = 'approved';
         request.userId = user._id;
         request.reviewedBy = adminId;
         request.reviewedAt = new Date();
         await request.save();

         res.status(200).json({
            message: "Request approved successfully",
            request
         });
      } else {
         // Reject request
         request.status = 'rejected';
         request.rejectionReason = rejectionReason;
         request.reviewedBy = adminId;
         request.reviewedAt = new Date();
         await request.save();

         res.status(200).json({
            message: "Request rejected successfully",
            request
         });
      }
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};
