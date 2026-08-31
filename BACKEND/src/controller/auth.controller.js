import userModel from '../model/user.model.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/congfig.js';


async function sendTokenResponse(user, res) {
   const token = jwt.sign({
      id: user._id,
   }, config.JWT_SECRET, {
      expiresIn: '7d'
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
   const { email, contact, password, fullname, isCitizen } = req.body;
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
         role: isCitizen || 'citizen'
      })

      await user.save();
      await sendTokenResponse(user, res, "user registered successfully");

   }
   catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
   }
}


export const login = async (req,res) =>{
   const {email,password} = req.body

   try{
      const user = await userModel.findOne({email})
      if(!user){
         return res.status(400).json({message:"Invalid credentials"})
      }
      
      const isMatch = await user.comparePassword(password)
      if(!isMatch){
         return res.status(400).json({message:"Invalid credentials"})
      }

      await sendTokenResponse(user,res,"user logged in successfully")
   }
   catch(err){
      console.log(err)
      res.status(500).json({message:"Internal server error"})
   }
}