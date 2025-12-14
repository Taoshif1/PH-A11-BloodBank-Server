// UPDATED with stats endpoint

import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';

const router = express.Router();

// Get dashboard statistics - for admin/volunteer
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const user = await req.db.collection('users').findOne({ email: req.user.email });
    
    if (!user || (user.role !== 'admin' && user.role !== 'volunteer')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get total donors
    const totalDonors = await req.db.collection('users').countDocuments({ role: 'donor', status: 'active' });

    // Get total donation requests
    const totalRequests = await req.db.collection('donationRequests').countDocuments();

    // Get total funding
    const fundingResult = await req.db.collection('funding').aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]).toArray();

    const totalFunding = fundingResult.length > 0 ? fundingResult[0].totalAmount : 0;

    res.status(200).json({
      totalDonors,
      totalRequests,
      totalFunding
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Get all users (Admin only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const users = await req.db.collection('users')
      .find(filter)
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await req.db.collection('users').findOne(
      { email },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const { name, avatar, bloodGroup, district, upazila } = req.body;

    if (!name || !bloodGroup || !district || !upazila) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const updateData = {
      name,
      avatar,
      bloodGroup,
      district,
      upazila,
      updatedAt: new Date()
    };

    const result = await req.db.collection('users').updateOne(
      { email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Update user status (Block/Unblock) - Admin only
router.patch('/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const { ObjectId } = await import('mongodb');
    
    // Prevent admin from blocking themselves
    const targetUser = await req.db.collection('users').findOne({ _id: new ObjectId(id) });
    if (targetUser.email === req.user.email) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const result = await req.db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: `User ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully` 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

// Update user role - Admin only
router.patch('/:id/role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['donor', 'volunteer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const { ObjectId } = await import('mongodb');
    const result = await req.db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: `User role updated to ${role} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

export default router;