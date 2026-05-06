import { auth } from "@/lib/auth";

export async function getHomepageSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export function isSuperAdmin(session: NonNullable<Awaited<ReturnType<typeof getHomepageSession>>>) {
  return session.user.adminRole === "SUPER_ADMIN";
}
