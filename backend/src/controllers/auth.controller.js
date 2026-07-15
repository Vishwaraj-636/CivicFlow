import userModel from '../models/user.model.js'
import departmentModel from '../models/department.model.js'
import jwt from 'jsonwebtoken'
import { sendEmail } from "../services/mail.service.js"

export async function register(req, res) {
  try {
    const { username, email, phoneNumber, password, accessCode } = req.body
    const normalizedAccessCode = accessCode?.trim().toUpperCase()

    // Check if user already exists
    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email or username already exists',
        success: false,
        error: 'User already exists'
      })
    }

    let role = 'citizen'
    let departmentId = null

    if (normalizedAccessCode) {
      const adminCode = (process.env.ADMIN_REGISTRATION_CODE || '').trim().toUpperCase()

      if (adminCode && normalizedAccessCode === adminCode) {
        role = 'admin'
      } else {
        const department = await departmentModel.findOne({ code: normalizedAccessCode })

        if (!department) {
          return res.status(400).json({
            success: false,
            message: 'Invalid access code',
            error: 'Access code does not match any department or admin code'
          })
        }

        role = 'official'
        departmentId = department._id
      }
    }

    // Create new user
    const newUser = await userModel.create({
      username,
      email,
      phoneNumber,
      password,
      role,
      departmentId,
    })

    const emailToken = jwt.sign({
      email: newUser.email,
    }, process.env.JWT_SECRET, {
      expiresIn: '1h' // Add an expiration for security
    })

    await sendEmail({
      to: email,
      subject: "Welcome to CivicFlow",
      html: `
      <h1>Welcome to CivicFlow</h1>
      <p>Thank you for registering with us. We're excited to have you on board!</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="http://localhost:3000/api/auth/verify-email?token=${emailToken}">Verify Email</a>
      <p>If you did not register with us, please ignore this email.</p>
      <p>Thank you,</p>
      <p>The CivicFlow Team</p>
      `,
      text: "Thank you for registering with CivicFlow. We're excited to have you on board!"
    })

    // // Generate JWT token
    // const token = jwt.sign(
    //   { userId: newUser._id, email: newUser.email },
    //   process.env.JWT_SECRET || 'your-secret-key',
    //   { expiresIn: '7d' }
    // )

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      success: true,
      // token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    })
  }
}

export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findOne({ email: decoded.email })

    if (!user) {
      return res.status(400).json({
        message: "Invalid token",
        success: false,
        err: "User not found"
      })
    }

    user.verified = true;
    await user.save();

    res.status(200).send(`
          <h1>Email Verified Successfully</h1>
          <p>You can now log in to your account.</p>

          <a href="http://localhost:3000/api/auth/login">Go to Login</a>
      `);
  }
  catch (err) {
    return res.status(400).json({
      message: "Invalid or expired token",
      success: false,
      err: err.message
    })
  }
}