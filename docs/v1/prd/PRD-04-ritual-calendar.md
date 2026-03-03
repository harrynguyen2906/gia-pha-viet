# PRD-04: Heritage Cloud — Ancestral Ritual Calendar

> **Global Design Reference:** See [PRD-00-global-design-system.md](PRD-00-global-design-system.md) for shared color palette, typography, components, tech stack, interaction patterns, and data models.

## 1. Overview

The **Ancestral Ritual Calendar** (Lịch Lễ Tổ tiên) provides a monthly calendar view synchronized with both solar (Gregorian) and lunar (Vietnamese) dates. It highlights memorial anniversaries (Giỗ) with distinctive gold-silk visual treatment, shows lunar events (New Moon, Full Moon), and opens a detail side panel with ritual instructions and duty checklists for each observance. This module generates duties that feed into the [Family Duty Management board (PRD-05)](PRD-05-family-duty-management.md).

**Product Name:** Heritage Cloud  
**Module:** Ancestral Ritual Calendar  
**Priority:** P0 — Core Feature  
**UI Reference:** [docs/ui/6.ritualcalendar.html](../ui/6.ritualcalendar.html)  
**Related PRDs:**
- [PRD-00 — Global Design System](PRD-00-global-design-system.md) (design tokens, tech stack, shared patterns)
- [PRD-05 — Family Duty Management](PRD-05-family-duty-management.md) (Kanban board consuming ritual duties)

---

## 2. Goals & Objectives

- Provide a monthly calendar view synchronized with both solar (Gregorian) and lunar (Vietnamese/Chinese) dates
- Highlight memorial days (Giỗ) and ritual observances with a distinctive gold-silk visual treatment
- Display detailed ritual instructions for each observance (incense type, food offerings, prayers)
- Show a duty checklist tied to each ritual, linking to the duty management board (PRD-05)
- Certify ritual completion with accountability attribution
- Support lunar event markers (New Moon, Full Moon, lunar zodiac era)

---

## 3. Target Users

| Role | Permissions |
|------|-------------|
| **Head of House (Trưởng tộc)** | Full CRUD on ritual events, certify completion, assign duties from calendar |
| **Elders (Bậc trưởng)** | Create rituals within their branch, assign duties to heirs/youth |
| **Heirs / Members (Con cháu)** | View calendar, see assigned duties, mark personal duties complete |
| **Youth (Thanh niên)** | View calendar and assigned duties |
| **Guest** | View-only calendar (no duties visible) |

---

## 4. Feature Requirements

### 4.1 Page Layout

```
┌──────────────┬──────────────────────────────┬────────────────────┐
│  Sidebar      │         Calendar Grid         │  Detail Panel      │
│  (256px)      │    7-column monthly view      │  (384px)           │
│               │   with solar + lunar dates    │  Ritual info +     │
│  Nav links    │                               │  duty checklist    │
│  Next event   │                               │                    │
│  Lunar era    │                               │                    │
└──────────────┴──────────────────────────────┴────────────────────┘
```

### 4.2 Calendar Header

- Title: "Ancestral Ritual Calendar" in `font-display font-bold`
- Subtitle: explanatory text about solar/lunar synchronization
- **Month Navigation:**
  - Left arrow + Right arrow buttons
  - Center: "April 2024 / 3rd Lunar Month" (dynamic)
  - Click arrows to navigate months; lunar month label updates alongside solar

### 4.3 Calendar Grid (Monthly View)

