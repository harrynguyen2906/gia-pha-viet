# PRD-01: Heritage Cloud — Homepage (Imperial Decree Legacy Dashboard)

> **Global Design Reference:** See [PRD-00-global-design-system.md](PRD-00-global-design-system.md) for shared color palette, typography, components, tech stack, interaction patterns, and data models.

## 1. Overview

The Homepage serves as the grand entrance to the Heritage Cloud family lineage management system. It presents a visually stunning, traditional Vietnamese imperial aesthetic — evoking the feeling of an ancient royal decree scroll — while providing at-a-glance access to upcoming rituals, sacred duties, and family lineage navigation.

**Product Name:** Heritage Cloud  
**Module:** Homepage / Imperial Decree Legacy Dashboard  
**Priority:** P0 — Core Entry Point  
**UI Reference:** [docs/ui/1.homepage.html](../ui/1.homepage.html)  
**Related PRDs:**
- [PRD-00 — Global Design System](PRD-00-global-design-system.md) (design tokens, tech stack, shared patterns)
- [PRD-04 — Ritual Calendar](PRD-04-ritual-calendar.md) (linked from Eternal Timeline)
- [PRD-05 — Family Duty Management](PRD-05-family-duty-management.md) (linked from Sacred Duties Panel)
- [PRD-02 — Lineage Visualization](PRD-02-lineage-visualization.md) (linked from "Enter Life Tree" CTA)

---

## 2. Goals & Objectives

- Provide a culturally immersive, visually rich landing page that establishes the identity of the family lineage
- Surface the most important upcoming events (memorial days, rituals) and pending family duties
- Act as the primary navigation hub to all other modules (Lineage, Map, Ritual Calendar, Duty Management)
- Showcase the family name, head of house, and a motivational ancestral quote

---

## 3. Target Users

| Role | Description |
|------|-------------|
| Head of House | Primary administrator who manages the entire lineage |
| Family Members | Registered descendants who view events and fulfill duties |
| Guests | Read-only visitors who browse the public lineage page |

---

## 4. Feature Requirements

### 4.1 Imperial Decree Banner (Header)
- Full-width parchment-textured banner styled as an unrolled royal scroll
- Scroll-end decorations on left and right edges
- Application title "HERITAGE CLOUD" in ornate display font
- Subtitle "Imperial Ancestral Management System"
- Embedded navigation bar (Sanctum, Scrolls, Altar, Rites) in a crimson ribbon

### 4.2 Family Identity Section
- Large decorative family name display (e.g., "House of Nguyen") with gold-leaf gradient text
- Ancestral quote in calligraphy font
- "Inscribe Ritual" CTA button linking to Ritual Calendar
- Head of House avatar, name, and title display

### 4.3 Eternal Timeline (Upcoming Events)
- Vertical timeline with parchment-styled cards
- Each card shows: date, event name, description
- Visual timeline connector with dot indicators
- Active events show crimson dot; past/upcoming show muted dot
- Maximum 3–5 upcoming events displayed

### 4.4 Sacred Duties Panel
- Grid of duty cards (2 columns on desktop)
- Each card shows: duty icon, priority badge, title, location, description
- Assigned member avatar and name
- Status indicator (Active / Pending)
- Count badge showing pending decrees (e.g., "3 Decrees Awaiting")

### 4.5 Imperial Insight / CTA Block
- Full-width parchment card with motivational ancestral quote
- "Enter Life Tree" button navigating to the Neural Root / Traditional Lineage view
- Decorative background icon (potted plant motif)

### 4.6 Lacquer Pillar Sidebars (Desktop)
- Left and right vertical pillars with crimson lacquer gradient
- Dragon motif overlay pattern
- Parallel Vietnamese calligraphy text (vertical writing mode)
- Pillar cap decorations top and bottom
- Hidden on mobile/tablet breakpoints

### 4.7 Footer
- Decorative divider with floral icon
- "Guardians of the Eternal Legacy" tagline
- Year in Roman numerals

---

## 5. Style Bounding & Design System

> **Shared tokens** (colors, typography, components) are defined in [PRD-00 §2–4](PRD-00-global-design-system.md). This section documents Homepage-specific overrides.

### 5.1 Homepage-Specific Tokens
| Token | Hex | Usage | Notes |
|-------|-----|-------|-------|
| imperial-crimson | `#8B0000` | Banner accent, scroll borders | Same as PRD-00 `primary` |
| royal-lacquer | `#1a0000` | Pillar base background | Deeper variant of `lacquer-dark` |
| parchment-base | `#F4EBD0` | Banner surface | PRD-00 `parchment-base` |

### 5.2 Homepage-Specific Typography
| Element | Font | Notes |
|---------|------|-------|
| Family name hero | Cinzel Decorative (ornate), 7xl–9xl, 900 weight | Homepage only — not used in other modules |
| Ancestral quote | Pinyon Script (calligraphy), 3xl | Homepage only |
| Pillar text | Noto Serif, vertical writing-mode | Vietnamese calligraphy on lacquer pillars |

