# Heritage Cloud — API Design Document

> **Source of Truth** cho tất cả API endpoints. Frontend PHẢI gọi đúng endpoint, method, và payload format từ tài liệu này.

**Base URL:** `/api/v1`  
**Auth:** Bearer JWT token (NextAuth.js session)  
**Content-Type:** `application/json`  
**Naming:** kebab-case cho URL paths, camelCase cho JSON fields  
**Pagination:** Cursor-based (`cursor` + `limit`)  
**Error Format:** `{ error: { code: string, message: string, details?: any } }`

---

## 1. Authentication & Authorization

### 1.1 Auth Flow (NextAuth.js)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | NextAuth sign-in (credentials / OAuth) |
| POST | `/api/auth/signout` | NextAuth sign-out |
| GET | `/api/auth/session` | Get current session |

### 1.2 Authorization Middleware

Mọi request (trừ public GET) phải:
1. Verify JWT token → extract `userId`, `role`, `clanId`
2. Check `role` permission theo RBAC matrix (PRD-00 §8)
3. Scope data theo `clanId` — user chỉ thấy data trong clan của mình

```typescript
// Middleware pattern
type Permission = 'view' | 'create' | 'edit' | 'delete' | 'certify';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN:         ['view', 'create', 'edit', 'delete', 'certify'],
  HEAD_OF_HOUSE: ['view', 'create', 'edit', 'delete', 'certify'],
  ELDER:         ['view', 'create', 'edit'],
  MEMBER:        ['view'],
  GUEST:         ['view'],
};
```

---

## 2. Members API

### 2.1 List Members

```
GET /api/v1/members
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | — | Pagination cursor (member ID) |
| `limit` | number | 50 | Max items per page (max: 200) |
| `generation` | number | — | Filter by generation |
| `isDeceased` | boolean | — | Filter living/deceased |
| `search` | string | — | Full-text search on full_name |
| `branchName` | string | — | Filter by branch |
| `include` | string | — | Comma-separated: `parents,children,spouses,graveSite` |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Nguyễn Phúc Ánh",
      "gender": "MALE",
      "isDeceased": true,
      "birthDateSolar": "1762-02-08",
      "birthDateLunar": "15 tháng Giêng",
      "deathDateSolar": "1820-02-03",
      "avatarUrl": "https://...",
      "generation": 1,
      "lineageRole": "HEAD_OF_HOUSE",
      "branchName": "Chi Trưởng",
      "parentIds": [],
      "childIds": ["uuid1", "uuid2"],
      "spouseIds": ["uuid3"],
      "graveSiteId": "uuid4",
      "activeDutyCount": 0
    }
  ],
  "pagination": {
    "nextCursor": "uuid-of-last-item",
    "hasMore": true,
    "total": 128
  }
}
```

**Auth:** GUEST (public clan only), MEMBER+ (own clan)

### 2.2 Get Member Detail

```
GET /api/v1/members/:id
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `include` | string | `media,parents,children,spouses,graveSite,duties,offerings` |

**Response: 200 OK**
```json
{
  "data": {
    "id": "uuid",
    "fullName": "Nguyễn Phúc Ánh",
    "gender": "MALE",
    "isDeceased": true,
    "birthDateSolar": "1762-02-08",
    "birthDateLunar": "15 tháng Giêng",
    "deathDateSolar": "1820-02-03",
    "deathDateLunar": "8 tháng Chạp",
    "departureRite": "Lễ quốc tang",
    "avatarUrl": "https://...",
    "biography": "Vị vua sáng lập triều Nguyễn...",
    "generation": 1,
    "lineageRole": "HEAD_OF_HOUSE",
    "branchName": "Chi Trưởng",
    "parents": [],
    "children": [{ "id": "uuid1", "fullName": "...", "isDeceased": true }],
    "spouses": [{ "id": "uuid3", "fullName": "...", "marriageDate": "1780-01-01" }],
    "graveSite": { "id": "uuid4", "latitude": 16.4637, "longitude": 107.5909 },
    "media": [
      { "id": "uuid", "mediaType": "AVATAR", "url": "https://...", "thumbnailUrl": "https://..." }
    ],
    "offeringCount": { "thisMonth": 42, "total": 1250 }
  }
}
```

### 2.3 Create Member

```
POST /api/v1/members
```

**Auth:** HEAD_OF_HOUSE, ELDER (own branch)

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "gender": "MALE",
  "isDeceased": false,
  "birthDateSolar": "1990-05-15",
  "birthDateLunar": "21 tháng 4",
  "generation": 5,
  "lineageRole": "MEMBER",
  "branchName": "Chi Nhì",
  "biography": "...",
  "parentIds": ["uuid-parent1", "uuid-parent2"],
  "spouseId": "uuid-spouse",
  "dutyTags": ["RELIGIOUS", "MAINTENANCE"]
}
```

