import { prisma } from "./prisma";

/**
 * MT-004: Execute a Prisma operation with the RLS clan context set.
 *
 * Sets the `app.current_clan_id` PostgreSQL session variable so that
 * RLS policies (in supabase/migrations/20260303000002_v2_rls_policies.sql)
 * can filter by tenant as a safety net.
 *
 * Application-level clanId filtering in Prisma queries remains the PRIMARY
 * defence. RLS is the secondary safety net that catches any missed filters.
 *
 * NOTE: SET LOCAL only applies within the current transaction. Wrap in
 * prisma.$transaction to guarantee the variable is scoped correctly.
 */
export async function withTenantRLS<T>(
  clanId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_clan_id = '${clanId}'`,
    );
    return operation();
  });
}
