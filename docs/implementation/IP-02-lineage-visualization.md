# IP-02: Lineage Visualization — Neural Root & Traditional Tree

> **Phase:** 2  
> **Mục tiêu:** Hiển thị cây gia phả tương tác (2 views), Digital Profile, Member Input Modal  
> **Depends on:** IP-00 (Foundation), IP-01 partial (Members API từ Phase 1 Core CRUD)  
> **PRD Reference:** PRD-02-lineage-visualization.md  
> **API Reference:** `api-design.md §2 (Members), §3 (Relationships)`

---

## Task 2.1: Members & Relationships API

**ID:** `LINE-001`  
**Output:** API routes cho Members CRUD + Relationships

**Các bước chi tiết:**
1. Tạo `src/app/api/v1/members/route.ts`:
   - `GET` — list members (cursor pagination, filters: generation, search, isDeceased)
   - `POST` — create member (Zod validation, RBAC: HEAD_OF_HOUSE/ELDER)
   - Từ `api-design.md §2.1, §2.3`
2. Tạo `src/app/api/v1/members/[id]/route.ts`:
   - `GET` — member detail (include: media, parents, children, spouses, graveSite)
   - `PATCH` — update member
   - `DELETE` — soft delete (HEAD_OF_HOUSE only)
   - Từ `api-design.md §2.2, §2.4, §2.5`
3. Tạo `src/app/api/v1/relationships/route.ts`:
   - `GET` — full graph (all edges for clan)
   - `POST` — create parent→child link
   - `DELETE` — remove relationship
   - Từ `api-design.md §3`
4. Tạo `src/app/api/v1/member-spouses/route.ts`:
   - `POST` — create spouse link
   - `DELETE` — remove spouse link
5. Tạo Zod validation schemas trong `src/lib/validators.ts`:
   - `CreateMemberSchema`, `UpdateMemberSchema`, `ListMembersSchema`
6. Tạo SWR hooks: `src/hooks/useMembers.ts`, `src/hooks/useRelationships.ts`

**AI Prompt mẫu:**
> Tạo Members API cho Heritage Cloud:
> 1. `src/app/api/v1/members/route.ts` — GET (cursor pagination + filters) + POST (create with Zod validation)
> 2. `src/app/api/v1/members/[id]/route.ts` — GET (detail + includes) + PATCH + DELETE (soft delete)
> 3. `src/app/api/v1/relationships/route.ts` — GET (full graph) + POST + DELETE
> 4. RBAC: `requireRole` cho write operations; `requireSameClan` cho tất cả
> 5. Zod schemas tại `src/lib/validators.ts`
> Spec: `docs/implementation/api-design.md §2-3`, DB Schema: `docs/db-design/database-schema.md`

**DoD:**
- [ ] `GET /api/v1/members` trả list với pagination
- [ ] `POST /api/v1/members` tạo member mới, trả 201
- [ ] `GET /api/v1/members/:id?include=parents,children` trả detail + relations
- [ ] `DELETE /api/v1/members/:id` soft delete (chỉ HEAD_OF_HOUSE)
- [ ] `GET /api/v1/relationships` trả full graph (parentChild + spouses)
- [ ] Zod validation reject invalid data với error 400

---

## Task 2.2: Member Media Upload

**ID:** `LINE-002`  
**Output:** Media upload API + Sharp processing

**Các bước chi tiết:**
1. Tạo `src/app/api/v1/members/[id]/media/route.ts`:
   - `GET` — list media (filter by type)
   - `POST` — upload (multipart/form-data)
   - Xử lý upload theo `tech-architecture.md §3.4`:
     a. Validate file type (magic bytes, not just extension)
     b. Sharp: resize, generate thumbnail 200×200, convert WebP
     c. Upload original + thumbnail to storage (R2/S3 hoặc local `/public/uploads/` cho dev)
     d. Save URL references trong `member_media` table
2. Cài: `npm install sharp`
3. Tạo `src/lib/upload.ts` — upload utility
4. Giới hạn: max 10MB/file, accepted: JPEG, PNG, WebP

**AI Prompt mẫu:**
> Tạo media upload API tại `src/app/api/v1/members/[id]/media/route.ts`:
> 1. Accept multipart/form-data
> 2. Validate: max 10MB, JPEG/PNG/WebP only (check magic bytes)
> 3. Process: Sharp resize + thumbnail 200x200 + WebP convert
> 4. Store: local `/public/uploads/` cho dev (future: R2/S3)
> 5. Save references trong member_media table (Prisma)
> Tham khảo: `docs/implementation/tech-architecture.md §3.4`

