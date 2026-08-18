# Text Wave — Vertical Displacement Design Spec

> **ĐÃ BỊ THAY THẾ (2026-08-17)** bởi
> `2026-08-17-text-warp-arclength-design.md`. Mô hình dịch chuyển dọc thuần
> `(x,y) → (x, y+f(x))` không tạo được hiệu ứng nén/giãn cục bộ của Kittl.
> Giữ lại vì phần chứng minh §2.3 (đơn điệu của Bx) và §5.1.2 (affine-exactness)
> vẫn còn hiệu lực và được mô hình mới dùng lại.

**Ngày:** 2026-08-17
**Thay thế:** `2026-08-16-text-warp-geometry-rework-design.md` (§2.1, §2.2, §2.3, §5.3) và phần warp geometry của spec gốc. Các quyết định khác của hai spec trước giữ nguyên trừ khi nói rõ ở đây.

---

## 1. Bối cảnh

Hai tài liệu QC yêu cầu hai thứ ngược nhau:

| Tài liệu                     | Yêu cầu                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `QC/qc.md` (16/08)           | "Mỗi ký tự được translate + **rotate theo tangent** của path". Liệt kê "sai orientation theo tangent" là lỗi #3.                          |
| `QC/202608171109.md` (17/08) | "baseline follows the Bézier curve while all glyphs maintain an **upright** orientation (vertical axis preserved, **no glyph rotation**)" |

Bản ship hiện tại làm đúng theo tài liệu 16/08. Tài liệu 17/08 phủ định chính điều đó. **Đây là thay đổi yêu cầu, không phải lỗi implementation.**

### 1.1 Phép xoay là nguyên nhân của cả lỗi va chạm đã báo

Đo trên path người dùng gửi (handle anchor đầu kéo xuống `y = 1.63`):

- Sai số rigidity = `0.0000000000` — không glyph nào bị méo.
- `'Y'`→`'o'`: lệch góc **42.4°**, bbox chồng lấn **36px ngang × 40px dọc**.
- Bán kính cong tại đáy vực ≈ 78px, chiều cao chữ hoa ≈ 68px. Tỉ lệ `h/R = 0.87` ⇒ phía lõm nén còn 13% ⇒ va chạm bắt buộc.

Va chạm sinh ra **hoàn toàn** từ việc hai glyph xoay khác nhau. Bỏ xoay thì hoành độ mỗi glyph không đổi, khoảng cách ngang đúng bằng advance tự nhiên ⇒ **va chạm bất khả thi về mặt toán học**, với mọi độ cong và mọi cỡ chữ. Một thay đổi giải quyết cả hai vấn đề.

---

## 2. Quyết định đã chốt

### 2.1 Trường dịch chuyển dọc toàn cục

Phép biến đổi duy nhất:

```
(x, y)  →  (x, y + f(x))
```

với `f(x) = curveY(x) − layout.baselineY` là độ lệch dọc của warp path tại hoành độ `x`.

- Không xoay. Không scale. Không đổi hoành độ.
- Áp cho **từng điểm**, không phải từng glyph. Nét dọc (x hằng) dịch đều nên vẫn thẳng đứng và giữ nguyên độ dài; nét ngang uốn theo đường cong.
- Đây là phương án C trong so sánh đã trình bày, người dùng đã chốt.

Thoả `QC/202608171109.md`: trục dọc bảo toàn, không xoay, baseline (`y = baselineY`) ánh xạ thành `y = baselineY + f(x)` tức đúng đường cong.

### 2.2 Không còn khái niệm arc-length

Chữ không chạy dọc theo cung nữa mà đứng yên theo phương ngang. Kéo theo:

- Không cần bảng arc-length, không cần tiếp tuyến.
- Không cần ép path vừa chữ (`solveHorizontalScale`/`bakeScale`) — bề rộng chữ không bao giờ đổi.
- Không còn glyph tràn khỏi path ⇒ bỏ quy tắc "bỏ glyph tràn" (§2.3 spec cũ).

### 2.3 Path phải là hàm của x

