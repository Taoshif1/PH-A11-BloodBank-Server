import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, name, avatar, bloodGroup, district, upazila, password } = req.body;

    // Check if user already exists
    const existingUser = await req.db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user (Note: In production, hash the password with bcrypt)
    const newUser = {
      email,
      name,
      avatar,
      bloodGroup,
      district,
      upazila,
      password, // TODO: Hash this with bcrypt in production
      role: 'donor', // Default role
      status: 'active', // Default status
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
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
        bloodGroup: newUser.bloodGroup,
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

    // Find user
    const user = await req.db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password (Note: Use bcrypt.compare in production)
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
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
});

export default router;