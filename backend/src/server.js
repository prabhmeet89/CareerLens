'use strict';
const path = require('path');
const dotenv = require('dotenv');

// Capture test environment mode before loading .env files
const initialEnv = process.env.NODE_ENV;

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Restore NODE_ENV if it was set (e.g. by Jest or CI)
if (initialEnv) {
  process.env.NODE_ENV = initialEnv;
}

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { UPLOAD_DIR } = require('./config/storage');

// Routes
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');
const savedJobRoutes = require('./routes/savedJobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');


// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────

const { Server: SocketIOServer } = require('socket.io');
const io = new SocketIOServer(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Authenticate Socket.IO connections via JWT cookie
io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return next(new Error('Authentication required. Please log in.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid or expired session. Please log in again.'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  // Join the user's personal room (keyed by userId)
  socket.join(userId.toString());
  console.log(`[Socket.IO] User ${userId} connected (socket: ${socket.id})`);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User ${userId} disconnected`);
  });
});

// Make `io` accessible from req.app.get('io') in controllers
app.set('io', io);

// ─── Database & Redis (gated in test mode so tests manage DB isolation) ────────
if (process.env.NODE_ENV !== 'test') {
  // Connect Redis (non-blocking, graceful fallback)
  connectRedis();

  // Connect to MongoDB
  connectDB();
}

// ─── Security Middleware ───────────────────────────────────────────────────────

// Secure HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow static file serving
    contentSecurityPolicy: false, // Disabled for API server (frontend handles CSP)
  })
);

// CORS — only allow the configured frontend origin
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ];
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body and cookie parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file serving for local uploads
app.use('/uploads', express.static(UPLOAD_DIR));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Global API rate limiter (100 requests / 15 min per IP)
app.use('/api', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'CareerLens API',
    timestamp: new Date().toISOString(),
  });
});

// Application routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route '${req.originalUrl}' not found.`,
  });
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// ─── Start Server (only outside of test environment) ──────────────────────────
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Server] CareerLens Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Server] CORS enabled for client: ${CLIENT_URL}`);
    console.log(`[Socket.IO] Real-time notifications server active`);

    // ─── Gemini Model Availability Check ────────────────────────────────────
    // Validates that the configured GEMINI_MODEL is live and supports generateContent.
    // This prevents a deprecated model from causing confusing 404 errors at request time.
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    if (geminiApiKey && !geminiApiKey.includes('your_gemini_api_key')) {
      const https = require('https');
      const req = https.get(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}?key=${geminiApiKey}`,
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log(`[Gemini] ✅ Model '${geminiModel}' is available and ready.`);
            } else {
              console.warn(`[Gemini] ⚠️  Model '${geminiModel}' returned status ${res.statusCode}. It may be deprecated.`);
              console.warn(`[Gemini] ⚠️  Update GEMINI_MODEL in backend/.env. Available stable alias: gemini-flash-latest`);
              try {
                const parsed = JSON.parse(data);
                console.warn('[Gemini] API response:', parsed?.error?.message || data.slice(0, 200));
              } catch { /* ignore parse errors on the diagnostic output */ }
            }
          });
        }
      );
      req.on('error', (err) => {
        console.warn(`[Gemini] ⚠️  Could not validate model '${geminiModel}': ${err.message}`);
      });
      req.end();
    } else {
      console.log(`[Gemini] ℹ️  GEMINI_API_KEY not set — AI features will use heuristic fallbacks.`);
    }
  });
}

module.exports = { app, server, io };
