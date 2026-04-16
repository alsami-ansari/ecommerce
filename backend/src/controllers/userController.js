import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import { welcomeEmailTemplate } from '../utils/emailTemplates.js';


// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by their email
    const user = await User.findOne({ email });

    // Check if user exists & if password matches
       if (user && (await user.matchPassword(password))) {
      // 1. Generate both tokens and automatically attach the encrypted Cookie!
      const { accessToken, refreshToken } = generateToken(res, user._id);

      // 2. Save the Refresh Token to the database so we know this device is logged in
      user.refreshTokens.push(refreshToken);
      await user.save();

      // 3. Send ONLY the 15-minute Access Token to the frontend. The hacker never sees the Refresh Token!
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role, // We included Role!
        token: accessToken,
      });
    } else {

      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create the user
    // (The password gets hashed automatically because of the trigger we wrote in userModel.js!)
    const user = await User.create({
      name,
      email,
      password,
    });

        if (user) {
      // 1. Generate the same tokens!
      const { accessToken, refreshToken } = generateToken(res, user._id);
      
      // 2. Save it to the database
      user.refreshTokens.push(refreshToken);
      await user.save();

      // 3. Send response
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
        token: accessToken,
      });

      // 4. Send Welcome Email in background!
      sendEmail({
        email: user.email,
        subject: 'Welcome to Our Store! 🎉',
        message: welcomeEmailTemplate(user.name),
      });

    } else {

      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    // req.user was securely attached by our 'protect' middleware
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Forgot Password - Send Email
// @route   POST /api/users/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Generate a random 20-character puzzle token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash it and save it to the database (so we can compare it later)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // Expires in Exactly 15 Minutes
    
    await user.save();

    // 3. Send the Magic Link via Email
    const resetUrl = `http://localhost:5000/reset-password/${resetToken}`;
    
    sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset. Click the button below to choose a new password.</p>
          <a href="${resetUrl}" style="background-color: #fca311; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'Email sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Email could not be sent', error: error.message });
  }
};

// @desc    Reset Password via Token
// @route   PUT /api/users/resetpassword/:resetToken
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    // 1. Grab the token from the URL and hash it (to match our database format)
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    // 2. Ask MongoDB if this token exists AND if the 15-minute timer hasn't expired yet
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    // 3. Excellent! Change their password, and destroy the tokens immediately!
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};


