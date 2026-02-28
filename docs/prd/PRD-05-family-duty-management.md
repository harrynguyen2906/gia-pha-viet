# PRD-05: Heritage Cloud — Family Duty Management

> **Global Design Reference:** See [PRD-00-global-design-system.md](PRD-00-global-design-system.md) for shared color palette, typography, components, tech stack, interaction patterns, and data models.

## 1. Overview

The **Family Duty Management** module provides a Kanban-style board for delegating, tracking, and completing all family obligations — from religious rites and estate maintenance to archival work and social events. It offers a drag-and-drop workflow (Queue → Active → Accomplished), real-time overview statistics, and a descendant workload table showing each member's current assignment load. This module integrates tightly with the Ritual Calendar (PRD-04) but stands on its own as the governance hub for all family duties.

**Product Name:** Heritage Cloud  
**Module:** Family Duty Management (Quản lý Bổn phận Gia tộc)  
**Priority:** P0 — Core Feature  
**UI Reference:** [docs/ui/7.familydutymng.html](../ui/7.familydutymng.html)  
**Related PRDs:**
- [PRD-00 — Global Design System](PRD-00-global-design-system.md) (design tokens, tech stack, shared patterns)
- [PRD-04 — Ritual Calendar](PRD-04-ritual-calendar.md) (ritual events that generate duties)

---

## 2. Goals & Objectives

- **Centralize duty coordination** — one board for all family obligations regardless of category
- **Visualize workflow** — Kanban columns (Queue → Active → Accomplished) make status instantly clear
- **Enable drag-and-drop** — move duties between columns to update status
- **Track workload equity** — descendant workload table shows who is overloaded, available, or on duty
- **Link to rituals** — duties with category "Religious Duty" link back to the originating ritual event in the calendar
- **Certify accountability** — completed duties display verification attribution ("Verified by [Name]")

---

## 3. Target Users

| Role | Permissions |
|------|-------------|
| **Head of House (Trưởng tộc)** | Full CRUD on all duties, assign to any member, verify completion, view all workloads |
| **Elders (Bậc trưởng)** | Create duties within their branch, reassign to heirs/youth, verify own-branch duties |
| **Heirs / Members (Con cháu)** | View assigned duties, update progress, move own duties to Active / Request completion |
| **Youth (Thanh niên)** | View assigned duties, mark progress |
| **Guest** | No access to duty management |

---

## 4. Feature Requirements

### 4.1 Page Layout

```
┌─────────────┬──────────────────────────────────────────────┐
│  Sidebar     │  Header: "Duty Delegation" + Notifications  │
│  (256px)     │  + Search + [Assign New Duty] button         │
│              ├──────────────────────────────────────────────┤
│  Core        │  4 × Overview Statistics Cards               │
│  Lineage     ├──────────────────────────────────────────────┤
│  section     │  ┌─────────┬──────────┬──────────┐          │
│              │  │  Duty    │  Active  │ Accomp-  │          │
│  Governance  │  │  Queue   │ Mandates │  lished  │          │
│  section     │  │  (DnD)   │  (DnD)   │  Tasks   │          │
│  (active:    │  └─────────┴──────────┴──────────┘          │
│   Duty       ├──────────────────────────────────────────────┤
│   Delegation)│  Descendant Workload Status Table            │
│              │                                              │
│  User panel  │                                              │
└─────────────┴──────────────────────────────────────────────┘
```

### 4.2 Sidebar Navigation

#### 4.2.1 Structure
Two sidebar sections separated by heading labels:

**Core Lineage**
| Icon | Label | Action |
|------|-------|--------|
| `account_tree` | Family Tree | Navigate to lineage view |
| `history_edu` | Ancestral Records | Navigate to records |

**Governance**
| Icon | Label | Action | State |
|------|-------|--------|-------|
| `assignment_ind` | Duty Delegation | Current page | **Active** (sidebar-active style) |
| `monetization_on` | Estate Management | Navigate | Default |
| `gavel` | Protocol & Law | Navigate | Default |

