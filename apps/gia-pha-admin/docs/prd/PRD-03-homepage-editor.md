# PRD-03: Homepage Visual Editor

## 1. Product Overview

The `gia-pha-web` homepage currently renders a layered temple scene made from one background image plus multiple transparent PNG overlays. Those overlays act as interactive hotspots and must preserve the current hover highlight and alpha hit-testing behavior.

Today, updating that scene requires manual asset compositing, CSS changes, and redeploys. This PRD defines a visual editor inside `gia-pha-admin` so an admin can:

1. Upload a background image
2. Upload reusable transparent PNG overlay assets
3. Drag, resize, and reorder those overlays directly on top of the background
4. Configure the link, tooltip, and accessibility label for each layer
5. Preview the exact hover/highlight behavior before publishing
6. Publish the scene so `gia-pha-web` renders it dynamically without code changes

The primary v1 goal is simple and operational: add a menu route that lets admins upload the homepage images, place each PNG correctly on the background by drag-and-drop, and keep the live homepage hoverable/clickable.

## 2. Objectives

- **Self-Service Homepage Management:** Remove the need for developer-only compositing work and redeploys.
- **Precise Scene Editing:** Let admins position PNG objects against the actual homepage background, not guess CSS percentages by hand.
- **Shared Render Behavior:** Ensure admin preview and public homepage use the same scene math, hover highlight, and alpha hit-testing rules.
- **Safe Publishing:** Support drafts, explicit publish, version history, and fast rollback.

## 3. Roles & Permissions

V1 should map to the roles that already exist in the repo today.

| Role          | Current System Role | Permissions                                                                    |
| ------------- | ------------------- | ------------------------------------------------------------------------------ |
| **Publisher** | `SUPER_ADMIN`       | Full access, including publish, restore, and deleting unused assets            |
| **Editor**    | `SUPPORT`           | Create/edit drafts, upload assets, arrange layers, preview, but cannot publish |

## 4. Scope & Features

### 4.1. Admin Navigation & Entry Point

- Add a top-level sidebar item: **"Trang Chủ"**
- Route: `/homepage-editor`
- Place it in the existing admin sidebar alongside the other primary sections, not inside a separate settings-only subnav

### 4.2. Asset Library

- **Background Upload:** Upload one background image for the draft scene. Accepted: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Overlay Upload:** Upload multiple transparent PNG assets to place on top of the background
- **Reusable Library:** Previously uploaded assets remain available for reuse across drafts
- **Metadata Display:** Show filename, dimensions, file size, asset type, and upload time
- **Validation:**
  - Max file size: 5 MB per file
  - Overlay PNGs should warn if they are fully opaque
  - Background replacement should warn if the new aspect ratio differs from the current draft
- **Deletion Safety:** An asset can only be deleted if it is not referenced by any draft or published config
- **Storage:** Store all files in the Supabase `homepage-assets` bucket, separated by `backgrounds/` and `overlays/`

### 4.3. Visual Scene Editor

This is the core workflow: upload a background, drop PNG objects onto it, and move them until they are visually correct.

#### Scene Coordinate System

- The canonical scene size is the background image's natural size, for example `1920 × 1071`
- Each layer frame is stored in **scene pixels** relative to that background, not viewport percentages
- This keeps drag-and-drop accurate and avoids rounding drift during repeated edits
- The entire scene is scaled at render time to fit desktop/mobile viewports

#### View Modes

- **Scene View:** Shows the full background at its natural aspect ratio for editing
- **Desktop Preview Guide:** Shows how the live homepage will crop the scene on a wide viewport using `object-fit: cover` equivalent math
- **Mobile Preview Guide:** Shows the same scene through a narrow mobile crop, but does **not** create a second layout

#### Layer Manipulation

- Add an overlay asset from the library onto the canvas
- Drag layers freely on the background
- Resize with corner handles
- Reorder z-index in the layer panel
- Adjust opacity
- Set blend mode: `normal`, `screen`, `multiply`
- Lock/unlock a layer to prevent accidental movement
- Hide/show a layer without deleting it
- Duplicate and delete layers from the current draft

