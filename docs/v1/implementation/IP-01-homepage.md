# IP-01: Homepage — Imperial Decree Legacy Dashboard

> **Phase:** 1 (sau Phase 0)  
> **Mục tiêu:** Trang chủ hiển thị với phong cách Hoàng Gia, kết nối data từ clan/rituals/duties API  
> **Depends on:** IP-00 (Foundation — UI Kit, Auth, Database, Seed Data)  
> **PRD Reference:** PRD-01-homepage.md  
> **API Reference:** `api-design.md §9` (Clan Stats)

---

## Task 1.1: Imperial Decree Banner (Hero Section)

**ID:** `HOME-001`  
**Output:** `src/app/page.tsx` + `src/components/homepage/ImperialBanner.tsx`

**Các bước chi tiết:**
1. Tạo file `src/app/page.tsx` — Homepage (KHÔNG dùng GlobalHeader, dùng banner riêng)
2. Build component `ImperialBanner.tsx`:
   - Full-width parchment background (texture `natural-paper.png` + gradient)
   - Scroll decoration: CSS `::before` / `::after` pseudo-elements cho cuộn giấy hai đầu
   - Bên trong banner:
     - Family crest / lotus icon (Material Symbol `filter_vintage`, 6xl, antique-gold)
     - Family name: font-ornate, text-7xl đến 9xl, gold-leaf gradient text (`bg-clip-text text-transparent bg-gold-shimmer`)
     - Subtitle: font-calligraphy, text-3xl, text-antique-gold
   - Ornate navigation bar bên dưới:
     - 4 links: Sanctum (Homepage) | Scrolls (Lineage) | Altar (Map) | Rites (Calendar)
     - Font-header, uppercase, tracking-widest
     - Active: underline accent-gold
     - Phân cách bằng gold decorative dots
3. Background image: dùng Next.js `<Image priority placeholder="blur">` cho LCP optimization

**AI Prompt mẫu:**
> Tạo Homepage tại `src/app/page.tsx` cho Heritage Cloud.
> 1. Component `ImperialBanner` — full-width parchment hero section:
>    - Scroll decoration CSS pseudo-elements (cuộn giấy hai đầu)
>    - Family name "Họ Nguyễn Phúc" — font Cinzel Decorative, text-7xl, gold gradient text
>    - Subtitle — font Pinyon Script, text-3xl
>    - Navigation: Sanctum | Scrolls | Altar | Rites — font Cinzel, uppercase, tracking-widest
> 2. KHÔNG dùng GlobalHeader, page này có banner riêng
> 3. Dùng design tokens từ `tailwind.config.ts`
> Tham khảo: PRD-01 §3.1

**DoD:**
- [ ] Banner render full-width với parchment texture
- [ ] Family name hiện gold gradient text, font Cinzel Decorative
- [ ] Scroll decorations visible ở hai đầu banner
- [ ] 4 nav links route đúng: `/`, `/lineage`, `/map`, `/rituals`
- [ ] LCP < 2.5s (parchment image preloaded)

---

## Task 1.2: Family Identity Section

**ID:** `HOME-002`  
**Output:** `src/components/homepage/FamilyIdentity.tsx`

**Các bước chi tiết:**
1. Section ngay dưới banner:
   - Family name lặp lại (nhỏ hơn, font-header, text-3xl)
   - Ancestral quote: font-calligraphy, text-2xl, text-antique-gold, italic
     - Ví dụ: "Uống nước nhớ nguồn — Ăn quả nhớ kẻ trồng cây"
   - Head of House info:
     - Avatar (80px, rounded-full, border-2 border-accent-gold)
     - Name + title "Trưởng Tộc" (font-header, text-gold-leaf)
     - Generation badge
2. Data fetching: React Server Component fetch `/api/v1/clan` (SSR)
3. Skeleton loading state cho avatar + name

**DoD:**
- [ ] Ancestral quote render đúng font calligraphy
- [ ] Head of House avatar + name load từ API
- [ ] Skeleton hiện khi đang load

---

## Task 1.3: Eternal Timeline (Upcoming Events)

**ID:** `HOME-003`  
**Output:** `src/components/homepage/EternalTimeline.tsx`

**Các bước chi tiết:**
1. Vertical timeline component:
   - Center line: 2px solid antique-gold
   - 3-5 upcoming events, xen kẽ trái/phải (desktop), stack dọc (mobile)
   - Mỗi event card (ParchmentCard):
     - Date badge: crimson circle, font-header, ngày tháng
     - Event title: font-display, bold
     - Description: font-sans, text-sm, clamp 2 lines
     - Status: "📅 In 3 Days" / "⏰ Tomorrow" / "🔴 Today" badge
   - Past events: opacity-50, muted colors
   - Timeline dots: 12px circles, accent-gold fill, border-2 white
2. Data: fetch `/api/v1/rituals?upcoming=true&limit=5` (SSR)
3. Nếu không có events: EmptyState "No upcoming rituals"