`f(x)` chỉ xác định khi mỗi `x` cho đúng một `y`. Ràng buộc khi kéo:

- Anchor thứ `i`: kẹp `x` trong `[x[i−1], x[i+1]]`.
- Handle: kẹp `x` trong `[p0.x, p3.x]` của segment chứa nó.
- Sau khi di chuyển một anchor, **kẹp lại** handle của chính nó _và_ handle kề của hai anchor lân cận — chúng vừa có thể rơi ra ngoài khoảng mới.
- Hoành độ anchor đầu và cuối khoá cứng ở `0` và `1`, để `f` phủ trọn `[0, width]`.

**Điều kiện này đủ, có chứng minh.** Chuẩn hoá `p0.x = 0`, `p3.x = 1`, đặt `c1.x = u`, `c2.x = v`. Khi đó `Bx'(t)/3` là dạng Bernstein bậc hai với hệ số `a = u`, `b = v − u`, `c = 1 − v`; dạng `a(1−t)² + 2b·t(1−t) + c·t²` không âm trên `[0,1]` khi `a ≥ 0`, `c ≥ 0` và (`b ≥ 0` hoặc `b² ≤ ac`). Kẹp cho `u, v ∈ [0,1]` nên `a, c ≥ 0`; còn `g(u,v) = (u−v)² − u(1−v) ≤ 0` trên cả hình vuông — điểm dừng trong tại `(2/3, 1/3)` cho `−1/3`, cả bốn cạnh đều `≤ 0`, cực đại `0` chỉ đạt ở hai góc (ứng với `b = 0`). Vậy `b² ≤ ac` ⇒ `Bx' ≥ 0` ⇒ `x` đơn điệu không giảm trên mọi segment. ∎

Biên `Bx' = 0` tại một điểm (tiếp tuyến dọc) vẫn cho `x` đơn trị. Chỉ khi **cả** segment nằm trên một hoành độ thì `f` mới đa trị — nhánh phòng thủ §5.1.1 lo việc đó.

Preset wave vốn đã thoả. Ngoài đoạn `[0, layout.width]`, `f` kẹp về giá trị đầu mút — glyph có phần mực vượt biên (side bearing, chữ nghiêng) vẫn được dịch hợp lý.

### 2.4 Giữ bezier — KHÔNG quay lại flatten

**Đây là điểm kỹ thuật cốt lõi của spec này.**

Áp `f` thẳng lên 4 control point của một cubic là **sai**: đường cong kết quả là `By(t) + f(Bx(t))`, mà `f` là hàm bậc 3 theo `x` còn `Bx(t)` bậc 3 theo `t`, nên hợp thành bậc 9 — không biểu diễn được bằng cubic. Đây chính là lý do code nguyên bản phải flatten outline thành polyline.

Nhưng có một tính chất cứu vãn:

> **Nếu `f` là hàm affine `L(x) = α + βx` trên đoạn đang xét, thì áp `y' = y + L(x)` lên từng control point là CHÍNH XÁC TUYỆT ĐỐI.**

Chứng minh: `L(Bx(t)) = α + β·Bx(t)`. Cơ sở Bernstein có tổng bằng 1 nên hằng số `α` có control point đều bằng `α`, và `β·Bx` có control point `β·(control point x)`. Vậy `By(t) + L(Bx(t))` có control point thứ `i` bằng `c_i.y + α + β·c_i.x = c_i.y + L(c_i.x)`. ∎

Nên thuật toán là: **chia nhỏ cubic của glyph cho tới khi `f` gần affine trên đoạn đó, rồi áp phép affine lên control point.** Kết quả vẫn là bezier, sai số bị chặn tường minh, không phải flatten thành polyline.

Nhờ vậy giữ nguyên toàn bộ thành quả của đợt trước: `Contour` polybezier, `bezierCurveTo` trên Pixi, lệnh `C` khi export SVG, `signedArea` Gauss–Legendre, bbox qua `B'(t)=0`.

---

## 3. Kiến trúc — pipeline mới

