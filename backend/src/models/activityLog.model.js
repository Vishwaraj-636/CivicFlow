import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    fromStatus: {
      type: String,
      trim: true,
      default: null,
    },
    toStatus: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
)

const activityLogModel = mongoose.model('ActivityLog', activityLogSchema)

export default activityLogModel