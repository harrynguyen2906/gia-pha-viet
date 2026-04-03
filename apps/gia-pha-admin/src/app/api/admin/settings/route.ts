import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Temporary in-memory state. In production, this should be in Redis, Vercel KV, or a PostgreSQL table.
let settingsConfig = {
  platformName: "Gia Pha Platform",
  defaultCurrency: "VND",
  gracePeriodDays: 3,
  trialPeriodDays: 14
};

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json(settingsConfig);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Maybe check if role is SUPER_ADMIN, assuming session.user.role exists (if it helps to differentiate)

    const payload = await request.json();
    settingsConfig = { ...settingsConfig, ...payload };

    return NextResponse.json({ success: true, settings: settingsConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
