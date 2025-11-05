const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const emailService = require('../services/emailService');

const ACCOUNT_LOCK_THRESHOLD = parseInt(process.env.ACCOUNT_LOCK_THRESHOLD, 10) || 5;
const ACCOUNT_LOCK_DURATION = parseInt(process.env.ACCOUNT_LOCK_DURATION, 10) || 60 * 60 * 1000; // 1 hour
const VERIFICATION_TOKEN_EXPIRES = parseInt(process.env.VERIFICATION_TOKEN_EXPIRES, 10) || 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_EXPIRES = parseInt(process.env.RESET_TOKEN_EXPIRES, 10) || 60 * 60 * 1000; // 1 hour

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Check password strength (minimum 8 characters, at least one letter and one number)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain at least one letter and one number',
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Generate verification token
    const verificationToken = uuidv4();
    const verificationTokenExpires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES);

    // Create new user record
    const user = await User.create({
      email,
      password,
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email
    await emailService.sendVerificationEmail(user, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Error registering user' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to multiple failed login attempts. Please try again later.',
        accountLockedUntil: user.account_locked_until,
      });
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const attempts = (user.failed_login_attempts || 0) + 1;

      if (attempts >= ACCOUNT_LOCK_THRESHOLD) {
        const lockUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION);
        await User.lockAccount(user.id, lockUntil);
        return res.status(423).json({
          success: false,
          message: 'Account locked due to repeated failed login attempts. Please try again later.',
          accountLockedUntil: lockUntil,
        });
      }

      await User.updateFailedLoginAttempts(user.id, attempts);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        success: false,
        message: 'Please verify your email before logging in',
        needsVerification: true,
      });
    }

    // Reset failed login attempts
    await User.resetFailedLoginAttempts(user.id);

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data (excluding password)
    const {
      password_hash,
      reset_token,
      reset_token_expiry,
      verification_token,
      verification_token_expires,
      ...userData
    } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Error logging in' });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const user = await User.findByVerificationToken(token);

    if (!user || !user.verification_token_expires || new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    await User.verifyEmail(user.id);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Error verifying email' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // For security, don't reveal if the email exists or not
      return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent' });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRES);
    
    // Save reset token to user
    await User.setResetToken(email, resetToken, resetTokenExpiry);
    
    // Send password reset email
    await emailService.sendPasswordResetEmail(user, resetToken);
    
    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error processing forgot password request' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }
    
    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }
    
    // Check password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one letter and one number',
      });
    }
    
    const user = await User.findByResetToken(token);

    if (!user || !user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    await User.updatePassword(user.id, newPassword);
    await User.clearResetToken(user.id);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};
