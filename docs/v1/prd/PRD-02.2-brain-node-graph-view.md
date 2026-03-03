# PRD-02.2: Brain Node Graph View — Obsidian-Style Neural Network Visualization

> **Phiên bản:** 1.0  
> **Ngày tạo:** 2026-03-01  
> **Tham chiếu:** [PRD-02 — Lineage Visualization (MVP)](PRD-02-lineage-visualization.md) | [PRD-02.1 — Lineage Tree Enhancement](PRD-02.1-lineage-tree-enhancement-v1.1.md) | [PRD-00 — Global Design System](PRD-00-global-design-system.md)  
> **IP Reference:** [IP-02.2 — Brain Node Graph Implementation](../implementation/IP-02.2-brain-node-graph-view.md)  
> **Mức ưu tiên:** P1 — Major Feature Enhancement  
> **Module:** Lineage Visualization → Brain Node View

---

## 1. Bối Cảnh & Mục Tiêu

### 1.1 Bối Cảnh

Bản MVP hiện tại (PRD-02) đã định nghĩa hai chế độ xem: **Neural Root Network** (force-directed graph) và **Traditional Lineage Flow** (hierarchical tree). Tuy nhiên, view Neural Root chưa được triển khai. Phiên bản v1.1 (PRD-02.1) tập trung nâng cấp Traditional Tree.

**PRD-02.2** này tập trung vào việc xây dựng trải nghiệm **Brain Node Graph View** — một giao diện trực quan lấy cảm hứng từ **Obsidian Graph View**, nơi mỗi thành viên gia phả được thể hiện dưới dạng **node hình tròn kết nối bằng các đường liên kết** (edges), tạo thành một mạng lưới tri thức gia tộc sống động.

### 1.2 Cảm Hứng Thiết Kế

Lấy cảm hứng trực tiếp từ **Obsidian Graph View**:

- **Nodes lớn nhỏ khác nhau** — node quan trọng (nhiều kết nối) sẽ lớn hơn
- **Mạng lưới đường nối dày đặc** — biểu thị mối quan hệ gia đình phức tạp
- **Màu sắc phân loại** — node được tô màu theo vai trò, thế hệ, hoặc trạng thái
- **Nền tối** — canvas dark-mode cho cảm giác premium, dễ nhìn
- **Zoom/Pan mượt** — khám phá mạng lưới gia tộc lớn một cách tự nhiên
- **Lực hút/đẩy vật lý** — nodes tự động sắp xếp theo bố cục force-directed

### 1.3 Mục Tiêu v2.2

| #   | Mục tiêu                                                                                     | Loại               |
| --- | -------------------------------------------------------------------------------------------- | ------------------ |
| 1   | **Brain Node Canvas** — Force-directed graph view với nodes ket nối dạng mạng lưới thần kinh | Core Feature       |
| 2   | **Node Detail Inspector** — Panel bên phải hiển thị thông tin chi tiết khi click node        | Core Feature       |
| 3   | **Mini-Map Navigator** — Bản đồ thu nhỏ hiển thị vị trí viewport hiện tại trên toàn bộ graph | Core Feature       |
| 4   | **Proportional Node Sizing** — Node lớn hơn khi có nhiều kết nối (connections)               | Visual Enhancement |
| 5   | **Color-Coded Categories** — Phân loại node bằng màu sắc theo thế hệ/vai trò                 | Visual Enhancement |
| 6   | **Smooth Physics Simulation** — Lực hấp dẫn/đẩy tự nhiên, warmup, cooldown                   | Performance        |

---

## 2. Đối Tượng Sử Dụng

| Vai trò                    | Tương tác cho phép                                                           |
| -------------------------- | ---------------------------------------------------------------------------- |
| Trưởng tộc (HEAD_OF_HOUSE) | Xem graph, click node xem chi tiết, zoom/pan, thêm thành viên mới, chỉnh sửa |
| Biên tập viên (ELDER)      | Xem graph, click node xem chi tiết, zoom/pan, thêm thành viên mới            |
| Thành viên (MEMBER)        | Xem graph, click node xem chi tiết, zoom/pan                                 |
| Khách (GUEST)              | Xem graph, click node xem chi tiết (read-only), zoom/pan                     |

---

## 3. Yêu Cầu Tính Năng Chi Tiết

### 3.1 Brain Node Canvas — Force-Directed Graph (Core)

