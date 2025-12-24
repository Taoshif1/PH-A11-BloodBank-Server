import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { MongoClient, ServerApiVersion } from 'mongodb';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import fundingRoutes from './routes/fundingRoutes.js';
import { getDB } from './config/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ==========================================
// MONGODB CONNECTION SETUP
// ==========================================
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

const mongoClient = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = null;

async function connectToDatabase() {
  try {
    await mongoClient.connect();
    db = mongoClient.db('bloodDonationDB');
    
    // Create indexes for performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await db.collection('donationRequests').createIndex({ donationStatus: 1 }).catch(() => {});
    await db.collection('donationRequests').createIndex({ requesterEmail: 1 }).catch(() => {});
    await db.collection('donationRequests').createIndex({ createdAt: -1 }).catch(() => {});
    
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

// ==========================================
// CORS CONFIGURATION - CRITICAL
// ==========================================
const allowedOrigins = [
  'https://ph-a11-blood-bank-client.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

console.log('🌐 CORS allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 3600,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ==========================================
// BODY PARSING & COOKIES
// ==========================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ==========================================
// DATABASE MIDDLEWARE
// ==========================================
app.use(async (req, res, next) => {
  try {
    // This ensures the connection is established before the request continues
    const database = await getDB(); 
    req.db = database;
    next();
  } catch (error) {
    console.error('🔥 Database Connection Middleware Error:', error);
    res.status(503).json({ 
      message: 'Database connection could not be established',
      status: 'error'
    });
  }
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Blood Donation Server is Running 🩸',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donation-requests', donationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/funding', fundingRoutes);

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // CORS error handling
  if (err.message === 'CORS not allowed') {
    return res.status(403).json({
      message: 'CORS policy violation',
      origin: req.headers.origin
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================
async function startServer() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    // Then start the server
    app.listen(port, () => {
      console.log('='.repeat(60));
      console.log(`🚀 Blood Donation Server running on port ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 CORS enabled for: ${allowedOrigins.join(', ')}`);
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  await mongoClient.close();
  process.exit(0);
});

startServer();

// ==========================================
// EXPORT FOR VERCEL
// ==========================================
export default app;