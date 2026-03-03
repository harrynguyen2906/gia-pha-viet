import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", fieldErrors }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, isActive: true } } },
  });

  if (!resetToken) {
    return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 400 });
  }

  if (resetToken.usedAt) {
    return NextResponse.json({ error: "Token đã được sử dụng" }, { status: 400 });
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token đã hết hạn" }, { status: 400 });
  }

  if (!resetToken.user.isActive) {
    return NextResponse.json({ error: "Tài khoản không hoạt động" }, { status: 403 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ data: { message: "Mật khẩu đã được cập nhật thành công" } });
}