#### 3.1.1 Canvas & Layout

- **Full-width dark canvas** chiếm toàn bộ vùng giữa (flex-1) giữa sidebar trái và inspector phải
- **Nền:** `#230f0f` (bg-dark) với subtle radial gradient ra rìa tối hơn
- **Force-directed layout** sử dụng D3-force hoặc `react-force-graph-2d` (Canvas/WebGL):
  - `forceLink()` — lực liên kết giữa parent↔child, spouse↔spouse
  - `forceManyBody()` — lực đẩy giữa tất cả nodes (charge: -150 đến -400, điều chỉnh theo mật độ)
  - `forceCenter()` — lực hướng tâm giữ graph ở giữa viewport
  - `forceCollide()` — ngăn nodes chồng lên nhau (radius dựa trên node size + padding)
  - `forceX()` / `forceY()` — optional, nhẹ nhàng kéo nodes về trung tâm
- **Warmup ticks:** 100 (pre-compute layout trước khi hiển thị)
- **Cooldown:** Simulation dừng sau khi đạt trạng thái ổn định (alpha < 0.001)

#### 3.1.2 Node Rendering

Mỗi node là một **hình tròn** (circle) đại diện cho một thành viên gia phả:

**Kích thước node (proportional sizing):**

| Loại                     | Base Radius | Tính toán                            | Mô tả                             |
| ------------------------ | ----------- | ------------------------------------ | --------------------------------- |
| Root/Patriarch (Thủy tổ) | 28px        | Cố định lớn nhất                     | Node thủy tổ — luôn lớn nhất      |
| Hub node (nhiều kết nối) | 16–24px     | `baseRadius + connectionCount × 1.5` | Node có nhiều con/cháu sẽ lớn hơn |
| Standard node            | 12px        | Mặc định                             | Node thông thường                 |
| Leaf node (cuối nhánh)   | 8px         | Fixed small                          | Node cuối cùng, không có con      |

**Màu sắc node (color-coded categories):**

| Category                | Fill Color             | Border Color | Mô tả                         |
| ----------------------- | ---------------------- | ------------ | ----------------------------- |
| HEAD_OF_HOUSE           | `#e74c3c` (đỏ)         | `#c0392b`    | Trưởng tộc                    |
| ELDER                   | `#f39c12` (cam)        | `#d68910`    | Cao niên                      |
| HEIR                    | `#2ecc71` (xanh lá)    | `#27ae60`    | Người thừa kế                 |
| MEMBER (Living, Male)   | `#3498db` (xanh dương) | `#2980b9`    | Thành viên nam, đang sống     |
| MEMBER (Living, Female) | `#9b59b6` (tím)        | `#8e44ad`    | Thành viên nữ, đang sống      |
| MEMBER (Deceased)       | `#95a5a6` (xám)        | `#7f8c8d`    | Thành viên đã mất — grayscale |
| Highlighted/Selected    | `#e5c17c` (gold)       | `#c5a059`    | Node đang được chọn           |

**Label hiển thị:**

- Tên ngắn (first name hoặc common name) hiện bên dưới node
- Font: Noto Sans, 10px, `rgba(244,235,208,0.8)` (parchment nhạt)
- Labels chỉ hiện khi zoom ≥ 0.5 (ẩn ở zoom nhỏ để giảm clutter)
- Node đang hover: label bold, opacity 1.0, font 12px

#### 3.1.3 Edge/Link Rendering

Đường nối giữa các nodes:

| Loại quan hệ                | Style          | Màu                                     | Độ dày     |
| --------------------------- | -------------- | --------------------------------------- | ---------- |
| Parent → Child              | Line thẳng     | `rgba(197,160,89,0.25)` (gold rất nhạt) | 1px        |
| Spouse ↔ Spouse             | Line nét đứt   | `rgba(138,0,0,0.3)` (crimson nhạt)      | 1px dashed |
| Selected node's connections | Line highlight | `rgba(229,193,124,0.6)` (gold sáng hơn) | 2px        |

**Hành vi:**

- Khi hover/click node → tất cả edges kết nối với node đó sáng lên (highlight)
- Edges của nodes không liên quan mờ đi (opacity 0.1)
- Particle effect (optional): nhỏ dots di chuyển dọc edge khi hover, tạo cảm giác "dòng chảy huyết thống"

