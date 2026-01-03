import express from "express";
import cors from "cors";

import { env } from "./config/env";

import { rateLimit } from "./middleware/rateLimit";
import { errorHandler, AppError } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

import { authRouter } from "./routes/auth";
import { propertiesRouter } from "./routes/properties";
import { projectTypesRouter } from "./routes/projectTypes";
import { eventsRouter } from "./routes/events";
import { projectsRouter } from "./routes/projects";
import { recommendationsRouter } from "./routes/recommendations";
import { readinessRouter } from "./routes/readiness";
import { contractsRouter } from "./routes/contracts";
import { permitsRouter } from "./routes/permits";
import { escrowRouter } from "./routes/escrow";
import { closeoutRouter } from "./routes/closeout";
import { reviewsRouter } from "./routes/reviews";
import { pmRouter } from "./routes/pm";
import { contractorRouter } from "./routes/contractor";
import { milestonesRouter } from "./routes/milestones";
import { notificationsRouter } from "./routes/notifications";
import { automationRouter } from "./routes/automation";
import { adminRouter } from "./routes/admin";
import { mlRouter } from "./routes/ml";
import { startScheduledJobs } from './jobs/scheduledJobs.js';
import { stripeRouter } from "./routes/stripe";
import { uploadsRouter } from "./routes/uploads";
import { designVersionsRouter } from "./routes/designVersions";
import { designRouter } from "./routes/design";
import { estimatesRouter } from "./routes/estimates";

const app = express();
// Convert PORT to number and ensure it's valid
const PORT = Number(process.env.PORT) || 5000;

// Health check - registered FIRST to respond immediately without any middleware
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Trust proxy (for Railway/Vercel)
app.set("trust proxy", 1);

// Rate limiting
app.use(rateLimit);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Development: allow localhost origins and requests with no origin (mobile apps, Postman, etc.)
      if (env.NODE_ENV !== "production") {
        if (!origin) {
          return callback(null, true);
        }
        const localhostOrigins = [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:5173",
        ];
        if (localhostOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Development: allow all origins for flexibility
        return callback(null, true);
      }

      // Production: allow configured origin or vercel.app domains
      if (!origin) {
        logger.warn("CORS blocked request: no origin in production");
        return callback(new AppError(403, "Not allowed by CORS", "CORS_ERROR"));
      }

      // Check if origin matches CORS_ORIGIN if set
      if (env.CORS_ORIGIN && origin === env.CORS_ORIGIN) {
        return callback(null, true);
      }

      // Check if origin matches vercel.app pattern
      if (/\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Block all other origins
      logger.warn("CORS blocked request", { 
        origin, 
        allowed: env.CORS_ORIGIN || "*.vercel.app",
        nodeEnv: env.NODE_ENV 
      });
      callback(new AppError(403, "Not allowed by CORS", "CORS_ERROR"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Stripe webhook needs raw body - must be before JSON parser
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api/stripe", stripeRouter);

app.use("/api/auth", authRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/project-types", projectTypesRouter);
app.use("/api/events", eventsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api", readinessRouter);
app.use("/api", contractsRouter);
app.use("/api", permitsRouter);
app.use("/api", escrowRouter);
app.use("/api", closeoutRouter);
app.use("/api", reviewsRouter);
app.use("/api/pm", pmRouter);
app.use("/api/contractor", contractorRouter);
app.use("/api", milestonesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/automation", automationRouter);
app.use("/api/admin", adminRouter);
app.use("/api/ml", mlRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api", designVersionsRouter);
app.use("/api", designRouter);
app.use("/api/estimates", estimatesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use(errorHandler);

// Log PORT configuration on startup
console.log('🚀 Starting server...');
console.log(`   process.env.PORT: ${process.env.PORT || '(not set)'}`);
console.log(`   Final PORT: ${PORT}`);

// Start server - bind to 0.0.0.0 to accept connections from all interfaces (required for Railway/containers)
const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info("Server started", {
    port: PORT,
    nodeEnv: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN || "(not set - will allow vercel.app origins)",
  });

  // Start scheduled jobs after server starts (non-blocking)
  startScheduledJobs();
});

server.on("error", (error: NodeJS.ErrnoException) => {
  logger.error("Failed to start server", {
    error: error.message,
    code: error.code,
    port: PORT,
  });
  process.exit(1);
});

// Cleanup on exit
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});
