"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

// Mapbox-gl must be dynamically imported (needs browser)
const MapboxMap = dynamic(() => import("@/components/map/MapboxMap"), { ssr: false });

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

export default function MapClient() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const { data, isLoading } = useSWR("/api/v1/sites?limit=200", fetcher);
  const sites: Site[] = data?.data ?? [];

  const displayed = filter === "ALL" ? sites : sites.filter((s) => s.condition === filter);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="border-b border-antique-gold/20 bg-lacquer-dark/80 px-6 py-3 flex items-center gap-4 flex-wrap">
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
              {c === "ALL" ? "Tất Cả" : c === "MAINTAINED" ? "Tốt" : c === "NEEDS_VISIT" ? "Cần Viếng" : c === "WEATHERED" ? "Phong Hóa" : "Trùng Tu"}
            </button>
          ))}
          <Link href="/map/register" className="btn-lacquer px-4 py-1.5 text-xs font-header tracking-widest uppercase ml-2">
            + Đăng Ký Mộ
          </Link>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">
                Đang tải bản đồ…
              </p>
            </div>
          ) : (
            <MapboxMap
              sites={displayed}
              onSelectSite={setSelectedSite}
              selectedSiteId={selectedSite?.id ?? null}
            />
          )}
        </div>

        {/* Side panel — sites list */}
        <aside className="w-72 bg-lacquer-dark/95 border-l border-antique-gold/20 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-antique-gold/10">
            <p className="font-header text-antique-gold/60 text-xs tracking-widest uppercase">
              {displayed.length} Địa Điểm
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {displayed.length === 0 && (
              <div className="p-6 text-center">
                <p className="font-sans text-parchment/30 text-sm">Chưa có địa điểm nào.</p>
                <Link href="/map/register" className="text-antique-gold/50 hover:text-antique-gold text-xs font-header tracking-widest uppercase mt-2 block transition-colors">
                  Thêm địa điểm →
                </Link>
              </div>
            )}
            {displayed.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSite(site)}
                className={`w-full text-left px-4 py-4 border-b border-antique-gold/10 transition-all hover:bg-antique-gold/5 ${
                  selectedSite?.id === site.id ? "bg-imperial-crimson/20 border-l-2 border-l-imperial-crimson" : ""
                }`}
              >
                <p className="font-header text-parchment text-sm tracking-wide truncate">{site.memberName}</p>
                <p className="font-sans text-parchment/50 text-xs mt-0.5 truncate">{site.sectionPlot ?? "Chưa có địa chỉ"}</p>
                <div className="flex items-center justify-between mt-1">
                  {site.condition && (
                    <span className={`text-xs font-header tracking-widest ${CONDITION_COLORS[site.condition] ?? "text-parchment/40"}`}>
                      {site.condition}
                    </span>
                  )}
                  {site.hasPanorama && (
                    <span className="text-xs text-antique-gold/50 font-sans">360°</span>
                  )}
                </div>
                {site.epitaph && (
                  <p className="font-sans text-parchment/30 text-xs mt-1 truncate">{site.epitaph}</p>
                )}
              </button>
            ))}
          </div>

          {/* Selected detail */}
          {selectedSite && (
            <div className="border-t border-antique-gold/20 p-4 bg-black/30">
              <p className="font-header text-gold-leaf text-sm tracking-wide">{selectedSite.memberName}</p>
              <p className="text-antique-gold/60 text-xs font-sans">
                {selectedSite.sectionPlot ?? ""}
              </p>
              <div className="flex items-center gap-3 mt-3">
                {selectedSite.latitude && selectedSite.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedSite.latitude},${selectedSite.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-antique-gold/60 hover:text-antique-gold font-header tracking-widest uppercase transition-colors"
                  >
                    Google Maps →
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
