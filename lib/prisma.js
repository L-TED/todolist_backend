import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Connection error handling
prisma.$on("error", (e) => {
  console.error("Prisma Client Error:", e);
});

prisma.$connect().catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});
