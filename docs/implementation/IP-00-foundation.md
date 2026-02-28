# IP-00: Foundation & Project Scaffold

> **Phase:** 0 — Nền móng  
> **Mục tiêu:** Có project chạy được, design system hoàn chỉnh, database sẵn sàng, auth hoạt động  
> **Depends on:** Không có (bắt đầu từ zero)  
> **PRD Reference:** PRD-00 Global Design System  
> **Docs Reference:** `design-tokens.md`, `database-schema.md`, `tech-architecture.md`

---

## Task 0.1: Khởi tạo Next.js Project

**ID:** `FOUND-001`  
**Output:** Project folder với cấu trúc chuẩn

**Các bước chi tiết:**
1. Chạy `npx create-next-app@latest heritage-cloud --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. Xoá boilerplate mặc định (page.tsx placeholder, globals.css mẫu)
3. Tạo cấu trúc thư mục theo `tech-architecture.md §2.1`:
   ```
   src/
   ├── app/
   ├── components/ui/
   ├── components/layout/
   ├── hooks/
   ├── lib/
   ├── store/
   ├── styles/
   ├── types/
   └── prisma/
   ```
4. Cài dependencies ban đầu:
   ```bash
   npm install @prisma/client next-auth swr zustand zod react-hook-form
   npm install -D prisma @types/node
   ```

**DoD:**
- [ ] `npm run dev` → localhost:3000 hiện page trắng không lỗi
- [ ] Cấu trúc thư mục đúng như trên
- [ ] TypeScript strict mode bật (`strict: true` trong tsconfig)

---

## Task 0.2: Cấu hình Design Tokens (Tailwind + CSS Variables)

**ID:** `FOUND-002`  
**Output:** `tailwind.config.ts` + `src/styles/globals.css`  
**Source of Truth:** `design-tokens.md` — copy nguyên config vào project

**Các bước chi tiết:**
1. Thay nội dung `tailwind.config.ts` bằng config từ `design-tokens.md §1`
2. Thay nội dung `globals.css` bằng CSS variables từ `design-tokens.md §2`
3. Cấu hình Google Fonts trong `src/app/layout.tsx` theo `design-tokens.md §3` (dùng `next/font/google`, KHÔNG dùng `<link>` tag)
4. Tạo thư mục `src/styles/textures/` và thêm placeholder textures:
   - `natural-paper.png` (parchment texture)
   - `wood-grain.png` (lacquer texture)
5. Kiểm tra: tất cả 6 font families load đúng, CSS variables khớp PRD-00 §2

**AI Prompt mẫu:**
> Đọc file `docs/implementation/design-tokens.md` và áp dụng vào project:
> 1. Copy Tailwind config vào `tailwind.config.ts`
> 2. Copy CSS variables vào `src/styles/globals.css`
> 3. Setup Google Fonts trong `src/app/layout.tsx` dùng `next/font/google`
> Đảm bảo tất cả color tokens và font families hoạt động đúng.

**DoD:**
- [ ] `bg-primary`, `text-gold-leaf`, `bg-parchment` render đúng màu
- [ ] `font-display`, `font-header`, `font-ornate` load font đúng
- [ ] `.card-parchment`, `.btn-lacquer`, `.btn-gold-shimmer` classes hoạt động
- [ ] `.deceased-filter` tạo grayscale effect
- [ ] `prefers-reduced-motion` disable animations

---

## Task 0.3: Setup Prisma + PostgreSQL

**ID:** `FOUND-003`  
**Output:** `prisma/schema.prisma` + Docker PostgreSQL  
**Source of Truth:** `database-schema.md`

**Các bước chi tiết:**
1. Cài Prisma: `npm install -D prisma && npx prisma init`
2. Setup Docker cho PostgreSQL local:
   ```yaml
   # docker-compose.yml
   services:
     db:
       image: postgres:16-alpine
       ports: ["5432:5432"]
       environment:
         POSTGRES_DB: heritage_cloud
         POSTGRES_USER: admin
         POSTGRES_PASSWORD: dev_password_only
       volumes: ["pgdata:/var/lib/postgresql/data"]
   volumes:
     pgdata:
   ```
3. Cập nhật `.env`: `DATABASE_URL="postgresql://admin:dev_password_only@localhost:5432/heritage_cloud"`
4. Copy Prisma schema từ `database-schema.md §5 (Prisma Schema)` vào `prisma/schema.prisma`
5. Chạy migration: `npx prisma migrate dev --name init`
6. Chạy `npx prisma generate`

**AI Prompt mẫu:**
> Đọc file `docs/db-design/database-schema.md` section "5. Prisma Schema".
> 1. Copy toàn bộ Prisma schema vào `prisma/schema.prisma`
> 2. Tạo `docker-compose.yml` cho PostgreSQL 16
> 3. Cấu hình `.env` với DATABASE_URL
> 4. Chạy `npx prisma migrate dev --name init`

**DoD:**
- [ ] Docker container PostgreSQL chạy OK
- [ ] `npx prisma migrate dev` tạo 17 tables không lỗi
- [ ] `npx prisma studio` mở được, thấy tất cả tables
- [ ] Enums (gender_type, user_role, etc.) tạo đúng

---

## Task 0.4: Setup NextAuth.js

**ID:** `FOUND-004`  
**Output:** `/api/auth/[...nextauth]/route.ts` + login/logout hoạt động

**Các bước chi tiết:**
1. Cài: `npm install next-auth bcrypt && npm install -D @types/bcrypt`
2. Tạo `src/lib/auth.ts` — NextAuth config:
   - Credentials provider (email + password)
   - JWT strategy (stateless sessions)
   - Session callback: inject `userId`, `role`, `clanId` vào JWT
   - Từ `tech-architecture.md §3.2`
3. Tạo `src/app/api/auth/[...nextauth]/route.ts`
4. Tạo `src/hooks/useAuth.ts` — wrapper hook cho `useSession()` + role helpers
5. Tạo `src/lib/permissions.ts` — RBAC functions:
   - `requireRole(session, ...roles)` — từ `tech-architecture.md §3.3`
   - `requireSameClan(session, clanId)`
6. Tạo `.env.local`: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

**AI Prompt mẫu:**
> Setup NextAuth.js cho project Heritage Cloud:
> 1. Credentials provider (email + password, bcrypt)
> 2. JWT session strategy
> 3. Session callback inject userId, role, clanId từ database
> 4. RBAC helper functions theo `docs/implementation/tech-architecture.md §3.3`
> 5. Hook `useAuth.ts` wrap useSession với role checking
> Tham khảo RBAC matrix tại PRD-00 §8.

**DoD:**
- [ ] POST `/api/auth/signin` với email/password → trả JWT cookie
- [ ] GET `/api/auth/session` → trả `{ user: { id, role, clanId, name } }`
- [ ] `requireRole(session, 'HEAD_OF_HOUSE')` throw 403 nếu role khác
- [ ] `requireSameClan()` ngăn cross-clan access
- [ ] Logout xoá session cookie

---

## Task 0.5: Build UI Kit Components

**ID:** `FOUND-005`  
**Output:** `src/components/ui/` — 10 components cơ bản  
**Source of Truth:** PRD-00 §4, `design-tokens.md §4`

**Các bước chi tiết:**
1. **ParchmentCard** — card với texture background, gold border, inner border pseudo-element, hover scale
2. **LacquerButton** — gradient crimson, gold text, Cinzel font, hover brightness
3. **GoldShimmerButton** — gold gradient, dark text, uppercase, heavy weight
4. **StatusBadge** — Active (crimson), Available (green), Pending (amber), Completed (green)
5. **DeceasedAvatar** — grayscale filter, gold border, lotus badge, hover restore color
6. **WoodCarvingBorder** — border-image diagonal gradient
7. **GoldLeafFrame** — gold border + inner pseudo-element frame
8. **SkeletonLoader** — shimmer animation, parchment colors
9. **ConfirmDialog** — destructive action modal, crimson warning icon, cancel/confirm buttons
10. **Toast** — slide-in notification, crimson background, auto-dismiss 5s

**AI Prompt mẫu (ví dụ cho ParchmentCard):**
> Tạo React component `src/components/ui/ParchmentCard.tsx`:
> - Sử dụng Tailwind class `.card-parchment` đã định nghĩa trong config
> - Props: `children`, `className?`, `hoverable?: boolean`
> - Wrapper `<div>` với rounded-lg, padding tùy caller
> - Tham khảo PRD-00 §4.1 cho styling chi tiết
> - Dùng `forwardRef` để hỗ trợ ref passing

**DoD:**
- [ ] Tất cả 10 components render đúng theo PRD-00 §4
- [ ] `DeceasedAvatar` hiện grayscale + lotus badge + hover transition 700ms
- [ ] `StatusBadge` hiện đúng 4 variants
- [ ] `Toast` auto-dismiss sau 5s
- [ ] `ConfirmDialog` có cancel + confirm buttons
- [ ] Components nhận `className` prop để extend
- [ ] Accessible: keyboard navigation, ARIA labels

---

## Task 0.6: Build Layout Components

**ID:** `FOUND-006`  
**Output:** `src/components/layout/` — GlobalHeader, Sidebar, DetailPanel, MobileBottomSheet

**Các bước chi tiết:**
1. **GlobalHeader** — PRD-00 §6.1:
   - Logo "Heritage Cloud" + `account_tree` icon → link to `/`
   - Search bar (expandable on mobile)
   - Nav links: Lineage | Map | Rituals | Legacy
   - User controls: notification bell (badge count), settings, avatar dropdown
   - Ẩn trên Homepage (Homepage dùng Imperial Banner riêng)
2. **Sidebar** — PRD-00 §6.1:
   - Slot-based: mỗi module truyền nav items khác nhau
   - Collapse/expand toggle
   - Responsive: drawer on mobile (hamburger trigger)
3. **DetailPanel** — PRD-00 §6.1:
   - Right-side slide-in panel (384px)
   - Animation: `animate-slide-in-right`
   - Close button + click-outside to dismiss
   - Responsive: bottom sheet on mobile
4. **MobileBottomSheet** — cho detail panels trên mobile
   - Drag handle, snap points (half/full screen)

**DoD:**
- [ ] GlobalHeader hiện trên mọi page trừ `/` (Homepage)
- [ ] Nav links route đúng: `/lineage`, `/map`, `/rituals`, `/duties`
- [ ] Sidebar collapse/expand hoạt động
- [ ] DetailPanel slide-in từ phải, close khi click outside
- [ ] Responsive: sidebar → drawer, detail panel → bottom sheet trên mobile
- [ ] Focus trap trong modal/panel khi mở

---

## Task 0.7: Seed Data

**ID:** `FOUND-007`  
**Output:** `prisma/seed.ts`

**Các bước chi tiết:**
1. Tạo seed data theo `database-schema.md §6 (Seed Data Strategy)`:
   - 1 clan "Họ Nguyễn Phúc"
   - 2 users (1 HEAD_OF_HOUSE, 1 MEMBER)
   - 15-20 members across 5 generations
   - Relationships (parent-child, spouse)
   - 3-5 grave sites với coordinates
   - 5-8 ritual events (cả recurring và one-time)
   - 10-15 duties (mix Queue/Active/Completed)
2. Update `package.json`: `"prisma": { "seed": "ts-node prisma/seed.ts" }`
3. Chạy: `npx prisma db seed`

**AI Prompt mẫu:**
> Tạo `prisma/seed.ts` cho Heritage Cloud dev environment.
> Dùng Prisma client để tạo:
> - 1 Clan "Họ Nguyễn Phúc"
> - 2 Users (1 HEAD_OF_HOUSE email: admin@test.com / pw: Test1234, 1 MEMBER)
> - 15 Members across 5 generations (mix sống/đã mất, đầy đủ fields)
> - Relationships: parent-child chains, 3 couples
> - 5 GraveSites với toạ độ thực (khu vực Huế)
> - 5 RitualEvents (lịch giỗ hàng năm, lunar dates)
> - 10 Duties (4 QUEUE, 3 ACTIVE, 3 COMPLETED)
> Hash passwords bằng bcrypt. Tham khảo schema tại `docs/db-design/database-schema.md`.

**DoD:**
- [ ] `npx prisma db seed` chạy không lỗi
- [ ] Prisma Studio hiện data đầy đủ trong tất cả tables
- [ ] Login được với `admin@test.com` / `Test1234`
- [ ] Members có đủ lineage chain (grandparent → parent → child)

---

## Task 0.8: Setup CI/CD & Dev Tools

**ID:** `FOUND-008`  
**Output:** ESLint config, Prettier config, Husky hooks, GitHub Actions workflow

**Các bước chi tiết:**
1. ESLint: extend `next/core-web-vitals` + `typescript-eslint`
2. Prettier: `semi: true`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: 'all'`
3. Husky + lint-staged:
   ```bash
   npx husky init
   npm install -D lint-staged
   ```
   Pre-commit: `lint-staged` chạy ESLint + Prettier trên staged files
4. Vitest config:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```
5. GitHub Actions: `.github/workflows/ci.yml`
   - Trigger on: push to main, PR
   - Steps: install → lint → typecheck → test → build

**DoD:**
- [ ] `npm run lint` chạy không lỗi
- [ ] Git commit trigger husky → lint-staged
- [ ] `npm run test` chạy Vitest
- [ ] Push to GitHub → Actions workflow passes

---

## Tổng kết Phase 0

**Thứ tự thực hiện:**
```
FOUND-001 (init project)
    ↓
FOUND-002 (design tokens) ←→ FOUND-003 (database) — song song
    ↓                              ↓
FOUND-004 (auth)              FOUND-007 (seed data)
    ↓
FOUND-005 (UI kit)
    ↓
FOUND-006 (layout)
    ↓
FOUND-008 (CI/CD)
```

**Checklist tổng (Phase 0 Definition of Done):**
- [ ] `npm run dev` khởi chạy không lỗi
- [ ] Design tokens khớp PRD-00 (colors, fonts, components)
- [ ] Database 17 tables + seed data loaded
- [ ] Login/logout hoạt động
- [ ] 10 UI Kit components + 4 Layout components render đúng
- [ ] CI pipeline: lint + typecheck + test + build pass
