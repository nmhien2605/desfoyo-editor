# Text Warp Geometry Rework — Design Spec

**Ngày:** 2026-08-16
**Thay thế:** phần warp geometry của `2026-08-16-text-foundation-wave-design.md` (§3, §5.2–5.4). Các phần khác của spec gốc (font service, schema, editing overlay, panel) giữ nguyên.

---

## 1. Bối cảnh

QC (`QC/qc.md` + ảnh so sánh) chỉ ra wave đang cho ra biến dạng kiểu envelope/mesh thay vì text-on-path. Điều tra code xác nhận, và tìm thêm 3 lỗi QC không nêu.

### 1.1 Các lỗi đã xác nhận

| # | Lỗi | Vị trí |
|---|---|---|
| L1 | Warp áp ở **mức điểm**, không ở mức glyph → glyph bị bẻ, xoè, đổi tỉ lệ x-height theo độ cong | `warp.ts:118-133` |
| L2 | Ép chữ giãn ngang hệ số `L/W` trong khi chiều cao giữ nguyên → non-uniform scale, letter-spacing "thở" khi kéo slider | `warp.ts:125` |
| L3 | **Multi-line hỏng**: mọi dòng dùng chung `baselineY` của dòng đầu → dòng 2+ bị đẩy xa dọc pháp tuyến | `layout.ts:60` + `textGeometry.ts:47-50` |
| L4 | **Tangent suy biến làm glyph co về một điểm**: `norm = Math.hypot(0,0) \|\| 1` cho `tangent = (0,0)`. Vô hại với per-point, chí mạng với rigid transform | `warp.ts:85-88` |
| L5 | Tangent lấy từ dây cung (chord) → góc xoay lượng tử hoá 32 bậc/segment | `warp.ts:83-88` |

### 1.2 Không phải lỗi (đã kiểm, ghi lại để khỏi sửa nhầm)

- **Hit-test chọn node**: `drag.ts:27` đặt `eventMode='static'` trên chính `Graphics`; Pixi hit-test theo hình đã vẽ → đã đúng với chữ đã warp.
- **Bbox export SVG**: text serialize thành `<g${groupAttrs}>` không phát `width/height`; viewBox lấy theo page size → không phụ thuộc `node.size`.
- **`node.size` lệch khỏi hình đã warp**: có thật, nhưng **không được sửa bằng cách đổi `node.size`** — xem §2.4.

---

## 2. Quyết định đã chốt

### 2.1 Rigid per-glyph transform (thay cho per-point)

Theo đúng ngữ nghĩa `<textPath>` của SVG: điểm tham chiếu của mỗi glyph là **trung điểm advance của nó dọc theo path**; glyph được xoay quanh điểm baseline của chính nó theo tangent tại đó, rồi tịnh tiến. Hình học glyph bảo toàn tuyệt đối (phép biến đổi là isometry).

### 2.2 Path thích ứng với chữ, không phải chữ thích ứng với path

- **Path preset** (sinh từ `intensity`): giải hệ số co ngang `k` sao cho **arc length của path đúng bằng bề rộng tự nhiên của text**. Sau đó đặt glyph theo advance thật, không giãn.
- **Path user kéo tay**: text-on-path thật — advance tự nhiên tính từ đầu path, không fit.

**Hệ quả cần biết trước:** khi `intensity` tăng, path cong hơn → `k` nhỏ đi → chữ **chiếm ít bề ngang hơn** (giống trải một dải ruy băng dài 100mm lên dây uốn lượn: hình chiếu ngang < 100mm). Đây là hành vi đúng của text-on-path và giống Illustrator/Canva. Không phải bug.

### 2.3 Glyph tràn khỏi path → bỏ hẳn

Glyph có trung điểm advance `s > arcLength` thì không render (ngữ nghĩa SVG `textPath`). Áp dụng đồng nhất cho cả preset lẫn path kéo tay; với preset đã fit thì trên thực tế không bao giờ kích hoạt.

### 2.4 `node.size` = text frame, **không đổi**. Thêm `bounds` riêng.

`node.size` đang gánh ba vai: pivot của transform (`applyTransform.ts:17`), khung + handle resize (`SelectionOverlay.tsx:106,213,222`), pivot của `WarpHandlesOverlay` (`:97`). Cho nó chạy theo hình đã warp sẽ làm **pivot dịch → node đã xoay nhảy vị trí khi kéo slider**.

