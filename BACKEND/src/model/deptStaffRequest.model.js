import mongoose from 'mongoose';

const deptStaffRequestSchema = new mongoose.Schema(
   {
      email: {
         type: String,
         required: true,
      },
      contact: {
         type: String,
         required: true,
      },
      fullname: {
         type: String,
         required: true,
      },
      password: {
         type: String,
         required: true,
      },
      department: {
         type: String,
         required: true,
      },
      status: {
         type: String,
         enum: ['pending', 'approved', 'rejected'],
         default: 'pending',
      },
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         default: null,
      },
      approvedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         default: null,
      },
      rejectionReason: {
         type: String,
         default: null,
      },
   },
   {
      timestamps: true,
   }
);

export default mongoose.model('DeptStaffRequest', deptStaffRequestSchema);
