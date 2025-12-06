import express from 'express';

const router = express.Router();

// Search donors by blood group, district, and upazila
router.get('/donors', async (req, res) => {
  try {
    const { bloodGroup, district, upazila } = req.query;

    // Build filter
    const filter = { status: 'active' }; // Only active users
    
    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }
    if (district) {
      filter.district = district;
    }
    if (upazila) {
      filter.upazila = upazila;
    }

    const donors = await req.db.collection('users')
      .find(filter)
      .project({ password: 0 }) // Don't send password
      .toArray();

    res.status(200).json(donors);
  } catch (error) {
    res.status(500).json({ message: 'Error searching donors', error: error.message });
  }
});

export default router;