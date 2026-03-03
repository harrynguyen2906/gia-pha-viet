import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Cross, ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  return { title: member ? `${member.fullName} | Heritage Cloud` : "Thành Viên | Heritage Cloud" };
}

export default async function MemberProfilePage({ params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth();
  const clanId = (session?.user as any)?.clanId;
  const { memberId } = await params;

  const member = await prisma.member.findFirst({
    where: { id: memberId, ...(clanId ? { clanId } : {}), deletedAt: null },
    include: {
      parentRelations: { include: { parent: { select: { id: true, fullName: true, isDeceased: true } } } },
      childRelations: { include: { child: { select: { id: true, fullName: true, isDeceased: true, birthDateSolar: true } } } },
      spousesA: { include: { memberB: { select: { id: true, fullName: true, isDeceased: true } } } },
      spousesB: { include: { memberA: { select: { id: true, fullName: true, isDeceased: true } } } },
      media: { orderBy: { sortOrder: "asc" }, take: 8 },
      graveSite: { select: { id: true, sectionPlot: true, epitaph: true, condition: true } },
    },
  });

  if (!member) return notFound();

  const parents = member.parentRelations.map((r) => r.parent);
  const children = member.childRelations.map((r) => r.child);
  const spouses = [
    ...member.spousesA.map((s) => s.memberB),
    ...member.spousesB.map((s) => s.memberA),
  ];

  const genderLabel = member.gender === "MALE" ? "Nam" : member.gender === "FEMALE" ? "Nữ" : "—";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/lineage" className="text-antique-gold/60 hover:text-antique-gold text-xs font-header tracking-widest uppercase mb-6 inline-flex items-center gap-1.5 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
        Về Gia Phả
      </Link>

      {/* Header */}
      <div className="flex gap-6 items-start mb-8">
        <div
          className="w-28 h-28 rounded-sm border-2 border-antique-gold/50 bg-cover bg-center bg-panel-dark flex-shrink-0"
          style={member.avatarUrl ? { backgroundImage: `url('${member.avatarUrl}')` } : {}}
        >
          {!member.avatarUrl && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-ornate text-4xl text-antique-gold/40">{member.fullName[0]}</span>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-header text-3xl text-gold-leaf tracking-wider">{member.fullName}</h1>
            {member.isDeceased && (
              <span className="text-xs bg-red-950 border border-imperial-crimson/50 text-parchment/60 px-2 py-0.5 font-header tracking-widest inline-flex items-center gap-1">
                <Cross className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
                Đã Mất
              </span>
            )}
          </div>
          {member.generation && (
            <p className="text-antique-gold/60 text-sm font-header tracking-widest">Đời Thứ {member.generation}</p>
          )}
          <div className="flex gap-6 mt-3 text-sm text-parchment/60 font-sans">
            <span>{member.birthDateSolar ? `Sinh ${member.birthDateSolar.getFullYear()}` : "Năm sinh chưa rõ"}</span>
            {member.isDeceased && <span>{member.deathDateSolar ? `Mất ${member.deathDateSolar.getFullYear()}` : "Năm mất chưa rõ"}</span>}
            <span>{genderLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Biography */}
          {member.biography && (
            <div className="border border-antique-gold/20 p-5 bg-panel-dark/50">
              <h2 className="font-header text-gold-leaf text-sm tracking-widest uppercase mb-3">Tiểu Sử</h2>
              <p className="font-sans text-parchment/80 text-sm leading-relaxed whitespace-pre-wrap">{member.biography}</p>
            </div>
          )}

          {/* Family */}
          <div className="border border-antique-gold/20 p-5 bg-panel-dark/50">
            <h2 className="font-header text-gold-leaf text-sm tracking-widest uppercase mb-4">Gia Đình</h2>
            {parents.length > 0 && (
              <div className="mb-4">
                <p className="text-antique-gold/50 text-xs font-header tracking-widest uppercase mb-2">Cha Mẹ</p>
                <div className="flex flex-wrap gap-2">
                  {parents.map((p) => (
                    <Link key={p.id} href={`/lineage/${p.id}`} className="text-parchment/80 hover:text-gold-leaf text-sm font-sans transition-colors border-b border-antique-gold/20 hover:border-antique-gold/60">
                      {p.fullName}{p.isDeceased ? <Cross className="inline w-3 h-3 ml-1" strokeWidth={1.5} aria-hidden="true" /> : null}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {spouses.length > 0 && (
              <div className="mb-4">
                <p className="text-antique-gold/50 text-xs font-header tracking-widest uppercase mb-2">Vợ / Chồng</p>
                <div className="flex flex-wrap gap-2">
                  {spouses.map((s) => (
                    <Link key={s.id} href={`/lineage/${s.id}`} className="text-parchment/80 hover:text-gold-leaf text-sm font-sans transition-colors border-b border-antique-gold/20 hover:border-antique-gold/60">
                      {s.fullName}{s.isDeceased ? <Cross className="inline w-3 h-3 ml-1" strokeWidth={1.5} aria-hidden="true" /> : null}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {children.length > 0 && (
              <div>
                <p className="text-antique-gold/50 text-xs font-header tracking-widest uppercase mb-2">Con Cái ({children.length})</p>
                <div className="flex flex-wrap gap-2">
                  {children.map((c) => (
                    <Link key={c.id} href={`/lineage/${c.id}`} className="text-parchment/80 hover:text-gold-leaf text-sm font-sans transition-colors border-b border-antique-gold/20 hover:border-antique-gold/60">
                      {c.fullName}{c.isDeceased ? <Cross className="inline w-3 h-3 ml-1" strokeWidth={1.5} aria-hidden="true" /> : null}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Media */}
          {member.media.length > 0 && (
            <div className="border border-antique-gold/20 p-5 bg-panel-dark/50">
              <h2 className="font-header text-gold-leaf text-sm tracking-widest uppercase mb-4">Hình Ảnh / Tài Liệu</h2>
              <div className="grid grid-cols-3 gap-3">
                {member.media.filter((m) => m.mediaType === "PHOTO").map((m) => (
                  <img
                    key={m.id}
                    src={m.url}
                    alt={m.caption ?? ""}
                    className="w-full aspect-square object-cover border border-antique-gold/20"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Grave site */}
          {member.graveSite && (
            <div className="border border-antique-gold/20 p-4 bg-panel-dark/50">
              <h2 className="font-header text-gold-leaf text-xs tracking-widest uppercase mb-3">Mộ Phần</h2>
              <p className="font-sans text-parchment/80 text-sm font-medium">{member.graveSite.sectionPlot ?? "—"}</p>
              {member.graveSite.epitaph && (
                <p className="font-sans text-parchment/50 text-xs mt-1 italic">{member.graveSite.epitaph}</p>
              )}
              <div className={`mt-2 text-xs font-header tracking-widest ${
                member.graveSite.condition === "RESTORATION" ? "text-red-400" :
                member.graveSite.condition === "WEATHERED" ? "text-orange-400" :
                member.graveSite.condition === "MAINTAINED" ? "text-emerald-400" : "text-antique-gold/60"
              }`}>
                {member.graveSite.condition}
              </div>
              <Link href="/map" className="text-antique-gold/60 hover:text-antique-gold text-xs font-header tracking-widest uppercase mt-3 block transition-colors">
                Xem Bản Đồ →
              </Link>
            </div>
          )}

          {/* Additional info */}
          <div className="border border-antique-gold/20 p-4 bg-panel-dark/50 space-y-3">
            <h2 className="font-header text-gold-leaf text-xs tracking-widest uppercase mb-3">Thông Tin Thêm</h2>
            {[
              { label: "Vai Trò", value: member.lineageRole },
              { label: "Chi Nhánh", value: member.branchName },
            ].filter((i) => i.value).map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-parchment/40 font-sans text-xs">{item.label}</span>
                <span className="text-parchment/80 font-sans text-xs text-right max-w-[60%]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
