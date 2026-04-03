# PRD-04.1: Heritage Cloud — Unified Ritual & Task Hub Enhancement

> **Global Design Reference:** See [PRD-00-global-design-system.md](PRD-00-global-design-system.md) for shared color palette, typography, components, tech stack, interaction patterns, and data models.
> **Enhancement of:** [PRD-04 — Ritual Calendar](PRD-04-ritual-calendar.md) & [PRD-05 — Family Duty Management](PRD-05-family-duty-management.md)

## 1. Overview

This enhancement merges the **Ritual Calendar** (`/rituals`) and **Family Duty Kanban Board** (`/duties`) into a single unified page — the **Ritual & Task Hub** — accessible via tab navigation. Currently these are two separate page routes, requiring users to navigate back and forth. By combining them, we reduce navigation friction, improve task discoverability from the calendar context, and provide a more cohesive workflow.

Additionally, this enhancement introduces:

- **Interactive calendar cells** with inline task rows and quick-add capability
- **User avatar display** for assigners/assignees on the Kanban board
- **Elder-friendly UX improvements** (larger touch targets, simplified flows, better readability)
- **Custom-styled scrollbars** conforming to the Heritage Cloud design system

**Product Name:** Heritage Cloud (Gia Phả Việt)
**Module:** Unified Ritual & Task Hub
**Priority:** P1 — Enhancement
**Current Routes:** `/rituals` (Calendar), `/duties` (Kanban)
**New Route:** `/rituals` (single page, tabbed: Lịch Cúng Kỵ | Quản Lý Bổn Phận)
**Related PRDs:**

- [PRD-00 — Global Design System](PRD-00-global-design-system.md)
- [PRD-04 — Ritual Calendar](PRD-04-ritual-calendar.md)
- [PRD-05 — Family Duty Management](PRD-05-family-duty-management.md)

---

## 2. Goals & Objectives

### 2.1 Primary Goals

| #   | Goal                                                        | Success Metric                                                       |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| G1  | **Merge 2 pages into 1** with tab navigation                | Single route `/rituals`, zero page-reload tab switch                 |
| G2  | **Calendar cells show tasks inline** as compact rows        | Each cell shows up to 3 tasks; click reveals full list in side panel |
| G3  | **Quick-add ritual/task from any day cell**                 | "+" button on each cell → pre-filled modal                           |
| G4  | **Kanban shows user avatars** for assigner & assignee       | Avatar circles replace plain text names                              |
| G5  | **Custom scrollbar styling** across all scrollable sections | Scrollbars match Heritage Cloud dark/gold aesthetic                  |
| G6  | **Elder-friendly UX**                                       | Larger fonts, clearer CTAs, simplified interactions                  |

### 2.2 Non-Goals (Out of Scope)

- No changes to the underlying API contracts (PRD-04 & PRD-05 APIs unchanged)
- No drag-and-drop from calendar cells to Kanban columns (future)
- No real-time collaborative editing (WebSocket — future)

---

## 3. Target Users

| Role                                        | Enhanced Capabilities                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| **Head of House (Trưởng tộc)**              | Single hub view for all governance; quick-add tasks from calendar        |
| **Elders (Bậc trưởng)**                     | Easier overview of upcoming rituals + their assigned duties; larger text |
| **Heirs / Members (Con cháu)**              | See tasks inline on calendar dates; one-tap access to duty board         |
| **Youth (Thanh niên)**                      | Visual avatars make it clear who assigned what                           |
| **Elderly family members (Người cao tuổi)** | Enlarged touch targets, high-contrast badges, simplified navigation      |

---

## 4. Feature Requirements

### 4.1 Unified Page Layout with Tab Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│  Page Header: "Quản Lý Nghi Lễ & Bổn Phận"                        │
│  ┌──────────────────────┬──────────────────────┐                    │
│  │  📅 Lịch Cúng Kỵ    │  📋 Quản Lý Bổn Phận  │  ← Tab bar       │
│  └──────────────────────┴──────────────────────┘                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Tab Content Area (Calendar OR Kanban based on active tab)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.1.1 Tab Bar Design

- **Position:** Below page header, full-width
- **Style:** Two tabs, styled as heritage-themed segmented control
- **Tab Item:**
  - Inactive: `bg-transparent`, `text-antique-gold/50`, `border-b-2 border-transparent`
  - Active: `text-gold-leaf`, `border-b-2 border-imperial-crimson`, glow effect
  - Icon: Material Symbols (📅 `calendar_month` / 📋 `assignment`) left of text
  - Text: `font-header`, `text-sm`, `tracking-widest`, `uppercase`
  - Padding: `px-8 py-3` (generous for elderly users)
