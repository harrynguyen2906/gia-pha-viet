# PRD-07: Heritage Cloud — Public Landing Page

> **Version:** 2.0  
> **Module:** Marketing Landing Page  
> **Status:** Draft  
> **Created:** 2026-03-03  
> **Dependencies:** PRD-00 (Global Design System), PRD-08 (Authentication)  
> **Design Reference:** `v1/ui/0.0.landingpage.html`

---

## 1. Overview & Purpose

### 1.1 Problem Statement
Heritage Cloud currently drops users directly into a login screen with no context about the product. New visitors have no way to understand the product's value proposition, features, or cultural significance before being asked to authenticate.

### 1.2 Solution
A public-facing marketing landing page that:
- Communicates the product vision: preserving Vietnamese ancestry digitally
- Showcases core features with visual previews
- Drives visitors toward registration with clear CTAs
- Maintains the imperial Vietnamese design language established in PRD-00
- Is fully responsive (mobile-first) and SEO-optimized

### 1.3 Success Metrics
| Metric | Target |
|--------|--------|
| Bounce rate | < 40% |
| CTA click-through (→ Register) | > 15% |
| Page load time (LCP) | < 2.5s |
| Mobile Lighthouse score | > 90 |

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| LP-01 | New visitor | See what Heritage Cloud does at a glance | I can decide if it's relevant to my family |
| LP-02 | New visitor | View feature previews with screenshots | I understand the product before signing up |
| LP-03 | New visitor | Click "Get Started" / "Register" | I can create my family's account |
| LP-04 | Returning user | Click "Sign In" from the landing page | I can access my family tree quickly |
| LP-05 | Mobile visitor | View the full landing page on my phone | I can explore on any device |
| LP-06 | Search engine crawler | Read semantic HTML with proper meta tags | The page ranks well for Vietnamese genealogy terms |

---

## 3. Page Structure & Sections

### 3.1 Navigation Header (Sticky)
- **Left:** Heritage Cloud logo + brand name
- **Right:** Navigation links: Features | About | Contact
- **Far Right:** "Đăng nhập" (Sign In) button (outline) + "Bắt đầu miễn phí" (Start Free) button (primary CTA)
- **Mobile:** Hamburger menu with slide-in drawer
- **Behavior:** Transparent on hero, becomes solid `lacquer-dark` on scroll

### 3.2 Hero Section
- **Layout:** Full-viewport height, split layout (image left, content right) on desktop; stacked on mobile
- **Background:** Vietnamese ancestral hall or family gathering image with dark overlay
- **Content:**
  - Headline: "Lưu Giữ Di Sản — Kết Nối Thế Hệ" (Preserve Heritage — Connect Generations)
  - Subheadline: Brief description (2 sentences max)
  - Primary CTA: "Bắt Đầu Miễn Phí" (Start Free) — routes to `/auth/register`
  - Secondary CTA: "Tìm Hiểu Thêm" (Learn More) — smooth scroll to Features
- **Visual Accents:** Gold leaf border, subtle incense smoke particles (CSS animation, respects `prefers-reduced-motion`)
- **Cultural Element:** Imperial scroll motif framing the CTA area

### 3.3 Features Showcase Section
Six feature cards arranged in a 3×2 grid (desktop) / single column (mobile):

| # | Feature | Icon | Description |
|---|---------|------|-------------|
| 1 | Gia Phả Số (Digital Family Tree) | `git-branch` | Interactive neural-root visualization of your entire lineage |
| 2 | Hồ Sơ Kỹ Thuật Số (Digital Profiles) | `user-circle` | Rich profiles for every family member — living and deceased |
| 3 | Bản Đồ Tổ Tiên (Ancestral Map) | `map-pin` | Track and visit ancestral grave sites on an interactive map |
| 4 | Lịch Giỗ Chạp (Ritual Calendar) | `calendar-heart` | Never miss a memorial day with lunar calendar integration |
| 5 | Quản Lý Bổn Phận (Family Duties) | `clipboard-list` | Assign and track family responsibilities with Kanban boards |
| 6 | An Toàn & Bảo Mật (Secure & Private) | `shield-check` | Your family data is encrypted and isolated per clan |

**Card Design:**
- `ParchmentCard` component with gold border
- Hover: subtle lift + gold shimmer effect
- Each card links to a feature detail section or scroll anchor

### 3.4 How It Works Section
Three-step horizontal timeline:

| Step | Title | Description |
|------|-------|-------------|
| 1 | Đăng Ký Dòng Tộc (Register Your Clan) | Create an account and name your family clan |
| 2 | Thêm Thành Viên (Add Members) | Build your family tree by adding members and relationships |
| 3 | Kết Nối & Quản Lý (Connect & Manage) | Track rituals, duties, and ancestral sites together |

**Visual:** Connected by a gold-accented timeline line with step numbers in circular badges

### 3.5 Social Proof / Trust Section
- Testimonial quotes (placeholder for future real testimonials)
- Stats counters: "X+ Dòng Tộc" (Clans), "Y+ Thành Viên" (Members), "Z+ Nghi Lễ" (Rituals tracked)
- Counter animation on scroll-into-view

### 3.6 Call to Action Banner
- Full-width `imperial-crimson` background with gold accents
- Headline: "Bắt Đầu Gìn Giữ Di Sản Gia Đình Bạn Ngay Hôm Nay" (Start Preserving Your Family Heritage Today)
- Large CTA button: "Đăng Ký Miễn Phí" (Register Free)