**DoD:**
- [ ] Upload ảnh → thumbnail auto-generated
- [ ] File type validation bằng magic bytes
- [ ] Reject files > 10MB
- [ ] member_media record tạo đúng với URL + thumbnailUrl
- [ ] `GET /api/v1/members/:id/media` trả list media

---

## Task 2.3: Neural Root Canvas (D3.js Force-Directed Graph)

**ID:** `LINE-003`  
**Output:** `src/components/lineage/NeuralRootCanvas.tsx`

**Các bước chi tiết:**
1. Cài: `npm install d3 @types/d3`
2. Tạo `NeuralRootCanvas.tsx`:
   - Dynamic import với `ssr: false` (D3 cần DOM)
   - Fetch data từ `useRelationships()` hook
   - D3 force simulation:
     - `forceLink()` — connections giữa nodes
     - `forceManyBody()` — repulsion (-300)
     - `forceCenter()` — center gravity
     - `forceCollide()` — prevent overlap (radius 40)
   - SVG rendering:
     - Nodes: circles (40px radius), avatar image fill
     - Links: bezier curves (antique-gold), curved stroke
     - Labels: member name below node
3. Zoom/Pan: D3-zoom behavior trên SVG container
   - Minimum zoom: 0.3, Maximum zoom: 3
   - Double-click: zoom to fit all nodes
4. Responsive: SVG viewBox auto-resize
5. Performance: limit initial render to 200 nodes, load thêm khi zoom in

**AI Prompt mẫu:**
> Tạo `NeuralRootCanvas.tsx` — interactive family tree graph:
> 1. Dynamic import (ssr: false)
> 2. Fetch data từ `/api/v1/relationships` → build D3 force simulation
> 3. SVG render: circle nodes (avatar), bezier curve links (antique-gold)
> 4. D3-zoom: pan/zoom, min 0.3, max 3, double-click fit-to-view
> 5. Click node → emit `onNodeSelect(memberId)` event
> 6. Deceased nodes: grayscale filter, gold border, lotus badge overlay
> Tham khảo: PRD-02 §3.1, PRD-00 §4.9

**DoD:**
- [ ] Graph render tất cả members dưới dạng force-directed nodes
- [ ] Connections hiện bezier curves giữa parent↔child
- [ ] Zoom/pan smooth trên desktop + mobile (touch)
- [ ] Deceased members: grayscale + gold border + lotus badge
- [ ] Click node → trigger callback (cho inspector panel)
- [ ] Double-click → fit all nodes trong viewport

---

## Task 2.4: Member Node Component

**ID:** `LINE-004`  
**Output:** `src/components/lineage/MemberNode.tsx`

**Các bước chi tiết:**
1. Shared component dùng cho cả Neural Root và Traditional Tree
2. Render dựa trên member data:
   - **Living:** Full-color avatar, border-2 border-primary, name text-parchment
   - **Deceased:** grayscale(0.6) filter, border-2 border-accent-gold, Golden Lotus badge (top-right), hover: grayscale(0) 700ms transition
3. Badge hiển thị:
   - Generation number (bottom-left, small circle)
   - Role (HEAD_OF_HOUSE → crown icon, ELDER → star icon)
4. Name label: font-sans, text-xs, max-width 80px, truncate with ellipsis
5. Selected state: ring-2 ring-primary, scale(1.1) animation

**DoD:**
- [ ] Living member: full color + crimson border
- [ ] Deceased member: grayscale + gold border + lotus badge
- [ ] Hover on deceased: restore color over 700ms
- [ ] Role badges hiện đúng
- [ ] Selected state: ring highlight

---

## Task 2.5: Lineage Sidebar + Inspector Panel

**ID:** `LINE-005`  
**Output:** `src/app/lineage/layout.tsx` + `src/components/lineage/MemberInspector.tsx`

**Các bước chi tiết:**
1. **Layout:** 3-panel layout (sidebar | canvas | inspector)
   - Sidebar: 256px, collapsible
   - Canvas: flex-1
   - Inspector: 384px, slide-in khi node được chọn
2. **Sidebar content:**
   - View toggle: Neural Root | Traditional Tree (2 buttons)
   - Filters: Direct Lineage, Collateral Kin, Duty Holders (checkboxes)
   - Ancestor count: "128 Members across 14 Generations"
   - "New Node Entry" button (btn-lacquer) → opens member input modal
3. **Inspector panel** (khi node được chọn):
   - Avatar (96px, DeceasedAvatar component)
   - Full name (font-serif, text-xl)
   - Life dates: "1762 — 1820" or "1990 — Present"
   - Generation + role badges
   - "Neural Connections" list: parents, children, spouses (clickable → re-center graph)
   - "Open Full Profile" link → `/lineage/[memberId]`
   - "Edit" button (if RBAC permits)
