import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// 프로덕션 환경에서 Vercel + Render 최적화
const getPrismaClient = () => {
  const isProduction = process.env.NODE_ENV === "production";

  const prismaOptions = {
    log: process.env.DEBUG ? ["error", "warn", "info"] : ["error", "warn"],
    errorFormat: "pretty",
    // Vercel의 Serverless 환경을 위한 연결 풀 설정
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  };

  return new PrismaClient(prismaOptions);
};

export const prisma = globalForPrisma.prisma || getPrismaClient();

// 개발 환경에서만 global 저장 (메모리 누수 방지)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Connection error handling
prisma.$on("error", (e) => {
  console.error("[Prisma Error Event]", {
    message: e.message,
    target: e.target,
  });
});

prisma.$on("warn", (e) => {
  console.warn("[Prisma Warning]", e.message);
});

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing Prisma connection...");
    await prisma.$disconnect();
    process.exit(0);
  });
}