### 3.7 Footer
- **Column 1:** Heritage Cloud logo + brief mission statement
- **Column 2:** Quick links — Features, About, FAQ
- **Column 3:** Legal — Privacy Policy, Terms of Service
- **Column 4:** Contact — Email, Social media icons
- **Bottom bar:** "© 2026 Heritage Cloud. All rights reserved."
- **Cultural detail:** Subtle gold lotus divider between content and copyright

---

## 4. Design Specifications

### 4.1 Color Usage
All colors from PRD-00 §2 Global Color Palette:

| Element | Token |
|---------|-------|
| Page background | `background-dark` (#230f0f) |
| Hero text | White + `gold-leaf` accents |
| Feature cards background | `parchment-base` (#F4EBD0) |
| Feature cards text | `temple-stone` (#2D241E) |
| CTA buttons | `primary` (#8a0000) with `antique-gold` border |
| Footer background | `lacquer-dark` (#1a0808) |
| Section dividers | `border-muted` (#4b2020) |

### 4.2 Typography
All fonts from PRD-00 §3:

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Nav brand | `font-display` (Cinzel) | 1.25rem | 700 |
| Hero headline | `font-display` (Cinzel) | 3rem (desktop) / 2rem (mobile) | 900 |
| Hero subheadline | `font-serif` (Noto Serif) | 1.125rem | 400 italic |
| Feature card title | `font-display` (Cinzel) | 1rem | 700 |
| Feature card body | `font-sans` (Noto Sans) | 0.875rem | 400 |
| CTA button text | `font-display` (Cinzel) | 0.875rem | 700, tracking-widest |
| Stats numbers | `font-display` (Cinzel) | 2.5rem | 900 |
| Footer text | `font-sans` (Noto Sans) | 0.75rem | 400 |

### 4.3 Responsive Breakpoints
| Breakpoint | Layout Change |
|------------|---------------|
| < 640px (mobile) | Single column, stacked hero, hamburger nav |
| 640–1024px (tablet) | 2-column feature grid, side-by-side hero |
| > 1024px (desktop) | 3-column feature grid, full hero layout |

### 4.4 Animations & Interactions
- **Hero:** Fade-in on load (0.5s ease-out)
- **Feature cards:** Stagger fade-in on scroll (intersection observer)
- **Stats counters:** Count-up animation on scroll-into-view
- **Scroll indicator:** Bouncing chevron below hero
- **CTA buttons:** Gold shimmer sweep on hover (reuse `.btn-gold-shimmer` from PRD-00)
- **All animations:** Respect `prefers-reduced-motion: reduce`

---

## 5. SEO & Meta Tags

```html
<title>Heritage Cloud — Lưu Giữ Di Sản Gia Phả Việt Nam | Vietnamese Family Tree</title>
<meta name="description" content="Nền tảng gia phả số cho gia đình Việt Nam. Quản lý cây phả hệ, lịch giỗ chạp, bản đồ tổ tiên và bổn phận gia tộc. Digital Vietnamese genealogy platform." />
<meta name="keywords" content="gia phả, family tree, Vietnamese genealogy, phả hệ, lịch giỗ, ancestor worship, tổ tiên" />
<meta property="og:title" content="Heritage Cloud — Vietnamese Family Lineage Platform" />
<meta property="og:description" content="Preserve your family heritage digitally. Interactive lineage trees, ritual calendars, and ancestral maps." />
<meta property="og:image" content="/images/og-landing.jpg" />
<meta property="og:type" content="website" />
```

---

## 6. Routes & Navigation

| Action | Route |
|--------|-------|
| Landing page | `/` (root — public, no auth required) |
| Sign In click | `/auth/signin` |
| Register / Start Free click | `/auth/register` |
| Feature deep-link | `/#features`, `/#how-it-works` (anchor scroll) |
| After successful auth | → `/dashboard` (redirect to homepage) |

### 6.1 Route Protection
- Landing page (`/`) is **always public** — no authentication check
- If user is already authenticated and visits `/`, show a "Go to Dashboard" button in the nav instead of "Sign In"

---

## 7. Performance Requirements

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to Interactive (TTI) | < 3.0s |
| Bundle size (page JS) | < 100KB gzipped |

### 7.1 Optimization Strategy
- Use Next.js static generation (`generateStaticParams` not needed — single page)
- `next/image` with priority loading for hero image
- Lazy-load below-fold sections with `Suspense` + dynamic imports
- Preload critical fonts (Cinzel, Noto Serif)
- Minimize client-side JS — landing page should be mostly server components

---

## 8. Accessibility (WCAG 2.1 AA)

- All images have descriptive `alt` text
- Color contrast ratio ≥ 4.5:1 for all text
- Keyboard navigable: Tab through nav → hero CTA → feature cards → footer
- Skip-to-content link for screen readers
- ARIA labels on decorative elements (gold borders, particles)
- Focus indicators visible on all interactive elements

---

## 9. Bilingual Support (Future Consideration)

The landing page content should be structured to support i18n in a future phase:
- Default language: Vietnamese (vi)
- Secondary: English (en)
- Strategy: Next.js i18n routing (`/vi/`, `/en/`) — not implemented in v2, but content structure should not hardcode strings

---

## 10. Out of Scope for V2

- ❌ Pricing section (no payment integration yet)
- ❌ Blog / content marketing pages
- ❌ Live chat widget
- ❌ Video demos
- ❌ Multi-language toggle (content in Vietnamese first)