Tách theo mô hình Illustrator/Figma:
- `node.size` = **text frame** (layout chưa warp). Giữ nguyên vai trò cơ sở transform/pivot/chuẩn hoá path. `measureText` không đổi.
- `TextGeometry.bounds` = **visual bounds** của hình đã warp. Chỉ dùng để vẽ khung chọn.

### 2.5 Giữ bezier xuyên suốt, không flatten trong code của mình

Rigid transform là **affine** → map thẳng control point của bezier, không cần lấy mẫu. Kéo theo:

| Người tiêu thụ | Trước | Sau |
|---|---|---|
| Pixi | `poly(polyline)` | `moveTo` + `bezierCurveTo` + `closePath` (Pixi tự tessellate) |
| SVG export | `M/L/Z` | `M/C/Z` — nhỏ hơn, sắc ở mọi zoom |
| `signedArea` | shoelace trên polyline | Gauss–Legendre trên cung (chính xác tuyệt đối) |
| bbox | min/max điểm mẫu | giải `B'(t)=0` (chính xác tuyệt đối) |

Toàn bộ code flatten trong `glyphOutlines.ts` (`FLATTEN_STEP_PX`, `stepsFor`, sampler `cubic`/`quadratic`) bị **xoá**. Flatten duy nhất còn lại là bảng arc-length của warp path, vốn không tránh được.

---

## 3. Kiến trúc — pipeline mới

```
TextNode + Font
  │
  ├─ getGlyphOutlines()        → GlyphOutline[]  (contour polybezier, anchorX/baselineY cục bộ)
  │
  ├─ layoutText()              → TextLayout      (đặt vào hộp; anchorX/baselineY tuyệt đối theo dòng)
  │
  ├─ resolveWarpPath()         → { path, fit }   (paths đã lưu thắng preset)
  │
  ├─ buildPathSampler()        → PathSampler     (LUT arc-length + tangent giải tích)
  │   └─ nếu fit: solveHorizontalScale() ép arcLength == layout.width
  │
  ├─ placeOnPath()             → GlyphShape[]    (rigid per-glyph; bỏ glyph tràn)
  │
  └─ contourBounds()           → bounds          (chính xác qua B'(t)=0)
```

Vẫn là một chuỗi hàm thuần, ba consumer (`textRenderer`, `svgSerializer`, `SelectionOverlay`/`WarpHandlesOverlay`) dùng chung — bất biến kiến trúc của spec gốc giữ nguyên.

---

## 4. Data model

### 4.1 `Contour` — polybezier thay cho polyline

```ts
// [x0,y0,  c1x,c1y, c2x,c2y, x1,y1,  c1x,c1y, c2x,c2y, x2,y2,  ...]
// length = 2 + 6n với n segment. Contour luôn kín: điểm on-curve cuối trùng điểm đầu.
export type Contour = number[];
```

Tính chất then chốt: **mọi cặp số là một điểm 2D**, kể cả control point. Phép affine map đồng nhất mọi cặp — `placeOnPath` không cần biết cặp nào on-curve.

Chuyển đổi từ opentype (chính xác, không xấp xỉ):
- `lineTo` → cubic với `c1 = p0 + (p3−p0)/3`, `c2 = p0 + 2(p3−p0)/3`
- `quadraticCurveTo` (TrueType) → cubic với `c1 = p0 + ⅔(q−p0)`, `c2 = p3 + ⅔(q−p3)`
- `bezierCurveTo` (CFF/OTF) → giữ nguyên

### 4.2 `GlyphShape` — mang theo neo của chính nó

```ts
export interface GlyphShape {
  outer: Contour;
  holes: Contour[];
  anchorX: number;   // trung điểm advance của glyph, trong toạ độ hộp layout
  baselineY: number; // baseline của DÒNG chứa glyph này
}
```

- `getGlyphOutlines`: `anchorX = advance / 2`, `baselineY = 0` (toạ độ glyph-local).
- `layoutText`: `anchorX += penX`, `baselineY = ascent + lineIndex * lineStep`.

Đây là mảnh dữ liệu sửa cả L1 (biết ranh giới glyph) lẫn L3 (biết dòng của glyph).

### 4.3 `TextGeometry`

```ts
export interface TextGeometry {
  shapes: GlyphShape[];
  // Hộp layout — chưa warp. Vẫn là mẫu số chuẩn hoá của warp path (độc lập
  // với kết quả warp, nếu không sẽ thành vòng lặp phản hồi) và vẫn là nguồn
  // của node.size. KHÔNG đổi theo warp.
  width: number;
  height: number;
  baselineY: number;
  // Bbox chính xác của shapes SAU warp. Chỉ dùng để vẽ khung chọn.
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}
```

