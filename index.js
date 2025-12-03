import "dotenv/config";
import express from "express";
import cors from "cors";
import todolistsRouter from "./routes/todolists.js";
import subtasksRouter from "./routes/subtasks.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { prisma } from "./lib/prisma.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/todolists", todolistsRouter);
app.use("/api/subtasks", subtasksRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Todo API Server" });
});

// Database health check
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "healthy", database: "connected" });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(503).json({ status: "unhealthy", database: "disconnected", error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Validate environment variables
const validateEnv = () => {
  const requiredEnvs = ["DATABASE_URL"];
  const missing = requiredEnvs.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error("Missing environment variables:", missing.join(", "));
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    validateEnv();
    console.log("Environment variables validated");

    // Test database connection (non-blocking)
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("✓ Database connection successful");
    } catch (dbErr) {
      console.warn("⚠ Database connection warning:", dbErr.message);
      console.warn("Server will start but database operations may fail");
    }

    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
