# IP-05: Family Duty Management — Kanban Board

> **Phase:** 4b (song song với IP-04 Ritual Calendar)  
> **Mục tiêu:** Kanban board quản lý nhiệm vụ gia tộc, DnD, workload dashboard  
> **Depends on:** IP-00 (Foundation), Members API (IP-02 LINE-001), Rituals API (IP-04 RITE-002 — cho "Linked Ritual")  
> **PRD Reference:** PRD-05-family-duty-management.md  
> **API Reference:** `api-design.md §6 (Duties)`

---

## Task 5.1: Duties API

**ID:** `DUTY-001`  
**Output:** API routes cho Duties CRUD + status transitions + verification

**Các bước chi tiết:**
1. Tạo `src/app/api/v1/duties/route.ts`:
   - `GET` — list duties (filters: status, category, assignedTo, search, sortBy)
   - Response grouped by status: `{ queue: [...], active: [...], completed: [...] }`
   - `POST` — create duty (RBAC: HEAD_OF_HOUSE, ELDER)
   - Từ `api-design.md §6.1, §6.2`
2. Tạo `src/app/api/v1/duties/[id]/route.ts`:
   - `PATCH` — update duty (status transition + sortOrder cho drag-drop)
   - Status transition rules enforced server-side:
     ```
     QUEUE → ACTIVE        (assigned member or ELDER+)
     ACTIVE → COMPLETED    (assigned member or ELDER+)
     COMPLETED → ACTIVE    (HEAD_OF_HOUSE only — reopen)
     ACTIVE → QUEUE        (HEAD_OF_HOUSE, ELDER — revert)
     ```
   - `DELETE` — soft delete (HEAD_OF_HOUSE only)
3. Tạo `src/app/api/v1/duties/[id]/verify/route.ts`:
   - `POST` — verify duty (HEAD_OF_HOUSE only, locks duty)
   - Từ `api-design.md §6.4`
4. Tạo `src/app/api/v1/duties/stats/route.ts`:
   - `GET` — statistics (totalActive, pendingReview, efficiency, assignedCount)
   - Từ `api-design.md §6.6`
5. Tạo `src/app/api/v1/members/workload/route.ts`:
   - `GET` — member workload list
   - Từ `api-design.md §6.7`
6. Tạo SWR hooks: `src/hooks/useDuties.ts`
   - Optimistic mutation cho drag-and-drop (move card → PATCH in bg)

**AI Prompt mẫu:**
> Tạo Duties API cho Heritage Cloud:
> 1. `duties/route.ts` — GET (grouped by status) + POST
> 2. `duties/[id]/route.ts` — PATCH (status transitions enforced) + DELETE
>    Status rules:
>    - QUEUE→ACTIVE, ACTIVE→COMPLETED: assigned member or ELDER+
>    - COMPLETED→ACTIVE, ACTIVE→QUEUE: HEAD_OF_HOUSE only
> 3. `duties/[id]/verify/route.ts` — POST (HEAD_OF_HOUSE, locks duty)
> 4. `duties/stats/route.ts` — GET statistics
> 5. `members/workload/route.ts` — GET member workload
> Side effects: duty_log entry on every status change, notification to assigned member
> Spec: `docs/implementation/api-design.md §6`, Schema: `docs/db-design/database-schema.md`

**DoD:**
- [ ] `GET /api/v1/duties` trả grouped data (queue/active/completed)
- [ ] `PATCH /api/v1/duties/:id` enforce status transition rules
- [ ] Backward drag (COMPLETED→ACTIVE) reject nếu không phải HEAD_OF_HOUSE
- [ ] `POST /api/v1/duties/:id/verify` locks duty
- [ ] Stats trả đúng calculations
- [ ] Workload trả member list với intensity %
- [ ] duty_log tạo cho mọi status change

---

## Task 5.2: Overview Statistics Cards

**ID:** `DUTY-002`  
**Output:** `src/components/duties/DutyStats.tsx`

**Các bước chi tiết:**
1. 4-card responsive grid (4 columns desktop, 2 tablet, 1 mobile)
2. **Card 1 — Total Duties:**
   - Icon: `assignment`, crimson
   - Number: "24 Active" (font-header, text-3xl)
   - Background: ParchmentCard
3. **Card 2 — Pending Review:**
   - Icon: `pending_actions`, amber
   - Number: "08 Due"
