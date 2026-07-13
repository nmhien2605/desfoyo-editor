# Phase 2 — Editing Essentials

Biến "canvas render được" thành "editor dùng được thật". Tập trung vào trải nghiệm chỉnh sửa: history, snapping, group, zoom/pan, shortcut.

## Mục tiêu

- Undo/redo ổn định cho mọi thao tác.
- Chọn nhiều object, group/ungroup.
- Snapping + smart guides khi di chuyển.
- Zoom/pan mượt, keyboard shortcuts.
- Fill nâng cao: gradient, opacity, stroke.

## Phạm vi chức năng

### History (undo/redo)
- Patch-based qua Immer `produceWithPatches` (hoặc command apply/invert).
- Coalesce các bước liên tục (drag, kéo slider) thành 1 entry.
- Giới hạn stack; UI nút undo/redo + `Ctrl/Cmd+Z`, `Shift+Ctrl/Cmd+Z`.

### Multi-select & group
- Chọn nhiều bằng shift-click và kéo khung (marquee).
- Transform nhóm (di chuyển/resize/xoay cả cụm quanh pivot chung).
- Group/ungroup → `GroupNode`; giữ transform tương đối đúng.
- Align & distribute (trái/giữa/phải, trên/giữa/dưới, phân bố đều).

### Snapping & guides
- Snap vào cạnh/tâm object khác, vào cạnh/tâm artboard.
- Smart guides (đường gợi ý khi thẳng hàng).
- Grid tùy chọn + snap-to-grid; rulers.

### Viewport
- Zoom (wheel + phím tắt + fit-to-screen), pan (space-drag / middle-mouse).
- Giới hạn zoom min/max; zoom về con trỏ.

### Clipboard & thao tác nhanh
- Copy/cut/paste, duplicate (`Ctrl/Cmd+D`), delete.
- Paste giữ vị trí / offset nhẹ.

### Fill & stroke nâng cao
- Solid + **linear/radial gradient** (editor gradient stops).
- Opacity per-object, blend mode cơ bản.
- Stroke: width, align (inside/center/outside), màu/gradient.

### Keyboard shortcuts
- Hệ thống shortcut đăng ký tập trung (di chuyển bằng arrow, nudge, chọn all, group…).

## Việc kỹ thuật

- Hoàn thiện **command bus** với apply/invert; nối vào history.
- Module **snapping** (tính candidate lines, threshold theo zoom).
- **Selection model** hỗ trợ nhiều node + transform nhóm (ma trận chung).
- **GradientEditor** + shader gradient trong render layer.
- Tầng **shortcut manager** tách khỏi component.

## Deliverables

- Undo/redo cho tất cả command.
- Group/ungroup, align/distribute.
- Snapping + guides + grid + rulers.
- Zoom/pan + fit-to-screen.
- Gradient fill + stroke UI.
- Bộ test cho history (apply → invert → trạng thái gốc) và snapping.

## DoD

- Thực hiện 20 thao tác rồi undo hết → về đúng document ban đầu.
- Group 10 object, xoay, ungroup → vị trí giữ nguyên đúng.
- Snapping cảm giác "dính" tự nhiên ở mọi mức zoom.

## Rủi ro & lưu ý

- Toán transform nhóm dễ sai (pivot, thứ tự scale/rotate) → viết test kỹ.
- Coalesce history cần rõ ràng để không tạo hàng trăm entry khi kéo slider.

## Ước lượng

~3–4 tuần.
