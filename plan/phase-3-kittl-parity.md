# Text Effects: Desfoyo vs Kittl — So sánh & Lộ trình

> Khôi phục từ transcript sau khi mất do `/clear`. Bản gốc trả lời câu hỏi:
> "so sánh tính năng và lộ trình phát triển chi tiết cho phần text effect để đạt tính năng tiệm cận với Kittl".
> Xem thêm [phases/phase-3-glyph-outline-opentype.md](./phases/phase-3-glyph-outline-opentype.md) — chi tiết hóa Pass 3G bên dưới.

## 1. Trạng thái hiện tại của Desfoyo

Nền tảng: **PixiJS v8 / WebGL**, **không dùng opentype.js** ở bất kỳ đâu — mọi hiệu ứng text đều làm việc trên *output đã render* của `PIXI.Text` (rasterize → texture / stack clone), không phải trên glyph outline. Đây là ràng buộc kiến trúc chi phối toàn bộ roadmap bên dưới.

Đã có:
- **Effects**: `shadow`, `inner-shadow` (GLSL tự viết, blur 5-tap xấp xỉ), `glow`, `outline`, `blur`, `extrude3d` (stack ≤40 clone phẳng tô tối dần), `custom` (registry cố định, hiện chỉ `chromatic-aberration`).
- **Fill**: solid / linear-gradient / radial-gradient / texture (schema đủ 4 loại).
- **Stroke đa lớp**: N đường outline đồng tâm/offset.
- **Warp**: `arc/wave/bulge/flag/perspective/path` — biến dạng texture, không theo glyph.
- **Presets**: 5 built-in (neon/chrome/sticker/retro/3d), không lưu custom preset.
- **Font upload** thật (`.ttf/.otf/.woff2`).

## 2. Bảng so sánh tính năng

| Nhóm | Kittl | Desfoyo | Khoảng cách |
|---|---|---|---|
| **Fill** – Solid / Linear-Radial gradient | ✅ | ✅ | — |
| Conic gradient | ✅ | ❌ | Thiếu type trong `FillSchema` |
| Texture/pattern fill trên text | ✅ | 🟡 schema có, cần xác nhận wiring | Thấp–TB |
| Gradient map / material (metallic, foil, holo) | ✅ | ❌ | Cao |
| **Stroke** – Đơn / multi-layer | ✅ | ✅ | — |
| Join/cap/dash control | ✅ | 🟡 một phần | Thấp |
| **Shadow** – Drop / Inner | ✅ | ✅ (inner xấp xỉ) | Chất lượng blur |
| Long shadow | ✅ | 🟡 gần được qua extrude3d | Thấp |
| Reflection | ✅ | ❌ | TB |
| **Glow/Neon** | ✅ | ✅ | — |
| **3D Extrude** | ✅ | 🟡 stack clone phẳng | — |
| Perspective thật + lighting + material per-face + bevel | ✅ | ❌ | **Cao** |
| **Warp/Distort** – arc/wave/bulge/flag/perspective | ✅ | ✅ | — |
| Text-on-path editable | ✅ | ✅ (3 handle, no pen) | Thấp |
| Envelope mở rộng (arch/rise/fish/inflate/squeeze) | ✅ | ❌ | TB |
| Warp theo glyph (không méo texture) | ✅ | ❌ | Cao (cần opentype.js) |
| **Per-letter** transform/color/randomize | ✅ | ❌ | Cao |
| **Background** box/highlight sau chữ | ✅ | ❌ | TB |
| **Presets** thư viện lớn + lưu custom | ✅ | 🟡 5, no save | TB |
| **Export** text-as-vector (glyph outline) trong SVG | ✅ | ❌ rasterize | Cao (opentype.js) |

## 3. Ba rào cản kiến trúc quyết định độ khó

1. **Không parse glyph outline** — chặn cả per-letter, envelope chất lượng cao, và export text vector cùng lúc. Mở bằng `opentype.js`/`fontkit` là "gate" lớn nhất.
2. **3D là clone phẳng**, không normal/perspective/lighting — cần render path GLSL riêng.
3. **Custom shader = registry cố định**, không nhận GLSL người dùng tự do.

## 4. Lộ trình đề xuất

**Pass 3E — Quick wins, không cần opentype.js** *(~1 tuần)*: conic gradient, texture fill cho text, background/highlight, reflection, lưu custom preset, mở rộng warp (arch/rise/fish/inflate). → parity ~60%→~75%, không đụng kiến trúc.

**Pass 3F — 3D thật qua GLSL** *(2–3 tuần)*: perspective + lighting + bevel + material per-face.

**Pass 3G — Mở gate glyph outline (opentype.js)** *(3–4 tuần, quyết định chiến lược)*: mở đồng thời per-letter, envelope-theo-glyph, export text-as-vector SVG. Chi tiết Pass A→E ở [phases/phase-3-glyph-outline-opentype.md](./phases/phase-3-glyph-outline-opentype.md).

**Pass 3H — Material & preset library** *(1–2 tuần)*: metallic/foil/holo, mở rộng preset 5→20+.

## 5. Khuyến nghị

Làm Pass 3E trước (ROI cao nhất, zero rủi ro kiến trúc), rồi quyết định sớm về opentype.js (Pass 3G) vì nó chặn 3 tính năng "Cao". 3D thật (3F) tạo khác biệt thị giác rõ nhất nếu muốn "giống Kittl" nhanh.

*Cần verify khi bắt tay Pass 3E: texture-fill cho text đã wire trong `textRenderer.ts` chưa — bảng đang để 🟡.*