- **Transition:** Content crossfade 200ms (no page reload, React state switch)
- **URL Hash:** Tab state preserved via URL hash (`#calendar` / `#tasks`) for shareable links
- **Tab Counter Badge:** Show count of pending tasks next to "Quản Lý Bổn Phận" tab

#### 4.1.2 Tab Content Areas

| Tab                  | Content                               | Existing Component                    |
| -------------------- | ------------------------------------- | ------------------------------------- |
| **Lịch Cúng Kỵ**     | Enhanced Calendar Grid + Right Panel  | `RitualCalendarClient.tsx` (enhanced) |
| **Quản Lý Bổn Phận** | Stats + Kanban Board + Workload Table | `DutyKanbanClient.tsx` (enhanced)     |

### 4.2 Enhanced Calendar Grid — Interactive Day Cells

#### 4.2.1 Day Cell with Inline Task Rows

Each calendar cell (min-height increased to `100px` from `80px`) now contains:

```
┌──────────────────────────┐
│  15          十五          │  ← Solar (left) + Lunar (right)
│ ┌──────────────────────┐ │
│ │ 🔴 Giỗ Ông Nguyễn    │ │  ← Task row 1 (compact, truncated)
│ │ 🟡 Dọn mộ phần       │ │  ← Task row 2
│ │ +1 more               │ │  ← Overflow indicator
│ └──────────────────────┘ │
│                    [ + ] │  ← Quick-add button (bottom-right)
└──────────────────────────┘
```

- **Task rows:** Each displayed as a single-line row inside the cell
  - Max **3 rows** visible per cell; overflow shows "+N more"
  - Left color dot indicating category/priority:
    - 🔴 Religious/Urgent → `imperial-crimson`
    - 🟡 Maintenance/High → `amber-500`
    - 🔵 Archival → `blue-500`
    - 🟢 Social/Completed → `emerald-500`
  - Title: `text-[10px]`, `font-sans`, single-line `truncate`
  - Certified tasks: strikethrough + green dot instead of category color
- **Hover state:** Cell lifts slightly (`shadow-md`), "+ " button fades in
- **Cell background states:**
  - Default current month: `bg-lacquer-dark/40`
  - Has ritual/memorial: Gold-tinged gradient (existing behavior preserved)
  - Selected day: `bg-imperial-crimson/15`, `border-imperial-crimson/30`
  - Today: crimson circle on date number (existing behavior preserved)
  - Previous/next month overflow: `opacity-20`, non-interactive

#### 4.2.2 Quick-Add Button on Cell

- **Position:** Bottom-right corner of each current-month cell
- **Appearance:** Small circle (`w-5 h-5`), `bg-imperial-crimson/60`, `text-parchment`
- **Visibility:** Hidden by default, appears on cell hover (fade-in 150ms)
- **Always visible on mobile** (no hover state on touch devices)
- **Click action:** Opens the Add Ritual/Task modal with `dateSolar` pre-filled to that cell's date
- **Elderly enhancement:** On touch devices, button is always visible and larger (`w-7 h-7`)

#### 4.2.3 Cell Click → Right Panel Population

- **Click on a day cell** (not the quick-add button):
  - Sets `selectedDay` state
  - Right side panel populates with **all tasks/rituals for that day**
  - If no tasks: panel shows "Không có nghi lễ ngày này" with a prominent "Thêm Nghi Lễ" CTA

### 4.3 Enhanced Right Side Panel

When a day cell is clicked, the right panel shows task cards:

```
┌────────────────────────────────────┐
│  15/03/2026                 [ + ] │  ← Date header + Add button
│  Thứ Bảy · 十五 tháng 2 Âm       │  ← Day name + Lunar date
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🔥 GIỖ ÔNG NGUYỄN VĂN A    │  │  ← Ritual Card (expanded)
│  │ Ngày giỗ hàng năm           │  │
│  │ Âm lịch: 15 tháng 2         │  │
│  │ ↻ Hàng Năm                  │  │
│  │ ✓ Đã xác nhận               │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ DỌN DẸP MỘ PHẦN            │  │  ← Duty Card
│  │ MEDIUM · MAINTENANCE         │  │
│  │ → Nguyễn Văn Bình           │  │
│  │ Tiến độ: ████████░░░ 75%    │  │
│  └──────────────────────────────┘  │
│                                    │
│  Không chọn ngày: hiện danh sách  │
│  tháng này                        │
└────────────────────────────────────┘
```

