import Link from "next/link";

export default function CTABannerSection() {
  return (
    <section
      className="relative py-28 px-6 overflow-hidden border-y-2 border-accent-gold"
      style={{ background: "rgba(139, 0, 0, 0.12)" }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none grid grid-cols-12 h-full" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-r border-accent-gold h-full" />
        ))}
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="font-header text-4xl md:text-6xl text-white mb-6 tracking-[0.15em] leading-tight">
          BẮT ĐẦU GÌN GIỮ
          <br />
          DI SẢN GIA ĐÌNH
        </h2>
        <p className="font-serif text-accent-gold italic text-xl mb-12 max-w-2xl mx-auto">
          Lịch sử đang chờ bạn ghi lại. Đừng để di sản trở thành tiếng thì thầm chìm vào quên lãng.
        </p>
        <Link
          href="/auth/register"
          className="inline-block px-16 py-6 bg-primary text-white font-header tracking-[0.4em] text-xl border-2 border-accent-gold hover:scale-105 hover:brightness-110 shadow-[0_0_50px_rgba(139,0,0,0.4)] transition-all active:scale-100"
        >
          ĐĂNG KÝ MIỄN PHÍ
        </Link>
      </div>
    </section>
  );
}
