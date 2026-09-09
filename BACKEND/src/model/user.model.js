import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
   {
      email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true
      },
      contact: {
         type: String,
         required: false
      },
      passwordHash: {
         type: String,
         required: function () {
            return !this.googleId; // Password is required only if googleId is not present
         }
      },
      fullname: {
         type: String,
         required: true
      },
      role: {
         type: String,
         enum: ['citizen', 'dept_staff', 'admin'],
         default: 'citizen',
      },
      authProvider: {
         type: String,
         enum: ['local', 'google'],
         default: 'local'
      },
      departmentId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Department',
         default: null
      },
      profileCompleted: {
         type: Boolean,
         default: true
      },
      googleId: {
         type: String,
      },


      //future use cases for user management and session handling

      isActive: {
         type: Boolean,
         default: true, // Used by admin to enable/disable user accounts
      },
      //  refreshToken: {
      //    type: String, // For Session Management & Refresh Token handling
      //  },
   },
   {
      timestamps: true, // Automatically manages createdAt and updatedAt (useful for audit logs)
   }
);

userSchema.pre('save', async function () {
   if (!this.isModified('passwordHash') || !this.passwordHash) {
      return
   }

   this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

userSchema.methods.comparePassword = async function (password) {
   return this.passwordHash ? bcrypt.compare(password, this.passwordHash) : false;
};

const User = mongoose.model('User', userSchema);

export default User;

