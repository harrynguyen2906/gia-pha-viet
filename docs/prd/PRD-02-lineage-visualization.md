# PRD-02: Heritage Cloud — Lineage Visualization (Neural Root & Traditional Tree Views)

> **Global Design Reference:** See [PRD-00-global-design-system.md](PRD-00-global-design-system.md) for shared color palette, typography, components, tech stack, interaction patterns, and data models.

## 1. Overview

The Lineage Visualization module is the core of Heritage Cloud, providing two distinct views to explore family relationships: a **Neural Root Network** (graph/network view) and a **Traditional Lineage Flow** (hierarchical tree view). Deceased members are visually distinguished with grayscale styling, and each member node links to a detailed Digital Memorial Profile. A Member Input modal allows adding/editing family members.

**Product Name:** Heritage Cloud  
**Module:** Lineage Visualization  
**Priority:** P0 — Core Feature  
**UI References:**
- [docs/ui/2.neuralroot.html](../ui/2.neuralroot.html) — Neural Root Network View
- [docs/ui/3.digitalprofile.html](../ui/3.digitalprofile.html) — Digital Memorial Profile
- [docs/ui/4.traditionallineage.html](../ui/4.traditionallineage.html) — Traditional Lineage Flow View
- [docs/ui/4.1.memberinput.html](../ui/4.1.memberinput.html) — Member Information Entry Modal

**Related PRDs:**
- [PRD-00 — Global Design System](PRD-00-global-design-system.md) (design tokens, tech stack, shared patterns)
- [PRD-03 — Ancestral Map](PRD-03-ancestral-map.md) (grave site link in profile)
- [PRD-05 — Family Duty Management](PRD-05-family-duty-management.md) (duty assignments in profile)

---

## 2. Goals & Objectives

- Visualize the entire family tree in two complementary formats: network graph and hierarchical tree
- Clearly distinguish living members from deceased (passed away) members using grayscale visual treatment
- Enable navigation through generations with zoom, pan, and search capabilities
- Provide a detailed profile view for each ancestor with biography, media gallery, and virtual offerings
- Allow authorized users to add and edit family member records

---

## 3. Target Users

| Role | Description |
|------|-------------|
| Head of House | Full CRUD access to all member records |
| Family Editors | Can add/edit members in their branch |
| Family Members | View-only access to lineage and profiles |
| Guests | View-only access to public lineage data |

---

## 4. Feature Requirements

### 4.1 Neural Root Network View

#### 4.1.1 Interactive Canvas
- Full-screen dark canvas with ink-wash background texture
- SVG-based bezier curve connections between family nodes
- Nodes positioned in a radial/organic layout emanating from a central root user
- Canvas supports pan (drag) and zoom (scroll/pinch) interactions

#### 4.1.2 Family Member Nodes
- **Living Members:** Full-color circular avatar with crimson border, name, birth year – present
- **Deceased Members (Passaways):** Grayscale circular avatar with muted slate border, name, birth – death year, Golden Lotus icon badge indicating "Legacy Bearer" / "Ancestral Departed"
- **Central Node (Current User/Root):** Larger avatar (80px) with thicker crimson border
- **Ancestor Nodes:** Progressively smaller and more transparent as distance from root increases
- Hover interaction: deceased nodes briefly restore color (grayscale-0 transition)

#### 4.1.3 Sidebar Panel (Left)
- View Mode Toggle: Neural / Tree buttons (switches between views)
- Filter Options: Direct Lineage, Collateral Kin, Duty Holders (checkbox list)
- Total ancestor count with live indicator
- "New Node Entry" button to open Member Input modal

#### 4.1.4 Detail Inspector Panel (Right)
- Displays selected node's full profile summary
- Large avatar (128px) with edit button
- Name, lineage title, current duty description
- Vital data: Birth Date, Origin, Lineage Index
- Neural Connections: avatar stack of connected family members
- "Open Full Profile" button linking to Digital Profile page

#### 4.1.5 Canvas Controls
- Zoom In / Zoom Out buttons (bottom-right floating)
- Re-center / My Location button

#### 4.1.6 Lineage Legend
- Top-left overlay panel explaining node visual codes:
  - Direct Root Path (crimson ring)
  - Golden Lotus / Legacy Bearer (yellow-gold)
  - Ancestral Departed (grayscale with slate border)

### 4.2 Traditional Lineage Flow View

#### 4.2.1 Hierarchical Tree Layout
- Top-down vertical flow: Patriarch/Matriarch at top → descendants below
- Gold connector lines (vertical + horizontal) linking generations
- Each generation row is visually spaced with labeled connectors

