import { NextResponse } from "next/server";
import { getPublishedHomepageConfig } from "@/lib/homepage/get-published-homepage";

export const revalidate = 60;

export async function GET() {
  try {
    const config = await getPublishedHomepageConfig();

    if (!config) {
      return NextResponse.json({ error: "No published homepage config" }, { status: 404 });
    }

    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("GET /api/public/homepage error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