#### 3.1.4 Interaction — Zoom, Pan, Click

| Action                     | Hành vi                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| **Scroll wheel**           | Zoom in/out (min: 0.1, max: 5.0)                                   |
| **Pinch gesture** (mobile) | Zoom in/out                                                        |
| **Click + drag canvas**    | Pan viewport                                                       |
| **Click node**             | Select node → Inspector panel hiển thị chi tiết → edges highlight  |
| **Double-click node**      | Zoom-to-fit node đó ở trung tâm                                    |
| **Hover node**             | Enlarge node 1.2x, show full name label, highlight connected edges |
| **Drag node**              | Reposition node (pin node tại vị trí mới, không bị force kéo lại)  |
| **Right-click node**       | Context menu: "View Profile", "Add Child", "Edit" (nếu có quyền)   |
| **Click canvas (trống)**   | Deselect node → Inspector panel đóng                               |

#### 3.1.5 Canvas Controls (Floating Buttons)

Góc dưới-trái viewport:

- **Zoom In** (+) — `btn-lacquer` nhỏ
- **Zoom Out** (-) — `btn-lacquer` nhỏ
- **Fit All** — zoom-to-fit toàn bộ graph vào viewport
- **Re-center** — reset zoom về 1.0 và center graph
- **Toggle Labels** — bật/tắt tên hiển thị

---

### 3.2 Node Detail Inspector Panel (Right Side)

Khi user click một node trên graph, panel bên **phải** (slide-in) hiển thị thông tin chi tiết:

#### 3.2.1 Layout

- Width: `384px` trên desktop, full-width bottom sheet trên mobile
- Slide-in animation: `translateX(100%) → translateX(0)` trong 300ms
- Nền: `#1a0808` (lacquer-dark) với border-left `1px solid rgba(197,160,89,0.2)`
- Scrollable nếu nội dung dài

#### 3.2.2 Nội dung Inspector

**Header:**

```
┌──────────────────────────────────────┐
│  [×]                     Close btn   │
│                                      │
│         ┌──────────┐                 │
│         │  Avatar   │                │
│         │  (96px)   │                │
│         └──────────┘                 │
│                                      │
│    Nguyễn Văn An                     │
│    Đời thứ 5 · HEAD_OF_HOUSE        │
│    1950 — Present                    │
│                                      │
│  ─────────────────────────           │
│                                      │
│  📋 Thông Tin Cá Nhân               │
│    Giới tính: Nam                    │
│    Ngày sinh: 15/03/1950             │
│    Ngày sinh ÂL: 28/01 Canh Dần     │
│    Nơi sinh: Hà Nội                 │
│                                      │
│  🔗 Kết Nối Gia Tộc                 │
│    Cha: [Nguyễn Văn B] → clickable  │
│    Mẹ: [Trần Thị C] → clickable    │
│    Vợ: [Lê Thị D] → clickable      │
│    Con:                              │
│      • [Nguyễn Văn E] → clickable   │
│      • [Nguyễn Thị F] → clickable   │
│                                      │
│  📝 Tiểu Sử                        │
│    "Người đã cống hiến cả đời cho   │
│     gia tộc..."  (truncated 3 lines) │
│                                      │
│  ┌──────────────────────────┐        │
│  │   Xem Hồ Sơ Đầy Đủ →   │        │
│  └──────────────────────────┘        │
│                                      │
│  ┌──────────────────────────┐        │
│  │   ✏️ Chỉnh Sửa           │        │
│  └──────────────────────────┘        │
└──────────────────────────────────────┘
```

**Chi tiết các section:**

1. **Avatar & Identity:**
   - Avatar tròn 96px, `frame-gold-leaf` border, `deceased-filter` nếu đã mất
   - Full name: font-serif (Playfair Display), text-xl
   - Generation badge: "Đời thứ N" + Role badge
   - Life dates: "YYYY — Present" hoặc "YYYY — YYYY"

2. **Thông Tin Cá Nhân:**
   - Giới tính, ngày sinh dương lịch, ngày sinh âm lịch
   - Nơi sinh (nếu có)
   - Lineage role (HEAD_OF_HOUSE, ELDER, etc.)

3. **Kết Nối Gia Tộc (Neural Connections):**
   - Danh sách cha, mẹ, vợ/chồng, con cái
   - Mỗi tên là **clickable** → click sẽ:
     - Select node đó trên graph
     - Pan/zoom graph đến node đó
     - Cập nhật Inspector với thông tin mới
   - Avatar mini (24px) cạnh mỗi tên

