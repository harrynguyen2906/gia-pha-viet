"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, UserPlus, LayoutDashboard, Menu, X } from "lucide-react";

export default function MobileMenuButton({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-accent-gold border border-accent-gold/30 hover:bg-accent-gold/10 transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-lacquer-dark border border-accent-gold/20 shadow-2xl py-2">
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 font-header text-xs tracking-widest text-slate-300 hover:text-accent-gold hover:bg-accent-gold/5 transition-colors"
          >
            TÍNH NĂNG
          </a>
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 font-header text-xs tracking-widest text-slate-300 hover:text-accent-gold hover:bg-accent-gold/5 transition-colors"
          >
            HƯỚNG DẪN
          </a>
          <div className="border-t border-accent-gold/20 my-2" />
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 font-header text-xs tracking-widest text-accent-gold hover:bg-accent-gold/5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
              VÀO TRANG CHỦ
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="flex items-center gap-2 px-4 py-2 font-header text-xs tracking-widest text-slate-300 hover:text-accent-gold hover:bg-accent-gold/5 transition-colors"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                ĐĂNG NHẬP
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-2 px-4 py-2 font-header text-xs tracking-widest text-primary hover:bg-primary/10 transition-colors"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                BẮT ĐẦU MIỄN PHÍ
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
