# Divergence Ledger — Plan gốc ⟷ Implement thực tế

> Liệt kê mọi điểm implement lệch khỏi scope đã plan (`plan/phases/phase-1..4-*.md`).
> Nguồn đối chiếu: plan doc gốc vs code hiện tại + `CONTEXT.md`.
> Cập nhật khi một pass mới đóng/mở một divergence.

**Loại:** 🔄 Thay cách làm · ✂️ Đơn giản hóa · 📉 Giảm scope · ⏸️ Hoãn/chưa làm · ➕ Làm thêm/bonus

---

## Phase 1 — Core Canvas

| # | Plan gốc | Thực tế | Loại |
|---|---|---|---|
| P1-1 | **Storybook**: story cho canvas host + node mẫu | Không có Storybook (0 tham chiếu, không `.storybook`, không `*.stories.*`) — bỏ toàn dự án | 📉 |
| P1-2 | Image **crop cơ bản** ngay Phase 1 | Crop UI/renderer dời sang Phase 4 Pass B (`imageRenderer.ts:44`); Phase 1 chỉ sprite phẳng | ⏸️ |
| P1-3 | Shape: rect / ellipse / line / polygon | Thêm `star` (render thật); thêm `path` nhưng là **stub ponytail** chưa parse (`shapeRenderer.ts:33`) | ➕ / 📉 |
| P1-4 | Prototype 1 shader demo xác nhận pipeline | Không có shader riêng ở mốc Phase 1; dùng `pixi-filters` sẵn. Shader tự viết đầu tiên là inner-shadow ở Phase 3 | ✂️ |

## Phase 2 — Editing Essentials

| # | Plan gốc | Thực tế | Loại |
|---|---|---|---|
| P2-1 | Command bus **apply/invert** (history: patch-based **hoặc** apply/invert) | Chốt hẳn **patch-based** (Immer `produceWithPatches`/`applyPatches`), không có đường apply/invert (`store.ts:271`) | 🔄 |
| P2-2 | Test "apply→invert→gốc" | Thành "gesture patch round-trip" (hệ quả P2-1); `MAX_HISTORY=100` đã có | 🔄 |

> Phần còn lại của Phase 1 & 2 **trung thành với plan**: CRUD/transform/layers/export, history/multi-select/group/snapping/guides/grid/rulers/zoom-pan/gradient/stroke/blend/opacity/shortcuts — đúng scope.

## Phase 3 — Text Effects

| # | Plan gốc | Thực tế | Loại |
|---|---|---|---|
| P3-1 | **opentype.js**: glyph outline + metrics; warp/3D → mesh geometry | **Không dùng opentype.js**. Rasterize `PIXI.Text`→texture→mesh; stroke/extrude = stack `Text` clone | 🔄 |
| P3-2 | Fill: solid / linear / radial / **conic** gradient | Conic **không có** trong `FillSchema` | 📉 |
| P3-3 | **Texture / image-in-text** (chữ làm mask, sample texture shader) | Chưa có; `texture` fill degrade thành màu đơn xấp xỉ (`fillToColor.ts:22`) | 📉 |
| P3-4 | **≥15 preset** dựng sẵn | **5 preset** (neon/chrome/sticker/retro/3d) | 📉 |
| P3-5 | **Lưu preset tùy chỉnh** | Chưa làm — không UI đặt tên / lớp lưu | ⏸️ |
| P3-6 | **Storybook demo** từng effect + **snapshot test** geometry | Bỏ Storybook; thay bằng vitest (`warpGeometry`/`buildFilters`/`builtins`) | 📉 |
| P3-7 | **3D extrude**: sinh mesh nhiều lớp + shading, 60 FPS | Stack ≤40 `Text` clone phẳng tô tối dần — không mesh, không normal-map | ✂️ |
| P3-8 | Cache **RenderTexture per-node** tổng quát | Chỉ warp-mesh có cache (`meshContentKey`); không có cache per-node tổng quát | ✂️ |
| P3-9 | Effect pipeline shader GLSL (gradient/texture/extrude/glow) | Phần lớn map `pixi-filters` sẵn; `custom` = **registry cố định** (`chromatic-aberration`), không nhận GLSL người dùng | ✂️ |
| P3-10 | `inner-shadow` | GLSL tự viết nhưng blur **5-tap xấp xỉ**, không Gaussian thật | ✂️ |
| P3-11 | Text-on-path: **đường người dùng vẽ/chọn** | 1 bezier bậc 2 tự tạo, 3 dot handle — không pen tool | ✂️ |
| P3-12 | **SDF text** cho scale lớn (cân nhắc) | Không làm (vốn là "cân nhắc") | ⏸️ |

