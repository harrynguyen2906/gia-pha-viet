# PRD-02: Clan Management Transformation

## 1. Product Overview
Currently, the admin dashboard manages users on an individual basis. However, the core entity of the Gia Phả platform is the **Clan (Gia Tộc)**. The new requirement shifts the administrative focus from managing isolated users to managing entire Clans. Individual users will now be managed contextually within their respective Clans.

## 2. Objectives
- **Clan-Centric Management:** Transition the `/users` management feature to a `/clans` management feature.
- **Holistic Detail View:** Provide a comprehensive Clan Detail Page that aggregates subscription data, user roles, lineage statistics, and resource usage.
- **Hierarchical User Control:** Allow Super Admins to view and manage users belonging to a specific clan directly from the clan's context.

## 3. Scope & Features

### 3.1. Clan Management Dashboard (`/clans`)
- **Display Modes:** A data table or card grid view listing all registered Clans.
- **Key List Data:**
  - Clan Name
  - Registration Date
  - Current Subscription Plan & Status (Active/Expired)
  - Number of Registered Users
  - Number of Lineage Members (members in the family tree)
- **Search & Filter:** Search by clan name, filter by subscription status, or filter by creation date.

### 3.2. Clan Detail Page (`/clans/[id]`)
Deep dive into a specific Clan’s ecosystem, divided into functional tabs/sections:

#### A. Overview & Metrics
- **General Info:** Clan Name, original creator/owner, creation date.
- **Metrics:** Total lineage members, total generations, storage usage for media.

#### B. Subscription & Billing
- **Current Plan:** Display the active tier, limits, and billing cycle.
- **Status:** Active, Grace Period, Expired.
- **Renewals/Invoices:** History of subscription renewals.

#### C. User Access Management (Sub-users)
- **User List:** A table showing all user accounts associated with this `clanId`.
- **User Details:** Email, Display Name, Last Login.
- **Clan Roles:** Display the user's role within the clan (e.g., Clan Admin, Editor, Viewer).
- **Actions:** Admin ability to deactivate a specific user's access within the clan.

#### D. System/Audit Logs (Optional info)
- Recent administrative actions taken by users within this clan (e.g., adding members, upgrading subscriptions).

## 4. User Experience (UX) & Design
- **Theme:** Must strictly adhere to the established "Imperial Heritage" design system (dark royal red/gold tones, `surface-container-low`, `lacquer-plaque` styles).
- **Navigation:** Replace the existing "Users" navigation link in the admin sidebar with "Clan Management" (Quản Lý Gia Tộc).

## 5. Success Metrics
- Seamless traversal from the Clan list to detailed Clan insights.
- Accurate aggregation of user counts, lineage sizes, and subscription states for each Clan.
- Elimination of orphaned user management (every managed user is contextually tied to their Clan).