`measureText` **không đổi** — vẫn trả `{ width, height }` của hộp layout.

### 4.4 Schema

Không đổi. `WarpSchema`/`WarpPathSchema`/`WarpAnchorSchema` giữ nguyên; tài liệu đã lưu vẫn đọc được.

---

## 5. Đặc tả từng module

### 5.1 `src/text/glyphOutlines.ts`

**Xoá:** `FLATTEN_STEP_PX`, `MIN_STEPS`, `MAX_STEPS`, `stepsFor`, `cubic`, `quadratic`.

**`signedArea(contour)` — Gauss–Legendre 3 nút, chính xác tuyệt đối.**

Diện tích có dấu theo Green: `A = ½∮(x dy − y dx) = ½∫₀¹(x·y′ − y·x′)dt` cho từng segment, cộng dồn.

Hàm dưới dấu tích phân là đa thức bậc `3 + 2 = 5`. Cầu phương Gauss–Legendre `n` nút chính xác đến bậc `2n−1`, nên **n = 3 cho kết quả đúng tuyệt đối** (không phải xấp xỉ):

```
nút trên [0,1]:  t = (1 − √0.6)/2 ,  1/2 ,  (1 + √0.6)/2
trọng số:         5/18            ,  4/9 ,  5/18
```

Dấu của `A` vẫn là tiêu chí phân biệt outer/hole như cũ (TrueType cuộn thuận chiều kim đồng hồ, CFF ngược lại), nay không còn sai số lấy mẫu.

**`translateContour`** giữ nguyên (dịch mọi cặp — vẫn đúng với control point).

**`containsPoint`** (gán hole cho outer): giữ ray-cast trên **các điểm on-curve** của outer.
*Trần đã biết:* sai chỉ khi điểm đầu của một hole rơi đúng vào vùng giữa cung và dây cung của outer khác. Chưa gặp với font Latin; nếu cần chính xác hẳn thì thay bằng đếm giao điểm tia với từng cubic (giải phương trình bậc 3). Ghi vào `text-future-work.md`.

### 5.2 `src/text/layout.ts`

Chỉ một thay đổi: khi đẩy shape vào mảng, gắn neo tuyệt đối.

```ts
const baseline = ascent + lineIndex * lineStep;
let penX = offsetX;
for (const glyph of line.glyphs) {
  for (const shape of glyph.shapes) {
    shapes.push({
      outer: translateContour(shape.outer, penX, baseline),
      holes: shape.holes.map((hole) => translateContour(hole, penX, baseline)),
      anchorX: shape.anchorX + penX,
      baselineY: baseline,
    });
  }
  penX += glyph.advance + letterSpacing;
}
```

`baselineY: ascent` trong giá trị trả về giữ nguyên ý nghĩa "baseline dòng đầu" — nay là **mốc quy chiếu của path**, không còn bị dùng nhầm cho mọi dòng.

### 5.3 `src/text/warp.ts`

#### 5.3.1 `PathSampler` — LUT arc-length + tangent giải tích

```ts
export interface PathSampler {
  length: number;
  at(distance: number): { point: Point; tangent: Point }; // tangent đơn vị
}
```

**Số bước lấy mẫu cho mỗi segment** — theo cận sai số chuẩn của xấp xỉ cubic bằng đoạn thẳng:

```
M = max( ‖p0 − 2c1 + c2‖ , ‖c1 − 2c2 + p3‖ )
n = clamp( ceil( sqrt( 0.75 * M / TOL ) ), 8, 256 )      TOL = 0.01 px
```

Thay cho `SAMPLES_PER_SEGMENT = 32` cố định.

**Mỗi mục LUT lưu `{ seg, t, s }`** (`s` = chiều dài dây cung tích luỹ). Tra cứu:
1. Nhị phân trên `s` → khoảng `[lo, hi]`.
2. Nội suy tuyến tính `t` trong khoảng (hợp lệ ở mức TOL đã chọn).
3. **Điểm và tangent đều tính giải tích** từ `(seg, t)` — không nội suy toạ độ. Sửa L5.

**Đạo hàm giải tích:**

```
B′(t)   = 3[(1−t)²(c1−p0) + 2(1−t)t(c2−c1) + t²(p3−c2)]
B″(t)   = 6[(1−t)(c2 − 2c1 + p0) + t(p3 − 2c2 + c1)]
B‴(t)   = 6(p3 − 3c2 + 3c1 − p0)
```

