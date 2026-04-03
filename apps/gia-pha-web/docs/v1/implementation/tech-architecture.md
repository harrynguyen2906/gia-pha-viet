# Heritage Cloud — System Architecture Document

> Kiến trúc hệ thống end-to-end, từ frontend component structure đến deployment pipeline.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                               │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Homepage  │  │ Lineage  │  │   Map    │  │  Ritual /    │   │
│  │ Module    │  │ Module   │  │  Module  │  │  Duty Module │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │               │            │
│  ┌────┴──────────────┴──────────────┴───────────────┴──────┐    │
│  │                 Shared Layer                              │    │
│  │  Components (UI Kit) │ Hooks │ Store │ API Client        │    │
│  └─────────────────────────┬────────────────────────────────┘    │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTPS / WSS
┌────────────────────────────┼─────────────────────────────────────┐
│                        SERVER TIER                                │
│                             │                                     │
│  ┌──────────────────────────┴───────────────────────────────┐    │
│  │              Next.js App Router (Vercel Edge)            │    │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌────────┐ │    │
│  │  │ API      │  │ Auth     │  │ WebSocket │  │ Cron   │ │    │
│  │  │ Routes   │  │ (NextAuth│  │ Server    │  │ Jobs   │ │    │
│  │  │ /api/v1  │  │  + JWT)  │  │ (notif.)  │  │        │ │    │
│  │  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └───┬────┘ │    │
│  └───────┼──────────────┼──────────────┼────────────┼───────┘    │
│          │              │              │            │             │
│  ┌───────┴──────────────┴──────────────┴────────────┴───────┐    │
│  │                    Prisma ORM Layer                        │    │
│  └──────────────────────────┬────────────────────────────────┘    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
┌─────────────────────────────┼────────────────────────────────────┐
│                        DATA TIER                                  │
│    ┌────────────┐   ┌───────┴──────┐   ┌─────────────────┐      │
│    │ PostgreSQL │   │ Cloudflare   │   │     Redis       │      │
│    │ 16+        │   │ R2 / AWS S3  │   │   (sessions,    │      │
│    │ (primary)  │   │ (file store) │   │    rate-limit)  │      │
│    └────────────┘   └──────────────┘   └─────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Next.js App Router Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, providers, theme)
│   ├── page.tsx                  # Homepage (PRD-01)
│   ├── (auth)/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── lineage/
│   │   ├── layout.tsx            # Sidebar + inspector panel layout
│   │   ├── page.tsx              # Neural Root view (default)
│   │   ├── traditional/page.tsx  # Traditional tree view
│   │   └── [memberId]/page.tsx   # Digital Profile page
│   ├── map/
│   │   ├── page.tsx              # Ancestral Map (PRD-03)
│   │   └── register/page.tsx     # Site registration form
│   ├── rituals/
│   │   ├── layout.tsx            # Sidebar layout
│   │   ├── page.tsx              # Calendar view (PRD-04)
│   │   └── [ritualId]/page.tsx   # Ritual detail overlay
│   ├── duties/
│   │   ├── layout.tsx            # Sidebar layout
│   │   ├── page.tsx              # Kanban board (PRD-05)
│   │   └── create/page.tsx       # Duty creation form
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── v1/
│           ├── members/route.ts
│           ├── members/[id]/route.ts
│           ├── relationships/route.ts
│           ├── sites/route.ts
│           ├── rituals/route.ts
│           ├── duties/route.ts
│           ├── search/route.ts
│           ├── clan/route.ts
│           ├── notifications/route.ts
│           └── lunar/route.ts
│
├── components/
│   ├── ui/                       # Design System primitives
│   │   ├── ParchmentCard.tsx
│   │   ├── LacquerButton.tsx
│   │   ├── GoldShimmerButton.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── DeceasedAvatar.tsx
│   │   ├── WoodCarvingBorder.tsx
│   │   ├── GoldLeafFrame.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Toast.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── layout/                   # Structural components
│   │   ├── GlobalHeader.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DetailPanel.tsx
│   │   └── MobileBottomSheet.tsx
│   │
│   ├── lineage/                  # Module: Lineage Visualization
│   │   ├── NeuralRootCanvas.tsx  # D3.js force-directed graph
│   │   ├── TraditionalTree.tsx   # D3-hierarchy top-down tree
│   │   ├── MemberNode.tsx        # Shared node component
│   │   ├── MemberInspector.tsx   # Right panel detail
│   │   ├── DigitalProfile.tsx    # Full profile page
│   │   └── MemberInputModal.tsx  # Create/edit member form
│   │
│   ├── map/                      # Module: Ancestral Map
│   │   ├── MapContainer.tsx      # Mapbox GL wrapper
│   │   ├── SitePin.tsx           # Custom map marker
│   │   ├── PanoramaViewer.tsx    # Pannellum 360° viewer
│   │   ├── SiteDetailPanel.tsx   # Site info panel
│   │   └── SiteRegistrationForm.tsx
│   │
│   ├── rituals/                  # Module: Ritual Calendar
│   │   ├── CalendarGrid.tsx      # Monthly grid with lunar dates
│   │   ├── MemorialDayCell.tsx   # Highlighted day with event
│   │   ├── RitualDetailPanel.tsx # Right panel with instructions
│   │   └── DutyChecklist.tsx     # Ritual-specific duty list
│   │
│   └── duties/                   # Module: Family Duty Management
│       ├── KanbanBoard.tsx       # DnD columns
│       ├── DutyCard.tsx          # Individual duty card
│       ├── DutyColumn.tsx        # Queue | Active | Completed
│       ├── WorkloadTable.tsx     # Member workload dashboard
│       ├── DutyStats.tsx         # Header statistics
│       └── DutyCreateModal.tsx   # New duty form
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Auth state + role helpers
│   ├── useMembers.ts             # SWR hook for members
│   ├── useRituals.ts             # SWR hook for rituals
│   ├── useDuties.ts              # SWR hook for duties
│   ├── useSites.ts               # SWR hook for sites
│   ├── useLunarDate.ts           # Solar↔Lunar conversion
│   ├── useDebounce.ts
│   ├── useMediaUpload.ts         # Upload with progress
│   └── useWebSocket.ts           # Notification WS connection
│
├── lib/                          # Shared utilities
│   ├── api.ts                    # Fetch wrapper with auth headers
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── lunar.ts                  # Lunar calendar conversion
│   ├── validators.ts             # Zod schemas for API validation
│   ├── permissions.ts            # RBAC helper functions
│   ├── upload.ts                 # S3/R2 upload utilities
│   └── constants.ts              # Shared enums, config values
│
├── store/                        # Client-side state (Zustand)
│   ├── useNavigationStore.ts     # Sidebar state, breadcrumbs
│   ├── useLineageStore.ts        # Selected node, view mode, zoom
│   └── useNotificationStore.ts   # Unread count, toast queue
│
├── styles/
│   ├── globals.css               # Tailwind directives + CSS vars
│   └── textures/                 # Background images
│       ├── natural-paper.png
│       ├── parchment.png
│       └── wood-grain.png
│
├── types/                        # TypeScript definitions
│   ├── member.ts
│   ├── ritual.ts
│   ├── duty.ts
│   ├── site.ts
│   └── api.ts                    # Request/Response generics
│
└── prisma/
    ├── schema.prisma             # Database schema
    ├── seed.ts                   # Dev + prod seed data
    └── migrations/