```
TextNode + Font
  │
  ├─ getGlyphOutlines()      → GlyphOutline[]   (contour polybezier)
  │
  ├─ layoutText()            → TextLayout       (đặt glyph vào hộp)
  │
  ├─ resolveWarpPath()       → WarpPath | null  (paths đã lưu thắng preset)
  │
  ├─ buildDisplacement()     → (x) => number    (f, tra y theo x)
  │
  ├─ displaceContours()      → GlyphShape[]     (chia nhỏ + affine từng đoạn)
  │
  └─ shapesBounds()          → bounds           (chính xác qua B'(t)=0)
```

Ngắn hơn pipeline cũ một bước và không còn nhánh nào phụ thuộc arc-length.

---

## 4. Data model

### 4.1 `Contour` — không đổi

```ts
// [x0,y0, c1x,c1y, c2x,c2y, x1,y1, ...] — độ dài 2 + 6n, luôn kín.
export type Contour = number[];
```

### 4.2 `GlyphShape` — bỏ hai trường neo

```ts
export interface GlyphShape {
  outer: Contour;
  holes: Contour[];
}
```

`anchorX`/`baselineY` thêm ở đợt trước chỉ phục vụ phép xoay per-glyph. Trường dịch chuyển toàn cục không cần biết ranh giới glyph, nên hai trường này trở thành dữ liệu chết — xoá. Đây là hoàn nguyên đúng phần đó của Task 1 đợt trước.

Hệ quả phụ đáng chú ý: **multi-line tự đúng**. Mọi điểm cùng hoành độ đều dịch cùng một lượng bất kể thuộc dòng nào, nên các dòng giữ song song và giữ nguyên khoảng cách dòng. Không cần xử lý riêng.

### 4.3 `TextGeometry` — không đổi

```ts
export interface TextGeometry {
  shapes: GlyphShape[];
  width: number; // hộp layout chưa warp — vẫn là nguồn của node.size
  height: number;
  baselineY: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}
```

`measureText`/`node.size` **không đổi** (vẫn là text frame, vẫn là pivot của `applyTransform`). Lần này bề rộng thực sự không đổi vì hoành độ được bảo toàn tuyệt đối.

### 4.4 Schema — không đổi

`WarpSchema`/`WarpPathSchema`/`WarpAnchorSchema` giữ nguyên. Tài liệu đã lưu đọc được nguyên vẹn; chỉ cách diễn giải path đổi từ "đường chữ chạy trên" thành "biên dạng độ lệch dọc".

---

## 5. Đặc tả từng module

### 5.1 `src/text/warp.ts` — viết lại phần lõi

**Xoá:** `placeOnPath`, `buildPathSampler`, `PathSampler`, `arcLength`, `tangentAt`, `bakeScale`, `solveHorizontalScale`, và các hằng `FLATNESS_TOL`/`MIN_STEPS`/`MAX_STEPS`/`MIN_SCALE`/`LENGTH_TOL` đi kèm.

**Giữ:** `buildWavePath` (nguyên vẹn — vẫn 3 anchor, 4 handle, đúng `docs/wave-transformation.md`), `Point`.

#### 5.1.1 `buildDisplacement`

```ts
// Trả f(x) = độ lệch dọc của path tại hoành độ x, tính từ baseline phẳng.
// f(x) = 0 với mọi x khi intensity = 0 (path phẳng đúng tại baseline).
export function buildDisplacement(
  path: WarpPath,
  size: Size,
  baselineY: number,
): (x: number) => number;
```

Dựng bảng `(x, y)` bằng **chia đôi đệ quy theo đúng tiêu chí của §5.1.2**: chia mỗi segment của path cho tới khi độ lệch _dọc_ giữa cung và dây cung theo hoành độ của nó `< LUT_TOL = 0.01px`, giới hạn độ sâu 10 (nâng từ 8 trong plan gốc sau khi Task 2 đo thực nghiệm: depth 8 để ~nửa số mẫu trên path dốc chạm trần mà chưa đạt `LUT_TOL`; depth 10 hội tụ theo đúng tiêu chí flatness, không nhờ trần).