**Xử lý suy biến (sửa L4)** — theo quy tắc L'Hôpital, thứ tự:
`B′(t)` → nếu ‖·‖ < ε thì `B″(t)` → nếu vẫn < ε thì `B‴(t)` → nếu vẫn < ε thì segment là một điểm: lấy tangent của mẫu kề không suy biến; nếu cả path suy biến thì `(1, 0)`.

Không bao giờ trả vector không — đó chính là thứ làm glyph co về một điểm.

#### 5.3.2 `solveHorizontalScale` — ép path vừa chữ

```ts
// Trả hệ số k co ngang path sao cho arcLength ≈ target (target = layout.width).
export function solveHorizontalScale(path: WarpPath, size: Size, target: number): number
```

**k được áp bằng phép co quanh tâm ngang của hộp**, không phải quanh gốc:

```
x_px = ((p.x − 0.5) · k + 0.5) · size.width          y_px = p.y · size.height
```

Nếu co quanh gốc, path sẽ trải `[0, k·W]` và chữ trượt dần sang trái khi `intensity` tăng — trong khi `node.size.width` vẫn là `W`. Co quanh tâm giữ chữ đứng yên về mặt thị giác; `k = 1` cho phép đồng nhất.

**Tính đơn điệu (cơ sở của bisection):** với `L(k) = ∫√(k²x′² + y′²)dt`, ta có `dL/dk = ∫ k·x′²/√(k²x′² + y′²) dt ≥ 0`, dương ngặt ở mọi nơi `x′ ≠ 0`. Vậy `L` tăng ngặt theo `k > 0` → bisection hội tụ chắc chắn.

**Chặn:** path preset trải `x ∈ [0, W]` trong px nên `L(1) ≥ W = target` → nghiệm luôn nằm trong `(0, 1]`.

```
nếu L(1) <= target        → trả 1        (path ngắn hơn chữ; glyph tràn sẽ bị bỏ theo §2.3)
nếu L(MIN_SCALE) >= target → trả MIN_SCALE = 0.05
ngược lại: bisect trên [MIN_SCALE, 1], dừng khi |L − target| < 0.01 px hoặc 60 vòng
```

Chạy một lần cho mỗi lần layout, không nằm trong vòng lặp vẽ.

#### 5.3.3 `placeOnPath` — rigid per-glyph (thay `warpShapes`)

```ts
export function placeOnPath(
  shapes: GlyphShape[],
  sampler: PathSampler,
  pathBaselineY: number,   // layout.baselineY — mốc quy chiếu của path
): GlyphShape[]
```

Với mỗi shape:

```
s = shape.anchorX                              // advance thật, đã gồm align + letterSpacing
nếu s > sampler.length  → BỎ shape (§2.3)

{ P, T } = sampler.at(s)                       // T đơn vị
N        = (−T.y, T.x)                         // pháp tuyến, hệ y hướng xuống
d        = shape.baselineY − pathBaselineY     // độ lệch dòng (0 cho dòng đầu)
O        = P + N·d                             // baseline của DÒNG này tại s (sửa L3)

với mọi cặp (px, py) trong contour:
  dx = px − shape.anchorX
  dy = py − shape.baselineY
  out.x = O.x + T.x·dx − T.y·dy
  out.y = O.y + T.y·dx + T.x·dy
```

`anchorX`/`baselineY` của shape kết quả giữ nguyên giá trị cũ (chúng là toạ độ trong hộp layout, dùng cho debug/test, không phải toạ độ đã warp).

**Kiểm tra đồng nhất** — path phẳng tại `y = pathBaselineY`, `T = (1,0)`, `N = (0,1)`:
`O = (s, pathBaselineY + d) = (s, shape.baselineY)`;
`out.x = s + dx = anchorX + (px − anchorX) = px`;
`out.y = shape.baselineY + dy = py`.
Đồng nhất đúng cho **mọi dòng**, không riêng dòng đầu.

**Tính rigid:** ma trận `[T | N]` là trực chuẩn (`‖T‖ = 1`, `N ⊥ T`) → bảo toàn khoảng cách. Hình glyph không thể méo.

#### 5.3.4 `buildWavePath`

Giữ nguyên hình dạng và ngữ nghĩa `intensity`/`baselineRatio` (vẫn khớp `docs/wave-transformation.md`: 1 path mở, 3 anchor, 4 handle). Chỉ khác: kết quả đi qua `solveHorizontalScale` trước khi dựng sampler.

