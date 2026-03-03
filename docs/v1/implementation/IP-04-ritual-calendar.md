# IP-04: Ancestral Ritual Calendar

> **Phase:** 4a (song song với IP-05 Duties vì chia sẻ data)  
> **Mục tiêu:** Calendar hiển thị lịch giỗ/cúng với lunar dates, ritual detail panel, certification  
> **Depends on:** IP-00 (Foundation), Members API (IP-02 LINE-001)  
> **PRD Reference:** PRD-04-ritual-calendar.md  
> **API Reference:** `api-design.md §5 (Rituals), §5.5 (Lunar Conversion)`

---

## Task 4.1: Lunar Calendar Utility

**ID:** `RITE-001`  
**Output:** `src/lib/lunar.ts` + `src/hooks/useLunarDate.ts`

**Các bước chi tiết:**
1. Cài: `npm install lunar-calendar`
2. Tạo `src/lib/lunar.ts`:
   - `solarToLunar(date: Date)` → `{ day, month, year, lunarText, zodiac }`
   - `lunarToSolar(lunarDay, lunarMonth, lunarYear)` → `Date`
   - `getMonthLunarDates(year, month)` → array of { solar, lunar } cho mọi ngày trong tháng
   - Vietnamese formatting: "Rằm tháng Giêng", "Mùng 5 tháng 5", etc.
   - Tết detection, special day recognition
3. Tạo `src/hooks/useLunarDate.ts` — React hook wrapper
4. Tạo API route `src/app/api/v1/lunar/route.ts`:
   - `GET /api/v1/lunar/convert?solar=2026-04-15` → lunar date
   - `GET /api/v1/lunar/convert?month=2026-04` → batch conversion

**AI Prompt mẫu:**
> Tạo lunar calendar utility cho Heritage Cloud:
> 1. `src/lib/lunar.ts` — Solar↔Lunar conversion dùng `lunar-calendar` npm
>    - `solarToLunar(date)` → Vietnamese formatted lunar date
>    - `getMonthLunarDates(year, month)` → tất cả ngày trong tháng với lunar pairs
>    - Handle Vietnamese special names: "Rằm", "Mùng 1", "tháng Giêng", "tháng Chạp"
> 2. `src/hooks/useLunarDate.ts` — React hook calling lib
> 3. API route `/api/v1/lunar/convert` — solar→lunar conversion endpoint
> Tham khảo: PRD-04 §4.1, api-design.md §5.5

**DoD:**
- [ ] `solarToLunar(new Date('2026-04-15'))` trả lunar date đúng
- [ ] Vietnamese formatting đúng (tháng Giêng, tháng Chạp, Rằm, Mùng)
- [ ] `getMonthLunarDates(2026, 4)` trả 30 entries đúng
- [ ] API endpoint trả JSON response đúng
- [ ] Edge cases: tháng nhuận, năm nhuận

---

## Task 4.2: Rituals API

**ID:** `RITE-002`  
**Output:** Ritual Events CRUD + Certification API

**Các bước chi tiết:**
1. Tạo `src/app/api/v1/rituals/route.ts`:
   - `GET` — list by month (`?month=2026-04`), filters: ancestorId, upcoming
   - `POST` — create ritual (include instructions + duties inline)
   - RBAC: HEAD_OF_HOUSE, ELDER cho create
   - Từ `api-design.md §5.1, §5.2`
2. Tạo `src/app/api/v1/rituals/[id]/route.ts`:
   - `GET` — detail (include: instructions, duties, ancestor)
   - `PATCH` — update
   - `DELETE` — soft delete (HEAD_OF_HOUSE only)
3. Tạo `src/app/api/v1/rituals/[id]/certify/route.ts`:
   - `POST` — certify ritual (HEAD_OF_HOUSE only)
   - Pre-condition: all ritual_duties `isCompleted = true`
   - Side effects: set certified fields, lock duties, send notification
   - Từ `api-design.md §5.4`
4. Tạo SWR hook: `src/hooks/useRituals.ts`

**AI Prompt mẫu:**
> Tạo Rituals API cho Heritage Cloud:
> 1. `rituals/route.ts` — GET (list by month + filters) + POST (create with inline instructions + duties)
> 2. `rituals/[id]/route.ts` — GET detail + PATCH + DELETE
> 3. `rituals/[id]/certify/route.ts` — POST (certification, HEAD_OF_HOUSE only)
>    - Check ALL ritual_duties isCompleted = true trước khi cho phép certify
>    - Set isCertified, certifiedBy, certifiedAt
> RBAC: HEAD_OF_HOUSE + ELDER create/edit; HEAD_OF_HOUSE only certify/delete
> Spec: `docs/implementation/api-design.md §5`, Schema: `docs/db-design/database-schema.md`

