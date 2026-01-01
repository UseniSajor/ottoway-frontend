import express from "express";
import cors from "cors";
import { createServer } from "http";

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
const PORT = env.PORT;

// Trust proxy (for Railway/Vercel)
app.set("trust proxy", 1);

// Rate limiting
app.use(rateLimit);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) in development
      if (!origin && env.NODE_ENV === "development") {
        return callback(null, true);
      }

      // In production, only allow configured origin
      if (env.NODE_ENV === "production") {
        const allowedOrigins = [env.CORS_ORIGIN];
        if (origin && allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn("CORS blocked request", { origin, allowed: env.CORS_ORIGIN });
          callback(new AppError(403, "Not allowed by CORS", "CORS_ERROR"));
        }
      } else {
        // Development: allow localhost
        callback(null, true);
      }
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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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

/**
 * Start server with graceful port conflict handling
 * If the configured port is in use, tries the next available port
 */
function startServer() {
  const requestedPort = parseInt(PORT, 10);
  const maxPortAttempts = 10; // Try up to 10 ports
  let attempts = 0;

  function tryListen(port: number) {
    const server = createServer(app);

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        attempts++;
        if (attempts >= maxPortAttempts) {
          logger.error(
            `Failed to find available port after ${maxPortAttempts} attempts. Last tried: ${port}`
          );
          process.exit(1);
        }
        logger.warn(`Port ${port} is already in use, trying port ${port + 1}...`);
        server.close();
        // Try next port
        tryListen(port + 1);
      } else {
        // Different error, log and exit
        logger.error("Failed to start server", { 
          error: error.message, 
          code: error.code,
          port: port
        });
        process.exit(1);
      }
    });

    server.listen(port, () => {
      // Successfully bound to port
      if (port !== requestedPort) {
        logger.warn(
          `Port ${requestedPort} was in use. Server started on port ${port} instead.`
        );
      }

      logger.info("Server started", {
        port: port,
        requestedPort: requestedPort,
        nodeEnv: env.NODE_ENV,
        corsOrigin: env.CORS_ORIGIN,
      });

      // Start scheduled jobs after server starts
      startScheduledJobs();
    });
  }

  tryListen(requestedPort);
}

startServer();

// Cleanup on exit
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});