#### 4.2.2 Member Cards
- **Parchment Cards** with dark gradient background
- **Deceased Cards:** Grayscale filter (0.6) + gold border (2px `#d4af37`), gold "Patriarch" label badge
- **Living/Active Cards:** Crimson border, "Current Head" label badge
- Each card shows: avatar (round, 80px), name, year range, optional subtitle
- Descendant cards at lower generations are slightly smaller (64px avatar, 56px width)

#### 4.2.3 Sidebar Tools
- Zoom In / Zoom Out
- Filter View (active state highlighted)
- Search Ancestor
- Print Pedigree / Export Pedigree
- Active Generation info panel (family name, founding year)

#### 4.2.4 Actions Bar
- "Add New Member" button → opens Member Input modal
- "Export Pedigree" button → generates PDF/image of tree
- Breadcrumb navigation (Archives > Imperial Lineage > Traditional Flow View)

#### 4.2.5 Bottom Toolbar
- View switcher icons: Tree (active), Group, Calendar, Map
- Member count display (e.g., "128 Members Tracked")
- Sync status indicator

### 4.3 Digital Memorial Profile

#### 4.3.1 Hero Section
- Large grayscale portrait (264×320px) with gold-leaf border
- Golden Lotus icon badge for deceased members
- Generation title (e.g., "14th Generation Lineage Head")
- Full name with year range
- Personal quote in italic
- Action buttons: Edit Record, Download Pedigree

#### 4.3.2 Virtual Offering Panel
- Skeuomorphic 3D-style buttons: "Light Incense", "Offer Flowers"
- Animated incense icon on hover (pulse)
- Monthly tribute counter

#### 4.3.3 Content Tabs
- **Ancestral Biography** (default): Life Journey timeline with icons per milestone
- **Archival Gallery**: Grid of grayscale historical photos with hover zoom
- **Ancestral Duties**: Duties this ancestor historically held
- **Descendants**: Quick links to descendant profiles

#### 4.3.4 Life Journey Timeline
- Left-bordered vertical timeline with icon markers
- Each entry: date, title, description paragraph
- Icons per event type: birth (child_care), education (school), founding (domain), passing (elderly)

#### 4.3.5 Legacy Snapshot Sidebar
- Direct Descendants count
- Records Authenticated percentage
- Honorific Status tier (e.g., Gold Tier)

### 4.4 Member Information Entry Modal

#### 4.4.1 Modal Overlay
- Full-screen overlay with blur backdrop (bg-black/80)
- Centered card: max-width 4xl, split layout (1/3 sidebar + 2/3 form)
- Close button (×) top-right

#### 4.4.2 Profile Sidebar (Left 1/3)
- Round avatar (192px) with gold border and edit overlay on hover
- Lineage Name text input (serif font)
- Gender select dropdown (Male/Female/Other)
- Living/Deceased toggle switch

#### 4.4.3 Form Fields (Right 2/3)

**Vital Records Section:**
- Solar Birth Date (date picker)
- Lunar Birth Epoch (text input, Vietnamese lunar calendar format)
- Solar Death Date (date picker, enabled when Deceased toggle is on)
- Departure Rite (text input)

**Lineage Placement Section:**
- Parent A dropdown (search from existing members)
- Life Partner dropdown (search from existing members)

**Legacy & Duty Section:**
- Life Summary (textarea, 3 rows, serif italic styling)
- Sacred Duties Assigned (tag list with remove buttons + "Assign Duty" add button)

#### 4.4.4 Form Actions
- "Discard" button (charcoal background, low emphasis)
- "Sanctify Entry" button (crimson primary, high emphasis)

---

## 5. Style Bounding & Design System

> **Shared tokens** (colors, typography, deceased treatment, components) are defined in [PRD-00 §2–4](PRD-00-global-design-system.md). This section documents Lineage-specific details.

### 5.1 Lineage-Specific Color Tokens
| Token | Hex | Usage | Notes |
|-------|-----|-------|-------|
| panel-dark | `#361818` | Sidebar panels | Darker than PRD-00 `dark-paper` |
| border-muted | `#4b2020` | Subtle borders in canvas | PRD-00 shared token |

All other colors (primary, accent-gold, background-dark, lacquer-dark, gold-leaf) → see PRD-00 §2.

### 5.2 Typography
All fonts from PRD-00 §3. Module-specific usage:
| Element | Font | Notes |
|---------|------|-------|
| Profile names | Playfair Display (`serif`) | Used in Digital Profile & card headers |
| Modal headers | Cinzel | Section headers in Member Input modal |
| Neural/Tree labels | Noto Sans | Node labels, canvas overlay text |

