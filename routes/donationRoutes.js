import express from 'express';
import { verifyToken, verifyVolunteerOrAdmin } from '../middleware/verifyToken.js';

const router = express.Router();

// Create donation request
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is blocked
    const user = await req.db.collection('users').findOne({ email: req.user.email });
    
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Blocked users cannot create donation requests' });
    }

    const {
      recipientName,
      recipientDistrict,
      recipientUpazila,
      hospitalName,
      fullAddress,
      bloodGroup,
      donationDate,
      donationTime,
      requestMessage
    } = req.body;

    const newRequest = {
      requesterName: req.user.name,
      requesterEmail: req.user.email,
      recipientName,
      recipientDistrict,
      recipientUpazila,
      hospitalName,
      fullAddress,
      bloodGroup,
      donationDate,
      donationTime,
      requestMessage,
      donationStatus: 'pending',
      donorInfo: null,
      createdAt: new Date()
    };

    const result = await req.db.collection('donationRequests').insertOne(newRequest);

    res.status(201).json({
      message: 'Donation request created successfully',
      requestId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating donation request', error: error.message });
  }
});

// Get all donation requests (with filters and pagination)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) {
      filter.donationStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await req.db.collection('donationRequests')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await req.db.collection('donationRequests').countDocuments(filter);

    res.status(200).json({
      requests,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalRequests: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donation requests', error: error.message });
  }
});

// Get pending donation requests only (public)
router.get('/pending', async (req, res) => {
  try {
    const requests = await req.db.collection('donationRequests')
      .find({ donationStatus: 'pending' })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending requests', error: error.message });
  }
});

// Get user's own donation requests
router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { requesterEmail: req.user.email };
    if (status) {
      filter.donationStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await req.db.collection('donationRequests')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await req.db.collection('donationRequests').countDocuments(filter);

    res.status(200).json({
      requests,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalRequests: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your requests', error: error.message });
  }
});

// Get recent 3 donation requests for dashboard
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const requests = await req.db.collection('donationRequests')
      .find({ requesterEmail: req.user.email })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent requests', error: error.message });
  }
});

// Get single donation request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = await import('mongodb');
    
    const request = await req.db.collection('donationRequests').findOne({
      _id: new ObjectId(id)
    });

    if (!request) {
      return res.status(404).json({ message: 'Donation request not found' });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donation request', error: error.message });
  }
});

// Update donation request
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = await import('mongodb');

    // Check if request belongs to user
    const request = await req.db.collection('donationRequests').findOne({
      _id: new ObjectId(id)
    });

    if (!request) {
      return res.status(404).json({ message: 'Donation request not found' });
    }

    // Check if user is the owner or admin/volunteer
    const user = await req.db.collection('users').findOne({ email: req.user.email });
    const isOwner = request.requesterEmail === req.user.email;
    const isAdminOrVolunteer = user.role === 'admin' || user.role === 'volunteer';

    if (!isOwner && !isAdminOrVolunteer) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    const {
      recipientName,
      recipientDistrict,
      recipientUpazila,
      hospitalName,
      fullAddress,
      bloodGroup,
      donationDate,
      donationTime,
      requestMessage
    } = req.body;

    const updateData = {
      recipientName,
      recipientDistrict,
      recipientUpazila,
      hospitalName,
      fullAddress,
      bloodGroup,
      donationDate,
      donationTime,
      requestMessage,
      updatedAt: new Date()
    };

    const result = await req.db.collection('donationRequests').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.status(200).json({ message: 'Donation request updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating donation request', error: error.message });
  }
});

// Update donation status (for volunteers and admins, or for done/cancel by owner)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending, inprogress, done, canceled
    const { ObjectId } = await import('mongodb');

    if (!['pending', 'inprogress', 'done', 'canceled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await req.db.collection('donationRequests').findOne({
      _id: new ObjectId(id)
    });

    if (!request) {
      return res.status(404).json({ message: 'Donation request not found' });
    }

    const user = await req.db.collection('users').findOne({ email: req.user.email });
    const isOwner = request.requesterEmail === req.user.email;
    const isAdminOrVolunteer = user.role === 'admin' || user.role === 'volunteer';

    // Only owner can change from inprogress to done/canceled
    if ((status === 'done' || status === 'canceled') && request.donationStatus === 'inprogress') {
      if (!isOwner) {
        return res.status(403).json({ message: 'Only request owner can mark as done/canceled' });
      }
    }

    // Volunteers and admins can update any status
    if (!isOwner && !isAdminOrVolunteer) {
      return res.status(403).json({ message: 'Not authorized to update status' });
    }

    const result = await req.db.collection('donationRequests').updateOne(
      { _id: new ObjectId(id) },
      { $set: { donationStatus: status, updatedAt: new Date() } }
    );

    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Donate (change status from pending to inprogress)
router.post('/:id/donate', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = await import('mongodb');

    const request = await req.db.collection('donationRequests').findOne({
      _id: new ObjectId(id)
    });

    if (!request) {
      return res.status(404).json({ message: 'Donation request not found' });
    }

    if (request.donationStatus !== 'pending') {
      return res.status(400).json({ message: 'This request is not available for donation' });
    }

    const result = await req.db.collection('donationRequests').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          donationStatus: 'inprogress',
          donorInfo: {
            name: req.user.name,
            email: req.user.email
          },
          updatedAt: new Date()
        }
      }
    );

    res.status(200).json({ message: 'Thank you for agreeing to donate!' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing donation', error: error.message });
  }
});

// Delete donation request
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = await import('mongodb');

    const request = await req.db.collection('donationRequests').findOne({
      _id: new ObjectId(id)
    });

    if (!request) {
      return res.status(404).json({ message: 'Donation request not found' });
    }

    const user = await req.db.collection('users').findOne({ email: req.user.email });
    const isOwner = request.requesterEmail === req.user.email;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    const result = await req.db.collection('donationRequests').deleteOne({
      _id: new ObjectId(id)
    });

    res.status(200).json({ message: 'Donation request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting donation request', error: error.message });
  }
});

export default router;