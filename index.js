import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import client from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import fundingRoutes from './routes/fundingRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ==========================================
// CORS CONFIGURATION - COMPLETE FIX
// ==========================================
const allowedOrigins = [
  'https://ph-a11-blood-bank-client.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

console.log('🌐 Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    console.log('📨 Incoming request from origin:', origin);
    
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) {
      console.log('✅ No origin - allowing');
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      console.log('   Expected one of:', allowedOrigins);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Body parser and cookie parser
app.use(express.json());
app.use(cookieParser());

// ==========================================
// DATABASE CONNECTION
// ==========================================
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('bloodDonationDB');
    console.log('✅ Connected to MongoDB');
    
    // Create indexes for better performance
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('donationRequests').createIndex({ donationStatus: 1 });
      await db.collection('donationRequests').createIndex({ requesterEmail: 1 });
      await db.collection('donationRequests').createIndex({ createdAt: -1 });
      console.log('✅ Database indexes created');
    } catch (indexError) {
      console.log('ℹ️ Indexes already exist or error creating them');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

connectDB();

// Make db accessible to routes
app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not connected' });
  }
  req.db = db;
  next();
});

// ==========================================
// ROUTES
// ==========================================

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Blood Donation Server is Running 🩸',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donation-requests', donationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/funding', fundingRoutes);

// ==========================================
// ERROR HANDLERS
// ==========================================

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.path);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      message: 'CORS error - Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(port, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS enabled for:`, allowedOrigins);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await client.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  await client.close();
  process.exit(0);
});