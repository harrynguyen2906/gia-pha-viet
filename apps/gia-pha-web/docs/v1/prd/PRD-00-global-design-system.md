# PRD-00: Heritage Cloud — Global Design System, Tech Stack & Interaction Patterns

> **This is the single source of truth** for design tokens, technology choices, shared interaction patterns, and cultural context that ALL modules must follow. Every feature PRD references this document instead of re-defining shared styles.

**Product Name:** Heritage Cloud (Gia Phả Việt)  
**Document Type:** Global System Definition  
**Last Updated:** 2026-02-28

---

## 1. Product Vision & Cultural Context

Heritage Cloud is a **Vietnamese family lineage management system** (Hệ thống Quản lý Gia Phả) rooted in the cultural traditions of Vietnamese ancestor worship (Thờ cúng tổ tiên). Every design decision — from color choices to typography to interaction patterns — must honor and evoke the gravitas of Vietnamese imperial and ancestral heritage.

### 1.1 Cultural Design Principles
| Principle | Application |
|-----------|-------------|
| **Imperial Aesthetics (Phong cách Hoàng Gia)** | Crimson lacquer, gold leaf, parchment scroll motifs inspired by Huế imperial court |
| **Reverence for Ancestors (Kính trọng Tổ tiên)** | Deceased members shown in grayscale with golden lotus markers; solemn UI tone |
| **Vietnamese Lunar Calendar (Âm lịch)** | All date-critical features support both solar (Dương lịch) and lunar (Âm lịch) calendars |
| **Family Hierarchy (Thứ bậc gia đình)** | Role-based access: Head of House (Trưởng tộc), Elders (Bậc trưởng), Heirs (Con cháu), Youth (Thanh niên) |
| **Collective Duty (Bổn phận gia tộc)** | Rituals and duties are communal responsibilities assigned by hierarchy |

### 1.2 Design Language Summary
The UI blends **dark lacquer backgrounds** (reminiscent of Vietnamese lacquerware) with **parchment/aged-silk textures** (evoking ancestral scrolls), accented by **imperial crimson** and **antique gold**. Typography is serif-dominant, evoking classical Vietnamese documents.

---

## 2. Global Color Palette

All modules MUST use these tokens. No ad-hoc color values.

### 2.1 Core Tokens
| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| `primary` | `#8a0000` | `--color-primary` | Primary CTA, active states, borders, buttons |
| `imperial-crimson` | `#8B0000` | `--color-imperial-crimson` | Homepage banner accent, high-emphasis elements |
| `background-dark` | `#230f0f` | `--color-bg-dark` | Base page background (dark mode) |
| `background-light` | `#f8f5f5` | `--color-bg-light` | Base page background (light mode, future) |
| `lacquer-dark` | `#1a0808` | `--color-lacquer` | Deep dark overlays, modal backgrounds |
| `royal-lacquer` | `#1a0000` | `--color-royal-lacquer` | Pillar backgrounds, ultra-dark |

### 2.2 Gold & Accent Tokens
| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| `antique-gold` | `#C5A059` | `--color-gold` | Borders, gold accents, text highlights |
| `gold-leaf` | `#E5C17C` | `--color-gold-leaf` | Display text, button text on dark |
| `accent-gold` | `#d4af37` | `--color-accent-gold` | Deceased borders, badges, calendar highlights |

### 2.3 Surface Tokens
| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| `parchment-base` | `#F4EBD0` | `--color-parchment` | Card backgrounds, banner surfaces |
| `aged-silk` | `#FFF8DC` | `--color-aged-silk` | Calendar cells, light surface variant |
| `temple-stone` | `#2D241E` | `--color-temple-stone` | Card text, secondary text |
| `panel-dark` | `#361818` | `--color-panel-dark` | Sidebar panel backgrounds |
| `dark-paper` | `#2d1b1b` | `--color-dark-paper` | Paper texture backgrounds |
| `charcoal` | `#1a1a1a` | `--color-charcoal` | Table text, day cell text |

### 2.4 Border & Muted Tokens
| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| `border-muted` | `#4b2020` | `--color-border-muted` | Subtle borders, decorative dividers |

