import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // category: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: false,
  }
)

const departmentModel = mongoose.model('Department', departmentSchema)

export default departmentModel