4. **Card 3 — Efficiency Rating:**
   - Icon: `trending_up`, green
   - Number: "92%" + trend arrow
   - Trend: green (↑ positive), crimson (↓ negative)
   - Calculation: (completed on-time / total completed) × 100
5. **Card 4 — Descendant Workload:**
   - Stacked mini avatars (3-4 người, overlap -8px)
   - "12 Assigned" count
6. Skeleton loading state
7. Data: fetch `/api/v1/duties/stats`

**DoD:**
- [ ] 4 cards render với đúng icons + data
- [ ] Efficiency trend arrow đúng color (green ↑ / red ↓)
- [ ] Stacked avatars hiện correct
- [ ] Skeleton khi loading
- [ ] Responsive: 4→2→1 columns

---

## Task 5.3: Kanban Board + Drag-and-Drop

**ID:** `DUTY-003`  
**Output:** `src/components/duties/KanbanBoard.tsx` + `src/components/duties/DutyColumn.tsx`

**Các bước chi tiết:**
1. Cài: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. Tạo `KanbanBoard.tsx`:
   - 3 columns: Duty Queue | Active Mandates | Accomplished Tasks
   - `DndContext` wrapper (from @dnd-kit/core)
   - `onDragEnd` handler:
     a. Determine source column + destination column
     b. Optimistic update: move card in local state immediately
     c. PATCH `/api/v1/duties/:id` with new status + sortOrder
     d. If API fails: revert optimistic update + show Toast error
   - Min-width: 1000px, horizontal scroll khi viewport nhỏ hơn
3. Tạo `DutyColumn.tsx`:
   - Column header: status dot + title + count badge
   - Status dots: Queue (slate), Active (crimson), Completed (green)
   - Badge background: Queue (slate-100), Active (primary-100), Completed (green-100)
   - `SortableContext` wrapper for items within column
   - Droppable area

**AI Prompt mẫu:**
> Build Kanban Board cho Heritage Cloud Duty Management:
> 1. `KanbanBoard.tsx` với @dnd-kit/core: 3 columns (Queue/Active/Completed)
> 2. `DutyColumn.tsx`: column header (status dot + title + count), droppable
> 3. Drag-and-drop:
>    - `onDragEnd`: optimistic update local state → PATCH API → revert if fail
>    - Backward drag (Completed→Active) blocked for non-HEAD_OF_HOUSE
> 4. Min-width 1000px, horizontal scroll below
> 5. Status dots: Queue=slate, Active=crimson, Completed=green
> Tham khảo: PRD-05 §3.1, api-design.md §6.3

**DoD:**
- [ ] 3 columns render với correct headers + counts
- [ ] Drag duty card giữa columns → status update
- [ ] Optimistic: card move ngay lập tức
- [ ] API fail: revert card + show error toast
- [ ] Backward drag restricted theo RBAC
- [ ] Horizontal scroll khi < 1000px

---

## Task 5.4: Duty Card Component

**ID:** `DUTY-004`  
**Output:** `src/components/duties/DutyCard.tsx`

**Các bước chi tiết:**
1. Card appearance theo column:
   - **Queue cards:**
     - Paper texture background
     - Category tag (color-coded: RELIGIOUS crimson, MAINTENANCE amber, ARCHIVAL blue, SOCIAL green)
     - Title (font-display, bold)
     - Description (text-sm, line-clamp-2)
     - Date + priority icon (bottom: calendar icon + priority flag)
     - Assignee initials (circle avatar, 24px)
   - **Active cards:**
     - Same as queue + "Active" ribbon (top-right corner, primary bg)
     - Progress bar (percentage, full-width)
     - Assignee: name + avatar (not just initials)
   - **Completed cards:**
     - Green checkmark icon
     - Title with strikethrough
     - "Verified by [Name]" attribution
     - Grayscale filter (0.5), opacity 0.7
     - Hover: opacity → 1.0
2. Drag handle: 6-dot grip icon, visible on hover
3. Cursor: `cursor-grab` default, `cursor-grabbing` khi dragging
4. `useSortable` hook từ @dnd-kit cho mỗi card
5. Priority levels affect card appearance:
   - URGENT: border-2 border-primary, pulse animation
   - HIGH: border-left-4 border-primary
   - MEDIUM: no special border
   - LOW: subtle muted style

