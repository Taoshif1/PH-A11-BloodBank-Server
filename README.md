# Blood Donation Server API

Backend API for Blood Donation Application built with Node.js, Express, and MongoDB.

## 🚀 Live Server
- Production: https://blood-bank-server-nine.vercel.app

## 📋 Features
- JWT Authentication
- Role-based Access Control (Admin, Volunteer, Donor)
- Blood Donation Request Management
- Donor Search System
- Funding/Payment Integration (Stripe)
- User Management

## 🛠️ Tech Stack
- Node.js & Express.js
- MongoDB
- JWT for Authentication
- Stripe for Payments

## 📦 Installation
```bash
npm install
```

## 🔐 Environment Variables

Create `.env` file:
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=your_frontend_url
STRIPE_SECRET_KEY=your_stripe_key
NODE_ENV=production
```

## 🎯 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout user
- GET `/api/auth/me` - Get current user

### Users
- GET `/api/users` - Get all users (Admin)
- GET `/api/users/profile` - Get user profile
- PATCH `/api/users/profile` - Update profile
- GET `/api/users/stats` - Get dashboard stats

### Donation Requests
- GET `/api/donation-requests` - Get all requests
- GET `/api/donation-requests/pending` - Get pending requests
- POST `/api/donation-requests` - Create request
- GET `/api/donation-requests/:id` - Get single request
- PATCH `/api/donation-requests/:id` - Update request
- DELETE `/api/donation-requests/:id` - Delete request

### Search
- GET `/api/search/donors` - Search donors

### Funding
- GET `/api/funding` - Get all funding
- POST `/api/funding` - Create funding
- GET `/api/funding/total` - Get total funding

## 🌱 Seed Database
```bash
npm run seed
```

## 👥 Test Credentials
- **Admin:** admin@blooddonor.com / admin123
- **Volunteer:** volunteer@blooddonor.com / volunteer123
- **Donor:** john@example.com / password123