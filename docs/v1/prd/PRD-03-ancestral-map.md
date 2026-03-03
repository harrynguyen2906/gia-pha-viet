# PRD-03: Heritage Cloud — Ancestral Map & Grave Locator (3D Tomb Viewer)

> **Global Design Reference:** See [PRD-00-global-design-system.md](PRD-00-global-design-system.md) for shared color palette, typography, components, tech stack, interaction patterns, and data models.

## 1. Overview

The Ancestral Map module provides a geographic visualization of where deceased family members' graves and memorial sites are located. It features an interactive map with custom pins, a 360°/3D tomb viewer for immersive grave recognition, a site registration workflow for adding new grave locations, and a list of ancestral resting places with distance and maintenance status.

**Product Name:** Heritage Cloud  
**Module:** Ancestral Map & Grave Locator  
**Priority:** P0 — Core Feature  
**UI References:**
- [docs/ui/5.ancestralmap.html](../ui/5.ancestralmap.html) — Map & 360° Viewer
- [docs/ui/5.1.registersite.html](../ui/5.1.registersite.html) — Grave Registration Form

**Related PRDs:**
- [PRD-00 — Global Design System](PRD-00-global-design-system.md) (design tokens, tech stack, shared patterns)
- [PRD-02 — Lineage Visualization](PRD-02-lineage-visualization.md) ("ARCHIVES" links to Digital Profile)
- [PRD-05 — Family Duty Management](PRD-05-family-duty-management.md) (maintenance duties link from map)

---

## 2. Goals & Objectives

- Display all registered grave/memorial sites on an interactive map with multiple location pins
- Provide 3D/360° panoramic views of each tomb for easy visual recognition
- Enable family members to register new grave sites with GPS coordinates and photo uploads
- Support navigation (directions) to grave locations
- Track maintenance condition of each site

---

## 3. Target Users

| Role | Description |
|------|-------------|
| Head of House | Register sites, manage all grave data |
| Family Editors | Register sites, upload photos, update conditions |
| Family Members | View map, navigate to sites, view 3D previews |
| Visitors on-site | Use GPS sync and navigation to locate graves |

---

## 4. Feature Requirements

### 4.1 Interactive Map Interface

#### 4.1.1 Map Display
- Full-width map area (2/3 of screen on desktop) with topographic/satellite imagery
- Dark-themed map style consistent with Heritage Cloud design language
- Gradient overlays at top and bottom edges for visual integration
- Supports multiple location pins simultaneously displayed

#### 4.1.2 Map Controls
- Zoom In / Zoom Out buttons (top-left corner)
- Terrain/Layer toggle button (top-right corner)
- Search bar at bottom of map: search by ancestor name, clan, or site ID
- Filter button within search bar for advanced filtering

#### 4.1.3 Custom Map Pins
- Custom-styled pins with crimson background + `location_on` icon
- Label below each pin showing ancestor name
- Selected pin: bouncing animation + highlighted label
- Multiple pins visible simultaneously across different geographic locations
- Pin clustering when zoomed out (group nearby locations)

#### 4.1.4 Map Interactions
- Click pin → select site → update 360° Viewer and detail panel
- Drag to pan map
- Scroll/pinch to zoom
- Double-click to zoom in on location

### 4.2 360° / 3D Grave Site Viewer

#### 4.2.1 Viewer Panel
- Right sidebar panel (1/3 of screen on desktop)
- Header: "Grave Site 360° Viewer" with "LIVE PREVIEW" badge
- Large viewer area showing panoramic/3D photo of the tomb
- Dark overlay on hover revealing controls

#### 4.2.2 3D Navigation Controls
- Left/Right rotation arrows (circular buttons)
- Central "360" button to toggle auto-rotate mode
- Touch/drag support for mobile rotation
- Zoom in/out within the 3D view

#### 4.2.3 Site Detail Below Viewer
- Ancestor name (bold, large)
- Life span (birth – death year)
- Section/Plot identifier (e.g., "Highland Sector C-14")
- Info button for expanded details

#### 4.2.4 Action Buttons
- "NAVIGATE" — opens external maps app (Google Maps / Apple Maps) with coordinates
- "ARCHIVES" — links to the ancestor's Digital Memorial Profile

### 4.3 Ancestral Resting Places List

#### 4.3.1 List Section
- Section title: "Ancestral Resting Places" with subtitle "Nearby your current location"
- Sorting options: Sort by Clan, Sort by Distance

