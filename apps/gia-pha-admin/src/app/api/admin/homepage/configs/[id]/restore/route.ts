import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { findHomepageConfigOrNull } from "@/lib/homepage/configs";
import { getHomepageSession, isSuperAdmin } from "@/lib/homepage/auth";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getHomepageSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const source = await prisma.homepageConfig.findUnique({ where: { id } });
    if (!source) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    if (source.status === "DRAFT") {
      return NextResponse.json(
        { error: "Cannot restore a draft. Restore from a published or archived config." },
        { status: 400 }
      );
    }

    const restored = await prisma.homepageConfig.create({
      data: {
        status: "DRAFT",
        version: null,
        name: source.version ? `Restore v${source.version}` : `Restore ${source.id.slice(0, 8)}`,
        backgroundAssetId: source.backgroundAssetId,
        backgroundWidth: source.backgroundWidth,
        backgroundHeight: source.backgroundHeight,
        layers: source.layers as Prisma.InputJsonValue,
        createdBy: session.user.id,
        basedOnConfigId: source.id,
      },
    });

    const dto = await findHomepageConfigOrNull(restored.id);
    return NextResponse.json(dto, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/homepage/configs/[id]/restore error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
