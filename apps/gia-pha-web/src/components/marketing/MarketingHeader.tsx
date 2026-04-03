import Link from "next/link";
import { auth } from "@/lib/auth";
import MobileMenuButton from "./MobileMenuButton";
import { LogIn, LayoutDashboard, UserPlus } from "lucide-react";

export default async function MarketingHeader() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-accent-gold/20 bg-lacquer-dark/95 backdrop-blur-md px-6 lg:px-20">
      <div className="flex h-20 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="flex items-center justify-center size-10 rounded bg-primary border-2 border-accent-gold/60 shadow-xl">
            <span className="text-white text-lg">⛩</span>
          </div>
          <div>
            <p className="font-header text-xl font-bold tracking-[0.2em] text-white">
              HERITAGE <span className="text-accent-gold">CLOUD</span>
            </p>
            <p className="text-[9px] tracking-[0.4em] text-accent-gold/50 font-header">
              THE IMPERIAL ARCHIVE
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          <a
            href="#features"
            className="font-header text-xs tracking-widest text-slate-300 hover:text-accent-gold transition-colors"
          >
            TÍNH NĂNG
          </a>
          <a
            href="#how-it-works"
            className="font-header text-xs tracking-widest text-slate-300 hover:text-accent-gold transition-colors"
          >
            HƯỚNG DẪN
          </a>
          <a
            href="#testimonials"
            className="font-header text-xs tracking-widest text-slate-300 hover:text-accent-gold transition-colors"
          >
            CẢM NHẬN
          </a>
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-2 bg-primary border border-accent-gold/40 text-white font-header text-[10px] tracking-widest shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
              VÀO TRANG CHỦ
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="flex items-center gap-2 px-6 py-2 border border-accent-gold/40 text-accent-gold font-header text-[10px] tracking-widest hover:bg-accent-gold hover:text-lacquer-dark transition-all"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                ĐĂNG NHẬP
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-2 px-6 py-2 bg-primary border border-accent-gold/40 text-white font-header text-[10px] tracking-widest shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                BẮT ĐẦU MIỄN PHÍ
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <MobileMenuButton isAuthenticated={isAuthenticated} />
      </div>
    </header>
  );
}