**Validation Rules:**
- `fullName`: required, 1–200 chars
- `gender`: required, enum
- `birthDateSolar`: optional, valid date, cannot be in future
- `deathDateSolar`: required when `isDeceased=true`, must be after birthDateSolar
- `generation`: required, 1–50
- `parentIds`: max 2, must exist in same clan

**Response: 201 Created** → returns full member object

**Side Effects:**
- Creates audit_log entry
- Sends MEMBER_ADDED notification to clan HEAD_OF_HOUSE
- Auto-creates relationships for parentIds
- Auto-creates member_spouses for spouseId

### 2.4 Update Member

```
PATCH /api/v1/members/:id
```

**Auth:** HEAD_OF_HOUSE, ELDER (own branch)

Partial update — only send fields to change. Same validation as Create.

**Response: 200 OK** → returns updated member object

### 2.5 Delete Member

```
DELETE /api/v1/members/:id
```

**Auth:** HEAD_OF_HOUSE only

Soft delete (sets `deleted_at`). Cascades soft-delete to relationships where this member is parent/child.

**Response: 204 No Content**

### 2.6 Member Media

```
GET  /api/v1/members/:id/media?type=PHOTO
POST /api/v1/members/:id/media         (multipart/form-data)
DELETE /api/v1/members/:id/media/:mediaId
```

**Upload:** Max 10MB per file, accepted: JPEG, PNG, WebP. Server generates thumbnail via Sharp.

### 2.7 Virtual Offerings

```
POST /api/v1/members/:id/offerings
```

**Auth:** MEMBER+

```json
{
  "offeringType": "INCENSE",
  "message": "Kính dâng hương hoa..."
}
```

```
GET /api/v1/members/:id/offerings?month=2026-02
```

Returns monthly offering count + recent offerings list.

---

## 3. Relationships API

### 3.1 Get Full Graph

```
GET /api/v1/relationships
```

Returns all edges (parent→child, spouse) for the current clan. Used by Neural Root and Traditional Tree views.

**Response: 200 OK**
```json
{
  "data": {
    "parentChild": [
      { "parentId": "uuid1", "childId": "uuid2", "type": "BIOLOGICAL" }
    ],
    "spouses": [
      { "memberAId": "uuid3", "memberBId": "uuid4", "isCurrent": true }
    ]
  }
}
```

### 3.2 Manage Relationships

```
POST   /api/v1/relationships          — Create parent→child link
DELETE /api/v1/relationships/:id      — Remove relationship
POST   /api/v1/member-spouses         — Create spouse link
DELETE /api/v1/member-spouses/:id     — Remove spouse link
```

---

## 4. Grave Sites API

### 4.1 List Sites

```
GET /api/v1/sites
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `condition` | string | Filter by condition enum |
| `siteType` | string | Filter by site type |
| `search` | string | Search by ancestor name, section_plot |
| `lat` | number | User latitude (for distance sort) |
| `lng` | number | User longitude (for distance sort) |
| `sortBy` | string | `distance`, `clan`, `condition` |
| `radius` | number | Max distance in km (requires lat/lng) |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "memberId": "uuid",
      "memberName": "Nguyễn Phúc Ánh",
      "sectionPlot": "Highland Sector C-14",
      "latitude": 16.4637,
      "longitude": 107.5909,
      "condition": "MAINTAINED",
      "siteType": "TEMPLE",
      "epitaph": "Thiên tử vạn niên...",
      "distanceKm": 5.2,
      "panoramaUrl": "https://...",
      "lastVisited": "2025-11-15"
    }
  ]
}
```

### 4.2 Get Site Detail

```
GET /api/v1/sites/:id?include=media,member
```

Returns full site with all media (panoramas, photos, 3D model URL).

### 4.3 Register Site

```
POST /api/v1/sites
```

**Auth:** HEAD_OF_HOUSE, ELDER, MEMBER

```json
{
  "memberId": "uuid-ancestor",
  "sectionPlot": "Nghĩa trang Bình Dưỡng, Lô C-14",
  "latitude": 16.4637,
  "longitude": 107.5909,
  "condition": "MAINTAINED",
  "siteType": "CEMETERY",
  "epitaph": "Muôn đời nhớ ơn..."
}
```

After creation, upload media via `POST /api/v1/sites/:id/media`.

### 4.4 Update Site

```
PATCH /api/v1/sites/:id
```

### 4.5 Site Media

```
GET    /api/v1/sites/:id/media
POST   /api/v1/sites/:id/media     (multipart/form-data, allows panorama + regular photos)
DELETE /api/v1/sites/:id/media/:mediaId
```

