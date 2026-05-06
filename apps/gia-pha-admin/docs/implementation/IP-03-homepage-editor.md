# IP-03: Homepage Visual Editor — Implementation Plan

> **PRD Reference:** [PRD-03-homepage-editor.md](../prd/PRD-03-homepage-editor.md)

---

## Phase Overview

| Phase       | Description                                            | Estimated Effort |
| ----------- | ------------------------------------------------------ | ---------------- |
| **Phase 1** | Shared types/runtime, Prisma schema, storage migration | 2–3 days         |
| **Phase 2** | Admin asset APIs and draft/config APIs                 | 2–3 days         |
| **Phase 3** | Editor route shell, state, and layout                  | 2–3 days         |
| **Phase 4** | Scene canvas interactions and layer tooling            | 3–4 days         |
| **Phase 5** | Public renderer, hover runtime, and preview parity     | 2–3 days         |
| **Phase 6** | Publish flow, revalidation, version history            | 1–2 days         |
| **Phase 7** | Migration seed, QA, and polish                         | 1–2 days         |

**Total estimated effort: 13–20 days**

---

## Core Implementation Decisions

These decisions should be treated as fixed unless a later technical review finds a blocker:

1. **Scene coordinates use background pixels, not percentages.**
   The background image's natural size becomes the canonical scene coordinate space.
2. **Admin and public rendering share runtime helpers.**
   Crop math, z-order sorting, and alpha hit-testing must come from the same source.
3. **Assets are first-class records.**
   Reusable uploads live in a dedicated `HomepageAsset` table instead of being anonymous URLs embedded only in JSON.
4. **Admin APIs follow the repo's existing `/api/admin/*` convention.**
5. **`gia-pha-web` reads homepage data directly from Prisma/server helpers.**
   Do not make the homepage server component call itself over HTTP with `NEXT_PUBLIC_API_URL`.
6. **Publishing triggers explicit revalidation in `gia-pha-web`.**
   This keeps the live site fresh without relying only on time-based ISR.

---

## Phase 1: Shared Runtime, Schema & Storage

### Task 1.1: Create a Shared Scene Runtime Package

**Directory:** `packages/homepage-scene/`

Create a new workspace package for pure shared logic. Keep it framework-light and reusable by both apps.

**Recommended files:**

```text
packages/homepage-scene/
├── package.json
└── src/
    ├── types.ts
    ├── geometry.ts
    ├── alpha-hit-test.ts
    └── index.ts
```

**Responsibilities:**

- Shared TypeScript scene types
- Cover-fit viewport math
- Layer hit-test ordering helpers
- Alpha sampling utilities for PNG layers

**Key exported types:**

```ts
export type ScenePreviewMode = "scene" | "desktop" | "mobile";

export interface SceneFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HomepageLayerLink {
  href: string;
  tooltip: string;
  ariaLabel: string;
  external: boolean;
}

export interface HomepageLayerSnapshot {
  id: string;
  assetId: string;
  name: string;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  frame: SceneFrame;
  zIndex: number;
  opacity: number;
  blendMode: "normal" | "screen" | "multiply";
  visible: boolean;
  locked: boolean;
  link: HomepageLayerLink;
}

export interface HomepageSceneSnapshot {
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  layers: HomepageLayerSnapshot[];
}
```

### Task 1.2: Prisma Schema — `HomepageAsset` and `HomepageConfig`

**File:** `packages/db/prisma/schema.prisma`

These models should live in the existing `admin` schema, matching the admin-owned nature of the feature.