**DoD:**
- [ ] `GET /api/v1/rituals?month=2026-04` trả events trong tháng
- [ ] `POST /api/v1/rituals` tạo ritual + instructions + duties
- [ ] `POST /api/v1/rituals/:id/certify` chỉ thành công khi all duties complete
- [ ] Certify lock ritual, trả 422 nếu duties chưa xong
- [ ] RBAC enforce đúng roles

---

## Task 4.3: Calendar Grid Component

**ID:** `RITE-003`  
**Output:** `src/components/rituals/CalendarGrid.tsx`

**Các bước chi tiết:**
1. CSS Grid 7 columns (Mon–Sun): `grid-template-columns: repeat(7, 1fr)`
2. **Day cell** (140px min-height):
   - Solar date: top-left, font-sans, text-lg, bold, charcoal
   - Lunar date: top-right, font-sans, text-xs, italic, text-slate-500
   - Background: aged-silk (#FFF8DC)
   - Right border: 1px charcoal
3. **Memorial day cell** (Gold Silk Treatment):
   - Background: `linear-gradient(135deg, #E6BE8A, #D4AF37, #B8860B)` + silk texture
   - Inset ring: `box-shadow: inset 0 0 0 2px #8a0000`
   - "Anniversary" label badge (top, small)
   - Ancestor name (font-display, text-sm, bold)
   - Event title (font-sans, text-xs)
   - Fire icon 🔥 (bottom-right)
   - Text color: bg-dark
4. **Current day:**
   - White background, elevated shadow
   - Date number trong crimson circle
   - "No rituals scheduled" nếu empty
5. **Previous month overflow:** aged-silk 90% opacity, text 40% opacity, non-interactive
6. Data: fetch từ `useRituals({ month: currentMonth })` 
7. Dùng `useLunarDate` hook để lấy lunar dates cho mỗi ngày

**AI Prompt mẫu:**
> Tạo `CalendarGrid.tsx` — monthly calendar với dual dates:
> 1. CSS Grid 7 columns, day cells 140px min-height
> 2. Mỗi cell: solar date (top-left, bold) + lunar date (top-right, italic)
> 3. Memorial cells: gold-silk gradient, inset crimson ring, ancestor name, fire icon
> 4. Current day: white bg, crimson circle around date, shadow
> 5. Overflow days: muted opacity, non-interactive
> 6. Click memorial cell → emit `onCellClick(ritualId)`
> 7. Dùng `useLunarDate` hook cho lunar conversion
> Background colors: aged-silk default, gold gradient for memorial days
> Tham khảo: PRD-04 §3.1, PRD-00 §2.3

**DoD:**
- [ ] Grid 7 columns render đúng cho mỗi tháng
- [ ] Solar + lunar dates hiện đúng song song
- [ ] Memorial cells: gold gradient + ancestor name + fire icon
- [ ] Current day: white background + crimson circle
- [ ] Overflow days muted, non-clickable
- [ ] Click memorial cell trigger callback

---

## Task 4.4: Calendar Header + Month Navigation

**ID:** `RITE-004`  
**Output:** `src/components/rituals/CalendarHeader.tsx`

**Các bước chi tiết:**
1. Month display: "April 2026 / Tháng 3 Âm lịch" (solar / lunar)
2. Navigation arrows: ← (prev month) / → (next month)
   - Click → update `currentMonth` state → refetch rituals
   - Smooth transition (fade out grid → fade in new month)
3. Weekday headers: Mon | Tue | Wed | Thu | Fri | Sat | Sun
   - Font-header, uppercase, tracking-widest, text-xs
4. Mobile: swipe left/right to change month (touch gesture)

**DoD:**
- [ ] Month/year display đúng (solar + lunar)
- [ ] Prev/next navigation thay đổi tháng + refetch data
- [ ] Smooth transition animation
- [ ] Mobile swipe navigation hoạt động

---

## Task 4.5: Ritual Detail Side Panel

**ID:** `RITE-005`  
**Output:** `src/components/rituals/RitualDetailPanel.tsx`

**Các bước chi tiết:**
1. Right panel 384px, slide-in khi memorial cell clicked
2. **Header:**
   - Date label (solar + lunar)
   - Event title (font-display, text-2xl, bold)
   - Description (font-serif, italic)
3. **Ritual Instructions section:**
   - List of instruction cards (icon + title + description)
   - Standard categories: Nhang đèn, Mâm cúng, Văn khấn, Trang phục, Thời gian
   - Each card: Material icon (left), title (bold), description (text-sm)
   - Cách nhau bằng subtle divider
4. **Family Duties Checklist:**
   - Each row: checkbox icon + duty text + assigned group badge
   - Checkbox states:
     - ☐ Pending: empty circle, slate text
     - ✅ Completed: green check circle, text strike-through
   - Group badges: ELDERS (crimson bg), HEIRS (slate bg), YOUTH (amber bg)
   - Click checkbox → PATCH `/api/v1/rituals/:id/duties/:dutyId` toggle `isCompleted`
   - Optimistic UI: check immediately, revert if API fails
5. **"Certify Completion" button** (bottom, full-width):
   - Disabled (opacity-50) khi chưa tất cả duties complete
   - Enabled: btn-lacquer, icon `history_edu`
   - Click → POST `/api/v1/rituals/:id/certify`
   - After certify: button → "Certified by [Name]" (green, locked)
6. Panel update khi click different memorial cell (no close/reopen)

**AI Prompt mẫu:**
> Build `RitualDetailPanel.tsx` — right side panel cho calendar:
> 1. Slide-in 384px khi memorial cell clicked
> 2. Header: date (solar+lunar) + title + description
> 3. Instructions: icon + title + description cards (5 standard categories)
> 4. Duty checklist: checkbox toggle (optimistic UI), group badges
>    - PATCH ritual duties via API when toggling
> 5. "Certify Completion": disabled until ALL duties checked
>    - POST /api/v1/rituals/:id/certify → lock ritual
>    - After: show "Certified by [Name]" locked state
> RBAC: only HEAD_OF_HOUSE can certify
> Tham khảo: PRD-04 §3.2, api-design.md §5.4

**DoD:**
- [ ] Panel slide-in khi memorial cell clicked
- [ ] Instructions render với icons đúng
- [ ] Duty checkboxes toggle với optimistic UI
- [ ] Group badges đúng màu (ELDERS/HEIRS/YOUTH)
- [ ] "Certify" disabled khi có duty chưa xong
- [ ] Certify thành công → locked state + verifier name
- [ ] Click different cell → panel update (not close/reopen)

---

## Task 4.6: Calendar Sidebar

**ID:** `RITE-006`  
**Output:** Calendar sidebar navigation + widgets

**Các bước chi tiết:**
1. **Page layout:** `src/app/rituals/layout.tsx`
   - Sidebar (256px) | Calendar (flex-1) | Detail Panel (384px, conditional)
2. **Navigation links:**
   - Dashboard | Ritual Calendar (active) | Family Duties | Offering Guides
   - Active state: bg-primary/20, border-left-3 primary
3. **Next Observance Widget:**
   - Ancestor name (font-display, bold)
   - Countdown: "In 3 Days" / "Tomorrow" / "Today" (StatusBadge)
   - Date (solar + lunar)
   - Fetch: `GET /api/v1/rituals?upcoming=true&limit=1`
4. **Current Lunar Era Label:**
   - Vietnamese zodiac: "Bính Ngọ — 2026" (font-calligraphy, text-gold-leaf)
   - Calculate từ `lunar.ts`
5. Sidebar collapse trên tablet/mobile

**DoD:**
- [ ] Navigation links với active state đúng
- [ ] "Family Duties" link route đến `/duties`
- [ ] Next Observance widget hiện countdown đúng
- [ ] Lunar Era label hiện zodiac năm hiện tại
- [ ] Sidebar collapse responsive

---

## Task 4.7: Calendar Page Assembly + Responsive

**ID:** `RITE-007`  
**Output:** `src/app/rituals/page.tsx` hoàn chỉnh

**Các bước chi tiết:**
1. Assemble: CalendarHeader → CalendarGrid → (RitualDetailPanel khi selected)
2. State management:
   - `currentMonth` (useState)
   - `selectedRitualId` (useState → trigger panel)
3. Responsive:
   - Desktop (≥1024px): sidebar + calendar + panel
   - Tablet (768-1023): sidebar collapse, panel overlay
   - Mobile (<768): no sidebar, panel → bottom sheet, calendar cells smaller
4. Keyboard navigation: arrow keys move between cells, Enter opens detail
5. Performance: calendar render < 500ms even with 10+ events
6. Mobile: swipe left/right change month

**DoD:**
- [ ] Calendar page render đầy đủ
- [ ] Click memorial → panel opens
- [ ] Responsive 3 breakpoints
- [ ] Keyboard: arrow + Enter navigation
- [ ] Performance: < 500ms render
- [ ] Swipe navigation mobile

---

## Tổng kết IP-04

**Thứ tự thực hiện:**
```
RITE-001 (Lunar Utility) ←→ RITE-002 (Rituals API) — song song
    ↓
RITE-003 (Calendar Grid)
    ↓
RITE-004 (Header + Navigation)
    ↓
RITE-005 (Detail Panel)
    ↓
RITE-006 (Sidebar)
    ↓
RITE-007 (Assembly + QA)
```

**Phase 4a Definition of Done tổng:**
- [ ] Calendar hiện lunar + solar dates đúng
- [ ] Memorial cells gold-silk gradient
- [ ] Click memorial → detail panel với instructions + duty checklist
- [ ] Certification workflow hoạt động
- [ ] Month navigation smooth
- [ ] Responsive 3 breakpoints