### 5.3 Homepage-Specific Component Styles
- **Imperial Decree Banner:** Linear gradient parchment (#f4ebd0 → #d4c3a3), 5px crimson top/bottom borders, inner crimson shadow
- **Scroll Ends:** 40px wide crimson gradient bars with gold borders (left/right edge decorations)
- **Lacquer Pillar Sidebars:** Crimson gradient with dragon motif overlay, Vietnamese vertical text
- All other cards/buttons follow PRD-00 Parchment Card (§4.1) and Lacquer Action Button (§4.2)

### 5.4 Layout
- Full-height flex layout with sticky sidebar pillars
- Main content: max-width 1400px, centered
- Grid: 5/7 split for timeline vs duties on large screens
- Responsive: pillars hidden on < lg breakpoint

### 5.5 Background
- Full-screen background image (blurred, fixed attachment)
- Dark overlay with 40% opacity + 12px backdrop blur

---

## 5b. Module-Specific Tech Stack

> Full stack defined in [PRD-00 §5](PRD-00-global-design-system.md).

| Feature | Technology | Notes |
|---------|-----------|-------|
| **Background image** | Next.js Image with `priority` + `placeholder="blur"` | LCP optimization |
| **Timeline data** | React Server Component → fetch rituals API | SSR for SEO |
| **Duty cards** | Client Component with SWR/React Query | Real-time status updates |
| **Scroll decorations** | CSS pseudo-elements + SVG | No JS dependency |
| **Pillar text** | CSS `writing-mode: vertical-rl` | Pure CSS vertical text |

---

## 5c. Interaction Logic

### Page Load Sequence
1. Background image loads with blur placeholder (LCP target)
2. Imperial Decree Banner renders (SSR HTML)
3. Family Identity section hydrates (family name, quote, HoH avatar from API)
4. Eternal Timeline cards populate from Ritual Calendar API (next 3–5 events)
5. Sacred Duties panel loads from Duty API (active/pending duties)
6. Lacquer pillars render on desktop (CSS-only — no JS)

### Navigation Interactions
| Element | Action | Destination |
|---------|--------|-------------|
| Nav bar "Sanctum" | Click | Homepage (current) |
| Nav bar "Scrolls" | Click | Neural Root / Lineage view (PRD-02) |
| Nav bar "Altar" | Click | Ancestral Map (PRD-03) |
| Nav bar "Rites" | Click | Ritual Calendar (PRD-04) |
| "Inscribe Ritual" CTA | Click | Ritual Calendar (PRD-04) — create mode |
| "Enter Life Tree" CTA | Click | Neural Root view (PRD-02) |
| Duty card | Click | Duty detail in Duty Management (PRD-05) |
| Timeline event card | Click | Ritual Calendar date view (PRD-04) |
| Head of House avatar | Click | User profile / settings |

### Hover & Focus States
- Parchment cards: `transform: scale(1.01)` over 300ms + border glow
- Lacquer buttons: brightness 110% + text color → white
- Timeline dots: pulse animation on active event
- Pillar text: subtle glow on hover (decorative, non-interactive)

### Responsive Behavior
| Viewport | Layout |
|----------|--------|
| Desktop ≥1024px | Full layout with lacquer pillars + 5/7 grid |
| Tablet 768–1023px | No pillars, stacked timeline + duties |
| Mobile <768px | Single column, nav bar becomes hamburger menu |

---

## 6. Definition of Done (DoD)

- [ ] Homepage renders with full imperial decree banner and scroll decorations
- [ ] Family name displays with gold-leaf gradient text effect
- [ ] Navigation bar is functional and routes to all 4 main modules
- [ ] Eternal Timeline shows at least 2 upcoming events from the database
- [ ] Sacred Duties panel loads assigned duties with correct status indicators
- [ ] Head of House info dynamically loads from user/family data
- [ ] Lacquer pillar sidebars appear on desktop (≥1024px) and hide on mobile
- [ ] All parchment cards have correct texture, border, and shadow styling
- [ ] CTA buttons ("Inscribe Ritual", "Enter Life Tree") link to correct routes
- [ ] Page is fully responsive (mobile, tablet, desktop)
- [ ] Background image loads with blur overlay effect
- [ ] Footer renders with decorative elements
- [ ] Page load performance: LCP < 2.5s on 4G connection
- [ ] Accessible: all images have alt text, buttons are keyboard navigable
- [ ] Cross-browser tested: Chrome, Safari, Firefox, Edge

---

## 7. API / Data Dependencies

| Data | Source | Notes |
|------|--------|-------|
| Family name & quote | Family Profile API | Editable by Head of House |
| Head of House info | User/Member API | Avatar, name, title |
| Upcoming events | Ritual Calendar API | Next 3–5 events sorted by date |
| Pending duties | Duty Management API | Filtered by status = Active/Pending |

---

## 8. Out of Scope (v1)

- Dark/light theme toggle (dark mode only for v1)
- Multi-language support (Vietnamese localization deferred)
- Real-time notification bell functionality
- Animated dragon motif on pillars