#### 4.2.2 Active Item Style
- `background-color: primary/20`
- `border-left: 3px solid primary`
- Text color: `primary`

#### 4.2.3 User Panel (Bottom)
- Fixed to sidebar bottom
- Rounded card with user avatar, name "Lord Sterling", role "Head of House"
- Settings gear icon

### 4.3 Header Bar

- Page title: "Duty Delegation" in `font-display font-bold text-xl`
- Notification badge: `notifications_active` icon + "3 Pending Requests" label
  - Background: `primary/5`, border `primary/10`, rounded-full pill
- Search icon (expandable on click)
- **Assign New Duty** button:
  - Background: `primary`, hover `primary/90`
  - Text: white, font-bold, text-sm
  - Icon: `add`
  - Shadow: `shadow-lg shadow-primary/20`
  - Click → opens "New Duty" creation modal (see §4.7)

### 4.4 Overview Statistics Cards

A row of 4 cards above the Kanban board, responsive `grid-cols-1 md:grid-cols-4`:

| Card | Label | Display | Notes |
|------|-------|---------|-------|
| **Total Duties** | "TOTAL DUTIES" | "24 Active" | Count of non-completed duties |
| **Pending Review** | "PENDING REVIEW" | "08 Due" | Duties approaching due date |
| **Efficiency Rating** | "EFFICIENCY RATING" | "92%" + trend | Green upward arrow if improving, red downward if declining |
| **Descendant Workload** | "DESCENDANT WORKLOAD" | Avatar stack + count | Stacked mini avatars (negative overlap) + "12 Assigned" text |

**Card Style:**
- Background: `background-light/dark`
- Border: `border-primary/10`
- Rounded: xl
- Shadow: `soft-glow` (see PRD-00 §4.3)
- Label: 10px uppercase bold `primary/60`
- Value: 3xl `font-display font-bold`

### 4.5 Kanban Board

#### 4.5.1 Column Layout
3 columns in a flexbox row with `gap-8`, minimum width 1000px with horizontal scroll on smaller screens:

| Column | Label | Status Dot | Badge Color | Background |
|--------|-------|------------|-------------|------------|
| **Duty Queue** | "Duty Queue" | `bg-slate-400` | `bg-slate-200 dark:bg-slate-800` | `bg-primary/5` border `primary/5` |
| **Active Mandates** | "Active Mandates" | `bg-primary` | `bg-primary/20 text-primary` | `bg-primary/10` border `primary/10` |
| **Accomplished Tasks** | "Accomplished Tasks" | `bg-green-500` | `bg-green-100 text-green-600` | `bg-green-500/5` border `green-500/10` |

Each column header shows: status dot + title + count badge.

#### 4.5.2 Duty Card — Queue Column
- **Paper Texture Card** (see PRD-00 §4.3): white / dark:zinc-900/80, paper-texture background, overlay blend mode
- Border: `primary/10` default, hover `primary/30`
- `cursor-grab` / `active:cursor-grabbing`
- Drag indicator: `drag_indicator` icon, visible on hover (slate-400 → primary)

**Card Content:**
1. **Category Tag** (top-left): 10px uppercase bold, rounded, tracking-tighter
   | Category | Background | Text |
   |----------|------------|------|
   | Religious Duty | `primary/10` | `primary` |
   | Maintenance | `amber-100` | `amber-800` |
   | Archival | `blue-100` | `blue-800` |
   | Social Ritual | `green-100` | `green-800` |
2. **Title**: `font-display font-bold text-base`
3. **Description**: `text-xs text-slate-500 line-clamp-2`
4. **Footer** (below border-top separator):
   - Left: calendar icon + date **OR** priority icon + urgency label
   - Right: assignee avatar circle (initials, `primary/20` background)

#### 4.5.3 Duty Card — Active Column
Same as Queue card plus:
- **Border**: `border-2 border-primary` (thicker, solid crimson)
- **"Active" ribbon**: absolute positioned top-right, `bg-primary text-white text-[8px] font-bold uppercase px-2 py-1`
- **Progress section** below description:
  - Label: "PROGRESS" + percentage (10px bold)
  - Bar: 1px tall, `bg-primary/10` track, `bg-primary` fill (width = percentage)