4. **Tiểu Sử (truncated):**
   - Hiển thị 3 dòng đầu, có nút "Xem thêm"
5. **Action Buttons:**
   - "Xem Hồ Sơ Đầy Đủ" → navigate `/lineage/{memberId}` (Digital Profile)
   - "Chỉnh Sửa" → mở MemberInputModal (chỉ hiện cho user có quyền edit)

#### 3.2.3 Deceased Member Treatment

Khi node được chọn là người đã mất:

- Avatar: `grayscale(0.6)` filter + gold border
- Tên: thêm icon 🪷 (Golden Lotus) bên cạnh
- Life dates: hiển thị cả ngày mất
- Background Inspector: subtle gold overlay `rgba(197,160,89,0.03)`

---

### 3.3 Mini-Map Navigator

#### 3.3.1 Layout & Position

- **Position:** góc dưới-phải của canvas, cách viền 16px
- **Size:** `240 × 180px`
- **Nền:** `rgba(26,8,8,0.92)` với `backdrop-filter: blur(8px)`
- **Border:** `1px solid rgba(197,160,89,0.25)`
- **Border-radius:** 8px
- **Shadow:** `0 4px 16px rgba(0,0,0,0.4)`
- **Z-index:** 20 (trên canvas, dưới Inspector)

#### 3.3.2 Nội dung Mini-Map

```
┌─────────────────────────────────────┐
│  MINI MAP                     [×]   │
│ ┌─────────────────────────────────┐ │
│ │  ·  ·       ·                   │ │
│ │    ·    ·  ·     ·  ·           │ │
│ │  ·   ·  ┌───────┐  ·     ·     │ │
│ │    · ·  │viewport│  ·  ·       │ │
│ │  ·    · └───────┘    ·         │ │
│ │     ·     ·   ·  ·     ·       │ │
│ │  ·    ·      ·       ·         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- **Nodes:** simplified — chỉ chấm tròn nhỏ (3-5px), màu tương ứng category
- **Edges:** đường thẳng cực mỏng (0.5px), `rgba(197,160,89,0.15)`
- **Viewport rectangle:** viền `#8a0000` 1.5px, fill `rgba(138,0,0,0.12)`
- **Header:** "MINI MAP" text 9px uppercase tracking-widest, gold nhạt + nút đóng (×)

#### 3.3.3 Tương Tác Mini-Map

| Action                      | Hành vi                                                        |
| --------------------------- | -------------------------------------------------------------- |
| **Viewport rectangle**      | Cập nhật real-time khi zoom/pan graph chính                    |
| **Click trên mini-map**     | Pan graph chính tới vị trí click (smooth 300ms transition)     |
| **Drag viewport rectangle** | Pan graph chính theo drag (real-time)                          |
| **Nút đóng (×)**            | Ẩn mini-map, hiện nút nhỏ "🗺️" để mở lại                       |
| **Resize viewport**         | Viewport rectangle thay đổi kích thước khi zoom level thay đổi |

#### 3.3.4 Performance

- Mini-map chỉ re-render khi:
  - Graph data thay đổi (thêm/xóa node)
  - Viewport thay đổi (zoom/pan) — throttle 60ms (≈16fps)
- Nodes trên mini-map dùng simplified rendering (dots only, no labels, no avatars)
- Nếu graph > 500 nodes, mini-map sample 50% nodes (skip nodes ít kết nối nhất)

---

### 3.4 Sidebar Controls (Left)

Giữ nguyên sidebar layout từ PRD-02 §4.1.3, bổ sung cho Brain Node View:

#### 3.4.1 View Toggle

- **Neural Brain** (active khi ở Brain Node view) | **Traditional Tree**
- Toggle chuyển đổi giữ `selectedNodeId` và scroll position hợp lý

#### 3.4.2 Filter Panel

- **Thế hệ (Generation):** Slider range hoặc checkbox list (G1, G2, G3...)
- **Vai trò:** HEAD_OF_HOUSE, ELDER, HEIR, MEMBER (checkbox)
- **Trạng thái:** Living / Deceased (checkbox)
- **Giới tính:** Male / Female / All
- Filter thay đổi → graph animate nodes in/out (fade + scale)

