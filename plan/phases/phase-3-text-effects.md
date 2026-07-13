# Phase 3 — Text Effects (điểm khác biệt cốt lõi)

Đây là phần định vị sản phẩm (giống Kittl). Tận dụng PixiJS/WebGL + opentype.js để làm text effects mà canvas 2D thường không làm mượt được.

## Mục tiêu

- Quản lý font đầy đủ (Google Fonts + upload).
- Text styling nâng cao: stroke nhiều lớp, shadow, glow/neon.
- Biến dạng chữ: curved/arc, wave, bulge, perspective, **text-on-path**.
- 3D extrude, gradient/texture fill, image-in-text.
- Hệ thống **preset** áp 1 click + lưu preset tùy chỉnh.
- Cập nhật real-time khi kéo slider.

## Phạm vi chức năng

### Quản lý font
- **FontService**: load từ Google Fonts API, cache; upload font (.ttf/.otf/.woff2).
- Chọn family/weight/style/size, letter/line spacing, align, list.
- Đảm bảo font sẵn (FontFace API) trước khi đo glyph & render.

### Text engine (opentype.js)
- Parse font → glyph outline + metrics.
- Dựng path cho từng glyph; nối thành path cả dòng.
- Chiến lược lai: text phẳng đơn giản dùng `PIXI.Text`; text có warp/3D chuyển sang **mesh geometry**.

### Biến dạng (warp)
- **Arc / curved** (uốn theo cung), **wave**, **bulge**, **flag**, **perspective**.
- **Text-on-path**: đặt chữ chạy theo path tùy ý (đường do người dùng vẽ/ chọn).
- Tham số hóa `intensity`; preview real-time.

### Stroke & fill nâng cao
- **Stroke nhiều lớp** (mỗi lớp width + fill + offset riêng).
- Fill: solid / linear / radial / conic gradient.
- **Texture / image-in-text**: dùng chữ làm mask, sample texture trong shader.

### Effect pipeline (shader)
- **Shadow / inner-shadow**, **outer/inner glow**, **neon**.
- **Outline** (viền tách), **3D extrude** (sinh mesh nhiều lớp + shading).
- Chuỗi filter xếp chồng, uniforms lấy từ `node.props.effects`.
- **Cache RenderTexture** per-node; chỉ re-render khi param/nội dung đổi.

### Preset system
- Registry preset (JSON: fill + stroke + effects).
- Thư viện preset dựng sẵn (neon, retro, chrome, sticker, 3D…).
- Áp 1 click; **lưu preset của người dùng** từ cấu hình hiện tại.

## Việc kỹ thuật

- Module `text/`: opentype integration, layout engine, warp geometry, path sampling.
- Module `effects/`: shader (GLSL) cho gradient/texture/extrude/glow; effect registry.
- Cơ chế **render text thành geometry/mesh** khi cần deform, giữ cạnh sắc (SDF cân nhắc cho scale lớn).
- Tối ưu: debounce re-render, cache texture, giới hạn vùng cập nhật.
- UI: **EffectsPanel** (list effect, thêm/xóa/sắp xếp), sliders, preset gallery.

## Deliverables

- Text warp (arc, wave, bulge, perspective, on-path) hoạt động, preview real-time.
- Stroke nhiều lớp + gradient + texture fill.
- 3D extrude + glow/neon + shadow.
- ≥ 15 preset dựng sẵn + lưu preset tùy chỉnh.
- Storybook demo từng effect + test snapshot cho geometry warp.

## DoD

- Kéo slider "độ cong" cập nhật < 16ms/frame (không giật).
- Áp preset neon lên chữ bất kỳ → kết quả nhất quán, đúng preview.
- Text-on-path chạy đúng theo đường cong tùy ý.
- 3D extrude giữ 60 FPS với vài text object cùng lúc.

## Rủi ro & lưu ý

- Đây là phase **rủi ro kỹ thuật cao nhất** — nên prototype warp + 1 shader ngay từ Phase 1.
- Cân bằng chất lượng cạnh (anti-alias) vs hiệu năng khi warp/scale — cân nhắc SDF text.
- Nhiều filter xếp chồng dễ tụt FPS → kỷ luật cache + đo đạc liên tục.

## Ước lượng

~5–7 tuần (phase lớn nhất, có thể chia nhỏ: warp → stroke/fill → 3D/glow → preset).
