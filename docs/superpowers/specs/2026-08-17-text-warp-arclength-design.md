# Warp text theo arc length — bám hình ảnh Kittl

> Ngày: 2026-08-17. Thay thế mô hình vertical-displacement trong
> `2026-08-17-text-wave-vertical-displacement-design.md`.
> Bằng chứng thực nghiệm: `docs/kittl-warp-reverse-engineered.md`.

## 1. Mục tiêu và ranh giới

**Mục tiêu:** kết quả hiển thị của warp `wave` tương đương Kittl về mặt thị giác.

**Giữ lại những chỗ ta làm tốt hơn Kittl** (đã chốt với người dùng):

- chia nhỏ Bézier để sai số hình ≤ 0.05 px, thay vì map thẳng control point như
  Kittl (sai số đo được 1–2 px);
- số anchor tuỳ ý trên warp path, không chốt cứng 3 anchor;
- `node.size` cố định, không chạy theo hình đã warp ⇒ không có vòng lặp điểm
  bất động như Kittl.

**Đã chốt — ngoài phạm vi lần này:** chỉ làm `wave`. `arch` / `rise` / `flag` /
`angle` vẫn trả `null` như hiện tại (dữ liệu preset của Kittl đã có trong
`docs/kittl-warp-reverse-engineered.md` §4.3 cho lần sau).

Không thêm dependency. Không đụng `freeForm`/`circle`.

---

## 2. Mô hình toán học

### 2.1 Ký hiệu

Tất cả trong không gian layout (px, gốc góc trên-trái hộp text, `y` hướng xuống):

|             |                                                          |
| ----------- | -------------------------------------------------------- |
| `W`, `H`    | `layout.width`, `layout.height` — hộp text **chưa** warp |
| `path`      | warp path chuẩn hoá theo `{W, H}`, đã qua `clampPathX`   |
| `P(s)`      | điểm trên path tại **độ dài cung** `s`, `s ∈ [0, L]`     |
| `L`         | tổng độ dài cung của path                                |
| `baselineY` | tung độ baseline thật của layout (px), độc lập với path  |
| `k`         | `L / W` — hệ số kéo giãn ngang                           |

`clampPathX` đã bảo đảm anchor đầu ở `x = 0`, anchor cuối ở `x = 1`, và `Bx'(t) ≥ 0`
trên mọi đoạn (chứng minh ở spec cũ §2.3). Suy ra `P(0).x = 0`, `P(L).x = W`, và
`P_x` không giảm theo `s`.

### 2.2 Phép biến đổi

```text
s      = clamp(k·x, 0, L)
(x, y) ↦ ( P(s).x ,  P(s).y + (y − baselineY) )
```

Viết lại thành hai hàm một biến — đây là dạng dùng để cài đặt:

```text
X(x) = P(clamp(k·x, 0, L)).x                 // hoành độ mới
D(x) = P(clamp(k·x, 0, L)).y − baselineY     // độ dời dọc

(x, y) ↦ ( X(x), y + D(x) )
```

`D` neo vào `baselineY` (baseline thật của layout), không phải `P(0).y` (điểm
đầu path). Lý do: baseline phải **trùng đúng** giá trị `y` của path tại vị trí
tương ứng — nếu neo vào `P(0).y`, dịch cả path lên/xuống sẽ không đổi kết quả
gì (`D` bất biến theo tịnh tiến dọc của path), khiến đường path vẽ trên canvas
và baseline chữ thực tế lệch nhau một khoảng cố định, không "dính" vào nhau.
Neo vào `baselineY` thì kéo path lên/xuống sẽ kéo chữ theo đúng như vậy.

So với mô hình cũ `(x, y) ↦ (x, y + f(x))`: `D` đóng đúng vai trò của `f`, và
`X` là phần **mới**. Mô hình cũ là trường hợp riêng `X(x) = x`.

### 2.3 Vì sao có hệ số `k`

Kittl đặt lại chiều rộng layout của chữ bằng `L` mỗi lần path đổi
(`untransformedWidth ← getLineLength(...)`, có ở cả `updateActiveTransform` lẫn
`setTransformPoints`). Hệ quả: chữ bị kéo giãn ngang hệ số `L/W` **trước**, rồi
phép trải theo arc length bóp lại ⇒ chữ phủ kín path và bề ngang tổng thể không đổi.

