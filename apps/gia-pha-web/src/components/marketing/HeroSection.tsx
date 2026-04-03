import Link from "next/link";
import { Scroll, TreePine, Users, MapPin, CalendarHeart, ArrowRight } from "lucide-react";

const stats = [
  { icon: TreePine, label: "Cây Phả Hệ", value: "Số Hóa" },
  { icon: Users, label: "Thành Viên", value: "Kết Nối" },
  { icon: MapPin, label: "Mộ Phần", value: "Theo Dõi" },
  { icon: CalendarHeart, label: "Ngày Giỗ", value: "Nhắc Nhở" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 5, 5, 0.75), rgba(18, 5, 5, 0.65)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCJRkzWNQYTWHu1-VFZDGP9Yr3nEMXlp1kZ4TTGL6wrUVJLQjM_2MlMPXRvFeZ2ecSPY4OoIODhq0WFL9LWPZp_Ai1PNwucfl235jIvACbLHNEJKn8D5pMTKq3lpKojeoN1PLGfQ3E0kt0NCeIcq_Q7zRHW3v5hCAr5G6SiAHuf5bHujL2p-tNAeiOpmVLszPrRDJN5KNcaiFifPXAam_4G_lRTRUOvmZDGZFajyYGdENBg88OE4i1Xt9l6WjvbvL-HHdfe8VEgjVuR')",
        }}
        aria-hidden="true"
      />

      {/* Ambient glows */}
      <div className="absolute bottom-32 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-accent-gold/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Imperial scroll content frame */}
      <div className="relative z-10 max-w-5xl w-full mx-auto">
        <div
          className="p-12 md:p-24 text-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(to right, #d4c1a1 0%, #f5e6d3 10%, #fcf3e8 50%, #f5e6d3 90%, #d4c1a1 100%)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 0 60px rgba(139,69,19,0.15)",
            borderLeft: "16px solid #5d2e0a",
            borderRight: "16px solid #5d2e0a",
          }}
        >
          {/* Decorative icons row */}
          <div className="mb-8 flex justify-center items-center gap-4 opacity-60" aria-hidden="true">
            <Scroll className="w-5 h-5 text-temple-stone" />
            <span className="text-temple-stone text-lg">✦</span>
            <TreePine className="w-5 h-5 text-primary" />
            <span className="text-temple-stone text-lg">✦</span>
            <Scroll className="w-5 h-5 text-temple-stone" />
          </div>

          <h1 className="font-header text-5xl md:text-7xl font-black text-temple-stone tracking-tighter mb-4 leading-tight">
            HERITAGE CLOUD
          </h1>

          <div className="h-px w-48 bg-gradient-to-r from-transparent via-temple-stone/40 to-transparent mx-auto mb-8" />

          <h2 className="font-serif text-xl md:text-3xl text-temple-stone/90 italic mb-8 font-bold">
            "Lưu Giữ Di Sản — Kết Nối Thế Hệ"
          </h2>

          <p className="font-sans text-temple-stone/75 max-w-2xl mx-auto mb-10 text-base md:text-lg leading-relaxed">
            Nền tảng gia phả số giúp gia đình Việt Nam gìn giữ truyền thống,
            kết nối thế hệ và quản lý nghi lễ tổ tiên.
          </p>

          {/* Mini stats row */}
          <div className="grid grid-cols-4 gap-2 mb-10 max-w-lg mx-auto">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-2 border border-temple-stone/20 bg-temple-stone/5">
                <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                <span className="font-header text-[8px] tracking-widest text-primary font-bold">{value}</span>
                <span className="font-sans text-[8px] text-temple-stone/60 leading-tight text-center">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="group relative flex items-center gap-3 px-10 py-4 bg-primary text-white font-header tracking-[0.3em] text-sm border-2 border-accent-gold/60 shadow-2xl transition-all hover:brightness-110 hover:scale-[1.02] active:scale-100"
            >
              BẮT ĐẦU MIỄN PHÍ
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              <span className="absolute inset-0 border border-accent-gold/20 scale-100 group-hover:scale-105 transition-transform" aria-hidden="true" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-10 py-4 border border-temple-stone/30 text-temple-stone font-header tracking-[0.2em] text-sm hover:bg-temple-stone/10 transition-all"
            >
              TÌM HIỂU THÊM
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-accent-gold/40 motion-safe:animate-bounce">
        <span className="font-sans text-[10px] tracking-widest">SCROLL</span>
        <span className="text-lg">↓</span>
      </div>
    </section>
  );
}
