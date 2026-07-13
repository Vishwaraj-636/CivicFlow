import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema(
  {
    name: {
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
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin', 'official', 'moderator'],
      default: 'user',
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
)
userSchema.pre("save",async function () {
  if(!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = async function (candidatePassword){
  return bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)

export default User