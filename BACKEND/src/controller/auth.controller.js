import userModel from '../model/user.model.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';


async function sendTokenResponse(user, res) {
   const token = jwt.sign({
      id: user._id,
   }, config.JWT_SECRET, {
      expiresIn: '1d'
   })

   res.status(200).json({
      token,
      user: {
         id: user._id,
         email: user.email,
         fullname: user.fullname,
         contact: user.contact,
         role: user.role
      }
   })
}

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

      const user = await new userModel({
         fullname,
         email,
         password,
         contact,
         role: req.body.role || 'citizen'
      })

      await user.save();
      await sendTokenResponse(user, res);

   }
   catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
}


export const login = async (req, res) => {
   const { email, password } = req.body

   try {
      const user = await userModel.findOne({ email })
      if (!user) {
         return res.status(400).json({ message: "Invalid credentials" })
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

export const googleCallback = async (req, res) => {
   const { id, displayName, emails, photos } = req.user;

   const email = emails[0].value;
   const profilePic = photos[0].value;


   let user = await userModel.findOne({
      email
   });

   if (!user) {
      user = await userModel.create({
         email,
         googleId: id,
         fullname: displayName,
      })
   }

   const token = jwt.sign({
      id: user._id,
   }, config.JWT_SECRET, {
      expiresIn: '1d'
   })

   res.cookie('token', token)

   res.redirect("http://localhost:5173/")
}