```prisma
enum HomepageAssetKind {
  BACKGROUND
  OVERLAY

  @@schema("admin")
}

enum HomepageConfigStatus {
  DRAFT
  PUBLISHED
  ARCHIVED

  @@schema("admin")
}

model HomepageAsset {
  id         String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kind       HomepageAssetKind @default(OVERLAY)
  fileName   String            @map("file_name") @db.VarChar(255)
  storageKey String            @unique @map("storage_key") @db.VarChar(500)
  publicUrl  String            @map("public_url") @db.VarChar(1000)
  mimeType   String            @map("mime_type") @db.VarChar(100)
  fileSize   Int               @map("file_size")
  width      Int
  height     Int
  hasAlpha   Boolean?          @map("has_alpha")
  uploadedBy String?           @map("uploaded_by") @db.Uuid
  createdAt  DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([kind, createdAt(sort: Desc)])
  @@map("homepage_assets")
  @@schema("admin")
}

model HomepageConfig {
  id                String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  status            HomepageConfigStatus @default(DRAFT)
  version           Int?                 @unique
  name              String               @db.VarChar(160)
  backgroundAssetId String               @map("background_asset_id") @db.Uuid
  backgroundWidth   Int                  @map("background_width")
  backgroundHeight  Int                  @map("background_height")
  layers            Json
  createdBy         String               @map("created_by") @db.Uuid
  publishedBy       String?              @map("published_by") @db.Uuid
  publishedAt       DateTime?            @map("published_at") @db.Timestamptz(6)
  basedOnConfigId   String?              @map("based_on_config_id") @db.Uuid
  createdAt         DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([status, updatedAt(sort: Desc)])
  @@index([publishedAt(sort: Desc)])
  @@map("homepage_configs")
  @@schema("admin")
}
```

**Important notes:**

- `version` is `null` for drafts and assigned only when a draft is published
- `layers` remains JSON because each published config is a complete scene snapshot
- Assets remain separately queryable through `HomepageAsset`

**Actions:**

1. Add enums and models to the shared Prisma schema
2. Run `npm run db:migrate:dev -- --name add_homepage_editor_models`
3. Regenerate Prisma clients

### Task 1.3: Supabase Storage Bucket Migration

**Directory:** `apps/gia-pha-web/supabase/migrations/`

The repo already keeps Supabase migrations under `apps/gia-pha-web/supabase/migrations`, so add the bucket migration there.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homepage-assets',
  'homepage-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
);

create policy "Public read access for homepage assets"
on storage.objects for select
using (bucket_id = 'homepage-assets');
```

**Folder convention inside the bucket:**

- `backgrounds/...`
- `overlays/...`

### Task 1.4: Shared Validation Schemas

**Recommended files:**

- `apps/gia-pha-admin/src/lib/homepage/schemas.ts`
- `apps/gia-pha-web/src/lib/homepage/schemas.ts`

Use `zod` request/response schemas that align with the shared runtime types.

---

## Phase 2: Admin APIs & Storage Helpers

### Task 2.1: Add Server-Only Supabase Helper

**File:** `apps/gia-pha-admin/src/lib/server/homepage-storage.ts`

Use `@supabase/supabase-js` on the server only. Do not expose service-role operations to the client.

```ts
import { createClient } from "@supabase/supabase-js";

export const homepageStorage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Helper responsibilities:**

- Upload background/overlay assets
- Build storage keys
- Return asset metadata
- Delete unused assets
- List library assets

### Task 2.2: Asset API Routes

**Directory:** `apps/gia-pha-admin/src/app/api/admin/homepage/assets/`

| File                 | Method   | Purpose                  |
| -------------------- | -------- | ------------------------ |
| `route.ts`           | `GET`    | List all homepage assets |
| `route.ts`           | `POST`   | Upload a new asset       |
| `[assetId]/route.ts` | `DELETE` | Delete an unused asset   |

**Upload flow:**

1. Verify session
2. Parse `multipart/form-data`
3. Validate file type and size
4. Read image dimensions and alpha hint
5. Upload to Supabase
6. Insert a `HomepageAsset` record
7. Return normalized asset metadata

**Delete flow:**

1. Verify session
2. Ensure asset is not referenced by any draft or published config
3. Remove file from Supabase
4. Delete DB record

### Task 2.3: Config API Routes

**Directory:** `apps/gia-pha-admin/src/app/api/admin/homepage/configs/`

| File                    | Method | Purpose                                      |
| ----------------------- | ------ | -------------------------------------------- |
| `route.ts`              | `GET`  | List drafts + published versions             |
| `route.ts`              | `POST` | Create a new draft                           |
| `[id]/route.ts`         | `GET`  | Fetch one config                             |
| `[id]/route.ts`         | `PUT`  | Update a draft                               |
| `[id]/publish/route.ts` | `POST` | Publish a draft                              |
| `[id]/restore/route.ts` | `POST` | Restore a published version into a new draft |

**Draft creation behavior:**

- Default: clone the latest published config
- Optional: create an empty draft if no published config exists

**Publish behavior:**

