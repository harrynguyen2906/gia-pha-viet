import { auth } from "@/lib/auth";

export class TenantError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
    this.name = "TenantError";
  }
}

/**
 * Extract and validate clanId from the current session.
 * Throws TenantError if unauthenticated or user has no clan.
 */
export async function getTenantContext() {
  const session = await auth();

  if (!session?.user) {
    throw new TenantError("UNAUTHENTICATED", 401);
  }

  const clanId = (session.user as any).clanId as string | null | undefined;
  if (!clanId) {
    throw new TenantError("NO_CLAN", 403);
  }

  return {
    userId: (session.user as any).id as string,
    clanId,
    role: (session.user as any).role as string,
  };
}

/**
 * Verify a resource belongs to the user's clan.
 * Returns 404 (not 403) to avoid revealing existence of cross-tenant data.
 */
export function assertTenantOwnership(
  resource: { clanId: string } | null | undefined,
  expectedClanId: string,
): asserts resource is NonNullable<typeof resource> {
  if (!resource || resource.clanId !== expectedClanId) {
    throw new TenantError("NOT_FOUND", 404);
  }
}

/**
 * Centralised API error handler.
 * Maps TenantError codes to Vietnamese user-facing messages.
 */
export function handleTenantError(error: unknown): Response {
  if (error instanceof TenantError) {
    const messages: Record<string, string> = {
      UNAUTHENTICATED: "Vui lòng đăng nhập",
      NO_CLAN: "Không có quyền truy cập dòng tộc",
      NOT_FOUND: "Không tìm thấy",
    };
    return Response.json(
      { error: messages[error.code] ?? error.code },
      { status: error.status },
    );
  }
  console.error("Unhandled API error:", error);
  return Response.json({ error: "Lỗi hệ thống" }, { status: 500 });
}
