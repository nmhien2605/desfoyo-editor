# Kittl "Circle Text" — công thức thật (reverse-engineered)

> Ngày: 2026-08-19. Nguồn: runtime của `app.kittl.com` (Chrome, tài khoản đã đăng nhập sẵn),
> đọc qua `window.fabric` + `window.webpackChunk_repo_editor` (module chứa `curveHeight` —
> id đã đổi thành `91252` ở build hiện tại, trước là `70645` trong
> `kittl-warp-reverse-engineered.md`) và đo thực nghiệm trên `plugin.transform()` thật.
> Phương pháp giống hệt tài liệu Wave (`kittl-warp-reverse-engineered.md` §1), chỉ khác:
> class prototype không patch được ngay do build mới bind method khác — phải tìm
> `fabric.Canvas` instance qua React fiber tree (xem §1) thay vì hook `renderAll`.

---

## 0. Tóm tắt cho người ra quyết định

**Circle Text KHÔNG dùng chung cơ chế với Wave/Arch/Rise/Flag/Angle.** Nhóm "warp"
(`Bp`/`Bt`-tuỳ build) áp một hàm `(x,y) → (X(x), y+D(x))` lên **từng điểm** của contour, không
xoay glyph (đã chứng minh trong tài liệu Wave §5.1). **Circle áp một phép RIGID TRANSFORM
(xoay + tịnh tiến, KHÔNG méo) cho TỪNG GLYPH nguyên khối** — đo được sai số giữa hình dạng
glyph trước/sau xoay là **~1e-13** (bằng 0, tức tuyệt đối chính xác, không phải xấp xỉ).

Nghĩa là: `warpContours()`/`buildWarpMap()` hiện có (thao tác trên từng điểm contour) **không
tái dùng được cho Circle** — Circle cần một hàm mới, hoạt động ở mức **glyph** (đặt cả glyph
bằng một phép quay quanh tâm vòng tròn), không phải mức điểm.

| Tính chất | Circle | Warp (Wave/Arch/Rise/Flag/Angle) |
|---|---|---|
| Đơn vị biến đổi | Cả glyph (rigid: rotate+translate) | Từng điểm contour |
| Glyph có bị xoay không | **Có**, xoay đúng góc tiếp tuyến | Không (đã chứng minh) |
| Tham số hoá | Arc-length trên **đường tròn thật** (`s = R·θ`) | Arc-length trên polybezier |
| Số control point lưu | 4 (W, N, S, E — không phải 7) | 7 (hoặc 2 cho Angle) |
| Có slider "Curve" không | **Không** — chỉ có toggle "Direction Inverted" | Có (`curveHeight`) |
| Bán kính điều khiển bằng | Kéo tay 1 trong 4 điểm W/N/S/E (đổi bán kính cả vòng) | N/A |
| Text dài hơn "path" thì sao | **Chồng lên chính nó** (wrap qua 360°, KHÔNG cắt) | Bị **cắt** (clip), biến mất phần dư (đã đo ở Angle) |
| Vị trí bắt đầu (s=0) | **Luôn ở điểm Nam (đáy vòng tròn, 6 giờ)**, bất kể bán kính | `pts[0]` (anchor đầu, do user/preset đặt) |

---

## 1. Cách lấy instance thật (khác chút so với tài liệu Wave)

Build hiện tại của Kittl không cho `fabric.Canvas.prototype.renderAll` chạy qua path patch
được nữa (canvas instance có thể đã bind method riêng trước khi ta patch). Cách lấy
instance ổn định hơn: đi qua **React fiber** gắn trên DOM:

```js
const lc = document.querySelector('canvas.lower-canvas');
let el = lc, fiber = null;
while (el && !fiber) {
  const key = Object.keys(el).find(k => k.startsWith('__reactFiber'));
  if (key) fiber = el[key]; else el = el.parentElement;
}
// fabric canvas instance nằm trong memoizedState (hook state) của một fiber tổ tiên —
// duyệt fiber.memoizedState.next... tới khi gặp object có .getObjects + .lowerCanvasEl
```

Từ đó: `canvas.getObjects().find(o => o.text === '...')`, rồi
`obj.pluginManager.activeTransformPlugin` — object này (class tên minified, ví dụ `Bt`
ở build hiện tại) chính là plugin Circle, `toObject()` cho `{ name: "circle", version: "v1",
points: [...4 điểm...], directionInverted }`.

Ép layout chạy lại (để bắt `transform()` qua patch) dùng đúng 2 hàm đã biết từ tài liệu Wave:

```js
obj.clearLayoutResult();
obj.prepareLayout();
```

---

## 2. Cấu trúc 4 control point

```js
plugin.controlPoints // == plugin.points (getter trỏ tới cùng mảng)
// [ W, N, S, E ] — CHUẨN HOÁ theo (width, height) của bbox text, TÁCH TRỤC
// (x chia width, y chia height — giống hệt quy ước 7-điểm của Wave)
```

Đo được (`toObject()` một circle mới tạo, text "CIRCLETEST", trước khi chỉnh gì):

```js
points: [
  { x: -0.359, y: -0.215 },  // W (west)
  { x:  0.517, y: -0.834 },  // N (north)
  { x:  0.517, y:  0.404 },  // S (south)
  { x:  1.394, y: -0.215 },  // E (east)
]
```

Kiểm chứng bằng số (đúng tuyệt đối theo bbox width/height thật lúc đo, ví dụ W=333.32,
H=246.92 px):

- `(N.x, S.x)` bằng nhau ⇒ đường thẳng đứng qua tâm.
- `(W.y, E.y)` bằng nhau ⇒ đường thẳng ngang qua tâm.
- `r_h = (E.x − W.x)/2 · width` và `r_v = (S.y − N.y)/2 · height` — đo ra **bằng nhau tuyệt
  đối** (322.53px cả hai, sai số < 0.01px) ⇒ **4 điểm luôn tạo một vòng tròn THẬT trong
  không gian pixel**, dù bbox text không vuông. Đây là lý do chuẩn hoá TÁCH TRỤC (x/width,
  y/height riêng) — giống hệt lý do Wave dùng chung một quy ước.
- Tâm vòng tròn: `cx = (W.x+E.x)/2 · width`, `cy = (N.y+S.y)/2 · height`.

`directionInverted: boolean` — cờ duy nhất khác, xem §5.

**Không có trường `radius` hay `curveHeight` riêng** — bán kính là **suy ra** từ 4 điểm, không
lưu tường minh.

---

## 3. Cơ chế đặt glyph — RIGID TRANSFORM từng glyph (bằng chứng số)

Hook `Object.getPrototypeOf(plugin).transform` (patch trên prototype, gọi lại nguyên bản),
ép `clearLayoutResult()+prepareLayout()`, bắt được đúng args/kết quả thật của
`transform({ layoutResult, dimensions, origin, xHeight })`. `layoutResult.styleRunPaths[0].paths`
là mảng **1 phần tử / 1 glyph** (giống cấu trúc doc Wave §4), mỗi phần tử có toạ độ TUYỆT ĐỐI
trên dòng chữ phẳng (baseline tại y=0), kết quả trả về là toạ độ ĐÃ warp, cùng cấu trúc.

Với text "CIRCLETEST" (10 glyph), so khoảng cách giữa các điểm TRONG CÙNG một glyph, trước
và sau transform:

```
glyph 0: dIn=8.176379390148222   dOut=8.176379390148224   (Δ ~2e-15)
glyph 0: dIn=13.892836370042842  dOut=13.892836370042835  (Δ ~7e-15)
glyph 0: dIn=20.223860081635320  dOut=20.223860081635323  (Δ ~3e-15)
```

Sai số ở mức làm tròn dấu phẩy động (1e-13 đến 1e-15), tức **KHÔNG có biến dạng nào cả** —
mỗi glyph được xoay+tịnh tiến (rigid) nguyên khối, không phải warp từng điểm.

Dùng Kabsch/Procrustes 2D giải ra `(theta_i, tx_i, ty_i)` cho từng glyph từ toàn bộ điểm
input/output của glyph đó — residual tối đa **7e-14px** trên mọi điểm, mọi glyph (10/10
glyph, cỡ 30-90 điểm/glyph) ⇒ mô hình rigid-transform-per-glyph đúng tuyệt đối, không phải
xấp xỉ.

### Điểm neo (pivot) của mỗi glyph

Áp `(theta_i, tx_i, ty_i)` lên điểm `(xMid_i, 0)` — với `xMid_i` là trung điểm theo x của
TOÀN BỘ điểm mực glyph đó trong hệ input (`(min_x+max_x)/2`), `0` là baseline — cho ra một
điểm với khoảng cách tới tâm vòng tròn **CONSTANT tuyệt đối trên cả 10 glyph**:

```
glyph 0..9, khoảng cách tới tâm (cx,cy) đã fit bằng least-squares trên chính 10 điểm này:
326.131, 326.131, 326.131, 326.131, 326.131, 326.131, 326.131, 326.131, 326.131, 326.131
```

