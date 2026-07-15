import mongoose from 'mongoose'

const aiPredictionSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
)

const aiPredictionModel = mongoose.model('AiPrediction', aiPredictionSchema)

export default aiPredictionModel