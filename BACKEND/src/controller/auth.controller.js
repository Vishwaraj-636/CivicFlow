import userModel from '../model/user.model.js';
import jwt from 'jsonwebtoken';
import {config} from '../config/congfig.js';


async function sendTokenResponse(user,res){
  const token = jwt.sign({
    id: user._id,

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

    if(existingUser){
      return res.status(400).json({message:"User already exists"});
    }

    const user = await new userModel({
      fullname,
      email,
      password,
      contact,
    })
    
  }
  catch(err){
    console.log(err);
    res.status(500).json({message:"Internal server error"});
  }
}