4. Zustand store: `src/store/useLineageStore.ts`
   - `selectedNodeId`, `viewMode`, `zoomLevel`, `filters`

**AI Prompt mẫu:**
> Build Lineage page layout tại `src/app/lineage/layout.tsx`:
> 1. 3-panel: Sidebar (256px) | Canvas (flex-1) | Inspector (384px, conditional)
> 2. Sidebar: view toggle (Neural/Tree), filter checkboxes, ancestor count, "New Node" btn
> 3. Inspector: avatar + name + dates + connections list + "Open Full Profile" link
> 4. Zustand store `useLineageStore` cho selectedNodeId, viewMode, filters
> Panel slide-in animation khi node được chọn. Responsive: sidebar collapse trên mobile.
> Tham khảo: PRD-02 §3.1–3.2, PRD-00 §6.1

**DoD:**
- [ ] 3-panel layout render đúng trên desktop
- [ ] View toggle chuyển Neural ↔ Tree
- [ ] Click node → Inspector panel slide-in hiện member info
- [ ] "Open Full Profile" link route đúng
- [ ] Sidebar collapse trên mobile
- [ ] Filters thay đổi hiển thị nodes trên canvas

---

## Task 2.6: Traditional Tree View

**ID:** `LINE-006`  
**Output:** `src/components/lineage/TraditionalTree.tsx`

**Các bước chi tiết:**
1. D3-hierarchy top-down tree layout:
   - Root: Patriarch (thủy tổ) ở trên cùng
   - Children: cascade xuống dưới
   - Gold connector lines (2px, antique-gold)
   - Node spacing: horizontal 200px, vertical 120px
2. Dùng `d3.tree()` layout + `d3.linkVertical()` paths
3. Node component: reuse `MemberNode.tsx` từ Task 2.4
4. Zoom/Pan: same D3-zoom behavior
5. Sidebar tools: zoom in/out buttons, search member (highlight + pan-to-node)
6. "Export Pedigree" button:
   - Cài: `npm install html-to-image jspdf`
   - Capture SVG → PNG → PDF with jsPDF

**AI Prompt mẫu:**
> Tạo `TraditionalTree.tsx` — top-down hierarchical family tree:
> 1. D3 `d3.tree()` layout với patriarch ở top
> 2. Gold connector lines (`d3.linkVertical()`, antique-gold stroke)
> 3. Reuse `MemberNode` component cho mỗi node
> 4. D3-zoom cho pan/zoom
> 5. "Export Pedigree" button: html-to-image → jsPDF
> Tham khảo: PRD-02 §3.4

**DoD:**
- [ ] Tree hiện patriarch ở top, descendants cascade xuống
- [ ] Gold connector lines giữa parent→child
- [ ] Nodes reuse MemberNode (living/deceased styling)
- [ ] Zoom/Pan hoạt động
- [ ] Export PDF tạo file readable
- [ ] View toggle từ Neural ↔ Tree giữ selected node

---

## Task 2.7: Digital Memorial Profile Page

**ID:** `LINE-007`  
**Output:** `src/app/lineage/[memberId]/page.tsx` + `src/components/lineage/DigitalProfile.tsx`

**Các bước chi tiết:**
1. Page layout:
   - Hero section: grayscale portrait (264×320), gold-leaf-frame border, generation title, full name (font-ornate, text-4xl), year range, personal quote (font-calligraphy)
   - Living members: full-color portrait, border-primary
2. **Virtual Offering panel** (right side of hero):
   - "Light Incense" button → POST `/api/v1/members/:id/offerings` body `{ offeringType: "INCENSE" }`
   - "Offer Flowers" button → same API, `{ offeringType: "FLOWERS" }`
   - Monthly offering count badge
   - Optional: CSS animation (smoke/petals) khi click
3. **Content tabs** (below hero):
   - Tab 1: "Ancestral Biography" — life journey timeline (vertical, icons per event)
   - Tab 2: "Archival Gallery" — photo grid, lightbox zoom
   - Tab 3: "Ancestral Duties" — list of past/current duties
   - Tab 4: "Descendants" — mini tree of direct children/grandchildren
4. **Legacy Snapshot sidebar** (right):
   - Descendant count
   - Authentication % (verified duties / total)
   - Honorific status badge
5. Data: fetch `/api/v1/members/:id?include=media,parents,children,spouses,graveSite,duties,offerings`

