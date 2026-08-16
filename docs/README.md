# Desfoyo Editor — Kế hoạch dự án

Thư viện editor thiết kế đồ họa cho React (kiểu **Canva**) tích hợp **Text Effects** nâng cao (kiểu **Kittl**), render bằng **PixiJS (WebGL)**.

## Mục lục tài liệu

| File                                                                                   | Nội dung                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [01-overview.md](./01-overview.md)                                                     | Tổng quan sản phẩm, mục tiêu, phạm vi, đối tượng |
| [02-architecture.md](./02-architecture.md)                                             | Kiến trúc tổng thể, các layer, luồng dữ liệu     |
| [03-tech-stack.md](./03-tech-stack.md)                                                 | Công nghệ chi tiết cho từng phần                 |
| [04-data-model.md](./04-data-model.md)                                                 | Schema JSON của document/scene, các node type    |

## Nguyên tắc kiến trúc xuyên suốt

- **Tách model khỏi renderer**: document là JSON thuần; PixiJS chỉ là lớp trình bày. Giúp export nhiều định dạng, làm collaboration và undo/redo dễ dàng.
- **Headless core**: logic editor không phụ thuộc UI React, có thể test độc lập.
- **Effect pipeline dựa trên shader**: mọi text/image effect là filter WebGL có thể xếp chồng.
- **Type-safe**: toàn bộ TypeScript, schema có versioning để migrate.