```

### 2.2 State Management Strategy

| Scope | Solution | Data |
|-------|----------|------|
| **Server state** | SWR (`useSWR`) | Members, rituals, duties, sites — all fetched from API |
| **Client-only UI state** | Zustand (lightweight stores) | Sidebar open/close, selected node, view mode, zoom level |
| **Form state** | React Hook Form + Zod | Member input modal, site registration, duty creation |
| **Auth state** | NextAuth `useSession()` | Current user, role, clan ID |
| **Real-time** | WebSocket + Zustand | Notification count, live duty status updates |

**Data Fetching Pattern (SWR):**
```typescript
// hooks/useMembers.ts
function useMembers(params?: MemberListParams) {
  const key = params ? `/api/v1/members?${serialize(params)}` : '/api/v1/members';
  return useSWR<MemberListResponse>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

// Optimistic update for duty drag-and-drop
function useDutyMutation() {
  const { mutate } = useSWRConfig();
  return async (dutyId: string, newStatus: DutyStatus) => {
    await mutate('/api/v1/duties', async (current) => {
      // Optimistic: move card immediately
      return moveCardInArray(current, dutyId, newStatus);
    }, { revalidate: false });
    // Then persist
    await fetch(`/api/v1/duties/${dutyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    mutate('/api/v1/duties'); // revalidate
  };
}
```

### 2.3 Code Splitting & Lazy Loading

| Module | Strategy |
|--------|----------|
| D3.js (Neural Root, Traditional Tree) | `next/dynamic` with `ssr: false` |
| Mapbox GL JS | `next/dynamic` with `ssr: false`, loaded on `/map` route only |
| Pannellum (360° Viewer) | Dynamic import on demand (click pin → load viewer) |
| @dnd-kit | Bundled with duties page (relatively small) |
| Sharp (image processing) | Server-side only, not bundled in client |

```typescript
// Lazy load Mapbox only when Map page is visited
const MapContainer = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
```

---

## 3. Backend Architecture

### 3.1 API Layer Pattern

```typescript
// app/api/v1/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/permissions';

const ListMembersSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  generation: z.coerce.number().optional(),
  search: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const params = ListMembersSchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );

  const members = await prisma.member.findMany({
    where: {
      clanId: session.user.clanId,
      deletedAt: null,
      ...(params.generation && { generation: params.generation }),
      ...(params.search && {
        fullName: { contains: params.search, mode: 'insensitive' },
      }),
    },
    take: params.limit + 1,
    ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = members.length > params.limit;
  if (hasMore) members.pop();

  return NextResponse.json({
    data: members,
    pagination: {
      nextCursor: hasMore ? members[members.length - 1].id : null,
      hasMore,
    },
  });
}
```

### 3.2 Authentication Flow

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐
│  Client   │────▶│  NextAuth  │────▶│  Credentials  │────▶│ Postgres │
│  Browser  │◀────│  /api/auth │◀────│  Provider     │◀────│  users   │
└──────────┘     └───────────┘     └──────────────┘     └──────────┘
      │                                                       │
      │  (Future: OAuth providers — Google, Facebook)         │
      │                                                       │
      ▼                                                       │
  JWT Session Token                                           │
  {                                                           │
    userId: "uuid",                                           │
    role: "HEAD_OF_HOUSE",                                    │
    clanId: "uuid",                                           │
    name: "Nguyễn Văn A"                                      │
  }                                                           │
```

**Session Strategy:** JWT (stateless)
- Token stored in httpOnly secure cookie
- Server middleware extracts and validates on every API request
- Token refresh: automatic via NextAuth rotation

### 3.3 Authorization Middleware

```typescript
// lib/permissions.ts
export function requireRole(session: Session, ...roles: UserRole[]) {
  if (!roles.includes(session.user.role)) {
    throw new AppError('FORBIDDEN', 403);
  }
}

export function requireSameClan(session: Session, resourceClanId: string) {
  if (session.user.clanId !== resourceClanId) {
    throw new AppError('CROSS_CLAN_ACCESS', 403);
  }
}

// Usage in API route
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  requireRole(session, 'ADMIN', 'HEAD_OF_HOUSE');

  const member = await prisma.member.findUniqueOrThrow({ where: { id: params.id } });
  requireSameClan(session, member.clanId);

  await prisma.member.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return new NextResponse(null, { status: 204 });
}
```

### 3.4 File Upload Architecture

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────┐
│  Client   │────▶│ API Route    │────▶│ Sharp         │────▶│ R2 / S3    │
│  (upload) │     │ /api/v1/     │     │ (resize,      │     │ (store     │
│           │     │ members/:id/ │     │  thumbnail,   │     │  original  │
│           │     │ media        │     │  WebP convert) │     │  + thumb)  │
└──────────┘     └──────────────┘     └───────────────┘     └────────────┘
                                                                   │
                                                                   ▼
                                                            ┌────────────┐
                                                            │ CDN Edge   │
                                                            │ (Cloudflare│
                                                            │  / Vercel) │
                                                            └────────────┘
```

**Upload Flow:**
1. Client sends `multipart/form-data` to API route
2. Server validates file type + size (max 10MB photos, 50MB panorama)
3. Sharp processes: resize, generate thumbnail (200×200), convert to WebP
4. Upload original + thumbnail to R2/S3 with content-type headers
5. Save URL references in `member_media` or `site_media` table
6. Return URLs to client

**Security:**
- Files are stored with random UUID filenames (no user-controlled paths)
- Content-Type validation (magic bytes, not just extension)
- Signed upload URLs for direct-to-S3 uploads (future optimization)

---

## 4. Database Architecture

> Full schema: `/docs/db-design/database-schema.md`

### 4.1 Connection Pooling

```
Next.js Edge Functions ──▶ Prisma ──▶ PgBouncer ──▶ PostgreSQL
                                       (pool)
```

- **PgBouncer** in transaction mode for serverless compatibility
- Connection limit: 20 per Vercel function instance
- Prisma connection pool: `connection_limit=5` per function

### 4.2 Key Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| members | `(clan_id, deleted_at)` | B-tree | All member queries scoped by clan |
| members | `(full_name)` | GIN trigram | Full-text search |
| grave_sites | `(location)` | GiST | Spatial distance queries |
| duties | `(clan_id, status, deleted_at)` | B-tree | Kanban board queries |
| ritual_events | `(clan_id, date_solar)` | B-tree | Calendar month queries |
| audit_logs | `(clan_id, created_at)` | B-tree | Audit trail queries |

### 4.3 Soft Delete Pattern

ALL main entities use `deleted_at: DateTime?` instead of hard delete:
- Queries always include `WHERE deleted_at IS NULL`
- Prisma middleware auto-filters soft-deleted records
- Background job permanently deletes records older than 90 days

```typescript
// Prisma middleware for automatic soft-delete filtering
prisma.$use(async (params, next) => {
  if (params.action === 'findMany' || params.action === 'findFirst') {
    if (['Member', 'GraveSite', 'Duty', 'RitualEvent'].includes(params.model)) {
      params.args.where = { ...params.args.where, deletedAt: null };
    }
  }
  return next(params);
});
```

---

## 5. Real-time Architecture

### 5.1 WebSocket for Notifications

```
┌──────────┐     ┌──────────────────┐     ┌──────────┐
│  Client   │◀──▶│  WS Server       │◀────│  API     │
│  Browser  │    │  (Socket.io or   │     │  Routes  │
│           │    │   Vercel WS API) │     │  (emit)  │
└──────────┘     └──────────────────┘     └──────────┘
```

**Events:**
- Server emits events when:
  - Duty assigned/status changed → notify assigned member
  - Ritual approaching → notify clan members
  - New member added → notify HEAD_OF_HOUSE
  - Offering placed → notify ancestor's caretaker

**Fallback:** If WebSocket unavailable, SWR polling every 30s.

---

## 6. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel Platform                       │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Edge        │  │ Serverless   │  │ Static Assets │  │
│  │ Functions   │  │ Functions    │  │ (CDN)         │  │
│  │ (middleware,│  │ (API routes, │  │ (JS, CSS,     │  │
│  │  auth check)│  │  SSR pages)  │  │  images)      │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────────┘  │
│         │                │                               │
└─────────┼────────────────┼───────────────────────────────┘
          │                │
          ▼                ▼
  ┌───────────────┐  ┌──────────────────┐
  │ Neon /        │  │ Cloudflare R2    │
  │ Supabase      │  │ (file storage)   │
  │ (PostgreSQL)  │  │                  │
  └───────────────┘  └──────────────────┘
```

### 6.1 Environment Strategy

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| `development` | Local dev | Local PostgreSQL (Docker) | `localhost:3000` |
| `preview` | PR previews | Neon branch DB (auto-created) | `pr-123.vercel.app` |
| `staging` | Pre-production | Neon staging branch | `staging.heritage-cloud.vn` |
| `production` | Live | Neon main branch | `heritage-cloud.vn` |

### 6.2 CI/CD Pipeline

```
Push to main
    │
    ▼
GitHub Actions
    ├── Lint (ESLint + Prettier check)
    ├── Type check (tsc --noEmit)
    ├── Unit tests (Vitest)
    ├── Build (next build)
    └── E2E tests (Playwright, headless Chrome)
         │
         ▼ (all pass)
    Vercel auto-deploy → Production
```

### 6.3 Database Hosting Options

| Provider | Pros | Cons |
|----------|------|------|
| **Neon** (recommended) | Serverless PostgreSQL, branching for previews, auto-scale, generous free tier | Limited regions |
| **Supabase** | Built-in auth, realtime, storage — all-in-one | May conflict with NextAuth approach |
| **Railway** | Simple setup, managed Postgres | No DB branching |

**Recommendation:** Neon for PostgreSQL (branching = 1 DB per PR preview).

---

## 7. Monitoring & Observability

| Layer | Tool | Tracks |
|-------|------|--------|
| **Error tracking** | Sentry | Runtime errors, unhandled rejections, API 500s |
| **Performance** | Vercel Analytics | Core Web Vitals (LCP, FID, CLS) |
| **API monitoring** | Sentry Tracing | Response times, slow queries, throughput |
| **Uptime** | Vercel / BetterUptime | Endpoint health checks, downtime alerts |
| **Logging** | Structured JSON logs (Pino) | API request/response, auth events, duty state changes |

### 7.1 Structured Logging

```typescript
// All API routes log structured JSON
logger.info({
  event: 'member.created',
  clanId: session.user.clanId,
  memberId: newMember.id,
  actorId: session.user.id,
  duration: Date.now() - start,
});
```

---

## 8. Security Architecture

### 8.1 Authentication Security
- Passwords hashed with **bcrypt** (cost factor 12)
- JWT tokens signed with RS256 (asymmetric)
- httpOnly, Secure, SameSite=Lax cookies
- CSRF protection via double-submit cookie pattern (NextAuth built-in)

### 8.2 Data Isolation
- **Clan-scoped queries:** Every DB query includes `WHERE clan_id = :userClanId`
- Prisma middleware enforces clan scope automatically
- Cross-clan access returns 403 `CROSS_CLAN_ACCESS`

### 8.3 Input Validation
- **Zod schemas** validate ALL incoming request bodies and query params
- File uploads validated by MIME type (magic bytes) not just Content-Type header
- SQL injection prevented by Prisma parameterized queries

### 8.4 Rate Limiting
- Per-IP + per-user rate limiting via Vercel Edge Middleware
- Backed by Redis (Upstash) for distributed rate counters
- Limits defined per endpoint category (see API Design §11)

### 8.5 Content Security
- CSP headers: restrict script sources to `self` + CDN domains
- Image sources: `self`, R2/S3 domain, Mapbox tiles
- No inline scripts
- XSS prevention: React auto-escapes by default + DOMPurify for user HTML input (biography field)