_Không_ dùng lại công thức phẳng `n = ceil(sqrt(0.75·M / TOL))` của đợt trước. Cận đó chặn khoảng cách **vuông góc** giữa cung và dây cung, trong khi bảng này được tra theo `x` nên cái cần chặn là sai lệch **dọc**. Quan hệ giữa hai đại lượng: với truy vấn tại hoành độ `x`, sai số dọc `≤ εy + |slope|·εx` — tức cận vuông góc `0.01px` trên một path dốc ứng với sai số dọc lớn hơn nhiều lần. Dùng chung một tiêu chí cho cả LUT lẫn `displaceContours` vừa đúng vừa bớt được một khái niệm.

Tra cứu: nhị phân trên `x` + nội suy tuyến tính. Ngoài khoảng thì kẹp về đầu mút.

Sai số nội suy của bảng cộng vào ngân sách sai số tổng ở §5.1.2; với `LUT_TOL = 0.01px` đo theo phương dọc, nó nằm dưới ngưỡng nhận biết ở mọi cỡ chữ thực tế.

_Phòng thủ:_ nếu bảng không đơn điệu theo `x` (path bị kéo quặt ngược, lẽ ra đã bị UI chặn theo §2.3), tra cứu lấy mẫu có `x` gần nhất thay vì hỏng — suy giảm mượt, không ném lỗi.

#### 5.1.2 `displaceContours`

```ts
export function displaceContours(shapes: GlyphShape[], f: (x: number) => number): GlyphShape[];
```

Với **mỗi segment cubic** `(p0, c1, c2, p3)` của mỗi contour:

1. **Chọn phép affine bằng nội suy tại hai đầu mút on-curve**, KHÔNG phải bằng dây cung trên toàn khoảng hoành độ:

   ```
   L(x) = f(p0.x) + (f(p3.x) − f(p0.x))·(x − p0.x)/(p3.x − p0.x)
   ```

   Đây là điều kiện để **contour vẫn kín tuyệt đối và không có gãy khúc ở mối nối**. Điểm on-curve nối hai segment kề nhau được lưu _một lần_ trong `Contour` và renderer nối chuỗi `bezierCurveTo` từ điểm đó; nếu hai bên chọn hai phép affine cho hai giá trị khác nhau tại cùng hoành độ ấy thì segment sau bị vẽ lệch khỏi bộ control point của chính nó, và điểm đóng contour lệch khỏi điểm mở. Nội suy tại đầu mút cho `L(p0.x) = f(p0.x)` và `L(p3.x) = f(p3.x)` đúng bằng định nghĩa, nên mọi mối nối khớp chính xác — kể cả chỗ vòng lại.

   _Vì sao dây cung trên `[xa, xb]` hỏng:_ nó chỉ trùng nội suy đầu mút khi segment đơn điệu theo `x`. Segment có cực trị hoành độ — tức mọi điểm trái nhất/phải nhất của chữ tròn `o`, `e`, `c`, `S` — có `p0.x` nằm hẳn trong `(xa, xb)`, nên `L(p0.x) ≠ f(p0.x)`, sinh lệch tới `2·DISPLACE_TOL` tại mối nối. Trường hợp này phổ biến, không phải biên.

   Chứng minh §2.4 không đổi: nó chỉ đòi hỏi **cùng một** phép affine áp cho cả 4 control point, không ràng buộc affine nào.

2. **Đo sai số trên toàn khoảng hoành độ thật** `[xa, xb]` của segment: hai đầu mút cộng các nghiệm của `Bx'(t) = 0` trong `(0,1)`. Dùng lại đúng hàm `extrema()` đã có (hiện nằm trong `textGeometry.ts` — nâng lên `bezier.ts` để dùng chung, xem §5.2). Khoảng này có thể **rộng hơn** `[p0.x, p3.x]`; ở phần vượt ra, `L` là ngoại suy nên sai số lớn hơn — đó chính là lý do phải đo trên `[xa, xb]` chứ không chỉ giữa hai đầu mút. Lấy mẫu `f` tại 5 điểm chia đều, `err = max |f − L|`.

   _Đây là ước lượng lấy mẫu, không phải cận trên chặt._ Cận chặt cần đạo hàm bậc hai của `f`. Với `f` trơn (piecewise cubic) và khoảng `x` nhỏ dần theo đệ quy, 5 mẫu là đủ trong thực tế; sai số hội tụ bậc hai theo độ dài khoảng nên mỗi lần chia đôi giảm sai số ~4 lần. B6 kiểm chéo kết quả cuối bằng lấy mẫu dày để bắt trường hợp ước lượng hụt.