### 2.5 Semantic Status Colors
| Status | Color | Usage |
|--------|-------|-------|
| Active / On Duty | `primary` (#8a0000) | Active badges, on-duty states |
| Available / Maintained | Tailwind `green-500/600` | Available badges, maintained status |
| Pending / Needs Visit | Tailwind `amber-500/600` | Warning, needs attention |
| Critical / Overloaded | `primary` (#8a0000) | Overloaded workload, urgent items |
| Completed / Verified | Tailwind `green-500` | Completed checkmarks, done states |

---

## 3. Global Typography

### 3.1 Font Stack
| Token | Font Family | Weight Range | Usage |
|-------|-------------|-------------|-------|
| `display` | Noto Serif (Vithkuqi variant on homepage) | 400, 700 | Section titles, ancestor names, body serif |
| `header` | Cinzel | 400, 700 | Section headers, navigation labels |
| `ornate` | Cinzel Decorative | 400, 700, 900 | Family name display, hero titles (homepage only) |
| `calligraphy` | Pinyon Script | 400 | Ancestral quotes, poetic text |
| `serif` | Playfair Display | 400, 700 | Profile names, card headers (lineage views) |
| `sans` | Noto Sans | 400, 500, 600, 700 | Labels, body text, metadata, UI chrome |

### 3.2 Type Scale
| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Hero family name | ornate | 7xl–9xl | 900 (black) | tight |
| Page title | display | 3xl–5xl | 700–900 | tight |
| Section header | header | 2xl–3xl | 700 | 0.2em |
| Card title | display | base–xl | 700 | normal |
| Body text | sans | sm–base | 400 | normal |
| Label / metadata | sans | [10px]–xs | 700 | widest (0.2em+) |
| Calligraphy quote | calligraphy | 3xl–4xl | 400 | normal |

### 3.3 Google Fonts Loading
```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;700&family=Noto+Serif:wght@400;700&family=Noto+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;700&family=Pinyon+Script&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

---

## 4. Global Component Library

### 4.1 Parchment Card
- Background: `natural-paper.png` texture + radial gradient `#F4EBD0` → `#E6D5B8`
- Border: 1px solid `antique-gold`
- Inner border: `::after` pseudo-element, inset 6px, 1px `rgba(138, 0, 0, 0.2)`
- Shadow: `15px 15px 35px rgba(0, 0, 0, 0.4)`
- Hover: `transform: scale(1.01)` over 300ms

### 4.2 Lacquer Action Button
- Background: `linear-gradient(145deg, #3a0000, #8B0000)`
- Border: 1px solid `antique-gold`
- Shadow: `0 4px 10px rgba(0, 0, 0, 0.3)`
- Text: `gold-leaf` color, Cinzel font, uppercase, letter-spacing widest
- Hover: brightness 110%, text color → white

### 4.3 Paper Texture Card (Dark Mode)
- Background: white / dark:zinc-900/80 + paper texture image overlay
- Background-blend-mode: overlay
- Border: 1px solid `primary/10`
- Shadow: `0 0 15px rgba(138, 0, 0, 0.1)` (soft-glow)

### 4.4 Gold Leaf Border Frame
- Border: 1px solid `accent-gold`
- `::after` inner border: 2px inset, `rgba(212, 175, 55, 0.3)`

### 4.5 Wood Carving Border
- `border-image-source`: diagonal gradient `#4b2020` at 45° and -45°
- `border-image-size`: 10px
- `border-image-repeat`: repeat
- Border-width: 4px

### 4.6 Gold Shimmer Button
- Background: `linear-gradient(135deg, #c5a059 0%, #f1e0b0 50%, #c5a059 100%)`
- Text: `background-dark` color, font-black, uppercase
- Hover: brightness 110%

### 4.7 Sidebar Navigation Item
- Default: `text-slate-300`, `hover:bg-primary/10`, rounded-lg
- Active: `bg-primary/20`, `text-primary`, `border-left: 3px solid primary` or `border border-primary/30`
- Icon: Material Symbols Outlined, `text-primary`

### 4.8 Status Badges
| Status | Background | Text | Border |
|--------|------------|------|--------|
| Active | `primary/20` | `primary` | none |
| Available | `green-100` / `green-900/30` | `green-600` | none |
| Pending | `amber-100` | `amber-800` | none |
| Completed | `green-100` | `green-800` | none |
| High Priority | `border-2 border-primary` | `primary` | `primary` |

### 4.9 Deceased Member Visual Treatment (Global Rule)
Any UI showing a family member who has passed away MUST apply:
- CSS `grayscale(0.6)` filter on their avatar/card
- Gold border (`2px solid #d4af37`) instead of crimson primary
- **Golden Lotus badge**: icon (`psychology_alt` or `filter_vintage`) at top-right of avatar
- Muted text: `slate-400` / `slate-500`
- Hover on avatar: `grayscale(0)` transition over `700ms` (briefly restores color)
- Year range displays death year: `1950 — 2012`

Living members:
- Full-color avatar
- Crimson primary border
- Year range: `1982 — Present`

---

## 5. Tech Stack

### 5.1 Frontend Framework
| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Framework** | Next.js (React) | 14+ (App Router) | SSR for SEO, file-based routing, React ecosystem |
| **Language** | TypeScript | 5.x | Type safety, better DX, refactoring confidence |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, matches UI mockup approach, plugins support |
| **Component Library** | Custom (Headless UI + Radix primitives) | — | No off-the-shelf library matches the imperial aesthetic |
| **Icons** | Material Symbols Outlined | — | Consistent with UI mockups, variable weight/fill |

### 5.2 Interactive Visualization
| Feature | Library | Rationale |
|---------|---------|-----------|
| Neural Root graph | **D3.js** + custom SVG rendering | Force-directed layout, bezier curves, zoom/pan |
| Traditional Tree | **D3.js hierarchy** or **React Flow** | Top-down tree layout with custom node components |
| Map | **Mapbox GL JS** | Dark custom styles, 3D terrain, clustering, mobile support |
| 360° Viewer | **Pannellum** (lightweight) or **Photo Sphere Viewer** | Panoramic image viewer, touch support |
| 3D Tomb Model | **Three.js** (future v2) | For photogrammetry-generated 3D models |
| Drag-and-Drop | **@dnd-kit/core** | Accessible, React-native DnD for Kanban board |
| Calendar | Custom implementation | Solar/Lunar dual display — no standard lib fits |

### 5.3 Backend & Data
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **API** | Next.js API Routes or tRPC | Co-located with frontend, type-safe |
| **Database** | PostgreSQL | Relational data (family trees, relationships, duties) |
| **ORM** | Prisma | Type-safe queries, migration support |
| **Auth** | NextAuth.js (Auth.js) | Role-based access (Head of House, Editor, Member, Guest) |
| **File Storage** | AWS S3 / Cloudflare R2 | Avatars, panoramic images, 3D models, documents |
| **Lunar Calendar** | `lunar-calendar` npm + custom Vietnamese rules | Solar ↔ Lunar conversion with Vietnamese variations |

### 5.4 Infrastructure
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Hosting** | Vercel | Native Next.js deployment, edge functions |
| **CDN** | Vercel Edge / Cloudflare | Image optimization, global delivery |
| **Image Processing** | Sharp (server-side) | Thumbnail generation, format conversion |
| **Monitoring** | Sentry | Error tracking, performance monitoring |

### 5.5 Development Tools
| Tool | Purpose |
|------|---------|
| ESLint + Prettier | Code style enforcement |
| Husky + lint-staged | Pre-commit hooks |
| Vitest + Testing Library | Unit and component tests |
| Playwright | E2E testing |
| Storybook | Component documentation and visual testing |

---

## 6. Global Interaction Patterns

### 6.1 Navigation Model

```
┌─────────────────────────────────────────────────────────┐
│                    Global Header                         │
│  Logo | Search | Nav (Lineage, Map, Rituals, Legacy)    │
│  Notifications | Settings | User Avatar                  │
├──────────┬──────────────────────────────────┬───────────┤
│ Sidebar  │         Main Content Area        │  Detail   │
│ (Context │   (varies per module)            │  Panel    │
│  Nav)    │                                  │  (opt.)   │
│          │                                  │           │
└──────────┴──────────────────────────────────┴───────────┘
```

**Global Header:** Present on ALL pages except Homepage (which has the Imperial Decree Banner as header).
- Logo "Heritage Cloud" + `account_tree` icon → link to Homepage
- Search bar → global search across members, rituals, sites
- Nav links: Lineage | Map | Rituals | Legacy
- User controls: notifications, settings, avatar with dropdown

**Sidebar:** Context-specific per module
- Lineage: view mode toggle, filters, ancestor count
- Map: (none — full-width map)
- Ritual Calendar: ancestral management nav, next observance widget
- Duty Management: core lineage nav, governance nav

**Detail Panel:** Right-side panel on 3-panel layouts
- Lineage: member inspector
- Calendar: ritual detail + duty checklist
- Map: 360° viewer + site detail

### 6.2 Page Transitions
- Route changes: fade transition (200ms ease-in-out)
- Panel open/close: slide-in from right (300ms ease-out)
- Modal open: fade backdrop (200ms) + scale card from 0.95→1.0 (300ms)
- Modal close: reverse animation + confirmation if form is dirty

### 6.3 Hover & Focus States
- **Buttons:** brightness increase (110%) + optional scale(1.02)
- **Cards:** border color shifts to `primary/30`, subtle lift shadow
- **Nav links:** text color transition to primary or white (200ms)
- **Deceased avatars:** grayscale→full-color on hover (700ms transition)
- **Focus rings:** `ring-2 ring-primary ring-offset-2 ring-offset-background-dark`

### 6.4 Loading States
- **Skeleton screens:** Use parchment-colored animated shimmer blocks matching card/cell shape
- **Button loading:** Replace text with spinner icon, disable pointer events
- **Data tables:** Row-level skeleton with faded text placeholders
- **Map:** Show dark background with centered spinner before tiles load

### 6.5 Empty States
- Centered icon (Material Symbols, 4xl, `primary/30`)
- Title: serif font, bold
- Description: sans font, muted text
- CTA button if applicable (e.g., "Add First Member", "Register a Site")

### 6.6 Error States
- Toast notification: slide-in from top-right, crimson background, white text, auto-dismiss 5s
- Form validation: inline error below field, crimson text, `border-red-500`
- Network error: full-page overlay with retry button

### 6.7 Confirmation Dialogs
- Destructive actions (delete member, remove site): modal with crimson warning icon
- "Are you sure?" message + action description
- Two buttons: "Cancel" (secondary) + "Confirm [Action]" (destructive crimson)

### 6.8 Responsive Breakpoints
| Breakpoint | Width | Layout Behavior |
|------------|-------|----------------|
| mobile | < 768px | Single column, no sidebars, bottom sheet for detail panels |
| tablet | 768–1023px | Collapsible sidebar (hamburger), 2-column grids |
| desktop | 1024–1399px | Full sidebar + main, optional detail panel |
| wide | ≥ 1400px | Full 3-panel layout, max-width content containers |

### 6.9 Touch & Gesture Support
- **Map:** Pinch-to-zoom, two-finger pan
- **360° Viewer:** Single-finger drag to rotate, pinch to zoom
- **Kanban Board:** Long-press to initiate drag on touch devices
- **Neural Root Canvas:** Two-finger pan, pinch-to-zoom
- **Calendar:** Swipe left/right to change month (mobile only)

---

## 7. Shared Data Models

### 7.1 Family Member
```typescript
interface FamilyMember {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  isDeceased: boolean;
  birthDateSolar: Date;
  birthDateLunar?: string;        // e.g., "15 tháng Giêng"
  deathDateSolar?: Date;
  deathDateLunar?: string;
  departureRite?: string;
  avatarUrl?: string;
  biography?: string;
  parentIds: string[];             // links to parent members
  spouseIds: string[];             // links to spouse members
  childIds: string[];              // links to children
  generation: number;              // e.g., 14th generation
  lineageRole?: string;            // "Head of House", "Elder", etc.
  assignedDuties: string[];        // duty IDs
  graveSiteId?: string;            // link to grave site
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.2 Ritual Event
```typescript
interface RitualEvent {
  id: string;
  title: string;
  description: string;
  ancestorId: string;              // the honored ancestor
  dateSolar: Date;
  dateLunar: string;
  isRecurring: boolean;            // annual memorial
  lunarRecurrence?: string;        // "15 tháng 3 Âm lịch"
  instructions: RitualInstruction[];
  duties: RitualDuty[];
  isCertified: boolean;
  certifiedBy?: string;
  createdAt: Date;
}

interface RitualInstruction {
  icon: string;                    // Material icon name
  title: string;
  description: string;
  order: number;
}

interface RitualDuty {
  id: string;
  description: string;
  assignedGroup: 'ELDERS' | 'HEIRS' | 'YOUTH' | 'ALL';
  assignedMemberId?: string;
  isCompleted: boolean;
}
```

### 7.3 Family Duty (Kanban)
```typescript
interface FamilyDuty {
  id: string;
  title: string;
  description: string;
  category: 'RELIGIOUS' | 'MAINTENANCE' | 'ARCHIVAL' | 'SOCIAL';
  status: 'QUEUE' | 'ACTIVE' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedMemberId?: string;
  ritualEventId?: string;          // optional link to a ritual
  dueDate?: Date;
  progress: number;                // 0-100 percentage
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.4 Grave Site
```typescript
interface GraveSite {
  id: string;
  ancestorId: string;              // link to FamilyMember
  ancestorName: string;
  sectionPlot: string;             // e.g., "Highland Sector C-14"
  latitude: number;
  longitude: number;
  condition: 'MAINTAINED' | 'NEEDS_VISIT' | 'WEATHERED' | 'RESTORATION';
  epitaph?: string;
  panoramaUrls: string[];          // 360° images
  photoUrls: string[];             // regular photos
  model3dUrl?: string;             // 3D model file (future)
  siteType: 'temple' | 'church' | 'cemetery' | 'private' | 'other';
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 8. Role-Based Access Control (RBAC)

| Action | Head of House | Elder | Heir/Member | Guest |
|--------|:---:|:---:|:---:|:---:|
| View lineage tree | ✅ | ✅ | ✅ | ✅ (public only) |
| Add/edit members | ✅ | ✅ (own branch) | ❌ | ❌ |
| Delete members | ✅ | ❌ | ❌ | ❌ |
| Create ritual events | ✅ | ✅ | ❌ | ❌ |
| Assign duties | ✅ | ✅ | ❌ | ❌ |
| Update duty status | ✅ | ✅ | ✅ (own) | ❌ |
| Certify completion | ✅ | ❌ | ❌ | ❌ |
| Register grave site | ✅ | ✅ | ✅ | ❌ |
| View map & 360° | ✅ | ✅ | ✅ | ✅ |
| Upload photos | ✅ | ✅ | ✅ | ❌ |
| Export pedigree | ✅ | ✅ | ✅ | ❌ |

---

## 9. Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | On 4G (1.6Mbps) |
| FID (First Input Delay) | < 100ms | 75th percentile |
| CLS (Cumulative Layout Shift) | < 0.1 | During page load |
| TTI (Time to Interactive) | < 3.5s | On 4G |
| JS Bundle Size (initial) | < 200KB gzipped | Excluding map/3D libs |
| Map library (lazy loaded) | < 150KB gzipped | Loaded on Map page only |
| 3D/360 viewer (lazy loaded) | < 100KB gzipped | Loaded on demand |
| Image optimization | WebP, max 400KB per panorama | Progressive loading |

---

## 10. Accessibility Requirements

- WCAG 2.1 AA compliance minimum
- All images: meaningful `alt` text (not decorative text)
- Keyboard navigation: Tab through all interactive elements, Enter/Space to activate
- Focus indicators: visible ring (`ring-2 ring-primary`)
- Screen reader: ARIA labels on icon-only buttons, `role` attributes on custom widgets
- Color contrast: 4.5:1 minimum for body text, 3:1 for large text
- Reduced motion: respect `prefers-reduced-motion` for animations
- Touch targets: minimum 44×44px on mobile

---

## 11. Cross-Module Linking

| From | To | Trigger |
|------|----|---------|
| Homepage → Lineage | Click "Enter Life Tree" | Route to Neural Root view |
| Homepage → Calendar | Click "Inscribe Ritual" | Route to Ritual Calendar |
| Homepage → Duty | Click duty card | Route to Duty Management |
| Lineage → Profile | Click node → "Open Full Profile" | Route to Digital Memorial Profile |
| Lineage → Member Input | Click "New Node Entry" / "Add New Member" | Open Member Input modal |
| Calendar → Duty Board | Click "Family Duties" in sidebar | Route to Duty Management |
| Calendar → Duty | Toggle duty checkbox in detail panel | Updates duty status API |
| Map → Profile | Click "ARCHIVES" on site detail | Route to ancestor's profile |
| Map → Registration | Click "Register Site" | Open registration panel |
| Duty Board → Calendar | Category "Religious Duty" → linked ritual | Deep link to calendar date |
| Profile → Map | Grave site link on profile | Route to map with pin selected |
