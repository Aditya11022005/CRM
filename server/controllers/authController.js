const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Helpers for token generation
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'jwtsecretkeylead123', {
    expiresIn: process.env.JWT_EXPIRE || '1h',
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || 'jwtrefreshsecretkeylead321', {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

// Send response helper
const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to user model
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
};

// Generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already registered with this email' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: role || 'Business Owner',
      otp,
      otpExpires,
      isVerified: false,
    });

    // Send OTP email
    const message = `Welcome to Codeitz CRM. Please use the following 6-digit One Time Password (OTP) to verify your account:\n\n${otp}\n\nThis OTP will expire in 10 minutes.`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6366f1;">Welcome to Codeitz CRM!</h2>
        <p>Thank you for signing up. Please verify your account using the OTP code below:</p>
        <div style="font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; border: 1px solid #e5e7eb; color: #4f46e5; margin: 20px 0; letter-spacing: 4px;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Codeitz CRM Account Verification OTP',
        message,
        html,
      });
      res.status(201).json({
        success: true,
        message: 'Registration successful! Verification OTP sent to your email.',
        email: user.email,
      });
    } catch (err) {
      console.error('Email sending failed during registration:', err.message);
      // Even if email fails, let user know they are registered so they can request OTP resend
      res.status(201).json({
        success: true,
        message: 'Registration successful! (Email server offline, your OTP is: ' + otp + ' - Dev Mode Note)',
        email: user.email,
        devOtp: otp, // For seamless testing
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify OTP for verification/login
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Please provide email and OTP code' });
    }

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
    }

    // Verify user
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    await sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Resend OTP code
 * @route   POST /api/v1/auth/resend-otp
 * @access  Public
 */
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const message = `Your new Codeitz CRM verification code is:\n\n${otp}\n\nThis OTP will expire in 10 minutes.`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6366f1;">Codeitz CRM OTP Request</h2>
        <p>Use the following OTP to log in or verify your account:</p>
        <div style="font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; border: 1px solid #e5e7eb; color: #4f46e5; margin: 20px 0; letter-spacing: 4px;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Codeitz CRM Verification OTP',
        message,
        html,
      });
      res.status(200).json({ success: true, message: 'New OTP sent to email' });
    } catch (err) {
      res.status(200).json({
        success: true,
        message: 'New OTP generated! (Email offline fallback: devOtp=' + otp + ')',
        devOtp: otp,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Check user & match password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, error: 'Your account is blocked. Contact administrator.' });
    }

    // If not verified, trigger OTP process
    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      const html = `<p>Your verification OTP is <b>${otp}</b>. It will expire in 10 mins.</p>`;
      try {
        await sendEmail({ email: user.email, subject: 'Codeitz OTP Verification', message: `OTP: ${otp}`, html });
      } catch (e) {
        // ignore email send error and return verify needed flag
      }

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        message: 'Verification required. An OTP has been sent to your email.',
        email: user.email,
        devOtp: otp, // testing fallback
      });
    }

    await sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token is required' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'jwtrefreshsecretkeylead321');
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ success: false, error: 'Invalid refresh token' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ success: false, error: 'Account blocked' });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refreshToken = newRefreshToken;
      await user.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Session expired, please login again' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Forgot Password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'There is no user with that email' });
    }

    // Generate password reset OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const message = `You are receiving this email because you requested a password reset. Use this OTP:\n\n${otp}\n\nIf you did not request this, please ignore.`;
    const html = `<p>You requested a password reset. Your OTP is: <b>${otp}</b>. It expires in 10 mins.</p>`;

    try {
      await sendEmail({ email: user.email, subject: 'Codeitz CRM Password Reset OTP', message, html });
      res.status(200).json({ success: true, message: 'Password reset OTP sent to email' });
    } catch (err) {
      res.status(200).json({
        success: true,
        message: 'Reset OTP generated (devOtp=' + otp + ')',
        devOtp: otp,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reset Password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email, OTP code, and new password' });
    }

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset OTP code' });
    }

    // Set new password
    user.password = password;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully! You can now log in.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Logout User
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Current User Profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isVerified: req.user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update User Profile details / password
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email address is already in use' });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Please enter your current password to set a new password' });
      }
      
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Incorrect current password' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      }

      user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    next(err);
  }
};
