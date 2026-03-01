"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

// Google Maps must be dynamically imported (needs browser)
const GoogleMap = dynamic(() => import("@/components/map/GoogleMap"), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Site {
  id: string;
  memberId: string;
  memberName: string;
  sectionPlot?: string | null;
  epitaph?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  condition?: string | null;
  siteType?: string | null;
  hasPanorama?: boolean;
  panoramaUrl?: string | null;
  lastVisited?: string | null;
}

const CONDITION_COLORS: Record<string, string> = {
  MAINTAINED: "text-emerald-400",
  NEEDS_VISIT: "text-yellow-400",
  WEATHERED: "text-orange-400",
  RESTORATION: "text-red-400",
};

const CONDITION_LABELS: Record<string, string> = {
  MAINTAINED: "Tốt",
  NEEDS_VISIT: "Cần Viếng",
  WEATHERED: "Phong Hóa",
  RESTORATION: "Trùng Tu",
};

export default function MapClient() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const { data, isLoading } = useSWR("/api/v1/sites?limit=200", fetcher);
  const sites: Site[] = data?.data ?? [];

  const displayed = filter === "ALL" ? sites : sites.filter((s) => s.condition === filter);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-antique-gold/20 bg-lacquer-dark/80 px-6 py-3 flex items-center gap-4 flex-wrap">
        <h1 className="font-header text-gold-leaf text-sm tracking-widest uppercase">Bản Đồ Mộ Phần</h1>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {["ALL", "MAINTAINED", "NEEDS_VISIT", "WEATHERED", "RESTORATION"].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 text-xs font-header tracking-widest uppercase border transition-colors ${
                filter === c
                  ? "bg-imperial-crimson border-antique-gold/50 text-parchment"
                  : "border-antique-gold/20 text-antique-gold/50 hover:border-antique-gold/50"
              }`}
            >
              {c === "ALL" ? "Tất Cả" : CONDITION_LABELS[c]}
            </button>
          ))}
          <Link href="/map/register" className="btn-lacquer px-4 py-1.5 text-xs font-header tracking-widest uppercase ml-2">
            + Đăng Ký Mộ
          </Link>
        </div>
      </div>

      {/* Map + Right panel (2/3 + 1/3) */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-3">

        {/* Map — takes 2 columns */}
        <div className="xl:col-span-2 relative h-full">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-dark">
              <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">
                Đang tải bản đồ…
              </p>
            </div>
          ) : (
            <GoogleMap
              sites={displayed}
              onSelectSite={setSelectedSite}
              selectedSiteId={selectedSite?.id ?? null}
            />
          )}
        </div>

        {/* Right panel: 360° viewer + site list */}
        <aside className="xl:col-span-1 bg-lacquer-dark/95 border-l border-antique-gold/20 flex flex-col overflow-hidden h-full">

          {/* ── 360° Viewer ── */}
          <div className="flex-shrink-0 border-b border-antique-gold/20">
            {/* Viewer header */}
            <div className="px-4 py-3 border-b border-antique-gold/10 flex items-center justify-between">
              <h3 className="font-header text-xs text-gold-leaf tracking-widest uppercase">
                Xem 360° Mộ Phần
              </h3>
              {selectedSite?.hasPanorama && (
                <span className="bg-imperial-crimson/20 border border-imperial-crimson/50 text-parchment/70 text-[10px] px-2 py-0.5 font-header tracking-widest uppercase">
                  LIVE PREVIEW
                </span>
              )}
            </div>

            {/* Panorama image / placeholder */}
            <div className="relative bg-black/40" style={{ height: 260 }}>
              {selectedSite?.panoramaUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedSite.panoramaUrl}
                    alt={`360° — ${selectedSite.memberName}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  {/* 360° nav controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                    <button className="w-9 h-9 rounded-full bg-bg-dark/80 backdrop-blur border border-antique-gold/30 flex items-center justify-center text-parchment text-lg hover:bg-antique-gold/20 transition-colors">
                      ‹
                    </button>
                    <button className="w-9 h-9 rounded-full bg-imperial-crimson flex items-center justify-center text-parchment shadow-lg font-header text-[10px] tracking-widest">
                      360°
                    </button>
                    <button className="w-9 h-9 rounded-full bg-bg-dark/80 backdrop-blur border border-antique-gold/30 flex items-center justify-center text-parchment text-lg hover:bg-antique-gold/20 transition-colors">
                      ›
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <span className="text-4xl opacity-20">
                    {selectedSite ? "🪦" : "🗺️"}
                  </span>
                  <p className="font-header text-parchment/30 text-xs tracking-widest uppercase text-center px-6">
                    {selectedSite
                      ? "Chưa có ảnh 360° — tải lên để kích hoạt"
                      : "Chọn một mộ phần để xem"}
                  </p>
                </div>
              )}
            </div>

            {/* Selected site details (shown when any site is selected) */}
            {selectedSite && (
              <div className="px-5 py-4 bg-black/20 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-header text-parchment text-base tracking-wide leading-snug truncate">
                      {selectedSite.memberName}
                    </h4>
                    <p className={`text-xs font-header tracking-widest mt-0.5 ${
                      CONDITION_COLORS[selectedSite.condition ?? ""] ?? "text-parchment/40"
                    }`}>
                      {CONDITION_LABELS[selectedSite.condition ?? ""] ?? selectedSite.condition}
                      {selectedSite.sectionPlot && ` · ${selectedSite.sectionPlot}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSite(null)}
                    className="flex-shrink-0 text-parchment/30 hover:text-parchment transition-colors text-sm mt-0.5"
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                </div>

                {selectedSite.epitaph && (
                  <p className="font-sans text-parchment/50 text-xs italic leading-relaxed line-clamp-2">
                    &ldquo;{selectedSite.epitaph}&rdquo;
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {selectedSite.latitude && selectedSite.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${selectedSite.latitude},${selectedSite.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-2 bg-imperial-crimson/10 hover:bg-imperial-crimson/20 border border-imperial-crimson/30 text-parchment/70 text-[10px] font-header tracking-widest uppercase transition-all"
                    >
                      🧭 Dẫn Đường
                    </a>
                  ) : (
                    <div />
                  )}
                  <Link
                    href={`/lineage/${selectedSite.memberId}`}
                    className="flex items-center justify-center gap-1 py-2 bg-antique-gold/10 hover:bg-antique-gold/20 border border-antique-gold/20 text-antique-gold/70 text-[10px] font-header tracking-widest uppercase transition-all"
                  >
                    📜 Hồ Sơ
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Site list ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2.5 border-b border-antique-gold/10 flex items-center justify-between">
              <p className="font-header text-antique-gold/50 text-[10px] tracking-widest uppercase">
                {displayed.length} Địa Điểm
              </p>
              {selectedSite && (
                <button
                  onClick={() => setSelectedSite(null)}
                  className="text-[10px] font-header tracking-widest uppercase text-parchment/30 hover:text-parchment/70 transition-colors"
                >
                  Bỏ chọn
                </button>
              )}
            </div>

            {displayed.length === 0 && (
              <div className="p-6 text-center">
                <p className="font-sans text-parchment/30 text-sm">Chưa có địa điểm nào.</p>
                <Link
                  href="/map/register"
                  className="text-antique-gold/50 hover:text-antique-gold text-xs font-header tracking-widest uppercase mt-2 block transition-colors"
                >
                  Thêm địa điểm →
                </Link>
              </div>
            )}

            {displayed.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSite(site)}
                className={`w-full text-left px-4 py-3 border-b border-antique-gold/10 transition-all hover:bg-antique-gold/5 ${
                  selectedSite?.id === site.id
                    ? "bg-imperial-crimson/20 border-l-2 border-l-imperial-crimson"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-header text-parchment text-sm tracking-wide truncate">
                      {site.memberName}
                    </p>
                    <p className="font-sans text-parchment/50 text-xs mt-0.5 truncate">
                      {site.sectionPlot ?? "Chưa có địa chỉ"}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                    {site.condition && (
                      <span className={`text-[10px] font-header tracking-widest ${
                        CONDITION_COLORS[site.condition] ?? "text-parchment/40"
                      }`}>
                        {CONDITION_LABELS[site.condition]}
                      </span>
                    )}
                    {site.hasPanorama && (
                      <span className="text-[10px] text-antique-gold/50 font-header tracking-widest">
                        360°
                      </span>
                    )}
                  </div>
                </div>
                {site.epitaph && (
                  <p className="font-sans text-parchment/30 text-xs mt-1 truncate italic">
                    {site.epitaph}
                  </p>
                )}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
