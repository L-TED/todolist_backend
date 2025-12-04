import "dotenv/config";
import express from "express";
import cors from "cors";
import todolistsRouter from "./routes/todolists.js";
import subtasksRouter from "./routes/subtasks.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { prisma } from "./lib/prisma.js";

const app = express();

// 동적 CORS 설정 (환경별)
const getAllowedOrigins = () => {
  const nodeEnv = process.env.NODE_ENV || "development";

  if (nodeEnv === "production") {
    // 프로덕션: 환경 변수에서 허용된 도메인 읽기
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    if (allowedOriginsEnv) {
      return allowedOriginsEnv.split(",").map((origin) => origin.trim());
    }
    // 기본값: Vercel, Render 등 배포 환경
    return [
      /\.vercel\.app$/,
      /\.render\.com$/,
      /\.railway\.app$/,
      /\.railway\.cloud$/,
      /\.replit\.dev$/,
    ];
  }

  // 개발: 로컬호스트 허용
  return ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging (개발 환경에서만)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

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

// Validate environment variables - 프로덕션에서는 경고만 표시
const validateEnv = () => {
  const requiredEnvs = ["DATABASE_URL"];
  const missing = requiredEnvs.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.warn("⚠ Missing environment variables:", missing.join(", "));
    console.warn("⚠ Attempting to start server anyway...");
    if (process.env.NODE_ENV === "production") {
      console.warn("⚠ Production mode: DATABASE_URL should be set for proper operation");
    }
  } else {
    console.log("✓ All required environment variables are set");
  }
};

// Start server (only for local/node execution, not for Vercel)
const startServer = async () => {
  try {
    validateEnv();
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

    // Test database connection with timeout (non-blocking)
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 5000)
      );
      await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
      console.log("✓ Database connection successful");
    } catch (dbErr) {
      console.warn("⚠ Database connection warning:", {
        message: dbErr.message,
        env: process.env.NODE_ENV,
      });
      console.warn("⚠ Server will start but database operations may fail");
    }

    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      if (process.env.NODE_ENV === "production") {
        console.log("Production mode: Render deployment active");
      }
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

// Start server only if not imported as a module (Vercel uses it as module via api/index.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

// Export for Vercel Serverless Functions
export default app;
