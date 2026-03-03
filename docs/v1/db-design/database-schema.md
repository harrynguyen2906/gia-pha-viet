# Heritage Cloud — Database Schema Design

> **Source of Truth** cho toàn bộ cấu trúc dữ liệu. Mọi PRD, API, và frontend PHẢI tham chiếu tên bảng, tên cột từ tài liệu này.

**Database Engine:** PostgreSQL 16+  
**ORM:** Prisma  
**Naming Convention:** snake_case cho bảng và cột, UPPER_CASE cho enum  
**ID Strategy:** UUID v7 (time-sorted) — `gen_random_uuid()`  
**Timestamps:** Tất cả bảng đều có `created_at`, `updated_at` (auto-managed)  
**Soft Delete:** Các entity chính sử dụng `deleted_at` (nullable timestamp)

---

## 1. Entity Relationship Diagram (ERD)

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   clans     │──1:N──│    members       │──1:N──│  member_media   │
└─────────────┘       └──────────────────┘       └─────────────────┘
                             │  │  │
                     ┌───────┘  │  └────────┐
                     │          │            │
                    1:N        M:N          1:1
                     │          │            │
              ┌──────┴───┐  ┌──┴──────┐  ┌──┴──────────┐
              │relationships│ │member  │  │ grave_sites │
              │(parent ↔   │ │_spouses│  └─────────────┘
              │ child)     │ │        │        │
              └────────────┘ └────────┘       1:N
                     │                         │
                     │                  ┌──────┴──────┐
                     │                  │ site_media   │
                     │                  └─────────────┘
                     │
        ┌────────────┴─────────────┐
        │                          │
       1:N                        1:N
        │                          │
┌───────┴────────┐   ┌────────────┴──────────┐
│ ritual_events  │   │    duties             │
│                │   │                       │
│   │            │   └───────────────────────┘
│  1:N           │              │
│   │            │             N:1
│ ┌─┴──────────┐ │              │
│ │ritual_     │ │   ┌──────────┴──────┐
│ │instructions│ │   │  duty_logs      │
│ └────────────┘ │   └─────────────────┘
│                │
│  1:N           │
│   │            │
│ ┌─┴──────────┐ │
│ │ritual_     │ │
│ │duties      │ │
│ └────────────┘ │
└────────────────┘

┌─────────────┐       ┌──────────────────┐
│   users     │──1:1──│  user_profiles   │
└─────────────┘       └──────────────────┘
       │
      1:N
       │
┌──────┴──────┐
│notifications│
└─────────────┘

┌─────────────────────┐
│  virtual_offerings  │ (member_id + offered_by user)
└─────────────────────┘

┌─────────────────────┐
│  audit_logs         │ (system-wide change tracking)
└─────────────────────┘
```

---

## 2. Enums

```sql
-- Giới tính
CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- Vai trò gia tộc (lineage role)
CREATE TYPE lineage_role AS ENUM (
  'HEAD_OF_HOUSE',   -- Trưởng tộc
  'ELDER',           -- Bậc trưởng
  'HEIR',            -- Con cháu (thế hệ kế tiếp)
  'YOUTH',           -- Thanh niên
  'MEMBER'           -- Thành viên thường
);

-- Vai trò hệ thống (auth role)
CREATE TYPE user_role AS ENUM (
  'ADMIN',           -- System admin (khác Head of House)
  'HEAD_OF_HOUSE',   -- Trưởng tộc — full quyền trong clan
  'ELDER',           -- Bậc trưởng — edit nhánh mình
  'MEMBER',          -- Thành viên — view + update duty của mình
  'GUEST'            -- Khách — view-only public data
);

-- Loại quan hệ
CREATE TYPE relationship_type AS ENUM (
  'BIOLOGICAL',      -- Con ruột
  'ADOPTED',         -- Con nuôi
  'STEP'             -- Con riêng
);

-- Tình trạng mộ phần
CREATE TYPE site_condition AS ENUM (
  'MAINTAINED',      -- Được chăm sóc tốt
  'NEEDS_VISIT',     -- Cần thăm viếng
  'WEATHERED',       -- Xuống cấp
  'RESTORATION'      -- Cần trùng tu
);

-- Loại địa điểm
CREATE TYPE site_type AS ENUM (
  'TEMPLE',          -- Chùa / Đền
  'CHURCH',          -- Nhà thờ
  'CEMETERY',        -- Nghĩa trang
  'PRIVATE',         -- Đất riêng gia đình
  'OTHER'
);

-- Danh mục nhiệm vụ
CREATE TYPE duty_category AS ENUM (
  'RELIGIOUS',       -- Lễ giỗ / tín ngưỡng
  'MAINTENANCE',     -- Bảo trì / chăm sóc
  'ARCHIVAL',        -- Lưu trữ / số hóa
  'SOCIAL'           -- Giao tế / lễ hội
);

-- Trạng thái nhiệm vụ (Kanban columns)
CREATE TYPE duty_status AS ENUM (
  'QUEUE',           -- Chờ thực hiện
  'ACTIVE',          -- Đang thực hiện
  'COMPLETED'        -- Hoàn thành
);

