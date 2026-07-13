# Phase 5 — Advanced & Collaboration

Nâng sản phẩm lên mức nền tảng: nhiều người sửa cùng lúc, cloud, animation cơ bản, và mở rộng qua plugin. Nên làm sau khi model đã ổn định (vì collab phụ thuộc mạnh vào schema).

## Mục tiêu

- Realtime collaboration (multi-cursor, đồng bộ).
- Cloud save, version history.
- Animation/timeline cơ bản (motion + export GIF/video ngắn).
- Plugin API, theming, i18n, hoàn thiện public API của library.

## Phạm vi chức năng

### Realtime collaboration
- **Yjs** (CRDT) ánh xạ document model (Y.Map / Y.Array) — hoặc dịch vụ **Liveblocks**.
- Transport: **y-websocket** (self-host) hoặc provider.
- **Awareness**: multi-cursor, selection của người khác, danh sách người đang online.
- Xử lý xung đột tự động qua CRDT; offline-edit rồi merge khi online.

### Cloud & versioning
- Lưu project trên backend (Node/NestJS + Postgres + S3/R2).
- **Version history**: snapshot theo mốc, xem/khôi phục.
- Auth, phân quyền project (owner/editor/viewer), share link.

### Animation (cơ bản)
- Timeline: keyframe cho transform/opacity/effect params.
- Easing presets; preview play/pause.
- Export **GIF / MP4 (WebCodecs)** hoặc chuỗi frame.

### Extensibility
- **Plugin API**: đăng ký tool/panel/effect/exporter từ bên ngoài.
- **Effect SDK**: cho phép thêm shader effect qua registry.
- **Theming**: token màu/spacing cho UI; dark/light.
- **i18n**: tách chuỗi, hỗ trợ đa ngôn ngữ.

### Hoàn thiện library
- Public API rõ ràng (`<Editor/>`, hooks, event, imperative handle).
- Tài liệu API + ví dụ tích hợp.
- Đóng gói ESM + types; versioning theo semver.

## Việc kỹ thuật

- **CollabService**: binding model ↔ Yjs, đảm bảo command đi qua CRDT (không ghi trực tiếp state ngoài luồng).
- Tách rõ **ephemeral state** (cursor, selection) khỏi **document state** (được sync).
- Backend: API project/template/asset, presence server, storage.
- **Timeline engine**: tick loop, interpolation, render frame để export.
- **Plugin loader** + sandbox API surface ổn định.

## Deliverables

- 2+ người sửa cùng document, thấy cursor & thay đổi real-time.
- Cloud project + version history + share.
- Timeline animation + export GIF/MP4 ngắn.
- Plugin API + ít nhất 1 plugin mẫu (vd exporter hoặc effect).
- Docs public API + demo tích hợp.

## DoD

- 2 client sửa đồng thời 5 phút không mất/hỏng dữ liệu; offline rồi merge OK.
- Khôi phục version cũ chính xác.
- Third-party thêm được 1 effect qua plugin mà không sửa core.

## Rủi ro & lưu ý

- Collab yêu cầu **kỷ luật "mọi thay đổi qua command/CRDT"** — nếu Phase 1–4 lỏng lẻo sẽ rất khó sửa. Kiểm tra lại invariant này trước khi bắt đầu.
- Undo/redo trong môi trường multi-user phức tạp (undo cục bộ per-user) — cân nhắc Yjs UndoManager.
- Export video nặng CPU/GPU — chạy offscreen/worker, quản lý bộ nhớ.

## Ước lượng

~6–8 tuần (có thể tách collab / animation / plugin thành các đợt riêng).