#### Layer Properties Panel

For the selected layer, show:

| Property       | Type              | Description                                          |
| -------------- | ----------------- | ---------------------------------------------------- |
| Name           | Text              | Human-readable label                                 |
| X / Y          | Number            | Top-left layer position in scene pixels              |
| Width / Height | Number            | Layer frame size in scene pixels                     |
| Link URL       | Text              | Destination route or external URL                    |
| External Link  | Checkbox          | Open in new tab if enabled                           |
| Tooltip Text   | Text              | Hover label shown on the live homepage               |
| Aria Label     | Text              | Accessibility label                                  |
| Opacity        | Slider            | `0–100%`                                             |
| Blend Mode     | Select            | `normal`, `screen`, `multiply`                       |
| Z-Index        | Number / Controls | Layer stacking order                                 |
| Visible        | Toggle            | Participates in render/hit-testing only when visible |
| Locked         | Toggle            | Prevents drag/resize in the editor                   |

#### Background Controls

- Replace background image
- Show background dimensions
- Warn when replacing with a different ratio because existing layers may need manual adjustment

### 4.4. Hover & Highlight Behavior

The live homepage and the admin preview must follow the same interaction contract:

- All visible layers participate in alpha hit-testing
- Hit-testing must evaluate visible layers in descending `zIndex`
- The highest visible opaque layer under the pointer wins
- Hover state shows the configured tooltip
- Hover state applies the established highlight treatment: glow + lift + emphasis consistent with the current homepage experience
- Clicking an active layer navigates to its configured destination
- Alpha hit-testing must sample the real PNG alpha channel, not just the layer bounding box

### 4.5. Drafts, Preview, Publish & Version History

- **Draft First:** Editing happens on drafts only
- **Default Draft Creation:** Creating a new draft should clone the latest published scene by default, so updates start from the current live homepage
- **Preview:** Open a preview modal or route that uses the same render rules as the public homepage
- **Publish:** Only `SUPER_ADMIN` can publish a draft
- **Versioning:** Each publish creates a new published version number
- **Rollback:** Restoring a previous version creates a new draft based on that published version

### 4.6. Dynamic Rendering in `gia-pha-web`

The marketing homepage must be updated to:

1. Load the latest published homepage config from the database or a shared server helper
2. Render the background and layers dynamically from that config
3. Use the shared scene runtime for crop math, z-order, hover, and alpha hit-testing
4. Fall back to the current static homepage assets if no published config exists
5. Revalidate quickly after publish so changes appear on the live site without waiting for a redeploy

## 5. Data Model

### `HomepageAsset`

Tracks uploaded files in the reusable asset library.

| Column       | Type     | Description                     |
| ------------ | -------- | ------------------------------- |
| `id`         | UUID     | Primary key                     |
| `kind`       | Enum     | `BACKGROUND` or `OVERLAY`       |
| `fileName`   | String   | Original filename               |
| `storageKey` | String   | Path inside Supabase Storage    |
| `publicUrl`  | String   | Public asset URL                |
| `mimeType`   | String   | Uploaded mime type              |
| `fileSize`   | Int      | File size in bytes              |
| `width`      | Int      | Natural width                   |
| `height`     | Int      | Natural height                  |
| `hasAlpha`   | Boolean? | Alpha-channel hint for overlays |
| `uploadedBy` | UUID?    | Admin user id                   |
| `createdAt`  | DateTime | Creation timestamp              |
| `updatedAt`  | DateTime | Last update timestamp           |

### `HomepageConfig`

Stores draft/published homepage scenes.

| Column              | Type      | Description                                          |
| ------------------- | --------- | ---------------------------------------------------- |
| `id`                | UUID      | Primary key                                          |
| `status`            | Enum      | `DRAFT`, `PUBLISHED`, `ARCHIVED`                     |
| `version`           | Int?      | Published version number. `null` while still a draft |
| `name`              | String    | Admin-facing draft/version label                     |
| `backgroundAssetId` | UUID      | Background asset reference                           |
| `backgroundWidth`   | Int       | Scene width in px                                    |
| `backgroundHeight`  | Int       | Scene height in px                                   |
| `layers`            | JSON      | Snapshot array of layer configs                      |
| `createdBy`         | UUID      | Admin user id who created the draft                  |
| `publishedBy`       | UUID?     | Admin user id who published the version              |
| `publishedAt`       | DateTime? | Publish timestamp                                    |
| `basedOnConfigId`   | UUID?     | Previous source config for cloned drafts/restores    |
| `createdAt`         | DateTime  | Creation timestamp                                   |
| `updatedAt`         | DateTime  | Last modification timestamp                          |

