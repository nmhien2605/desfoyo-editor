# Phase 3 (mở rộng): Glyph-outline với opentype.js

> Mục tiêu: mở "gate" glyph-outline để đạt tính năng text-effect tiệm cận Kittl.
> Quyết định chiến lược: **thêm `opentype.js@2.0.0`** — đảo ngược một cách có chủ đích
> nguyên tắc "không parse glyph outline" đã theo suốt Phase 3 (xem `FontService`/`Warp`
> trong `CONTEXT.md`). Lý do: 3 tính năng "Cao" (per-letter, glyph-warp, export text-vector)
> đều bị chặn bởi cùng một quyết định đó — mở một lần, mở cả ba.

## 0. Bối cảnh kiến trúc hiện tại (đọc trước khi code)

Mọi hiệu ứng text hiện làm việc trên **output đã render** của `PIXI.Text`, không phải glyph outline:
- **Stroke/extrude** = stack các `Text` clone (`textRenderer.ts` `updateLayeredText`/`updateExtrudedText`).
- **Warp** = rasterize `PIXI.Text` → `Texture` → map lên `PIXI.Mesh` biến dạng theo vertex grid (`warpGeometry.ts`).
- **Export SVG** = rasterize text → `<image>` nhúng base64 (`svgSerializer.ts` `serializeNode`, case `'text'`).

Một text node render thành **1 trong 4 hình dạng Pixi loại trừ nhau**: `Text` (phẳng) / `Container`-`'stroke'` / `Container`-`'extrude'` / `Mesh` (warp). Ranh giới chuyển đổi do `needsTextRecreate()` (`textRenderer.ts:158`) làm single source of truth, `SceneReconciler.needsRecreate()` (`SceneReconciler.ts:53`) gọi nó để quyết định `update()` in-place hay destroy+recreate.

⚠️ **CONTEXT.md cảnh báo rõ**: bất kỳ tính năng mới nào tạo "đôi khi là một hình Pixi khác" **bắt buộc** thêm case riêng vào `needsTextRecreate`, nếu không tính năng mới sẽ *lặng lẽ no-op* thay vì báo lỗi. Mọi pass thêm render-shape bên dưới đều phải làm bước này.

**Hai việc tưởng là bài toán hình học khó nhưng thực ra PIXI v8 đã có sẵn** (xác nhận qua `GraphicsPath.d.ts` / `Graphics.d.ts` trong `node_modules`, không cần tự viết):
- **Tessellate bezier từ glyph outline**: `opentype.Path` sinh các lệnh `M/L/C/Q/Z` map thẳng 1:1 vào `GraphicsPath.moveTo/lineTo/bezierCurveTo/quadraticCurveTo/closePath` — Pixi tự tessellate lúc vẽ, **không cần viết bộ flatten bezier thủ công**.
- **Multi-layer stroke offset**: `Graphics.stroke({width, color})` (`Graphics.d.ts:406`) tự tính geometry offset ra ngoài path — layer thứ N chỉ là gọi `.stroke()` thêm lần nữa với `width` khác trên cùng path đã build, **không cần polygon-offset library**.

## 1. Ràng buộc pipeline font (chặn tất cả — làm trước tiên)

opentype.js parse cần **binary font thô** (`ArrayBuffer` của `.ttf`/`.otf`/`.woff`). Trạng thái hiện tại **không cung cấp được** cái đó:

| Nguồn font | Hiện có | Vấn đề với opentype.js |
|---|---|---|
| Default (Inter/Roboto/Playfair) | Load qua Google Fonts **CSS `<link>`** (`fontService.ts:12`) — chỉ có `FontFace`, không có ArrayBuffer | Google CSS trả `.woff2` → không dùng được cho opentype.js (xem quyết định WOFF2 bên dưới) |
| Upload người dùng | Lưu **data URI đầy đủ** trong `assets[]` (`{type:'font', family, dataUri}` — `document.ts:16`), nạp qua `FontFace` (`registerFont`) | *(đã xác nhận là fact, không phải gap)*: ArrayBuffer decode được thẳng từ `dataUri` đã có sẵn trong `assets` — **không cần thêm storage mới**, chỉ cần base64-decode on demand trong `getFont()` |

