# IP-02: Clan Management Transformation

## 1. Technical Overview
This document outlines the technical implementation steps required to transform the Admin user management system from individual user management (`/users`) to Clan-centric management (`/clans`).

## 2. API Endpoints to Build

### 2.1. `GET /api/admin/clans`
- **Purpose:** Fetch a list of all clans for the main dashboard.
- **Payload/Response:**
  - `id`, `name`, `createdAt` directly from the `Clan` table.
  - Compute `userCount` by joining `users`.
  - Compute `memberCount` by joining `members`.
  - Attach the current `UserSubscription` status (the single active subscription tier) and expiration date.
- **Design Pattern:** Return simple JSON structured data.

### 2.2. `GET /api/admin/clans/[id]`
- **Purpose:** Fetch all detailed relational data for a specific Clan.
- **Data Layers:**
  - **Base Data:** `name`, `createdAt`, `updatedAt`.
  - **Lineage Stats:** Total `members`, number of `generations`, number of `grave_sites` or `duties` (metrics).
  - **Users Array:** All `User` records with `clanId`, including their `profile`, `role`, and `isActive` status.
  - **Subscriptions Array:** Detailed `UserSubscription` objects joined with `Tier` definitions (price, limits, status).

### 2.3. `PUT /api/admin/clans/[id]/users/[uuid]`
- **Purpose:** Allow Super Admins to manually toggle (`isActive`) specific users belonging to a clan.

## 3. UI Component Structure
The UI components will reside in `src/app/(admin)/clans/` and `src/components/clans/`.

### 3.1. Main Listing Page (`/clans/page.tsx` & `ClansDashboardClient.tsx`)
- Implement a data grid/table to iterate over `GET /api/admin/clans`.
- Apply "Imperial Heritage" CSS classes (`imperial-border`, `bg-surface-container-low`, `text-secondary`, `lacquer-gloss`).
- Include metrics badges (number of users, member count) on each row/card.
- Add an "Action" column to `View Details`.

### 3.2. Clan Detail Page (`/clans/[id]/page.tsx` & `ClanDetailClient.tsx`)
- **Header:** Clan Name (`Ngự Xưng Gia Tộc`) alongside a status badge (e.g., Active/Grace Period).
- **Metric Cards Layout:** Top row cards displaying lineage size, active users, storage.
- **Tab Layout (Optional but recommended):**
  1. **Subscription & Billing:** Displays the tier limits, active date, and expiration. Includes a button to force renewal/upgrade.
  2. **User Accounts (Ban Quản Trị Gia Tộc):** Replaces the old `/users` table. Lists users attached to this `clanId`. Shows `profile.displayName`, email, and role. Action buttons to disable user access.
  3. **Usage/Audit Logs:** Read-only list of recent actions.

## 4. Refactoring the Navigation
- Update the Next.js `layout.tsx` and sidebar navigation links:
  - Remove "User Management" (`/users`).
  - Add "Hệ Thống Gia Tộc" (`/clans`), using an iconic identifier like `Shield` or `Landmark`.

## 5. Security & Access
- All endpoints must verify the requestor has `role = SUPER_ADMIN`. Make sure to invoke `auth()` in `api/admin/clans/*` routes.
- Prevent modifying users across clan boundaries.

## 6. Execution Steps

### Phase 1: API Development
- [x] Create `GET /api/admin/clans` endpoint for fetching the clan list with aggregated metrics.
- [x] Create `GET /api/admin/clans/[id]` endpoint for detailed clan data (users, subscriptions, metrics).
- [x] Create `PUT /api/admin/clans/[id]/users/[uuid]` endpoint to toggle user access (`isActive`).

### Phase 2: UI - Clan Dashboard (List View)
- [x] Create `src/app/(admin)/clans/page.tsx`.
- [x] Implement `src/app/(admin)/clans/ClansDashboardClient.tsx` with data grid/table.
- [x] Apply Imperial Heritage styling and metrics badges.

### Phase 3: UI - Clan Detail View
- [x] Create `src/app/(admin)/clans/[id]/page.tsx`.
- [x] Implement `src/app/(admin)/clans/[id]/ClanDetailClient.tsx`.
- [x] Build tabs/sections for Overview Metrics, Subscription & Billing, User Access Management, and Audit Logs.

### Phase 4: Integration & Cleanup
- [x] Update admin sidebar navigation in `src/components/layout/AdminSidebar.tsx` (remove `/users`, add `/clans`).
- [x] Test navigation and data flow.
- [x] Remove deprecated `users` routing structure if fully replaced.