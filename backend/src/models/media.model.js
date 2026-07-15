import mongoose from 'mongoose'

const mediaSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: { 
      type: String,
      required: true, 
    },
    type: { 
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, 
  }
)

const mediaModel = mongoose.model('Media', mediaSchema)

export default mediaModel