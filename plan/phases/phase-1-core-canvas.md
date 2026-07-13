# Phase 1 — Core Canvas Foundation (MVP)

Dựng bộ khung PixiJS + model + reconciler và các thao tác object cơ bản. Đây là nền cho mọi thứ sau này, nên ưu tiên đúng kiến trúc hơn là nhiều tính năng.

## Mục tiêu

- Có một canvas PixiJS render được document JSON.
- Thêm/chọn/di chuyển/resize/xoay object cơ bản.
- Panel layers hoạt động, export ra ảnh.
- **Prototype 1 shader đơn giản** để xác nhận pipeline effect khả thi (giảm rủi ro sớm).

## Phạm vi chức năng

### Canvas & viewport
- Khởi tạo PixiJS Application (WebGL), gắn vào React host component.
- Container gốc = artboard; render background theo `page.background`.
- Chuyển đổi tọa độ screen ↔ world (chuẩn bị cho zoom/pan ở Phase 2).

### Object cơ bản
- **Text**: dùng `PIXI.Text` (phẳng, chưa effect nặng).
- **Shape**: rect, ellipse, line, polygon (Pixi Graphics).
- **Image**: load asset → sprite, có crop cơ bản.
- Thêm object từ toolbar; xóa object.

### Selection & transform
- Click chọn 1 object; hiển thị bounding box + handle.
- Di chuyển (drag), resize (8 handle), xoay (rotate handle).
- Hit-testing qua Pixi interaction.
- Cập nhật `transform` trong model, reconciler đồng bộ.

### Layers
- Panel danh sách layer theo thứ tự z-index.
- Đưa lên/xuống, đưa lên trên cùng/xuống dưới cùng.
- Toggle visible / lock.

### Export
- Export artboard → PNG/JPG qua Pixi `extract` (render offscreen).

## Việc kỹ thuật (foundation)

- **Model & schema** (`schema/`): định nghĩa type + Zod cho BaseNode, Text/Shape/Image, Page, Document (theo [04-data-model.md](../04-data-model.md)).
- **Store** (`core/`): Zustand + Immer; tách `documentSlice` và `uiSlice`.
- **SceneReconciler** (`render/`): diff model → tạo/cập nhật/xóa DisplayObject; renderer adapter cho từng type.
- **Command bus (khung)**: bộ command đầy đủ cho Phase 1 là `AddNode`, `RemoveNode`, `UpdateProps`, `UpdateTransform`, `Reorder` (layers panel cần up/down/top/bottom) — chưa cần history (Phase 2), nhưng đi qua bus ngay từ đầu. `Group`/`Duplicate` hoãn sang Phase 2. Node type Zod schema ở Phase 1 chỉ chấp nhận `text | shape | image` (`group`/`svg` thêm ở Phase 2/4 — xem [04-data-model.md](../04-data-model.md)).
- **Effect pipeline (khung tối thiểu)**: cấu trúc để gắn filter vào node + 1 filter demo (vd drop-shadow từ pixi-filters).

## Deliverables

- React component `<Editor document={...} />` render được canvas.
- CRUD object cơ bản + transform hoạt động.
- Layers panel + export PNG.
- Storybook story cho canvas host và vài node mẫu.
- Unit test cho reconciler (model → số lượng/kiểu DisplayObject đúng).

## Tiêu chí hoàn thành (DoD)

- Thêm 50 object, kéo/resize/xoay mượt (≥ 60 FPS máy tầm trung). **Lưu ý**: 50 là mốc có chủ đích cho Phase 1 (object chưa có effect nặng); mốc 200 object trong [01-overview.md](../01-overview.md) là bar tổng thể, áp dụng đầy đủ từ Phase 3 khi effect pipeline thực sự xếp chồng filter.
- Reload document JSON → render lại đúng như trước.
- Export PNG khớp với những gì thấy trên canvas.
- Shader demo chạy được (xác nhận pipeline).

## Rủi ro & lưu ý

- Đừng nhét state UI vào đối tượng Pixi — giữ Pixi là "hàm thuần" của model.
- Chuẩn hóa toán transform/pivot sớm để tránh nợ kỹ thuật ở group/snapping.
- **Convention tọa độ đã chốt** (xem [04-data-model.md](../04-data-model.md)): `x/y` = vị trí pivot point (không phải góc trên-trái); rotation là radian; origin 0..1 định vị pivot trong bounding box.

## Ước lượng

~3–5 tuần (1–2 dev). Đây là phase nặng về kiến trúc.
