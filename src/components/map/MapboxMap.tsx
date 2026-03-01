"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Site {
  id: string;
  memberId: string;
  memberName: string;
  sectionPlot?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  condition?: string | null;
}

interface Props {
  sites: Site[];
  onSelectSite: (site: Site) => void;
  selectedSiteId: string | null;
}

const CONDITION_HEX: Record<string, string> = {
  MAINTAINED: "#22c55e",
  NEEDS_VISIT: "#eab308",
  WEATHERED: "#f97316",
  RESTORATION: "#ef4444",
};

// Vietnam center as default
const DEFAULT_CENTER: [number, number] = [108.2, 16.0];
const DEFAULT_ZOOM = 5;

export default function MapboxMap({ sites, onSelectSite, selectedSiteId }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use public token from env or a placeholder that shows tile errors gracefully
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when sites change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const geo = sites.filter((s) => s.latitude != null && s.longitude != null);
    if (geo.length === 0) return;

    for (const site of geo) {
      const color = CONDITION_HEX[site.condition ?? "UNKNOWN"] ?? "#C5A059";
      const el = document.createElement("div");
      el.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: ${color}; border: 2px solid #C5A059;
        box-shadow: 0 0 8px ${color}80;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      el.title = site.memberName;
      if (site.id === selectedSiteId) {
        el.style.transform = "scale(1.5)";
        el.style.boxShadow = `0 0 12px ${color}`;
      }

      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false, className: "mapbox-popup-heritage" })
        .setHTML(`
          <div style="font-family: Cinzel, serif; font-size: 12px; color: #F4EBD0; background: #1a0808; padding: 8px 12px; border: 1px solid #C5A059;">
            <strong>${esc(site.memberName)}</strong>
            ${site.sectionPlot ? `<br/><span style="opacity:0.6; font-size:10px">${esc(site.sectionPlot)}</span>` : ""}
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([site.longitude!, site.latitude!])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => onSelectSite(site));
      markersRef.current.push(marker);
    }

    // Fit bounds to all markers
    if (geo.length === 1) {
      map.flyTo({ center: [geo[0].longitude!, geo[0].latitude!], zoom: 14 });
    } else {
      const bounds = new mapboxgl.LngLatBounds();
      geo.forEach((s) => bounds.extend([s.longitude!, s.latitude!]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }
  }, [sites, selectedSiteId, onSelectSite]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
