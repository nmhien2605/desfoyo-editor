# Desfoyo Editor — Kế hoạch dự án

Thư viện editor thiết kế đồ họa cho React (kiểu **Canva**) tích hợp **Text Effects** nâng cao (kiểu **Kittl**), render bằng **PixiJS (WebGL)**.

## Mục lục tài liệu

| File                                                                                   | Nội dung                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [01-overview.md](./01-overview.md)                                                     | Tổng quan sản phẩm, mục tiêu, phạm vi, đối tượng |
| [02-architecture.md](./02-architecture.md)                                             | Kiến trúc tổng thể, các layer, luồng dữ liệu     |
| [03-tech-stack.md](./03-tech-stack.md)                                                 | Công nghệ chi tiết cho từng phần                 |
| [04-data-model.md](./04-data-model.md)                                                 | Schema JSON của document/scene, các node type    |
| [phases/phase-1-core-canvas.md](./phases/phase-1-core-canvas.md)                       | Nền tảng canvas & object cơ bản                  |
| [phases/phase-2-editing-essentials.md](./phases/phase-2-editing-essentials.md)         | History, snapping, group, zoom/pan               |
| [phases/phase-3-text-effects.md](./phases/phase-3-text-effects.md)                     | Text effects nâng cao (điểm khác biệt cốt lõi)   |
| [phases/phase-4-templates-assets.md](./phases/phase-4-templates-assets.md)             | Template, asset, multi-page, import/export       |
| [phases/phase-5-advanced-collaboration.md](./phases/phase-5-advanced-collaboration.md) | Realtime collab, cloud, animation, plugin API    |

## Lộ trình 5 phase (tóm tắt)

1. **Core Canvas** — Dựng engine PixiJS, render/chọn/transform object, layers, export ảnh.
2. **Editing Essentials** — Undo/redo, snapping, group, zoom/pan, shortcuts, fill/gradient.
3. **Text Effects** — Font, stroke/shadow/glow, curved/warp, 3D, gradient/texture, presets.
4. **Templates & Assets** — Thư viện template, upload asset, SVG, multi-page, export SVG/PDF.
5. **Advanced & Collaboration** — Realtime multi-user, cloud save, animation, plugin API.

## Nguyên tắc kiến trúc xuyên suốt

- **Tách model khỏi renderer**: document là JSON thuần; PixiJS chỉ là lớp trình bày. Giúp export nhiều định dạng, làm collaboration và undo/redo dễ dàng.
- **Headless core**: logic editor không phụ thuộc UI React, có thể test độc lập.
- **Effect pipeline dựa trên shader**: mọi text/image effect là filter WebGL có thể xếp chồng.
- **Type-safe**: toàn bộ TypeScript, schema có versioning để migrate.
