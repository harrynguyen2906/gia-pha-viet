# RF-02 — Refactor: Emoji/Unicode Icons → Lucide React Icon System

> **Status:** Planned  
> **Priority:** Medium  
> **Affected modules:** `src/components/layout/`, `src/components/lineage/`, `src/components/rituals/`, `src/components/duties/`, `src/components/map/`, `src/app/lineage/`  
> **Estimated scope:** ~15 files modified, 1 utility file created, 1 package added

---

## 1. Motivation

### 1.1 Current State — Problems

The project currently uses **three different icon approaches**, none of which are consistent or scalable:

| Approach | Where Used | Problems |
|----------|-----------|----------|
| **Emoji characters** (🏮🌳🗺️🕯️📋🔔🪦) | Navbar, MapClient, NotificationBell | Render differently across OS/browsers; no size/color control; can't match `antique-gold` palette; blurry at small sizes; accessibility issues (screen readers may mispronounce) |
| **Unicode symbols** (✓ ✝ → ← ×) | LineageClient, RitualCalendarClient, DutyKanbanClient, AddMemberForm, Modal | Inconsistent font rendering; no stroke-width control; limited symbol vocabulary; ✝ renders as emoji on some OS |
| **Inline SVG path strings** | `tree/constants.ts` (MALE_ICON, FEMALE_ICON, OTHER_ICON) | Hard to maintain raw `d` paths; no tree-shaking; breaks consistency with rest of UI |

### 1.2 Why This Matters

- **Visual inconsistency:** Emoji icons look completely different on macOS vs. Windows vs. Android — breaking the heritage lacquer design system.
- **No styling control:** Emojis cannot inherit `text-antique-gold` or be sized with `w-5 h-5` like SVG icons.
- **Accessibility:** Screen readers announce emoji names unpredictably (e.g., "lantern" vs. "red paper lantern").
- **Limited vocabulary:** As the app grows (Brain Node view, Unified Hub, more actions), we need a consistent icon set with hundreds of icons available.
- **Bundle size:** Without a proper tree-shakable library, adding more icons means copy-pasting SVG paths inline.

---

## 2. Library Selection — Why Lucide React

### 2.1 Evaluation

| Library | Icons | Size* | Style | Tree-Shake | React Native | Heritage Fit |
|---------|-------|-------|-------|------------|-------------|-------------|
| **Lucide React** | 1500+ | ~20KB used | Stroke-based, clean | ✅ Per-icon import | ✅ | ⭐ Best — thin strokes match gold filigree aesthetic |
| Heroicons | 300+ | ~15KB | Stroke + Solid | ✅ | ❌ | Good — but limited count |
| Phosphor Icons | 7000+ | ~40KB used | 6 weights | ✅ | ✅ | Good — many weights, but overkill |
| Tabler Icons | 5000+ | ~35KB used | Stroke-based | ✅ | ❌ | Good — similar to Lucide |
| React Icons | 40k+ | Varies | Mixed sets | ⚠️ Partial | ❌ | Poor — inconsistent across sets |
| Material Symbols | 2500+ | ~50KB+ | Google style | ⚠️ Font-based | ✅ | Moderate — chunky, less heritage feel |

\* Estimated bundle impact for ~50 icons used

### 2.2 Decision: `lucide-react`

**Chosen: `lucide-react`** for these reasons:

1. **Stroke-based design** — Thin, elegant strokes pair naturally with the gold-leaf filigree and antique-gold line elements in the Heritage Cloud design system.
2. **Tree-shakable** — Import only what you use: `import { Flame } from "lucide-react"`. Dead code elimination keeps bundle lean.
3. **Excellent React integration** — First-class React components with proper TypeScript types. Props: `size`, `color`, `strokeWidth`, `className`.
4. **1500+ icons** — Covers all current needs plus future features (Brain Node, Ritual Hub, duty actions, notifications, settings).
5. **Consistent sizing** — All icons on a 24×24 grid, scalable via `size` prop or Tailwind `w-*` / `h-*`.
6. **Active maintenance** — 40k+ GitHub stars, weekly releases, documented API.
7. **Small footprint** — Each icon is ~200-500 bytes gzipped. Typical app usage (50 icons) adds ~15-20KB to bundle.

---

## 3. Scope of Changes

### 3.1 Package Installation

