# IP-07: Landing Page Implementation Plan

> **Phase:** V2 — Public Marketing Landing Page  
> **PRD Reference:** PRD-07-landing-page.md  
> **Depends on:** V1 complete (design system, UI components exist)  
> **Design Reference:** `v1/ui/0.0.landingpage.html`  
> **Estimated Effort:** 1 sprint (5–7 days)

---

## Overview

Convert the current root page (`/`) from an authenticated homepage into a **public marketing landing page**. The authenticated homepage moves to `/dashboard`.

---

## Task 1: Route Restructuring

**ID:** `LP-001`  
**Output:** Updated Next.js route structure

### Steps

1. Create route group `(marketing)` for public pages:
   ```
   src/app/
   ├── (marketing)/
   │   ├── layout.tsx          # Public layout (no sidebar, no auth check)
   │   └── page.tsx            # Landing page (current root /)
   ├── (app)/
   │   ├── layout.tsx          # Authenticated layout (sidebar + header)
   │   ├── page.tsx            # Dashboard homepage (was previously /)
   │   ├── lineage/
   │   ├── map/
   │   ├── rituals/
   │   └── duties/
   ```

2. Move current `src/app/page.tsx` (homepage) → `src/app/(app)/page.tsx`
3. Move current `src/app/layout.tsx` authenticated parts → `src/app/(app)/layout.tsx`
4. Create `src/app/(marketing)/layout.tsx` — minimal layout, no auth provider wrapping body
5. Create `src/app/(marketing)/page.tsx` — new landing page (server component)

### Key Decisions
- `(marketing)` route group: No auth middleware, no sidebar
- `(app)` route group: Protected by auth middleware, full app chrome
- Root `layout.tsx` remains for shared `<html>`, fonts, providers

### DoD
- [x] `/` shows landing page (public, no login required)
- [x] `/lineage`, `/map`, `/rituals`, `/duties` redirect to login if unauthenticated
- [x] Previously authenticated users visiting `/` see "Go to Dashboard" in nav

---

## Task 2: Marketing Layout Component

**ID:** `LP-002`  
**Output:** `src/app/(marketing)/layout.tsx`

### Steps

1. Create `MarketingHeader` component:
   ```tsx
   // src/components/marketing/MarketingHeader.tsx
   // - Logo (left)
   // - Nav links: Features | About (center, hidden on mobile)
   // - Auth buttons: Sign In (outline) | Start Free (primary CTA)
   // - Mobile: hamburger menu
   // - Transparent → solid on scroll (useEffect + IntersectionObserver)
   ```

2. Create `MarketingFooter` component:
   ```tsx
   // src/components/marketing/MarketingFooter.tsx
   // - 4-column grid (logo, links, legal, contact)
   // - Gold lotus divider
   // - Copyright bar
   ```

3. Layout wraps children with header + footer:
   ```tsx
   export default function MarketingLayout({ children }) {
     return (
       <>
         <MarketingHeader />
         <main>{children}</main>
         <MarketingFooter />
       </>
     );
   }
   ```

### DoD
- [x] Header is transparent on hero, solid on scroll
- [x] Mobile hamburger menu opens/closes
- [x] "Sign In" → navigates to `/auth/signin`
- [x] "Start Free" → navigates to `/auth/register`
- [x] Footer renders 4 columns on desktop, stacked on mobile

---

## Task 3: Hero Section

**ID:** `LP-003`  
**Output:** `src/components/marketing/HeroSection.tsx`

### Steps

1. Full-viewport height section with background image
2. Use `next/image` with `priority` for hero background (LCP optimization)
3. Imperial scroll motif framing CTA area (reuse `.imperial-scroll` CSS)
4. Headline + subheadline + 2 CTA buttons
5. CSS animation: fade-in on load, incense smoke particles (optional, CSS-only)
6. Respect `prefers-reduced-motion`

### Content (Vietnamese)
```
Headline: "Lưu Giữ Di Sản — Kết Nối Thế Hệ"
Subheadline: "Nền tảng gia phả số giúp gia đình Việt Nam gìn giữ truyền thống, kết nối thế hệ và quản lý nghi lễ tổ tiên."
CTA Primary: "Bắt Đầu Miễn Phí"
CTA Secondary: "Tìm Hiểu Thêm"
```

### DoD
- [x] Hero fills viewport height
- [x] Background image loads with priority
- [x] CTAs route correctly
- [x] Responsive: stacked on mobile, side-by-side on desktop

---

## Task 4: Features Showcase Section

**ID:** `LP-004`  
**Output:** `src/components/marketing/FeaturesSection.tsx`

### Steps

1. Section with anchor `id="features"` (for smooth scroll from hero CTA)
2. 6 feature cards in 3×2 grid (desktop) / 2×3 (tablet) / 1×6 (mobile)
3. Each card uses `ParchmentCard` style with:
   - Lucide icon (from existing `lucide-react` dependency)
   - Feature title (Vietnamese)
   - Feature description (2 sentences)
4. Intersection Observer for staggered fade-in animation

