import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import slowDown from "express-slow-down";
import userCustomerRouter from "./routes/userCustomerRoute.js";
import userAdminRoute from "./routes/userAdminRoute.js";
import articleRoutes from "./routes/articleRoutes.js";
import catalogRoutes from "./routes/catalogRoute.js";
import feedbackRoute from "./routes/feedbackRoutes.js";
import keranjangrouter from "./routes/keranjangRoute.js";
import PortofolioRouter from "./routes/portofolioRoute.js";

const app = express();

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// 1. Helmet - Set secure HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Trust proxy (penting untuk rate limiting di balik reverse proxy)
app.set("trust proxy", 1);

// 3. Rate Limiting - Mencegah terlalu banyak request dari IP yang sama
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per windowMs
  message: {
    success: false,
    message: "Terlalu banyak request dari IP ini, coba lagi dalam 15 menit",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === "development") {
      return req.ip === "127.0.0.1" || req.ip === "::1";
    }
    return false;
  },
});

// Rate limit khusus untuk AUTH endpoints (lebih ketat)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Terlalu banyak percobaan login, coba lagi dalam 15 menit",
  },
  skipSuccessfulRequests: true,
});

// Rate limit khusus untuk API yang sensitif
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Limit tercapai, coba lagi dalam 1 jam",
  },
});

// 4. Speed Limiter - Memperlambat request yang terlalu cepat
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
  maxDelayMs: 5000,
});

// Apply global rate limiting
app.use(limiter);
app.use(speedLimiter);

// 5. Custom Mongo Sanitizer - Mencegah NoSQL injection
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        // Hapus keys yang mengandung $ atau .
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
  };

  // Sanitize body, query, dan params
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

app.use(sanitizeInput);

// 6. HPP - Mencegah HTTP Parameter Pollution
app.use(hpp());

// ========================================
// STANDARD MIDDLEWARE
// ========================================

// Cookie Parser
app.use(cookieParser());

// CORS Configuration
const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:3000";

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      FRONTEND_URL,
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Body Parser dengan limit size
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ========================================
// ROUTES
// ========================================

// Apply auth rate limiter untuk endpoint authentication
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/register", authLimiter);
app.use("/customer/login", authLimiter);
app.use("/customer/register", authLimiter);

// Routes utama
app.use("/api/admin", userAdminRoute);
app.use("/customer", userCustomerRouter);
app.use("/articles", articleRoutes);
app.use("/catalogs", catalogRoutes);
app.use("/feedbacks", feedbackRoute);
app.use("/cart", keranjangrouter);
app.use("/portofolio", PortofolioRouter);

// Health Check / Test Route
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    version: "1.0.0",
  });
});

// ========================================
// ERROR HANDLERS
// ========================================

// 404 Handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;