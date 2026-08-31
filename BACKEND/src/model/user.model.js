import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
   {
      email: {
         type: String,
         required: true,
         unique: true
      },
      contact: {
         type: String,
         required: false
      },
      password: {
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
         enum: ['citizen', 'admin', 'department_staff'],
         default: 'citizen',
      },
      googleId: {
         type: String,
      }


      //future use cases for user management and session handling

      //  isActive: {
      //    type: Boolean,
      //    default: true, // Used by admin to enable/disable user accounts
      //  },
      //  refreshToken: {
      //    type: String, // For Session Management & Refresh Token handling
      //  },
   },
   {
      timestamps: true, // Automatically manages createdAt and updatedAt (useful for audit logs)
   }
);

userSchema.pre('save', async function () {
   if (!this.isModified('password')) {
      return
   }

   const hash = await bcrypt.hash(this.password, 10);
   this.password = hash;
});

userSchema.methods.comparePassword = async function (password) {
   return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