-- Độ ưu tiên
CREATE TYPE duty_priority AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

-- Nhóm được giao (cho ritual duties)
CREATE TYPE assigned_group AS ENUM (
  'ELDERS',
  'HEIRS',
  'YOUTH',
  'ALL'
);

-- Loại media
CREATE TYPE media_type AS ENUM (
  'AVATAR',          -- Ảnh đại diện
  'PHOTO',           -- Ảnh thường
  'PANORAMA',        -- Ảnh 360°
  'DOCUMENT',        -- Tài liệu scan
  'MODEL_3D'         -- Mô hình 3D (future)
);

-- Loại offering
CREATE TYPE offering_type AS ENUM (
  'INCENSE',         -- Thắp nhang
  'FLOWERS',         -- Dâng hoa
  'FOOD',            -- Cúng đồ ăn
  'PRAYER'           -- Cầu nguyện
);

-- Loại notification
CREATE TYPE notification_type AS ENUM (
  'RITUAL_REMINDER',     -- Nhắc giỗ sắp đến
  'DUTY_ASSIGNED',       -- Được giao nhiệm vụ
  'DUTY_DUE',            -- Nhiệm vụ sắp hết hạn
  'DUTY_COMPLETED',      -- Nhiệm vụ hoàn thành
  'MEMBER_ADDED',        -- Thành viên mới
  'SITE_REGISTERED',     -- Địa điểm mới
  'SYSTEM'               -- Thông báo hệ thống
);
```

---

## 3. Core Tables

### 3.1 `users` — Tài khoản đăng nhập

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),                -- null nếu dùng OAuth
  provider      VARCHAR(50),                 -- 'credentials', 'google', 'facebook'
  provider_id   VARCHAR(255),                -- OAuth provider user ID
  role          user_role NOT NULL DEFAULT 'GUEST',
  clan_id       UUID REFERENCES clans(id),   -- thuộc gia tộc nào
  member_id     UUID REFERENCES members(id), -- liên kết với thành viên gia tộc (nullable)
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clan ON users(clan_id);
```

### 3.2 `user_profiles` — Thông tin profile user

```sql
CREATE TABLE user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url   TEXT,
  phone        VARCHAR(20),
  locale       VARCHAR(10) DEFAULT 'vi',     -- 'vi', 'en'
  timezone     VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  settings     JSONB DEFAULT '{}',            -- user preferences
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3 `clans` — Dòng tộc / Gia tộc

```sql
CREATE TABLE clans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,       -- "Dòng họ Nguyễn Phúc"
  display_name  VARCHAR(200),                -- "House of Nguyen"
  motto         TEXT,                        -- Gia huấn / châm ngôn
  founding_year INTEGER,                     -- Năm khai tộc
  description   TEXT,
  banner_url    TEXT,                        -- Ảnh banner homepage
  is_public     BOOLEAN NOT NULL DEFAULT false,  -- Cho phép guest xem
  head_of_house_id UUID REFERENCES members(id),  -- Trưởng tộc hiện tại
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ                  -- Soft delete
);

CREATE INDEX idx_clans_name ON clans(name);
```

### 3.4 `members` — Thành viên gia tộc (Core Entity)

> **Đây là bảng trung tâm** — mọi module đều tham chiếu đến `members`.

```sql
CREATE TABLE members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id          UUID NOT NULL REFERENCES clans(id),
  
  -- Thông tin cá nhân
  full_name        VARCHAR(200) NOT NULL,
  gender           gender_type NOT NULL DEFAULT 'MALE',
  is_deceased      BOOLEAN NOT NULL DEFAULT false,
  
  -- Ngày tháng (Solar + Lunar)
  birth_date_solar DATE,
  birth_date_lunar VARCHAR(50),              -- "15 tháng Giêng năm Canh Tý"
  death_date_solar DATE,                     -- NULL nếu còn sống
  death_date_lunar VARCHAR(50),
  departure_rite   TEXT,                     -- Nghi thức tiễn biệt
  
  -- Profile
  avatar_url       TEXT,
  biography        TEXT,                     -- Tiểu sử
  
  -- Vị trí trong gia tộc
  generation       INTEGER NOT NULL DEFAULT 1,  -- Đời thứ mấy
  lineage_role     lineage_role DEFAULT 'MEMBER',
  branch_name      VARCHAR(100),             -- Tên nhánh (e.g., "Chi Trưởng")
  
  -- Metadata
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ               -- Soft delete
);

-- Performance indexes
CREATE INDEX idx_members_clan ON members(clan_id);
CREATE INDEX idx_members_clan_generation ON members(clan_id, generation);
CREATE INDEX idx_members_deceased ON members(clan_id, is_deceased);
CREATE INDEX idx_members_name ON members(clan_id, full_name);
CREATE INDEX idx_members_deleted ON members(deleted_at) WHERE deleted_at IS NULL;
```

### 3.5 `relationships` — Quan hệ cha/mẹ → con

```sql
CREATE TABLE relationships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id         UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  child_id          UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL DEFAULT 'BIOLOGICAL',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_parent_child UNIQUE (parent_id, child_id),
  CONSTRAINT no_self_relationship CHECK (parent_id != child_id)
);