- **Panel width:** `320px` (lg breakpoint), full-width bottom sheet on mobile
- **Merged content:** Shows BOTH rituals AND duties for the selected date
- **Card types:**
  - **Ritual cards:** Existing `RitualCard` with ancestor name, lunar date, certification status
  - **Duty cards:** Category badge, priority badge, assignee name, progress bar
- **Empty state:** Centered message + large "Thêm" button (elder-friendly, 48px height)

### 4.4 Kanban Board — User Avatar Enhancement

#### 4.4.1 Assigner Avatar

On each duty card in the Kanban board:

- **Assigner label:** "Giao bởi:" + avatar circle + name
  - Avatar: `w-6 h-6` circle, `border border-antique-gold/30`
  - If `avatarUrl` exists: show image, `object-cover`, `rounded-full`
  - If no avatar: show initials in `bg-imperial-crimson/20`, `text-parchment/70`, `font-header text-[10px]`
  - Name: `text-xs`, `text-parchment/50`, next to avatar

#### 4.4.2 Assignee Avatar (enhanced from current text-only)

Replace the current `→ {duty.assignee.fullName}` text display:

- **Avatar row:** Avatar circle (`w-6 h-6`) + name
  - Same avatar treatment as assigner
  - Label: "→" arrow prefix removed, replaced with avatar + name inline
  - **Deceased member treatment:** Grayscale filter on avatar (per PRD-00 §4.9)

#### 4.4.3 Avatar Stack on Stats Card

- "Descendant Workload" stat card: Show stacked mini avatars (`w-5 h-5`, overlap `-ml-1.5`)
- Max 4 avatars shown, then "+N" badge

### 4.5 Custom Scrollbar Styling

#### 4.5.1 Global Scrollbar Theme

All scrollable areas within the Ritual & Task Hub page must use Heritage Cloud themed scrollbars:

```css
/* Heritage Cloud Scrollbar */
.heritage-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.heritage-scroll::-webkit-scrollbar-track {
  background: rgba(26, 8, 8, 0.4); /* lacquer-dark/40 */
  border-radius: 3px;
}
.heritage-scroll::-webkit-scrollbar-thumb {
  background: rgba(197, 160, 89, 0.3); /* antique-gold/30 */
  border-radius: 3px;
  border: 1px solid rgba(197, 160, 89, 0.1);
}
.heritage-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(197, 160, 89, 0.5); /* antique-gold/50 */
}
/* Firefox */
.heritage-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(197, 160, 89, 0.3) rgba(26, 8, 8, 0.4);
}
```

#### 4.5.2 Applied Scrollable Areas

| Area                        | Scroll Direction | Current Issue                                                            |
| --------------------------- | ---------------- | ------------------------------------------------------------------------ |
| Kanban column cards         | Vertical         | Browser default scrollbar (visible in screenshot — thick white/gray bar) |
| Right side panel (calendar) | Vertical         | Standard scrollbar, doesn't match dark theme                             |
| Kanban board horizontal     | Horizontal       | No visible scrollbar but could benefit from themed one                   |
| Workload table              | Vertical         | Defaults on overflow                                                     |
| Calendar grid (mobile)      | Vertical         | Needs consideration                                                      |

### 4.6 Elder-Friendly UX Enhancements

#### 4.6.1 Typography & Readability

| Element             | Current          | Enhanced                                                 |
| ------------------- | ---------------- | -------------------------------------------------------- |
| Tab labels          | `text-xs`        | `text-sm` (14px), bold                                   |
| Calendar day number | `text-xs` (10px) | `text-sm` (14px), `font-bold`                            |
| Task row in cell    | N/A              | `text-[11px]` minimum, not `text-[10px]` for readability |
| Panel card title    | `text-sm`        | `text-base` (16px)                                       |
| Button text         | `text-xs`        | `text-sm` with `font-bold`                               |
| Badge text          | `text-[10px]`    | `text-xs` (12px) minimum                                 |

#### 4.6.2 Touch Target Enhancement

- **Minimum touch target:** 44×44px for ALL interactive elements (WCAG)
- **Calendar cells:** min-height `100px` (up from `80px`)
- **Quick-add button on mobile:** `w-8 h-8` (up from `w-5 h-5`)
- **Tab items:** `py-4 px-8` (generous padding)
- **Kanban card action buttons:** `py-2.5` minimum height
- **Verify/Confirm buttons:** Full-width, `py-3`, bold text

#### 4.6.3 Visual Clarity for Status