**Panorama upload:** Max 50MB, accepted: JPEG equirectangular. Server validates aspect ratio (~2:1).

### 4.6 Site Statistics

```
GET /api/v1/sites/stats
```

**Response:**
```json
{
  "totalSites": 25,
  "maintainedCount": 18,
  "needsVisitCount": 5,
  "visitorsThisMonth": 42,
  "maintenancePercentage": 72
}
```

---

## 5. Ritual Events API

### 5.1 List Rituals by Month

```
GET /api/v1/rituals?month=2026-04
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `month` | string | `YYYY-MM` format (required) |
| `ancestorId` | string | Filter by honored ancestor |
| `upcoming` | boolean | Only future events |
| `include` | string | `instructions,duties,ancestor` |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Giỗ Tổ - Nguyễn Phúc Ánh",
      "description": "Lễ giỗ lần thứ 206...",
      "ancestorId": "uuid",
      "ancestorName": "Nguyễn Phúc Ánh",
      "dateSolar": "2026-04-15",
      "dateLunar": "28 tháng 2 Âm lịch",
      "isRecurring": true,
      "isCertified": false,
      "instructions": [...],
      "duties": [...]
    }
  ]
}
```

### 5.2 Create Ritual

```
POST /api/v1/rituals
```

**Auth:** HEAD_OF_HOUSE, ELDER

```json
{
  "title": "Giỗ Cụ Nguyễn Văn B",
  "description": "Lễ giỗ hàng năm...",
  "ancestorId": "uuid",
  "dateSolar": "2026-08-15",
  "isRecurring": true,
  "lunarRecurrence": "15 tháng 7",
  "instructions": [
    { "icon": "potted_plant", "title": "Nhang đèn", "description": "3 cây nhang trầm...", "sortOrder": 1 },
    { "icon": "restaurant", "title": "Mâm cúng", "description": "Cơm, gà luộc, xôi...", "sortOrder": 2 }
  ],
  "duties": [
    { "description": "Dọn bàn thờ", "assignedGroup": "YOUTH", "sortOrder": 1 },
    { "description": "Nấu mâm cúng", "assignedGroup": "ELDERS", "sortOrder": 2 }
  ]
}
```

**Side Effects:**
- Auto-creates corresponding `duties` (Kanban) with category=RELIGIOUS if linked
- Sends RITUAL_REMINDER notifications at -3 days, -1 day, same day

### 5.3 Update / Delete Ritual

```
PATCH  /api/v1/rituals/:id
DELETE /api/v1/rituals/:id     (HEAD_OF_HOUSE only)
```

### 5.4 Certify Ritual

```
POST /api/v1/rituals/:id/certify
```

**Auth:** HEAD_OF_HOUSE only

**Pre-condition:** All ritual_duties must be `isCompleted = true`.

**Side Effects:**
- Sets `isCertified = true`, `certifiedBy`, `certifiedAt`
- Locks all ritual_duties (prevent further edits)
- Sends DUTY_COMPLETED notification

### 5.5 Lunar Conversion

```
GET /api/v1/lunar/convert?solar=2026-04-15
GET /api/v1/lunar/convert?month=2026-04   (batch for entire month)
```

**Response:**
```json
{
  "solar": "2026-04-15",
  "lunar": "28 tháng 2",
  "lunarYear": "Bính Ngọ",
  "zodiac": "Fire Horse"
}
```

---

## 6. Duties API (Kanban Board)

### 6.1 List Duties

