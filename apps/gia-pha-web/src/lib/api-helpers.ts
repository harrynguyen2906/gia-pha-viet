import { TenantError } from "./tenant";

/**
 * Unified API error handler for tenant-scoped routes.
 * Maps TenantError codes to Vietnamese user-facing messages.
 * Called via .catch() pattern: getTenantContext().catch((e) => handleApiError(e))
 */
export function handleApiError(error: unknown): Response {
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
