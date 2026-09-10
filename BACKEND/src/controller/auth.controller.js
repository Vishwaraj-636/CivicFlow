import userModel from '../model/user.model.js';
import deptStaffRequestModel from '../model/deptStaffRequest.model.js';
import Department from '../model/department.model.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';


async function sendTokenResponse(user, res) {
   const token = jwt.sign({
      id: user._id,
   }, config.JWT_SECRET, {
      expiresIn: '1d'
   })

   res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
   });

   res.status(200).json({
      user: {
         id: user._id,
         email: user.email,
         fullname: user.fullname,
         contact: user.contact,
         role: user.role,
         departmentId: user.departmentId,
         profileCompleted: user.profileCompleted,
         authProvider: user.authProvider
      }
   })
}

//register user
export const register = async (req, res) => {
   const { email, contact, password, fullname } = req.body;
   try {
      const existingUser = await userModel.findOne({
         $or: [
            { email },
            { contact }
         ]
      })

      if (existingUser) {
         return res.status(400).json({ message: "User already exists" });
      }

      const user = new userModel({
         fullname,
         email,
         passwordHash: password,
         contact,
         role: 'citizen',
         authProvider: 'local',
         profileCompleted: true,
         departmentId: null
      })

      await user.save();
      await sendTokenResponse(user, res);

   }
   catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
}

//login user
export const login = async (req, res) => {
   const { email, password } = req.body

   try {
      const user = await userModel.findOne({ email })
      if (!user) {
         return res.status(400).json({ message: "Invalid credentials" })
      }

      if (!user.isActive) {
         return res.status(403).json({ message: "Account is inactive" })
      }

      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
         return res.status(400).json({ message: "Invalid credentials" })
      }

      await sendTokenResponse(user, res, "user logged in successfully")
   }
   catch (err) {
      console.log(err)
      res.status(500).json({ message: "Internal server error" })
   }
}

export const googleLogin = (req, res) => {
   res.redirect('http://localhost:3000/api/auth/google');
}


//google callback
export const googleCallback = async (req, res) => {
   const { id, displayName, emails } = req.user;
   const email = emails[0].value;
   let user = await userModel.findOne({ googleId: id });

   if (!user && await userModel.exists({ email, authProvider: 'local' })) {
      return res.redirect('http://localhost:5173/login?error=google-account-already-used');
   }

   if (!user) {
      user = await userModel.create({
         email,
         googleId: id,
         fullname: displayName,
         role: 'citizen',
         authProvider: 'google',
         profileCompleted: false,
         departmentId: null
      })
   }

   if (!user.isActive) {
      return res.redirect('http://localhost:5173/login?error=account-inactive');
   }

   const token = jwt.sign({
      id: user._id,
   }, config.JWT_SECRET, {
      expiresIn: '1d'
   })

   res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
   })

   res.redirect(user.profileCompleted ? 'http://localhost:5173/dashboard' : 'http://localhost:5173/complete-profile')
}



export const completeGoogleProfile = async (req, res) => {
   const { role, contact, departmentId } = req.body;

   try {
      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
      if (!token) {
         return res.status(401).json({ message: "Unauthorized" });
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await userModel.findById(decoded.id);

      if (!user) {
         return res.status(404).json({ message: "User not found" });
      }

      if (!user.isActive) {
         return res.status(403).json({ message: "Account is inactive" });
      }

      if (user.profileCompleted) {
         return res.status(400).json({ message: "Profile already complete" });
      }

      if (role === 'citizen') {
         user.role = 'citizen';
         user.profileCompleted = true;
         user.departmentId = null;
         if (contact) user.contact = contact;
         await user.save();
         return await sendTokenResponse(user, res);
      } else if (role === 'dept_staff') {
         const department = await Department.findById(departmentId);

         if (!department) {
            return res.status(400).json({ message: "Department not found" });
         }

         if (contact) user.contact = contact;
         await user.save();

         // Guard: prevent duplicate pending requests for the same user
         const existingRequest = await deptStaffRequestModel.findOne({
            userId: user._id,
            status: 'pending'
         });

         if (existingRequest) {
            return res.status(400).json({ message: "You already have a pending staff request." });
         }

         // Create staff request without changing the user's role before approval.
         const request = await deptStaffRequestModel.create({
            email: user.email,
            contact: user.contact || contact || 'N/A',
            fullname: user.fullname,
            departmentId: department._id,
            status: 'pending',
            userId: user._id
         });


         //we can just stick to json.
         return res.status(200).json({ message: "Staff request initiated", request });
      } else {
         return res.status(400).json({ message: "Invalid role selected" });
      }

   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
}


export const logout = async (req, res) => {
   res.clearCookie('token');
   res.status(200).json({ message: "Logged out successfully" });
}

export const getCurrentUser = async (req, res) => {
   res.status(200).json({
      user: {
         id: req.user._id,
         email: req.user.email,
         fullname: req.user.fullname,
         contact: req.user.contact,
         role: req.user.role,
         departmentId: req.user.departmentId,
         profileCompleted: req.user.profileCompleted,
         authProvider: req.user.authProvider,
         profileImage: req.user.profileImage
      }
   });
};

export const updateProfile = async (req, res) => {
   const { fullname, contact, profileImage } = req.body;
   try {
      const user = req.user;
      if (fullname) user.fullname = fullname;
      if (contact) user.contact = contact;
      if (profileImage !== undefined) user.profileImage = profileImage;

      await user.save();

      res.status(200).json({
         user: {
            id: user._id,
            email: user.email,
            fullname: user.fullname,
            contact: user.contact,
            role: user.role,
            departmentId: user.departmentId,
            profileCompleted: user.profileCompleted,
            authProvider: user.authProvider,
            profileImage: user.profileImage
         }
      });
   } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
};