- **Footer**: member avatar image + name instead of initials
- **Schedule icon**: `schedule` icon (primary, sm) on right

#### 4.5.4 Duty Card — Completed Column
- Border: `green-500/20`
- Checkmark: `check_circle` icon (green-500) top-right
- Category tag: green-100 / green-800 (regardless of original category)
- Title: `text-slate-500 line-through`
- Footer: "Verified by [Name]" italic text + assignee initials (green-100 background)
- **Column opacity**: 0.7 → 1.0 on hover (entire column fades out when not focused)
- Cards have `grayscale-[0.5]` filter

#### 4.5.5 Drag-and-Drop Interaction
| Trigger | Visual Feedback |
|---------|----------------|
| Mouse down on card | Card lifts with `shadow-xl`, scale(1.02) |
| Dragging | Cursor: `grabbing`, placeholder shows in source column |
| Over target column | Column background brightens slightly (opacity increase) |
| Drop | Card animates into new position (300ms ease), API call to update status |
| Invalid drop | Card snaps back to original position (200ms) |

**Status State Machine:**
```
QUEUE ──→ ACTIVE ──→ COMPLETED
  ↑          │           │
  └──────────┘           │ (reopen by Head of House only)
  ↑                      │
  └──────────────────────┘
```
- Forward: any assigned member can drag forward
- Backward: only Head of House / Elders can revert status

### 4.6 Descendant Workload Table

#### 4.6.1 Section Header
- Icon: `groups` (primary color)
- Title: "Descendant Workload Status" — `font-display font-bold text-xl`

#### 4.6.2 Table Structure
Full-width table with rounded container, border `primary/10`, `shadow-xl`:

| Column | Width | Content |
|--------|-------|---------|
| **Descendant** | auto | Avatar (initials or image, 32px circle) + Name (bold sm) + Lineage label (10px muted) |
| **Status** | 120px | Status badge (see below) |
| **Current Duty** | auto | Duty name (italic if active) or "None Assigned" |
| **Workload Intensity** | 160px | Progress bar (max 100px) + label (Low/Medium/High/Critical) |
| **Actions** | 100px | Text link button, right-aligned |

#### 4.6.3 Table Header Style
- Background: `primary/5`
- Text: `primary`, 10px uppercase bold, `tracking-widest`
- Padding: `px-6 py-4`

#### 4.6.4 Row Interaction
- Hover: `bg-primary/5` transition
- Dividers: `divide-y divide-primary/5`

#### 4.6.5 Status Badges
| Status | Background | Text |
|--------|------------|------|
| Available | `green-100 dark:green-900/30` | `green-600` |
| On Duty | `primary/20` | `primary` |
| Overloaded | `amber-100` | `amber-800` |

#### 4.6.6 Workload Intensity Bar
- Track: `bg-primary/10`, rounded-full, 1.5px height, max 100px
- Fill: `bg-primary`, width proportional to load percentage
- Label thresholds:
  | Range | Label | Text Color |
  |-------|-------|------------|
  | 0–30% | Low | default |
  | 31–60% | Medium | default |
  | 61–80% | High | `amber-600` |
  | 81–100% | Critical | `primary` (crimson) |

#### 4.6.7 Action Links
| Member Status | Action | Behavior |
|---------------|--------|----------|
| Available | "Assign Task" | Opens duty assignment modal pre-filled with this member |
| On Duty | "Manage" | Opens duty detail panel / edit view |
| Overloaded | "Redistribute" | Opens reassignment modal |

### 4.7 New Duty Creation Modal

Triggered by "Assign New Duty" button or "Assign Task" action link.

**Modal Structure** (following PRD-00 modal pattern):
- Backdrop: dark overlay (200ms fade)
- Card: max-w-lg, paper-texture background, border `primary/10`
- Close button: top-right X icon

