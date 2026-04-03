import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Always 200 — don't reveal whether email exists
    return NextResponse.json({ data: { message: "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi" } });
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // In V2 there is no email service — log the reset URL for development use
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset-password?token=${token}`;
    console.log(`[Password Reset] Email: ${email} | URL: ${resetUrl}`);
  }

  // Always return the same response to prevent user enumeration
  return NextResponse.json({
    data: { message: "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi" },
  });
}