Ta không copy vòng lặp đó; đặt thẳng `k = L/W` cho ra cùng kết quả ở dạng đóng.

**Hai bất biến, đúng theo cấu trúc chứ không phải xấp xỉ:**

- `X(0) = P(0).x = 0`
- `X(W) = P(k·W).x = P(L).x = W`

Cộng với `X` không giảm ⇒ `X` ánh xạ `[0, W]` lên đúng `[0, W]`. Chữ không bao
giờ tràn ra ngoài hộp layout, cũng không bao giờ co lại — khớp đúng số đo trên
Kittl (bề ngang mực 424.7 px bất biến từ curve 25 % → 200 %).

### 2.4 Hiệu ứng thị giác

`dX/dx = k · cos θ(s)` với `θ` là góc tiếp tuyến.

- Chỗ path thoải (`θ ≈ 0`): `dX/dx ≈ k > 1` ⇒ chữ **giãn** ra.
- Chỗ path dốc: `cos θ` nhỏ ⇒ chữ **nén** lại.
- Tích phân trên toàn `[0, W]` bằng đúng `W` ⇒ tổng không đổi.

Đã đối chiếu: ở Arch 100 %, chữ `H` hai đầu hẹp rõ so với chữ `H` giữa, tổng
bề ngang bằng lúc phẳng.

`y` chỉ vào công thức đúng một lần, dưới dạng cộng thêm ⇒ **không có phép xoay**,
nét dọc vẫn dọc tuyệt đối. Giống Kittl (đo được `Δx = 0` chính xác).

### 2.5 Trường hợp phẳng phải là phép đồng nhất TUYỆT ĐỐI

Path phẳng nằm đúng baseline ⇒ `L = W`, `k = 1`, `P(s) = (s, baselineY)` ⇒
`(x, y) ↦ (x, y)`.

Về mặt số thì `X(x) = x` **không** đúng tuyệt đối vì `P_x` được tra qua bảng.
Mô hình cũ không gặp chuyện này (mọi mẫu `y` bằng nhau nên `f ≡ 0` chính xác).

**Bắt buộc:** `buildWarpMap` phải phát hiện path phẳng (mọi `y` của anchor và
handle bằng `baselineY` trong `EPSILON`) và trả `null`; `textGeometry` bỏ qua
warp hoàn toàn. Đây là điều kiện để test hiện có
`'wave voi intensity = 0 la phep dong nhat'` tiếp tục đúng.

### 2.6 Điểm suy biến

Ở chỗ path có tiếp tuyến thẳng đứng, `cos θ = 0` ⇒ `X` phẳng cục bộ ⇒ glyph bị
bóp về bề ngang 0. `clampPathX` cho phép `Bx' = 0` nên trạng thái này đạt được.
Kittl y hệt. Chấp nhận, không thêm ràng buộc UI.

---

## 3. Tính chính xác — vì sao vẫn giữ được subdivision

Đây là phần quyết định việc ta có giữ được lợi thế so với Kittl hay không.

### 3.1 Mở rộng chứng minh affine-exactness

Trên một đoạn cubic của contour, xấp xỉ `X` và `D` bằng **hai** hàm affine:

```text
Lx(x) = αx + βx·x     nội suy X tại hai đầu mút on-curve
Ly(x) = αy + βy·x     nội suy D tại hai đầu mút on-curve
```

Khi đó phép biến đổi thu hẹp trên đoạn đó là một **phép affine của mặt phẳng**:

```text
x' = αx + βx·x + 0·y
y' = αy + βy·x + 1·y
```

ma trận `[[βx, 0], [βy, 1]]`, tịnh tiến `(αx, αy)`.

Cơ sở Bernstein có tổng bằng 1, nên với mọi phép affine `A`, đường
`A(B(t))` chính là đường Bézier có control point `A(c_i)`. **Chính xác tuyệt đối**,
không phải xấp xỉ. Chứng minh cũ (spec cũ §5.1.2) là trường hợp riêng `βx = 0`
của đúng lập luận này, nên nó **được mở rộng, không bị mất hiệu lực**.

### 3.2 Nội suy tại đầu mút, không phải dây cung