CREATE INDEX idx_relationships_parent ON relationships(parent_id);
CREATE INDEX idx_relationships_child ON relationships(child_id);
```

### 3.6 `member_spouses` — Quan hệ vợ/chồng

```sql
CREATE TABLE member_spouses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_a_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_b_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  marriage_date DATE,
  divorce_date  DATE,                        -- NULL nếu chưa ly hôn
  is_current    BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_spouse_pair UNIQUE (member_a_id, member_b_id),
  CONSTRAINT no_self_marriage CHECK (member_a_id != member_b_id),
  CONSTRAINT ordered_pair CHECK (member_a_id < member_b_id)  -- Tránh duplicate đảo
);

CREATE INDEX idx_spouses_a ON member_spouses(member_a_id);
CREATE INDEX idx_spouses_b ON member_spouses(member_b_id);
```

### 3.7 `member_media` — Ảnh / Tài liệu thành viên

```sql
CREATE TABLE member_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  media_type  media_type NOT NULL,
  url         TEXT NOT NULL,                 -- S3/R2 URL
  thumbnail_url TEXT,                        -- Ảnh nhỏ (processed by Sharp)
  caption     VARCHAR(500),
  sort_order  INTEGER DEFAULT 0,
  file_size   INTEGER,                       -- bytes
  mime_type   VARCHAR(100),
  width       INTEGER,
  height      INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_media ON member_media(member_id, media_type);
```

---

## 4. Grave Site Tables

### 4.1 `grave_sites` — Địa điểm mộ phần

```sql
CREATE TABLE grave_sites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id),  -- Người đã mất
  clan_id       UUID NOT NULL REFERENCES clans(id),
  
  -- Vị trí
  section_plot  VARCHAR(200),                -- "Highland Sector C-14"
  latitude      DECIMAL(10, 8) NOT NULL,
  longitude     DECIMAL(11, 8) NOT NULL,
  
  -- Thông tin
  epitaph       TEXT,                        -- Câu đối / bia mộ
  condition     site_condition NOT NULL DEFAULT 'MAINTAINED',
  site_type     site_type NOT NULL DEFAULT 'CEMETERY',
  
  -- Metadata
  last_visited  DATE,
  registered_by UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- Spatial index cho tìm kiếm theo vị trí
CREATE INDEX idx_grave_sites_location ON grave_sites 
  USING GIST (point(longitude, latitude));
CREATE INDEX idx_grave_sites_clan ON grave_sites(clan_id);
CREATE INDEX idx_grave_sites_member ON grave_sites(member_id);
CREATE INDEX idx_grave_sites_condition ON grave_sites(clan_id, condition);
```

### 4.2 `site_media` — Ảnh / 360° / 3D của mộ phần

```sql
CREATE TABLE site_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES grave_sites(id) ON DELETE CASCADE,
  media_type  media_type NOT NULL,           -- PANORAMA, PHOTO, MODEL_3D
  url         TEXT NOT NULL,
  thumbnail_url TEXT,
  caption     VARCHAR(500),
  sort_order  INTEGER DEFAULT 0,
  file_size   INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_media ON site_media(site_id, media_type);
```

---

## 5. Ritual & Calendar Tables

### 5.1 `ritual_events` — Sự kiện cúng giỗ

```sql
CREATE TABLE ritual_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id         UUID NOT NULL REFERENCES clans(id),
  ancestor_id     UUID REFERENCES members(id),  -- Người được cúng (nullable cho lễ chung)
  
  -- Thông tin sự kiện
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  
  -- Ngày (Solar + Lunar)
  date_solar      DATE NOT NULL,
  date_lunar      VARCHAR(50),               -- "15 tháng 3 Âm lịch"
  
  -- Lặp lại hàng năm
  is_recurring    BOOLEAN NOT NULL DEFAULT true,
  lunar_recurrence VARCHAR(50),               -- "15 tháng 3" (dùng để tính năm mới)
  
  -- Trạng thái
  is_certified    BOOLEAN NOT NULL DEFAULT false,
  certified_by    UUID REFERENCES users(id),
  certified_at    TIMESTAMPTZ,
  
  -- Metadata
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_ritual_events_clan ON ritual_events(clan_id);
CREATE INDEX idx_ritual_events_date ON ritual_events(clan_id, date_solar);
CREATE INDEX idx_ritual_events_ancestor ON ritual_events(ancestor_id);
CREATE INDEX idx_ritual_events_upcoming ON ritual_events(clan_id, date_solar) 
  WHERE deleted_at IS NULL AND date_solar >= CURRENT_DATE;
