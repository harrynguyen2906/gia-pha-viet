import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId, canEdit } from "@/lib/api";

// Accept canonical 36-char UUID form used in DB, including legacy seeded IDs
// that may not match strict RFC version/variant constraints.
const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  parentId: z.string().trim().regex(uuidLike, "Invalid parentId format"),
  childId: z.string().trim().regex(uuidLike, "Invalid childId format"),
  relationshipType: z.enum(["BIOLOGICAL", "ADOPTED", "STEP"]).default("BIOLOGICAL"),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!canEdit((session?.user as any)?.role)) return err("Forbidden", 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const { parentId, childId, relationshipType } = parsed.data;
  if (parentId === childId) return err("Cannot link member to itself", 422);

  // Ensure both members belong to this clan
  const [parent, child] = await Promise.all([
    prisma.member.findFirst({ where: { id: parentId, clanId: clanId ?? undefined } }),
    prisma.member.findFirst({ where: { id: childId, clanId: clanId ?? undefined } }),
  ]);
  if (!parent || !child) return err("Members not found in clan", 404);

  const rel = await prisma.relationship.upsert({
    where: { parentId_childId: { parentId, childId } },
    update: { relationshipType },
    create: { parentId, childId, relationshipType },
  });

  return ok(rel, 201);
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  if (!canEdit((session?.user as any)?.role)) return err("Forbidden", 403);

  const { parentId, childId } = await req.json();
  await prisma.relationship.deleteMany({ where: { parentId, childId } });
  return ok({ message: "Removed" });
}