#### 4.3.2 Site Cards (Grid: 3 columns on desktop)
- Wood-carving border style (decorative diagonal gradient border)
- Each card shows:
  - Site type icon (temple, church, landscape)
  - Distance from current location (km)
  - Ancestor name
  - Epitaph/quote in italic
  - Section/Plot name
  - Maintenance Condition badge: Maintained (green), Needs Visit (amber), Weathered (red), Restoration Required (red)
- Action buttons per card: "VIEW MAP" (highlights on map), "GPS SYNC" (syncs with device GPS)

### 4.4 Grave Site Registration Form

#### 4.4.1 Registration Panel
- Slide-in or overlay panel from the right side
- Paper texture background with gold accent styling
- Header: "Register New Site" with close button

#### 4.4.2 Lineage Details Section
- Ancestor Name input (required)
- Cemetery Section/Plot input
- Maintenance Condition dropdown (Maintained, Needs Visitation, Weathered, Restoration Required)

#### 4.4.3 Geographic Coordinates Section
- Embedded mini-map with draggable pin for location selection
- "DROP PIN" interactive marker
- Zoom controls on mini-map
- Latitude/Longitude display (auto-populated from pin)
- "Get Current Location" button using device GPS (Geolocation API)

#### 4.4.4 Visual Preservation Section (3D Capture)
- "Upload & Convert to 3D" dropzone for multiple grave photos
  - Supports drag-and-drop
  - Multiple image upload for 3D photogrammetric stitching
- "CAPTURE REAL-TIME 360" button — launches device camera for panoramic capture
- "MOBILE SYNC" button — pairs with mobile device for on-site photo capture
- Uploaded image thumbnail grid (4 columns) with add button

#### 4.4.5 Form Actions
- "Commit to Archives" primary button (gold shimmer gradient)
- "Cancel" secondary button
- Sacred Custody notice: encryption and data security messaging

### 4.5 Footer Statistics Bar
- Total Registered Sites count
- Maintained Lineage (generations count)
- Site Visitors this month
- Maintenance Status percentage

---

## 5. Style Bounding & Design System

> **Shared tokens** (colors, typography, components) are defined in [PRD-00 §2–4](PRD-00-global-design-system.md). This section documents Map-specific details.

### 5.1 Map-Specific Color Tokens
| Token | Hex | Usage | Notes |
|-------|-----|-------|-------|
| dark-paper | `#2d1b1b` | Registration form texture bg | PRD-00 shared token |

All other colors (primary, antique-gold, background-dark) → see PRD-00 §2.

### 5.2 Typography
All fonts from PRD-00 §3.
| Element | Font | Notes |
|---------|------|-------|
| Site names | Noto Serif (`display`) | Ancestor names on cards |
| Labels & metadata | Noto Sans (`sans`) | Body text, badges |

### 5.3 Map-Specific Components
- **Wood Carving Border:** PRD-00 §4.5 — diagonal gradient border-image `#4b2020`, 4px
- **Gold Shimmer Button:** PRD-00 §4.6 — "Commit to Archives" uses this style
- **Map Gradient Overlay:** Top-to-bottom gradient from `rgba(35,15,15,0.4)` → transparent → `rgba(35,15,15,0.8)` — integrates map edges with page
- **Paper Texture:** handmade-paper.png overlay at 10% opacity on registration form

