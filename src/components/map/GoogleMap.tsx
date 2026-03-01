"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";

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
const DEFAULT_CENTER = { lat: 16.0, lng: 108.2 };
const DEFAULT_ZOOM = 5;

export default function GoogleMap({ sites, onSelectSite, selectedSiteId }: Props) {
  const [infoSite, setInfoSite] = useState<Site | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const geo = sites.filter((s) => s.latitude != null && s.longitude != null);

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId="heritage-map"
        style={{ width: "100%", height: "100%" }}
        colorScheme="DARK"
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {geo.map((site) => {
          const color = CONDITION_HEX[site.condition ?? "UNKNOWN"] ?? "#C5A059";
          const isSelected = site.id === selectedSiteId;
          return (
            <AdvancedMarker
              key={site.id}
              position={{ lat: site.latitude!, lng: site.longitude! }}
              title={site.memberName}
              onClick={() => {
                onSelectSite(site);
                setInfoSite(site);
              }}
            >
              <div
                style={{
                  width: isSelected ? 20 : 14,
                  height: isSelected ? 20 : 14,
                  borderRadius: "50%",
                  background: color,
                  border: "2px solid #C5A059",
                  boxShadow: `0 0 ${isSelected ? 12 : 8}px ${color}80`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            </AdvancedMarker>
          );
        })}

        {infoSite && infoSite.latitude != null && infoSite.longitude != null && (
          <InfoWindow
            position={{ lat: infoSite.latitude, lng: infoSite.longitude }}
            onCloseClick={() => setInfoSite(null)}
          >
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 12,
                color: "#F4EBD0",
                background: "#1a0808",
                padding: "8px 12px",
                border: "1px solid #C5A059",
              }}
            >
              <strong>{infoSite.memberName}</strong>
              {infoSite.sectionPlot && (
                <>
                  <br />
                  <span style={{ opacity: 0.6, fontSize: 10 }}>{infoSite.sectionPlot}</span>
                </>
              )}
            </div>
          </InfoWindow>
        )}

        <FitBounds sites={geo} />
      </Map>
    </APIProvider>
  );
}

/** Auto-fits the map viewport to all visible markers whenever the sites list changes. */
function FitBounds({ sites }: { sites: Site[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || sites.length === 0) return;

    if (sites.length === 1) {
      map.panTo({ lat: sites[0].latitude!, lng: sites[0].longitude! });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    sites.forEach((s) => bounds.extend({ lat: s.latitude!, lng: s.longitude! }));
    map.fitBounds(bounds, 80);
  }, [map, sites]);

  return null;
}