Enhanced status indicators for elderly users:
| Status | Visual | Enhancement |
|--------|--------|-------------|
| Certified/Verified | Small ✓ | Large `✓ ĐÃ XÁC NHẬN` text banner (green, bold) |
| Overdue | Subtle text | Pulsing `⚠ QUÁ HẠN` badge with crimson glow |
| Active | "Active" ribbon | Full-width amber bar with "ĐANG THỰC HIỆN" text |
| Pending | No indicator | Subtle "CHỜ XỬ LÝ" label |

#### 4.6.4 Simplified Add Flow

- When clicking "+" on a cell or "Thêm" button:
  - **Title field gets keyboard focus** immediately
  - Date is auto-filled (from selected cell)
  - "Lặp lại hàng năm" checkbox is pre-checked (most rituals are annual)
  - Modal has **larger font sizes** for all labels and inputs
  - Submit button: large, full-width, high-contrast lacquer style

#### 4.6.5 Contextual Help Tooltips

- Hover on tab: shows brief description in tooltip
  - "Lịch Cúng Kỵ": "Xem lịch nghi lễ và giỗ tổ theo tháng"
  - "Quản Lý Bổn Phận": "Theo dõi và phân công nhiệm vụ gia tộc"
- First-time visit: Optional brief walkthrough overlay explaining the 2 tabs

#### 4.6.6 High-Contrast Mode Consideration