### Layer JSON Snapshot

```json
{
  "id": "uuid",
  "assetId": "uuid",
  "name": "Nhà Thờ Họ",
  "imageUrl": "https://.../homepage-assets/overlays/house.png",
  "naturalWidth": 860,
  "naturalHeight": 620,
  "frame": { "x": 642, "y": 458, "width": 420, "height": 302 },
  "zIndex": 4,
  "opacity": 1,
  "blendMode": "normal",
  "visible": true,
  "locked": false,
  "link": {
    "href": "/giapha",
    "tooltip": "Nhà Thờ Họ — Gia Phả Online",
    "ariaLabel": "Go to gia pha ho toc landing page",
    "external": false
  }
}
```

> **Note:** Layer frames are stored in **scene pixels** relative to the background's natural size. The renderer scales the entire scene to the viewport, so the placement remains stable across devices.

## 6. API Endpoints

### Admin Endpoints (`gia-pha-admin`)

| Method   | Endpoint                                   | Description                                         |
| -------- | ------------------------------------------ | --------------------------------------------------- |
| `GET`    | `/api/admin/homepage/assets`               | List reusable assets                                |
| `POST`   | `/api/admin/homepage/assets`               | Upload an asset                                     |
| `DELETE` | `/api/admin/homepage/assets/[assetId]`     | Delete an unused asset                              |
| `GET`    | `/api/admin/homepage/configs`              | List drafts and published versions                  |
| `POST`   | `/api/admin/homepage/configs`              | Create a draft, cloning latest published by default |
| `GET`    | `/api/admin/homepage/configs/[id]`         | Fetch one config                                    |
| `PUT`    | `/api/admin/homepage/configs/[id]`         | Update a draft                                      |
| `POST`   | `/api/admin/homepage/configs/[id]/publish` | Publish a draft                                     |
| `POST`   | `/api/admin/homepage/configs/[id]/restore` | Restore a published version into a new draft        |

### Public / Internal Endpoints (`gia-pha-web`)

| Method | Endpoint                   | Description                                                            |
| ------ | -------------------------- | ---------------------------------------------------------------------- |
| `GET`  | `/api/public/homepage`     | Return the latest published config for preview or external consumption |
| `POST` | `/api/revalidate/homepage` | Revalidate the homepage after publish                                  |

## 7. UX & Design

- Keep the existing Imperial Heritage visual language
- Use a checkerboard editing surface behind transparent areas
- Show the editor only on screens `>= 1280px`
- Show a “desktop required” empty state on smaller screens
- Use the current admin styling system instead of introducing a separate UI language
- Make the canvas feel precise and operational, not decorative

## 8. Technical Constraints

- Supabase Storage remains the single asset store
- Use `@dnd-kit` for layer list reordering only
- Use Pointer Events for freeform drag/resize on the scene canvas
- Preview and public homepage must share the same scene math and alpha hit-testing helpers
- Do not introduce a separate mobile layout editor in v1
- Preserve fallback to the current static homepage until the first dynamic publish is live

## 9. Success Metrics

- Admin can update the homepage background + overlay placements in under 5 minutes
- Published changes appear on `gia-pha-web` within 60 seconds, and normally within a few seconds after explicit revalidation
- Hover highlight and click behavior in preview match production behavior
- Rollback to a previous published version completes in under 10 seconds

## 10. Out of Scope (v1)

- Separate mobile-specific layer layouts
- Per-layer custom hover animation editors
- Collaborative multi-user editing
- Server-side image compositing as part of the editor workflow
- Multi-page scene editing beyond the root homepage