```

### 5.2 `ritual_instructions` — Hướng dẫn nghi thức

```sql
CREATE TABLE ritual_instructions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_event_id UUID NOT NULL REFERENCES ritual_events(id) ON DELETE CASCADE,
  
  icon            VARCHAR(50) NOT NULL,        -- Material Icon name: 'potted_plant'
  title           VARCHAR(200) NOT NULL,       -- "Incense & Fire"
  description     TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ritual_instructions ON ritual_instructions(ritual_event_id, sort_order);
```

### 5.3 `ritual_duties` — Nhiệm vụ theo buổi cúng (checklist trong detail panel)

```sql
CREATE TABLE ritual_duties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_event_id UUID NOT NULL REFERENCES ritual_events(id) ON DELETE CASCADE,
  
  description     TEXT NOT NULL,
  assigned_group  assigned_group NOT NULL DEFAULT 'ALL',
  assigned_to     UUID REFERENCES members(id),  -- Giao cụ thể (optional)
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ritual_duties ON ritual_duties(ritual_event_id);
```

---

## 6. Duty Management Tables (Kanban)

### 6.1 `duties` — Nhiệm vụ gia tộc (Kanban Board)

```sql
CREATE TABLE duties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id         UUID NOT NULL REFERENCES clans(id),
  
  -- Nội dung
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  category        duty_category NOT NULL,
  
  -- Workflow
  status          duty_status NOT NULL DEFAULT 'QUEUE',
  priority        duty_priority NOT NULL DEFAULT 'MEDIUM',
  progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Giao việc
  assigned_to     UUID REFERENCES members(id),
  assigned_by     UUID REFERENCES users(id),
  
  -- Liên kết
  ritual_event_id UUID REFERENCES ritual_events(id),  -- Nếu duty gắn với buổi giỗ
  
  -- Thời hạn
  due_date        DATE,
  
  -- Xác nhận
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  
  -- Metadata
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_duties_clan ON duties(clan_id);
CREATE INDEX idx_duties_status ON duties(clan_id, status);
CREATE INDEX idx_duties_assigned ON duties(assigned_to);
CREATE INDEX idx_duties_ritual ON duties(ritual_event_id);
CREATE INDEX idx_duties_due ON duties(clan_id, due_date) 
  WHERE deleted_at IS NULL AND status != 'COMPLETED';
```

### 6.2 `duty_logs` — Lịch sử thay đổi nhiệm vụ

```sql
CREATE TABLE duty_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_id     UUID NOT NULL REFERENCES duties(id) ON DELETE CASCADE,
  
  action      VARCHAR(50) NOT NULL,          -- 'CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'VERIFIED'
  old_value   VARCHAR(100),                  -- Giá trị cũ
  new_value   VARCHAR(100),                  -- Giá trị mới
  performed_by UUID REFERENCES users(id),
  
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_duty_logs ON duty_logs(duty_id, created_at DESC);
```

---

## 7. Engagement Tables

### 7.1 `virtual_offerings` — Lễ vật ảo (thắp nhang, dâng hoa)

```sql
CREATE TABLE virtual_offerings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id),  -- Người được dâng lễ
  offered_by  UUID NOT NULL REFERENCES users(id),     -- Người dâng
  
  offering_type offering_type NOT NULL,
  message       TEXT,                          -- Lời cầu nguyện (optional)
  
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_offerings_member ON virtual_offerings(member_id);
CREATE INDEX idx_offerings_user ON virtual_offerings(offered_by);
CREATE INDEX idx_offerings_month ON virtual_offerings(member_id, created_at);
```

### 7.2 `notifications` — Thông báo

```sql
CREATE TABLE notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type             notification_type NOT NULL,
  title            VARCHAR(300) NOT NULL,
  body             TEXT,
  
  -- Link đến entity liên quan
  reference_type   VARCHAR(50),               -- 'ritual_event', 'duty', 'member', 'site'
  reference_id     UUID,
  
  is_read          BOOLEAN NOT NULL DEFAULT false,
  read_at          TIMESTAMPTZ,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

---

## 8. System Tables

### 8.1 `audit_logs` — Nhật ký thay đổi hệ thống

```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  clan_id       UUID REFERENCES clans(id),
  
  action        VARCHAR(50) NOT NULL,          -- 'CREATE', 'UPDATE', 'DELETE'
  entity_type   VARCHAR(50) NOT NULL,          -- 'member', 'ritual_event', 'duty', etc.
  entity_id     UUID NOT NULL,
  
  old_data      JSONB,                         -- Snapshot trước khi thay đổi
  new_data      JSONB,                         -- Snapshot sau khi thay đổi
  ip_address    INET,
  user_agent    TEXT,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partition by month for performance
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_clan ON audit_logs(clan_id, created_at DESC);
```

---

## 9. Views (Materialized / Regular)

### 9.1 `v_member_tree` — View đầy đủ cho hiển thị gia phả

