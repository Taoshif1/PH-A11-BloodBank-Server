import express from 'express';
import Stripe from 'stripe';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get all funding records
router.get('/', async (req, res) => {
  try {
    const funding = await req.db.collection('funding')
      .find()
      .sort({ fundingDate: -1 })
      .toArray();

    res.status(200).json(funding);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching funding', error: error.message });
  }
});

// Get total funding amount
router.get('/total', async (req, res) => {
  try {
    const result = await req.db.collection('funding').aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]).toArray();

    const totalFunding = result.length > 0 ? result[0].totalAmount : 0;

    res.status(200).json({ totalFunding });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating total funding', error: error.message });
  }
});

// Create payment intent
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body; // amount in cents (e.g., 1000 = $10.00)

    if (!amount || amount < 50) {
      return res.status(400).json({ message: 'Minimum amount is $0.50' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount),
      currency: 'usd',
      metadata: {
        userEmail: req.user.email,
        userName: req.user.name
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment intent', error: error.message });
  }
});

// Save funding record after successful payment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { amount, transactionId } = req.body;

    const newFunding = {
      userName: req.user.name,
      userEmail: req.user.email,
      amount: parseFloat(amount),
      transactionId,
      fundingDate: new Date()
    };

    const result = await req.db.collection('funding').insertOne(newFunding);

    res.status(201).json({
      message: 'Thank you for your contribution!',
      fundingId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving funding record', error: error.message });
  }
});

export default router;