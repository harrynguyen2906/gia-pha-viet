"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Landmark, TreePine, Map, Flame, ClipboardList, Bell, type LucideIcon } from "lucide-react";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/lineage",  label: "Gia Phả",     icon: TreePine },
  { href: "/map",      label: "Mộ Phần",     icon: Map },
  { href: "/rituals",  label: "Lịch Giỗ",    icon: Flame },
  { href: "/duties",   label: "Công Việc",   icon: ClipboardList },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<{ data: { unreadCount: number; data: { id: string; title: string; body: string | null; readAt: string | null; createdAt: string }[] } }>(
    "/api/v1/notifications?limit=10",
    fetcher,
    { refreshInterval: 60000 }
  );

  const notifications = data?.data?.data ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(ids: string[]) {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    mutate();
  }

  async function markAll() {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    mutate();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-parchment/60 hover:text-antique-gold transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-imperial-crimson text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-bg-dark border border-border-muted shadow-2xl z-50 rounded-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
            <span className="font-header text-antique-gold text-xs tracking-widest uppercase">Thông Báo</span>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                className="text-xs text-parchment/40 hover:text-antique-gold transition-colors font-sans"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-parchment/30 text-xs font-sans">
                Không có thông báo
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.readAt) markRead([n.id]); }}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border-muted/50 hover:bg-panel-dark transition-colors",
                    !n.readAt && "bg-antique-gold/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-antique-gold flex-shrink-0" />
                    )}
                    <div className={cn("flex-1", n.readAt && "ml-3.5")}>
                      <p className="text-xs font-header text-parchment/90 leading-snug">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-parchment/50 font-sans mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-parchment/30 font-sans mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border-muted bg-bg-dark/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image 
            src="/images/logo.png" 
            alt="Heritage Cloud Logo" 
            width={32} 
            height={32} 
            className="w-8 h-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
          />
          <div className="leading-none">
            <div className="font-ornate text-antique-gold text-sm tracking-widest">
              Heritage Cloud
            </div>
            <div className="font-calligraphy text-parchment/50 text-xs">
              Gia Phả Việt
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-header uppercase tracking-widest transition-colors",
                pathname === link.href
                  ? "bg-primary/20 text-antique-gold border border-primary/40"
                  : "text-parchment/60 hover:text-parchment hover:bg-panel-dark"
              )}
            >
              <link.icon className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth + Notifications */}
        <div className="flex items-center gap-3">
          {session?.user && <NotificationBell />}
          {session?.user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-parchment/50 hidden md:inline font-display">
                {session.user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-lacquer text-xs px-3 py-1.5 rounded-sm"
              >
                Đăng Xuất
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="btn-lacquer text-xs px-3 py-1.5 rounded-sm inline-flex items-center"
            >
              Đăng Nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