```sql
CREATE VIEW v_member_tree AS
SELECT
  m.id,
  m.clan_id,
  m.full_name,
  m.gender,
  m.is_deceased,
  m.birth_date_solar,
  m.death_date_solar,
  m.avatar_url,
  m.generation,
  m.lineage_role,
  m.branch_name,
  -- Parents
  array_agg(DISTINCT r_parent.parent_id) FILTER (WHERE r_parent.parent_id IS NOT NULL) AS parent_ids,
  -- Children
  array_agg(DISTINCT r_child.child_id) FILTER (WHERE r_child.child_id IS NOT NULL) AS child_ids,
  -- Spouses
  array_agg(DISTINCT CASE
    WHEN ms.member_a_id = m.id THEN ms.member_b_id
    ELSE ms.member_a_id
  END) FILTER (WHERE ms.id IS NOT NULL) AS spouse_ids,
  -- Grave site
  gs.id AS grave_site_id,
  -- Active duties count
  (SELECT count(*) FROM duties d WHERE d.assigned_to = m.id AND d.status != 'COMPLETED' AND d.deleted_at IS NULL) AS active_duty_count
FROM members m
LEFT JOIN relationships r_parent ON r_parent.child_id = m.id
LEFT JOIN relationships r_child ON r_child.parent_id = m.id
LEFT JOIN member_spouses ms ON ms.member_a_id = m.id OR ms.member_b_id = m.id
LEFT JOIN grave_sites gs ON gs.member_id = m.id AND gs.deleted_at IS NULL
WHERE m.deleted_at IS NULL
GROUP BY m.id, gs.id;
```

### 9.2 `v_member_workload` — View cho bảng workload (PRD-05)

```sql
CREATE VIEW v_member_workload AS
SELECT
  m.id AS member_id,
  m.full_name,
  m.avatar_url,
  m.branch_name AS lineage_name,
  m.clan_id,
  CASE
    WHEN count(d.id) FILTER (WHERE d.status = 'ACTIVE') > 0 THEN 'ON_DUTY'
    WHEN count(d.id) FILTER (WHERE d.status != 'COMPLETED') > 3 THEN 'OVERLOADED'
    ELSE 'AVAILABLE'
  END AS workload_status,
  -- Current active duty
  (SELECT d2.title FROM duties d2 WHERE d2.assigned_to = m.id AND d2.status = 'ACTIVE' AND d2.deleted_at IS NULL ORDER BY d2.updated_at DESC LIMIT 1) AS current_duty_title,
  -- Workload intensity (0-100)
  LEAST(100, count(d.id) FILTER (WHERE d.status != 'COMPLETED' AND d.deleted_at IS NULL) * 20) AS workload_intensity
FROM members m
LEFT JOIN duties d ON d.assigned_to = m.id AND d.deleted_at IS NULL
WHERE m.deleted_at IS NULL AND m.is_deceased = false
GROUP BY m.id;
```

### 9.3 `v_duty_stats` — Statistics cho Kanban dashboard (PRD-05)

```sql
CREATE VIEW v_duty_stats AS
SELECT
  clan_id,
  count(*) FILTER (WHERE status != 'COMPLETED' AND deleted_at IS NULL) AS total_active,
  count(*) FILTER (WHERE status = 'QUEUE' AND due_date <= CURRENT_DATE + INTERVAL '7 days' AND deleted_at IS NULL) AS pending_review,
  -- Efficiency = completed on-time / total completed (last 90 days)
  CASE
    WHEN count(*) FILTER (WHERE status = 'COMPLETED' AND created_at > now() - INTERVAL '90 days') > 0
    THEN round(
      100.0 * count(*) FILTER (WHERE status = 'COMPLETED' AND (due_date IS NULL OR verified_at <= due_date + INTERVAL '1 day') AND created_at > now() - INTERVAL '90 days')
      / count(*) FILTER (WHERE status = 'COMPLETED' AND created_at > now() - INTERVAL '90 days')
    )
    ELSE 0
  END AS efficiency_rating,
  count(DISTINCT assigned_to) FILTER (WHERE status != 'COMPLETED' AND deleted_at IS NULL) AS assigned_members
FROM duties
GROUP BY clan_id;
```

---

## 10. Prisma Schema

> File tương ứng: `prisma/schema.prisma`  
> Datasource URL được cấu hình trong `prisma.config.ts` (không phải trong schema).
> - Runtime (`pg.Pool`): `DATABASE_URL` (PgBouncer pooler, port 6543)
> - Migrations only: `DIRECT_URL` (session mode, port 5432)

