# PRD-02.1: Nâng Cấp Cây Gia Phả v1.1 — Lineage Tree Enhancement

> **Phiên bản:** 1.1  
> **Ngày tạo:** 2026-03-01  
> **Tham chiếu:** [PRD-02 — Lineage Visualization (MVP)](PRD-02-lineage-visualization.md) | [PRD-00 — Global Design System](PRD-00-global-design-system.md)  
> **UI Reference:** [4.traditionallineage.html](../ui/4.traditionallineage.html) | [4.1.memberinput.html](../ui/4.1.memberinput.html)  
> **Mức ưu tiên:** P1 — Nâng cấp trải nghiệm người dùng  

---

## 1. Bối Cảnh & Mục Tiêu

Bản MVP hiện tại của chức năng Cây Gia Phả (Traditional Lineage Tree) đã hoàn thành các tính năng cơ bản: hiển thị cây với D3.js, zoom/pan, chọn node xem chi tiết, thêm thành viên. Tuy nhiên còn thiếu sót về UX, visual design và một số bug cần khắc phục.

### 1.1 Vấn Đề Hiện Tại

| # | Vấn đề | Mức nghiêm trọng |
|---|--------|-------------------|
| 1 | Đường nối giữa các node dùng đường cong Bezier, không trực quan kiểu org-chart | UX — Trung bình |
| 2 | Không có nút thu gọn/mở rộng nhánh cây, khó nắm tổng quan khi cây lớn | UX — Cao |
| 3 | Node quá đơn giản, thiếu icon user/giới tính, thiếu avatar | Visual — Trung bình |
| 4 | **Bug**: Thành viên đời 5-6 hiển thị ở level 1 khi parentId trỏ tới member ngoài dataset | Bug — Cao |
| 5 | Không có cách thêm node con nhanh trực tiếp từ cây | UX — Trung bình |
| 6 | Không có hình ảnh demo, thiếu avatar cho seed data | Visual — Thấp |
| 7 | Không có mini-map, người dùng mất phương hướng trong cây lớn | UX — Cao |
| 8 | Thành viên đã tạo nhưng thiếu relationship (orphan) không có thao tác gắn lại cha/mẹ ngay trên cây | UX/Bug — Cao |

### 1.2 Mục Tiêu v1.1

- **Fix bug hierarchy**: Cây phải hiển thị đúng theo đời (G1 trên → G5 dưới), không có node orphan sai level
- **Org-chart connectors**: Đường nối thẳng vuông góc (elbow) thay vì đường cong
- **Collapse/expand**: Cho phép thu gọn/mở rộng bất kỳ nhánh nào
- **Rich node design**: Node card đẹp hơn với avatar, icon giới tính, role badge
- **Quick-add child**: Hover node → nút "+" để thêm con nhanh
- **Mini-map**: Bản đồ thu nhỏ góc phải dưới để định vị trong cây lớn
- **Demo assets**: Ảnh avatar mẫu cho dữ liệu seed
- **Relink orphan member**: Cho phép gắn lại cha/mẹ cho thành viên đã tạo nhưng chưa có relationship

---

## 2. Đối Tượng Sử Dụng

| Vai trò | Quyền liên quan v1.1 |
|---------|----------------------|
| Trưởng tộc (HEAD_OF_HOUSE) | Thu gọn/mở rộng, thêm con, xem mini-map |
| Biên tập viên (ELDER) | Thu gọn/mở rộng, thêm con, xem mini-map |
| Thành viên (MEMBER) | Thu gọn/mở rộng, xem mini-map |
| Khách (GUEST) | Thu gọn/mở rộng, xem mini-map (read-only) |

---

## 3. Yêu Cầu Tính Năng Chi Tiết

### 3.1 Fix Bug: Hiển Thị Đúng Theo Cấp Đời (Generation Hierarchy)

**Mô tả:** Hiện tại, logic phát hiện root node (`roots`) kiểm tra `parentIds` xem parent có nằm trong `memberMap` không. Nếu parent không được fetch (do limit=200), thành viên đời 5-6 bị coi là root → hiển thị ở level 1.

**Yêu cầu:**
- Sử dụng trường `generation` để xác định depth chính xác trong cây
- Chỉ member có `generation` thấp nhất (hoặc `generation = 1`) mới được coi là root
- Nếu member thiếu parent trong dataset nhưng có `generation > 1`, tự động gắn vào virtual root ở đúng depth
- Thứ tự render: G1 (trên cùng) → G2 → G3 → ... → Gn (dưới cùng)