- `SUPPORT` must receive `403`
- `SUPER_ADMIN` only
- Transaction steps:
  1. Load draft
  2. Validate background and layer assets still exist
  3. Compute next published `version`
  4. Archive the previous published config
  5. Mark current draft as `PUBLISHED`
  6. Set `publishedAt` and `publishedBy`

### Task 2.4: Access Rules

Use the actual roles from the current schema:

- `SUPPORT`: asset upload, asset list, draft CRUD, preview
- `SUPER_ADMIN`: everything above plus publish, restore, asset deletion

---

## Phase 3: Editor Route, State & Layout

### Task 3.1: Editor Page Shell

**Files:**

- `apps/gia-pha-admin/src/app/(admin)/homepage-editor/page.tsx`
- `apps/gia-pha-admin/src/components/homepage/HomepageEditorClient.tsx`

Use the page as the authenticated shell and move the interactive editor into a client component.

**Layout target:**

```text
┌──────────────────────────────────────────────────────────────┐
│ Toolbar: Undo | Redo | View Mode | Zoom | Save | Preview | Publish │
├──────────────┬────────────────────────────────┬────────────┤
│ Layer Panel  │ Scene Canvas                   │ Inspector  │
│              │ - full scene view              │            │
│              │ - desktop crop guide           │            │
│              │ - mobile crop guide            │            │
├──────────────┴────────────────────────────────┴────────────┤
│ Asset Library                                                │
└──────────────────────────────────────────────────────────────┘
```

### Task 3.2: Zustand Store

**File:** `apps/gia-pha-admin/src/store/homepage-editor.ts`

```ts
interface EditorState {
  configId: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | null;
  name: string;

  backgroundAsset: HomepageAsset | null;
  sceneSize: { width: number; height: number } | null;
  layers: HomepageLayerSnapshot[];

  selectedLayerId: string | null;
  previewMode: "scene" | "desktop" | "mobile";
  zoom: number;
  isDirty: boolean;

  history: EditorSnapshot[];
  historyIndex: number;

  loadConfig: (config: HomepageConfigResponse) => void;
  setBackground: (asset: HomepageAsset) => void;
  addLayerFromAsset: (asset: HomepageAsset) => void;
  updateLayer: (id: string, patch: Partial<HomepageLayerSnapshot>) => void;
  moveLayer: (id: string, x: number, y: number) => void;
  resizeLayer: (id: string, frame: SceneFrame) => void;
  reorderLayer: (id: string, newZIndex: number) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  setPreviewMode: (mode: ScenePreviewMode) => void;
  setZoom: (zoom: number) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}
```

### Task 3.3: Desktop Guard

Show a non-editable screen when viewport width is below the minimum supported editor size.

---

## Phase 4: Scene Canvas Interactions

### Task 4.1: Scene Canvas Component

**File:** `apps/gia-pha-admin/src/components/homepage/SceneCanvas.tsx`

**Approach:**

- Use normal DOM elements for editing
- Render the scene in background pixel space
- Apply zoom only to the editor viewport
- Draw desktop/mobile crop guides on top of the same scene

**Key behaviors:**

- Background `<img>` uses natural scene ratio
- Layers are absolutely positioned by `frame.x/y/width/height`
- Selection outline is box-based for editing
- Preview mode overlay shows the live homepage crop area

### Task 4.2: Layer Interaction Component

**File:** `apps/gia-pha-admin/src/components/homepage/SceneLayer.tsx`

Use **Pointer Events** rather than mouse-only handlers:

- `pointerdown`
- `pointermove`
- `pointerup`
- `setPointerCapture`

**Why:**

- Cleaner drag lifecycle
- Better modern browser behavior
- Less brittle than `mousedown` / `mousemove` / `mouseup`

**Interaction rules:**

- Drag only when layer is not locked
- Resize with corner handles
- Clamp movement so the layer cannot disappear entirely outside the scene
- Hold `Shift` to preserve aspect ratio while resizing
- Arrow keys nudge by `1px`
- `Shift + Arrow` nudges by `10px`

### Task 4.3: Asset Library Panel

**File:** `apps/gia-pha-admin/src/components/homepage/AssetLibrary.tsx`

Features:

- Filter by `BACKGROUND` / `OVERLAY`
- Search by filename
- Thumbnail preview
- “Set as Background” for backgrounds
- “Add to Canvas” for overlays
- Show dimensions and usage info

### Task 4.4: Layer Panel

**File:** `apps/gia-pha-admin/src/components/homepage/LayerPanel.tsx`

Use `@dnd-kit/sortable` only for layer list reordering.

Features:

- Visibility toggle
- Lock toggle
- Select layer
- Duplicate
- Delete from draft
- Bring forward / send backward

### Task 4.5: Properties Panel

**File:** `apps/gia-pha-admin/src/components/homepage/PropertiesPanel.tsx`

Properties should update store state immediately, but draft persistence should happen only on explicit save or publish.

---

## Phase 5: Shared Runtime, Public Render & Preview Parity

### Task 5.1: Shared Geometry & Hit-Test Helpers

**Files:** `packages/homepage-scene/src/geometry.ts`, `packages/homepage-scene/src/alpha-hit-test.ts`

Implement helpers for:

- Scene-to-viewport scaling
- `object-fit: cover` equivalent crop math
- Visible layer sorting by hit priority
- Alpha sampling on positioned/scaled PNG layers

### Task 5.2: Public Scene Renderer in `gia-pha-web`

**Recommended files:**

- `apps/gia-pha-web/src/components/homepage-scene/HomepageScene.tsx`
- `apps/gia-pha-web/src/components/homepage-scene/useAlphaScene.ts`

This replaces the current hardcoded assumptions in `InteractiveScene.tsx`.

**Current reality to preserve:**

- Hover highlight
- Tooltip
- Opaque-pixel hit-testing
- Z-order-aware click targeting

### Task 5.3: Homepage Data Loader

**Recommended file:** `apps/gia-pha-web/src/lib/homepage/get-published-homepage.ts`

Use Prisma directly inside the web app. Do not make the homepage page fetch itself over HTTP.

```ts
import { prisma } from "@/lib/prisma";

export async function getPublishedHomepageConfig() {
  return prisma.homepageConfig.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
}
```

### Task 5.4: Update Homepage Route

**File:** `apps/gia-pha-web/src/app/(marketing)/page.tsx`

Behavior:

1. Load published config via server helper
2. If none exists, fall back to the current static homepage
3. Render `HomepageScene` with background + layers

### Task 5.5: Public API Route

**File:** `apps/gia-pha-web/src/app/api/public/homepage/route.ts`

This endpoint is useful for preview tooling and future external consumers, but the server-rendered homepage itself should not depend on an HTTP round trip to the same app.

### Task 5.6: Admin Preview Uses Same Runtime Rules

**Files:**

- `apps/gia-pha-admin/src/components/homepage/PreviewModal.tsx`
- `apps/gia-pha-admin/src/components/homepage/PreviewScene.tsx`

The preview may have admin-specific shell UI, but must reuse the shared geometry and hit-test helpers so it matches production.

---

## Phase 6: Publish Flow, Revalidation & Version History

### Task 6.1: Revalidation Endpoint in `gia-pha-web`

**File:** `apps/gia-pha-web/src/app/api/revalidate/homepage/route.ts`

Use a dedicated endpoint rather than a generic query-string-based revalidate route.

```ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidation-secret");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/");
  return NextResponse.json({ revalidated: true });
}
```

### Task 6.2: Revalidation Helper in Admin

**File:** `apps/gia-pha-admin/src/lib/homepage/revalidate-homepage.ts`

This helper should call the web app after a successful publish.

**Expected env vars:**

- `GIA_PHA_WEB_URL`
- `REVALIDATION_SECRET`

### Task 6.3: Publish Dialog

**File:** `apps/gia-pha-admin/src/components/homepage/PublishDialog.tsx`

Flow:

1. Confirm publish
2. Save pending draft changes if needed
3. Call publish endpoint
4. Trigger revalidation helper
5. Show success toast and live-site link

### Task 6.4: Version History Drawer

**File:** `apps/gia-pha-admin/src/components/homepage/VersionHistoryDrawer.tsx`

Show:

- Published version number
- Publish date
- Published by
- Preview action
- Restore action

---

## Phase 7: Migration Seed, QA & Polish

### Task 7.1: Seed the First Dynamic Draft from Current Static Homepage

There is already a static homepage implementation in `gia-pha-web`, including:

- `public/homepage/2.png`
- `public/homepage/3.png`
- `public/homepage/4.png`
- `public/homepage/5.png`
- `public/homepage/6.png`
- link metadata inside `src/app/(marketing)/home/InteractiveScene.tsx`

Add a one-time migration/seed path so the first draft can be created from those assets instead of rebuilding everything manually.

**Acceptable approaches:**

- Seed script
- Protected admin endpoint
- Manual DB seed runbook

### Task 7.2: Edge Cases

- [ ] Empty state when no background exists yet
- [ ] Aspect-ratio warning when background changes significantly
- [ ] Upload error handling
- [ ] Asset delete blocked when referenced by a config
- [ ] Publish blocked when no background exists
- [ ] Publish blocked when draft has zero visible layers, if product decides that is invalid
- [ ] Concurrent draft save protection via `updatedAt`
- [ ] Mobile admin access shows desktop-only message

### Task 7.3: QA Checklist

- [ ] Overlay upload works for transparent PNGs
- [ ] Drag/resize persists correctly after reload
- [ ] Desktop crop guide matches public homepage
- [ ] Mobile crop guide matches public homepage
- [ ] Hover highlight in preview matches production
- [ ] Highest visible layer wins during overlap
- [ ] Publish invalidates live homepage
- [ ] Restore creates a new draft with correct content

### Task 7.4: Admin Sidebar Update

**File:** `apps/gia-pha-admin/src/components/layout/AdminSidebar.tsx`

Add a real sidebar entry in the existing hardcoded nav component:

```tsx
<Link href="/homepage-editor" ...>
  <span className="material-symbols-outlined">home</span>
  <span className="text-sm font-medium">Trang Chủ</span>
</Link>
```

---

## File Structure Summary

```text
apps/gia-pha-admin/
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   └── homepage-editor/
│   │   │       └── page.tsx
│   │   └── api/admin/homepage/
│   │       ├── assets/
│   │       │   ├── route.ts
│   │       │   └── [assetId]/route.ts
│   │       └── configs/
│   │           ├── route.ts
│   │           └── [id]/
│   │               ├── route.ts
│   │               ├── publish/route.ts
│   │               └── restore/route.ts
│   ├── components/homepage/
│   │   ├── HomepageEditorClient.tsx
│   │   ├── SceneCanvas.tsx
│   │   ├── SceneLayer.tsx
│   │   ├── AssetLibrary.tsx
│   │   ├── LayerPanel.tsx
│   │   ├── PropertiesPanel.tsx
│   │   ├── PreviewModal.tsx
│   │   ├── PreviewScene.tsx
│   │   ├── PublishDialog.tsx
│   │   └── VersionHistoryDrawer.tsx
│   ├── lib/
│   │   ├── homepage/
│   │   │   ├── revalidate-homepage.ts
│   │   │   └── schemas.ts
│   │   └── server/
│   │       └── homepage-storage.ts
│   └── store/
│       └── homepage-editor.ts
│
apps/gia-pha-web/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── public/homepage/route.ts
│   │       └── revalidate/homepage/route.ts
│   ├── components/homepage-scene/
│   │   ├── HomepageScene.tsx
│   │   └── useAlphaScene.ts
│   └── lib/homepage/
│       ├── get-published-homepage.ts
│       └── schemas.ts
│
packages/
├── db/
│   └── prisma/schema.prisma
└── homepage-scene/
    └── src/
        ├── types.ts
        ├── geometry.ts
        ├── alpha-hit-test.ts
        └── index.ts
```

---

## Dependencies

### Existing dependencies already available

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `zustand`
- `zod`
- `lucide-react`
- `swr`

### One additional dependency required

- Add `@supabase/supabase-js` to `apps/gia-pha-admin`

### Implementation note

Keep using standard `<img>` elements for editor/preview surfaces unless there is a strong reason to switch. That avoids adding extra `next/image` remote-image config to the admin app.

---

## Migration Path from Static to Dynamic

1. Ship schema, storage, admin APIs, and public fallback support
2. Seed the first draft from the current static homepage assets
3. Let admin verify the scene in preview
4. Publish the first dynamic version
5. Keep static fallback code in place until the dynamic scene is validated in production
6. Remove or de-emphasize legacy static assets later if desired