```prisma
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  // url is injected via prisma.config.ts — not set here
}

// ──────────────── Enums ────────────────

enum GenderType {
  MALE
  FEMALE
  OTHER
}

enum LineageRole {
  HEAD_OF_HOUSE
  ELDER
  HEIR
  YOUTH
  MEMBER
}

enum UserRole {
  ADMIN
  HEAD_OF_HOUSE
  ELDER
  MEMBER
  GUEST
}

enum RelationshipType {
  BIOLOGICAL
  ADOPTED
  STEP
}

enum SiteCondition {
  MAINTAINED
  NEEDS_VISIT
  WEATHERED
  RESTORATION
}

enum SiteType {
  TEMPLE
  CHURCH
  CEMETERY
  PRIVATE
  OTHER
}

enum DutyCategory {
  RELIGIOUS
  MAINTENANCE
  ARCHIVAL
  SOCIAL
}

enum DutyStatus {
  QUEUE
  ACTIVE
  COMPLETED
}

enum DutyPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum AssignedGroup {
  ELDERS
  HEIRS
  YOUTH
  ALL
}

enum MediaType {
  AVATAR
  PHOTO
  PANORAMA
  DOCUMENT
  MODEL_3D
}

enum OfferingType {
  INCENSE
  FLOWERS
  FOOD
  PRAYER
}

enum NotificationType {
  RITUAL_REMINDER
  DUTY_ASSIGNED
  DUTY_DUE
  DUTY_COMPLETED
  MEMBER_ADDED
  SITE_REGISTERED
  SYSTEM
}

// ──────────────── Models ────────────────

model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String    @unique @db.VarChar(255)
  passwordHash String?   @map("password_hash") @db.VarChar(255)
  provider     String?   @db.VarChar(50)
  providerId   String?   @map("provider_id") @db.VarChar(255)
  role         UserRole  @default(GUEST)
  clanId       String?   @map("clan_id") @db.Uuid
  memberId     String?   @map("member_id") @db.Uuid
  isActive     Boolean   @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at") @db.Timestamptz()
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz()

  clan          Clan?         @relation(fields: [clanId], references: [id])
  member        Member?       @relation(fields: [memberId], references: [id])
  profile       UserProfile?
  notifications Notification[]

  @@index([email])
  @@index([clanId])
  @@map("users")
}

model UserProfile {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @unique @map("user_id") @db.Uuid
  displayName String   @map("display_name") @db.VarChar(100)
  avatarUrl   String?  @map("avatar_url")
  phone       String?  @db.VarChar(20)
  locale      String   @default("vi") @db.VarChar(10)
  timezone    String   @default("Asia/Ho_Chi_Minh") @db.VarChar(50)
  settings    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model Clan {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String    @db.VarChar(200)
  displayName   String?   @map("display_name") @db.VarChar(200)
  motto         String?
  foundingYear  Int?      @map("founding_year")
  description   String?
  bannerUrl     String?   @map("banner_url")
  isPublic      Boolean   @default(false) @map("is_public")
  headOfHouseId String?   @map("head_of_house_id") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz()

  headOfHouse  Member?       @relation("ClanHead", fields: [headOfHouseId], references: [id])
  members      Member[]
  users        User[]
  ritualEvents RitualEvent[]
  duties       Duty[]
  graveSites   GraveSite[]

  @@index([name])
  @@map("clans")
}

model Member {
  id             String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clanId         String      @map("clan_id") @db.Uuid
  fullName       String      @map("full_name") @db.VarChar(200)
  gender         GenderType  @default(MALE)
  isDeceased     Boolean     @default(false) @map("is_deceased")
  birthDateSolar DateTime?   @map("birth_date_solar") @db.Date
  birthDateLunar String?     @map("birth_date_lunar") @db.VarChar(50)
  deathDateSolar DateTime?   @map("death_date_solar") @db.Date
  deathDateLunar String?     @map("death_date_lunar") @db.VarChar(50)
  departureRite  String?     @map("departure_rite")
  avatarUrl      String?     @map("avatar_url")
  biography      String?
  generation     Int         @default(1)
  lineageRole    LineageRole @default(MEMBER) @map("lineage_role")
  branchName     String?     @map("branch_name") @db.VarChar(100)
  createdBy      String?     @map("created_by") @db.Uuid
  createdAt      DateTime    @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt      DateTime    @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt      DateTime?   @map("deleted_at") @db.Timestamptz()

  clan             Clan               @relation(fields: [clanId], references: [id])
  clanAsHead       Clan[]             @relation("ClanHead")
  parentRelations  Relationship[]     @relation("ChildRelation")
  childRelations   Relationship[]     @relation("ParentRelation")
  spousesA         MemberSpouse[]     @relation("SpouseA")
  spousesB         MemberSpouse[]     @relation("SpouseB")
  media            MemberMedia[]
  graveSite        GraveSite?
  assignedDuties   Duty[]             @relation("DutyAssignee")
  ritualDuties     RitualDuty[]
  ritualEvents     RitualEvent[]
  offerings        VirtualOffering[]
  users            User[]

  @@index([clanId])
  @@index([clanId, generation])
  @@index([clanId, isDeceased])
  @@index([clanId, fullName])
  @@map("members")
}

model Relationship {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  parentId         String           @map("parent_id") @db.Uuid
  childId          String           @map("child_id") @db.Uuid
  relationshipType RelationshipType @default(BIOLOGICAL) @map("relationship_type")
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz()

  parent Member @relation("ParentRelation", fields: [parentId], references: [id], onDelete: Cascade)
  child  Member @relation("ChildRelation", fields: [childId], references: [id], onDelete: Cascade)

  @@unique([parentId, childId])
  @@index([parentId])
  @@index([childId])
  @@map("relationships")
}

model MemberSpouse {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  memberAId    String    @map("member_a_id") @db.Uuid
  memberBId    String    @map("member_b_id") @db.Uuid
  marriageDate DateTime? @map("marriage_date") @db.Date
  divorceDate  DateTime? @map("divorce_date") @db.Date
  isCurrent    Boolean   @default(true) @map("is_current")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  memberA Member @relation("SpouseA", fields: [memberAId], references: [id], onDelete: Cascade)
  memberB Member @relation("SpouseB", fields: [memberBId], references: [id], onDelete: Cascade)

  @@unique([memberAId, memberBId])
  @@index([memberAId])
  @@index([memberBId])
  @@map("member_spouses")
}

model MemberMedia {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  memberId     String    @map("member_id") @db.Uuid
  mediaType    MediaType @map("media_type")
  url          String
  thumbnailUrl String?   @map("thumbnail_url")
  caption      String?   @db.VarChar(500)
  sortOrder    Int       @default(0) @map("sort_order")
  fileSize     Int?      @map("file_size")
  mimeType     String?   @map("mime_type") @db.VarChar(100)
  width        Int?
  height       Int?
  uploadedBy   String?   @map("uploaded_by") @db.Uuid
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  member Member @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@index([memberId, mediaType])
  @@map("member_media")
}

model GraveSite {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  memberId     String        @unique @map("member_id") @db.Uuid
  clanId       String        @map("clan_id") @db.Uuid
  sectionPlot  String?       @map("section_plot") @db.VarChar(200)
  latitude     Decimal       @db.Decimal(10, 8)
  longitude    Decimal       @db.Decimal(11, 8)
  epitaph      String?
  condition    SiteCondition @default(MAINTAINED)
  siteType     SiteType      @default(CEMETERY) @map("site_type")
  lastVisited  DateTime?     @map("last_visited") @db.Date
  registeredBy String?       @map("registered_by") @db.Uuid
  createdAt    DateTime      @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime      @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt    DateTime?     @map("deleted_at") @db.Timestamptz()

  member Member      @relation(fields: [memberId], references: [id])
  clan   Clan        @relation(fields: [clanId], references: [id])
  media  SiteMedia[]

  @@index([clanId])
  @@index([memberId])
  @@index([clanId, condition])
  @@map("grave_sites")
}

model SiteMedia {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  siteId       String    @map("site_id") @db.Uuid
  mediaType    MediaType @map("media_type")
  url          String
  thumbnailUrl String?   @map("thumbnail_url")
  caption      String?   @db.VarChar(500)
  sortOrder    Int       @default(0) @map("sort_order")
  fileSize     Int?      @map("file_size")
  uploadedBy   String?   @map("uploaded_by") @db.Uuid
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  site GraveSite @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId, mediaType])
  @@map("site_media")
}

model RitualEvent {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clanId          String    @map("clan_id") @db.Uuid
  ancestorId      String?   @map("ancestor_id") @db.Uuid
  title           String    @db.VarChar(300)
  description     String?
  dateSolar       DateTime  @map("date_solar") @db.Date
  dateLunar       String?   @map("date_lunar") @db.VarChar(50)
  isRecurring     Boolean   @default(true) @map("is_recurring")
  lunarRecurrence String?   @map("lunar_recurrence") @db.VarChar(50)
  isCertified     Boolean   @default(false) @map("is_certified")
  certifiedBy     String?   @map("certified_by") @db.Uuid
  certifiedAt     DateTime? @map("certified_at") @db.Timestamptz()
  createdBy       String?   @map("created_by") @db.Uuid
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt       DateTime? @map("deleted_at") @db.Timestamptz()

  clan         Clan                 @relation(fields: [clanId], references: [id])
  ancestor     Member?              @relation(fields: [ancestorId], references: [id])
  instructions RitualInstruction[]
  ritualDuties RitualDuty[]
  duties       Duty[]

  @@index([clanId])
  @@index([clanId, dateSolar])
  @@index([ancestorId])
  @@map("ritual_events")
}

model RitualInstruction {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ritualEventId String   @map("ritual_event_id") @db.Uuid
  icon          String   @db.VarChar(50)
  title         String   @db.VarChar(200)
  description   String
  sortOrder     Int      @default(0) @map("sort_order")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  ritualEvent RitualEvent @relation(fields: [ritualEventId], references: [id], onDelete: Cascade)

  @@index([ritualEventId, sortOrder])
  @@map("ritual_instructions")
}

model RitualDuty {
  id            String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ritualEventId String        @map("ritual_event_id") @db.Uuid
  description   String
  assignedGroup AssignedGroup @default(ALL) @map("assigned_group")
  assignedTo    String?       @map("assigned_to") @db.Uuid
  isCompleted   Boolean       @default(false) @map("is_completed")
  completedAt   DateTime?     @map("completed_at") @db.Timestamptz()
  sortOrder     Int           @default(0) @map("sort_order")
  createdAt     DateTime      @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime      @updatedAt @map("updated_at") @db.Timestamptz()

  ritualEvent RitualEvent @relation(fields: [ritualEventId], references: [id], onDelete: Cascade)
  assignee    Member?     @relation(fields: [assignedTo], references: [id])

  @@index([ritualEventId])
  @@map("ritual_duties")
}

model Duty {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clanId        String       @map("clan_id") @db.Uuid
  title         String       @db.VarChar(300)
  description   String?
  category      DutyCategory
  status        DutyStatus   @default(QUEUE)
  priority      DutyPriority @default(MEDIUM)
  progress      Int          @default(0)
  assignedTo    String?      @map("assigned_to") @db.Uuid
  assignedBy    String?      @map("assigned_by") @db.Uuid
  ritualEventId String?      @map("ritual_event_id") @db.Uuid
  dueDate       DateTime?    @map("due_date") @db.Date
  verifiedBy    String?      @map("verified_by") @db.Uuid
  verifiedAt    DateTime?    @map("verified_at") @db.Timestamptz()
  createdBy     String?      @map("created_by") @db.Uuid
  createdAt     DateTime     @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime     @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt     DateTime?    @map("deleted_at") @db.Timestamptz()

  clan        Clan         @relation(fields: [clanId], references: [id])
  assignee    Member?      @relation("DutyAssignee", fields: [assignedTo], references: [id])
  ritualEvent RitualEvent? @relation(fields: [ritualEventId], references: [id])
  logs        DutyLog[]

  @@index([clanId])
  @@index([clanId, status])
  @@index([assignedTo])
  @@index([ritualEventId])
  @@map("duties")
}

model DutyLog {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  dutyId      String   @map("duty_id") @db.Uuid
  action      String   @db.VarChar(50)
  oldValue    String?  @map("old_value") @db.VarChar(100)
  newValue    String?  @map("new_value") @db.VarChar(100)
  performedBy String?  @map("performed_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()

  duty Duty @relation(fields: [dutyId], references: [id], onDelete: Cascade)

  @@index([dutyId, createdAt(sort: Desc)])
  @@map("duty_logs")
}

model VirtualOffering {
  id           String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  memberId     String       @map("member_id") @db.Uuid
  offeredBy    String       @map("offered_by") @db.Uuid
  offeringType OfferingType @map("offering_type")
  message      String?
  createdAt    DateTime     @default(now()) @map("created_at") @db.Timestamptz()

  member Member @relation(fields: [memberId], references: [id])

  @@index([memberId])
  @@index([offeredBy])
  @@map("virtual_offerings")
}

model Notification {
  id            String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String           @map("user_id") @db.Uuid
  type          NotificationType
  title         String           @db.VarChar(300)
  body          String?
  referenceType String?          @map("reference_type") @db.VarChar(50)
  referenceId   String?          @map("reference_id") @db.Uuid
  isRead        Boolean          @default(false) @map("is_read")
  readAt        DateTime?        @map("read_at") @db.Timestamptz()
  createdAt     DateTime         @default(now()) @map("created_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt(sort: Desc)])
  @@map("notifications")
}

model AuditLog {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  clanId     String?  @map("clan_id") @db.Uuid
  action     String   @db.VarChar(50)
  entityType String   @map("entity_type") @db.VarChar(50)
  entityId   String   @map("entity_id") @db.Uuid
  oldData    Json?    @map("old_data")
  newData    Json?    @map("new_data")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz()

  @@index([entityType, entityId])
  @@index([userId, createdAt(sort: Desc)])
  @@index([clanId, createdAt(sort: Desc)])
  @@map("audit_logs")
}
```

