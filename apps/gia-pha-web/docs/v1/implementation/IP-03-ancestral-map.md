# IP-03: Ancestral Map & Grave Locator

> **Phase:** 3 (có thể song song với Phase 2)  
> **Mục tiêu:** Map hiển thị vị trí mộ, 360° panorama, site registration  
> **Depends on:** IP-00 (Foundation), Members API (từ IP-02 LINE-001)  
> **PRD Reference:** PRD-03-ancestral-map.md  
> **API Reference:** `api-design.md §4 (Grave Sites)`

---

## Task 3.1: Grave Sites API

**ID:** `MAP-001`  
**Output:** API routes cho Sites CRUD + spatial queries

**Các bước chi tiết:**
1. Tạo `src/app/api/v1/sites/route.ts`:
   - `GET` — list sites (filters: condition, siteType, search, radius + lat/lng, sortBy)
   - `POST` — create site (RBAC: HEAD_OF_HOUSE, ELDER, MEMBER)
   - Spatial query: dùng PostGIS `ST_DWithin` hoặc raw SQL Haversine nếu không có PostGIS
   - Từ `api-design.md §4.1, §4.3`
2. Tạo `src/app/api/v1/sites/[id]/route.ts`:
   - `GET` — detail (include: media, member)
   - `PATCH` — update
3. Tạo `src/app/api/v1/sites/[id]/media/route.ts`:
   - `GET` — list site media
   - `POST` — upload (panorama max 50MB + regular photos max 10MB)
   - `DELETE` — remove media
4. Tạo `src/app/api/v1/sites/stats/route.ts`:
   - `GET` — site statistics (totalSites, maintainedCount, etc.)
5. Tạo SWR hook: `src/hooks/useSites.ts`

**AI Prompt mẫu:**
> Tạo Grave Sites API:
> 1. `src/app/api/v1/sites/route.ts` — GET (list + spatial filtering by lat/lng/radius) + POST (create site)
> 2. `src/app/api/v1/sites/[id]/route.ts` — GET detail + PATCH update
> 3. `src/app/api/v1/sites/[id]/media/route.ts` — GET/POST/DELETE media (panorama up to 50MB)
> 4. `src/app/api/v1/sites/stats/route.ts` — GET statistics
> Distance sort: Haversine formula trong SQL raw query.
> RBAC: MEMBER+ có thể register & upload, HEAD_OF_HOUSE để delete.
> Spec: `docs/implementation/api-design.md §4`, Schema: `docs/db-design/database-schema.md`

**DoD:**
- [ ] `GET /api/v1/sites?lat=16.46&lng=107.59&radius=50` trả sites sorted by distance
- [ ] `POST /api/v1/sites` tạo site mới, trả 201
- [ ] `POST /api/v1/sites/:id/media` upload panorama 50MB thành công
- [ ] `GET /api/v1/sites/stats` trả statistics object
- [ ] Condition filter (MAINTAINED, NEEDS_VISIT, etc.) hoạt động

---

## Task 3.2: Mapbox GL Integration

**ID:** `MAP-002`  
**Output:** `src/components/map/MapContainer.tsx`

**Các bước chi tiết:**
1. Cài: `npm install mapbox-gl @types/mapbox-gl`
2. Tạo `MapContainer.tsx`:
   - Dynamic import (`ssr: false`)
   - Dark style: `mapbox://styles/mapbox/dark-v11` hoặc custom dark-sepia style
   - Initial view: center trên Việt Nam (latitude: 16.0, longitude: 108.0, zoom: 6)
   - Mapbox access token từ `.env.local`: `NEXT_PUBLIC_MAPBOX_TOKEN`
3. Map controls:
   - Zoom in/out (top-left)
   - Terrain/satellite toggle (top-right)
   - Compass (auto-rotate)
4. Responsive: full-width trên mobile, 2/3 width trên desktop (1/3 = detail panel)
5. Skeleton loader khi map chưa load xong

**AI Prompt mẫu:**
> Tạo `MapContainer.tsx` — Mapbox GL wrapper:
> 1. Dynamic import (ssr: false) — Mapbox cần DOM
> 2. Dark style (`dark-v11`), initial center Vietnam (16°N, 108°E)
> 3. Controls: zoom, terrain toggle, compass
> 4. Responsive: mobile full-width, desktop 2/3
> 5. Props: `onPinClick(siteId)`, `selectedSiteId`
> 6. Skeleton loader trước khi map ready
> Tham khảo: PRD-03 §3.1

