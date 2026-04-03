/**
 * src/index.ts
 * Public API of @gia-pha/db.
 *
 * Re-exports:
 *  - prisma    : singleton PrismaClient instance
 *  - All Prisma-generated types and enums (for use in apps without
 *    needing to import from deep generated paths)
 */

// Singleton client
export { prisma, default } from "./client";

// All generated types, enums and utilities
export * from "./generated/prisma";