**AI Prompt mẫu:**
> Tạo `EternalTimeline.tsx` — vertical timeline cho Homepage:
> 1. Fetch từ `/api/v1/rituals?upcoming=true&limit=5`
> 2. Center line 2px antique-gold, event cards xen kẽ trái/phải
> 3. Mỗi card: ParchmentCard wrapper, date badge, title, description (2 lines), countdown badge
> 4. Past events muted (opacity-50)
> 5. Responsive: stack dọc trên mobile
> 6. EmptyState nếu không có events
> Tham khảo: PRD-01 §3.3, dùng component ParchmentCard từ UI Kit

**DoD:**
- [ ] Timeline hiện 3-5 events với center line
- [ ] Countdown badge đúng ("In 3 Days", "Tomorrow", "Today")
- [ ] Desktop: xen kẽ trái/phải; Mobile: stack dọc
- [ ] EmptyState khi không có data

---

## Task 1.4: Sacred Duties Panel

**ID:** `HOME-004`  
**Output:** `src/components/homepage/SacredDuties.tsx`

**Các bước chi tiết:**
1. Section title: "Sacred Duties — Bổn Phận Gia Tộc"
2. 2-column grid (desktop), 1-column (mobile)
3. Mỗi duty card:
   - Category tag (RELIGIOUS crimson, MAINTENANCE amber, ARCHIVAL blue, SOCIAL green)
   - Title + description (clamp 2 lines)
   - Priority badge (HIGH = border-2 border-primary)
   - Assignee avatar (24px, rounded-full) + name
   - Due date
4. Header: "Pending Decrees" count badge (crimson circle)
5. Data: Client Component + SWR fetch `/api/v1/duties?status=QUEUE&status=ACTIVE&limit=6`
6. "View All Duties" link → `/duties`

**DoD:**
- [ ] 2-column grid desktop, 1-column mobile
- [ ] Category tags đúng màu (4 loại)
- [ ] Priority badge hiện cho HIGH/URGENT
- [ ] "Pending Decrees" count cập nhật real-time (SWR)
- [ ] "View All Duties" link route đúng

---

## Task 1.5: CTA Block + Footer

**ID:** `HOME-005`  
**Output:** `src/components/homepage/ImperialCTA.tsx` + `src/components/homepage/Footer.tsx`

**Các bước chi tiết:**
1. **CTA Block:**
   - Gold-leaf-frame wrapper
   - Motivational quote: font-calligraphy, text-xl
   - "Enter Life Tree" button → `/lineage` (btn-gold-shimmer, large)
   - "Inscribe Ritual" button → `/rituals` (btn-lacquer)
2. **Lacquer Pillar Sidebars** (desktop ≥1024px only):
   - Fixed position left/right decorative pillars
   - Background: royal-lacquer
   - Dragon motif: CSS border or SVG
   - Vertical Vietnamese text: `writing-mode: vertical-rl`
   - Hidden on tablet/mobile
3. **Footer:**
   - Decorative divider (gold gradient line)
   - Tagline: "Heritage Cloud — Gìn giữ di sản dòng tộc"
   - Year: Roman numeral (MMXXVI = 2026)

**DoD:**
- [ ] CTA buttons route đúng (`/lineage`, `/rituals`)
- [ ] Lacquer pillars visible trên desktop ≥1024px, ẩn trên mobile
- [ ] Vertical Vietnamese text hiện đúng trong pillars
- [ ] Footer hiện decorative divider + tagline + Roman year

---

## Task 1.6: Homepage Assembly & Responsive

**ID:** `HOME-006`  
**Output:** `src/app/page.tsx` hoàn chỉnh

**Các bước chi tiết:**
1. Assemble tất cả sections theo thứ tự:
   ```
   ImperialBanner
   FamilyIdentity
   EternalTimeline
   SacredDuties
   ImperialCTA
   LacquerPillars (fixed position overlay)
   Footer
   ```
2. Kiểm tra responsive ở 4 breakpoints: mobile (<768), tablet (768-1023), desktop (1024-1399), wide (≥1400)
3. Kiểm tra performance:
   - LCP < 2.5s (banner image)
   - CLS < 0.1 (skeleton loaders prevent layout shift)
   - TTI < 3.5s
4. Scroll behavior: smooth scroll giữa các sections

**DoD:**
- [ ] Homepage render đầy đủ tất cả sections
- [ ] Responsive: mọi breakpoint hiện đúng
- [ ] LCP < 2.5s (Lighthouse audit)
- [ ] Accessibility: tab navigation qua tất cả interactive elements
- [ ] No console errors

---

## Tổng kết IP-01

**Thứ tự thực hiện:**
```
HOME-001 (Banner) → HOME-002 (Family Identity)
                  → HOME-003 (Timeline)     — song song với HOME-004
                  → HOME-004 (Duties Panel)
                  → HOME-005 (CTA + Footer)
                  → HOME-006 (Assembly + QA)
```

**Phase 1 Definition of Done tổng:**
- [ ] Homepage render với imperial decree style đầy đủ
- [ ] Data load từ API (clan stats, rituals, duties)
- [ ] Tất cả CTA buttons route đúng
- [ ] Responsive 4 breakpoints
- [ ] LCP < 2.5s, WCAG accessible
