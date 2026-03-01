# Heritage Cloud (Gia Phả Việt) — Project Summary

> **Product Name:** Heritage Cloud / Gia Phả Việt  
> **Tagline:** Lưu giữ và kết nối thế hệ — Preserving and connecting generations  
> **Last Updated:** 2026-03-01

---

## 1. What Is This App?

**Heritage Cloud** (Vietnamese: **Gia Phả Việt**) is a **Vietnamese family lineage management system** — a digital platform for Vietnamese families to record, visualize, and preserve their ancestral heritage across generations.

Rooted in the deeply important Vietnamese cultural tradition of **ancestor worship** (Thờ cúng tổ tiên), the app serves as a modern-day family genealogy book (gia phả) — the sacred scroll that every Vietnamese clan traditionally keeps to honor their ancestors.

### The Problem It Solves

In Vietnamese culture, maintaining the family genealogy book (gia phả) and honoring ancestors through regular rituals is a sacred duty. However:

- Physical gia phả scrolls deteriorate, get lost, or become illegible over time
- Family members scatter across cities and countries, losing connection
- Ritual schedules and ancestor memorial dates are forgotten between generations
- Grave site locations and maintenance responsibilities become unclear
- Family duty assignments for ceremonies lack coordination

### The Solution

Heritage Cloud digitizes the entire ancestral heritage experience into a beautiful, culturally authentic web application that feels like stepping into a Vietnamese imperial shrine — dark lacquer backgrounds, antique gold accents, parchment textures, and serif typography evoking classical Vietnamese documents.

---

## 2. Core Features

### 🌿 Family Lineage Tree (Cây Gia Phả)

Interactive visualization of the family tree across generations, with two view modes:

- **Neural Root Graph** — Force-directed network inspired by Obsidian's brain node view, showing family connections as an organic web
- **Traditional Tree** — Classical top-down hierarchical tree layout

Each family member node shows avatar, name, birth/death dates (both solar and **lunar calendar**), generation number, and lineage role. Deceased ancestors are rendered in **grayscale with golden lotus markers** — a culturally reverent visual treatment.

### 🗺️ Ancestral Map (Bản Đồ Mộ Phần)

An interactive Google Maps-based view showing the **locations of ancestral grave sites**. Features include:

- Dark-themed map with condition-colored markers (Maintained, Needs Visit, Weathered, Restoration)
- 360° panoramic photos of grave sites via Pannellum viewer
- Site registration with GPS coordinates and photo uploads

### 📅 Ritual Calendar (Lịch Cúng Kỵ)

A dual solar-lunar calendar displaying **ancestor memorial dates** (ngày giỗ). Vietnamese families observe annual death anniversaries with elaborate ceremonies, and this calendar ensures no date is forgotten. Features:

- Solar and **Vietnamese lunar calendar** (Âm lịch) side-by-side
- Ritual instructions step-by-step
- Duty checklists per ceremony

### ✅ Family Duty Management (Phân Công Việc)

A **Kanban board** for assigning and tracking family responsibilities:

- Categories: Religious, Maintenance, Archival, Social
- Drag-and-drop between Queue → Active → Completed
- Priority levels and due dates
- Workload tracking per family member
- Verification by the Head of House (Trưởng tộc)

### 🏮 Virtual Offerings (Cúng Dường Trực Tuyến)

Digital offerings to ancestors — incense, flowers, food, prayers — for family members who cannot physically attend ceremonies.

---

## 3. Design Identity

The design is deeply **Vietnamese cultural** — not a generic family tree app, but one that feels like entering a Huế imperial court shrine.

### Color Palette

| Role           | Color                               | Hex       |
| -------------- | ----------------------------------- | --------- |
| Primary        | Imperial Crimson (Đỏ son cung đình) | `#8B0000` |
| Accent         | Antique Gold (Vàng cổ)              | `#C5A059` |
| Text highlight | Gold Leaf (Vàng lá)                 | `#E5C17C` |
| Background     | Dark Lacquer (Sơn mài đen)          | `#1a0808` |
| Surface        | Parchment (Giấy dó)                 | `#F4EBD0` |

### Typography

- **Display/Ornate:** EB Garamond, Spectral SC — evoking classical Vietnamese imperial documents
- **Calligraphy:** WindSong — for ancestor quotes and poetic text
- **Serif:** Playfair Display, Noto Serif — for ancestral names and headings
- **Sans:** Noto Sans — for body text and UI labels

### Visual Motifs

- **Dark lacquer backgrounds** — reminiscent of Vietnamese lacquerware art (sơn mài)
- **Parchment/aged-silk textures** — evoking ancestral scrolls and imperial decrees
- **Gold leaf accents** — borders, text, dividers inspired by gold-leafed Buddhist temples
- **Hoành phi (橫匾)** — horizontal plaque carvings used as the hero banner
- **Câu đối (對聯)** — vertical couplet pillars flanking the main content
- **Grayscale + golden lotus** — reverent treatment for deceased ancestors

### Cultural Quote from the Homepage

> "Trăm năm sống bởi tổ tiên, nghìn đời nối mãi khói hương"
> _("A hundred years we live by our ancestors, a thousand generations we carry on the incense smoke")_

---

## 4. Technical Stack

