# RF-01 — Refactor: Mapbox GL → Google Maps

> **Status:** Planned  
> **Priority:** High  
> **Affected modules:** `src/components/map/`, `src/app/map/`, `package.json`, env config  
> **Estimated scope:** 4 files modified, 2 files deleted, 1 file created

---

## 1. Motivation

- **Mapbox GL JS** requires a per-project access token and charges beyond 50k map loads/month.
- **Google Maps** is already familiar to the target audience (Vietnamese families), offers superior Vietnamese-language labeling, Street View integration, and a generous $200/month free credit (~28k dynamic map loads).
- The current map integration is limited to marker display + popups — no advanced Mapbox-specific features (vector tiles, custom layers, 3D terrain) are used, making migration straightforward.

---

## 2. Scope of Changes

### 2.1 Files to Remove

| File | Reason |
|------|--------|
| `src/components/map/MapboxMap.tsx` | Replaced by `GoogleMap.tsx` |
| `src/types/mapbox__point-geometry.d.ts` | No longer needed |

### 2.2 Files to Create

| File | Purpose |
|------|---------|
| `src/components/map/GoogleMap.tsx` | New Google Maps component using `@vis.gl/react-google-maps` |

### 2.3 Files to Modify

| File | Change |
|------|--------|
| `src/components/map/MapClient.tsx` | Update import from `MapboxMap` → `GoogleMap` |
| `package.json` | Remove `mapbox-gl`, `@types/mapbox-gl`; add `@vis.gl/react-google-maps` |
| `.env.local` | Replace `NEXT_PUBLIC_MAPBOX_TOKEN` → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| `next.config.ts` | No changes required (env vars auto-exposed via `NEXT_PUBLIC_` prefix) |

---

## 3. API Key Setup Guide

### 3.1 Create a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Navigate to **APIs & Services → Library**
4. Enable these APIs:
   - **Maps JavaScript API** (required)
   - **Geocoding API** (optional — for address lookup)
5. Navigate to **APIs & Services → Credentials**
6. Click **+ CREATE CREDENTIALS → API key**
7. Copy the generated key

### 3.2 Restrict the API Key (Important for Security)

1. Click on the newly created key to edit it
2. Under **Application restrictions**, select **HTTP referrers (websites)**
3. Add your allowed domains:
   ```
   localhost:3000/*
   your-production-domain.com/*
   ```
4. Under **API restrictions**, select **Restrict key** and choose only:
   - Maps JavaScript API
   - Geocoding API (if enabled)
5. Click **Save**

### 3.3 Add the Key to the Project

Create or update `.env.local` in the project root:

```env
# ── Google Maps ─────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# ── Remove the old Mapbox token (no longer needed) ─────
# NEXT_PUBLIC_MAPBOX_TOKEN=...
```

> **⚠️ Never commit `.env.local` to version control.** The file is already listed in `.gitignore` by default in Next.js projects.

### 3.4 Verify `.gitignore`

Ensure `.gitignore` contains:

```gitignore
.env*.local
```

---

## 4. Implementation Details

### 4.1 Install Dependencies

```bash
# Remove Mapbox
npm uninstall mapbox-gl @types/mapbox-gl

# Install Google Maps React library
npm install @vis.gl/react-google-maps
```

### 4.2 New `GoogleMap.tsx` Component

Replace `MapboxMap.tsx` with a new component using `@vis.gl/react-google-maps`:

```tsx
"use client";

import { useCallback, useState } from "react";
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

const DEFAULT_CENTER = { lat: 16.0, lng: 108.2 }; // Vietnam
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

        {infoSite && infoSite.latitude && infoSite.longitude && (
          <InfoWindow
            position={{ lat: infoSite.latitude, lng: infoSite.longitude }}
            onCloseClick={() => setInfoSite(null)}
          >
            <div style={{
              fontFamily: "Cinzel, serif",
              fontSize: 12,
              color: "#F4EBD0",
              background: "#1a0808",
              padding: "8px 12px",
              border: "1px solid #C5A059",
            }}>
              <strong>{infoSite.memberName}</strong>
              {infoSite.sectionPlot && (
                <><br /><span style={{ opacity: 0.6, fontSize: 10 }}>{infoSite.sectionPlot}</span></>
              )}
            </div>
          </InfoWindow>
        )}

        <FitBounds sites={geo} />
      </Map>
    </APIProvider>
  );
}

/** Auto-fit map bounds to all markers */
function FitBounds({ sites }: { sites: Site[] }) {
  const map = useMap();

  useCallback(() => {
    if (!map || sites.length === 0) return;
    if (sites.length === 1) {
      map.panTo({ lat: sites[0].latitude!, lng: sites[0].longitude! });
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    sites.forEach((s) => bounds.extend({ lat: s.latitude!, lng: s.longitude! }));
    map.fitBounds(bounds, 80);
  }, [map, sites])();

  return null;
}
```

### 4.3 Update `MapClient.tsx`

Change the dynamic import:

```diff
- // Mapbox-gl must be dynamically imported (needs browser)
- const MapboxMap = dynamic(() => import("@/components/map/MapboxMap"), { ssr: false });
+ // Google Maps must be dynamically imported (needs browser)
+ const GoogleMap = dynamic(() => import("@/components/map/GoogleMap"), { ssr: false });
```

And update the JSX reference:

```diff
- <MapboxMap
+ <GoogleMap
    sites={displayed}
    onSelectSite={setSelectedSite}
    selectedSiteId={selectedSite?.id ?? null}
  />
```

### 4.4 Delete Mapbox Type Stub

Remove `src/types/mapbox__point-geometry.d.ts` — no longer needed.

---

## 5. Feature Parity Checklist

| Feature | Mapbox (current) | Google Maps (new) | Status |
|---------|-----------------|-------------------|--------|
| Dark theme map | `dark-v11` style | `colorScheme="DARK"` | ✅ Equivalent |
| Custom markers by condition | DOM element markers | `AdvancedMarker` with custom content | ✅ Equivalent |
| Popups on marker click | `mapboxgl.Popup` | `InfoWindow` | ✅ Equivalent |
| Selected marker highlight | `scale(1.5)` transform | Larger marker size | ✅ Equivalent |
| Fit bounds to markers | `map.fitBounds()` | `map.fitBounds()` | ✅ Equivalent |
| Pan / Zoom controls | `NavigationControl` | Built-in UI controls | ✅ Equivalent |
| Vietnam-centered default | `[108.2, 16.0]` center | `{ lat: 16.0, lng: 108.2 }` | ✅ Equivalent |
| Google Maps link (sidebar) | External link | External link (unchanged) | ✅ No change |
| Vietnamese labels | Limited | ✅ Native support | ✅ Better |

---

## 6. Testing Plan

1. **Smoke test:** Map loads with dark theme centered on Vietnam
2. **Markers:** All grave sites render with correct condition-colored markers
3. **Selection:** Clicking a marker selects it, shows InfoWindow, updates sidebar
4. **Fit bounds:** Map auto-zooms to fit all markers on load
5. **Empty state:** No crashes when zero sites exist
6. **Env missing:** Graceful degradation when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is empty
7. **Mobile:** Touch gestures (pinch zoom, pan) work correctly

---

## 7. Rollback Strategy

If issues arise, revert the commit and restore Mapbox:

```bash
git revert <commit-hash>
npm install mapbox-gl @types/mapbox-gl
```

Re-add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local`.

---

## 8. Cost Comparison

| Provider | Free Tier | Cost After Free Tier |
|----------|-----------|---------------------|
| **Mapbox** | 50,000 map loads/month | $5.00 per 1,000 loads |
| **Google Maps** | $200 credit/month (~28,000 loads) | $7.00 per 1,000 loads |

For a family genealogy app with low traffic, both are effectively free. Google wins on Vietnamese localization and user familiarity.