**Form Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Duty Title | Text input | ✅ | Max 80 characters |
| Category | Select | ✅ | Religious Duty, Maintenance, Archival, Social Ritual |
| Description | Textarea | ✅ | Max 300 characters |
| Priority | Select | ✅ | Low, Medium, High, Urgent |
| Assign To | Member select (searchable) | Optional | Pre-filled if triggered from workload table |
| Due Date | Date picker | Optional | Solar date with lunar preview |
| Linked Ritual | Select | Optional | Dropdown of upcoming ritual events from PRD-04 calendar |

**Submit Button:** "Create Mandate" — gold shimmer style (PRD-00 §4.6)

---

## 5. Module-Specific Tech Stack

> Full stack defined in [PRD-00 §5](PRD-00-global-design-system.md). This section covers module-specific dependencies.

| Feature | Technology | Notes |
|---------|-----------|-------|
| **Drag-and-Drop** | `@dnd-kit/core` + `@dnd-kit/sortable` | React-native DnD, accessible, supports touch |
| **Kanban State** | React state + optimistic updates | Immediate UI update → API PATCH in background |
| **Workload Calculation** | Server-side aggregation | PostgreSQL query joining duties × members |
| **Real-time Updates** | WebSocket or Server-Sent Events (SSE) | When another user moves a card, all clients update |
| **Statistics** | Computed from duty data | Efficiency = (completed on-time / total completed) × 100 |

### 5.1 Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/duties` | List all duties (filterable by status, category, assignee) |
| POST | `/api/duties` | Create new duty |
| PATCH | `/api/duties/:id` | Update duty (status, progress, assignment) |
| DELETE | `/api/duties/:id` | Delete duty (Head of House only) |
| GET | `/api/duties/stats` | Overview statistics (counts, efficiency, trends) |
| GET | `/api/members/workload` | Workload intensity per member |
| POST | `/api/duties/:id/verify` | Certify duty as verified (Head of House only) |

---

## 6. Interaction Logic

### 6.1 Page Load Sequence
1. Sidebar renders immediately (static nav)
2. Header renders with notification count from cache
3. Statistics cards show skeleton shimmer → API fetch → populate
4. Kanban columns render skeleton cards → API fetch `/api/duties` → populate by status
5. Workload table renders skeleton rows → API fetch `/api/members/workload` → populate

### 6.2 Drag-and-Drop Flow
1. User presses and holds a card → card lifts (shadow + scale)
2. User drags over target column → column highlights
3. User drops → optimistic update: card moves instantly in UI
4. Background: PATCH `/api/duties/:id` with new status
5. Success → no visible change (already updated)
6. Failure → card snaps back to original column + error toast

### 6.3 Create New Duty Flow
1. User clicks "Assign New Duty" (header) or "Assign Task" (workload table)
2. Modal fades in with form
3. If triggered from workload table → "Assign To" field pre-populated
4. User fills form → clicks "Create Mandate"
5. POST `/api/duties` → on success: modal closes, new card appears in "Duty Queue" column with slide-in animation
6. Statistics cards update (Total Duties count increments)

### 6.4 Duty Verification Flow
1. Duty reaches "Accomplished Tasks" column via drag-and-drop
2. Card shows in completed state (strikethrough, green check)
3. Head of House clicks "Verify" on the card
4. POST `/api/duties/:id/verify` → card updates with "Verified by [Name]" attribution
5. Card becomes locked (no further drag-and-drop)

### 6.5 Search & Filter
- Search icon in header expands to full search bar on click
- Search filters duty cards by title, description, assignee name
- Category filter: optional toggle pills above Kanban board (Religious | Maintenance | Archival | Social | All)
- Results update in real-time as user types (debounced 300ms)

### 6.6 Notification Handling
- "3 Pending Requests" badge updates via WebSocket/SSE
- Clicking notification badge opens a dropdown with pending duty requests:
  - New duty assignments awaiting acceptance
  - Duties approaching due date
  - Completion verification requests

---

## 7. Definition of Done (DoD)

