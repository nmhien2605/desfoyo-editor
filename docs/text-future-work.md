# Text — hướng mở rộng về sau

Ghi lại những thứ **cố tình chưa làm** ở đợt text foundation + Wave, kèm lý do hoãn và cách làm khi cần đến. Xem spec gốc: [2026-08-16-text-foundation-wave-design.md](./superpowers/specs/2026-08-16-text-foundation-wave-design.md).

Mỗi mục ghi rõ: **khi nào cần** — dấu hiệu để biết đã đến lúc làm, và **chạm vào đâu** — phạm vi thay đổi ước lượng.

---

## 1. Đổi opentype.js → harfbuzzjs

**Vì sao hoãn.** opentype.js 2.0 chỉ shaping cơ bản (`liga`, `rlig`, kern — `kern` được `getGlyphOutlines()` áp dụng qua `font.getKerningValue()` khi cộng advance giữa các glyph liền kề). Đủ cho font Latin/display — 90% use case poster/logo.

**Khi nào cần.**
- Hỗ trợ font script/handwritten có swash, alternates, stylistic set (`salt`, `ss01..ss20`) — đúng loại font mà Kittl sống bằng nó.
- Hỗ trợ tiếng Ả Rập, Ấn Độ, Thái — những ngôn ngữ mà thứ tự glyph khác thứ tự ký tự.
- User báo một font cụ thể hiện sai chữ ghép.

**Chạm vào đâu.** Chỉ `src/text/glyphOutlines.ts`. Interface `getGlyphOutlines(text, font, size) → GlyphOutline[]` (mỗi phần tử `{ advance, shapes: GlyphShape[] }`, không phải `contours` phẳng — xem §5.1 của spec cho lý do) được thiết kế đúng để cô lập chuyện này. Phần khó không phải outline mà là **init bất đồng bộ của WASM** — `fontService` sẽ phải `await` module wasm trước khi parse font đầu tiên, và test sẽ cần setup async.

**So sánh các lựa chọn đã cân nhắc.**

| Lib | Shaping | Outline | Size | Tình trạng (08/2026) |
|---|---|---|---|---|
| opentype.js 2.0 | cơ bản | có, API đơn giản | ~180KB | v2.0, cập nhật 05/2026 |
| fontkit 2.x | đầy đủ GSUB/GPOS, variable font | có | ~400KB | không release mới từ 08/2024 |
| harfbuzzjs (WASM) | chuẩn công nghiệp | có (`hb-draw`) | ~300KB wasm | rất active |
| Typr.ts | có, nhanh nhất (Photopea dùng) | có | ~60KB | bỏ bê từ 2022 |

Nếu chỉ thiếu variable font mà không thiếu shaping thì **fontkit** là bước nhảy nhỏ hơn harfbuzz (thuần JS, không cần wasm).

---

## 2. Auto-wrap theo chiều rộng

**Vì sao hoãn.** v1 chỉ ngắt dòng ở `\n`. Wave không cần wrap, và không có wrap thì cũng chưa cần resize.

**Khi nào cần.** Ngay khi muốn mở khoá resize cho text node (xem mục 3), hoặc khi làm template có khối text dài.

**Chạm vào đâu.** `src/text/layout.ts` — thuật toán greedy word-wrap khoảng 15-20 dòng: tích luỹ advance đến khi vượt `node.size.width` thì ngắt ở khoảng trắng gần nhất. Vấn đề thật sự không nằm ở thuật toán mà ở chỗ nó **kéo theo mục 3**: có wrap thì `node.size.width` trở thành input của layout thay vì output, đảo chiều quan hệ giữa size và nội dung.

Ngắt dòng tiếng Việt: cẩn thận với dấu tổ hợp (combining diacritics) — không được ngắt giữa ký tự cơ sở và dấu.

**Liên quan — `align` hiện là no-op hình ảnh cho text một dòng.** `node.size.width` luôn đúng bằng chiều rộng thật của chữ (xem bất biến "size derived from content"), nên `center`/`right` không có khoảng trống (`slack`) nào để dịch vào — `layout.ts` tính đúng `slack = 0` và không có gì thay đổi trên màn hình. Đây là hành vi đúng, không phải bug; nó chỉ trở nên có ý nghĩa khi có text box chiều rộng cố định hoặc auto-wrap nhiều dòng (mục này), lúc đó `node.size.width` mới có thể lớn hơn chiều rộng một dòng chữ.

---

## 3. Resize text node

