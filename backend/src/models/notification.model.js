import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: { 
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, 
  }
)


notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 })

const notificationModel = mongoose.model('Notification', notificationSchema)

export default notificationModel