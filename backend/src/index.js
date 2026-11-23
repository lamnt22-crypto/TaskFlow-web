require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import configurations and routes
const { poolPromise } = require('./config/database');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const errorHandler = require('./middlewares/errorHandler');

// OAuth dependencies
const session = require('express-session');
const passport = require('./config/passport');

const app = express();

// Create tables if they don't exist
// require('./models/schema')();

// Start Cron Jobs (Daily Email Reminders)
const cronService = require('./services/cronService');
cronService.startCron();

const PORT = process.env.PORT || 5000;

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all in production/demo to prevent CORS blocks
  },
  credentials: true
})); // Enable CORS for frontend with cookies
app.use(cookieParser()); // Parse incoming cookies
app.use(express.json()); // Parse incoming JSON requests

// OAuth Session Setup (Required by passport for OAuth strategies)
app.use(session({
  secret: process.env.SESSION_SECRET || 'oauth_session_super_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 10 // 10 minutes session for OAuth flow
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/health', healthRoutes);
app.use('/public', express.static('public'));
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/oauth', oauthRoutes);

// 404 Route Handler for undefined API routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API Endpoint Not Found'
    });
  }
  next();
});

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Initialize Database connection promise
  poolPromise.catch(() => {
    console.warn('⚠️ Server started, but database is not connected. Health check will fail.');
  });
});