- All text must meet **WCAG AA 4.5:1** contrast ratio
- Badges and labels: Ensure minimum contrast against dark backgrounds
- Gold text (#C5A059) on dark (#230f0f): Contrast ratio ≈ 5.2:1 ✅
- Muted text at `/30` or `/40` opacity: Must increase to `/50` minimum for readability

---

## 5. Interaction Logic

### 5.1 Page Load Sequence

1. Route loads `/rituals` — page component renders
2. Tab bar renders with "Lịch Cúng Kỵ" as default active tab
3. Check URL hash: if `#tasks`, switch to Kanban tab
4. **Calendar tab:** Load current month's rituals + duties via existing APIs
5. **Task tab (lazy):** Data only fetched when tab is first activated (avoid unnecessary API calls)
6. Both tabs share the same `mutate()` refresh — creating a ritual from calendar also updates Kanban

### 5.2 Tab Switch Flow

1. User clicks inactive tab
2. Active tab underline slides to new tab (200ms ease)
3. Content crossfades (outgoing: opacity 1→0, incoming: opacity 0→1, 200ms)
4. URL hash updates without page navigation (`window.history.replaceState`)
5. If switching from Calendar → Tasks: Kanban data fetches (if first time) or shows cached
6. If switching from Tasks → Calendar: Calendar shows last selected month

### 5.3 Calendar Cell Click Flow

1. User clicks a day cell
2. Cell gets selected state (`bg-imperial-crimson/15`)
3. Previously selected cell loses selected state
4. Right panel updates with tasks/rituals for that day
5. If clicking the same cell again: deselect (panel shows month overview)

### 5.4 Quick-Add from Cell Flow

1. User hovers over a day cell → "+" button fades in (bottom-right)
2. User clicks "+" button
3. Add Ritual modal opens with `dateSolar` pre-filled to that cell's date
4. User fills title (minimum required) → submits
5. Modal closes → cell updates with new task row → side panel refreshes
6. If user was on Kanban tab before, switching back shows the new item

### 5.5 Kanban Card Avatar Interaction

1. Kanban card renders with assignee avatar
2. Hover on avatar: tooltip shows full name + role
3. Click on avatar: (future) navigate to member profile

### 5.6 Responsive Behavior

| Viewport            | Tab Bar                                   | Calendar Tab                                           | Task Tab                              |
| ------------------- | ----------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| Desktop (≥1024px)   | Full-width horizontal tabs                | Calendar grid + right panel (320px)                    | Stats + Kanban + Workload             |
| Tablet (768–1023px) | Full-width tabs, slightly smaller padding | Calendar grid only, panel → bottom sheet on cell click | Stats + Kanban (horizontal scroll)    |
| Mobile (<768px)     | Full-width tabs, stacked icons+text       | Compact calendar, panel → full-screen overlay          | Stats stacked, Kanban vertical scroll |

---

## 6. Definition of Done (DoD)

### Tab Navigation

- [ ] Single `/rituals` page with 2 tabs: "Lịch Cúng Kỵ" and "Quản Lý Bổn Phận"
- [ ] Tab switch transitions smoothly (crossfade, no page reload)
- [ ] URL hash updates on tab switch (`#calendar` / `#tasks`)
- [ ] Page loads with correct tab based on URL hash
- [ ] Tab counter badge shows pending task count on duty tab
- [ ] `/duties` route redirects to `/rituals#tasks` (backward compatibility)

### Enhanced Calendar Cells

- [ ] Day cells show up to 3 task rows with color-coded dots
- [ ] Overflow "+N more" indicator when >3 tasks
- [ ] Quick-add "+" button appears on cell hover (desktop)
- [ ] Quick-add button always visible on mobile/touch
- [ ] Clicking "+" opens Add Modal with date pre-filled
- [ ] Cell click selects day and populates right panel with ALL tasks + rituals
- [ ] Right panel shows both rituals AND duties for selected day

### Kanban User Avatars

- [ ] Assignee shown as avatar circle + name (replaces text-only)
- [ ] Assigner shown with "Giao bởi:" label + avatar + name
- [ ] Avatar fallback: initials circle when no `avatarUrl`
- [ ] Deceased member avatars have grayscale filter
- [ ] Avatar tooltip shows full name on hover

### Custom Scrollbars

- [ ] Kanban columns use heritage-themed thin scrollbar
- [ ] Right panel uses heritage-themed scrollbar
- [ ] Scrollbar matches on both Webkit (Chrome/Safari) and Firefox
- [ ] No thick white/gray scrollbar visible anywhere on the page

### Elder-Friendly UX

- [ ] All touch targets minimum 44×44px
- [ ] Calendar cells minimum 100px height
- [ ] Font sizes increased per specification (§4.6.1)
- [ ] Status badges are clearly readable with high-contrast text
- [ ] Verify/Confirm buttons are full-width and prominent
- [ ] Add modal labels and inputs use larger font sizes
- [ ] All text meets WCAG AA 4.5:1 contrast ratio

### Cross-Cutting

- [ ] Creating a ritual from calendar tab also reflects in Kanban tab (shared mutate)
- [ ] Responsive: tabs work on mobile, tablet, desktop
- [ ] Keyboard navigation: Tab to switch tabs, Arrow keys in calendar, Enter to select
- [ ] ARIA: tabs have `role="tablist"` / `role="tab"` / `role="tabpanel"`
- [ ] Performance: tab switch < 100ms, calendar render < 500ms
- [ ] No console errors or warnings

---

## 7. API & Data Dependencies

> **No new API endpoints required.** This enhancement uses existing endpoints from PRD-04 and PRD-05.

| Data                  | Endpoint                                 | Used By                        |
| --------------------- | ---------------------------------------- | ------------------------------ |
| Ritual events (month) | `GET /api/v1/rituals?year=YYYY&month=MM` | Calendar tab — cell population |
| Create ritual         | `POST /api/v1/rituals`                   | Quick-add from calendar cell   |
| Duties list           | `GET /api/v1/duties?limit=200`           | Kanban tab — board population  |
| Duty stats            | `GET /api/v1/duties/stats`               | Kanban tab — stats header      |
| Member workload       | `GET /api/v1/members/workload`           | Kanban tab — workload table    |
| Create duty           | `POST /api/v1/duties`                    | Add duty modal                 |
| Update duty status    | `PATCH /api/v1/duties/:id`               | Kanban drag-and-drop           |
| Verify duty           | `POST /api/v1/duties/:id/verify`         | Kanban — verify button         |

### Data Model Reference

No schema changes. See:

- [PRD-00 §7.2 — RitualEvent](PRD-00-global-design-system.md)
- [PRD-00 §7.3 — FamilyDuty](PRD-00-global-design-system.md)

---

## 8. Design Reference: Current State vs. Enhanced

### 8.1 Current Issues (from screenshot analysis)

1. **Kanban scrollbar:** Browser default thick scrollbar (white/gray) breaks the dark lacquer aesthetic
2. **Assignee display:** Text-only `→ Nguyễn Văn Bình` — no avatar, hard to distinguish at a glance
3. **Two separate pages:** Users must navigate between `/rituals` and `/duties` — lost context
4. **Calendar cells:** Show task titles but no quick-add capability; min-height 80px is cramped
5. **Mobile duty cards:** No visual hierarchy for who assigned vs. who is assigned

### 8.2 Key Design Decisions

- **Tab instead of sidebar nav:** Reduces complexity, works better on mobile, familiar pattern for elderly users
- **Calendar tasks as rows (not badges):** More scannable than colored dots alone; shows title text
- **Right panel for task list (not popup):** Keeps calendar visible while browsing tasks; spatial context preserved
- **Avatars on Kanban:** Humanizes the task board; elderly users recognize faces faster than names
- **Thin gold scrollbar:** Subtle, matches lacquer aesthetic, doesn't steal visual attention
