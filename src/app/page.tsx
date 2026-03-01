import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getClanStats() {
  try {
    const session = await auth();
    const clanId = (session?.user as any)?.clanId;
    if (!clanId) return null;

    const [totalMembers, deceasedMembers, graveSites, upcomingRituals, clan] = await Promise.all([
      prisma.member.count({ where: { clanId, deletedAt: null } }),
      prisma.member.count({ where: { clanId, deletedAt: null, isDeceased: true } }),
      prisma.graveSite.count({ where: { clanId, deletedAt: null } }),
      prisma.ritualEvent.findMany({
        where: { clanId, deletedAt: null, dateSolar: { gte: new Date() } },
        take: 3,
        orderBy: { dateSolar: "asc" },
        include: { ancestor: { select: { fullName: true } } },
      }),
      prisma.clan.findUnique({ where: { id: clanId } }),
    ]);

    return { totalMembers, deceasedMembers, livingMembers: totalMembers - deceasedMembers, graveSites, upcomingRituals, clan };
  } catch {
    return null;
  }
}

export default async function Home() {
  const stats = await getClanStats();

  const heroTitle = stats?.clan?.name ?? "HERITAGE CLOUD";
  const leftCouplet = "Tiên Tổ Tôn Nghiêm Lưu Phúc Ấm";
  const rightCouplet = "Tử Tôn Hiếu Kính Kế Gia Phong";

  return (
    <div className="min-h-screen relative">
      {/* ── Side Couplet Pillars (Desktop) ─────────────── */}
      <aside className="hidden xl:flex fixed top-16 bottom-0 left-0 w-24 z-20 items-center justify-center pointer-events-none">
        <div className="relative h-full w-full bg-gradient-to-b from-royal-lacquer via-imperial-crimson to-royal-lacquer border-r border-antique-gold/45 shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.25)_0%,rgba(255,255,255,0.06)_18%,rgba(255,255,255,0.04)_82%,rgba(0,0,0,0.22)_100%)]" />
          <div className="absolute top-0 inset-x-0 h-7 bg-gold-shimmer border-b border-antique-gold/80" />
          <div className="absolute bottom-0 inset-x-0 h-9 bg-gold-shimmer border-t border-antique-gold/80" />
          <div className="absolute top-7 bottom-9 left-3 right-3 bg-gradient-to-b from-dark-paper via-black to-dark-paper border-2 border-antique-gold/70 shadow-inner">
            <div className="absolute inset-1 border border-antique-gold/35" />
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full border border-antique-gold/80 bg-royal-lacquer" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border border-antique-gold/80 bg-royal-lacquer" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full border border-antique-gold/80 bg-royal-lacquer" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full border border-antique-gold/80 bg-royal-lacquer" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-antique-gold/85 text-xs">✦</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-antique-gold/85 text-xs">✦</div>
            <div className="h-full w-full flex items-center justify-center px-1">
              <p className="font-header text-gold-leaf text-[17px] tracking-[0.14em] leading-[1.65] [writing-mode:vertical-rl] [text-orientation:mixed] drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
                {leftCouplet}
              </p>
            </div>
          </div>
          <div className="absolute top-7 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-gold-shimmer rounded-b-full border-x border-b border-antique-gold/80" />
          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-gold-shimmer rounded-t-full border-x border-t border-antique-gold/80" />
        </div>
      </aside>
      <aside className="hidden xl:flex fixed top-16 bottom-0 right-0 w-24 z-20 items-center justify-center pointer-events-none">
        <div className="relative h-full w-full bg-gradient-to-b from-royal-lacquer via-imperial-crimson to-royal-lacquer border-l border-antique-gold/45 shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(0,0,0,0.25)_0%,rgba(255,255,255,0.06)_18%,rgba(255,255,255,0.04)_82%,rgba(0,0,0,0.22)_100%)]" />
          <div className="absolute top-0 inset-x-0 h-7 bg-gold-shimmer border-b border-antique-gold/80" />
          <div className="absolute bottom-0 inset-x-0 h-9 bg-gold-shimmer border-t border-antique-gold/80" />
          <div className="absolute top-7 bottom-9 left-3 right-3 bg-gradient-to-b from-dark-paper via-black to-dark-paper border-2 border-antique-gold/70 shadow-inner">
            <div className="absolute inset-1 border border-antique-gold/35" />
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full border border-antique-gold/80 bg-royal-lacquer" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border border-antique-gold/80 bg-royal-lacquer" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full border border-antique-gold/80 bg-royal-lacquer" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full border border-antique-gold/80 bg-royal-lacquer" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-antique-gold/85 text-xs">✦</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-antique-gold/85 text-xs">✦</div>
            <div className="h-full w-full flex items-center justify-center px-1">
              <p className="font-header text-gold-leaf text-[17px] tracking-[0.14em] leading-[1.65] [writing-mode:vertical-rl] [text-orientation:mixed] drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
                {rightCouplet}
              </p>
            </div>
          </div>
          <div className="absolute top-7 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-gold-shimmer rounded-b-full border-x border-b border-antique-gold/80" />
          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-gold-shimmer rounded-t-full border-x border-t border-antique-gold/80" />
        </div>
      </aside>

      {/* ── Hero Banner ─────────────────────────────────── */}
      <section className="relative min-h-[64vh] flex items-center justify-center overflow-hidden xl:px-20">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-[3px]"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=2070&auto=format&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-bg-dark/95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.05)_10%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.75)_100%)]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-24 bg-antique-gold/60" />
            <span className="font-header text-antique-gold text-xs tracking-[0.5em] uppercase">Chiếu Chỉ Gia Phả</span>
            <div className="h-px w-24 bg-antique-gold/60" />
          </div>
          <h1
            className="font-ornate text-5xl md:text-8xl font-black mb-4 tracking-tight"
            style={{
              background: "linear-gradient(to bottom, #fceabb 0%, #fccd4d 50%, #f8b500 51%, #fbdf93 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.7))",
            }}
          >
            {heroTitle}
          </h1>
          <p className="font-calligraphy text-antique-gold text-3xl md:text-4xl mb-8 leading-relaxed">
            &ldquo;Trăm năm sống bởi tổ tiên, nghìn đời nối mãi khói hương&rdquo;
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/lineage"
              className="btn-lacquer flex items-center gap-2 px-8 py-3 text-sm font-header tracking-widest uppercase"
            >
              Xem Gia Phả
            </Link>
            <Link
              href="/rituals"
              className="btn-gold-shimmer flex items-center gap-2 px-8 py-3 text-sm font-header tracking-widest uppercase"
            >
              Ngày Cúng Kỵ
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────── */}
      {stats && (
        <section className="bg-royal-lacquer border-y border-antique-gold/40 py-6 xl:px-20">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Thành Viên", value: stats.totalMembers },
              { label: "Còn Sống", value: stats.livingMembers },
              { label: "Đã Mất", value: stats.deceasedMembers },
              { label: "Mộ Phần", value: stats.graveSites },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="font-ornate text-3xl font-black"
                  style={{
                    background: "linear-gradient(to bottom, #fceabb, #fccd4d)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {s.value}
                </p>
                <p className="font-header text-antique-gold/70 text-xs tracking-widest uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Main Content ───────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10 xl:px-20">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4 border-b border-antique-gold/30 pb-4">
            <h2 className="font-header text-2xl text-gold-leaf tracking-widest uppercase">Chức Năng Chính</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { href: "/lineage", title: "Cây Gia Phả", subtitle: "Sơ đồ quan hệ trực quan", color: "border-red-900/50 hover:border-red-700/70 from-red-950 to-red-900" },
              { href: "/map", title: "Bản Đồ Mộ Phần", subtitle: "Vị trí phần mộ tổ tiên", color: "border-stone-700/50 hover:border-stone-500/70 from-stone-900 to-stone-800" },
              { href: "/rituals", title: "Lịch Cúng Kỵ", subtitle: "Âm lịch & ngày lễ giỗ", color: "border-amber-900/50 hover:border-amber-700/70 from-amber-950 to-amber-900" },
              { href: "/duties", title: "Phân Công Việc", subtitle: "Theo dõi nhiệm vụ gia tộc", color: "border-emerald-900/50 hover:border-emerald-700/70 from-emerald-950 to-emerald-900" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative overflow-hidden rounded-sm bg-gradient-to-br border transition-all duration-300 p-6 block ${item.color}`}
              >
                <h3 className="font-header text-gold-leaf text-lg tracking-wider uppercase mb-1">{item.title}</h3>
                <p className="font-sans text-parchment/60 text-sm">{item.subtitle}</p>
                <div className="mt-4 text-antique-gold/50 group-hover:text-antique-gold text-xs font-header tracking-widest uppercase transition-colors">
                  Mở →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Rituals */}
        <div>
          <div className="flex items-center gap-4 border-b border-antique-gold/30 pb-4 mb-6">
            <h2 className="font-header text-xl text-gold-leaf tracking-widest uppercase">Kỵ Sắp Đến</h2>
          </div>
          {stats?.upcomingRituals && stats.upcomingRituals.length > 0 ? (
            <div className="space-y-4">
              {stats.upcomingRituals.map((r) => (
                <Link key={r.id} href="/rituals" className="card-parchment block p-4">
                  <p className="font-header text-temple-stone text-sm font-bold tracking-wide uppercase truncate">{r.title}</p>
                  {r.ancestor && (
                    <p className="text-xs text-temple-stone/60 mt-0.5 font-sans">Giỗ: {r.ancestor.fullName}</p>
                  )}
                  <p className="text-xs text-imperial-crimson font-header tracking-widest mt-2">
                    {r.dateSolar ? new Date(r.dateSolar).toLocaleDateString("vi-VN") : "—"}
                  </p>
                  {r.dateLunar && (
                    <p className="text-xs text-temple-stone/50 font-sans">Âm: {r.dateLunar}</p>
                  )}
                </Link>
              ))}
              <Link href="/rituals" className="block text-center text-antique-gold/70 hover:text-antique-gold text-xs font-header tracking-widest uppercase mt-2 transition-colors">
                Xem Tất Cả →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="font-sans text-parchment/40 text-sm">Chưa có ngày kỵ sắp tới.</p>
              {!stats && (
                <p className="font-sans text-parchment/30 text-xs mt-2">Vui lòng đăng nhập để xem dữ liệu.</p>
              )}
              <Link href="/rituals" className="text-antique-gold text-xs font-header tracking-widest uppercase mt-3 block hover:text-gold-leaf transition-colors">
                Thêm ngày kỵ →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Decorative footer band ──────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-antique-gold/40 to-transparent" />
    </div>
  );
}