### 5.3 Deceased Member Visual Treatment
Follows PRD-00 §4.9 exactly:
- Grayscale(0.6) filter, gold border (#d4af37), Golden Lotus badge
- Hover: grayscale(0) transition over 700ms

### 5.4 Node Sizing Hierarchy
| Node Type | Avatar Size | Border Width | Opacity |
|-----------|-------------|--------------|---------|
| Central/Root | 80px | 4px crimson | 1.0 |
| Parent (Living) | 64px | 2px crimson/60 | 1.0 |
| Parent (Deceased) | 64px | 2px slate-600 | 1.0 + grayscale |
| Distant Ancestor | 56px | 1px slate-700 | 0.8 + grayscale |

### 5.5 Connection Lines
- SVG paths with cubic bezier curves
- Neural view stroke: `rgba(138, 0, 0, 0.3)`, 1.5px
- Traditional view stroke: `#d4af37` at 0.4 opacity, 1.5px

### 5.6 Layout
- **Neural View:** 3-panel (sidebar 288px | canvas flex-1 | inspector 320px)
- **Traditional View:** 2-panel (sidebar 256px | tree canvas flex-1)
- **Profile Page:** Single column max-width 1200px with 3-col grid (2/3 + 1/3)
- **Member Modal:** Fixed overlay, max-w-4xl, flex row (1/3 + 2/3)

---

## 5b. Module-Specific Tech Stack

> Full stack defined in [PRD-00 §5](PRD-00-global-design-system.md).

| Feature | Technology | Notes |
|---------|-----------|-------|
| **Neural Root graph** | D3.js (force-directed layout) + custom SVG | Bezier curves, zoom/pan, node clustering |
| **Traditional Tree** | D3.js hierarchy (`d3-hierarchy`) or React Flow | Top-down tree layout with custom node components |
| **Canvas zoom/pan** | D3-zoom | Consistent zoom behavior across both views |
| **Profile gallery** | Lightbox library (e.g., `yet-another-react-lightbox`) | Image zoom/fullscreen for archival photos |
| **Virtual offerings** | CSS animations + Lottie (optional) | Incense glow, flower animation on click |
| **Member form** | React Hook Form + Zod validation | Type-safe form with searchable dropdowns |
| **Export pedigree** | `html-to-image` + `jsPDF` | Generate PDF/PNG of tree canvas |

### Key API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|--------|
| GET | `/api/members` | List all family members (with relationships) |
| GET | `/api/members/:id` | Full member profile (bio, media, duties) |
| POST | `/api/members` | Create new member |
| PATCH | `/api/members/:id` | Update member |
| DELETE | `/api/members/:id` | Delete member (Head of House only) |
| GET | `/api/members/:id/media` | Gallery photos for profile |
| POST | `/api/members/:id/offerings` | Record a virtual offering |
| GET | `/api/relationships` | All edges (parent-child, spouse) for graph |

---

## 5c. Interaction Logic

### Page Load Sequence (Neural Root)
1. Sidebar renders (static nav + view toggle)
2. Canvas shows loading spinner on dark background
3. API: `GET /api/members` + `GET /api/relationships` (parallel)
4. D3 force simulation initializes → nodes + edges animate into position (500ms)
5. Central node (current user) placed at center
6. Inspector panel empty until a node is clicked
7. Legend overlay fades in (200ms delay)

### Page Load Sequence (Traditional Tree)
1. Sidebar renders (tools + generation info)
2. API: same member + relationship data
3. D3-hierarchy calculates top-down layout
4. Tree renders top-down with gold connector lines
5. Auto-zoom to fit entire tree initially
6. Breadcrumb populates

### View Switching
1. User clicks "Neural" or "Tree" toggle in sidebar
2. Current selected member ID is preserved
3. Canvas fades out (200ms) → new layout calculates → fades in (300ms)
4. If a member was selected, inspector/panel re-populates for that member

### Node Interaction (Neural Root)
| Action | Result |
|--------|--------|
| Hover node | Name tooltip appears, deceased nodes briefly restore color |
| Click node | Inspector panel populates with member summary |
| Double-click node | Navigate to Digital Memorial Profile page |
| Drag node | Repositions node in force layout (other nodes react) |
| Scroll | Zoom in/out on canvas |
| Drag canvas | Pan the viewport |

### Node Interaction (Traditional Tree)
| Action | Result |
|--------|--------|
| Click card | Card highlights with primary border glow |
| Double-click card | Navigate to Digital Memorial Profile page |
| Hover card | Slight lift shadow |

### Member Input Modal Flow
1. User clicks "New Node Entry" (Neural) or "Add New Member" (Traditional)
2. Modal fades in with backdrop blur
3. Avatar upload area: click to upload → preview renders
4. Living/Deceased toggle: when switched to Deceased, death date + departure rite fields enable
5. Parent/Partner dropdowns: searchable with live filtering from member API
6. "Sanctify Entry" → POST `/api/members` → success: modal closes, new node appears in graph/tree
7. "Discard" → if form dirty: confirmation dialog → close without saving

### Profile Page Interactions
| Element | Action | Result |
|---------|--------|--------|
| "Light Incense" | Click | Animated incense glow + POST offering |
| "Offer Flowers" | Click | Flower animation + POST offering |
| Tab: Biography | Click | Show Life Journey timeline |
| Tab: Gallery | Click | Show archival photo grid |
| Tab: Duties | Click | Show historical & current duties |
| Tab: Descendants | Click | Show descendant links |
| Gallery image | Click | Lightbox opens with zoom |
| "Edit Record" | Click | Opens Member Input modal in edit mode |
| "Download Pedigree" | Click | Export branch as PDF |

### Responsive Behavior
| Viewport | Neural Root | Traditional Tree | Profile |
|----------|------------|-------------------|---------|
| Desktop ≥1024px | 3-panel (sidebar + canvas + inspector) | 2-panel (sidebar + tree) | 2/3 + 1/3 grid |
| Tablet 768–1023px | Canvas full-width, sidebar/inspector as drawers | Full-width tree, sidebar as drawer | Single column |
| Mobile <768px | Canvas with bottom sheet for inspector | Scrollable tree, no sidebar | Single column, tabs become dropdown |

---

## 6. Definition of Done (DoD)

### Neural Root View
- [ ] Interactive canvas renders with pan and zoom functionality
- [ ] Family nodes display with correct avatar, name, and date
- [ ] Deceased members show grayscale filter + Golden Lotus badge
- [ ] Living members show full-color avatar with crimson border
- [ ] SVG connection lines render between related nodes
- [ ] Left sidebar toggles between Neural and Tree views
- [ ] Filters (Direct Lineage, Collateral Kin, Duty Holders) work correctly
- [ ] Right inspector panel populates when a node is clicked/selected
- [ ] "Open Full Profile" navigates to the Digital Memorial Profile page
- [ ] Zoom controls and re-center button function correctly
- [ ] Legend overlay displays correct visual codes

### Traditional Lineage Flow
- [ ] Hierarchical tree renders top-down with gold connector lines
- [ ] Patriarch at top with "Patriarch" gold badge
- [ ] Deceased cards apply grayscale + gold border styling
- [ ] Current Head card shows crimson border + "Current Head" badge
- [ ] Sidebar tools (zoom, filter, search, print) are functional
- [ ] "Add New Member" opens Member Input modal
- [ ] "Export Pedigree" generates downloadable PDF/image
- [ ] Bottom toolbar view switcher navigates between modes
- [ ] Breadcrumb navigation is correct and functional

### Digital Memorial Profile
- [ ] Grayscale hero portrait renders with gold-leaf border
- [ ] Virtual Offering buttons trigger visual feedback (incense glow, flower animation)
- [ ] Life Journey timeline renders with correct icons per event type
- [ ] Archival Gallery shows grid of images with hover zoom
- [ ] Content tabs switch between Biography, Gallery, Duties, Descendants
- [ ] Legacy Snapshot sidebar displays correct statistics
- [ ] Edit Record button opens edit mode (or navigates to Member Input)

### Member Input Modal
- [ ] Modal opens as overlay with backdrop blur
- [ ] Avatar upload area supports click-to-upload with preview
- [ ] All form fields validate on submit (required: name, at least one date)
- [ ] Living/Deceased toggle enables/disables death-related fields
- [ ] Parent and Partner dropdowns search existing member database
- [ ] Sacred Duties tag list supports add and remove
- [ ] "Sanctify Entry" saves data and closes modal with success feedback
- [ ] "Discard" closes modal without saving (with confirmation if dirty)

### Cross-Cutting
- [ ] Both views are responsive (mobile shows single-panel with drawer navigation)
- [ ] Navigation between Neural and Traditional views preserves selected member state
- [ ] Total ancestors count updates dynamically
- [ ] All interactions have smooth CSS transitions (300-700ms)
- [ ] Accessible: keyboard navigable, screen reader labels on nodes

---

## 7. API / Data Dependencies

| Data | Source | Notes |
|------|--------|-------|
| Member list | Member API | Full family member records |
| Relationships | Relationship API | Parent-child, spouse edges |
| Member profile | Member Detail API | Bio, dates, duties, media |
| Media files | Media/Storage API | Avatar images, archival photos |
| Duty assignments | Duty API | Current and historical duties |
| Member CRUD | Member API (POST/PUT/DELETE) | Create/update/delete members |

---

## 8. Out of Scope (v1)

- DNA analysis integration
- AI-powered relationship suggestion
- Collaborative real-time editing of the tree
- Family tree merge (combining two lineages)
- Video media in archival gallery
- Animated tree growth visualization