### Overview Statistics
- [ ] 4 statistics cards render with correct live data from API
- [ ] Efficiency rating shows percentage with correct trend arrow and color
- [ ] Descendant workload card shows stacked avatars and count
- [ ] All cards use skeleton loading state before data arrives

### Kanban Board
- [ ] 3 columns render with correct headers, status dots, and count badges
- [ ] Duty Queue cards display: category tag, title, description (clamp-2), date/priority, assignee initials
- [ ] Active Mandates cards display: "Active" ribbon, progress bar with percentage, assignee name + avatar
- [ ] Accomplished Tasks cards display: green checkmark, strikethrough title, verification attribution
- [ ] Cards are draggable between columns using @dnd-kit
- [ ] Drag-and-drop updates duty status via API with optimistic UI
- [ ] Backward drag (Completed → Active, Active → Queue) restricted to Head of House / Elders
- [ ] Completed column has 0.7 opacity that increases on hover
- [ ] Completed cards have grayscale-[0.5] filter
- [ ] Board scrolls horizontally when viewport < 1000px

### Duty Creation Modal
- [ ] "Assign New Duty" opens modal with all form fields
- [ ] Category dropdown includes all 4 categories with correct colors
- [ ] "Assign To" is pre-populated when triggered from workload table
- [ ] "Linked Ritual" dropdown fetches upcoming rituals from calendar API
- [ ] Form validation prevents submission without required fields
- [ ] Successful creation adds card to Duty Queue with animation
- [ ] Modal follows PRD-00 modal open/close animation pattern

### Descendant Workload Table
- [ ] Table renders all family members with avatar, name, lineage
- [ ] Status badges show correct state (Available / On Duty / Overloaded)
- [ ] Workload intensity bar width matches calculated load percentage
- [ ] Intensity label text changes at correct thresholds (Low/Medium/High/Critical)
- [ ] Critical workload shows crimson text color
- [ ] "Assign Task" link opens duty creation modal pre-filled with member
- [ ] "Manage" link navigates to duty detail view for on-duty members
- [ ] Row hover highlights with primary/5 transition

### Sidebar & Navigation
- [ ] Sidebar renders two sections: Core Lineage and Governance
- [ ] "Duty Delegation" shows active state (primary/20 bg, 3px left border)
- [ ] All sidebar links navigate to correct routes
- [ ] User panel shows current user avatar, name, and role
- [ ] Settings gear icon opens settings page

### Cross-Cutting
- [ ] Page is responsive: sidebar collapses on tablet, grid stacks on mobile
- [ ] Drag-and-drop works on touch devices with long-press to initiate
- [ ] All statistics refresh when duties are created, moved, or deleted
- [ ] Notification badge updates in real-time (WebSocket/SSE)
- [ ] Search filters cards by title, description, and assignee name
- [ ] Keyboard accessible: Tab through cards, Enter to open detail, Arrow keys in Kanban
- [ ] ARIA labels on all icon-only buttons and drag handles
- [ ] Page loads interactive within 3.5s on 4G (as per PRD-00 performance budget)

---

## 8. API & Data Dependencies

| Data | Endpoint | Notes |
|------|----------|-------|
| All duties | `GET /api/duties` | Filterable by status, category, assignee, linked_ritual_id |
| Create duty | `POST /api/duties` | Requires: title, category, description, priority |
| Update duty | `PATCH /api/duties/:id` | Partial update: status, progress, assignee |
| Delete duty | `DELETE /api/duties/:id` | Head of House only, soft delete |
| Verify duty | `POST /api/duties/:id/verify` | Sets verifiedBy field, locks duty |
| Statistics | `GET /api/duties/stats` | Returns counts, efficiency %, trend data |
| Member workload | `GET /api/members/workload` | Returns per-member: status, current_duty, load_percentage |
| Ritual events | `GET /api/rituals` | For "Linked Ritual" dropdown in creation modal |
| Notifications | WebSocket `/ws/duties` | Real-time duty assignment, approaching due dates |

### Data Model Reference
See [PRD-00 §7.3 — FamilyDuty](PRD-00-global-design-system.md) for the TypeScript interface.