## Phase 4 — Templates & Assets

| # | Plan gốc | Thực tế | Loại |
|---|---|---|---|
| P4-1 | Import SVG qua **svgson** | Pixi parse SVG native — không thêm dependency | 🔄 |
| P4-2 | Export SVG **text-outline khi cần** | Rasterize text → `<image>`, không outline | 📉 |
| P4-3 | Drag-drop asset qua **dnd-kit** | HTML5 DnD native, không thư viện | 🔄 |
| P4-4 | **Persistence**: serialize/deserialize + autosave + schema migration | Chưa làm (Pass D chưa bắt đầu, scope chưa chốt) | ⏸️ |
| P4-5 | **Template library** + thumbnail tự sinh | Chưa làm | ⏸️ |
| P4-6 | **PDF export** đa trang (pdf-lib) + batch | Chưa làm (tách riêng) | ⏸️ |
| P4-7 | **Thư viện shape/icon/background** dựng sẵn | Hoãn (nguồn nội dung) | ⏸️ |
| P4-8 | Crop **freeform + tỉ lệ** | 4 corner handle normalized 0..1, freeform; chưa có khóa tỉ lệ | 📉 |
| P4-9 | Mask bằng shape/text | Silhouette nhân bản kéo vừa bounds ảnh ("ảnh vào khung"), không clip pixel-chính xác | ✂️ |
| P4-10 | **AssetService** lưu local hoặc **S3/R2** | Embed base64 data URI; resolver stub để Phase 5 | ⏸️ |
| P4-11 | Thay ảnh giữ khung/mask | Không thấy làm | ⏸️ |
| P4-12 | Export SVG vector thuần mọi node | Gradient → `<defs>` thật; `texture` fill → xám phẳng (no `<pattern>`); svg-node bị rasterize; crop/mask/filter ảnh không map | 📉 |

## ➕ Làm thêm / sửa ngoài plan

| # | Nội dung |
|---|---|
| X-1 | Sửa **bug page-switch** tồn tại âm thầm từ Phase 1 (đổi `activePageId` không rebuild Pixi scene) — phát hiện ở Phase 4 Pass A |
| X-2 | `inner-shadow` GLSL + `custom` shader registry — vượt danh sách effect gốc (nhưng bị giới hạn, xem P3-9) |
| X-3 | Đảo thứ tự pass: SVG (Pass E) trước persistence (Pass D) |

---

## Nợ cần theo dõi (không tự tan)

1. **Storybook bỏ xuyên suốt** (P1-1, P3-6) — quyết định nhất quán cả 4 phase, không lẻ. Revisit khi cần visual-QA / public docs.
2. **`shape:'path'` stub** (P1-3) — **trùng chủ đề gate opentype**: cả hai là "parse path data thô". Khi Pass A–B opentype kéo `opentype.Path`/`toPathData` vào, có thể đóng luôn `shape:'path'` bằng `PIXI.Graphics().svg()` (parser Pixi native đã dùng cho SVG node) — 1 dependency, 2 chỗ dùng.
3. **Gate opentype** (P3-1, P4-2) — cùng một gốc "không glyph outline"; roadmap `phase-3-glyph-outline-opentype.md` xử lý (Pass A→E).
4. **Quick-win độc lập** không thuộc gate opentype: P3-2 conic, P3-4 nới preset, P3-5 save preset.
5. **Cần shader riêng**: P3-3 image-in-text, P3-7 3D thật, P3-9 material/metallic.
6. **Sub-scope lớn tách bạch**: P4-4/5/6 persistence + template + PDF; P4-10 backend asset (Phase 5).

## Phân loại tổng

| Loại | Số mục | Tính chất |
|---|---|---|
| 🔄 Thay cách làm | 4 | Không tạo nợ (thường lười hơn / tốt hơn) |
| ✂️ Đơn giản hóa | 7 | Có ceiling đã tài liệu hóa, upgrade khi cần |
| 📉 Giảm scope | 8 | Thiếu tính năng so với plan |
| ⏸️ Hoãn/chưa làm | 10 | Chưa bắt đầu |
| ➕ Bonus/sửa | 4 | Ngoài plan |
