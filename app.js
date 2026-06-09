require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./src/config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Royal Marwar Boys PG API is running' });
});

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' }
});

app.use('/api/admin/auth/login', authLimiter);
app.use('/api/student/login', authLimiter);

// Define Routes
app.use('/api/admission', require('./src/routes/admissionRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/student', require('./src/routes/studentRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));

// Error Handler
app.use(require('./src/middleware/errorMiddleware'));

module.exports = app;