#### 3.4.3 Graph Statistics

- Tổng số nodes hiển thị: "**128** thành viên"
- Tổng thế hệ: "**14** đời"
- Kết nối: "**256** mối liên kết"

#### 3.4.4 Search Member

- Input search tìm thành viên theo tên
- Kết quả: dropdown list dưới input
- Click kết quả → select node + zoom-to-node trên graph

#### 3.4.5 "New Node Entry" Button

- `btn-lacquer` style → mở MemberInputModal
- Chỉ hiện cho user có quyền edit

---

## 4. Style & Tokens Bổ Sung

Giữ nguyên toàn bộ design tokens từ PRD-00 và design-tokens.md. Bổ sung cho Brain Node View:

| Token                      | Giá trị                 | Mục đích               |
| -------------------------- | ----------------------- | ---------------------- |
| `--brain-canvas-bg`        | `#230f0f`               | Nền canvas chính       |
| `--brain-node-default`     | `#3498db`               | Màu node mặc định      |
| `--brain-node-deceased`    | `#95a5a6`               | Màu node đã mất        |
| `--brain-node-head`        | `#e74c3c`               | Màu node trưởng tộc    |
| `--brain-node-elder`       | `#f39c12`               | Màu node cao niên      |
| `--brain-node-heir`        | `#2ecc71`               | Màu node người kế thừa |
| `--brain-node-female`      | `#9b59b6`               | Màu node thành viên nữ |
| `--brain-node-selected`    | `#e5c17c`               | Màu node đang chọn     |
| `--brain-edge-default`     | `rgba(197,160,89,0.25)` | Màu edge thường        |
| `--brain-edge-spouse`      | `rgba(138,0,0,0.3)`     | Màu edge vợ/chồng      |
| `--brain-edge-highlight`   | `rgba(229,193,124,0.6)` | Màu edge highlight     |
| `--brain-minimap-bg`       | `rgba(26,8,8,0.92)`     | Nền mini-map           |
| `--brain-minimap-viewport` | `rgba(138,0,0,0.12)`    | Fill viewport rect     |
| `--brain-inspector-width`  | `384px`                 | Width panel inspector  |
| `--brain-node-min-radius`  | `8px`                   | Radius node nhỏ nhất   |
| `--brain-node-max-radius`  | `28px`                  | Radius node lớn nhất   |

---

## 5. Tech Stack — Lựa Chọn Công Nghệ

### 5.1 Đánh Giá Các Lựa Chọn

| Thư viện                   | Rendering         | Ưu điểm                                                                                                             | Nhược điểm                                        | Phù hợp                        |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| **`react-force-graph-2d`** | HTML5 Canvas (2D) | Chuyên biệt cho force graph, API React, tích hợp `d3-force`, zoom/pan sẵn, node interaction sẵn, hỗ trợ >1000 nodes | Cần custom rendering cho node phức tạp            | ⭐ **Khuyến nghị**             |
| **D3.js (raw)**            | SVG               | Toàn quyền kiểm soát, đã có trong project                                                                           | SVG lag >200 nodes, phải tự xây dựng mọi thứ      | Không khuyến nghị cho view này |
| **Sigma.js**               | WebGL             | Hiệu năng cao nhất cho graph lớn                                                                                    | API khác biệt, learning curve, không React native | Overkill cho use case này      |
| **Reagraph**               | WebGL             | React native, 2D/3D, đẹp                                                                                            | Tương đối mới, ít community                       | Backup option                  |
| **`react-force-graph-3d`** | WebGL (Three.js)  | 3D immersive                                                                                                        | Quá phức tạp cho use case 2D, nặng                | Không phù hợp                  |

### 5.2 Công Nghệ Được Chọn

| Thành phần           | Công nghệ                                   | Lý do                                                                                        |
| -------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Graph Engine**     | `react-force-graph-2d`                      | API React tốt nhất, sẵn Canvas rendering cho hiệu năng, d3-force tích hợp, zoom/pan/drag sẵn |
| **Physics Engine**   | `d3-force` (bundled with react-force-graph) | Force-directed layout chuẩn, tuning dễ dàng                                                  |
| **Mini-Map**         | Custom Canvas element                       | Nhẹ nhàng, render simplified graph                                                           |
| **Inspector Panel**  | React Component (pure React)                | Reuse UI components có sẵn                                                                   |
| **State Management** | Zustand (`useLineageStore`)                 | Extend store hiện tại, thêm brain view state                                                 |