**AI Prompt mẫu:**
> Tạo Digital Memorial Profile tại `src/app/lineage/[memberId]/page.tsx`:
> 1. Hero: grayscale portrait (deceased) hoặc full-color (living), gold frame, name, dates, quote
> 2. Virtual offerings: 2 buttons (Incense, Flowers) → POST API, count badge
> 3. 4 Tabs: Biography timeline, Gallery (lightbox), Duties list, Descendants mini-tree
> 4. Legacy sidebar: descendant count, auth %, status badge
> 5. Fetch từ `/api/v1/members/:id` with includes
> Deceased members PHẢI có grayscale filter + gold border. Tham khảo: PRD-02 §3.3

**DoD:**
- [ ] Profile render đầy đủ hero + tabs + sidebar
- [ ] Deceased: grayscale portrait + gold frame
- [ ] Living: full-color portrait + crimson border
- [ ] Virtual offering buttons tạo API call thành công
- [ ] Tabs switch nội dung đúng
- [ ] Gallery photos mở lightbox khi click
- [ ] Responsive: sidebar → stacked trên mobile

---

## Task 2.8: Member Input Modal

**ID:** `LINE-008`  
**Output:** `src/components/lineage/MemberInputModal.tsx`

**Các bước chi tiết:**
1. Cài: `npm install react-hook-form @hookform/resolvers`
2. Modal layout: 1/3 sidebar (avatar) + 2/3 form (fields)
3. **Sidebar:**
   - Round avatar upload zone (192px)
   - Click/drag to upload → preview
   - Below: lineage name, gender select, living/deceased toggle
4. **Form (right 2/3):**
   - Section "Vital Records":
     - Full name (text, required)
     - Birth date solar (date picker)
     - Birth date lunar (text, auto-convert từ solar)
     - Death date solar (CHỈN hiện khi deceased toggle ON)
     - Departure rite (text, chỉ hiện khi deceased)
   - Section "Lineage Placement":
     - Generation (number)
     - Father (searchable select từ existing members)
     - Mother (searchable select)
     - Life partner / Spouse (searchable select)
   - Section "Legacy & Duties":
     - Biography (textarea)
     - Duty tags (multi-select: RELIGIOUS, MAINTENANCE, ARCHIVAL, SOCIAL)
5. **Actions:**
   - "Discard" → close modal, confirm if dirty form
   - "Sanctify Entry" → validate + POST `/api/v1/members` + upload avatar → close + refetch graph
6. Validation: Zod schema, inline error messages
7. Edit mode: pre-fill form khi editing existing member (`PATCH` thay vì `POST`)

**AI Prompt mẫu:**
> Build `MemberInputModal.tsx` — modal tạo/sửa thành viên gia phả:
> 1. Layout: 1/3 sidebar (avatar upload) + 2/3 form
> 2. Living/Deceased toggle: khi deceased ON → hiện death date + departure rite fields
> 3. Searchable select cho father, mother, spouse (fetch from members list)
> 4. React Hook Form + Zod validation
> 5. "Sanctify Entry" → POST /api/v1/members (create) hoặc PATCH (edit)
> 6. After save: upload avatar via media API, close modal, refetch graph data
> 7. "Discard" → confirm dialog nếu form dirty
> Tham khảo: PRD-02 §4.4, api-design.md §2.3

**DoD:**
- [ ] Modal mở từ sidebar "New Node Entry" button
- [ ] Avatar upload + preview hoạt động
- [ ] Deceased toggle show/hide death-related fields
- [ ] Searchable select tìm members đúng
- [ ] Validation: required fields, valid dates, generation > 0
- [ ] Create: POST thành công, node mới hiện trên graph
- [ ] Edit: pre-fill data, PATCH thành công
- [ ] Dirty form → confirm dialog khi close

---

## Tổng kết IP-02

**Thứ tự thực hiện:**
```
LINE-001 (Members + Relationships API)
    ↓
LINE-002 (Media Upload)
    ↓
LINE-003 (Neural Root Canvas) ←→ LINE-004 (Member Node) — song song
    ↓
LINE-005 (Sidebar + Inspector)
    ↓
LINE-006 (Traditional Tree)
    ↓
LINE-007 (Digital Profile)
    ↓
LINE-008 (Member Input Modal)
```

**Phase 2 Definition of Done tổng:**
- [ ] Members CRUD API hoạt động đầy đủ
- [ ] Neural Root hiện force-directed graph tương tác
- [ ] Traditional Tree hiện hierarchy top-down
- [ ] Toggle giữa 2 views giữ selected node
- [ ] Digital Profile render đầy đủ hero + tabs
- [ ] Member Input Modal tạo/sửa thành viên thành công
- [ ] Deceased styling đúng trên toàn bộ (grayscale + gold + lotus)
- [ ] Export pedigree tạo PDF
- [ ] Responsive trên 4 breakpoints
