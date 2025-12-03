import { Prisma } from "@prisma/client";

/**
 * Global error handler middleware
 * Handles Prisma and general application errors
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

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

  // Prisma Runtime Error
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return res.status(500).json({ error: "Internal server error" });
  }

  // Custom validation errors
  if (err.status && err.message) {
    return res.status(err.status).json({ error: err.message });
  }

  // Default error
  return res.status(500).json({ error: "Internal server error" });
};

/**
 * Async error wrapper to catch errors in route handlers
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
