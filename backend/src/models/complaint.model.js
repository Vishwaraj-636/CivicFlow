import mongoose from 'mongoose'

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: { // NEW: Crucial for context
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'reviewing', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    severityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedDept: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    resolvedAt: { // NEW: Useful for performance metrics
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true, // UPDATED: Kept updatedAt for tracking modifications
  }
)

complaintSchema.index({ location: '2dsphere' })
// NEW: Index for faster sorting by status and creation date
complaintSchema.index({ status: 1, createdAt: -1 })

const complaintModel = mongoose.model('Complaint', complaintSchema)

export default complaintModel