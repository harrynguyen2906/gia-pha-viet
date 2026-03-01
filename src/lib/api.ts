import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = (await auth()) as Session | null;
  if (!session?.user) {
    return { session: null as Session | null, response: err("Unauthorized", 401) };
  }
  return { session, response: null };
}

export function getClanId(session: Session | null): string | null {
  return (session?.user as any)?.clanId ?? null;
}

export function getUserId(session: Session | null): string | null {
  return (session?.user as any)?.id ?? null;
}

export function getUserRole(session: Session | null): string {
  return (session?.user as any)?.role ?? "GUEST";
}

export function canEdit(role: string): boolean {
  return ["ADMIN", "HEAD_OF_HOUSE", "ELDER"].includes(role);
}

export function canDelete(role: string): boolean {
  return ["ADMIN", "HEAD_OF_HOUSE"].includes(role);
}

export function canCertify(role: string): boolean {
  return ["ADMIN", "HEAD_OF_HOUSE"].includes(role);
}