**Quyết định chiến lược (đã chốt sau grilling session):**

- **WOFF2: không hỗ trợ, không thêm decompressor.** opentype.js không tự giải nén WOFF2 (brotli, sẽ +1.3MB nếu vá vào core — xem [opentype.js#183](https://github.com/opentypejs/opentype.js/issues/183)). Đã cân nhắc thêm `wawoff2`/`woff2-encoder` (WASM decompressor) nhưng **quyết định bỏ** — mọi font WOFF2 (default hoặc upload) đi thẳng nhánh raster-fallback, không có ngoại lệ. Đây là điểm mù *có chủ đích*, không phải nợ kỹ thuật.
- **Default family (Inter/Roboto/Playfair): fetch `.ttf` thô lúc runtime**, không bundle vào repo.
  - Nguồn: **jsDelivr, pin theo một commit SHA cụ thể** của repo `google/fonts` (vd `cdn.jsdelivr.net/gh/google/fonts@<sha>/ofl/inter/Inter[...].ttf`) — URL bất biến, cache tối đa, không tự trôi theo `@main`. Đổi font default sau này = đổi SHA thủ công.
  - Fetch fail (mất mạng, CDN down, CORS) → **fallback im lặng** giống hệt "font không parse được", không có warning UI mới — nhất quán với convention hiện có của `loadDefaultFonts`/`registerFont` (không bao giờ block/crash vì lỗi font).
  - Cache: **chỉ in-memory**, không persist (IndexedDB/localStorage) — refetch mỗi session mới. Chấp nhận trade-off đơn giản hơn đổi lấy vài trăm KB fetch lại mỗi lần mở editor.
- opentype.js **chạy được trong Node** → khác `getRenderer()` (trả `undefined` trong test): các module outline **test được offline không cần Pixi** — đây là điểm cộng về testability so với warp hiện tại.

---

## Pass A — Foundation: pipeline binary + module glyph-outline

**Scope**
- `fontService.ts`: thêm `getFont(family): Promise<opentype.Font | undefined>` — cache `opentype.parse(arrayBuffer)` theo family, in-memory only. Nguồn ArrayBuffer: (a) `assets[].dataUri` upload, base64-decode on demand (không cần storage mới — đã có sẵn); (b) default family → fetch `.ttf` từ jsDelivr pinned-SHA (§1). WOFF2 (cả hai nguồn) hoặc parse lỗi → trả `undefined`, không throw — không thử decompress.
- **Script gate**: trước khi outline, check Unicode script range của `node.text`. opentype.js chỉ hỗ trợ `kern`/GPOS pair cơ bản + ligature `liga`/`rlig` — **không có shaping engine thật** (không contextual alternates, không complex script — xem [opentype.js#194](https://github.com/opentypejs/opentype.js/issues/194)). Text ngoài Latin cơ bản → `getFont`/`layoutText` trả `undefined`/báo not-outlinable, buộc raster fallback thay vì render sai hình glyph.
- `src/text/glyphOutline.ts` (thuần, không Pixi): `layoutText(node) → { glyphs: { path: opentype.Path, x, advance }[], bbox } | undefined`. Dùng advance width + kerning của opentype để đặt từng glyph. Tôn trọng `font.size/weight/style/letterSpacing/lineHeight/align`.
  - **Word-wrap**: `PIXI.Text` wrap dựa trên `TextMetrics.measureText` (Canvas 2D `measureText`, đo pixel thật của browser), khác nguồn với advance-width từ opentype (font design units). Hai nguồn đo **không thể khớp byte-identical** ở đúng biên ngắt dòng — chấp nhận làm giống thuật toán (greedy wrap) chứ không giống tuyệt đối phép đo; xem cơ chế bù ở Pass B.
  - **Cache**: memoize theo content-key, tái dùng đúng pattern key đã có ở `textRenderer.ts:171` (`text, font, align, letterSpacing, lineHeight, fill, stroke`) — không phát minh cơ chế cache mới. Tránh re-parse toàn bộ glyph path mỗi lần recreate (vd mỗi keystroke).
- Không đụng render/UI ở pass này.

**DoD / test**: unit test với 1 font `.ttf` bundle nhỏ trong repo — `layoutText("AV")` cho ra 2 glyph, x của glyph thứ 2 = advance glyph 1 (± kerning). Chạy trong vitest, không cần renderer. Thêm test script-gate: text chứa ký tự ngoài Latin cơ bản → trả `undefined`.

**Rủi ro kiến trúc**: thấp (module mới, thuần) — nhưng word-wrap reimplementation là phần tốn công nhất của pass này, không phải "chỉ thêm dependency" như ước lượng ban đầu.

---

## Pass B — Export text-as-vector SVG (ROI cao nhất, rủi ro thấp)

Tận dụng foundation ngay, không thêm render-shape trên canvas → **không đụng `needsTextRecreate`**.

**Scope**
- `svgSerializer.ts` case `'text'`: nếu `getFont(family)` có (không WOFF2, script hợp lệ, layout thành công) → emit `<path d="...">` từ `opentype.Path.toPathData()` (áp transform node), thay cho `<image>` raster hiện tại. Không outline được → **giữ nguyên fallback raster**.
- **Wrap correctness gate** (bù cho hai nguồn đo lệch nhau ở Pass A): tại thời điểm export, có sẵn Pixi context sống — so `layoutText` line/glyph count với `PIXI.TextMetrics.measureText` cho cùng node. Khớp → emit path. Lệch → coi như "không outline được", raster fallback cho node đó (không export glyph sai vị trí một cách âm thầm).
- Fill: solid/gradient tái dùng `<defs>` `serializeFill` đã có. Stroke layers → stack nhiều `<path>` (cùng trick clone hiện tại, nhưng là vector).
- `exportService.ts`/`RasterizedMap`: chỉ raster những text node không outline được (bao gồm cả node fail wrap-check).

**DoD / test**: export 1 doc text solid → SVG chứa `<path>` (không `<image>`); mở lại bằng import thấy đúng hình. Test wrap-mismatch → raster fallback (không throw, không path sai). Test serialize thuần (đã có `src/services/__tests__/`).

**Rủi ro**: thấp. Chỉ đổi nhánh export.

---

## Pass C — Render path outline trên canvas (thêm render-shape mới)

Đây là substrate cho per-letter + glyph-warp. **Đụng `needsTextRecreate`.**

**Scope**
- Render text bằng `PIXI.Graphics`, build path từ lệnh `opentype.Path` map thẳng vào `GraphicsPath.moveTo/lineTo/bezierCurveTo/quadraticCurveTo/closePath` (đã xác nhận §0 — Pixi tự tessellate, không cần flatten bezier thủ công) — cho các trường hợp *cần* outline thật (stroke offset chuẩn, sắp tới per-letter/warp). Text phẳng thường **vẫn giữ `PIXI.Text`** (không đổi perf case chung).
- Thêm hình dạng thứ 5 vào enum "4 shape": bổ sung case trong `needsTextRecreate()` + tag qua `WeakMap` như `containerKind` đang làm cho stroke/extrude. **Không bỏ qua bước này** (xem cảnh báo §0).
- Stroke đa lớp phiên bản outline: gọi `Graphics.stroke({width, color})` nhiều lần trên cùng path đã build (đã xác nhận §0 — Pixi tự tính offset geometry, không cần polygon-offset library) thay vì stack clone → hết nhòe ở stroke dày.

**DoD / test**: text có stroke dày render bằng outline sắc nét; toggle stroke on/off → recreate đúng (không no-op); undo/redo giữ đúng shape.

**Rủi ro**: **TB–cao** — đây là pass dễ vỡ nhất (ranh giới recreate). Làm sau khi B đã chứng minh foundation ổn.

---

## Pass D — Per-letter transform / randomize

**Scope**
- Schema: `TextNode.perLetter?: { rotate?, scale?, offsetY?, colorShift?, randomizeSeed? }` (khai báo type-only, rẻ — như các field warp/stroke đã làm).
- Mỗi glyph = 1 display object con, đặt theo advance width (Pass A đã cho), áp transform/màu riêng. Dựa trên render path Pass C.
- UI trong `PropertiesPanel.tsx` + `EffectsControls` pattern (dispatch `UpdateProps`, không Command mới).

**DoD / test**: `layoutText` + per-letter transform là hàm thuần → test offset/rotate từng glyph không cần Pixi.

**Rủi ro**: TB. Phụ thuộc Pass C.

---

## Pass E — Warp/envelope theo glyph (thay vì méo texture)

**Scope**
- Warp trên **vertex của outline đã tessellate** thay vì texture — chữ sắc nét trên cả đường cong gắt, hết mờ do rasterize.
- `warpGeometry.ts` hiện thao tác trên quad UV; mở rộng để nhận vertex từ tessellated glyph path. Cân nhắc **giữ song song**: texture-mesh cho real-time drag (rẻ), outline-warp cho zoom cao/export.
- Thêm các kiểu envelope Kittl còn thiếu (`arch/rise/fish/inflate`) — chỉ là thêm `Displacement` thuần vào `DISPLACEMENT`/`ROWS`.
- Nhớ: warp là render-shape thứ 6 → case `needsTextRecreate`.

**DoD / test**: `computeWarpGrid` kiểu mới vẫn là hàm thuần → test hình học không cần renderer (như test `warpGeometry` hiện có).

**Rủi ro**: cao. Làm cuối. Có thể dừng ở "song song" nếu texture-warp đã đủ đẹp cho canvas.

---

## Thứ tự & điểm dừng

```
A (foundation)  →  B (export vector)  →  C (render outline)  →  D (per-letter)  →  E (glyph-warp)
     chặn tất cả      ROI cao, rủi ro thấp     pass dễ vỡ nhất       phụ thuộc C        tùy chọn
```

- **A + B** là phần "chắc thắng": mở dependency + thắng ngay tính năng export vector, gần như không đụng render kiến trúc. Nên gộp làm mốc giao đầu tiên.
- **C** là bản lề rủi ro — chỉ vào sau khi A ổn định (foundation có test xanh).
- **D, E** tăng dần rủi ro; **E có thể dừng ở phương án "song song"** (giữ texture-warp real-time) nếu chi phí không đáng.

## Ghi chú dependency
- `opentype.js@2.0.0`, ~tương thích Node (test parse offline được) và browser.
- **Không** thay thế `FontFace`/`registerFont` hiện tại — opentype.js chạy *song song* để lấy outline; `PIXI.Text` vẫn cần `FontFace` để render text phẳng. Hai đường sống chung.
- **Không thêm dependency decompress WOFF2** (`wawoff2`/`woff2-encoder` đã cân nhắc và bỏ). WOFF2 — cả default lẫn upload — luôn đi raster fallback, có chủ đích, không phải nợ kỹ thuật.
- Không có dependency mới cho default font — fetch trực tiếp qua `fetch()` từ jsDelivr pinned-SHA, không cần SDK/client library.
- Không có dependency mới cho bezier tessellation hay stroke-offset — cả hai đã có sẵn trong PIXI v8 (`GraphicsPath`, `Graphics.stroke()`).

## Nợ/giới hạn đã chốt có chủ đích (không phải bug, không cần "fix" sau)
1. **WOFF2 → luôn raster.** Không decompressor. Ảnh hưởng: phần lớn font Google Fonts + phần lớn upload hiện đại sẽ không có vector export/outline — chấp nhận.
2. **Non-Latin/complex script → luôn raster.** opentype.js không có shaping engine thật; gate bằng Unicode script detection ở Pass A.
3. **Default-font fetch phụ thuộc jsDelivr uptime**, không cache bền (chỉ in-memory) — fetch lại mỗi session; lỗi mạng → raster fallback im lặng, không warning UI.
4. **Word-wrap giữa `layoutText` (opentype advance width) và `PIXI.Text` (Canvas 2D `measureText`) không thể khớp byte-identical** — bù bằng wrap-correctness gate ở Pass B (so line/glyph count, lệch → raster fallback cho node đó), không cố gắng làm hai phép đo trùng tuyệt đối.
