import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import routes from "./routes";
import { ENV } from "./config/env";
import { initializePaymentScheduler } from "./jobs/paymentScheduler";
import { initializeMemberCleanupScheduler } from "./jobs/memberCleanupScheduler";
import { initializeLeavingRequestDuesScheduler } from "./jobs/leavingRequestDuesScheduler";

const app = express();

const configureTrustProxy = () => {
  switch (ENV.TRUST_PROXY) {
    case "true":
      return true;
    case "false":
      return false;
    case "auto":
      // Auto-detect: trust proxy in production, enable in development to avoid warnings
      return ENV.NODE_ENV === "production" ? 1 : true;
    default:
      return isNaN(Number(ENV.TRUST_PROXY)) ? ENV.TRUST_PROXY : Number(ENV.TRUST_PROXY);
  }
};

app.set('trust proxy', configureTrustProxy());

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate Limiter with improved configuration
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     message: "Too many requests from this IP, please try again later.",
//     retryAfter: "15 minutes"
//   },
//   standardHeaders: true, 
//   legacyHeaders: false,
//   skipSuccessfulRequests: false,
//   skipFailedRequests: false,
// });
// app.use(limiter);

// API Routes
app.use("/api/v1", routes);

// Default route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MRM PG Backend API",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// Initialize schedulers
console.log('Initializing schedulers...');

// Initialize payment scheduler
initializePaymentScheduler();

// Initialize member cleanup scheduler
initializeMemberCleanupScheduler();

// Initialize leaving request dues scheduler
initializeLeavingRequestDuesScheduler();

export default app;
