import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHomepageConfigOrNull } from "@/lib/homepage/configs";
import { getHomepageSession, isSuperAdmin } from "@/lib/homepage/auth";
import { revalidateHomepage } from "@/lib/homepage/revalidate-homepage";

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
    const draft = await prisma.homepageConfig.findUnique({ where: { id } });
    if (!draft) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    if (draft.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT configs can be published" }, { status: 400 });
    }

    const backgroundAsset = await prisma.homepageAsset.findUnique({
      where: { id: draft.backgroundAssetId },
    });
    if (!backgroundAsset) {
      return NextResponse.json({ error: "Background asset not found" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const latestVersion = await tx.homepageConfig.aggregate({
        _max: { version: true },
      });
      const nextVersion = (latestVersion._max.version ?? 0) + 1;

      await tx.homepageConfig.updateMany({
        where: { status: "PUBLISHED" },
        data: { status: "ARCHIVED" },
      });

      await tx.homepageConfig.update({
        where: { id: draft.id },
        data: {
          status: "PUBLISHED",
          version: nextVersion,
          publishedBy: session.user.id,
          publishedAt: new Date(),
        },
      });
    });

    const published = await findHomepageConfigOrNull(id);
    const revalidation = await revalidateHomepage();

    return NextResponse.json({
      config: published,
      revalidation,
    });
  } catch (error) {
    console.error("POST /api/admin/homepage/configs/[id]/publish error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