3. **Segment gần thẳng đứng** (`|p3.x − p0.x|` nhỏ so với `xb − xa`): mẫu số của `L` tiến về 0, hệ số góc bùng nổ. Hai nhánh:

   - `xb − xa` cũng ≈ 0 — nét dọc thật: dùng hằng số `L ≡ f(p0.x)`. Chính xác, vì cả segment nằm trên một hoành độ; và vẫn khớp hai segment kề vì chúng cũng tra `f` tại đúng hoành độ đó.
   - `xb − xa` không nhỏ — cung vòng ngang rồi quay lại (chữ `o` dựng bằng 2 cung có `p0.x = p3.x` = tâm, khoảng rộng bằng bán kính): **ép chia đôi**, bỏ qua phép đo. Sau đúng một lần chia, hai nửa có hai đầu mút khác hoành độ nên hết suy biến.

4. **Nếu `err > DISPLACE_TOL`** (0.05px): tách đôi cubic tại `t = 0.5` bằng de Casteljau rồi đệ quy cho hai nửa. Giới hạn độ sâu 10 (tối đa 1024 đoạn con mỗi segment gốc — nâng từ 8/256 trong plan gốc, xem lý do ở §5.1.1) để không chạy vô hạn với path bệnh lý; chạm trần thì áp `L` hiện có, sai số bị chặn bởi biên độ của `f` chứ không hỏng cấu trúc. Số segment của contour vì vậy **tăng** sau khi warp — định dạng `2 + 6n` giữ nguyên, `n` lớn hơn.

5. **Ngược lại**: áp `y' = y + L(x)` lên **cả 4 control point**. Chính xác tuyệt đối theo chứng minh §2.4.

Contour kết quả vẫn đúng định dạng polybezier `2 + 6n` và vẫn kín tuyệt đối: điểm mở nhận `L₁(x₀) = f(x₀)`, điểm đóng nhận `L_N(x₀) = f(x₀)` — cùng một số.

Chỉ số chẵn (hoành độ) **không bao giờ bị ghi** — đây là chỗ B2 kiểm.

### 5.2 `src/text/bezier.ts`

Thêm hai hàm dùng chung, đều đã tồn tại rải rác:

```ts
// Nghiệm B'(t) = 0 trong (0,1) trên một trục. Chuyển từ textGeometry.ts
// (Task 6 đợt trước) lên đây vì giờ cả bbox lẫn displaceContours đều cần.
export function extrema(p0: number, c1: number, c2: number, p3: number): number[];

// Tách cubic tại t bằng de Casteljau, trả hai bộ control point.
export function splitCubic(
  p0: number,
  c1: number,
  c2: number,
  p3: number,
  t: number,
): { left: [number, number, number, number]; right: [number, number, number, number] };
```

`evalCubic`, `evalD1` giữ nguyên. `evalD2`, `evalD3` chỉ còn `tangentAt` dùng — xoá theo.

### 5.3 `src/text/layout.ts`

Bỏ hai dòng gán `anchorX`/`baselineY` khi đẩy shape. Phần còn lại không đổi.

### 5.4 `src/text/glyphOutlines.ts`

Bỏ tham số `anchorX` của `groupIntoShapes` và hai trường tương ứng khi tạo shape. `signedArea`, `containsPoint`, `commandsToContours` không đổi.

### 5.5 `src/text/textGeometry.ts`