```bash
npm install lucide-react
```

No additional type packages needed — `lucide-react` ships with TypeScript definitions.

### 3.2 Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/Icon.tsx` | Optional thin wrapper for default styling (size, strokeWidth, className presets) |

### 3.3 Files to Modify

| File | Current Icons | Lucide Replacement |
|------|--------------|-------------------|
| `src/components/layout/Navbar.tsx` | 🏮🌳🗺️🕯️📋 (emoji) | `Landmark`, `TreePine`, `Map`, `Flame`, `ClipboardList` |
| `src/components/layout/Navbar.tsx` | 🔔 (emoji) | `Bell` |
| `src/components/lineage/LineageClient.tsx` | ✝ ← → (unicode) | `Cross`, `ArrowLeft`, `ArrowRight` or `ChevronLeft`/`ChevronRight` |
| `src/components/lineage/LineageClient.tsx` | × (close button text) | `X` |
| `src/components/lineage/AddMemberForm.tsx` | ← (unicode) | `ArrowLeft` |
| `src/components/lineage/tree/constants.ts` | Raw SVG `d` paths (MALE_ICON, FEMALE_ICON, OTHER_ICON) | Keep as-is for D3 Canvas (not React DOM) — document as exception |
| `src/components/rituals/RitualCalendarClient.tsx` | ✓ ← → (unicode) | `Check`, `ChevronLeft`, `ChevronRight` |
| `src/components/duties/DutyKanbanClient.tsx` | → (unicode) | `ArrowRight` or `UserCircle` for assignee |
| `src/components/map/MapClient.tsx` | 🪦🗺️ (emoji) | `Headstone`/`Cross`, `Map` |
| `src/components/ui/Modal.tsx` | × (unicode) | `X` |
| `src/app/lineage/[memberId]/page.tsx` | ✝ (unicode) | `Cross` |
| `src/app/lineage/add/page.tsx` | — (already minimal) | No icon changes needed |

### 3.4 Icon Mapping Reference

Complete mapping from current icon usage to Lucide equivalents:

**Navigation (Navbar):**

| Current | Lucide Import | Usage Context |
|---------|--------------|---------------|
| 🏮 | `Landmark` | Trang Chủ (Homepage) |
| 🌳 | `TreePine` | Gia Phả (Lineage) |
| 🗺️ | `Map` | Mộ Phần (Ancestral Map) |
| 🕯️ | `Flame` | Lịch Giỗ (Ritual Calendar) |
| 📋 | `ClipboardList` | Công Việc (Duties) |
| 🔔 | `Bell` | Notifications |

**Actions & Indicators:**

| Current | Lucide Import | Usage Context |
|---------|--------------|---------------|
| ← | `ChevronLeft` | Back / Previous navigation |
| → | `ChevronRight` | Next / Forward navigation |
| × | `X` | Close modal / panel |
| ✓ | `Check` | Confirmed / verified status |
| ✝ | `Cross` | Deceased indicator |
| + | `Plus` | Add / create actions |

**Future (Brain Node, Ritual Hub, general):**

| Lucide Import | Planned Usage |
|--------------|---------------|
| `Search` | Search member input |
| `Filter` | Filter panel toggle |
| `ZoomIn` / `ZoomOut` | Canvas controls |
| `Maximize2` | Fit-to-screen |
| `RotateCcw` | Re-center graph |
| `Type` | Toggle labels |
| `Calendar` | Calendar tab icon |
| `ListTodo` | Tasks tab icon |
| `UserCircle` | Assignee avatar fallback |
| `Users` | Member count / workload |
| `GitBranch` | Relationship / lineage |
| `Edit3` | Edit action |
| `Trash2` | Delete action |
| `MoreVertical` | Context menu |
| `Info` | Detail / tooltip trigger |
| `AlertTriangle` | Overdue / warning |
| `CheckCircle` | Completed status |
| `Clock` | Pending / in-progress |
| `Download` | Export PDF/image |
| `Share2` | Share link |
| `Settings` | Settings / preferences |
| `LogOut` | Sign out |
| `Eye` / `EyeOff` | Show / hide controls |
| `Minimize2` | Mini-map toggle |
| `Move` | Drag handle |
| `Flower2` | 🪷 Deceased lotus → `Flower2` or custom |

---

