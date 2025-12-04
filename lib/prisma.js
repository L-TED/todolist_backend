import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Render과 Vercel 배포 환경 호환
const getPrismaClient = () => {
  // .env 파일에서 DATABASE_URL이 로드됨 (index.js의 dotenv/config 통해)
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
