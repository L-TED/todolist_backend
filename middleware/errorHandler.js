import { Prisma } from "@prisma/client";

/**
 * Global error handler middleware
 * Handles Prisma and general application errors
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Error Details:", {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
  });

  // Prisma Known Request Error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      // Record not found
      return res.status(404).json({ error: "Record not found" });
    }
    if (err.code === "P2003") {
      // Foreign key constraint failed
      return res.status(400).json({ error: "Invalid foreign key reference" });
    }
    if (err.code === "P2002") {
      // Unique constraint failed
      return res.status(400).json({ error: "Unique constraint violation" });
    }
    return res.status(400).json({ error: "Database error" });
  }

  // Prisma Validation Error
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: "Validation error" });
  }

  // Prisma Runtime Error (Rust Panic)
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    console.error("[CRITICAL] Prisma Rust Panic:", {
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
    // Vercel/Render 환경에서는 서버 재시작 필요
    return res.status(503).json({
      error: "Database service temporarily unavailable",
      code: "RUST_PANIC",
    });
  }

  // Prisma Connection Error
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error("[DATABASE CONNECTION ERROR]", {
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
    return res.status(503).json({
      error: "Database connection unavailable",
      code: "CONNECTION_ERROR",
    });
  }

  // Handle timeout errors (Render free tier issue)
  if (err.message && err.message.includes("timeout")) {
    console.error("[DATABASE TIMEOUT]", {
      message: err.message,
      timestamp: new Date().toISOString(),
    });
    return res.status(503).json({
      error: "Database operation timeout",
      code: "TIMEOUT",
    });
  }

  // Custom validation errors
  if (err.status && err.message) {
    return res.status(err.status).json({ error: err.message });
  }

  // Default error
  return res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

/**
 * Async error wrapper to catch errors in route handlers
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