### 5.4 Map Pin Style
- Background: `primary` (#8a0000) with white icon
- Icon: Material `location_on`
- Label: dark background with primary border, 10px bold text
- Selected animation: CSS `animate-bounce`

### 5.5 Layout
- **Map Page:** 3-column grid (2/3 map + 1/3 viewer) on xl breakpoint
- **Registration Form:** Right sidebar overlay, max-w-2xl, scrollable
- **Resting Places List:** 3-column grid on lg, 2 on md, 1 on mobile
- **Footer Stats:** 4-column grid on md, 2 on mobile

### 5.6 3D/360° Viewer
- Full-height viewer area within the sidebar panel
- Controls overlaid at bottom center (transparent background buttons)
- Dark overlay (`bg-black/20`) dimming on idle, lightening on hover

---

## 5b. Module-Specific Tech Stack

> Full stack defined in [PRD-00 §5](PRD-00-global-design-system.md).

| Feature | Technology | Notes |
|---------|-----------|-------|
| **Map rendering** | Mapbox GL JS | Dark custom style, 3D terrain, clustering, mobile gestures |
| **Map pins** | Mapbox Markers + custom CSS | Crimson styled pins with bounce animation |
| **Pin clustering** | Mapbox `supercluster` or built-in clustering | Aggregates nearby pins when zoomed out |
| **360° Viewer** | Pannellum or Photo Sphere Viewer | Lightweight panoramic viewer, touch support |
| **3D Model Viewer** | Three.js (future v2) | For photogrammetry-generated 3D tomb models |
| **GPS / Geolocation** | Browser Geolocation API | Current position for registration + distance calc |
| **Photo upload** | `react-dropzone` + presigned S3 URLs | Multi-file drag-and-drop, progress tracking |
| **360° Capture** | Device camera API + stitching service | Real-time panoramic capture via mobile |
| **Distance calc** | Haversine formula (client-side) | Calculate distance from user to each site |

### Key API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|--------|
| GET | `/api/sites` | List all grave sites (lat, lng, condition, ancestor) |
| GET | `/api/sites/:id` | Full site detail (panorama URLs, 3D model) |
| POST | `/api/sites` | Register new grave site |
| PATCH | `/api/sites/:id` | Update site (condition, photos) |
| DELETE | `/api/sites/:id` | Delete site (Head of House only) |
| POST | `/api/sites/:id/photos` | Upload photos for site |
| GET | `/api/sites/stats` | Footer statistics (total sites, maintained %) |

---

## 5c. Interaction Logic

### Page Load Sequence
1. Map container renders with dark background + loading spinner
2. Mapbox GL JS initializes with dark custom style
3. API: `GET /api/sites` fetches all registered sites
4. Custom crimson pins rendered at each site’s coordinates
5. Pin clustering activates at low zoom levels
6. Right panel (360° Viewer) shows “Select a site” placeholder
7. Resting Places list renders below map from same data
8. Footer statistics populate from `/api/sites/stats`
9. If user grants GPS permission → distances calculated and sort-by-distance available

### Map Pin Selection Flow
1. User clicks a map pin
2. Pin bounces (`animate-bounce`) + label highlights
3. Map smoothly pans/zooms to center the selected pin
4. Right panel loads: 360° panoramic viewer populates with site images
5. Site detail shows below viewer (name, dates, section/plot)
6. Corresponding card in Resting Places list highlights (scroll into view)

### 360° Viewer Interactions
| Action | Result |
|--------|--------|
| Drag / swipe on viewer | Rotate panoramic view |
| Click rotation arrows | Rotate left/right by 45° |
| Click "360" button | Toggle auto-rotate mode |
| Pinch-to-zoom | Zoom in/out within panorama |
| Click "NAVIGATE" | Opens Google Maps / Apple Maps with coordinates |
| Click "ARCHIVES" | Navigates to ancestor’s Digital Memorial Profile (PRD-02) |

### Registration Flow
1. User clicks “Register Site” button (from map controls or list)
2. Registration panel slides in from right (300ms ease-out)
3. **Lineage Details**: user fills ancestor name, section/plot, condition
4. **Coordinates**: user drops pin on mini-map OR clicks “Get Current Location”
   - Pin drop: drag marker on embedded mini-map → lat/lng auto-populate
   - GPS: browser requests geolocation permission → coordinates fill automatically
5. **Photo upload**: drag-and-drop zone for multiple photos → thumbnail grid populates
6. **360° Capture**: “CAPTURE REAL-TIME 360” launches device camera for panoramic capture
7. **Submit**: “Commit to Archives” → POST `/api/sites` + upload photos
8. Success: panel closes, new pin appears on map with slide-in animation + success toast
9. Cancel: if form dirty → confirmation dialog → close without saving

### Site Card Interactions (Resting Places List)
| Element | Action | Result |
|---------|--------|--------|
| "VIEW MAP" | Click | Scrolls to map, highlights pin, zooms in |
| "GPS SYNC" | Click | Syncs coordinates with device GPS, opens navigation |
| Condition badge | Hover | Tooltip with last inspection date |
| Sort by Clan | Click | Re-sorts list alphabetically by clan/family name |
| Sort by Distance | Click | Re-sorts by distance from current location |

### Search & Filter
- Search bar at bottom of map searches by ancestor name, clan, or site ID
- Filter button opens advanced filter panel (condition, site type, distance range)
- Results filter both map pins (hide non-matching) and list cards
- Debounced search (300ms) for real-time filtering

### Responsive Behavior
| Viewport | Map | 360° Viewer | Registration |
|----------|-----|------------|-------------|
| Desktop ≥1280px | 2/3 width | 1/3 right panel | Right sidebar overlay |
| Tablet 768–1279px | Full width | Bottom sheet | Bottom sheet |
| Mobile <768px | Full width, compact controls | Full-screen overlay | Full-screen overlay |

---

## 6. Definition of Done (DoD)

### Map Interface
- [ ] Interactive map renders with correct dark topographic styling
- [ ] Multiple grave location pins are displayed simultaneously on the map
- [ ] Clicking a pin selects the site and updates the 360° viewer
- [ ] Map supports zoom (buttons + scroll/pinch) and pan (drag)
- [ ] Search bar filters sites by ancestor name, clan, or site ID
- [ ] Terrain/layer toggle switches map style
- [ ] Selected pin shows bounce animation and highlighted label
- [ ] Pin clustering works when multiple sites are geographically close

### 360° / 3D Viewer
- [ ] 360° panoramic viewer loads for selected grave site
- [ ] User can rotate view left/right using arrow buttons
- [ ] Touch/drag rotation works on mobile devices
- [ ] Auto-rotate mode toggles with the 360° button
- [ ] Site name, dates, and section display below the viewer
- [ ] "NAVIGATE" button opens device maps with correct coordinates
- [ ] "ARCHIVES" button links to the ancestor's Digital Memorial Profile

### Resting Places List
- [ ] All registered sites render as cards in responsive grid
- [ ] Distance calculation works based on user's current GPS location
- [ ] Sorting by Clan and Distance works correctly
- [ ] Maintenance condition badges show correct color coding
- [ ] "VIEW MAP" scrolls to map and highlights the pin
- [ ] "GPS SYNC" syncs coordinates with device location services

### Grave Registration
- [ ] Registration form opens as overlay panel
- [ ] All required fields validate before submission (ancestor name, coordinates)
- [ ] Mini-map allows dragging pin to set coordinates
- [ ] "Get Current Location" populates lat/lng from device GPS
- [ ] Photo upload supports multiple file drag-and-drop
- [ ] Uploaded photos display as thumbnail grid
- [ ] "Capture Real-Time 360" launches camera interface
- [ ] "Commit to Archives" saves site to database with success feedback
- [ ] "Cancel" closes form without saving

### Cross-Cutting
- [ ] Page is fully responsive across mobile, tablet, and desktop
- [ ] Map integration uses appropriate library (Mapbox, Leaflet, or Google Maps)
- [ ] 3D viewer uses Three.js, Pannellum, or equivalent panoramic library
- [ ] Photo-to-3D pipeline processes multi-angle photos into viewable model
- [ ] GPS permissions are requested gracefully with fallback
- [ ] All images have alt text; map controls are keyboard accessible
- [ ] Footer statistics load dynamically from database

---

## 7. API / Data Dependencies

| Data | Source | Notes |
|------|--------|-------|
| Grave sites list | Grave Site API | All registered sites with coordinates |
| Site detail | Grave Site Detail API | Ancestor link, photos, 3D model URL |
| 360° panorama | Media/Storage API | Panoramic images or 3D model files |
| GPS coordinates | Browser Geolocation API | For current location & distance calc |
| Map tiles | Mapbox / Google Maps / Leaflet | External map tile provider |
| Photo upload | Media Upload API | Multi-file upload with progress |
| 3D processing | 3D Processing Service | Converts multi-angle photos to 3D model |
| Navigation | Google Maps / Apple Maps URL | Deep link for directions |

---

## 8. Technical Considerations

### 8.1 Map Library Options
- **Mapbox GL JS** — Recommended for dark styling customization and 3D terrain
- **Leaflet + Custom Tiles** — Lightweight alternative
- **Google Maps API** — Broad compatibility, satellite imagery

### 8.2 3D/360° Viewer Options
- **Pannellum** — Lightweight open-source panoramic viewer
- **Three.js** — For full 3D model rendering (photogrammetry output)
- **A-Frame** — WebVR-ready panoramic viewer
- **Photo-to-3D Pipeline:** OpenCV / Meshroom for server-side photogrammetry

### 8.3 Performance
- Lazy-load 360° panoramas (load only for selected site)
- Compress panoramic images (WebP, progressive JPEG)
- Map pin clustering to avoid rendering thousands of pins
- Thumbnail generation for uploaded photos

---

## 9. Out of Scope (v1)

- AR (Augmented Reality) overlay for on-site tomb viewing
- Drone-captured aerial cemetery maps
- Automated grave condition detection via AI
- Offline map caching
- Multi-family site sharing between different Heritage Cloud accounts
- Full photogrammetry 3D model generation (v1 uses 360° panoramic photos only)
