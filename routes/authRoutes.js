// UPDATED with better cookie settings

import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Helper function to set cookie
const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict', // 'none' for cross-origin in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, name, avatar, bloodGroup, district, upazila, password, confirmPassword } = req.body;

    // Validation
    if (!email || !name || !bloodGroup || !district || !upazila || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await req.db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const newUser = {
      email,
      name,
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=dc2626&color=fff`,
      bloodGroup,
      district,
      upazila,
      password, // TODO: Hash with bcrypt in production
      role: 'donor',
      status: 'active',
      createdAt: new Date()
    };

    const result = await req.db.collection('users').insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
        bloodGroup: newUser.bloodGroup,
        district: newUser.district,
        upazila: newUser.upazila,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await req.db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    setAuthCookie(res, token);

    res.status(200).json({
      message: 'Login successful',
      user: {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bloodGroup: user.bloodGroup,
        district: user.district,
        upazila: user.upazila,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/'
  });
  res.status(200).json({ message: 'Logout successful' });
});

// Check auth status
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await req.db.collection('users').findOne(
      { email: decoded.email },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
