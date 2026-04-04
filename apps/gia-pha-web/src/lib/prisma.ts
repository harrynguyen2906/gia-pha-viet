import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // pg v8 treats 'sslmode=require' as 'verify-full', which fails against
  // Supabase's cert chain. Strip SSL params from the URL and configure
  // TLS explicitly via the Pool option instead.
  const dbUrl = new URL(process.env.DATABASE_URL!);
  dbUrl.searchParams.delete("sslmode");
  dbUrl.searchParams.delete("pgbouncer"); // Prisma-specific param; not for pg
  const pool = new Pool({
    connectionString: dbUrl.toString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
