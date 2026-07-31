const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middlewares/error.middleware');

// Import Route Groups
const authRoutes = require('./routes/auth.routes');
const resourceRoutes = require('./routes/resource.routes');
const bookingRoutes = require('./routes/booking.routes');
const approvalRoutes = require('./routes/approval.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

dotenv.config();

const app = express();

// Global Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Campus Booking Portal API Service is running smoothly 🚀',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 Route Not Found Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route [${req.originalUrl}] not found.`,
  });
});

// Global Centralized Error Handler Middleware
app.use(errorHandler);

module.exports = app;