### 5.4 `src/text/textGeometry.ts`

```ts
export function resolveWarpPath(
  node: TextNode,
  baselineRatio: number,
): { path: WarpPath; fit: boolean } | null
```

`fit = false` cho path đã lưu (user kéo tay), `fit = true` cho preset. Quy tắc "paths đã lưu thắng preset" giữ nguyên.

Sampler được dựng qua **một hàm dùng chung** — `WarpHandlesOverlay` phải vẽ handle trên đúng path mà chữ đang chạy, nên không được tự dựng lại:

```ts
// Nguồn duy nhất của "path thật sự đang dùng". textGeometry và
// WarpHandlesOverlay đều gọi hàm này, không hàm nào tự ghép lại các bước.
export function warpSamplerFor(node: TextNode, layout: TextLayout): PathSampler | null {
  if (layout.height <= 0) return null;
  const resolved = resolveWarpPath(node, layout.baselineY / layout.height);
  if (!resolved) return null;
  const size = { width: layout.width, height: layout.height };
  const k = resolved.fit ? solveHorizontalScale(resolved.path, size, layout.width) : 1;
  return buildPathSampler(resolved.path, size, k);
}

export function textGeometry(node: TextNode, font: Font): TextGeometry {
  const layout = layoutText({
    text: node.text,
    font,
    fontSize: node.font.size,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
    align: node.align,
  });
  const sampler = warpSamplerFor(node, layout);
  const shapes = sampler
    ? placeOnPath(layout.shapes, sampler, layout.baselineY)
    : layout.shapes;

  return { ...layout, shapes, bounds: shapesBounds(shapes) };
}
```

**`shapesBounds` — bbox chính xác.** Với mỗi segment và mỗi trục, giải `B′(t) = 0`:

```
at² + bt + c = 0    với   a = −p0 + 3c1 − 3c2 + p3
                          b = 2(p0 − 2c1 + c2)
                          c = c1 − p0
```

Lấy nghiệm trong `(0,1)`, đánh giá `B(t)`, gộp với hai đầu mút. Xử lý `a ≈ 0` bằng nhánh tuyến tính. Không dùng control point làm cận (bao lồi nới rộng bbox một cách không cần thiết).

### 5.5 Consumer

#### `src/render/renderers/textRenderer.ts`

```ts
export interface TextDrawTarget {
  moveTo(x: number, y: number): TextDrawTarget;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): TextDrawTarget;
  closePath(): TextDrawTarget;
  fill(style?: unknown): TextDrawTarget;
  cut(): TextDrawTarget;
}
```

Thứ tự vẽ (bất biến từ spec gốc vẫn còn hiệu lực — Pixi **không** áp winding non-zero cho nhiều path trong một `fill()`, nên phải fill từng outer rồi cut lỗ của chính nó):

```
với mỗi shape:
  moveTo(outer[0], outer[1]); bezierCurveTo(...) × n; closePath(); fill(style)
  với mỗi hole:
    moveTo(hole[0], hole[1]); bezierCurveTo(...) × m; closePath(); cut()
```

Đã xác minh trên `node_modules/pixi.js/.../GraphicsContext.mjs`: `bezierCurveTo` ở dòng 304, `cut()` ở dòng 200 clone `_activePath` rồi gắn làm `hole` của instruction `fill` liền trước — không phụ thuộc path được dựng bằng lệnh gì.

#### `src/services/svgSerializer.ts`

`contourToPathData` phát `M x0 y0 C c1x c1y c2x c2y x1 y1 C … Z`. Giữ `fill-rule="nonzero"` cùng lý do đã ghi trong comment hiện có.

#### `src/ui/SelectionOverlay.tsx`

Với `node.type === 'text'`, vẽ khung chọn từ `textGeometry(node, font).bounds` thay vì `node.size`. Chỉ ảnh hưởng hình chữ nhật hiển thị — resize đã khoá cho text node, `worldPoint`/pivot vẫn dùng `node.size` (§2.4).

Font chưa nạp → không có geometry → lùi về `node.size`, cùng quy ước "thiếu dữ liệu thì im lặng" của `textRenderer`.

#### `src/ui/WarpHandlesOverlay.tsx`

Path preset nay bị co ngang hệ số `k`, nên **handle phải vẽ trên path đã co** để trùng với chữ. Overlay lấy path qua `warpSamplerFor` (§5.4), không tự ghép `resolveWarpPath` + `buildPathSampler`.