⇒ **Pivot của mỗi glyph = trung điểm-theo-x-baseline của glyph đó (điểm `(xMid,0)` trên dòng
chữ PHẲNG, chưa warp)**, và pivot này LUÔN nằm đúng trên vòng tròn bán kính R sau khi warp.
Đây là điểm "gắn" glyph vào vòng tròn — tương đương vai trò của "điểm neo x" trong mô hình
Wave, nhưng ở đây là TÂM glyph theo trục x (không phải mép trái).

**Lưu ý:** bán kính đo được từ pivot fit (326.13px) **khác** bán kính suy từ 4 control point
ở §2 (322.53px) cùng trạng thái — chênh ~3.6px (~1.1%). Đã loại trừ khả năng lệch do đo hai
thời điểm khác nhau (đọc lại `controlPoints` VÀ ép `transform` trong cùng một lệnh, kết quả
giống hệt). **Chưa xác định được nguyên nhân chênh lệch này** (không match `xHeight`=38.04,
không match `fontSize`=72, không match `origin.y`=22.6 theo tỷ lệ đơn giản nào đã thử) — ghi
nhận là dữ kiện đo được, KHÔNG suy đoán công thức. Xem §7 (khuyến nghị) về cách xử lý khi
implement.

### Hướng xoay (glyph "ngửa ra ngoài" hay "úp vào trong")

Vector "lên" cục bộ của glyph (`(0,-1)` trong hệ input, baseline y-down) sau khi áp
`R(theta_i)`, so với vector hướng-ra-xa-tâm tại pivot của glyph đó — **trùng hướng gần như
tuyệt đối** (lệch < 0.001 rad) khi `directionInverted = false`. Tức: **glyph đứng thẳng, chữ
hướng ra ngoài vòng tròn** (giống số trên mặt đồng hồ, đọc được từ bên ngoài) — không phải
"úp vào trong".

---

## 4. Vị trí bắt đầu (s=0) — LUÔN ở điểm Nam, không đổi theo bán kính

Đo góc (so với tâm, quy ước `atan2(dy,dx)`, hệ y-down: 0°=Đông, 90°=Nam, 180°=Tây, -90°=Bắc)
của 4 control point — **luôn đúng các giá trị chính xác này bất kể bán kính**:

```
W = -180.00°   N = -90.00°   S = 90.00°   E = -0.00°
```

Góc của **mép trái** (điểm mực trái nhất, KHÔNG phải trung điểm) của glyph ĐẦU TIÊN trong
chuỗi văn bản:

```
text "FRESHDEFAULT" (12 ký tự), lần đo mặc định (chưa kéo tay chỉnh gì):
  glyph[0] mép trái → góc 91.400°   (S = 90.00° — lệch 1.4° do left-side-bearing của 'F')
```

Kiểm tra độc lập thứ hai: cùng file, sau khi user đã kéo tay đổi bán kính (test "CIRCLETEST",
bán kính đổi từ 322px → 322px→326px do kéo East-handle), mép trái glyph đầu **vẫn nằm đúng
tại góc ≈ vị trí điểm S** (không lệch theo bán kính) — S không di chuyển theo hướng kéo
Đông/Tây/Bắc, luôn cố định tại 90°.

⇒ **`s = 0` (điểm bắt đầu text) LUÔN đặt tại điểm Nam (đáy vòng tròn, 6 giờ)** — không phải
`points[0]` (W) như ta có thể suy đoán từ thứ tự mảng, và không đổi khi user kéo bán kính qua
bất kỳ handle nào trong 4 handle W/N/S/E.

Chiều quét: góc TĂNG dần theo glyph index (94.93° → 104.55° → ... → ~199.74° khi
`directionInverted=false`) — trong hệ toạ độ y-down, góc tăng tương ứng chiều **ngược kim
đồng hồ khi nhìn trên màn hình** (0°Đông→90°Nam→180°Tây là đi xuống rồi vòng sang trái).

**Chưa được đo:** hành vi khi `s` dùng `xMin` hay pivot khác của TOÀN BỘ text để căn giữa —
không quan sát được offset căn giữa nào (S luôn khớp gần đúng mép trái glyph 0, không phải
điểm giữa toàn chuỗi) — tức **văn bản KHÔNG được căn giữa quanh điểm Nam theo mặc định**, dù
UI panel bên phải có set align="center" cho riêff text run (căn giữa đó chỉ áp dụng trong
layout PHẲNG trước khi warp, không phải căn theo cung tròn).

---

