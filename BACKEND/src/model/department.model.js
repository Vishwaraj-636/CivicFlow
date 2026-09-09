import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
   {
      fullname: {
         type: String,
         required: true
      },
      code: {
         type: String,
         required: true,
         unique: true
      },
      description: {
         type: String,
         required: false
      },
      isActive: {
         type: Boolean,
         default: true
      },
      categories: [{
         type: String
      }]
   },
   {
      timestamps: true,
   }
)


const Department = mongoose.model('Department', departmentSchema);
export default Department;