## 4. Implementation Steps

### Step 1: Install Package

```bash
npm install lucide-react
```

Verify: `npm run build` passes, no conflicts.

### Step 2: Create Icon Wrapper (Optional)

Create `src/components/ui/Icon.tsx` — a thin wrapper that sets Heritage Cloud defaults:

```tsx
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps extends LucideProps {
  icon: React.FC<LucideProps>;
}

export default function Icon({ icon: IconComponent, className, size = 18, strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <IconComponent
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
```

**Default values:**
- `size={18}` — Matches `text-base` / 18px for inline contexts
- `strokeWidth={1.5}` — Thin stroke matching gold filigree line weight
- `shrink-0` — Prevents icon from shrinking in flex layouts

This wrapper is **optional** — direct Lucide imports work fine too. The wrapper just centralizes defaults.

### Step 3: Migrate Navbar Icons (Highest Visibility)

```tsx
// Before
const NAV_LINKS = [
  { href: "/",        label: "Trang Chủ", icon: "🏮" },
  { href: "/lineage", label: "Gia Phả",   icon: "🌳" },
  ...
];
// <span>{link.icon}</span>

// After
import { Landmark, TreePine, Map, Flame, ClipboardList } from "lucide-react";

const NAV_LINKS = [
  { href: "/",        label: "Trang Chủ", icon: Landmark },
  { href: "/lineage", label: "Gia Phả",   icon: TreePine },
  { href: "/map",     label: "Mộ Phần",   icon: Map },
  { href: "/rituals", label: "Lịch Giỗ",  icon: Flame },
  { href: "/duties",  label: "Công Việc",  icon: ClipboardList },
];

// Render
<link.icon className="w-4 h-4 text-current" strokeWidth={1.5} />
```

### Step 4: Migrate Action Icons Across Components

Replace unicode symbols in all components listed in §3.3. Pattern:

```tsx
// Before
<span className="text-xs text-emerald-400/70">✓</span>

// After
import { Check } from "lucide-react";
<Check className="w-3.5 h-3.5 text-emerald-400/70" strokeWidth={2} />
```

```tsx
// Before (Modal.tsx)
<button>×</button>

// After
import { X } from "lucide-react";
<X className="w-5 h-5" />
```

```tsx
// Before (deceased indicator)
<span>✝ Đã Mất</span>

// After
import { Cross } from "lucide-react";
<span className="inline-flex items-center gap-1">
  <Cross className="w-3.5 h-3.5" />
  Đã Mất
</span>
```

### Step 5: Migrate Notification Bell

```tsx
// Before
<span className="text-base">🔔</span>

// After
import { Bell } from "lucide-react";
<Bell className="w-5 h-5 text-current" strokeWidth={1.5} />
```

### Step 6: Keep D3 SVG Paths As-Is (Exception)

The `tree/constants.ts` inline SVG paths (`MALE_ICON`, `FEMALE_ICON`, `OTHER_ICON`) are used inside D3's Canvas rendering pipeline, not React DOM. Lucide React components can't be used there directly.

**Keep these as-is.** Document this as a known exception — the D3 renderer operates outside React's component tree.

### Step 7: Verify & Clean Up

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — success
3. Visual diff: compare all pages before/after in Chrome + Safari
4. Screen reader test: icons should have proper `aria-label` or be `aria-hidden` when decorative
5. Remove any unused emoji/unicode fallbacks

---

## 5. Accessibility Guidelines

When using Lucide icons, follow these rules:

### Decorative Icons (next to text label)

```tsx
// Icon is decorative — text provides meaning
<button>
  <Plus className="w-4 h-4" aria-hidden="true" />
  <span>Thêm Thành Viên</span>
</button>
```

### Standalone Icons (no visible text)

```tsx
// Icon is the only visual — needs aria-label
<button aria-label="Đóng">
  <X className="w-5 h-5" />
</button>

<button aria-label="Thông báo">
  <Bell className="w-5 h-5" />
</button>
```

### Status Icons

```tsx
// Screen reader should announce status
<span className="inline-flex items-center gap-1" role="status">
  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
  <span>Đã xác nhận</span>
</span>
```

---

## 6. Styling Integration with Design System

### Color Inheritance

Lucide icons use `currentColor` by default — they inherit text color from parent:

```tsx
// Icon inherits text-antique-gold/60
<span className="text-antique-gold/60">
  <Flame className="w-4 h-4" />
</span>

// Or set color directly via className
<Check className="w-4 h-4 text-emerald-400/70" />
```

### Recommended Sizes

| Context | Tailwind Class | Size | strokeWidth |
|---------|---------------|------|-------------|
| Navbar link (desktop) | `w-4 h-4` | 16px | 1.5 |
| Navbar link (mobile) | `w-5 h-5` | 20px | 1.5 |
| Inline with text | `w-3.5 h-3.5` | 14px | 2 |
| Button with label | `w-4 h-4` | 16px | 1.5 |
| Standalone icon button | `w-5 h-5` | 20px | 1.5 |
| Large CTA / empty state | `w-8 h-8` | 32px | 1 |
| Canvas controls | `w-5 h-5` | 20px | 1.5 |

### Stroke Width Guidelines

- **1.0** — Decorative / large icons (32px+), delicate filigree feel
- **1.5** — Standard UI icons (16-20px), matches gold border weight
- **2.0** — Small inline icons (14px), ensures visibility at small sizes

---

## 7. Migration Order

Prioritize by user visibility and ease of migration:

| Order | Scope | Files | Impact |
|-------|-------|-------|--------|
| 1 | **Navbar** | `Navbar.tsx` | Highest visibility — seen on every page |
| 2 | **Modal close button** | `Modal.tsx` | Used by all modals |
| 3 | **Lineage detail panel** | `LineageClient.tsx` | Frequently used page |
| 4 | **Ritual calendar controls** | `RitualCalendarClient.tsx` | Month navigation, status indicators |
| 5 | **Member profile** | `[memberId]/page.tsx` | Deceased indicators |
| 6 | **Duty Kanban** | `DutyKanbanClient.tsx` | Assignee display |
| 7 | **Map client** | `MapClient.tsx` | Status indicators |
| 8 | **Add member form** | `AddMemberForm.tsx` | Back navigation |
| 9 | **Future: Brain Node controls** | New files (IP-02.2) | Build with Lucide from start |
| 10 | **Future: Ritual Hub tabs** | New files (IP-04.1) | Build with Lucide from start |

---

## 8. Bundle Impact Analysis

### Before (Current)

- Emoji: 0KB (native OS rendering)
- Unicode symbols: 0KB (font rendering)
- Inline SVG paths: ~500B (constants.ts)
- **Total: ~500B**

### After (Lucide)

- Each Lucide icon: ~200-500B gzipped
- Estimated 40-50 icons used: **~12-18KB gzipped**
- Icon wrapper component: ~200B
- **Total: ~13-19KB gzipped**

### Verdict

The ~15KB increase is negligible for the gains in:
- Visual consistency across platforms
- Full color/size control matching design system
- Accessibility improvements
- Developer experience (autocomplete, TypeScript types)
- Scalability for future features

---

## 9. Acceptance Criteria

- [ ] `lucide-react` installed, `npm run build` passes
- [ ] No emoji characters remain in navigation or action buttons
- [ ] All icons render identically on macOS Chrome, Windows Chrome, and Safari
- [ ] Icons inherit `currentColor` and respond to Tailwind color classes
- [ ] Navbar icons visually match Heritage Cloud lacquer aesthetic (thin stroke, gold tones)
- [ ] Standalone icon buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] D3 tree `constants.ts` SVG paths unchanged (documented exception)
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Bundle size increase < 25KB gzipped
- [ ] Visual regression: no layout shifts after migration

---

## 10. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Icon not expressive enough for cultural context (🏮 → Landmark) | Medium | Low | Can swap individual icons later; Lucide has 1500+ to choose from. Consider `Lantern` if added in future releases. |
| D3 renderer can't use React Lucide components | Known | None | Already planned as exception — keep inline SVG paths for D3 Canvas |
| Emoji-specific meaning lost (🕯️ candle → Flame) | Low | Low | Text labels always accompany nav icons; icon is supplementary |
| Team unfamiliarity with Lucide API | Low | Low | API is simple: `<IconName size={n} strokeWidth={n} className="" />` |
| Future icons not available in Lucide | Very Low | Low | Lucide has 1500+ icons and weekly releases; custom SVG fallback always possible |