## 5. `directionInverted` — phép PHẢN CHIẾU qua trục Đông-Tây, không phải chỉ đổi chiều quét

So góc từng glyph giữa `directionInverted=false` và `=true` (cùng text, cùng bán kính,
không đổi gì khác ngoài toggle) — **giá trị sau là ĐÚNG DẤU ÂM của giá trị trước, từng glyph
một**:

```
false: 94.93°, 104.55°, 114.07°, ...
true : -94.93°, -104.55°, -114.07°, ...
```

Và vector "lên" cục bộ của glyph 0 đổi từ hướng-ra-xa-tâm (§3) sang **hướng-vào-tâm tuyệt
đối** (`up0 = (0.086, 0.996)`, `radUnit0 = (-0.086, -0.996)` — hai vector gần như đối nhau
chính xác).

⇒ `directionInverted = true` tương đương phép **PHẢN CHIẾU (mirror) toàn bộ kết quả circle
text qua trục ngang (đường W-E) đi qua tâm** — góc `θ → -θ`, không phải chỉ đảo thứ tự glyph
hay chỉ đảo chiều quay riêng lẻ. Hệ quả tự nhiên của một phép phản chiếu: hướng "trong/ngoài"
của glyph cũng tự động đảo theo (không cần code riêng cho việc đó) — điểm bắt đầu (s=0) cũng
nhảy từ Nam (90°) sang **-90° = Bắc**, KHÔNG còn ở Nam nữa.

---

## 6. Text dài hơn chu vi vòng tròn → CHỒNG LẤN (wrap), không cắt

Kéo bán kính nhỏ dần (test "FRESHDEFAULT", giữ nguyên text) tới khi chu vi < bề rộng chữ
phẳng — quan sát: **chữ tiếp tục vòng qua khỏi 360° và đè lên chính nó** (ảnh chụp: các glyph
đầu/cuối chồng lấn rõ ràng quanh điểm bắt đầu). **Không có clipping/biến mất glyph** như hành
vi đã đo được ở preset `angle`/`wave` (tài liệu Wave §5.5: "Nếu tâm bounding box của một glyph
rơi ngoài path thì bị bỏ hẳn"). Đây là khác biệt hành vi CHỦ Ý cần note rõ: mô hình clip theo
`clipContourAtX` hiện có của ta (dùng cho Wave/Arch/Rise/Flag/Angi) **không áp dụng được cho
Circle** — Circle không có khái niệm "hết path", vòng tròn luôn khép kín vô hạn về mặt góc.

---

## 7. Chưa đo / chưa chắc chắn — liệt kê tường minh để không đưa giả định vào implement.md

- **Công thức bán kính mặc định khi lần đầu bấm "Circle"** (trước khi user kéo tay): đo được
  R=256.67px cho text flat-width=506px, nhưng chưa tìm ra công thức đóng (không phải
  `width/π`, không phải bội số đơn giản của fontSize=72 hay flat-height=81). **Không suy đoán
  công thức này** — implementation nên tự chọn quy ước riêng (xem implement.md), không cố
  khớp số của Kittl.
- **Chênh lệch bán kính "control point" (322.53) vs bán kính "baseline thật" (326.13)** — đã
  đo tái lập được (không phải sai số phép đo), chưa rõ nguyên nhân toán học chính xác. Có thể
  liên quan tới cách UI vẽ handle W/N/S/E ở một offset cố định ngoài baseline (cho dễ bấm), có
  thể là hệ quả một field khác trong plugin chưa lấy được (con trỏ nội bộ khác `controlPoints`).
- **"rotationHandle"** — `plugin.getControls()` trả về một control tên `rotationHandle`
  (`actionName: "circle-rotation-handle"`), tách biệt 4 `transformPoint-{0..3}`. Chưa xác định
  được vị trí/hành vi UI cụ thể của handle này trong phiên đo (có thể là xoay toàn bộ điểm bắt
  đầu S quanh tâm, tương tự đổi offset góc, nhưng chưa kéo thử thành công để xác nhận bằng số).
- **Text căn `align: right`** hoặc nhiều dòng (`\n`) trên Circle — chưa test, chỉ test 1 dòng,
  `align: center`.
- **Circle với `curveHeight`/biên độ khác 1 (ví dụ ellipse không đối xứng)** — control point
  luôn cho ra hình tròn thật (r_h = r_v) trong mọi lần đo, kể cả sau khi kéo tay 1 handle
  (chỉ đổi bán kính đều, không tạo ellipse) — nhưng chưa thử kéo 2 handle khác trục để xem có
  tạo được ellipse hay engine luôn ép về hình tròn.