Giữ nguyên quy tắc cũ, cho cả `Lx` lẫn `Ly`: hệ số lấy từ giá trị tại hai đầu mút
**on-curve** của đoạn (`bx[0]`, `bx[3]`), **không** phải dây cung trên khoảng
`[xa, xb]` mở rộng theo cực trị.

Lý do không đổi: điểm nối hai đoạn kề nhau chỉ được lưu **một lần** trong
`Contour`; hai bên phải cho cùng một giá trị tại hoành độ đó, nếu không contour
hở ở những glyph tròn (`o`, `e`).

### 3.3 Đo sai số và chia nhỏ

Khoảng hoành độ thật của đoạn `[xa, xb]` = hai đầu mút + các cực trị của `Bx`
(giữ nguyên `extrema()` hiện có). Lấy 5 mẫu đều trên `[xa, xb]`:

```text
err = max( |X(x) − Lx(x)| , |D(x) − Ly(x)| )
```

`err > WARP_TOL` ⇒ `splitCubic` tại `t = 0.5`, đệ quy, chặn ở `MAX_DEPTH`.

`WARP_TOL = 0.05` px (bằng `DISPLACE_TOL` cũ). `MAX_DEPTH = 10` (giữ nguyên, lý
do đã ghi trong comment hiện tại).

**Khác biệt so với hiện tại:** đo sai số trên **hai** trục thay vì một. Đoạn nào
`X` cong nhiều hơn `D` sẽ bị chia sâu hơn — số segment đầu ra tăng, đó là cái giá
đúng của việc thêm thành phần ngang.

### 3.4 Đoạn gần thẳng đứng

`|dx| < MIN_DX` (1e-6): đặt `βx = βy = 0`, `αx = X(bx[0])`, `αy = D(bx[0])`.

Nghĩa hình học: cả đoạn có chung một `x` nên có chung một `s`, ánh xạ về đúng một
hoành độ — nét dọc vẫn dọc, đúng như mong muốn. (Lưu ý đây là chỗ khác cũ: trước
đây `x` giữ nguyên, giờ `x` bị ghi thành hằng `X(bx[0])`.)

---

## 4. Bảng tra arc length

### 4.1 Xây bảng

Thay `sampleSegment` hiện tại. Với mỗi đoạn cubic của warp path, chia đôi đệ quy
cho tới khi dây cung xấp xỉ cung trong `LUT_TOL` trên **cả hai** trục:

```text
flat  ⟺  ∀ t ∈ {¼, ½, ¾}:  khoảng cách vuông góc từ P(t) tới đường thẳng
                            qua hai đầu mút  ≤  LUT_TOL
```

So sánh theo tham số `t` với dây cung sẽ coi một đoạn **thẳng** có tham số hoá
không đều là "cong", chia nhỏ tới hết độ sâu mà không được gì; khoảng cách vuông
góc thì độc lập với tham số hoá.

Bảng gồm ba mảng song song: `us[]` (độ dài cung tích luỹ), `xs[]`, `ys[]`.
`us[0] = 0`, `us[i] = us[i−1] + |p_i − p_{i−1}|`. `L = us[last]`.

`LUT_TOL = 0.01` px (giữ nguyên).

### 4.2 Tra bảng

`X(x)` / `D(x)`: `s = clamp(k·x, 0, L)` → nhị phân trên `us` → nội suy tuyến tính
`xs`/`ys` → trả về. Ngoài khoảng thì kẹp về đầu mút.

Giữ nhánh phòng thủ hiện có: nếu `us` không tăng nghiêm ngặt ở đâu đó (đoạn suy
biến độ dài 0), bỏ qua mẫu trùng khi dựng bảng thay vì để nhị phân mất nghĩa.
`xs` **không** cần đơn điệu để tra bảng đúng nữa — chỉ số là `s`, không phải `x`.
Đây là một điểm đơn giản hơn mô hình cũ.

### 4.3 Sai số `L` và ảnh hưởng tới `k`

Tổng dây cung **thiếu** so với độ dài cung thật. Với `LUT_TOL = 0.01` px, sai số
mỗi đoạn phẳng cỡ `O(tol²/chord)`, tổng dưới 0.05 px trên path cỡ vài trăm px.

`k = L/W` sai `ε/W` ⇒ mép phải chữ lệch khỏi `W` cỡ `ε`. Ràng buộc nghiệm thu:
`|X(W) − W| < 0.1` px. Nếu test này hỏng thì siết `LUT_TOL`, không phải sửa mô hình.

