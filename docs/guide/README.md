# Guide — Cài đặt & sử dụng `@desfoyo/editor`

Tài liệu cho dev muốn cài `@desfoyo/editor` vào một project React khác và dùng component `Editor`.

| File                                             | Nội dung                                                |
| ------------------------------------------------- | -------------------------------------------------------- |
| [01-installation.md](./01-installation.md)         | Cài đặt package (private git repo), yêu cầu peer deps    |
| [02-usage.md](./02-usage.md)                       | Render `<Editor />`, `EditorHandle` (add/update/select/group node, `addAsset`, `canUndo`...), callbacks (`onSelectionChange`, `onHistoryChange`, `onNodeDoubleClick`), nhúng chỉ-canvas (`chrome={false}`, `viewScale`, nền trong suốt, đổi màu selection), tắt shortcuts, asset URL, headless render, custom font |
| [03-text-effects.md](./03-text-effects.md)         | Làm UI chỉnh chữ phía host: thêm text, font/size/spacing (đo lại `size` bằng `measureText`), fill gradient, text-shadow drop/line/block/3d, filter effects (outline/glow/blur/extrude3d/custom), warp 8 kiểu + handle, scale/xoay, đọc trạng thái node, giới hạn |

Xem thêm: [../../guide.md](../../guide.md) — kế hoạch đóng gói/publish phía maintainer (không phải phía dev tiêu thụ package).
