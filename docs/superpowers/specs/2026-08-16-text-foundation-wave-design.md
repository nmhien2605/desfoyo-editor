# Spec — Text Foundation + Wave Transformation

**Ngày:** 2026-08-16
**Phạm vi:** dựng nền tảng text cho editor (node, engine, render, UI) và build **duy nhất một** transformation là **Wave** theo [wave-transformation.md](../../wave-transformation.md).
**Không thuộc phạm vi build đợt này:** 7 transformation còn lại, shadow, decoration — chỉ thiết kế chỗ đứng cho chúng, không viết code.

---

## 1. Bối cảnh

Core đã xong: store/command/history, `SceneReconciler` (diff theo `nodeId`), renderer adapter cho `shape`/`image`/`svg`/`group`, effect pipeline (`buildFilters`), selection overlay + handle drag, snapping, export PNG/SVG.

Phần text thì **chưa có gì**: không có `TextNode` trong `src/schema/node.ts`, không có `textRenderer`, không có `src/text/`, `opentype.js` chưa cài. Đợt này dựng từ đầu.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | **opentype.js 2.0**, bọc sau interface `getGlyphOutlines()` | Một dependency, API ngắn, đủ cho font Latin/display. Đổi sang harfbuzzjs sau chỉ sửa 1 file. |
| 2 | Sửa chữ bằng **overlay `<textarea>` trong suốt** | Trình duyệt lo caret + IME tiếng Việt. Đánh đổi: khi chữ đang warp, textarea hiện chữ thẳng. |
| 3 | **Bundle 2-3 file `.ttf` trong repo** | opentype.js cần file font thật; font hệ thống không đọc được binary từ trình duyệt. Chạy offline, test không cần network. |
| 4 | **Baseline follow**, schema chừa chỗ cho envelope | Đúng mô tả tài liệu (1 path, 3 anchor, 4 handle). Tái dùng ngay được cho Arch/Rise/Circle/Angle. |
| 5 | **Khoá resize** cho text node ở v1 | Text tự co theo nội dung; resize cần auto-wrap hoặc scale font — cả hai đều chưa cần cho Wave. |

## 3. Kiến trúc: một pipeline hình học duy nhất

Transformation, shadow và decoration đều cần cùng một thứ: **danh sách đường viền chữ sau khi đã bẻ cong**.

```
TextNode ──► font ──► layout ──► warp ──► Contour[]
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
              shadow layers           fill chính            decoration layers
         (vẽ Contour[] lệch đi)   (vẽ Contour[])      (stroke/cut/line/texture)
          drop · line · block · 3d                        trên cùng Contour[]
```

Nên **foundation chính là hàm thuần `textGeometry(node, font) → GlyphShape[]`**. Transformation là bước cuối bên trong hàm đó; shadow và decoration là các lớp vẽ đọc kết quả của nó. (`GlyphShape` = `{ outer, holes }` — xem §5.1 để biết vì sao không phải là `Contour[]` phẳng.)

Hệ quả: **shadow kiểu line/block/3D không thuộc `buildFilters.ts`**. Chúng là hình học — vẽ lại contour lệch đi nhiều lớp — không phải WebGL filter. Chỉ `drop shadow` mới map được vào `DropShadowFilter` sẵn có. Đây là điểm khác so với cách `effects[]` đang phục vụ shape/image.

## 4. Schema

### 4.1 TextNode

Thêm vào `src/schema/node.ts`, nối vào `NodeSchema` discriminated union:

```ts
TextNode = BaseNode & {
  type: 'text';
  text: string;
  font: { family: string; weight: number; style: 'normal' | 'italic'; size: number };
  align: 'left' | 'center' | 'right';
  letterSpacing: number;   // px
  lineHeight: number;      // bội số của font.size
  fill: Fill;              // tái dùng FillSchema có sẵn
  warp?: Warp;
}
```

Khác với [04-data-model.md](../../04-data-model.md): bỏ `'justify'` khỏi `align` (cần auto-wrap, chưa có), và `warp` mở rộng từ `{ type, intensity, pathId }` thành cấu trúc dưới đây.

### 4.2 Warp

```ts
Warp = {
  type: 'none' | 'wave' | 'arch' | 'rise' | 'flag' | 'circle' | 'angle' | 'distort' | 'custom';
  intensity: number;       // 0..1, tương ứng slider 0-100% trên UI
  paths?: WarpPath[];      // vắng = sinh từ type + intensity; có = user đã kéo handle
}

WarpPath = {
  role: 'baseline' | 'top' | 'bottom';   // v1 chỉ dùng 'baseline'
  closed: boolean;                        // cho Circle sau này
  anchors: Array<{
    x: number; y: number;                 // 0..1 trong bbox của node
    in?:  { x: number; y: number };       // handle, cũng chuẩn hoá 0..1, toạ độ tuyệt đối (không phải delta)
    out?: { x: number; y: number };
  }>;
}
```

