import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, phone, username, password } = req.body;
    
    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      phone,
      username,
      password
    });
    
    // Generate token for the new user
    const token = generateToken(user._id);
    
    // Remove password from output
    user.password = undefined;
    
    // Send welcome email
    const welcomeEmail = {
      to: email,
      subject: 'Welcome to Rising Performance Hall',
      text: `Hello ${name},\n\nThank you for registering with Rising Performance Hall. You can now book our venue for your events.\n\nBest regards,\nThe Rising Performance Hall Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5927e3;">Welcome to Rising Performance Hall</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with Rising Performance Hall. You can now book our venue for your events.</p>
          <p>Best regards,<br>The Rising Performance Hall Team</p>
        </div>
      `
    };
    
    try {
      await sendEmail(welcomeEmail);
    } catch (error) {
      console.log('Email could not be sent', error);
    }
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: error.message || 'Server error during registration',
      error: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if username and password exist
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }
    
    // Find user and include password field
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Remove password from output
    user.password = undefined;
    
    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: error.message || 'Server error during login',
      error: error.message
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      message: error.message || 'Server error while fetching user data',
      error: error.message
    });
  }
};