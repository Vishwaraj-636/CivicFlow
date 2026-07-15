import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['citizen', 'admin', 'official'],
      default: 'citizen',
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: function () { return this.role === 'official'; },
      default: null,
    },
    verified: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
)

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

const userModel = mongoose.model('User', userSchema)

export default userModel