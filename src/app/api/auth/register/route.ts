import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

// Simple in-memory rate limiter: 5 requests per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu, vui lòng thử lại sau" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", fieldErrors }, { status: 400 });
  }

  const { displayName, email, password, clanName } = parsed.data;

  // Check email uniqueness (case-insensitive — email is already lowercased by schema)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email đã được sử dụng", fieldErrors: { email: ["Email đã được sử dụng"] } },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { user, clan } = await prisma.$transaction(async (tx) => {
    const clan = await tx.clan.create({
      data: { name: clanName, displayName: clanName },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "HEAD_OF_HOUSE",
        clanId: clan.id,
      },
    });

    await tx.userProfile.create({
      data: { userId: user.id, displayName },
    });

    return { user, clan };
  });

  return NextResponse.json(
    {
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        clanId: clan.id,
        clanName: clan.name,
      },
    },
    { status: 201 },
  );
}