**Acceptance Criteria:**
- [ ] Seed 5 đời → cây render G1 trên cùng, G5 dưới cùng
- [ ] Member có `generation=5` nhưng thiếu parent trong dataset không hiển thị ở level 1
- [ ] Cây không có cycle loop hay infinite recursion

---

### 3.2 Đường Nối Vuông Góc Kiểu Org-Chart (Elbow Connectors)

**Mô tả:** Thay thế đường cong Bezier (`d3.linkVertical`) bằng đường nối vuông góc (orthogonal/elbow) giống sơ đồ tổ chức.

**Hành vi đường nối:**
```
    [Parent]
        │
        ├──────────┐
        │          │
    [Child A]  [Child B]
```

- Đường đi: từ parent đi thẳng xuống → ngang sang → thẳng xuống tới child
- Công thức path: `M sx,sy V midY H tx V ty` (midY = trung điểm giữa parent.y và child.y)
- Màu: `rgba(197,160,89,0.35)` (gold nhạt, giữ nguyên palette)
- Độ dày: `1.5px`
- Đường nối vợ/chồng (spouse): giữ nguyên dạng ngang nét đứt

**Acceptance Criteria:**
- [ ] Tất cả đường nối parent-child là đường thẳng vuông góc
- [ ] Không còn đường cong Bezier
- [ ] Đường spouse vẫn là nét đứt ngang

---

### 3.3 Thu Gọn / Mở Rộng Nhánh Cây (Collapse/Expand)

**Mô tả:** Mỗi node có con sẽ hiển thị nút toggle ở đáy node. Click để ẩn/hiện tất cả node con bên dưới.

**Chi tiết UI:**
- Nút tròn nhỏ (∅18px) ở bottom-center của node, dịch xuống 9px
- Icon: `▾` (expanded) / `▸` (collapsed)
- Nền: `#1a0808` với viền gold `rgba(197,160,89,0.4)`
- Chỉ hiển thị trên node có con (leaf node không có nút)
- Khi collapsed, hiện badge số lượng con cháu bị ẩn (vd: `+12`)

**State Management:**
- `collapsedNodes: Set<string>` lưu trong Zustand lineage store
- Persist across zoom/pan nhưng reset khi refresh trang

**Hành vi:**
1. Click nút `▾` → ẩn tất cả descendants (con, cháu, chắt...)
2. Đường nối tới con cũng bị ẩn
3. Icon chuyển thành `▸`, badge `+N` xuất hiện
4. Click lại → mở rộng, hiện lại tất cả descendants
5. Collapse một node cha → node con đã collapse vẫn giữ trạng thái riêng

**Acceptance Criteria:**
- [ ] Node có con hiển thị nút toggle
- [ ] Click collapse → ẩn tất cả con cháu + đường nối
- [ ] Badge `+N` hiển thị đúng số lượng descendants bị ẩn
- [ ] Click expand → hiện lại đúng trạng thái trước đó
- [ ] Leaf node không có nút toggle

---

### 3.4 Nâng Cấp Visual Node — Icon & Avatar

**Mô tả:** Thiết kế lại node card phong phú hơn, bổ sung avatar/icon giới tính, role badge.

**Kích thước node mới:** `200 × 80px` (tăng từ 160 × 70px)

**Layout trong node:**
```
┌──────────────────────────────────────┐
│ [Avatar]  Nguyễn Văn An          G5  │
│  (40px)   1950                   ⚙   │
│           HEAD_OF_HOUSE              │
└──────────────────────────────────────┘
```