```ts
// paths đã lưu thắng preset. Không còn cờ `fit` — không còn chế độ co path.
export function resolveWarpPath(node: TextNode, baselineRatio: number): WarpPath | null {
  const warp = node.warp;
  if (!warp || warp.type === 'none') return null;

  const stored = warp.paths?.find((path) => path.role === 'baseline');
  if (stored) return stored.anchors.length >= 2 ? stored : null;

  if (warp.type === 'wave') return buildWavePath(warp.intensity, baselineRatio);
  return null;
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

  const path = layout.height > 0 ? resolveWarpPath(node, layout.baselineY / layout.height) : null;
  const shapes = path
    ? displaceContours(
        layout.shapes,
        buildDisplacement(path, { width: layout.width, height: layout.height }, layout.baselineY),
      )
    : layout.shapes;

  return { ...layout, shapes, bounds: shapesBounds(shapes) };
}
```

`shapesBounds` giữ nguyên, chỉ đổi sang import `extrema` từ `bezier.ts`.

`resolveWarpGeometry` (đợt trước) bị xoá — không còn sampler để chia sẻ. Thay bằng một hàm mỏng cho overlay dùng chung path đã resolve, xem §5.7.

### 5.6 `src/render/renderers/textRenderer.ts` và `src/services/svgSerializer.ts`

**Không đổi.** Cả hai chỉ tiêu thụ `Contour` polybezier, mà định dạng đó giữ nguyên. Đây là phần thưởng của §2.4.

### 5.7 `src/ui/WarpHandlesOverlay.tsx`

- Bỏ mọi thứ liên quan `resolveWarpGeometry`/bake — gọi thẳng `resolveWarpPath(node, geometry.baselineY / geometry.height)`.
- Thêm **kẹp hoành độ** khi kéo (§2.3): với anchor thứ `i`, `x` bị kẹp trong `(x[i-1], x[i+1])`; với handle, kẹp trong khoảng của anchor chủ và anchor kề theo hướng handle. Giữ path luôn là hàm của `x`.
- Phần chiếu toạ độ (`projectLocalPoint`, `toScreen`) không đổi.
- **Bổ sung sau spec (commit `876d25f`):** khi kéo handle của một anchor "smooth" (có cả `in` và `out`), handle đối diện tự xoay theo để giữ tiếp tuyến mượt qua anchor đó — UX thường thấy ở công cụ vector, không nằm trong bất kỳ mục nào ở trên nhưng không mâu thuẫn với chúng.

### 5.8 `src/ui/SelectionOverlay.tsx`

Không đổi. `selectionBox` + `transformOrigin` theo px đã sửa ở đợt trước vẫn đúng nguyên.

---

## 6. Bất biến & test

| #   | Bất biến                                                                                                               | Test                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | `warp = none`, hoặc preset `wave` với `intensity = 0` **và không có path đã lưu** → geometry trùng khít layout từng số | text 1 dòng và 3 dòng. (Có path đã lưu thì `intensity` không còn tác dụng — `resolveWarpPath` cho path lưu thắng.)                                                                                                                                                            |
| B2  | **Hoành độ bảo toàn tuyệt đối**                                                                                        | chia nhỏ làm đổi số phần tử nên không so được theo chỉ số. So `displaceContours(shapes, f)` với `displaceContours(shapes, () => 0)` — cùng cây chia nhỏ, nên **mọi chỉ số chẵn phải bằng nhau đúng bit**; thêm: bản `f ≡ 0` phải trùng khít contour gốc về mặt hình học       |
| B3  | **Nét dọc vẫn dọc và đúng độ dài**                                                                                     | dựng contour có cạnh thẳng đứng, sau warp hai đầu vẫn cùng `x` và khoảng cách `y` không đổi                                                                                                                                                                                   |
| B4  | **Không sinh chồng lấn mới**                                                                                           | trên path cực đoan (handle `y=1.63`), bbox **hoành độ** của từng glyph sau warp trùng khít trước warp. (Không khẳng định bbox hai glyph rời nhau — chữ `Y`+`o` vốn đã đè hoành độ do kerning; điều bảo đảm là quan hệ ngang _không đổi_, nên warp không thể tạo va chạm mới.) |
| B5  | Baseline bám đường cong                                                                                                | với mọi `x` mẫu, điểm baseline sau warp cách `curveY(x)` dưới 0.06px (ngân sách LUT + linear hoá)                                                                                                                                                                             |
| B6  | Sai số linear hoá bị chặn                                                                                              | so contour đã warp với bản lấy mẫu dày (2000 điểm/segment): lệch tối đa < `DISPLACE_TOL`                                                                                                                                                                                      |
| B7  | Định dạng contour giữ nguyên                                                                                           | sau warp vẫn `(len − 2) % 6 === 0` và điểm on-curve cuối trùng điểm đầu                                                                                                                                                                                                       |
| B8  | Multi-line song song                                                                                                   | 2 dòng: hiệu `y` giữa hai điểm cùng `x` ở hai dòng luôn đúng `lineStep`                                                                                                                                                                                                       |
| B9  | `measureText`/`node.size` không đổi theo `intensity`                                                                   |                                                                                                                                                                                                                                                                               |
| B10 | Kẹp hoành độ handle                                                                                                    | kéo anchor giữa vượt quá anchor phải → `x` bị kẹp; và sau khi kéo anchor, handle kề của hai anchor lân cận cũng được kẹp lại. Kiểm `Bx' ≥ 0` trên lưới dày ở mọi segment                                                                                                      |
| B11 | **Mối nối khớp chính xác**                                                                                             | với glyph tròn (`o`, `e` — có segment chứa cực trị hoành độ), sau warp mọi điểm on-curve nối phải bằng `y + f(x)` đúng tại chính nó, sai số 0; đây là test bắt lỗi nếu ai đó đổi `L` về dây cung trên `[xa, xb]`                                                              |