**DoD:**
- [ ] Map render dark style với center Vietnam
- [ ] Zoom/terrain controls hoạt động
- [ ] Mobile: full-width; Desktop: 2/3 width
- [ ] Skeleton loader hiện khi map đang load

---

## Task 3.3: Custom Site Pins + Clustering

**ID:** `MAP-003`  
**Output:** `src/components/map/SitePin.tsx`

**Các bước chi tiết:**
1. Fetch sites: `useSites()` hook → add markers to map
2. Custom pin design:
   - Crimson teardrop shape (CSS)
   - `location_on` Material icon (white) inside
   - Hover: scale(1.2), bounce animation
   - Selected: ring highlight (gold-leaf), elevated shadow
3. Clustering khi zoom < 10:
   - Mapbox built-in clustering source
   - Cluster circle: crimson bg, white text (count number)
   - Click cluster → zoom in to expand
4. Condition-based pin color:
   - MAINTAINED: green tint
   - NEEDS_VISIT: amber tint
   - WEATHERED: gray tint
   - RESTORATION: crimson pulse animation
5. Tooltip on hover: ancestor name + condition badge

**DoD:**
- [ ] Pins hiện trên map từ database data
- [ ] Click pin → trigger `onPinClick(siteId)`
- [ ] Hover: tooltip hiện ancestor name
- [ ] Clustering khi zoom out
- [ ] Click cluster → zoom to expand
- [ ] Condition colors hiện đúng

---

## Task 3.4: Site Detail Panel

**ID:** `MAP-004`  
**Output:** `src/components/map/SiteDetailPanel.tsx`

**Các bước chi tiết:**
1. Right panel (1/3 width desktop, bottom sheet mobile)
2. Content khi site selected:
   - Ancestor name (font-serif, text-xl)
   - Life dates
   - Section/Plot identifier
   - Condition badge (StatusBadge component)
   - Site type badge (TEMPLE, CEMETERY, etc.)
   - Epitaph quote (font-calligraphy, text-lg, italic)
   - Last visited date