**Avatar (bên trái, 40×40px circle):**
- Có `avatarUrl` → hiển thị ảnh trong circle clip
- Không có avatar → hiện icon SVG giới tính:
  - Nam: icon person (filled, #c5a059)
  - Nữ: icon person_outline variant (#c5a059)
  - Khác: icon person generic
- Deceased: thêm filter grayscale 70% lên avatar

**Role Badge (góc phải):**
- `HEAD_OF_HOUSE`: chấm tròn vàng gold ⦿
- `ELDER`: chấm tròn đồng bronze 
- `HEIR`: chấm tròn bạc silver
- Các role khác: không hiện badge

**Styling node card:**
- Living: gradient fill `#1a0808` → `#2d1515`
- Deceased: fill `#1e1414` + filter `saturate(0.3)`, text opacity giảm
- Selected: viền vàng `#e5c17c` 2px, fill `#8a0000`
- Hover: viền sáng hơn `rgba(197,160,89,0.7)`, nhẹ shadow glow

**Acceptance Criteria:**
- [ ] Mỗi node hiển thị avatar circle hoặc gender icon
- [ ] Deceased node có hiệu ứng grayscale
- [ ] Role badge hiển thị đúng theo lineageRole
- [ ] Node kích thước mới 200×80, layout không bị tràn text

---

### 3.5 Nút "+" Thêm Con Khi Hover (Quick Add Child)

**Mô tả:** Khi hover vào một node, hiện nút "+" nhỏ ở đáy node. Click để thêm node con mới.

**Chi tiết UI:**
- Nút tròn (∅24px) xuất hiện ở bottom-center, dịch xuống 20px từ đáy node
- Ẩn mặc định, chỉ hiện khi mouseenter node group
- Icon: `+` màu gold trên nền crimson `#8a0000`
- Hover nút: scale 1.1, shadow glow
- Vị trí: ngay dưới nút collapse (nếu có), cách 8px

**Hành vi:**
1. Hover vào node → nút "+" fade-in (opacity 0→1, 150ms)
2. Mouse leave → nút fade-out (150ms)
3. Click nút "+" → navigate tới `/lineage/add?parentId={nodeId}`
4. Form add member tự động fill parent = node hiện tại
5. Chỉ hiển thị cho user có quyền edit (ADMIN, ELDER, HEAD_OF_HOUSE)

**Acceptance Criteria:**
- [ ] Hover node → nút "+" xuất hiện smooth
- [ ] Click → chuyển trang add member với parentId pre-filled
- [ ] Guest/MEMBER không thấy nút "+"
- [ ] Nút không đè lên nút collapse

---

### 3.6 Mini-Map Navigator (Bản Đồ Thu Nhỏ)

**Mô tả:** Panel nhỏ góc phải dưới hiển thị toàn bộ cây ở tỉ lệ thu nhỏ, với hình chữ nhật viewport chỉ vùng đang xem.

**Chi tiết UI:**
- Kích thước: `220 × 160px`, góc phải dưới, cách viền 16px
- Nền: `rgba(26,8,8,0.9)` với backdrop-blur, viền gold nhạt
- Header nhỏ: "Mini Map" text 9px + nút đóng (×)
- Nội dung: bản sao SVG toàn cây ở tỉ lệ ~8-12% (auto-fit)
- Node: simplified — chỉ rect nhỏ 4×3px, màu tương ứng (living/deceased)
- Đường nối: đường thẳng mỏng 0.5px
- Viewport rectangle: viền `#8a0000` 1.5px, fill `rgba(138,0,0,0.15)`

**Tương tác:**
1. Viewport rectangle cập nhật real-time khi zoom/pan cây chính
2. Click vào mini-map → pan cây chính tới vị trí tương ứng
3. Drag viewport rectangle → pan cây chính (optional, v1.2 nếu phức tạp)
4. Nút đóng (×) → ẩn mini-map, hiện nút nhỏ để mở lại

**Acceptance Criteria:**
- [ ] Mini-map hiển thị đúng cấu trúc toàn cây
- [ ] Viewport rectangle phản ánh đúng vùng đang xem
- [ ] Click mini-map pan cây chính tới vị trí đó
- [ ] Nút đóng/mở hoạt động
- [ ] Không gây lag khi cây có >100 nodes

---

### 3.7 Hình Ảnh Demo & Avatar Mẫu

**Mô tả:** Bổ sung ảnh demo cho dữ liệu seed, bao gồm avatar thành viên và hình nền texture.

**Yêu cầu:**
- 5-6 ảnh avatar placeholder SVG (generated, không dùng ảnh thật) → `public/images/demo/`
- Mỗi avatar: phong cách thống nhất, 200×200px, nền trong suốt
- Cập nhật `prisma/seed.ts` gán `avatarUrl` cho 5-6 thành viên seed
- 1 ảnh background texture nhẹ cho canvas khu vực cây (kiểu giấy cũ/vân gỗ mờ)

**Acceptance Criteria:**
- [ ] Ít nhất 5 thành viên seed có avatarUrl
- [ ] Avatar hiển thị đúng trong node card
- [ ] Background texture hiển thị trên canvas nhưng không gây rối mắt

---

### 3.8 Gắn Lại Cha/Mẹ Cho Thành Viên Đã Tạo (Relink Orphan Member)

**Mô tả:** Trong thực tế có trường hợp member được tạo thành công nhưng không tạo được relationship (ví dụ dữ liệu seed UUID không theo strict RFC). Khi đó member trở thành orphan (`parentIds: []`) và không nằm đúng nhánh cây mong muốn.

**Yêu cầu:**
- Trong detail panel của Lineage, thêm action `Gan Cha/Me` (hoặc `Them Cha/Me` nếu member đã có parent).
- Click action mở modal chọn parent từ danh sách member cùng clan.
- Submit sẽ gọi `POST /api/v1/relationships` với `{ parentId, childId }`.
- Thành công phải refresh ngay:
  - Danh sách members để cây rerender.
  - Detail member hiện tại để cập nhật `parents`/`children`.
- Khi member chưa được gắn parent, member vẫn phải hiển thị trong cây như một root tạm thời để người dùng thao tác relink.

**Chi tiết UI:**
- Nút action trong panel bên phải: kiểu secondary outline, text uppercase theo style hiện tại.
- Modal gồm:
  - Tên member đang relink (read-only).
  - Dropdown chọn cha/mẹ.
  - Nút `Luu Lien Ket` + `Huy`.
  - Error banner nếu API trả lỗi.

**Hành vi:**
1. User chọn một orphan member trên cây.
2. Click `Gan Cha/Me`.
3. Chọn parent và bấm `Luu Lien Ket`.
4. API tạo relationship thành công.
5. Cây tự refresh và member chuyển về đúng nhánh parent.

**Acceptance Criteria:**
- [ ] Detail panel có action relink parent cho member hiện tại.
- [ ] Modal relink hiển thị danh sách parent hợp lệ (loại trừ chính member đó).
- [ ] Submit thành công tạo relationship và tự refresh tree/detail.
- [ ] Member orphan sau relink không còn `parentIds: []` (trừ root thật sự).
- [ ] Trường hợp lỗi API hiển thị message rõ ràng trong modal.

---

## 4. Style & Tokens Bổ Sung

Giữ nguyên toàn bộ design tokens từ [PRD-00](PRD-00-global-design-system.md) và [design-tokens.md](../implementation/design-tokens.md). Bổ sung:

| Token | Giá trị | Mục đích |
|-------|---------|----------|
| `--node-w` | `200px` | Chiều rộng node card mới |
| `--node-h` | `80px` | Chiều cao node card mới |
| `--connector-color` | `rgba(197,160,89,0.35)` | Màu đường nối |
| `--connector-width` | `1.5px` | Độ dày đường nối |
| `--minimap-bg` | `rgba(26,8,8,0.9)` | Nền mini-map |
| `--minimap-viewport` | `rgba(138,0,0,0.15)` | Fill viewport rect |
| `--collapse-btn-size` | `18px` | Kích thước nút collapse |
| `--addchild-btn-size` | `24px` | Kích thước nút add-child |

---

## 5. Ngoài Phạm Vi (Out of Scope)

Các tính năng sau **KHÔNG** nằm trong v1.1:

- Neural Root Network view upgrade
- PDF / Image export cây gia phả
- Virtual offerings trên profile
- Member edit modal (inline editing)
- 3D tomb visualization
- i18n / đa ngôn ngữ
- Offline PWA mode

---

## 6. Rủi Ro & Giải Pháp

| Rủi ro | Xác suất | Giải pháp |
|--------|----------|-----------|
| Cây >200 nodes gây lag mini-map | Trung bình | Throttle mini-map re-render (requestAnimationFrame), simplified node rendering |
| Collapse state mất khi SWR re-fetch | Thấp | Lưu trong Zustand (client state), không phụ thuộc server |
| Node card 200px quá rộng cho mobile | Trung bình | Responsive: giảm NODE_W xuống 160px trên viewport < 768px |
| Demo avatar bị lỗi path sau deploy | Thấp | Dùng path tương đối `/images/demo/...`, test trên production build |

---

## 7. Định Nghĩa Hoàn Thành (Definition of Done)

- [ ] Tất cả 8 acceptance criteria sections ở mục 3 đều pass
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Responsive: cây hiển thị đúng trên desktop (1280+) và tablet (768+)
- [ ] Performance: smooth 60fps zoom/pan với 50 nodes
- [ ] Không regression: các tính năng MVP hiện tại vẫn hoạt động (search, detail panel, add member)
- [ ] Code review: không có `any` type mới, ESLint clean
