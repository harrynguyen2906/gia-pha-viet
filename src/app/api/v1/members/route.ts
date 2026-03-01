import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId, getUserId, canEdit } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan associated", 403);

  const url = req.nextUrl;
  const generation = url.searchParams.get("generation");
  const isDeceased = url.searchParams.get("isDeceased");
  const search = url.searchParams.get("search");
  const branchName = url.searchParams.get("branch");
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  const where: Record<string, unknown> = {
    clanId,
    deletedAt: null,
    ...(generation ? { generation: Number(generation) } : {}),
    ...(isDeceased !== null ? { isDeceased: isDeceased === "true" } : {}),
    ...(branchName ? { branchName } : {}),
    ...(search
      ? { fullName: { contains: search, mode: "insensitive" } }
      : {}),
  };

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ generation: "asc" }, { fullName: "asc" }],
      include: {
        parentRelations: { select: { parentId: true } },
        childRelations: { select: { childId: true } },
        spousesA: { select: { memberBId: true } },
        spousesB: { select: { memberAId: true } },
        graveSite: { select: { id: true } },
      },
    }),
    prisma.member.count({ where }),
  ]);

  const hasMore = members.length > limit;
  const items = hasMore ? members.slice(0, limit) : members;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const data = items.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    gender: m.gender,
    isDeceased: m.isDeceased,
    birthDateSolar: m.birthDateSolar?.toISOString().split("T")[0] ?? null,
    birthDateLunar: m.birthDateLunar,
    deathDateSolar: m.deathDateSolar?.toISOString().split("T")[0] ?? null,
    avatarUrl: m.avatarUrl,
    generation: m.generation,
    lineageRole: m.lineageRole,
    branchName: m.branchName,
    parentIds: m.parentRelations.map((r) => r.parentId),
    childIds: m.childRelations.map((r) => r.childId),
    spouseIds: [
      ...m.spousesA.map((s) => s.memberBId),
      ...m.spousesB.map((s) => s.memberAId),
    ],
    graveSiteId: m.graveSite?.id ?? null,
    activeDutyCount: 0,
  }));

  return ok({ data, pagination: { nextCursor, hasMore, total } });
}

const createMemberSchema = z.object({
  fullName: z.string().min(1).max(200),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).default("MALE"),
  isDeceased: z.boolean().default(false),
  birthDateSolar: z.string().nullable().optional(),
  birthDateLunar: z.string().nullable().optional(),
  deathDateSolar: z.string().nullable().optional(),
  deathDateLunar: z.string().nullable().optional(),
  biography: z.string().nullable().optional(),
  generation: z.number().int().min(1).default(1),
  lineageRole: z
    .enum(["HEAD_OF_HOUSE", "ELDER", "HEIR", "YOUTH", "MEMBER"])
    .default("MEMBER"),
  branchName: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  const userId = getUserId(session);
  if (!clanId) return err("No clan", 403);
  if (!canEdit((session?.user as any)?.role)) return err("Forbidden", 403);

  const body = await req.json();
  const parsed = createMemberSchema.safeParse(body);
  if (!parsed.success)
    return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const member = await prisma.member.create({
    data: {
      clanId,
      fullName: data.fullName,
      gender: data.gender,
      isDeceased: data.isDeceased,
      birthDateSolar: data.birthDateSolar ? new Date(data.birthDateSolar) : null,
      birthDateLunar: data.birthDateLunar ?? null,
      deathDateSolar: data.deathDateSolar ? new Date(data.deathDateSolar) : null,
      deathDateLunar: data.deathDateLunar ?? null,
      biography: data.biography ?? null,
      generation: data.generation,
      lineageRole: data.lineageRole,
      branchName: data.branchName ?? null,
      createdBy: userId ?? undefined,
    },
  });

  return ok(member, 201);
}
