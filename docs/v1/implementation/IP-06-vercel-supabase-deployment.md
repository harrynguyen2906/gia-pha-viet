# IP-06: Vercel + Supabase Deployment

> **Phase:** 6 — Deploy lên Production  
> **Mục tiêu:** Deploy Heritage Cloud lên Vercel, dùng Supabase làm database backend  
> **Depends on:** IP-00 (Foundation), tất cả modules đã hoạt động local  
> **PRD Reference:** PRD-06 Vercel + Supabase Deployment  
> **Docs Reference:** `RF-02-vercel-supabase-deployment.md`

---

## Task 6.1: Tạo Supabase Project

**ID:** `DEPLOY-001`  
**Output:** Supabase project sẵn sàng với database trống

**Các bước chi tiết:**

1. Đăng nhập [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project** → đặt tên `heritage-cloud` hoặc `gia-pha-viet`
3. Chọn region **Southeast Asia (Singapore)** — gần người dùng Việt Nam
4. Đặt database password mạnh — **lưu an toàn**
5. Vào **Project Settings → Database** → copy 2 connection strings:
   - **Transaction pooler** (port 6543) → dùng làm `DATABASE_URL`
   - **Direct connection** (port 5432) → dùng làm `DIRECT_URL`

**DoD:**

- [ ] Supabase project tạo thành công
- [ ] Có 2 connection strings (pooler + direct)
- [ ] Dashboard accessible, database trống

---

## Task 6.2: Cập nhật Environment Variables Local

**ID:** `DEPLOY-002`  
**Output:** `.env.local` cập nhật với Supabase connection strings

**Các bước chi tiết:**

1. Mở `.env.local` và thay thế `DATABASE_URL` và `DIRECT_URL`:
   ```env
   DATABASE_URL="postgres://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgres://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
   ```
2. Giữ nguyên các biến khác (`AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

**DoD:**

- [ ] `.env.local` có `DATABASE_URL` trỏ đến Supabase pooler (port 6543)
- [ ] `.env.local` có `DIRECT_URL` trỏ đến Supabase direct (port 5432)

---

## Task 6.3: Apply Prisma Migrations lên Supabase

**ID:** `DEPLOY-003`  
**Output:** 17 tables tạo thành công trên Supabase

**Các bước chi tiết:**

1. Chạy migrations:
   ```bash
   npx prisma migrate deploy
   ```
2. Nếu migration fail, dùng `prisma db push` (force-push schema):
   ```bash
   npx prisma db push
   ```
3. Kiểm tra trên **Supabase Dashboard → Table Editor** — xác nhận 17 tables

> ⚠️ **Quan trọng:** `prisma migrate deploy` phải dùng `DIRECT_URL` (port 5432). PgBouncer (port 6543) KHÔNG hỗ trợ DDL statements.

**DoD:**

- [ ] `npx prisma migrate deploy` chạy success
- [ ] 17 tables hiển thị trong Supabase Table Editor
- [ ] Enums (`GenderType`, `UserRole`, etc.) tạo đúng

---

## Task 6.4: Seed Data (Optional)

**ID:** `DEPLOY-004`  
**Output:** Data mẫu trong Supabase

**Các bước chi tiết:**

1. Chạy seed:
   ```bash
   npx tsx prisma/seed.ts
   ```
2. Kiểm tra Supabase Dashboard — confirm data trong `clans`, `members`, `users`, `ritual_events`, `duties`

**DoD:**

- [ ] Seed data loaded vào Supabase
- [ ] Login được với credentials từ seed (`admin@test.com` / `Test1234`)

---

## Task 6.5: Cập nhật Code cho Vercel Compatibility

**ID:** `DEPLOY-005`  
**Output:** 4 files cập nhật sẵn sàng cho Vercel

**Các bước chi tiết:**

### 6.5.1 `src/lib/prisma.ts`

- Đổi `DIRECT_URL` → `DATABASE_URL` cho kết nối runtime
- Tăng `connectionTimeoutMillis` lên 10000 (serverless cold starts)
- Giảm `idleTimeoutMillis` xuống 20000

### 6.5.2 `next.config.ts`

- Thêm `serverExternalPackages: ["bcrypt"]` — bcrypt native module cần exclude khỏi serverless bundle
- Thêm `images.remotePatterns` cho `*.supabase.co` — chuẩn bị cho Supabase Storage

### 6.5.3 `package.json`

- Thêm script `"postinstall": "prisma generate"` — auto-generate Prisma client sau `npm install` trên Vercel

### 6.5.4 `.env.example`

- Cập nhật template connection strings theo format Supabase

**DoD:**

- [ ] `prisma.ts` dùng `DATABASE_URL`
- [ ] `next.config.ts` có `serverExternalPackages` và `images.remotePatterns`
- [ ] `package.json` có script `postinstall`
- [ ] `.env.example` có Supabase format
- [ ] `npx prisma generate` chạy thành công
- [ ] `npm run build` pass local

---

## Task 6.6: Push lên GitHub

**ID:** `DEPLOY-006`  
**Output:** Code trên GitHub, sẵn sàng import vào Vercel

**Các bước chi tiết:**

1. Tạo repo trên GitHub (nếu chưa có)
2. Kiểm tra `.gitignore` — đảm bảo các file sau KHÔNG bị push:
   - `.env`, `.env.local` (secrets)
   - `node_modules/`
   - `.next/`
   - `src/generated/prisma/` (auto-generated)
3. Commit và push:
   ```bash
   git add .
   git commit -m "feat: prepare for Vercel + Supabase deployment"
   git push origin main
   ```

**DoD:**

- [ ] Repo trên GitHub, branch `main` cập nhật
- [ ] Không có secrets trong commit history

---

## Task 6.7: Deploy lên Vercel

**ID:** `DEPLOY-007`  
**Output:** App chạy trên `https://your-domain.vercel.app`

**Các bước chi tiết:**

1. Vào [vercel.com/new](https://vercel.com/new) → **Import** repo từ GitHub
2. Vercel auto-detect **Next.js** → accept defaults
3. Cấu hình **Build Settings**:
   | Setting | Value |
   |---------|-------|
   | Framework | Next.js |
   | Build Command | `npx prisma generate && next build` |
   | Install Command | `npm install` |
   | Node.js | 20.x |
4. Thêm **Environment Variables**:
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Supabase pooler URL (port 6543) |
   | `DIRECT_URL` | Supabase direct URL (port 5432) |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key |
5. Click **Deploy**

**DoD:**

- [ ] Vercel build pass (no errors)
- [ ] App accessible tại Vercel URL
- [ ] Deployment logs không có warning nghiêm trọng

---

## Task 6.8: Kiểm tra Post-Deployment

**ID:** `DEPLOY-008`  
**Output:** Tất cả features hoạt động trên production

**Checklist kiểm tra:**

- [ ] Trang chủ (`/`) load đúng — hero banner, navigation
- [ ] Login (`/auth/signin`) hoạt động — JWT token set
- [ ] Lineage (`/lineage`) — cây gia phả render
- [ ] Map (`/map`) — Google Maps load với markers
- [ ] Rituals (`/rituals`) — lịch nghi lễ hiển thị
- [ ] Duties (`/duties`) — Kanban board render
- [ ] API routes (`/api/members`, etc.) trả data từ Supabase
- [ ] Browser console không có errors nghiêm trọng

---

## Task 6.9: Custom Domain (Optional)

**ID:** `DEPLOY-009`  
**Output:** App chạy trên custom domain

**Các bước chi tiết:**

1. Vào **Vercel → Project Settings → Domains**
2. Thêm domain (ví dụ: `giapha.vn`, `heritagecloud.vn`)
3. Cấu hình DNS records theo hướng dẫn Vercel
4. Cập nhật `NEXTAUTH_URL` trong Vercel env vars → custom domain
5. Cập nhật Google Maps API key restrictions → thêm custom domain

**DoD:**

- [ ] Custom domain trỏ đến Vercel deployment
- [ ] HTTPS certificate active
- [ ] `NEXTAUTH_URL` khớp custom domain

---

## Tổng kết Phase 6

**Thứ tự thực hiện:**

```
DEPLOY-001 (Supabase project)
    ↓
DEPLOY-002 (env vars) → DEPLOY-003 (migrations) → DEPLOY-004 (seed)
    ↓
DEPLOY-005 (code changes)
    ↓
DEPLOY-006 (GitHub push)
    ↓
DEPLOY-007 (Vercel deploy)
    ↓
DEPLOY-008 (verification)
    ↓
DEPLOY-009 (custom domain — optional)
```

**Checklist tổng (Phase 6 Definition of Done):**

- [ ] Supabase database chạy với 17 tables + seed data
- [ ] Vercel deployment success, app accessible online
- [ ] Auth, lineage, map, rituals, duties — tất cả hoạt động
- [ ] Không có secrets trong source code
- [ ] `.env.example` cập nhật cho developers mới