### Feature Cards Data
```typescript
const features = [
  { icon: "GitBranch", title: "Gia Phả Số", desc: "Trực quan hóa cây phả hệ..." },
  { icon: "UserCircle", title: "Hồ Sơ Kỹ Thuật Số", desc: "Hồ sơ chi tiết..." },
  { icon: "MapPin", title: "Bản Đồ Tổ Tiên", desc: "Theo dõi và thăm viếng..." },
  { icon: "CalendarHeart", title: "Lịch Giỗ Chạp", desc: "Không bỏ lỡ ngày giỗ..." },
  { icon: "ClipboardList", title: "Quản Lý Bổn Phận", desc: "Phân công và theo dõi..." },
  { icon: "ShieldCheck", title: "An Toàn & Bảo Mật", desc: "Dữ liệu gia đình được mã hóa..." },
];
```

### DoD
- [x] 6 cards render in correct grid layout
- [x] Stagger animation works on scroll
- [x] All icons render from lucide-react
- [x] Responsive grid adjusts per breakpoint

---

## Task 5: How It Works Section

**ID:** `LP-005`  
**Output:** `src/components/marketing/HowItWorksSection.tsx`

### Steps

1. Section with anchor `id="how-it-works"`
2. Horizontal 3-step timeline (desktop), vertical (mobile)
3. Gold connecting line between steps
4. Step badges: numbered circles with gold border
5. Each step: icon + title + description

### DoD
- [x] 3 steps display with connecting timeline
- [x] Responsive: horizontal → vertical on mobile
- [x] Gold accent styling matches design system

---

## Task 6: Social Proof & Stats Section

**ID:** `LP-006`  
**Output:** `src/components/marketing/SocialProofSection.tsx`

### Steps

1. Stats counter row: 3 animated counters
2. Use `useRef` + `IntersectionObserver` to trigger count-up animation
3. Placeholder testimonial cards (2-3 quotes)
4. Counter values can be hardcoded for now, later pulled from API

### DoD
- [x] Counter animation triggers on scroll-into-view
- [x] Testimonial cards render with quote + author
- [x] Respects reduced-motion preference

---

## Task 7: CTA Banner + Assembly

**ID:** `LP-007`  
**Output:** Final `src/app/(marketing)/page.tsx`

### Steps

1. Create `CTABannerSection.tsx` — full-width crimson banner
2. Assemble all sections in the landing page:
   ```tsx
   export default function LandingPage() {
     return (
       <>
         <HeroSection />
         <FeaturesSection />
         <HowItWorksSection />
         <SocialProofSection />
         <CTABannerSection />
       </>
     );
   }
   ```
3. Add SEO meta tags via Next.js metadata API:
   ```tsx
   export const metadata: Metadata = {
     title: "Heritage Cloud — Lưu Giữ Di Sản Gia Phả Việt Nam",
     description: "Nền tảng gia phả số cho gia đình Việt Nam...",
     openGraph: { ... },
   };
   ```

### DoD
- [x] All sections render in correct order
- [x] Meta tags present in page source
- [x] Smooth scroll anchors work (#features, #how-it-works)
- [x] Page is fully server-rendered (minimal client JS)
- [x] Lighthouse performance score > 90

---

## Task 8: Auth-Aware Header Logic

**ID:** `LP-008`  
**Output:** Updated `MarketingHeader` with auth awareness

### Steps

1. Check session server-side in `MarketingHeader`
2. If authenticated: show "Vào Trang Chủ" (Go to Dashboard) button instead of Sign In / Register
3. If not authenticated: show Sign In + Start Free buttons

```tsx
import { auth } from "@/lib/auth";

export default async function MarketingHeader() {
  const session = await auth();
  return (
    <header>
      {session ? (
        <Link href="/dashboard">Vào Trang Chủ</Link>
      ) : (
        <>
          <Link href="/auth/signin">Đăng Nhập</Link>
          <Link href="/auth/register">Bắt Đầu Miễn Phí</Link>
        </>
      )}
    </header>
  );
}
```

### DoD
- [x] Unauthenticated: shows Sign In + Register buttons
- [x] Authenticated: shows Dashboard button
- [x] No flash of wrong state (server-rendered)

---

## File Summary

| New File | Purpose |
|----------|---------|
| `src/app/(marketing)/layout.tsx` | Public layout (no sidebar) |
| `src/app/(marketing)/page.tsx` | Landing page assembly |
| `src/app/(app)/layout.tsx` | Authenticated app layout |
| `src/app/(app)/page.tsx` | Dashboard (moved from root) |
| `src/components/marketing/MarketingHeader.tsx` | Sticky header with auth awareness |
| `src/components/marketing/MarketingFooter.tsx` | 4-column footer |
| `src/components/marketing/HeroSection.tsx` | Hero with CTA |
| `src/components/marketing/FeaturesSection.tsx` | 6-card feature grid |
| `src/components/marketing/HowItWorksSection.tsx` | 3-step timeline |
| `src/components/marketing/SocialProofSection.tsx` | Stats + testimonials |
| `src/components/marketing/CTABannerSection.tsx` | Full-width CTA |

---

## Dependencies

- `lucide-react` (already installed)
- `next/image` (built-in)
- No new npm packages required