#### 4.3.1 Day Header Row
- 7 columns: Sunday through Saturday
- Background: `aged-silk` (#FFF8DC)
- Text: `charcoal` (#1a1a1a), uppercase, bold, small

#### 4.3.2 Day Cell
Each cell represents one day with a minimum height of 140px:
- **Solar date**: large bold number (top-left)
- **Lunar date**: small italic text (top-right corner)
- Grid gap: 1px
- Background: `aged-silk` (#FFF8DC)
- Right border: `charcoal/5` hairline

#### 4.3.3 Memorial Day Cell (Gold Silk Treatment)
Cells containing a memorial/ritual event receive a distinctive gold treatment:
- **Background gradient**: `linear-gradient(135deg, #E6BE8A, #D4AF37, #B8860B)`
- **Silk texture overlay**: 20% opacity with `background-blend-mode: overlay`
- **Inner ring**: 2px inset `ring-primary` (crimson)
- **Content**:
  - "Anniversary" label badge (small, bold)
  - Ancestor name
  - Observance title
  - Fire icon (`local_fire_department`)
- **Text color**: `background-dark` (dark on gold)
- **Inner shadow** for depth
- Visually distinct from all other cells

#### 4.3.4 Lunar Event Markers
- Cells with lunar events (New Moon, Full Moon) show:
  - Crimson left border accent (3px)
  - Event label in small text
  - Short description (e.g., "Silent Prayer Duty")

#### 4.3.5 Current Day Indicator
- White background (overrides aged-silk)
- Elevated shadow (xl)
- Slight scale: 1.02
- Date number inside crimson circle
- "No rituals scheduled" placeholder text if empty

#### 4.3.6 Previous Month Overflow
- Trailing days of the previous month fill the first row
- Same `aged-silk` background at 90% opacity
- `charcoal` text at 40% opacity
- Non-interactive (no click)

### 4.4 Ritual Detail Side Panel (Right)

Sliding panel (384px wide) that populates when a memorial day cell is clicked.

#### 4.4.1 Panel Header
- Small label: "Selected Date Detail" + formatted date
- Event title: `font-display text-2xl font-bold`
- Event description: italic serif text

#### 4.4.2 Ritual Instructions Section
Structured instruction cards, each with:
- **Icon** (Material Symbols): e.g., `potted_plant`, `restaurant`
- **Title**: instruction category name (bold)
- **Description**: detailed procedural text

**Standard Instruction Categories:**
| Category | Icon | Example Content |
|----------|------|----------------|
| Incense & Fire | `potted_plant` | Type of incense, lighting method, duration |
| Food Offerings | `restaurant` | Specific dishes, quantities, symbolic meaning |
| Prayer Recitation | `auto_stories` | Which prayers, order, who leads |
| Dress Code | `checkroom` | Traditional attire requirements |
| Timing | `schedule` | Start time, duration, preparation window |

#### 4.4.3 Family Duties Checklist
A list of duties assigned for the selected ritual:
- Each duty row shows:
  - **Checkbox icon**: `check_circle` (green, done) or `radio_button_unchecked` (pending)
  - **Duty description** text
  - **Assigned group badge**: 
    - "ELDERS" — crimson background
    - "HEIRS" — slate background
    - "YOUTH" — slate background
- Clicking a checkbox toggles completion status → PATCH to duty API
- Duties also appear in the Kanban board (PRD-05)

#### 4.4.4 Certify Completion Button
- Full-width button at panel bottom
- Background: `primary` (crimson)
- Icon: `history_edu`
- Text: "Certify Completion" — uppercase, bold
- **Access**: Only Head of House or the duty assigner
- **Action**: Locks all duties for this ritual as certified, records verifier name
- Disabled state when all duties not yet complete

### 4.5 Sidebar Navigation (Left)

#### 4.5.1 Navigation Links
| Icon | Label | State |
|------|-------|-------|
| `dashboard` | Dashboard | Default |
| `calendar_month` | Ritual Calendar | **Active** |
| `assignment` | Family Duties | Default (links to PRD-05) |
| `menu_book` | Offering Guides | Default |

Active state: `bg-primary/20`, white text, `border-left: 3px solid primary`

#### 4.5.2 Next Observance Widget
Below navigation links:
- Card showing the next upcoming memorial day
- Ancestor name (bold)
- Countdown: "In 3 Days" / "Tomorrow" / "Today"
- Crimson accent indicator

#### 4.5.3 Current Lunar Era Label
- Bottom of sidebar nav area
- Display: current lunar zodiac year (e.g., "木辰 Wood Dragon 2024")
- Decorative calligraphy-style text

---

## 5. Module-Specific Tech Stack

> Full stack defined in [PRD-00 §5](PRD-00-global-design-system.md). This section covers calendar-specific dependencies.

| Feature | Technology | Notes |
|---------|-----------|-------|
| **Lunar Calendar Conversion** | `lunar-calendar` npm + custom Vietnamese rules | Solar ↔ Lunar with Vietnamese variations (Tết, Giỗ) |
| **Calendar Grid** | Custom CSS Grid (7-col) | No standard calendar lib matches the gold-silk design |
| **Date Handling** | `date-fns` or `dayjs` | Lightweight date math, month navigation, formatting |
| **Duty Checklist State** | React state + API PATCH | Toggle completion via PRD-05 duty API |
| **Notifications** | Push / in-app | "Memorial day in 3 days" reminders |

### 5.1 Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/rituals?month=YYYY-MM` | List ritual events for a given month |
| POST | `/api/rituals` | Create new ritual/memorial event |
| PATCH | `/api/rituals/:id` | Update ritual details, instructions |
| DELETE | `/api/rituals/:id` | Delete ritual (Head of House only) |
| GET | `/api/rituals/:id/instructions` | Get ritual instruction cards |
| GET | `/api/rituals/:id/duties` | Get duty checklist for a specific ritual |
| POST | `/api/rituals/:id/certify` | Certify ritual completion |
| GET | `/api/lunar/convert?solar=YYYY-MM-DD` | Solar → Lunar date conversion |

---

## 6. Interaction Logic

### 6.1 Page Load Sequence
1. Sidebar renders immediately (static navigation)
2. Calendar grid renders skeleton cells for current month
3. API call `GET /api/rituals?month=YYYY-MM` returns ritual events
4. Cells populate: memorial days get gold-silk treatment, lunar events get markers
5. API call `GET /api/lunar/convert` batches all dates for lunar display
6. Current day cell highlights
7. Detail panel remains collapsed/empty until a memorial cell is clicked

### 6.2 Month Navigation Flow
1. User clicks left/right arrow
2. Calendar grid transitions (fade 200ms)
3. New month's dates render
4. API fetches rituals for new month
5. Lunar month label updates
6. Detail panel resets to empty state

### 6.3 Memorial Day Click Flow
1. User clicks a gold-silk memorial cell
2. Detail panel slides in from right (300ms ease-out)
3. Panel header populates with date and event info
4. Ritual instructions load (may require separate API call)
5. Duty checklist loads with current completion states
6. Clicking another cell updates panel content (no close/reopen animation)

### 6.4 Duty Checkbox Toggle
1. User clicks checkbox next to a duty item
2. Optimistic UI: icon changes immediately (unchecked → checked or vice versa)
3. API: PATCH `/api/duties/:id` { isCompleted: true/false }
4. Success → no further change
5. Failure → revert icon + error toast
6. Status also reflects in PRD-05 Kanban board (via shared duty API)

### 6.5 Certify Completion
1. All duties for a ritual are marked complete
2. "Certify Completion" button becomes enabled (was disabled)
3. Head of House clicks button
4. Confirmation dialog: "Certify all duties for [Ritual Name] as complete?"
5. POST `/api/rituals/:id/certify`
6. Panel updates: button replaced with "Certified by [Name]" attribution label
7. All duty checkboxes become locked (non-interactive)

### 6.6 Create New Ritual Event
1. User clicks "+" or "Add Event" (from calendar header or empty cell)
2. Modal opens with form: title, ancestor (select), solar date, lunar date (auto-calculated), description, recurrence toggle
3. User fills form → submits
4. POST `/api/rituals` → new event created
5. Calendar cell updates with gold-silk treatment if it's a memorial day
6. Modal closes with success toast

### 6.7 Responsive Behavior
| Viewport | Calendar | Sidebar | Detail Panel |
|----------|----------|---------|-------------|
| Desktop ≥1024px | Full 7-col grid | Visible (256px) | Right panel (384px) |
| Tablet 768–1023px | Full 7-col grid | Collapsed (hamburger) | Bottom sheet |
| Mobile <768px | Compact list view or scrollable grid | Hidden | Full-screen overlay |

---

## 7. Definition of Done (DoD)

### Calendar Grid
- [ ] Monthly grid renders with correct solar dates for any month
- [ ] Lunar dates display in each cell, converted from solar
- [ ] Memorial days show gold-silk gradient with event details
- [ ] Lunar event markers (New Moon, Full Moon) display with crimson left border
- [ ] Current day highlighted with white background, crimson date circle, shadow
- [ ] Previous month overflow days show with muted 40% opacity
- [ ] Month navigation (prev/next) transitions smoothly and fetches new data
- [ ] Lunar month label updates alongside solar month

### Ritual Detail Panel
- [ ] Clicking a memorial cell opens the right panel with slide-in animation
- [ ] Panel shows correct date, event title, and description
- [ ] Ritual instructions render with icons, titles, and descriptions
- [ ] Duty checklist shows items with correct group badges (ELDERS/HEIRS/YOUTH)
- [ ] Checkbox toggling updates duty status via API with optimistic UI
- [ ] "Certify Completion" button enabled only when all duties complete
- [ ] Certification locks the ritual and shows "Certified by [Name]"
- [ ] Panel updates when a different cell is clicked (no close/reopen)

### Sidebar
- [ ] Navigation links render with correct icons
- [ ] "Ritual Calendar" shows active state
- [ ] "Family Duties" link navigates to PRD-05 Duty Management page
- [ ] Next Observance widget shows correct upcoming memorial with countdown
- [ ] Lunar era label displays correctly

### Calendar CRUD
- [ ] Create new ritual event via modal form
- [ ] Lunar date auto-calculated from solar date in form
- [ ] Edit existing ritual (title, date, instructions)
- [ ] Delete ritual (Head of House only, with confirmation)
- [ ] Recurrence toggle creates annual repeating events

### Cross-Cutting
- [ ] Responsive: sidebar collapses on tablet, detail panel becomes bottom sheet on mobile
- [ ] Keyboard navigation: arrow keys move between calendar cells, Enter opens detail
- [ ] ARIA labels on calendar cells (date + event summary for screen readers)
- [ ] Calendar renders within 500ms for months with 10+ events
- [ ] Notification reminders: 3 days, 1 day, same day before memorial events
- [ ] Duties created from calendar also appear in PRD-05 Kanban board
- [ ] All date displays match PRD-00 locale/format standards

---

## 8. API & Data Dependencies

| Data | Endpoint | Notes |
|------|----------|-------|
| Ritual events | `GET /api/rituals?month=YYYY-MM` | Paginated by month |
| Create ritual | `POST /api/rituals` | Title, ancestor, dates, recurrence |
| Update ritual | `PATCH /api/rituals/:id` | Partial update |
| Delete ritual | `DELETE /api/rituals/:id` | Soft delete, Head of House only |
| Instructions | `GET /api/rituals/:id/instructions` | Ordered list of instruction cards |
| Duty checklist | `GET /api/rituals/:id/duties` | Linked duties for that ritual |
| Certify | `POST /api/rituals/:id/certify` | Lock as certified |
| Lunar conversion | `GET /api/lunar/convert?solar=YYYY-MM-DD` | Batch supported |
| Notifications | Push / WebSocket | Upcoming memorial reminders |

### Data Model Reference
See [PRD-00 §7.2 — RitualEvent](PRD-00-global-design-system.md) for the TypeScript interface.
