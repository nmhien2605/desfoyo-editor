# 01 — Tổng quan sản phẩm

## Mục tiêu

Xây dựng một **thư viện editor React** cho phép người dùng thiết kế đồ họa trên canvas (giống Canva) với **hệ thống text effects nâng cao** (giống Kittl): uốn cong chữ, warp, 3D extrude, gradient/texture fill, stroke nhiều lớp, glow/neon…

Sản phẩm được đóng gói dưới dạng **React component library** để có thể nhúng vào ứng dụng khác, đồng thời có một app demo/standalone.

## Định vị

- **Không chỉ là editor**: là một _engine + UI kit_ để dựng các công cụ thiết kế.
- **Điểm khác biệt cốt lõi**: chất lượng và độ phong phú của **text effects** (Phase 3), tận dụng WebGL/shader qua PixiJS — thứ mà các thư viện canvas 2D thông thường (Fabric/Konva) khó làm mượt.

## Đối tượng người dùng

| Nhóm                              | Nhu cầu                                                   |
| --------------------------------- | --------------------------------------------------------- |
| End-user (nhà thiết kế nghiệp dư) | Kéo-thả, dùng template, tạo poster/logo/social post nhanh |
| Developer (tích hợp)              | Nhúng editor vào SaaS của họ qua props/API                |
| Nội bộ                            | Tạo template, quản lý asset                               |

## Phạm vi (In scope)

- Canvas editor 2D với multi-page/artboard.
- Object: text, shape, image, SVG, group.
- Text effects nâng cao qua shader.
- Template system, asset library.
- Export PNG/JPG/SVG/PDF.
- Realtime collaboration (phase cuối).

## Ngoài phạm vi (Out of scope, giai đoạn đầu)

- Chỉnh sửa video / animation phức tạp (chỉ animation cơ bản ở Phase 5).
- AI generative (image/text) — có thể là extension sau.
- Print production chuyên nghiệp (CMYK color-managed) — chỉ hỗ trợ cơ bản.
- Mobile native app (chỉ web responsive).

## Tiêu chí thành công

- Render **60 FPS** với ~200 object trên canvas tầm trung.
- Áp một text effect preset trong **< 1 click**, cập nhật real-time khi kéo slider.
- Load & render một template phức tạp trong **< 2s**.
- Document schema ổn định, có versioning, không mất dữ liệu khi migrate.

## Rủi ro chính

- **Độ phức tạp WebGL/shader**: đường học dốc, cần prototype sớm ở Phase 1–3.
- **Quản lý text layout + effect**: đo glyph, text-on-path, warp cần opentype.js + custom geometry.
- **Hiệu năng khi nhiều filter xếp chồng**: cần cache render texture, giới hạn re-render.
- **Đồng bộ model ↔ renderer**: phải kỷ luật tách lớp ngay từ đầu.
