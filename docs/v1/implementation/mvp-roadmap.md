# Heritage Cloud — MVP Implementation Roadmap

> Kế hoạch triển khai theo từng phase, ưu tiên core features trước, progressive enhancement sau.

---

## Tổng quan Phase

```
Phase 0 ──▶ Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4
Foundation   Core CRUD   Lineage     Map &       Calendar &
& Scaffold   & Auth      Visual      Sites       Duties
(2 tuần)     (3 tuần)    (3 tuần)    (3 tuần)    (3 tuần)
```

**Tổng thời gian ước tính:** ~14 tuần (3.5 tháng) cho MVP

---

## Phase 0: Foundation & Project Scaffold

**Mục tiêu:** Setup project, design system, database, CI/CD

### Tasks

| # | Task | Output |
|---|------|--------|
| 0.1 | Init Next.js 14+ project (App Router, TypeScript, Tailwind) | `npx create-next-app@latest` |
| 0.2 | Configure Tailwind design tokens (colors, fonts, spacing) từ PRD-00 | `tailwind.config.ts` + `globals.css` |
| 0.3 | Setup Prisma + PostgreSQL (Docker local) | `prisma/schema.prisma` |
| 0.4 | Run initial Prisma migration | All 17 tables created |
| 0.5 | Setup NextAuth.js (credentials provider) | `/api/auth/[...nextauth]` |
| 0.6 | Build UI Kit components (ParchmentCard, LacquerButton, StatusBadge, etc.) | `components/ui/` |
| 0.7 | Build layout components (GlobalHeader, Sidebar, DetailPanel) | `components/layout/` |
| 0.8 | Setup ESLint, Prettier, Husky, lint-staged | Config files |
| 0.9 | Setup Vitest + Testing Library | `vitest.config.ts` |
| 0.10 | Seed data script (dev environment) | `prisma/seed.ts` |
| 0.11 | Deploy to Vercel (preview environment) | Vercel project linked |

### Definition of Done
- [x] `npm run dev` starts without errors
- [x] Design tokens match PRD-00 §2 (colors), §3 (fonts)
- [x] DB has all tables, seed data loads
- [x] Login/logout works with test user
- [x] UI Kit components render in Storybook
- [x] CI pipeline runs lint + typecheck + tests

---

## Phase 1: Core CRUD — Members & Relationships

**Mục tiêu:** User có thể tạo, sửa, xoá thành viên và thiết lập quan hệ cha-con, spouse

### Depends on: Phase 0

### Tasks

| # | Task | Output | PRD Ref |
|---|------|--------|---------|
| 1.1 | Members API: CRUD routes (`/api/v1/members`) | API routes + Zod validation | API §2 |
| 1.2 | Relationships API: parent-child & spouse routes | API routes | API §3 |
| 1.3 | Member Input Modal component (create/edit form) | `MemberInputModal.tsx` | PRD-02 §4.1 |
| 1.4 | Digital Profile page (`/lineage/[memberId]`) | Profile page | PRD-02 §3.3 |
| 1.5 | Member media upload (avatar, photos) | Upload API + Sharp processing | API §2.6 |
| 1.6 | RBAC middleware (role checking on all write routes) | `lib/permissions.ts` | PRD-00 §8 |
| 1.7 | Soft delete implementation | Prisma middleware | Arch §4.3 |
| 1.8 | Audit log middleware (auto-log mutations) | Audit log entries | DB audit_logs |
| 1.9 | Global search API (`/api/v1/search`) | Search route | API §8 |
| 1.10 | Clan API + Homepage stats (`/api/v1/clan/stats`) | Clan route | API §9 |

### Definition of Done
- [x] Create member with full fields (solar + lunar dates, generation, role)
- [x] Link parent↔child, spouse↔spouse
- [x] Avatar upload → thumbnail auto-generated
- [x] Role-based: only HEAD_OF_HOUSE can delete
- [x] Audit log records who changed what

---

## Phase 2: Lineage Visualization

**Mục tiêu:** Neural Root và Traditional Tree views hiển thị family tree tương tác

### Depends on: Phase 1

### Tasks

| # | Task | Output | PRD Ref |
|---|------|--------|---------|
| 2.1 | Neural Root Canvas (D3.js force-directed graph) | `NeuralRootCanvas.tsx` | PRD-02 §3.1 |
| 2.2 | Custom MemberNode component (avatar, name, deceased styling) | `MemberNode.tsx` | PRD-02 §4.2 |
| 2.3 | Zoom/pan controls + minimap | Canvas controls | PRD-02 §4.3 |
| 2.4 | Click node → Member Inspector panel (right panel) | `MemberInspector.tsx` | PRD-02 §3.2 |
| 2.5 | Traditional Tree view (D3-hierarchy, top-down) | `TraditionalTree.tsx` | PRD-02 §3.4 |
| 2.6 | View toggle: Neural Root ↔ Traditional Tree | Toggle button | PRD-02 §4.4 |
| 2.7 | Generation filter sidebar | Sidebar filter | PRD-02 §3.5 |
| 2.8 | Homepage integration (hero banner, nav to lineage) | Homepage page | PRD-01 |
| 2.9 | Export pedigree to PDF (jsPDF) | Export button | PRD-02 §5 |
| 2.10 | Responsive: mobile single-column, touch zoom/pan | Mobile layout | PRD-00 §6.8–6.9 |

### Definition of Done
- [x] Neural Root shows all members as force-directed nodes
- [x] Clicking node opens inspector with member detail
- [x] Deceased members: grayscale + gold border + lotus badge
- [x] Traditional Tree shows hierarchical parent→child layout
- [x] Smooth zoom/pan on desktop and mobile
- [x] PDF export produces a readable family tree document

---

## Phase 3: Ancestral Map & Grave Sites