**AI Prompt mẫu:**
> Build `DutyCard.tsx` — draggable duty card cho Kanban board:
> 1. 3 variants: Queue (basic), Active (+ribbon +progress bar), Completed (+checkmark +strikethrough +grayscale)
> 2. Category tags: RELIGIOUS crimson, MAINTENANCE amber, ARCHIVAL blue, SOCIAL green
> 3. @dnd-kit `useSortable` hook, drag handle (6-dot grip)
> 4. Priority styling: URGENT=pulse border, HIGH=left border, MEDIUM/LOW=subtle
> 5. Completed: grayscale-50, opacity-70, hover→opacity-100
> Tham khảo: PRD-05 §4.1

**DoD:**
- [ ] Queue card: category tag + title + desc + date + assignee
- [ ] Active card: "Active" ribbon + progress bar
- [ ] Completed card: checkmark + strikethrough + grayscale + verified attribution
- [ ] Drag handle visible on hover
- [ ] Priority styling đúng 4 levels
- [ ] Category colors đúng 4 types

---

## Task 5.5: Descendant Workload Table

**ID:** `DUTY-005`  
**Output:** `src/components/duties/WorkloadTable.tsx`

**Các bước chi tiết:**
1. Full-width table, rounded, border-primary/10, shadow
2. **Columns:**
   - Descendant: avatar (32px) + name + lineage name
   - Status: StatusBadge (Available green, On Duty crimson, Overloaded amber)
   - Current Duty: italic title hoặc "None Assigned"
   - Workload Intensity: progress bar + label
   - Actions: link buttons
3. **Workload bar calculation:**
   - 0–30%: Low (green)
   - 31–60%: Medium (blue)
   - 61–80%: High (amber-600)
   - 81–100%: Critical (crimson)
   - Width = workloadIntensity %
4. **Action links:**
   - Available → "Assign Task" → open DutyCreateModal pre-filled với member
   - On Duty → "Manage" → navigate to duty detail
   - Overloaded → "Redistribute" → open reassignment dialog
5. Row hover: bg-primary/5 transition
6. Data: fetch `/api/v1/members/workload`

**AI Prompt mẫu:**
> Build `WorkloadTable.tsx` — member workload dashboard:
> 1. Table: avatar+name, status badge, current duty, workload bar+label, actions
> 2. Workload bar: 0-30% green, 31-60% blue, 61-80% amber, 81-100% crimson
> 3. Actions: "Assign Task" (opens DutyCreateModal pre-filled), "Manage", "Redistribute"
> 4. Row hover bg-primary/5
> 5. Fetch từ `/api/v1/members/workload`
> Tham khảo: PRD-05 §3.2, api-design.md §6.7

**DoD:**
- [ ] Table render tất cả members từ API
- [ ] Status badges đúng 3 states
- [ ] Workload bar width + color đúng theo thresholds
- [ ] "Assign Task" opens modal pre-filled
- [ ] Row hover effect

---

## Task 5.6: Duty Creation Modal

**ID:** `DUTY-006`  
**Output:** `src/components/duties/DutyCreateModal.tsx`

**Các bước chi tiết:**
1. Modal: max-w-lg, paper-texture backdrop, dark overlay
2. **Form fields** (React Hook Form + Zod):
   - Duty Title (text, required, max 80 chars)
   - Category (select: Religious Duty, Maintenance, Archival, Social Ritual — required)
   - Description (textarea, required, max 300 chars)
   - Priority (select: Low, Medium, High, Urgent — required)
   - Assign To (searchable member select, optional — pre-filled if from workload table)
   - Due Date (date picker, optional + lunar date preview using `useLunarDate`)
   - Linked Ritual (select from upcoming rituals, optional)
     - Fetch from `/api/v1/rituals?upcoming=true`
3. **Submit:** "Create Mandate" button (btn-gold-shimmer)
   - POST `/api/v1/duties` → close modal → card appears in Queue column (slide-in animation)
4. **Cancel:** close modal, confirm if dirty
5. **Edit mode:** khi editing existing duty, pre-fill all fields, "Update Mandate" button (PATCH)