3. Action buttons:
   - "NAVIGATE" → open Google/Apple Maps directions (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`)
   - "ARCHIVES" → link to `/lineage/[memberId]` (Digital Profile)
4. Photo gallery thumbnail row (click → open panorama viewer)
5. Slide-in animation (animate-slide-in-right)

**DoD:**
- [ ] Panel slide-in khi pin clicked
- [ ] Ancestor info hiện đầy đủ
- [ ] "NAVIGATE" mở Google Maps app/web với directions
- [ ] "ARCHIVES" route đến Digital Profile
- [ ] Photo thumbnails hiện cho site media

---

## Task 3.5: 360° Panorama Viewer

**ID:** `MAP-005`  
**Output:** `src/components/map/PanoramaViewer.tsx`

**Các bước chi tiết:**
1. Cài: `npm install pannellum-react` hoặc `@photo-sphere-viewer/core`
2. Tạo `PanoramaViewer.tsx`:
   - Dynamic import (ssr: false)
   - Full panoramic display inside detail panel
   - Controls:
     - Left/right rotation arrows
     - Auto-rotate toggle button (center)
     - Zoom in/out
   - Touch support: drag to rotate, pinch to zoom
3. "LIVE PREVIEW" badge (green dot + text)
4. Loading: skeleton shimmer trước khi panoramic image load
5. Fallback: nếu site không có panorama → hiện regular photo grid hoặc EmptyState

**AI Prompt mẫu:**
> Tạo `PanoramaViewer.tsx` — Pannellum 360° viewer:
> 1. Dynamic import (ssr: false)
> 2. Load equirectangular panorama image URL từ site media
> 3. Controls: rotate arrows, auto-rotate, zoom
> 4. Touch: drag-to-rotate, pinch-to-zoom
> 5. "LIVE PREVIEW" badge
> 6. Loading skeleton + fallback khi không có panorama
> Tham khảo: PRD-03 §3.3

**DoD:**
- [ ] 360° panorama render đúng
- [ ] Touch rotation + zoom hoạt động trên mobile
- [ ] Auto-rotate toggle works
- [ ] Loading skeleton hiện khi ảnh đang load
- [ ] Fallback: EmptyState hoặc photo grid khi không có panorama

---

## Task 3.6: Grave Site Registration Form

**ID:** `MAP-006`  
**Output:** `src/app/map/register/page.tsx` + `src/components/map/SiteRegistrationForm.tsx`

**Các bước chi tiết:**
1. Form layout (right panel overlay hoặc separate page):
   - **Section "Lineage Details":**
     - Ancestor name (searchable select từ members)
     - Cemetery section/plot (text)
     - Condition dropdown (MAINTAINED, NEEDS_VISIT, WEATHERED, RESTORATION)
     - Site type dropdown (TEMPLE, CEMETERY, PRIVATE, etc.)
     - Epitaph (textarea)
   - **Section "Geographic Coordinates":**
     - Embedded mini-map (Mapbox, 300px height)
     - Draggable pin → update lat/lng fields
     - "DROP PIN" button to place marker
     - "Get Current Location" button → Browser Geolocation API
     - Lat/Lng display (readonly, auto-updated from pin)
   - **Section "Visual Preservation":**
     - Drag-and-drop photo upload zone (`react-dropzone`)
     - "CAPTURE 360°" button (device camera — future)
     - Uploaded image grid (4 columns, with remove button)
2. **Actions:**
   - "Commit to Archives" (btn-gold-shimmer) → POST `/api/v1/sites` + upload media
   - "Cancel" → close form, confirm if dirty
3. Cài: `npm install react-dropzone`

**AI Prompt mẫu:**
> Build `SiteRegistrationForm.tsx` — form đăng ký mộ phần:
> 1. Ancestor (searchable select from members), section/plot, condition, site type, epitaph
> 2. Embedded mini Mapbox: draggable pin + "Get Current Location" (Geolocation API) → auto-fill lat/lng
> 3. Photo upload: react-dropzone, multi-file, thumbnail grid, remove button
> 4. Validate: ancestor required, lat/lng required
> 5. Submit: POST /api/v1/sites → then POST /api/v1/sites/:id/media for each photo
> Tham khảo: PRD-03 §3.4, api-design.md §4.3–4.5

**DoD:**
- [ ] Form render đầy đủ 3 sections
- [ ] Searchable ancestor select hoạt động
- [ ] Mini-map hiện, draggable pin update lat/lng
- [ ] "Get Current Location" fill coordinates từ GPS
- [ ] Drag-and-drop upload hiện thumbnails
- [ ] Submit tạo site + upload media thành công
- [ ] New pin hiện trên main map sau submit

---

## Task 3.7: Search + Statistics Bar

**ID:** `MAP-007`  
**Output:** Search functionality + footer stats

**Các bước chi tiết:**
1. **Search bar** (bottom of map):
   - Input field: search by ancestor name, clan, section/plot
   - Debounce 300ms
   - Results dropdown: max 5 items, click → zoom-to-pin
   - Advanced filter button → open filter panel (condition, siteType)
2. **Resting Places List** (below map, scrollable):
   - 3-column grid (desktop), 1-column (mobile)
   - Site cards: WoodCarvingBorder frame, ancestor name, epitaph (2 lines), distance badge, condition badge
   - "VIEW MAP" → highlight pin on map
   - "GPS SYNC" → navigate via Google Maps
3. **Footer Statistics Bar:**
   - Fetch `/api/v1/sites/stats`
   - 4 stats: Total Sites | Maintained Lineage | Visitors This Month | Maintenance %

**DoD:**
- [ ] Search tìm site by name/section
- [ ] Click search result → zoom to pin trên map
- [ ] Resting Places list hiện cards đúng style
- [ ] "VIEW MAP" highlight pin
- [ ] Statistics bar hiện 4 số liệu từ API

---

## Tổng kết IP-03

**Thứ tự thực hiện:**
```
MAP-001 (Sites API)
    ↓
MAP-002 (Mapbox Container) ←→ MAP-003 (Pins + Clustering) — song song sau API
    ↓
MAP-004 (Detail Panel)
    ↓
MAP-005 (360° Viewer)
    ↓
MAP-006 (Registration Form)
    ↓
MAP-007 (Search + Stats)
```

**Phase 3 Definition of Done tổng:**
- [ ] Map hiện dark style với site pins
- [ ] Click pin → detail panel + 360° viewer
- [ ] Site registration tạo site + upload photos
- [ ] Spatial search & distance sort hoạt động
- [ ] "NAVIGATE" mở directions
- [ ] Clustering khi zoom out
- [ ] Responsive: full-width map mobile, bottom sheet detail