**Mục tiêu:** Map view hiển thị vị trí mộ với 360° panorama và site registration

### Depends on: Phase 1

### Tasks

| # | Task | Output | PRD Ref |
|---|------|--------|---------|
| 3.1 | Mapbox GL integration (dark theme map) | `MapContainer.tsx` | PRD-03 §3.1 |
| 3.2 | Custom site pins (cluster at zoom-out) | `SitePin.tsx` | PRD-03 §4.1 |
| 3.3 | Site Detail Panel (click pin → show info) | `SiteDetailPanel.tsx` | PRD-03 §3.2 |
| 3.4 | Pannellum 360° Viewer integration | `PanoramaViewer.tsx` | PRD-03 §3.3 |
| 3.5 | Grave Sites API: CRUD + spatial queries | API routes | API §4 |
| 3.6 | Site Registration form + photo upload | `SiteRegistrationForm.tsx` | PRD-03 §3.4 |
| 3.7 | Panorama upload (50MB, equirectangular validation) | Upload handler | API §4.5 |
| 3.8 | Site statistics dashboard | Stats widget | API §4.6 |
| 3.9 | Distance-based sorting (user geolocation) | Spatial query | DB GiST index |
| 3.10 | Responsive: mobile map with bottom sheet detail | Mobile layout | PRD-00 §6.8 |

### Definition of Done
- [x] Map loads with dark theme, shows all clan's grave sites as pins
- [x] Click pin → slide-in detail panel with epitaph, condition, photos
- [x] 360° panorama viewer opens from detail panel
- [x] New site registration with GPS coordinates + photo upload
- [x] Spatial search: find sites within X km radius

---

## Phase 4: Ritual Calendar & Family Duties

**Mục tiêu:** Calendar hiển thị lịch giỗ/cúng, Kanban board quản lý nhiệm vụ

### Depends on: Phase 1 (Phase 2-3 có thể song song)

### Tasks

| # | Task | Output | PRD Ref |
|---|------|--------|---------|
| 4.1 | Lunar calendar conversion utility | `lib/lunar.ts` | PRD-00 §5.3 |
| 4.2 | Calendar Grid component (solar + lunar dual display) | `CalendarGrid.tsx` | PRD-04 §3.1 |
| 4.3 | Memorial Day Cell highlighting | `MemorialDayCell.tsx` | PRD-04 §4.1 |
| 4.4 | Ritual Events API: CRUD + certification | API routes | API §5 |
| 4.5 | Ritual Detail Panel (instructions + duty checklist) | `RitualDetailPanel.tsx` | PRD-04 §3.2 |
| 4.6 | Kanban Board (DnD with @dnd-kit) | `KanbanBoard.tsx` | PRD-05 §3.1 |
| 4.7 | Duty Cards with status, priority, assignment | `DutyCard.tsx` | PRD-05 §4.1 |
| 4.8 | Duties API: CRUD + status transitions + verification | API routes | API §6 |
| 4.9 | Member Workload Table | `WorkloadTable.tsx` | PRD-05 §3.2 |
| 4.10 | Duty Statistics header | `DutyStats.tsx` | PRD-05 §3.3 |
| 4.11 | Duty Creation Modal | `DutyCreateModal.tsx` | PRD-05 §4.2 |
| 4.12 | Notifications API + basic notification UI | API routes + UI | API §7 |
| 4.13 | Virtual offerings (incense, flowers, etc.) | Offering API + UI | API §2.7 |

### Definition of Done
- [x] Calendar shows month view with lunar dates alongside solar
- [x] Memorial days highlighted; click → ritual detail panel
- [x] Duty checklist on ritual with completion toggle
- [x] Kanban board: drag duties between Queue → Active → Completed
- [x] Duty verification by HEAD_OF_HOUSE locks the duty
- [x] Workload table shows member duty intensity
- [x] Notification sent when duty assigned

---

## Post-MVP Enhancements (Phase 5+)

| Feature | Phase | Description |
|---------|-------|-------------|
| OAuth login (Google, Facebook) | 5 | Social login beyond credentials |
| Three.js 3D tomb models | 5 | Photogrammetry-generated 3D grave model viewer |
| Multi-language (EN/VI) | 5 | i18n with next-intl |
| Clan invitation system | 5 | Invite link → join clan |
| Activity feed / Timeline | 6 | Chronological log of clan events |
| Report generation | 6 | PDF reports: member stats, duty efficiency |
| Offline support (PWA) | 6 | Service worker for basic offline viewing |
| Mobile app (React Native) | 7 | Native iOS/Android via shared API |
| AI ancestor search | 7 | OCR old documents → auto-populate member data |

---

## Dependency Graph

```
Phase 0 (Foundation)
   │
   ▼
Phase 1 (Core CRUD)
   │
   ├───────────────┐────────────────┐
   ▼               ▼                ▼
Phase 2         Phase 3          Phase 4
(Lineage)       (Map)            (Calendar + Duties)
                                    │
                                    ▼
                              Post-MVP (Phase 5+)
```

> **Phase 2, 3, và 4 có thể phát triển song song** nếu team >= 2 developers.
> Nếu solo developer, thứ tự ưu tiên: Phase 2 → Phase 4 → Phase 3 (map là "wow factor" nhưng không blocking).

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| D3.js learning curve | Phase 2 delay | Start with simpler React Flow, migrate to D3 later |
| Mapbox pricing | Cost overrun | Use free tier (50k loads/month), fallback to Leaflet |
| Panorama file size | Slow uploads | Client-side compression before upload, progressive loading |
| Lunar calendar accuracy | Wrong memorial dates | Test against multiple Vietnamese lunar calendar sources |
| Solo developer burnout | All phases delay | Focus on Phase 0-1-2 for MVP, defer map and duties |