**Vì sao hoãn.** v1 khoá resize (spec §5, quyết định #5). Text tự co theo nội dung: `node.size` là **output** của layout, nên 8 handle resize hiện có không có gì hợp lý để làm với nó.

**Khi nào cần.** Khi UX bắt đầu thấy vô lý — user chọn text node rồi thắc mắc sao không kéo được góc.

**Hai hướng, chọn một.**
- **Scale font** — kéo góc thì `font.size` đổi theo tỉ lệ, giữ nguyên tương quan. Giống Canva/Kittl. Không cần auto-wrap. Rẻ hơn: khoảng 5-10 dòng trong nhánh resize của `SelectionOverlay.tsx`.
- **Text box thật** — kéo cạnh thì đổi chiều rộng box và chữ wrap lại. Đúng kiểu Figma. Bắt buộc phải có mục 2 trước, và phải phân biệt "auto-size" với "fixed-size" như Figma làm.

Kéo góc = scale font, kéo cạnh = đổi chiều rộng box là cách hai hướng cùng tồn tại được, nhưng chỉ nên làm khi đã có mục 2.

---

## 4. Envelope warp (bóp/giãn cả khối chữ)

**Vì sao hoãn.** v1 làm baseline follow: chữ bám đường cong, chiều cao giữ nguyên. Đúng với tài liệu Wave (1 path, 3 anchor, 4 handle).

**Khi nào cần.** Arch và Flag nhìn "đã mắt" hơn hẳn khi chữ bị bóp theo vòm thay vì chỉ trượt theo baseline. Distort và Custom mesh thì **bắt buộc** phải có envelope.

**Chạm vào đâu.** Schema đã chừa sẵn: `WarpPath.role` là `'baseline' | 'top' | 'bottom'` và `paths` là mảng — thêm hai path `top`/`bottom` là đủ, **không phải migration**. Phần code mới nằm trong `src/text/warp.ts`: thay vì `p' = C(s) + N × (p.y − b)`, dùng nội suy giữa hai đường:

```
t  = (p.y − topY) / (bottomY − topY)      // vị trí tương đối theo chiều dọc, 0..1
p' = lerp(Ctop(s), Cbottom(s), t)
```

UI cũng phải đổi: 2 đường cong nghĩa là gấp đôi số anchor/handle trên canvas, cần nghĩ lại cách hiển thị cho khỏi rối.

---

## 5. 7 transformation còn lại

Đều dùng lại `WarpPath` + `applyWarp` đã có. Ước lượng độ khó tăng dần:

| Effect | Cách làm | Ghi chú |
|---|---|---|
| **Angle** | path 2 anchor, không handle | Dễ nhất — đường thẳng nghiêng |
| **Rise** | path 2 anchor + handle, cong 1 phía | Baseline follow là đủ |
| **Arch** | path 2 anchor, cung đơn | Đẹp hơn nhiều nếu có envelope (mục 4) |
| **Flag** | như Wave nhưng biên độ tăng dần theo x | Baseline follow là đủ |
| **Circle** | `closed: true`, path tròn | Cần xử lý riêng: chữ chạy hết vòng, có toggle "Direction Inverted" theo [text-effect.md](./text-effect.md) |
| **Distort** | khung bao 4 góc kéo tự do | Bắt buộc có envelope |
| **Custom** | lưới mesh N×M kéo từng điểm | Bắt buộc có envelope + UI lưới |

Panel đã dựng sẵn lưới 8 nút, bật thêm nút nào thì chỉ cần viết hàm sinh path tương ứng trong `warp.ts`.

---

## 6. Shadow (FR-04)

4 kiểu: drop, line, block, 3D. Điểm quan trọng đã ghi trong spec §3: **chỉ `drop` là filter**, ba kiểu còn lại là hình học.

| Kiểu | Cách làm |
|---|---|
| drop | `DropShadowFilter` của pixi-filters — đã có sẵn trong `buildFilters.ts` |
| line | vẽ lại `Contour[]` lệch theo `angle`/`distance`, chỉ stroke, không fill |
| block | vẽ `Contour[]` lệch đi rồi fill đặc, đặt dưới lớp chữ chính |
| 3D | vẽ `Contour[]` lệch dần N bước (`steps`) để tạo khối đùn |

Schema đã phác trong spec §4.3. `distance` chuẩn hoá theo `font.size` để bóng tự co giãn theo cỡ chữ.

Ba kiểu hình học đều đọc `Contour[]` **sau warp**, nên bóng tự động cong theo chữ — đó chính là lợi ích của việc gom mọi thứ về một pipeline hình học.

---

## 7. Decoration (FR-05)

strokes, cuts, lines, textures. Cũng đọc `Contour[]` sau warp.

- **stroke** — nhiều lớp viền, đã có tiền lệ ở `Stroke.layers` của `ShapeNode`, tái dùng được kiểu dữ liệu.
- **cut** — cắt khối chữ bằng một hình khác. Cần boolean operation trên polygon: một thư viện như `polygon-clipping`, hoặc làm bằng mask ở tầng Pixi cho rẻ.
- **line** — kẻ đường ngang qua chữ (kiểu editorial). Rẻ: vẽ đường rồi mask bằng chữ.
- **texture** — dùng chữ làm mask sample texture trong shader, đúng như [03-tech-stack.md](./03-tech-stack.md) mô tả.

Yêu cầu bật/tắt độc lập từng lớp mà không ảnh hưởng layout ⇒ mỗi decoration là một phần tử trong `effects[]`, có cờ bật/tắt riêng, không đụng vào bước layout.

---

## 8. Hiệu năng

**Chưa tối ưu gì cả, có chủ ý.** Hiện mỗi lần kéo slider là tính lại toàn bộ layout + warp + vẽ. Với ~20 glyph × ~200 điểm thì hoàn toàn ổn.

**Khi nào cần lo.** Đo trước rồi mới sửa. Dấu hiệu: kéo slider bị khựng, hoặc canvas có nhiều text node warp cùng lúc.

**Thứ tự nên làm khi tới lúc đó.**
1. Cache `getGlyphOutlines` theo `(family, size, char)` — outline không đổi khi warp, chỉ warp mới đổi. Rẻ nhất, hiệu quả nhất.
2. Cache kết quả layout, chỉ tính lại khi `text`/`font`/`spacing` đổi.
3. RenderTexture cho node có nhiều filter xếp chồng (đã ghi trong [02-architecture.md](./02-architecture.md)).

---

## 9. Font

- **Google Fonts (FR-01).** Chỉ là đổi nguồn fetch trong `fontService`: `fonts.gstatic.com` trả `.ttf` với CORS mở. Cần thêm danh sách font (API key hoặc hardcode) + trạng thái loading trên UI.
- **Upload font của user (FR-02).** Lưu vào `assets` dưới dạng base64 giống ảnh, đi qua `assetResolver` sẵn có. Document tự chứa, không cần backend.
- **Subsetting.** Chỉ cần khi nhúng font vào file export và dung lượng thành vấn đề. fontkit làm được việc này.

---

## 10. Sửa chữ trực tiếp trên canvas

v1 dùng overlay `<textarea>` — trình duyệt lo caret và IME tiếng Việt, đổi lại là **khi chữ đang warp thì textarea hiện chữ thẳng**, không khớp hình dạng cong.

**Khi nào cần thay.** Khi user thấy khó chịu vì lúc sửa thì chữ nhảy về thẳng.

**Chạm vào đâu.** Phải tự vẽ caret + vùng bôi đen trên canvas, tự xử lý phím mũi tên, Home/End, shift-select, và **IME tiếng Việt** — phần này mới là phần khó thật sự, không phải caret. Đây là một module riêng, cỡ ngang toàn bộ phần warp cộng lại. Cân nhắc kỹ giá trị đổi lại trước khi làm.

---

## 11. Export

- **SVG.** v1 đã ra `<path>` vector thật vì đã có contour sẵn. Một hướng khác đẹp hơn cho file nhẹ và text còn chọn/copy được: dùng `<textPath>` native của SVG — nhưng chỉ áp dụng được cho baseline follow, không dùng được khi có envelope.
- **PDF.** `pdf-lib` theo [03-tech-stack.md](./03-tech-stack.md). Contour vector map thẳng sang path của PDF được.
- **"Effect vẫn editable sau export" (FR-04).** Chỉ đúng với format `.json` của chính document. PNG/SVG/PDF thì hiệu ứng đã bị bake. Nếu muốn đúng chữ trong FR-04 thì phải nhúng model JSON vào metadata của file export — chưa nghĩ tới.

## Trần của warp geometry (2026-08-16)

- Offset curve của dòng thứ 2 trở đi tự cắt khi bán kính cong của path nhỏ
  hơn khoảng cách dòng. Cố hữu của mô hình text-on-path; Illustrator cũng vậy.
- Pixi tessellate bezier theo `smoothness` mặc định, không theo camera zoom.
  Zoom rất sâu có thể thấy cạnh gãy. Nâng cấp: truyền `smoothness` theo zoom
  và vẽ lại khi zoom đổi.
- `containsPoint` trong `glyphOutlines.ts` ray-cast trên các điểm on-curve,
  bỏ qua phần phình của cung. Chính xác hẳn thì phải đếm giao điểm tia với
  từng cubic (giải phương trình bậc 3).
- `solveHorizontalScale` chỉ co theo trục x. Nếu có preset với biên độ dọc
  lớn tới mức `L(0.05) > W`, glyph cuối sẽ bị bỏ. Cần kẹp `intensity` hoặc
  đổi sang co đều hai trục.
- Envelope warp (hành vi per-point cũ) vẫn là mode tương lai — schema `Warp`
  đã chừa chỗ.
