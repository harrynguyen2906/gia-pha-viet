/**
 * src/client.ts
 * Singleton PrismaClient instance for use in Node.js server environments.
 * Uses PrismaPg driver adapter (required for edge/pg compatibility).
 *
 * NOTE: This client is intended for server-side use only.
 * It is NOT suitable for use in the browser.
 */
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = new URL(process.env.DATABASE_URL!);
  // Strip pgBouncer and sslmode params — not valid for the pg Pool driver
  dbUrl.searchParams.delete("sslmode");
  dbUrl.searchParams.delete("pgbouncer");

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
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