**Bake `k` khi lưu.** Quy tắc "paths đã lưu thắng preset" đặt `fit = false` cho path đã lưu, nghĩa là lần render sau `k` sẽ là 1. Nếu ghi toạ độ chuẩn hoá gốc thì chữ **nhảy** ngay khi user chạm handle đầu tiên. Vậy lúc `movePathPoint` ghi lần đầu, mọi điểm phải được bake:

```
x_stored = (x_preset − 0.5) · k + 0.5          y_stored = y_preset
```

Sau khi bake, render với `k = 1` cho ra đúng hình đang hiển thị. Bất biến: **điều user thấy lúc thả tay chính là điều được lưu.**

---

## 6. Bất biến & test

| # | Bất biến | Test |
|---|---|---|
| B1 | `warp = none` hoặc `intensity = 0` → geometry **trùng khít** layout, mọi dòng | so sánh từng số của contour, text 1 dòng và 3 dòng |
| B2 | Phép đặt là isometry | khoảng cách từng cặp điểm trong cùng glyph bảo toàn trước/sau (sai số < 1e-9) |
| B3 | Advance được tôn trọng | khoảng cách **arc-length** giữa hai glyph liền kề == `(advance_i + advance_{i+1})/2 + letterSpacing` |
| B4 | k-fit đúng | `\|arcLength(path·k) − layout.width\| < 0.01`; và `k = 1` khi `intensity = 0` |
| B5 | Không suy biến | `WarpPath` dựng thủ công với anchor thiếu `out`/`in` (⇒ `c1 = p0`) → không glyph nào co về điểm; bbox mỗi glyph > 0 |
| B5b | Bake k không nhảy hình | render preset ở `intensity = 1`, bake theo §5.5, render lại với `fit = false` → contour trùng khít |
| B6 | Multi-line xếp đúng | 2 dòng trên path cong → dòng 2 cách dòng 1 đúng `lineStep` theo pháp tuyến tại cùng `s` |
| B7 | Bỏ glyph tràn | path kéo tay ngắn hơn chữ → số shape giảm đúng bằng số glyph có `anchorX > L` |
| B8 | Bbox chính xác | cubic có cực trị ngoài bao lồi các điểm on-curve → `bounds` bao đúng cực trị đó |
| B9 | `measureText` không đổi | `node.size` giữ nguyên khi `intensity` đổi |
| B10 | `signedArea` chính xác | hình tròn dựng bằng 4 cung cubic → diện tích khớp `πr²` trong 1e-6 |

Regression đã có (kerning, fill-rule nonzero, toạ độ handle khi xoay/scale, đồng bộ `node.size` sau khi font nạp) phải tiếp tục pass.

---

## 7. Trần đã biết (ghi vào `text-future-work.md`)

1. **Offset curve của dòng 2+ tự cắt** khi bán kính cong < `lineStep`. Cố hữu của mô hình; Illustrator cũng vậy. Không sửa.
2. **Pixi tessellate bezier theo `smoothness` mặc định**, không theo camera zoom → zoom rất sâu có thể thấy cạnh gãy. Nâng cấp: truyền `smoothness` theo zoom + redraw khi zoom đổi.
3. **Gán hole/outer** ray-cast trên điểm on-curve (§5.1).
4. **Envelope warp** (biến dạng theo vùng bao, tức hành vi per-point cũ) vẫn là mode tương lai — schema `Warp` đã chừa chỗ, không sinh ra trong đợt này.
5. **`solveHorizontalScale` chỉ co theo trục x.** Nếu sau này có preset mà biên độ dọc lớn tới mức `L(0.05) > W`, chữ sẽ bị bỏ bớt. Cần kẹp `intensity` hoặc đổi sang co đều hai trục.

---

## 8. Phạm vi

**Sửa:** `glyphOutlines.ts`, `layout.ts`, `warp.ts`, `textGeometry.ts`, `textRenderer.ts`, `svgSerializer.ts`, `SelectionOverlay.tsx`, `WarpHandlesOverlay.tsx` + test tương ứng.

**Không đụng:** schema, `fontService.ts`, `TextEditOverlay.tsx`, `PropertiesPanel.tsx`, `TransformationControls.tsx`, `applyTransform.ts`, `SceneReconciler.ts`, cơ chế hit-test.

**Không có migration:** tài liệu đã lưu đọc được nguyên vẹn; chỉ hình ảnh hiển thị đổi.