### 5.3 Package Mới Cần Cài

```bash
npm install react-force-graph-2d
```

> **Note:** `react-force-graph-2d` sử dụng `d3-force` internally (đã có `d3` trong project), render bằng HTML5 Canvas cho hiệu năng tốt hơn SVG đáng kể (xử lý >1000 nodes mượt mà).

---

## 6. Data Model & API

### 6.1 Graph Data Structure

Dữ liệu graph cần được transform từ Members + Relationships API hiện có:

```typescript
interface BrainGraphData {
  nodes: BrainNode[];
  links: BrainLink[];
}

interface BrainNode {
  id: string;
  fullName: string;
  shortName: string; // Tên ngắn hiển thị
  generation: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  lineageRole?: string; // HEAD_OF_HOUSE, ELDER, HEIR, MEMBER, YOUTH
  isDeceased: boolean;
  avatarUrl?: string;
  birthYear?: number;
  deathYear?: number;
  connectionCount: number; // Tính từ links

  // d3-force computed (runtime)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface BrainLink {
  source: string; // Node ID
  target: string; // Node ID
  type: "PARENT_CHILD" | "SPOUSE";
}
```

### 6.2 API Endpoints (Reuse)

Sử dụng API có sẵn, không cần endpoint mới:

| Method | Endpoint                | Dữ liệu             | Ghi chú                              |
| ------ | ----------------------- | ------------------- | ------------------------------------ |
| GET    | `/api/v1/members`       | Tất cả thành viên   | Fetch với limit cao (1000) cho graph |
| GET    | `/api/v1/members/[id]`  | Chi tiết thành viên | Cho Inspector panel                  |
| GET    | `/api/v1/relationships` | Tất cả mối quan hệ  | Build edges cho graph                |

### 6.3 Data Transformation

```typescript
// Transform API data → Graph data
function buildGraphData(
  members: Member[],
  relationships: Relationship[],
): BrainGraphData {
  const nodes = members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    shortName: extractShortName(m.fullName),
    generation: m.generation,
    gender: m.gender,
    lineageRole: m.lineageRole,
    isDeceased: m.isDeceased,
    avatarUrl: m.avatarUrl,
    birthYear: m.birthDate?.getFullYear(),
    deathYear: m.deathDate?.getFullYear(),
    connectionCount: 0, // Tính sau
  }));

  const links = relationships.map((r) => ({
    source: r.parentId ?? r.memberAId,
    target: r.childId ?? r.memberBId,
    type: r.type,
  }));

  // Tính connectionCount
  links.forEach((link) => {
    const src = nodes.find((n) => n.id === link.source);
    const tgt = nodes.find((n) => n.id === link.target);
    if (src) src.connectionCount++;
    if (tgt) tgt.connectionCount++;
  });

  return { nodes, links };
}
```

---

## 7. Responsive Behavior

| Viewport           | Canvas     | Inspector                       | Mini-Map               | Sidebar           |
| ------------------ | ---------- | ------------------------------- | ---------------------- | ----------------- |
| Desktop ≥1280px    | Flex-1     | 384px slide-in right            | 240×180px bottom-right | 256px fixed left  |
| Laptop 1024–1279px | Flex-1     | 320px slide-in right            | 200×150px bottom-right | 256px collapsible |
| Tablet 768–1023px  | Full-width | Bottom sheet (full-width, 50vh) | 180×130px bottom-right | Drawer overlay    |
| Mobile <768px      | Full-width | Bottom sheet (full-width, 60vh) | Ẩn (toggle button)     | Drawer overlay    |

---

## 8. Performance Targets

| Metric                        | Target  | Cách đo                     |
| ----------------------------- | ------- | --------------------------- |
| Initial render (50 nodes)     | < 500ms | Lighthouse performance      |
| Initial render (200 nodes)    | < 1.5s  | Lighthouse performance      |
| Initial render (500 nodes)    | < 3s    | Lighthouse performance      |
| Zoom/Pan FPS                  | ≥ 50fps | Chrome DevTools Performance |
| Node click → Inspector render | < 100ms | Interaction measurement     |
| Mini-map update latency       | ≤ 60ms  | requestAnimationFrame sync  |
| Memory usage (500 nodes)      | < 100MB | Chrome DevTools Memory      |

