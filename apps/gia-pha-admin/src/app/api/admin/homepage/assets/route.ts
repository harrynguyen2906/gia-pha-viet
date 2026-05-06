import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHomepageSession } from "@/lib/homepage/auth";
import { toHomepageAssetDto } from "@/lib/homepage/dto";
import { uploadHomepageAsset } from "@/lib/server/homepage-storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function GET() {
  try {
    const session = await getHomepageSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assets = await prisma.homepageAsset.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets.map(toHomepageAssetDto));
  } catch (error) {
    console.error("GET /api/admin/homepage/assets error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getHomepageSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kindValue = String(formData.get("kind") ?? "OVERLAY").toUpperCase();
    const widthValue = Number(formData.get("width") ?? 0);
    const heightValue = Number(formData.get("height") ?? 0);
    const hasAlphaValue = formData.get("hasAlpha");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Invalid file size (max 5MB)" }, { status: 400 });
    }

    const kind = kindValue === "BACKGROUND" ? "BACKGROUND" : "OVERLAY";

    const width = Number.isFinite(widthValue) && widthValue > 0 ? Math.round(widthValue) : 0;
    const height = Number.isFinite(heightValue) && heightValue > 0 ? Math.round(heightValue) : 0;

    if (!width || !height) {
      return NextResponse.json(
        { error: "Image dimensions are required for homepage assets" },
        { status: 400 }
      );
    }

    const hasAlpha = hasAlphaValue === null ? null : String(hasAlphaValue).toLowerCase() === "true";

    const upload = await uploadHomepageAsset({ kind, file });

    const asset = await prisma.homepageAsset.create({
      data: {
        kind,
        fileName: file.name,
        storageKey: upload.storageKey,
        publicUrl: upload.publicUrl,
        mimeType: file.type,
        fileSize: file.size,
        width,
        height,
        hasAlpha,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json(toHomepageAssetDto(asset), { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/homepage/assets error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