**AI Prompt mẫu:**
> Build `DutyCreateModal.tsx` — form tạo nhiệm vụ mới:
> 1. Fields: title (80 chars), category (4 options), description (300 chars), priority (4 options), assignTo (member search), dueDate (+lunar preview), linkedRitual (upcoming rituals select)
> 2. React Hook Form + Zod validation
> 3. "Create Mandate" → POST /api/v1/duties → close + card slide-in to Queue
> 4. Pre-fill assignTo when opened from workload table "Assign Task" button
> 5. Edit mode: pre-fill from existing duty, PATCH on submit
> Tham khảo: PRD-05 §4.2, api-design.md §6.2

**DoD:**
- [ ] Form render đầy đủ 7 fields
- [ ] Category select hiện color-coded options
- [ ] Due date hiện lunar date preview
- [ ] "Linked Ritual" dropdown fetch upcoming rituals
- [ ] Assignee pre-filled khi opened from workload table
- [ ] Validation: required fields enforced
- [ ] Submit tạo duty, card hiện trong Queue column

---

## Task 5.7: Sidebar + Notifications + Search

**ID:** `DUTY-007`  
**Output:** Sidebar nav + notification badge + search

**Các bước chi tiết:**
1. **Duty page layout:** `src/app/duties/layout.tsx`
   - Sidebar (256px) | Main content (flex-1)
2. **Sidebar:**
   - Core Lineage: Family Tree, Ancestral Records (link to `/lineage`)
   - Governance: Duty Delegation (active), Estate Management, Protocol & Law
   - Active state: bg-primary/20, border-left-3 primary
   - User panel (bottom): avatar, name, role "Head of House", settings gear
3. **Header bar:**
   - Title "Duty Delegation"
   - Notification badge: "3 Pending Requests" (expandable)
   - Search icon (expandable → search input)
   - "Assign New Duty" button (btn-lacquer, add icon)
4. **Search functionality:**
   - Debounce 300ms
   - Filter cards by title, description, assignee name
   - Highlight matching text

**DoD:**
- [ ] Sidebar nav với active state
- [ ] User panel hiện current user info
- [ ] Notification badge hiện count
- [ ] Search filters Kanban cards
- [ ] "Assign New Duty" opens DutyCreateModal

---

## Task 5.8: Duties Page Assembly + Real-time

**ID:** `DUTY-008`  
**Output:** `src/app/duties/page.tsx` hoàn chỉnh

**Các bước chi tiết:**
1. Assemble: DutyStats → KanbanBoard → WorkloadTable
2. Real-time updates:
   - Option A: WebSocket — duty status changes push to all connected clients
   - Option B: SWR polling mỗi 10s (`refreshInterval: 10000`)
   - Bắt đầu với Option B, upgrade lên Option A sau
3. Touch support:
   - Long-press (500ms) to initiate drag on mobile
   - @dnd-kit touch sensor configuration
4. Responsive:
   - Desktop (≥1024px): sidebar + stats + board + table
   - Tablet (768-1023): collapse sidebar, board horizontal scroll
   - Mobile (<768): no sidebar, board stacks vertical, table → card list
5. Performance: page interactive < 3.5s on 4G

**DoD:**
- [ ] Full page render: stats + board + workload table
- [ ] Drag-and-drop hoạt động trên desktop + mobile (touch)
- [ ] Real-time: duty changes reflect within 10s (polling)
- [ ] Responsive 3 breakpoints
- [ ] No console errors

---

## Tổng kết IP-05

**Thứ tự thực hiện:**
```
DUTY-001 (Duties API)
    ↓
DUTY-002 (Stats Cards) ←→ DUTY-004 (Duty Card) — song song
    ↓                         ↓
    └─────────┬───────────────┘
              ↓
DUTY-003 (Kanban Board + DnD)
    ↓
DUTY-005 (Workload Table)
    ↓
DUTY-006 (Create Modal)
    ↓
DUTY-007 (Sidebar + Search)
    ↓
DUTY-008 (Assembly + Real-time)
```

**Phase 4b Definition of Done tổng:**
- [ ] 4 stats cards cập nhật đúng
- [ ] Kanban 3-column DnD hoạt động
- [ ] Status transitions tuân thủ RBAC
- [ ] Workload table hiện intensity bar đúng
- [ ] Duty creation modal tạo duty thành công
- [ ] Touch DnD trên mobile
- [ ] Responsive 3 breakpoints
- [ ] Calendar ↔ Duties linked (ritual duties sync hai chiều)