```
GET /api/v1/duties
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `QUEUE`, `ACTIVE`, `COMPLETED` |
| `category` | string | `RELIGIOUS`, `MAINTENANCE`, `ARCHIVAL`, `SOCIAL` |
| `assignedTo` | string | Member UUID |
| `search` | string | Search title, description |
| `sortBy` | string | `priority`, `dueDate`, `createdAt` |

**Response:** Grouped by status for Kanban rendering:
```json
{
  "data": {
    "queue": [{ "id": "uuid", "title": "...", "category": "RELIGIOUS", ... }],
    "active": [{ "id": "uuid", "title": "...", "progress": 75, ... }],
    "completed": [{ "id": "uuid", "title": "...", "verifiedBy": "uuid", ... }]
  },
  "counts": { "queue": 6, "active": 3, "completed": 15 }
}
```

### 6.2 Create Duty

```
POST /api/v1/duties
```

**Auth:** HEAD_OF_HOUSE, ELDER

```json
{
  "title": "Quét dọn khuôn viên nhà thờ",
  "description": "Quét lá, lau bàn thờ, thay nước bình hoa",
  "category": "MAINTENANCE",
  "priority": "HIGH",
  "assignedTo": "uuid-member",
  "dueDate": "2026-03-15",
  "ritualEventId": null
}
```

### 6.3 Update Duty (Status Transition)

```
PATCH /api/v1/duties/:id
```

**Status Transition Rules:**
```
QUEUE → ACTIVE       (any assigned member or ELDER+)
ACTIVE → COMPLETED   (any assigned member or ELDER+)
COMPLETED → ACTIVE   (HEAD_OF_HOUSE only — reopen)
ACTIVE → QUEUE       (HEAD_OF_HOUSE, ELDER — revert)
COMPLETED → QUEUE    (HEAD_OF_HOUSE only — reopen)
```

**Drag-and-drop payload:**
```json
{
  "status": "ACTIVE",
  "sortOrder": 2
}
```

**Side Effects:**
- Creates duty_log entry for status change
- Updates member workload calculation
- Sends notification to assigned member

### 6.4 Verify Duty

```
POST /api/v1/duties/:id/verify
```

**Auth:** HEAD_OF_HOUSE only

Locks duty — no further status changes allowed.

### 6.5 Delete Duty

```
DELETE /api/v1/duties/:id
```

**Auth:** HEAD_OF_HOUSE only. Soft delete.

### 6.6 Duty Statistics

```
GET /api/v1/duties/stats
```

**Response:**
```json
{
  "totalActive": 24,
  "pendingReview": 8,
  "efficiencyRating": 92,
  "efficiencyTrend": 4,
  "assignedMemberCount": 12
}
```

### 6.7 Member Workload

```
GET /api/v1/members/workload
```

**Response:**
```json
{
  "data": [
    {
      "memberId": "uuid",
      "fullName": "Arthur Sterling",
      "avatarUrl": "https://...",
      "lineageName": "Third Lineage",
      "status": "AVAILABLE",
      "currentDutyTitle": null,
      "workloadIntensity": 15
    },
    {
      "memberId": "uuid",
      "fullName": "Eleanor Thorne",
      "avatarUrl": "https://...",
      "lineageName": "Second Lineage",
      "status": "ON_DUTY",
      "currentDutyTitle": "Archive Digitization",
      "workloadIntensity": 85
    }
  ]
}
```

---

## 7. Notifications API

### 7.1 List Notifications

```
GET /api/v1/notifications?unreadOnly=true&limit=20
```

### 7.2 Mark as Read

```
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all
```

### 7.3 WebSocket Channel

```
WS /api/v1/ws/notifications
```

Real-time events pushed to connected clients:
- `duty:assigned` — new duty assigned to you
- `duty:status_changed` — a duty you're watching changed status
- `ritual:reminder` — upcoming memorial day
- `member:added` — new member added to clan

---

## 8. Search API (Global)

```
GET /api/v1/search?q=nguyễn&type=members,sites,rituals
```

Cross-module search with type filtering. Returns top 10 results per type.

**Response:**
```json
{
  "members": [{ "id": "uuid", "fullName": "...", "type": "member" }],
  "sites": [{ "id": "uuid", "memberName": "...", "sectionPlot": "...", "type": "site" }],
  "rituals": [{ "id": "uuid", "title": "...", "dateSolar": "...", "type": "ritual" }]
}
```

---

## 9. Clan API

```
GET    /api/v1/clan              — Get current user's clan info
PATCH  /api/v1/clan              — Update clan (HEAD_OF_HOUSE)
GET    /api/v1/clan/stats        — Dashboard stats for homepage
```

**Clan Stats Response:**
```json
{
  "totalMembers": 128,
  "totalGenerations": 14,
  "livingMembers": 45,
  "deceasedMembers": 83,
  "totalSites": 25,
  "activeDuties": 24,
  "upcomingRituals": 3,
  "nextRitual": {
    "id": "uuid",
    "title": "Giỗ Cụ Nguyễn...",
    "dateSolar": "2026-03-08",
    "daysUntil": 8
  }
}
```

---

## 10. Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body/params |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Insufficient role permissions |
| 403 | `CROSS_CLAN_ACCESS` | Attempting to access another clan's data |
| 404 | `NOT_FOUND` | Entity not found or soft-deleted |
| 409 | `CONFLICT` | Duplicate (e.g., relationship already exists) |
| 422 | `BUSINESS_RULE_VIOLATION` | e.g., certify with incomplete duties |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "fullName is required",
    "details": {
      "field": "fullName",
      "rule": "required"
    }
  }
}
```

---

## 11. Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Read (GET) | 100 req | 1 min |
| Write (POST/PATCH) | 30 req | 1 min |
| Upload (media) | 10 req | 1 min |
| Search | 20 req | 1 min |
| Auth | 5 req | 1 min |