Ba điểm thiết kế:

- **`paths` vắng mặt = trạng thái preset.** Renderer sinh path từ `type` + `intensity`. Ngay khi user kéo một handle, path sinh ra được ghi vào `paths` và từ đó `paths` là nguồn sự thật. Reset xoá `paths`, quay lại preset. Nhờ vậy slider và handle không tranh nhau một nguồn dữ liệu.
- **`role` trên mảng `paths` là chỗ chừa cho envelope.** Thêm `top` + `bottom` sau này là đủ, không phải migration schema.
- **Toạ độ chuẩn hoá 0..1 theo bbox node**, đúng quy ước `ImageNode.crop` đang dùng — path không phải tính lại khi node đổi kích thước.

### 4.3 Effect mở rộng (thiết kế, chưa code đợt này)

```ts
| { type: 'text-shadow'; style: 'drop' | 'line' | 'block' | '3d';
    angle: number; distance: number; color: string; blur?: number; steps?: number }
| { type: 'decoration'; kind: 'stroke' | 'cut' | 'line' | 'texture'; /* ... */ }
```

`distance` chuẩn hoá theo `font.size` để bóng tự co giãn theo cỡ chữ (FR-04 trong [kittl.md](../../kittl.md)).

## 5. Module

5 file mới trong `src/text/`. Không file nào đụng Pixi hay React, nên test bằng vitest không cần canvas. Bốn file dưới là hàm thuần; riêng `fontService.ts` có state (cache) và chạm DOM qua `FontFace` — test của nó chạy trong jsdom (đã có sẵn trong devDependencies):

| File | Việc | Phụ thuộc |
|---|---|---|
| `fontService.ts` | family → ArrayBuffer → `opentype.Font`, cache; đăng ký `FontFace` cho textarea overlay | opentype.js |
| `glyphOutlines.ts` | **seam duy nhất chạm opentype.js**: `getGlyphOutlines(text, font, size) → GlyphOutline[]`, mỗi phần tử `{ advance, shapes: GlyphShape[] }`. Bezier được flatten thành polyline tại đây; cũng là nơi cộng kerning (`font.getKerningValue`) vào `advance` | opentype.js |
| `layout.ts` | ngắt dòng theo `\n`, align, letterSpacing, lineHeight, đo bbox → glyph đã định vị + `baselineY` | glyphOutlines |
| `warp.ts` | kiểu `WarpPath`, đánh giá bezier + bảng arc-length, preset sinh path theo `type`+`intensity`, `applyWarp()` | — |
| `textGeometry.ts` | keo dán: `textGeometry(node, font) → TextGeometry` (`{ shapes: GlyphShape[], width, height, baselineY }`) | 3 file trên |

Hai lựa chọn kỹ thuật đáng ghi lại:

- **Đổi lib font sau này chỉ sửa `glyphOutlines.ts`.** Mọi thứ phía sau chỉ thấy `Contour[]` = `number[]` toạ độ phẳng.
- **Flatten bezier trước rồi mới warp.** Map điểm điều khiển bezier qua một phép biến đổi phi tuyến cho kết quả sai; flatten rồi map từng điểm thì đúng, và code ngắn hơn. Sai số flatten đặt ở mức 0.15px tại cỡ chữ gốc.

### 5.1 Render / UI

- **`src/render/renderers/textRenderer.ts`** — cùng pattern `shapeRenderer.ts`: `create` / `update` + `applyTransform`.

  **Lỗ trong chữ (`o`, `a`, `8`) phải xử lý tường minh.** Đã kiểm tra source Pixi v8 (`GraphicsContext.cut()` và `buildContextBatches.js`): Pixi **không** áp dụng quy tắc winding non-zero cho nhiều `poly()` trong cùng một `fill()` — mỗi polygon được tam giác hoá riêng, nên ruột chữ `o` sẽ bị tô đặc. Cách duy nhất tạo lỗ là `cut()`, và nó gắn lỗ vào **shape cuối cùng** của lệnh `fill`/`stroke` ngay trước đó.

  Nên dữ liệu hình học không phải là `Contour[]` phẳng mà là **`GlyphShape[]`**, mỗi shape gồm `{ outer, holes }`. Renderer vẽ theo từng shape: `poly(outer).fill(style)` rồi mỗi `poly(hole).cut()`.

  Phân loại outer/hole làm trong `glyphOutlines.ts`, **trước** khi warp (rẻ hơn và an toàn hơn, warp không đổi quan hệ bao nhau): lấy contour có `|diện tích có dấu|` lớn nhất trong glyph làm mốc — cùng dấu với nó là outer, ngược dấu là hole. Cách này đúng cho cả TrueType (outer CW) lẫn CFF/OTF (outer CCW) mà không cần biết font thuộc loại nào. Glyph nhiều outer (`%`, `i`) thì gán mỗi hole cho outer chứa nó bằng point-in-polygon, mặc định về outer đầu tiên.