| Layer            | Technology                                |
| ---------------- | ----------------------------------------- |
| Framework        | Next.js 16 (App Router, TypeScript)       |
| Styling          | Tailwind CSS v4                           |
| Database         | PostgreSQL via Supabase                   |
| ORM              | Prisma v7 (driver adapter + PgBouncer)    |
| Auth             | NextAuth v5 (JWT + Credentials)           |
| Visualization    | D3.js (force-directed graph, tree layout) |
| Maps             | Google Maps (@vis.gl/react-google-maps)   |
| 360° Viewer      | Pannellum                                 |
| Drag & Drop      | @dnd-kit                                  |
| State Management | Zustand + SWR                             |
| Hosting          | Vercel                                    |
| Icons            | Lucide React                              |

---

## 5. Family Hierarchy & Roles (RBAC)

| Vietnamese | English       | Access Level                                   |
| ---------- | ------------- | ---------------------------------------------- |
| Trưởng tộc | Head of House | Full admin — CRUD all, certify, delete         |
| Bậc trưởng | Elder         | Edit own branch, create rituals, assign duties |
| Con cháu   | Heir / Member | View all, update own duties, register sites    |
| Khách      | Guest         | View public lineage only                       |

---

## 6. Target Audience

- **Vietnamese families** wanting to preserve their genealogy digitally
- **Clan leaders** (trưởng tộc) coordinating ancestral rituals and duties
- **Overseas Vietnamese** (Việt kiều) staying connected to family roots
- **Cultural enthusiasts** interested in Vietnamese heritage preservation
- **Elderly family members** — the app prioritizes accessibility and simplicity

---

## 7. App Logo Design Brief

### Concept

The logo should embody the fusion of **ancient Vietnamese heritage** with **modern digital technology** — a sacred family tree preserved in the cloud.

### Key Symbols to Incorporate

- **Genealogy tree / family tree** — branches representing generations
- **Vietnamese cultural elements** — lotus flower (quốc hoa), imperial seal motif, or scroll
- **Cloud / digital** — subtle cloud shape or digital connectivity nodes
- **Gold & crimson** — the app's core colors

### Style Direction

- **Elegant and solemn** — not playful or cartoonish
- **Minimalist with cultural depth** — clean lines but rich in symbolism
- **Inspired by Vietnamese imperial seals and lacquerware**
- **Works on dark backgrounds** (the app uses dark lacquer as the primary background)

---

## 8. Logo Prompts for AI Image Generation

### Prompt 1 — Imperial Seal Style

```
Design a premium app logo for "Heritage Cloud" (Gia Phả Việt), a Vietnamese family genealogy app. The logo features a circular imperial seal motif inspired by Huế court stamps, containing a stylized family tree with roots and branches forming an elegant pattern. A small lotus flower sits at the base of the tree. The color palette uses antique gold (#C5A059) and imperial crimson (#8B0000) on a deep dark lacquer background (#1a0808). The style is minimalist yet culturally rich, evoking Vietnamese lacquerware art. Clean vector design, no text, suitable for app icon at all sizes. Square format with rounded corners.
```

### Prompt 2 — Family Tree with Cloud

```
Create an elegant app icon logo for a Vietnamese ancestral heritage app called "Gia Phả Việt". The design shows a golden family tree with delicate branches growing upward, where the canopy subtly transforms into a cloud shape. The tree trunk forms from intertwined roots symbolizing generations. A single lotus flower blooms at the center. Use antique gold (#C5A059) and warm gold leaf (#E5C17C) metallic tones against a deep crimson-black gradient background (#1a0808 to #8B0000). The style evokes Vietnamese golden lacquerware (sơn mài). Minimalist, premium, vector art. No text. Square icon format.
```

### Prompt 3 — Lotus & Scroll

```
Design a sophisticated app logo for "Heritage Cloud", a Vietnamese family lineage management platform. The central element is an open ancestral scroll (cuốn gia phả) with a luminous lotus flower emerging from its center, surrounded by subtle genealogy branch lines connecting outward like a neural network. Gold metallic finish (#C5A059, #E5C17C) on deep dark background (#1a0808). Vietnamese imperial aesthetic — think gold-leafed temple carvings and Huế dynasty motifs. Clean, modern, premium. No text. Square format. Suitable for both dark and light backgrounds.
```

### Prompt 4 — Minimalist Tree Rings

```
Create a minimal premium app icon for "Gia Phả Việt" (Vietnamese Family Genealogy). The design uses concentric tree rings (representing generations) with one side of the rings growing into delicate tree branches. A tiny lotus sits at the innermost ring (representing the ancestor/root). The entire design uses antique gold (#C5A059) line art on a circular deep crimson (#8B0000) background with a subtle radial gradient. Vietnamese imperial seal inspired, clean vector style. No text. Square format with rounded corners.
```

### Prompt 5 — Neural Root Emblem

```
Design an app logo for "Heritage Cloud" that merges Vietnamese heritage aesthetics with modern data visualization. The logo shows a sacred Bodhi-style tree where the roots and branches form an organic neural network pattern — nodes represent family members connected by golden lines. The central trunk forms a subtle vertical scroll shape. Colors: antique gold (#C5A059) and gold leaf (#E5C17C) on deep lacquer black (#1a0808) with faint crimson glow (#8B0000) around the edges. Premium, elegant, culturally Vietnamese. Suitable for app icon. No text. Square format.
```

### Color Reference for Logo Designer

```
Primary Gold:     #C5A059 (Antique Gold — borders, main elements)
Bright Gold:      #E5C17C (Gold Leaf — highlights, text)
Accent Gold:      #d4af37 (Pure Gold — special accents)
Imperial Crimson: #8B0000 (Deep red — background accent)
Dark Lacquer:     #1a0808 (Near-black — primary background)
Royal Lacquer:    #1a0000 (Deep dark red-black)
Parchment:        #F4EBD0 (Aged paper — light accent)
```