---

## 11. Seed Data Strategy

### Development Seed
Tạo dữ liệu mẫu cho 1 gia tộc "Dòng họ Nguyễn Phúc" với:
- 1 clan + 1 Head of House user
- 20–30 members across 5 generations (mix living/deceased)
- 10 relationships (parent→child)
- 5 spouse pairs
- 5 grave sites with panorama URLs
- 3 ritual events with instructions + duties
- 10 duties across all Kanban columns
- Sample member media (avatars + gallery photos)

### Production Seed
- 1 default "admin" user
- System notification templates
- Default ritual instruction templates (incense, food, prayer)

---

## 12. Migration Notes

### Index Strategy
- **Composite indexes** trên (clan_id, ...) cho mọi query scoped theo gia tộc
- **Partial indexes** (WHERE deleted_at IS NULL) cho soft-deleted tables
- **GiST spatial index** trên grave_sites cho tìm kiếm theo khoảng cách
- **B-tree DESC** trên created_at cho phân trang timeline

### Data Integrity Rules
1. `members.death_date_solar` chỉ NOT NULL khi `is_deceased = true`
2. `member_spouses` dùng CHECK `member_a_id < member_b_id` để tránh duplicate pair
3. `relationships` có CHECK `parent_id != child_id` để tránh self-reference
4. `duties.progress` phải trong khoảng 0–100
5. Soft delete: query mặc định phải thêm `WHERE deleted_at IS NULL`
