# 🩸 Blood Donation Server API

> Backend API for the Blood Donation Application - Connecting donors with those in need

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

## 🌐 Live Demo

- **API Base URL**: [blood-bank-server](https://blood-bank-server-nine.vercel.app/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Blood Donation Server is a RESTful API built with Node.js & Express that powers the Blood Donation Application. It handles user authentication, donation request management, donor search, payment processing & more.

## 📁 Project Structure

```txt
├── config/
│   └── db.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── donationRoutes.js
│   ├── searchRoutes.js
│   └── fundingRoutes.js
├── middleware/
│   └── authMiddleware.js
├── index.js
├── seedData.js
├── .env
├── package.json
└── README.md
```

### Key Capabilities

- **User Management**: Registration, authentication & role-based access control
- **Donation Requests**: Create, read, update & delete blood donation requests
- **Donor Search**: Search for donors by blood group, location & availability
- **Payment Integration**: Accept donations via Stripe payment gateway
- **Real-time Updates**: Track donation request statuses (pending → in progress → done)

## ✨ Features

### Authentication & Authorization
- JWT-based authentication with HTTP-only cookies
- Role-based access control (Admin, Volunteer, Donor)
- Secure password handling
- Session management

### User Management
- User registration with profile information
- Profile updates with image upload support
- Block/unblock users (Admin only)
- Role assignment (Admin only)

### Donation Request System
- Create donation requests with detailed information
- Update request status through workflow
- Filter requests by status
- Pagination support
- Owner and admin-based permissions

### Donor Search
- Search by blood group
- Filter by location (district, upazila)
- Active donor filtering

### Funding System
- Stripe payment integration
- Transaction history
- Total funding calculations

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MongoDB 7.x with MongoDB Node Driver
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Stripe
- **Security**: 
  - CORS for cross-origin requests
  - Cookie-parser for secure cookies
  - Environment-based configuration

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 18 or higher  
- **MongoDB**: Atlas account or local installation  
- **Stripe Account**: For payment processing  
- **Git**: For version control

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/blooddon-server.git
cd blooddon-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

This creates:
- 1 Admin user
- 1 Volunteer user
- 3 Donor users
- 4 Sample donation requests
- 3 Funding records

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bloodDonationDB

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_super_secret_jwt_key_here

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### Generating a Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Production Environment Variables

For production deployment on Vercel, set these via the Vercel dashboard:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-client-app.vercel.app
STRIPE_SECRET_KEY=sk_live_your_production_stripe_key
```

## ▶️ Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### Production Mode

```bash
npm start
```

### Seed Database

```bash
npm run seed
```

## 📚 API Documentation

### Base URL

- **Local**: `http://localhost:5000/api`
- **Production**: `https://ph-a11-blood-bank-client.vercel.app/`

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "bloodGroup": "A+",
  "district": "Dhaka",
  "upazila": "Gulshan",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Logout
```http
POST /api/auth/logout
```

#### Check Auth Status
```http
GET /api/auth/me
```

### User Endpoints

#### Get All Users (Admin Only)
```http
GET /api/users?status=active
```

#### Get User Profile (Authenticated)
```http
GET /api/users/profile
```

#### Update Profile (Authenticated)
```http
PATCH /api/users/profile
Content-Type: application/json

{
  "name": "Updated Name",
  "avatar": "new-avatar-url",
  "bloodGroup": "B+",
  "district": "Dhaka",
  "upazila": "Gulshan"
}
```

#### Update User Status (Admin Only)
```http
PATCH /api/users/:id/status
Content-Type: application/json

{
  "status": "blocked" // or "active"
}
```

#### Update User Role (Admin Only)
```http
PATCH /api/users/:id/role
Content-Type: application/json

{
  "role": "volunteer" // or "admin", "donor"
}
```

#### Get Dashboard Stats (Admin/Volunteer)
```http
GET /api/users/stats
```

### Donation Request Endpoints

#### Create Request (Authenticated)
```http
POST /api/donation-requests
Content-Type: application/json

{
  "recipientName": "Patient Name",
  "recipientDistrict": "Dhaka",
  "recipientUpazila": "Dhanmondi",
  "hospitalName": "Dhaka Medical College",
  "fullAddress": "Zahir Raihan Rd, Dhaka",
  "bloodGroup": "A+",
  "donationDate": "2025-01-15",
  "donationTime": "10:00",
  "requestMessage": "Urgent blood needed for surgery"
}
```

#### Get All Requests (with filters)
```http
GET /api/donation-requests?status=pending&page=1&limit=10
```

#### Get Pending Requests (Public)
```http
GET /api/donation-requests/pending
```

#### Get User's Requests (Authenticated)
```http
GET /api/donation-requests/my-requests?status=pending&page=1&limit=10
```

#### Get Recent Requests (Authenticated)
```http
GET /api/donation-requests/recent
```

#### Get Single Request
```http
GET /api/donation-requests/:id
```

#### Update Request (Owner/Admin)
```http
PATCH /api/donation-requests/:id
Content-Type: application/json

{
  "recipientName": "Updated Name",
  "donationDate": "2025-01-20"
}
```

#### Update Status
```http
PATCH /api/donation-requests/:id/status
Content-Type: application/json

{
  "status": "inprogress" // pending, inprogress, done, canceled
}
```

#### Donate (Change to In Progress)
```http
POST /api/donation-requests/:id/donate
```

#### Delete Request (Owner/Admin)
```http
DELETE /api/donation-requests/:id
```

### Search Endpoints

#### Search Donors
```http
GET /api/search/donors?bloodGroup=A+&district=Dhaka&upazila=Gulshan
```

### Funding Endpoints

#### Get All Funding Records
```http
GET /api/funding
```

#### Get Total Funding
```http
GET /api/funding/total
```

#### Create Payment Intent (Authenticated)
```http
POST /api/funding/create-payment-intent
Content-Type: application/json

{
  "amount": 5000 // amount in cents ($50.00)
}
```

#### Save Funding Record (Authenticated)
```http
POST /api/funding
Content-Type: application/json

{
  "amount": 50.00,
  "transactionId": "pi_xxxxxxxxxxxxx"
}
```

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  avatar: String (URL),
  bloodGroup: String (A+, A-, B+, B-, AB+, AB-, O+, O-),
  district: String,
  upazila: String,
  password: String,
  role: String (donor, volunteer, admin),
  status: String (active, blocked),
  createdAt: Date,
  updatedAt: Date
}
```

### Donation Requests Collection

```javascript
{
  _id: ObjectId,
  requesterName: String,
  requesterEmail: String,
  recipientName: String,
  recipientDistrict: String,
  recipientUpazila: String,
  hospitalName: String,
  fullAddress: String,
  bloodGroup: String,
  donationDate: Date,
  donationTime: String,
  requestMessage: String,
  donationStatus: String (pending, inprogress, done, canceled),
  donorInfo: {
    name: String,
    email: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Funding Collection

```javascript
{
  _id: ObjectId,
  userName: String,
  userEmail: String,
  amount: Number,
  transactionId: String,
  fundingDate: Date
}
```

## 🚀 Deployment

### Deploy to Vercel

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy

```bash
vercel --prod
```

#### 4. Set Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

- `NODE_ENV` = `production`
- `MONGO_URI` = Your production MongoDB URI
- `JWT_SECRET` = Your production JWT secret
- `CLIENT_URL` = Your deployed client URL
- `STRIPE_SECRET_KEY` = Your production Stripe key

#### 5. Configure CORS

Make sure your deployed client URL is added to the CORS allowed origins in `index.js`.

### Deploy to Railway

1. Create account at [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add environment variables
4. Deploy automatically on push

### Deploy to Render

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

## 🧪 Testing

### Test Credentials

After running `npm run seed`:

**Admin:**
- Email: `admmin@blooddonor.com`
- Password: `admin123`

**Volunteer:**
- Email: `volunteer@blooddonor.com`
- Password: `volunteer123`

**Donor:**
- Email: `john@example.com`
- Password: `password123`

### Test Stripe Payments

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future date for expiry, any 3-digit CVC, and any ZIP code.

### API Testing Tools

- **Postman**: [Download Collection](link-to-postman-collection)
- **cURL**: See examples in API documentation
- **Thunder Client**: VS Code extension

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **HTTP-only Cookies**: Protection against XSS attacks
- **CORS Configuration**: Controlled cross-origin access
- **Password Security**: (Note: Hash passwords with bcrypt in production)
- **Rate Limiting**: (Recommended: Add express-rate-limit)
- **Input Validation**: Server-side validation on all endpoints

## 📝 Scripts

```json
{
  "start": "node index.js",           // Production server
  "dev": "nodemon index.js",          // Development with auto-reload
  "seed": "node seedData.js",         // Seed database
  "test": "echo 'Tests coming soon'", // Run tests
  "vercel-build": "echo 'Building'"   // Vercel build command
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👥 Author

- **GAZI TAOSHIF** 

## 🙏 Acknowledgments

- MongoDB for database hosting
- Stripe for payment processing
- Vercel for deployment platform
- Express.js community

---

**Made with ❤️ to save lives** 🩸