- **`src/ui/TextEditOverlay.tsx`** — double-click node text → `<textarea>` định vị bằng `viewport.toScreen`, style theo `font`/`fill` của node, dùng `FontFace` do `fontService` đăng ký. Blur hoặc Escape → `dispatch(UpdateProps)`. Trong lúc sửa, node trên canvas **không** ẩn đi — chỉ handle resize/rotate ẩn (xem dòng dưới); `<textarea>` phủ lên bằng nền bán trong suốt (`bg-white/90`) để không chồng hình rối mắt, thay vì phải đồng bộ ẩn/hiện với vòng render Pixi.
- **`src/ui/WarpHandlesOverlay.tsx`** — SVG overlay vẽ path xanh + 3 anchor + 4 handle + đoạn nối anchor–handle, kéo được. Dùng lại nguyên `viewport.toScreen/toWorld` và `beginGesture/endGesture` mà `ImageCropHandles` trong `SelectionOverlay.tsx` đang dùng (coalesce history khi kéo liên tục).
- **Sửa nhẹ:** `SceneReconciler.ts` (thêm case `'text'`), `svgSerializer.ts` (text → `<path>` vector thật, vì đã có contour), `PropertiesPanel.tsx` (khối text + khối Transformation), `Toolbar.tsx` (nút thêm text + `defaultTextNode`, đặt cạnh `defaultImageNode`/`defaultSvgNode` đang nằm sẵn ở đó — `core/actions.ts` chỉ chứa hành động gộp nhiều dispatch, không phải factory node).
- **`SelectionOverlay.tsx`**: node `type === 'text'` không hiện 8 handle resize (quyết định #5). Handle rotate vẫn còn, nhưng ẩn trong lúc đang sửa chữ (`isEditingText`) để không chồng lên `<textarea>` overlay.

## 6. Wave

### 6.1 Sinh path preset

`buildWavePath(intensity, baselineY)` sinh **đúng cấu trúc tài liệu mô tả**: 1 path mở, 3 anchor, 4 handle, tổng 7 point hiển thị.

Đặt `a = intensity * 0.4` (biên độ, chuẩn hoá theo chiều cao box) và `b = baselineY / height`. Toạ độ chuẩn hoá, **y tăng xuống dưới**:

| Point | Toạ độ | Khớp với tài liệu |
|---|---|---|
| **A1** | `(0, b + a)` | §2 — điểm bắt đầu, thấp bên trái |
| A1.out | `(0.2, b + a)` | §6 — xuất phát gần như nằm ngang rồi mới cong lên |
| **A2** | `(0.5, b)` | §2 — anchor giữa |
| A2.in | `(0.35, b + 0.15a)` | §2 — 2 handle đối xứng qua A2 ⇒ thẳng hàng, chuyển tiếp mượt |
| A2.out | `(0.65, b − 0.15a)` | §2 |
| **A3** | `(1, b + 0.6a)` | §2 — điểm kết thúc bên phải |
| A3.in | `(0.75, b − 0.4a)` | §6 — handle nằm **trên** A3 ⇒ cung lớn vồng lên ở khoảng giữa-phải rồi hạ xuống A3 |

`intensity = 0` ⇒ `a = 0` ⇒ mọi point nằm trên đường ngang `y = b` ⇒ warp trở thành phép đồng nhất. Đây là assertion chính của test.

### 6.2 Phép warp

Cho `p` là một điểm của contour (px, local space của node), `b` = baselineY (px), `x0`/`W` = mép trái và chiều rộng khối chữ đo được, `L` = tổng chiều dài cung của path:

```
s  = (p.x − x0) / W × L        // chữ được kéo giãn cho vừa chiều dài path
C  = điểm trên path tại arc-length s
T  = tiếp tuyến đơn vị tại s
N  = (−T.y, T.x)               // quay T 90°, hệ y-down
p' = C + N × (p.y − b)
```

Với path phẳng (`a = 0`): `C = (p.x, b)`, `T = (1,0)`, `N = (0,1)` ⇒ `p' = (p.x, b + p.y − b) = p`. Đồng nhất, đúng như mong đợi.

Chữ bám baseline và tự nghiêng theo tiếp tuyến; chiều cao chữ giữ nguyên. Trên đoạn cong, các điểm trong cùng một glyph nhận `T` hơi khác nhau nên glyph bị uốn nhẹ thay vì xoay cứng — đây là hành vi mong muốn cho chữ chạy theo sóng.

**Arc-length:** mỗi đoạn cubic được flatten thành 32 mẫu, cộng dồn độ dài thành bảng `{s, point}`. `sample(s)` tìm nhị phân rồi nội suy tuyến tính; tiếp tuyến lấy từ hiệu hai mẫu kề.

### 6.3 Panel

Lưới 8 nút transformation, **chỉ Wave bật**, 7 nút còn lại xám (chưa được yêu cầu build). Dưới lưới: slider **"Wave Curve" 0-100%** + nút **Reset**.

- Kéo slider → `UpdateProps(warp.intensity)`, đồng thời **xoá `warp.paths`** (quay về preset).
- Kéo handle trên canvas → ghi `warp.paths`.
- Reset → xoá `paths`, đặt `intensity` về mặc định.

## 7. Luồng dữ liệu

Không có gì mới — đi đúng đường đã có:

```
UI slider/handle ──dispatch(UpdateProps)──► store ──lastCommand──► SceneReconciler.apply()
                                                                          │
                                                          textRenderer.update(node)
                                                                          │
                                                  textGeometry() ──► Graphics.poly()+fill()
```

`beginGesture`/`endGesture` bọc mỗi lần kéo để history gộp thành một bước undo.

## 8. Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Font chưa load xong khi render | Renderer vẽ rỗng, kích hoạt `loadFont()` rồi vẽ lại qua callback `onFontLoaded`. Một callback phủ được cả lần render đầu lẫn node thêm sau với font lạ, nên không cần bước preload riêng trong `CanvasHost` — đổi lại là có thể nháy một frame trống lúc mở document. |
| File font hỏng / parse fail | `fontService` log lỗi, không throw ra render loop. Thư viện **không** ship font mặc định nào của riêng nó ([src/text/fonts/README.md](../../../src/text/fonts/README.md) — quyết định có chủ ý), nên không có gì để fallback về: node chỉ đứng im, không vẽ ra gì, cho tới khi đổi sang font khác đã nạp được. |
| `text` rỗng | `contours` rỗng, node vẫn tồn tại với bbox tối thiểu để còn chọn/xoá được. |
| Ký tự không có trong font | opentype trả `.notdef` (glyph 0), vẽ bình thường — không cần xử lý riêng. |
| `warp.paths` có < 2 anchor | Coi như `type: 'none'`. |
| Path suy biến (mọi anchor trùng nhau, `L ≈ 0`) | Bỏ qua bước warp, trả contour gốc — chặn chia cho 0. |
| `intensity` ngoài `0..1` | Zod `.min(0).max(1)` chặn ở trust boundary, đúng quy ước [02-architecture.md](../../02-architecture.md). |

## 9. Test

Toàn bộ phần khó đều thuần nên test được không cần canvas:

- `applyWarp` với `intensity = 0` → contour ra **bằng đúng** contour vào (phép đồng nhất).
- `buildWavePath` → đúng 3 anchor và 4 handle; A2 có cả `in` lẫn `out`, A1 chỉ có `out`, A3 chỉ có `in`.
- `buildWavePath(0)` → mọi `y` bằng nhau.
- Arc-length của một path thẳng = khoảng cách hai đầu mút.
- `layout` với `letterSpacing = 0` → tổng chiều rộng = tổng advance của các glyph.
- `layout` align `center`/`right` → dịch đúng lượng so với `left`.
- `getGlyphOutlines('o')` với font bundle → đúng **1 shape, 1 hole**; `getGlyphOutlines('i')` → **2 shape, 0 hole**. Đây là test bảo vệ phần phân loại outer/hole ở §5.1.

## 10. Cố tình cắt bỏ

Auto-wrap theo chiều rộng (chỉ ngắt `\n`) · `align: 'justify'` · resize text node · variable font · 7 transformation còn lại · shadow · decoration · cache RenderTexture (chưa đo được là chậm thì chưa tối ưu) · caret/bôi đen tự vẽ trên canvas.

Xem [text-future-work.md](../../text-future-work.md) cho hướng mở rộng từng mục.

## 11. Định nghĩa hoàn thành

1. Thêm được text node từ toolbar, chữ hiện đúng font bundle.
2. Double-click sửa được nội dung, xuống dòng bằng `\n` hoạt động.
3. Panel đổi được font/size/align/letterSpacing/lineHeight/fill.
4. Chọn Wave → path xanh + 7 point hiện trên canvas đúng như tài liệu mô tả.
5. Kéo slider "Wave Curve" → chữ cong real-time; 0% ⇒ chữ thẳng.
6. Kéo được cả 3 anchor và cả 4 handle, chữ đổi theo.
7. Undo/redo một lần kéo = một bước.
8. Export SVG ra `<path>` vector thật, mở lại thấy chữ cong đúng.
9. Reload document JSON render lại y hệt.
10. `pnpm test` và `pnpm lint` sạch.
