# Kittl "Distort" — công thức thật (reverse-engineered)

> Ngày: 2026-08-20. Nguồn: runtime của `app.kittl.com` (Chrome extension, tài khoản đã đăng
> nhập sẵn), đọc qua React fiber → `fabric.Canvas` instance (kỹ thuật giống hệt
> `kittl-circle-reverse-engineered.md` §1) và đo thực nghiệm trên `plugin.toObject()` +
> `obj.layoutedPaths` thật, cả bằng cách kéo tay UI thật lẫn set point trực tiếp qua JS.
>
> **Cảnh báo phương pháp:** set `controlPoints`/`activeRenderPlugins` trực tiếp qua JS (bỏ qua
> UI) đã làm crash runtime của Kittl một lần trong phiên đo này ("Ooops, something bad
> happened") và để lại object ở trạng thái hỏng (đổi nhầm sang preset `flag`) sau khi
> refresh — dữ liệu từ nhánh đó đã bị loại bỏ hoàn toàn, không dùng trong tài liệu này. Mọi số
> liệu dưới đây chỉ lấy từ (a) đọc `toObject()`/`controlPoints` (read-only, an toàn) và (b) kéo
> tay thật qua UI (`left_click_drag` trên handle) rồi đọc lại — không set point qua JS.

---

## 0. Tóm tắt cho người ra quyết định

**Distort dùng tên nội bộ `"freeForm"`** (không phải `"distort"`), class minified `Bf`.
Giống Circle, đây **không phải** cùng cơ chế `buildWarpMap`/`warpContours` của
Wave/Arch/Rise/Flag/Angle (1 path, biến dạng theo từng điểm dọc 1 đường). Distort dùng **2
đường cong độc lập — biên TRÊN và biên DƯỚI của khung chữ** — đúng như kiến trúc "envelope
warp" mà `text-future-work.md` §4 đã dự đoán trước khi có số liệu thật.

| Tính chất | Distort (`freeForm`) | Warp (Wave/Arch/...) | Circle |
|---|---|---|---|
| Tên nội bộ | `freeForm` | (theo preset) | `circle` |
| Số control point | **10** (5 trên + 5 dưới) | 7 (hoặc 2 cho Angle) | 4 |
| Đơn vị biến đổi | Đường cong 2 biên (top/bottom), glyph nội suy giữa 2 biên | Từng điểm contour theo 1 path | Cả glyph (rigid) |
| Có slider "Curve %" không | **Không** | Có (`curveHeight`) | Không |
| Trạng thái mặc định (chưa kéo) | **Phẳng tuyệt đối** (hình chữ nhật, không có gợi ý cong) | Phẳng (`curveHeight=0`) hoặc theo preset | Có bán kính mặc định (không phải phẳng) |
| Chuẩn hoá điểm | `[-0.5, 0.5]` theo bbox — **bbox tự tính lại theo hình đã méo**, xem §2 | `[-1, 1]` hoặc tương tự, theo `width/height` cố định lúc tạo | Theo `(width, height)` |

---

## 1. Cách lấy instance thật

Giống hệt `kittl-circle-reverse-engineered.md` §1 (đi qua React fiber tìm `fabric.Canvas`
instance, không patch được `prototype.renderAll` trực tiếp ở build hiện tại). Từ đó:

```js
const obj = canvas.getObjects().find(o => o.text === 'DISTORTTEST');
const plugin = obj.pluginManager.activeTransformPlugin; // class "Bf"
plugin.toObject(); // { id, name: "freeForm", points: [...10 điểm...], version: "v1" }
```

`plugin.getControls()` trả về đúng 11 control: 1 `transformLine` (`actionName:
"bounding-box-line"`) + 10 `transformPoint-0` .. `transformPoint-9` (`actionName:
"point-transform"`).

---

## 2. Cấu trúc 10 control point

Đo `toObject().points` của một Distort **vừa bấm, chưa kéo gì**:

```js
points: [
  { x: -0.5, y: -0.5 },   // 0
  { x:  0.0, y: -0.5 },   // 1
  { x:  0.5, y: -0.5 },   // 2
  { x:  0.5, y:  0.5 },   // 3
  { x:  0.0, y:  0.5 },   // 4
  { x: -0.5, y:  0.5 },   // 5
  { x: -0.25,y: -0.5 },   // 6
  { x:  0.25,y: -0.5 },   // 7
  { x: -0.25,y:  0.5 },   // 8
  { x:  0.25,y:  0.5 },   // 9
]
```

**Trạng thái mặc định là hình chữ nhật PHẲNG TUYỆT ĐỐI** — tất cả điểm nằm đúng
`y = ±0.5`, không có bump/gợi ý cong nào (khác với Custom warp của editor này, nơi
`CUSTOM_INIT_CURVE_HEIGHT` cố tình nâng điểm giữa lên để dễ thấy handle — Kittl Distort không
làm vậy).

Ánh xạ index → vị trí handle trên màn hình (xác nhận bằng cách đo toạ độ pixel của 10 chấm
handle rồi so khớp thứ tự x tăng dần trên mỗi biên):

```
Biên TRÊN (y=-0.5): index theo x tăng dần = 0 (góc trái), 6 (1/4 trái), 1 (giữa), 7 (1/4 phải), 2 (góc phải)
Biên DƯỚI (y=+0.5): index theo x tăng dần = 5 (góc trái), 8 (1/4 trái), 4 (giữa), 9 (1/4 phải), 3 (góc phải)
```

Tức: **mỗi biên (trên/dưới) có đúng 5 điểm, chia đều theo x ở 4 mốc 0%, 25%, 50%, 75%, 100%
của bề rộng** — không có điểm nào ở biên trái/phải (không giống Circle có 4 điểm W/N/S/E).
Đây là bằng chứng trực tiếp cho mô hình "2 đường cong top/bottom", không phải "khung bao 4
góc" như dự đoán ban đầu (rất thô) trong `text-future-work.md` §5 bảng liệt kê effect.

**Không có trường `handles`/tangent riêng** trong `toObject()` — chỉ có toạ độ điểm thô. Cho
nên khả năng cao đường cong qua 5 điểm mỗi biên là một spline TỰ SUY TANGENT (kiểu
Catmull-Rom hoặc tương đương), không phải Bezier với handle lưu tường minh như quy ước 7-điểm
của Wave. **Đây là suy luận từ cấu trúc dữ liệu, chưa verify được công thức spline chính xác**
— xem §5.

---

## 3. Chuẩn hoá điểm là ĐỘNG — bbox tự tính lại theo hình đã méo (quan trọng, dễ hiểu sai)

Kéo tay thật (UI) góc trên-trái (index 0) lên trên và sang trái. Đọc lại `toObject()`:

```js
// TRƯỚC (flat):
points[0] = {x:-0.5, y:-0.5}
points[1] = {x: 0.0, y:-0.5}   // top-mid, KHÔNG đụng tới
points[2] = {x: 0.5, y:-0.5}   // top-right corner, KHÔNG đụng tới
points[6] = {x:-0.25,y:-0.5}
points[7] = {x: 0.25,y:-0.5}
// (3,4,5,8,9 ở biên dưới, không đụng)

// SAU khi kéo CHỈ điểm 0 (đo 2 lần độc lập, ra cùng một dạng số):
points[0] = {x:-0.5017, y:-0.5135}   // gần như y hệt (-0.5,-0.5) — điểm bị kéo
points[1] = {x: 0.0655, y: 0.1814}   // ĐỔI cả x lẫn y dù không hề đụng tới!
points[2] = {x: 0.5,    y: 0.1814}   // ĐỔI y dù không đụng tới!
points[6] = {x:-0.1516, y: 0.1814}
points[7] = {x: 0.2827, y: 0.1814}
// obj.width: 448 → 516,  obj.height: 53 → 165
```

Điểm 1, 2, 6, 7 (toàn bộ các điểm TRÊN còn lại) đổi giá trị chuẩn hoá dù người dùng không hề
kéo chúng — vì `obj.width`/`obj.height` (mẫu số chuẩn hoá) **tự phình ra để bao trọn hình đã
méo** sau mỗi lần kéo. Vị trí PIXEL tuyệt đối của các điểm không bị kéo không đổi — chỉ có
biểu diễn chuẩn hoá `[-0.5,0.5]` của chúng đổi vì khung tham chiếu đổi.

**Hệ quả cho implementation:** không thể lưu 10 điểm theo quy ước "chuẩn hoá cố định theo
kích thước phẳng ban đầu" giống 7-điểm của Wave — phải hoặc (a) chuẩn hoá theo `advanceWidth`
+ `height` CỐ ĐỊNH của layout gốc (không đổi theo hình đã méo, khác cách Kittl làm), hoặc (b)
chấp nhận renormalize động như Kittl nhưng phải tự cài lại đúng logic "bbox = bao hình đã
méo" — phương án (a) đơn giản hơn nhiều và không có nhược điểm rõ ràng, xem `implement.md`.

---

## 4. Biên trên/dưới độc lập nhau

Trong toàn bộ các lần kéo tay đo được, chỉnh điểm ở biên TRÊN (index 0,1,2,6,7) **không bao
giờ** làm đổi giá trị của biên DƯỚI (index 3,4,5,8,9), và ngược lại (đã kiểm bằng kéo thật góc
trên-trái, đọc lại — 5 điểm biên dưới giữ nguyên tuyệt đối `{x, y:0.5}` với x đúng 0%, 25%,
50%, 75%, 100%). Hai đường cong độc lập hoàn toàn về mặt lưu trữ.

---

## 5. Hình dạng đường cong — quan sát bằng mắt, CHƯA đo được công thức chính xác

Kéo góc trên-trái lên cao, chụp zoom đúng vùng handle: đường nối 5 điểm biên trên hiện ra là
một **đường cong mượt** (không phải các đoạn thẳng gãy khúc nối 2 điểm liền kề) — bẻ cong rõ
rệt gần điểm bị kéo rồi thoải dần về phía các điểm không bị kéo. Glyph chữ ở vùng cong gấp bị
nén/xô lệch mạnh (quan sát trực quan qua canvas, không đo pixel chính xác).

**Đã thử nhưng KHÔNG lấy được dữ liệu tin cậy:** hook `prototype.transform` để bắt input/output
contour thật (kỹ thuật đã dùng thành công cho Wave/Circle) — lần này bị lỗi cấu trúc args
(`layoutResult` không có `styleRunPaths` ở lệnh gọi đầu, gây exception làm hỏng luôn
`prototype.transform` gốc, phải reload trang). Set `controlPoints` trực tiếp qua
`plugin.setPoints()` bằng JS rồi gọi `clearLayoutResult()+prepareLayout()` **không** làm
`obj.layoutedPaths` thay đổi (`obj.activeRenderPlugins` rỗng khi thao tác qua JS thuần, khác
hẳn khi thao tác qua UI thật) — cố ép thêm bằng cách set `obj.isTransformEditing`/
`obj.activeRenderPlugins` trực tiếp đã làm **crash runtime** ("Ooops, something bad happened").

**Kết luận trung thực: KHÔNG có công thức toán học nào của việc glyph nội suy giữa 2 đường
cong top/bottom được xác minh bằng số liệu thật trong tài liệu này.** Chỉ có bằng chứng định
tính (quan sát mắt qua canvas): đường cong mượt qua 5 điểm, glyph bị nén ở vùng cong gấp.
Không suy đoán công thức nội suy (kiểu bilinear `t=(y-topY)/(bottomY-topY)` từng được nêu ở
`text-future-work.md` §4) là **đúng của Kittl** — đó là một THIẾT KẾ RIÊNG hợp lý cho
implementation của ta, không phải số đo từ Kittl. Xem `implement.md` để tách rõ 2 việc này.

---

## 6. UI — không có slider Curve %

Khác Wave/Arch/Rise/Flag/Angle (đều có slider `<Tên> Curve %`), panel Distort chỉ có **Reset**
và **Confirm**, không có slider nào. Biến dạng hoàn toàn qua kéo tay 10 handle. Xác nhận qua
screenshot UI thật (`docs/` không lưu ảnh, xem lịch sử phiên đo).

---

## 7. Chưa đo / chưa chắc chắn — liệt kê tường minh

- **Công thức spline chính xác** qua 5 điểm mỗi biên (Catmull-Rom? cubic Bezier tự suy
  tangent? Hermite?) — chỉ quan sát "mượt, không gãy khúc" bằng mắt, chưa fit số liệu.
- **Công thức nội suy glyph giữa 2 đường cong top/bottom** — hoàn toàn chưa đo được (xem §5).
  Đây là phần quan trọng nhất còn thiếu.
- **Hành vi khi text dài hơn / ngắn hơn khung** (clip? scale? tự relayout?) — chưa test được
  (double-click vào node để sửa text bị nhầm thao tác trong phiên đo, không kịp làm lại).
- **Tương tác với `letterSpacing`** — chưa test.
- **Text nhiều dòng (`\n`)** — chưa test, chỉ test 1 dòng.
- **Độ tự do trục x của các điểm góc khi kéo** — số liệu đo được cho thấy khi kéo góc theo
  hướng chéo, x của điểm đó gần như không đổi so với flat (`-0.5017` so với `-0.5`) trong khi
  y đổi mạnh (`-0.5135`) — nhưng chưa tách bạch được đây là do UI khoá trục hay do thao tác
  kéo chuột của ta chưa đủ lệch theo x. Không kết luận.
