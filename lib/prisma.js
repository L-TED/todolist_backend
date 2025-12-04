import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// 환경 변수 확인 (Vercel/Render 배포 환경에서 DATABASE_URL 누락 방지)
const checkDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("[CRITICAL] DATABASE_URL environment variable is not set");
    console.error(
      "Available env vars:",
      Object.keys(process.env).filter(
        (key) =>
          key.toLowerCase().includes("database") ||
          key.toLowerCase().includes("url") ||
          key.toLowerCase().includes("prisma")
      )
    );

    // Vercel/Render에서는 서버가 시작되도록 허용 (나중에 요청 시 에러 처리)
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[WARN] Running in production without DATABASE_URL - API will fail on DB queries"
      );
    }
  }

  return dbUrl;
};

// Prisma 클라이언트 생성
const getPrismaClient = () => {
  const dbUrl = checkDatabaseUrl();

  const prismaOptions = {
    log: ["error", "warn"],
    errorFormat: "pretty",
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
