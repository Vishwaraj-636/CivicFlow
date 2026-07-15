import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
)

const commentModel = mongoose.model('Comment', commentSchema)

export default commentModel