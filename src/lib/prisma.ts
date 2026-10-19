import { PrismaClient } from "@prisma/client";

function cleanDatabaseUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  let url = String(raw).trim();
  const p1 = url.indexOf("postgresql://");
  const p2 = url.indexOf("postgres://");
  let idx = -1;
  if (p1 !== -1 && p2 !== -1) idx = Math.min(p1, p2);
  else if (p1 !== -1) idx = p1;
  else if (p2 !== -1) idx = p2;

  if (idx !== -1) {
    url = url.substring(idx);
  }
  while (url.endsWith('"') || url.endsWith("'") || url.endsWith(";")) {
    url = url.slice(0, -1).trim();
  }
  return url;
}

// Auto-detect Vercel Storage / Neon environment variable prefixes & clean formatting
const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.STORAGE_DATABASE_URL ||
  process.env.STORAGE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const activeDbUrl = cleanDatabaseUrl(rawDbUrl);
if (activeDbUrl) {
  process.env.DATABASE_URL = activeDbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(activeDbUrl
      ? {
          datasources: {
            db: {
              url: activeDbUrl,
            },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