Regression đã có phải tiếp tục xanh: kerning, fill-rule `nonzero`, lỗ chữ `o`/`e`, bbox chính xác, khung chọn khi xoay, text rỗng không co về 0.

---

## 7. Trần đã biết

1. **Nét ngang bị uốn.** Đây là bản chất của phương án C, đã được chấp nhận khi chốt: trục dọc bảo toàn, nét ngang theo đường cong. Nếu sau này cần glyph nguyên vẹn 100% thì đó là phương án B (tịnh tiến dọc theo từng glyph) — đổi được với diff nhỏ vì hạ tầng chung.
2. **Sai số linear hoá `DISPLACE_TOL = 0.05px`** cộng với sai số bảng LUT `0.01px`. Tổng dưới 0.06px, không nhận biết được ở cỡ chữ thực tế nhưng không phải 0.
3. **Số segment tăng** sau khi chia nhỏ. Với preset wave đo được phần lớn segment không phải chia; path cực gắt có thể tăng vài lần. Ảnh hưởng kích thước file SVG, không ảnh hưởng chất lượng.
4. **Path phải đơn điệu theo x** (§2.3). Ràng buộc này bỏ mất khả năng tạo đường cong quặt ngược — không có trong `docs/wave-transformation.md` nên chấp nhận được.
5. Pixi tessellate bezier theo `smoothness` mặc định, không theo camera zoom (giữ nguyên từ trước).
6. `containsPoint` ray-cast trên điểm on-curve (giữ nguyên từ trước).
7. Envelope warp thật (biến dạng cả hai trục) vẫn là mode tương lai — schema đã chừa chỗ.

---

## 8. Phạm vi

**Sửa:** `warp.ts` (viết lại lõi), `bezier.ts` (thêm `extrema`, `splitCubic`), `textGeometry.ts`, `layout.ts`, `glyphOutlines.ts`, `WarpHandlesOverlay.tsx` + test tương ứng.

**Không đụng:** `textRenderer.ts`, `svgSerializer.ts`, `SelectionOverlay.tsx`, `applyTransform.ts`, `fontService.ts`, `SceneReconciler.ts`, `TextEditOverlay.tsx`, `PropertiesPanel.tsx`, `TransformationControls.tsx`, schema.

**Không có migration:** tài liệu đã lưu đọc được nguyên vẹn; chỉ hình hiển thị đổi.

**Ròng:** xoá nhiều hơn thêm — bỏ hẳn bộ máy arc-length, tiếp tuyến, và co path.
