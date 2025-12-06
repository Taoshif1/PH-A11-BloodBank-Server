import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query; // Filter by status: active or blocked
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const users = await req.db.collection('users')
      .find(filter)
      .project({ password: 0 }) // Don't send password
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
    const { status } = req.body; // "active" or "blocked"

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "active" or "blocked"' });
    }

    const { ObjectId } = await import('mongodb');
    const result = await req.db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: `User ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

// Update user role - Admin only
router.patch('/:id/role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // "donor", "volunteer", or "admin"

    if (!['donor', 'volunteer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "donor", "volunteer", or "admin"' });
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