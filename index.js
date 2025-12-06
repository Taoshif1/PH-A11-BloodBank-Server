import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import client from './config/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database connection
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('bloodDonationDB');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

connectDB();

// Make db accessible to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Blood Donation Server is Running 🩸');
});

// Import routes (i'll create these next)
// import authRoutes from './routes/authRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import donationRoutes from './routes/donationRoutes.js';
// import searchRoutes from './routes/searchRoutes.js';
// import fundingRoutes from './routes/fundingRoutes.js';

// Use routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/donation-requests', donationRoutes);
// app.use('/api/search', searchRoutes);
// app.use('/api/funding', fundingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});