---

## 9. Ngoài Phạm Vi (Out of Scope)

Các tính năng sau **KHÔNG** nằm trong PRD-02.2:

- 3D graph view (Three.js / WebGL 3D)
- AI-powered relationship suggestion / auto-layout
- Collaborative real-time co-viewing graph
- Export graph as image/PDF
- Animated graph growth / timeline playback
- Cluster grouping by family branch
- Multi-clan graph merge
- Node editing inline trên graph (vẫn dùng MemberInputModal)
- WebSocket real-time graph sync

---

## 10. Rủi Ro & Giải Pháp

| Rủi ro                                              | Xác suất   | Ảnh hưởng  | Giải pháp                                                                                        |
| --------------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Graph >500 nodes gây lag                            | Trung bình | Cao        | Canvas rendering (không dùng SVG), node culling (ẩn nodes ngoài viewport), labels ẩn ở zoom thấp |
| `react-force-graph-2d` SSR error                    | Cao        | Trung bình | Dynamic import với `ssr: false` (đã có pattern trong project)                                    |
| Force simulation không ổn định                      | Thấp       | Trung bình | Tuning force parameters, warmup ticks, alpha decay                                               |
| Mini-map lag khi pan liên tục                       | Trung bình | Thấp       | Throttle re-render (requestAnimationFrame), simplified node rendering                            |
| Inspector panel chặn graph interaction              | Thấp       | Thấp       | Click overlay bên ngoài panel → deselect, responsive bottom sheet trên mobile                    |
| Node colors khó phân biệt cho người dùng colorblind | Trung bình | Trung bình | Sử dụng cả shape/size kết hợp color, thêm pattern fills cho accessibility                        |

---

## 11. Definition of Done — Tiêu Chí Hoàn Thành

### Brain Node Canvas

- [ ] Force-directed graph render tất cả members dưới dạng circle nodes
- [ ] Node sizing proportional theo số kết nối
- [ ] Node color-coded theo vai trò/giới tính/trạng thái
- [ ] Edges hiển thị mối quan hệ parent-child và spouse
- [ ] Zoom (0.1–5.0) và pan smooth trên desktop + mobile (touch)
- [ ] Click node → select + highlight connected edges
- [ ] Double-click node → zoom-to-fit node đó
- [ ] Hover node → enlarge + show full name + highlight edges
- [ ] Drag node → reposition (pin at new position)
- [ ] Canvas controls (zoom in/out, fit all, re-center) hoạt động
- [ ] Labels hiển thị/ẩn theo zoom level (threshold 0.5)
- [ ] Deceased nodes → grayscale color
- [ ] Warmup simulation → graph ổn định trước khi hiển thị

### Inspector Panel

- [ ] Click node → Inspector slide-in với thông tin đầy đủ
- [ ] Avatar, tên, thế hệ, vai trò, ngày sinh/mất hiển thị đúng
- [ ] Neural Connections (cha/mẹ/vợ/chồng/con) clickable → select node tương ứng
- [ ] "Xem Hồ Sơ Đầy Đủ" navigate đúng route
- [ ] "Chỉnh Sửa" hiện khi user có quyền
- [ ] Deceased member → gold overlay + lotus icon
- [ ] Click canvas trống → Inspector đóng (slide-out)

### Mini-Map

- [ ] Mini-map hiển thị đúng topology toàn graph (simplified dots)
- [ ] Viewport rectangle phản ánh chính xác vùng đang xem
- [ ] Viewport cập nhật real-time khi zoom/pan (throttled 60ms)
- [ ] Click mini-map → pan graph chính tới vị trí đó (smooth 300ms)
- [ ] Nút đóng/mở mini-map hoạt động
- [ ] Không gây lag khi graph có >200 nodes

### Cross-Cutting

- [ ] `npx tsc --noEmit` — zero errors
- [ ] View toggle Neural ↔ Traditional giữ selected node
- [ ] Responsive: 4 breakpoints (desktop/laptop/tablet/mobile)
- [ ] Performance: smooth 50fps zoom/pan với 200 nodes
- [ ] Sidebar filters thay đổi graph nodes (fade in/out animation)
- [ ] Search member → zoom-to-node trên graph
- [ ] Keyboard accessibility: Tab qua nodes, Enter select
- [ ] Không regression với Traditional Tree view hiện tại