---

## 5. Thay đổi theo file

### 5.1 `src/text/warp.ts`

**Xoá:** `buildDisplacement`, `sampleSegment`, `displaceContours`,
`displaceSegment`, `displaceContour`, `pushDisplaced`, `DISPLACE_TOL`.

**Giữ nguyên:** `segmentsOf`, `clampPathX`, `EPSILON`, `Point`, `Segment`.

**Thêm:**

```ts
export interface WarpMap {
  X(x: number): number; // hoành độ mới
  D(x: number): number; // độ dời dọc
  L: number; // độ dài cung
  k: number; // L / W
}

// null = path phẳng tại baseline ⇒ caller bỏ qua warp (§2.5)
export function buildWarpMap(path: WarpPath, size: Size, baselineY: number): WarpMap | null;

export function warpContours(shapes: GlyphShape[], map: WarpMap): GlyphShape[];
```

**Đổi chữ ký:**

```ts
// curveHeight thay intensity; cần fontSize để đổi biên độ px -> chuẩn hoá.
export function buildWavePath(
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath;
```

Hình dạng wave giữ nguyên bộ hệ số hiện có, nhưng:

1. biên độ `a` chọn sao cho **khoảng dao động dọc** (max `y` − min `y`) bằng
   `|curveHeight| · fontSize`. Hình hiện tại có khoảng dao động `1.4·a` (từ
   `b − 0.4a` tới `b + a`) ⇒ `a = |curveHeight| · fontSize / 1.4 / boxHeight`
   (chuẩn hoá theo `boxHeight`);
2. dịch cả path sao cho **trung điểm** khoảng dao động nằm đúng baseline — nhờ
   vậy `curveHeight = 0` cho path phẳng tại baseline, tức phép đồng nhất (§2.5).
   Kittl giữ trung điểm ở chỗ cũ; ta neo vào baseline, đây là sai lệch có chủ ý;
3. `curveHeight < 0` ⇒ lật dấu toàn bộ độ lệch `y` quanh baseline.

### 5.2 `src/text/textGeometry.ts`

```ts
export function resolveWarpPath(
  node: TextNode,
  baselineRatio: number,
  boxHeight: number,
): WarpPath | null;
```

`fontSize` lấy từ `node.font.size` bên trong. Nhánh `stored` không đổi (vẫn
`clampPathX`). Nhánh preset gọi `buildWavePath(warp.curveHeight, …)`.

`textGeometry` đổi thành:

```ts
const path =
  layout.height > 0 ? resolveWarpPath(node, layout.baselineY / layout.height, layout.height) : null;
const map = path
  ? buildWarpMap(path, { width: layout.width, height: layout.height }, layout.baselineY)
  : null;
const shapes = map ? warpContours(layout.shapes, map) : layout.shapes;
```

`shapesBounds`, `measureText`, `TextGeometry` **không đổi**. Bình luận ở
`TextGeometry.width/height` (dòng 10–14) vẫn đúng nguyên văn và giờ càng quan
trọng hơn: `W` là mẫu số của `k`, nếu lấy bbox sau warp thì thành vòng lặp.

### 5.3 `src/schema/warp.ts`

```ts
export const WarpSchema = z.object({
  type: WarpTypeSchema,
  curveHeight: z.number().min(-1).max(4),
  paths: z.array(WarpPathSchema).optional(),
});
```

`intensity` bị xoá. Tài liệu cũ: nhận `intensity` như bí danh đọc-vào của
`curveHeight` (cùng con số, kẹp về `[-1, 4]`). Với tài liệu ở chế độ preset,
hình sẽ **đổi nhẹ** — chấp nhận được vì repo chưa phát hành. Tài liệu đã có
`paths` thì path thắng, không đổi gì.

### 5.4 `src/ui/TransformationControls.tsx`

- `DEFAULT_WARP_INTENSITY` → `DEFAULT_WARP_CURVE_HEIGHT` (giá trị `0.5`).
- `setWarpCurveHeight` thay `setWarpIntensity`, kẹp `[-1, 4]`.
- Slider: `min={-1} max={4} step={0.01}`, nhãn `{Math.round(curveHeight * 100)}%`.

