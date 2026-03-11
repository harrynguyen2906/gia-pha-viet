import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, canEdit, canDelete } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId } = tc;

  const member = await prisma.member.findFirst({
    where: { id, clanId, deletedAt: null },
    include: {
      parentRelations: {
        include: { parent: { select: { id: true, fullName: true, isDeceased: true, avatarUrl: true } } },
      },
      childRelations: {
        include: { child: { select: { id: true, fullName: true, isDeceased: true, avatarUrl: true } } },
      },
      spousesA: {
        include: { memberB: { select: { id: true, fullName: true, isDeceased: true, avatarUrl: true } } },
      },
      spousesB: {
        include: { memberA: { select: { id: true, fullName: true, isDeceased: true, avatarUrl: true } } },
      },
      graveSite: {
        include: { media: { orderBy: { sortOrder: "asc" } } },
      },
      media: { orderBy: { sortOrder: "asc" } },
      offerings: { select: { id: true } },
    },
  });

  if (!member) return err("Member not found", 404);

  const [thisMonthOfferCount, totalOfferCount] = await Promise.all([
    prisma.virtualOffering.count({
      where: {
        memberId: id,
        createdAt: { gte: new Date(new Date().setDate(1)) },
      },
    }),
    prisma.virtualOffering.count({ where: { memberId: id } }),
  ]);

  return ok({
    ...member,
    birthDateSolar: member.birthDateSolar?.toISOString().split("T")[0] ?? null,
    deathDateSolar: member.deathDateSolar?.toISOString().split("T")[0] ?? null,
    parents: member.parentRelations.map((r) => r.parent),
    children: member.childRelations.map((r) => r.child),
    spouses: [
      ...member.spousesA.map((s) => s.memberB),
      ...member.spousesB.map((s) => s.memberA),
    ],
    offeringCount: { thisMonth: thisMonthOfferCount, total: totalOfferCount },
  });
}

const updateMemberSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  isDeceased: z.boolean().optional(),
  birthDateSolar: z.string().nullable().optional(),
  birthDateLunar: z.string().nullable().optional(),
  deathDateSolar: z.string().nullable().optional(),
  deathDateLunar: z.string().nullable().optional(),
  departureRite: z.string().nullable().optional(),
  biography: z.string().nullable().optional(),
  lineageRole: z.enum(["HEAD_OF_HOUSE", "ELDER", "HEIR", "YOUTH", "MEMBER"]).optional(),
  branchName: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId, role } = tc;
  if (!canEdit(role)) return err("Forbidden", 403);

  const body = await req.json();
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const member = await prisma.member.updateMany({
    where: { id, clanId, deletedAt: null },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.isDeceased !== undefined ? { isDeceased: data.isDeceased } : {}),
      ...(data.birthDateSolar !== undefined ? { birthDateSolar: data.birthDateSolar ? new Date(data.birthDateSolar) : null } : {}),
      ...(data.birthDateLunar !== undefined ? { birthDateLunar: data.birthDateLunar } : {}),
      ...(data.deathDateSolar !== undefined ? { deathDateSolar: data.deathDateSolar ? new Date(data.deathDateSolar) : null } : {}),
      ...(data.deathDateLunar !== undefined ? { deathDateLunar: data.deathDateLunar } : {}),
      ...(data.departureRite !== undefined ? { departureRite: data.departureRite } : {}),
      ...(data.biography !== undefined ? { biography: data.biography } : {}),
      ...(data.lineageRole !== undefined ? { lineageRole: data.lineageRole } : {}),
      ...(data.branchName !== undefined ? { branchName: data.branchName } : {}),
    },
  });

  if (member.count === 0) return err("Not found or forbidden", 404);
  return ok({ message: "Updated" });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId, role } = tc;
  if (!canDelete(role)) return err("Forbidden", 403);

  await prisma.member.updateMany({
    where: { id, clanId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  return ok({ message: "Deleted" });
}
