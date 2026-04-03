# Design System Specification: Imperial Heritage & Tonal Depth

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Dynasty"**
This design system rejects the clinical flatness of modern SaaS. Instead, it draws inspiration from the Hue Imperial City—specifically the interplay between deep, polished wood lacquers and the delicate, weathered texture of ancient silk scrolls.

To move beyond a "template" look, the system employs **Intentional Asymmetry**. Layouts should mimic traditional calligraphy scrolls, where negative space is as communicative as the content. Elements should overlap—a gold leaf detail bleeding over a dark lacquer container—to create a sense of three-dimensional history rather than a flat digital grid.

---

## 2. Colors & Surface Philosophy
The palette is a dialogue between the shadows of an ancestral hall and the brilliance of imperial regalia.

### The Palette (Material Design Tokens)
- **Background:** `surface` (#210e0e) — A deep, "living" dark lacquer.
- **Primary:** `primary_container` (#8B0000) — Imperial Crimson. Use for major structural CTAs and brand moments.
- **Accent/Secondary:** `secondary` (#e9c176) — Antique Gold. Used for interactive highlights and refined iconography.
- **Surface:** `surface_container` (#2f1a19) — Parchment-toned surfaces when light-themed, or lighter lacquer variations.

### The "No-Line" Rule
Prohibit the use of 1px solid grey or high-contrast borders for sectioning. Boundaries must be defined through **Background Color Shifts**.
- A card should not have a stroke; it should be a `surface_container_high` (#3b2423) shape sitting on a `surface` (#210e0e) background.
- Use the **Surface Hierarchy**: `surface_container_lowest` (#1b0909) for background utility areas, ascending to `surface_container_highest` (#472e2e) for the most prominent interactive cards.

### Signature Textures & Soul
To provide "soul," avoid flat hex fills on large areas.
- **CTA Soul:** Apply a subtle radial gradient to `primary` buttons, transitioning from `primary_container` (#8B0000) at the edges to a slightly brighter `on_primary_fixed_variant` (#920703) in the center.
- **Glassmorphism:** For floating menus or "Imperial Seal" motifs, use `surface_bright` (#4c3332) at 60% opacity with a `20px` backdrop-blur. This mimics the translucent quality of aged lacquerware.

---

## 3. Typography
Typography is the voice of the ancestor. It must feel authoritative yet poetic.

- **Display & Headline (EB Garamond / Spectral SC):** Use `display-lg` (3.5rem) for heroic family titles. The high x-height and ornate serifs provide the "Imperial" weight.
- **Titles (Noto Serif):** Use `title-lg` (1.375rem) for navigation and section headers.
- **Body (Noto Serif):** All long-form narrative text must use `body-lg` (1rem) with a generous `1.7` line-height to ensure the "Editorial" feel.
- **Labels (Noto Serif):** Even small metadata should remain serifed to maintain the heritage aesthetic.

**Hierarchy Note:** Use `secondary` (Antique Gold) for headlines to create a "Gold Leaf" illumination effect against the dark lacquer backgrounds.

---

## 4. Elevation & Depth
In this system, depth is a matter of physical layering, not synthetic shadows.

### The Layering Principle
Stack tiers to create "soft lift":
1. **Base Layer:** `surface` (#210e0e)
2. **Section Layer:** `surface_container_low` (#2b1616)
3. **Interactive Card:** `surface_container_highest` (#472e2e)

### Ambient Shadows
If an element must "float" (e.g., a modal), use an **Extra-Diffused Shadow**:
- `box-shadow: 0 20px 50px rgba(27, 9, 9, 0.8);`
The shadow color is derived from `surface_container_lowest`, ensuring it looks like an ambient occlusion rather than a "drop shadow."

### The "Ghost Border" Fallback
If accessibility requires a container edge, use a **Ghost Border**:
- `outline_variant` (#5a403c) at 15% opacity. Never use 100% opaque lines.

---

## 5. Components

### Buttons (The Imperial Seal)
- **Primary:** Background `primary_container` (#8B0000), text `secondary` (#e9c176). No rounded corners (use `none` or `sm` 0.125rem).
- **State:** On hover, apply a `2px` inner glow using `secondary_fixed` (#ffdea5) at 20% opacity.

### Input Fields
- **Style:** Underline only. Use `outline` (#aa8984) for the idle state.
- **Active:** Transition the underline to `secondary` (Gold) and lift the label using `label-sm`.

### Cards & Lists
- **Rule:** Forbid divider lines.
- **Execution:** Use `spacing-6` (2rem) of vertical white space or a subtle shift to `surface_container_low` to separate family members in a lineage list.

### Heritage-Specific Components
- **The "Imperial Seal" Fab:** A circular floating action button using `secondary` with a custom SVG seal motif.
- **Parchment Scroll Overlays:** Modals should utilize the `tertiary_fixed` (#ffdea3) color with a subtle paper grain texture to mimic imperial edicts.

---

## 6. Do’s and Don’ts

### Do:
- **Use Asymmetric Margins:** Let text breathe. A wider left margin (e.g., `spacing-16`) creates an editorial, high-end feel.
- **Embrace "Gold Leaf" Highlights:** Use `secondary` sparingly for keywords within body text to draw the eye.
- **Layering:** Place elements slightly "off-grid" to create a custom, handcrafted appearance.

### Don’t:
- **Don't Use Pure White:** Never use #FFFFFF. Use `on_surface_variant` (#e3beb8) or `tertiary_fixed` (#ffdea3) for text.
- **Don't Use Sharp Shadows:** Hard shadows break the "Lacquered" immersion.
- **Don't Use Standard Corner Radii:** Avoid `lg` or `xl` rounded corners. This system is built on the rigid, dignified geometry of imperial architecture; stick to `none` or `sm`.
- **Don't Use 1px Dividers:** Use a `0.5px` line with a gradient fade-out at both ends if a divider is strictly necessary.