Ghi chú: slider của Kittl là **−100 %…+100 %** (đã quan sát giá trị −61 %); vượt
±100 % chỉ đạt được bằng cách kéo handle. Ta mở dải lên **−100 %…400 %** theo
yêu cầu — dải dương rộng hơn vì đó là chiều dùng thật, chiều âm chỉ để lật cong.

Ở `curveHeight = 4`, biên độ dọc bằng 4× fontSize ⇒ path rất dốc ⇒ `cos θ` nhỏ ở
hai đầu ⇒ glyph hai mép bị bóp rất hẹp. Đây là hành vi đúng của mô hình, không
phải lỗi; nhưng nó đẩy `MAX_DEPTH` và độ chính xác LUT tới hạn — xem §7.4.

### 5.5 `src/ui/WarpHandlesOverlay.tsx`

- Trong patch `UpdateProps`: `intensity` → `curveHeight`.
- **Thêm:** sau khi kéo handle, ghi lại `curveHeight` suy ra từ path mới —
  `(max y − min y) · boxHeight / fontSize`, giữ dấu theo chiều path. Kittl làm
  đúng việc này trong `setPoints`; không có nó thì slider và handle lệch nhau.

### 5.6 `src/render/renderers/textRenderer.ts`

Không đổi — nó chỉ tiêu thụ `textGeometry(...).shapes`.

---

## 6. Bất biến nghiệm thu

| #   | Bất biến                                                                                  | Cách kiểm                      |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------ |
| I1  | `curveHeight = 0` ⇒ shapes **y hệt** bản chưa warp                                        | so sánh sâu, không dung sai    |
| I2  | `X(0) = 0` và `\|X(W) − W\| < 0.1` px                                                     | gọi thẳng `WarpMap`            |
| I3  | Bề ngang bbox sau warp lệch < 0.5 px so với trước warp, ở `curveHeight ∈ {0.25, 1, 2, 4}` | `shapesBounds`                 |
| I4  | Không xoay: hai điểm cùng `x` ⇒ cùng `x'`, và hiệu `y` giữ nguyên chính xác               | dựng contour thử               |
| I5  | Contour kín vẫn kín sau warp (điểm đầu ≡ điểm cuối, 1e-9)                                 | glyph `o`                      |
| I6  | Sai số hình ≤ `WARP_TOL`: lấy 20 mẫu/cubic, so ảnh thật của cung với cubic đã map         | so với `map` áp trực tiếp      |
| I7  | `X` không giảm trên `[0, W]` (1000 mẫu)                                                   | `WarpMap`                      |
| I8  | Nén cục bộ: ở `curveHeight = 1`, glyph gần mép hẹp hơn cùng glyph đó ở giữa               | text `HHHHHHHHH`               |
| I9  | Không glyph nào chồng lên glyph kề: `X` đơn điệu ⇒ thứ tự hoành độ giữ nguyên             | suy ra từ I7, cần test hồi quy |

I8 và I3 là hai bất biến **mới** đặc trưng cho mô hình arc length — chúng chính
là cái mô hình cũ không có. I9 là bảo đảm cũ (comment cuối `displaceContours`)
bị **yếu đi**: trước đây hoành độ không bao giờ bị ghi nên va chạm glyph là bất
khả thi về mặt toán học; giờ nó chỉ còn đúng nhờ tính đơn điệu của `X`, mà tính
đơn điệu ấy lại dựa vào `clampPathX`. Comment đó phải viết lại cho đúng.

---

## 7. Rủi ro đã biết

1. **Hiệu năng.** `textGeometry` được gọi cả ở renderer lẫn `SelectionOverlay`
   mỗi frame. Bảng LUT giờ nặng hơn (hai trục) và `warpContours` chia sâu hơn.
   Cùng bậc độ phức tạp với hiện tại, chưa memo hoá — nếu đo thấy chậm thì xử lý
   riêng, ngoài phạm vi spec này.
2. **Số segment đầu ra tăng** ⇒ export SVG dài hơn. Không có ngưỡng cứng.
3. **Migration hình ảnh** cho tài liệu chế độ preset (§5.3).
4. **Đã đo ở `curveHeight = 4`**: thuật toán tự hội tụ ở depth `8`; `MAX_DEPTH` đặt `9`.
