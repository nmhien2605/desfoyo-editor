# Kittl text transformation — công thức thật (reverse-engineered)

> Ngày: 2026-08-17. Nguồn: runtime của `app.kittl.com` (bundle `_repo_editor`, module `70645`),
> đọc trực tiếp source đã minify + đo thực nghiệm trên hàm biến đổi bắt được lúc chạy.
> Tài liệu này thay thế phần **suy đoán** trong `bao-cao-bien-doi-glyph-theo-bezier-path.md`.

---

## 0. Tóm tắt cho người ra quyết định

Giả thuyết trong báo cáo cũ (glyph là rigid body, xoay theo tangent — "Giả thuyết A") **sai**.
Kittl không xoay glyph. Nhưng mô hình hiện tại của chúng ta (`(x,y) → (x, y+f(x))`) cũng **không**
giống Kittl: Kittl có thêm một thành phần nữa — **nén ngang theo arc length**.

Công thức thật của Kittl (plugin `warp`, dùng cho arch / wave / rise / flag / angle):

```text
L      = arcLength(path)                  // paper.js Path.length
s      = clamp(x − x₀, 0, L)
P      = path.getPointAt(s)               // tham số hoá theo ĐỘ DÀI CUNG
(x, y) ↦ (P.x,  P.y + (y − y₀))
```

với `(x₀, y₀)` = control point đầu tiên của path (đã đổi sang pixel).

Ba tính chất, tất cả đã được kiểm chứng bằng số trên hàm thật:

| Tính chất | Kittl | Implementation hiện tại của ta |
|---|---|---|
| Xoay glyph theo tangent | **Không** (Δy vào → Δy ra, Δx = 0 tuyệt đối) | Không |
| `y` dịch theo phương đứng (không theo normal) | **Có** | Có |
| `x` được giữ nguyên | **Không** — `x` ánh xạ qua arc length | **Có** — `x` giữ nguyên tuyệt đối |
| Bù lại độ dài (kéo giãn trước khi warp) | **Có** — xem §5.3 | Không |
| Chia nhỏ Bézier để đảm bảo sai số | **Không** — map thẳng control point | Có — subdivide tới 0.05 px |

Đây là **một** khác biệt hành vi thật sự, không phải chi tiết cài đặt: xem §5.3 và §6.

---

## 1. Cách verify (để tái lập)

Kittl là canvas app. Không có SVG trong DOM để đọc, nên đi đường runtime:

1. `window.fabric` → Fabric.js **5.2.1**. Object chữ là subclass `RichText`.
2. Lấy instance `fabric.Canvas` bằng cách hook `Canvas.prototype.renderAll` rồi ép render.
3. `canvas.getObjects()` → `RichText`, mỗi object có `pluginManager.activeTransformPlugin`
   (instance thật, không phải bản serialize trong `obj.activeTransformPlugin`).
4. Lấy source: `window.webpackChunk_repo_editor.push([[id], {}, req => modules = req.m])`
   → module `70645` (4.9 MB) chứa toàn bộ engine. Grep theo `curveHeight`, `PLUGIN_NAME`.
5. Bắt hàm biến đổi thật: hook `PathSegment.prototype.transformCustom` để lưu callback `u`,
   rồi ép app chạy lại pipeline thật bằng `obj.clearLayoutResult(); obj.prepareLayout();`
   (kết quả trùng `obj.layoutedPaths` tới 1e-8 ⇒ đúng là hàm đang dùng để render).
6. Sample `u` để đo các tính chất (§5).

Thư viện Kittl dùng: **fabric.js** (scene graph) + **paper.js** (path/boolean/arc-length) +
**fontkit** (`Path.appendFontKitPath`). Không phải opentype.js.

---

## 2. Kiến trúc plugin

`RichText` có đúng **một** transform plugin hoạt động tại một thời điểm. Bốn họ plugin:

| Class | `PLUGIN_NAME` | Số control point | Dùng cho |
|---|---|---|---|
| `Bp` | `warp` | 7 (riêng `angle`: 2) | **arch, wave, rise, flag, angle** |
| `Bu` | `freeLine` | 7 | preset "Custom" |
| `Bl` | `freeForm` | 10 | preset "Distort" (envelope) |
| `D2` | *(circle)* | 4 | "Circle Text" |

Số điểm được validate cứng (`DD`), sai số điểm là throw.

UI panel "Transformation" map 1-1: CUSTOM=`freeLine`, DISTORT=`freeForm`,
CIRCLE TEXT=`circle`, ANGLE/ARCH/RISE/WAVE/FLAG=`warp`.

**Chỉ `warp` là thứ tương ứng với wave của ta.** `freeForm` là envelope warp (biến dạng
nội tại theo lưới trên/dưới) — chính nó mới tạo ra cảm giác "chữ bị xoay" trong ảnh minh hoạ
của báo cáo cũ, không phải wave.

---

## 3. Cấu trúc path từ 7 điểm

`Bs(points)` dựng một `paper.Path`:

```js
function Bs(pts) {
  const path = new paper.Path();
  const P = i => new paper.Point(pts[i].x, pts[i].y);
  const add = (iAnchor, iIn, iOut) => {
    const a = P(iAnchor);
    const hIn  = iIn  != null ? P(iIn).subtract(a)  : null;   // handle tương đối
    const hOut = iOut != null ? P(iOut).subtract(a) : null;
    path.add(new paper.Segment(a, hIn, hOut));
  };
  if (pts.length === 2) { add(0, null, null); add(1, null, null); }   // angle: đoạn thẳng
  else                  { add(0, null, 1); add(3, 2, 4); add(6, 5, null); }
  return path;
}
```

Nghĩa là 7 điểm = **2 đoạn cubic nối nhau**:

```text
anchor:  0 ──────── 3 ──────── 6
handle:    1     2     4     5
cubic A: [0, 1, 2, 3]
cubic B: [3, 4, 5, 6]
```

Giống hệt cấu trúc `WarpPath` của ta (anchors + in/out handles), chỉ khác ta cho phép
số anchor tuỳ ý còn Kittl chốt cứng 3 anchor.

Toạ độ lưu **chuẩn hoá** theo hộp text: `pt = {x: px/dims.width, y: px/dims.height}`,
và preset dịch `−0.5` cả hai trục nên gốc nằm giữa hộp.

---

## 4. Công thức biến đổi — source thật

`Bp.transform`, đã un-minify:

```js
transform({ layoutResult, dimensions, origin }) {
  const { styleRunPaths } = layoutResult;
  const pts  = this.points.map(p => ({ x: p.x * dimensions.width,
                                       y: p.y * dimensions.height }));
  let clipStart = false, clipEnd = false;

  const path = Bs(pts);          // paper.Path, 2 cubic
  const L    = path.length;      // ARC LENGTH
  const x0   = pts[0].x;
  const y0   = pts[0].y;         // biến `c` trong bundle

  const u = (pt) => {                       // <- hàm map từng ĐIỂM
    const d = pt.x - x0;
    const s = clamp(d, 0, L);
    if (d < 0) clipStart = true; else if (d > L) clipEnd = true;
    const P = path.getPointAt(s);
    return P ? { x: P.x, y: P.y + pt.y - y0 } : { x: 0, y: 0 };
  };

  const dx = x0 - origin.x, dy = y0 - origin.y;

  return {
    paths: styleRunPaths.map(run => ({
      ...run,
      paths: run.paths.map(glyph => {                  // MỘT path / MỘT glyph
        const g = glyph.clone();
        g.translate({ x: dx, y: dy });                 // gốc layout → điểm đầu path
        const rel = g.boundsCenter.x - x0;
        if (rel < 0 || rel > L) {                      // glyph nằm ngoài path
          rel < 0 ? clipStart = true : clipEnd = true;
          return EmptyPath.init();                     // -> BỎ HẲN glyph
        }
        g.transformCustom(u);
        return g;
      })
    })),
    metadata: { clipping: { start: clipStart, end: clipEnd } }
  };
}
```

### 4.1 `transformCustom` — không hề chia nhỏ Bézier

```js
// Path
transformCustom(f) { for (const seg of this.segments) seg.transformCustom(f); ... }

// Segment: points = [x0,y0, c0x,c0y,c1x,c1y, x1,y1, c0x,c0y, ...]  (toàn cubic)
transformCustom(f) {
  let p = f({x: this.points[0], y: this.points[1]});
  this.points[0] = p.x; this.points[1] = p.y;
  for (let n = 2; n < this.points.length; n += 6) {
    const c0 = f({x: this.points[n],   y: this.points[n+1]});
    const c1 = f({x: this.points[n+2], y: this.points[n+3]});
    const p1 = f({x: this.points[n+4], y: this.points[n+5]});
    // ghi thẳng lại 3 điểm, không kiểm tra sai số, không subdivide
    ...
    p = p1;
  }
}
```

**Đây là điểm quan trọng nhất về chất lượng:** Kittl áp `u` thẳng lên cả control point
off-curve. Về mặt toán học đây chính là phép xấp xỉ mà spec của ta đã chỉ ra là **sai**
(hợp `u` với cubic cho ra đường bậc cao hơn 3). Kittl chấp nhận sai số đó.

### 4.2 Slider "Curve"

```js
updateTransformCurve(newCurve, { heightOfLine, dimensions }) {
  const pts = this.points.map(p => denorm(p, dimensions));
  const ys  = pts.map(p => p.y);
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const mid = lo + (hi - lo) / 2, spread = hi - lo;
  if (spread === 0) return;                       // path phẳng thì slider vô hiệu
  const c    = newCurve === 0 ? 1e-6 : newCurve;  // Bh()
  const flip = Math.sign(newCurve) !== Math.sign(this.curveHeight || 1e-6);
  this.points = pts.map(p => {
    const t = (p.y - mid) / spread * Math.abs(c) * (flip ? -1 : 1);
    return norm({ x: p.x, y: mid + t * heightOfLine }, dimensions);
  });
  this.curveHeight = newCurve;
}

// đọc ngược khi user kéo tay handle:
setPoints(pts, { heightOfLine, dimensions }) {
  this.points = pts;
  const ys = pts.map(p => denorm(p, dimensions).y);
  this.curveHeight = (Math.max(...ys) - Math.min(...ys)) / heightOfLine;
}
```

Ngữ nghĩa: **`curveHeight` = biên độ dọc của path, tính bằng đơn vị "một line height"**.
Slider chỉ scale `y` của control point quanh trung điểm; **`x` không bao giờ bị đụng tới**.
Số âm = lật ngược đường cong.

### 4.3 Preset (chuẩn hoá 0..1, sau đó dịch −0.5 mỗi trục)

```js
arch:     [(0,1), (.2,.7),  (.33,.65), (.5,.65), (.67,.65), (.8,.7),  (1,1)]
wave:     [(0,1), (.35,.65),(.45,.6),  (.65,.55),(.75,.525),(.8,.5),  (1,.6)]
rise:     [(0,1), (.25,.95),(.4,.75),  (.6,.6),  (.75,.5),  (.8,.45), (1,.5)]
flag:     [(0,.85),(.2,1),  (.35,1),   (.5,.85), (.65,.7),  (.8,.7),  (1,.85)]
angle:    [(0,1), (1,.4)]
freeLine: [(0,1), (1/6,1), (2/6,.8), (.5,.8), (4/6,.8), (5/6,1), (1,1)]
freeForm: [(0,0),(.5,0),(1,0),(1,1),(.5,1),(0,1),(.25,0),(.75,0),(.25,1),(.75,1)]
```

`y=1` là đáy hộp (y hướng xuống). Preset `arch` đối xứng hoàn hảo; `wave` thì không —
nó là một nhịp lên-xuống lệch, đúng như tên gọi.

---

## 5. Kiểm chứng bằng số (trên hàm `u` thật app đang render)

Đối tượng đo: text `"Your text"` (wave, 100 px, rộng 312.4 px) và `"HHhhh…"` (arch, 59 px).

### 5.1 Không xoay, không dùng normal — chỉ dịch đứng

Cho cùng `x`, đổi `y` một lượng Δ:

| x | Δx đầu ra | Δy đầu ra (Δ vào = 37.5) |
|---|---|---|
| đầu path | `0` (chính xác) | `37.5` |
| giữa path | `0` (chính xác) | `37.5` |
| cuối path | `0` (chính xác) | `37.5` |

⇒ `u(x, y) = (F(x), G(x) + y − y₀)`. **Không có thành phần nào của `y` rò vào `x`.**
Hệ quả hình học: mọi nét dọc của glyph vẫn dọc tuyệt đối. Đây là bằng chứng dứt điểm
bác bỏ "Giả thuyết A — rigid glyph xoay theo tangent" của báo cáo cũ.

### 5.2 Tham số hoá đúng là arc length

Chạy `u` dọc 47 000 mẫu, cộng dồn chiều dài dây cung của đường ra:

| s vào | độ dài cung đo được | tỉ số |
|---|---|---|
| 47.09 | 47.095 | 1.000000 |
| 235.47 | 235.473 | 1.000000 |
| 470.95 | 470.946 | 1.000000 |

⇒ `getPointAt` là arc-length (đúng semantics `paper.Path.getPointAt`), sai số 1e-6.

### 5.3 Bù độ dài: bề ngang tổng thể KHÔNG đổi, chỉ nén cục bộ

Vì `s = x − x₀` tiêu thụ theo **độ dài cung**, nếu để nguyên thì đường cong càng dài chữ
càng chiếm ít bề ngang. **Kittl bù lại điều đó**: mỗi lần path đổi (kéo slider hoặc kéo
handle), nó set lại chiều rộng layout của chữ bằng đúng độ dài cung:

```js
// RichText.updateActiveTransform  — chạy mỗi lần slider Curve đổi
const ctx = { dimensions: { width: this.width, height: this.height },
              heightOfLine: this.textLineMeasurementEngine.getHeightDataOfLine(0).fontSize };
plugin.setOptions(opts, ctx);
if (opts.curveHeight) {
  this.untransformedWidth = plugin.getLineLength({ dimensions: {...}, ... });  // <- = L
  this.initDimensions();
}
this.clearLayoutResult();

// RichText.setTransformPoints — chạy mỗi lần user kéo handle: cùng một việc
```

`untransformedWidth` là bề rộng chữ **trước** khi warp. Đặt nó bằng `L` nghĩa là:
kéo giãn ngang chuỗi chữ tới đúng độ dài cung, rồi trải theo arc length ⇒ chữ **phủ kín
đúng path** và bề ngang mực in **không đổi**.

Đo trên object sạch (`"HAMBURGER"`, Roboto 72 px, preset `arch`, bề ngang mực gốc 424.7 px):

| Curve | `untransformedWidth` (= L) | Bề ngang mực sau warp | Cao node |
|---|---|---|---|
| 25 %  | 434.7 | **424.7** | 70 |
| 50 %  | 442.9 | **424.7** | 89.7 |
| 80 %  | 458.9 | **424.7** | 113.0 |
| 120 % | 489.1 | **424.7** | 144.7 |
| 160 % | 526.9 | **424.7** | 176.7 |
| 200 % | 570.1 | **424.7** | 208.8 |

Bề ngang **bất biến tuyệt đối**; đã đối chiếu bằng ảnh chụp ở curve 25 % và 200 %: chữ
chiếm đúng cùng một khoảng ngang, chỉ vòng cung cao lên.

Hiệu ứng thị giác thật sự là **nén/giãn cục bộ**: chỗ path dốc (`dx/ds` nhỏ) chữ bị bóp
hẹp, chỗ path thoải chữ giãn ra. Ở curve 200 % các chữ ở hai đầu vòng cung mảnh gần như
vệt dọc, còn chữ ở đỉnh gần như nguyên bản. Mô hình vertical-displacement của ta **không
tạo ra hiệu ứng này chút nào** — đó là khác biệt thị giác rõ nhất.

> Ghi chú: cơ chế của Kittl là một **điểm bất động lặp** (`untransformedWidth ← L(node box)`,
> rồi node box tính lại từ hình đã warp, hội tụ sau vài frame). Ta không cần copy vòng lặp
> đó — chỉ cần giữ đúng hai bất biến quan sát được: (i) bề ngang mực không đổi,
> (ii) chữ phủ kín path từ đầu đến cuối.

### 5.4 Sai số do không subdivide

So đường cubic Kittl tạo ra (map 4 control point) với ảnh thật của cubic gốc qua `u`,
lấy 20 mẫu/cubic trên toàn bộ glyph:

| Trường hợp | sai số max | sai số trung bình |
|---|---|---|
| wave, text 312 px, curve 100 % | **1.96 px** | 0.033 px |
| arch, text 139 px, curve 50 % | 1.01 px | 0.029 px |
| arch, text 139 px, curve 100 % | 0.39 px | 0.022 px |
| arch, text 139 px, curve 200 % | 0.32 px | 0.012 px |

Tức là Kittl chấp nhận lệch cỡ **1–2 px** ở kích thước hiển thị thường. Nhìn ở 100 % zoom
gần như không thấy; phóng to hoặc export lớn thì thấy. Implementation của ta subdivide tới
0.05 px nên **chính xác hơn Kittl một bậc độ lớn** — nhưng đó là chi phí ta tự chọn.

### 5.5 Clipping theo glyph

Nếu tâm bounding box của một glyph rơi ngoài `[x₀, x₀+L]` thì glyph đó bị **bỏ hẳn**
(thay bằng path rỗng), và `metadata.clipping.{start,end}` bật lên để UI cảnh báo.
Không có co giãn tự động để chữ vừa path: chữ dài hơn path thì mất chữ.

---

## 6. So sánh trực diện với implementation hiện tại

| | Kittl `warp` | `src/text/warp.ts` hiện tại |
|---|---|---|
| Mô hình | `(x,y) → (P(s).x, P(s).y + y − y₀)`, `s = x − x₀` theo arc length | `(x,y) → (x, y + f(x))` |
| Giữ `x` | Không | Có |
| Kéo giãn bù độ dài trước khi warp | Có (`untransformedWidth ← L`) | Không cần |
| Bề ngang tổng thể khi cong | Không đổi | Không đổi |
| Nén/giãn cục bộ theo độ dốc | Có | Không |
| Xoay glyph | Không | Không |
| Cấu trúc path | 3 anchor cố định (7 điểm), hoặc 2 điểm cho `angle` | anchor tuỳ ý |
| Chuẩn hoá | theo hộp text, gốc ở tâm (−0.5) | theo hộp text, gốc góc trên-trái |
| Biên độ | `curveHeight` = biên độ dọc / line height | `intensity` |
| Độ chính xác Bézier | map control point, sai số 1–2 px | subdivide, sai số ≤ 0.05 px |
| Chữ dài hơn path | bỏ glyph + cờ clipping | không có khái niệm này (`f` định nghĩa trên toàn `[0,1]`) |
| Thư viện | paper.js + fontkit | tự viết + opentype.js |

**Cái ta đang thiếu so với Kittl chỉ có đúng một thứ: nén ngang theo arc length.**
Mọi thứ khác hoặc trùng, hoặc ta làm chặt hơn.

---

## 7. Ba hướng đi — ĐÃ QUYẾT: hướng B

> Chốt ngày 2026-08-17: bám Kittl về mặt hình ảnh, giữ lại phần chính xác hơn của ta.
> Spec triển khai nằm ở `docs/superpowers/specs/`. Phần dưới giữ lại làm ghi chép lý do.


**A. Giữ nguyên vertical displacement.**
Rẻ nhất — code đã xong, đã review sạch, chính xác hơn Kittl về mặt Bézier. Chữ sẽ không co
ngang khi cong mạnh, nghĩa là ở curve lớn hình sẽ khác Kittl thấy rõ. Chấp nhận được nếu
mục tiêu là "hiệu ứng sóng dễ chịu", không phải "clone Kittl".

**B. Thêm arc-length remap lên trên cái đã có.**
`x' = P(s).x` với `s = x − x₀`. Cần: tích luỹ arc length của polybezier (LUT + đảo ngược),
và `f` trở thành hàm 2 đầu ra thay vì 1. Phần subdivision hiện có vẫn dùng lại được nhưng
tiêu chí "affine trên đoạn" phải viết lại — `x' = P(s).x` không còn affine theo `x` nữa,
nên chứng minh affine-exactness trong spec §5.1.2 **sẽ mất hiệu lực** và phải thay bằng
tiêu chí sai số thuần tuý (đo cả hai trục). Đây là phần việc thật, không nhỏ.

**C. Copy đúng Kittl, kể cả phần xấp xỉ.**
Bỏ subdivision, map thẳng control point. Đơn giản nhất để giống hệt, nhưng cố tình hạ chất
lượng xuống 1–2 px và vứt phần đã làm xong. Không khuyến nghị.

Khuyến nghị: **A bây giờ, B khi có yêu cầu cụ thể là phải khớp Kittl.** Lý do: khác biệt
chỉ lộ ở curve lớn, còn chi phí của B là viết lại phần chứng minh chính xác của spec —
tức là làm lại đúng cái mảng đã tốn nhiều công nhất.

---

## 8. Phụ lục — `freeForm` (Distort)

Không dùng cho wave nhưng ghi lại vì đây mới là thứ trong ảnh minh hoạ báo cáo cũ.

10 điểm = **hai đường cong bao** (trên và dưới), mỗi đường 2 cubic. `Bo.transformPoint`:

1. Tính breakpoint chia trái/phải trên cả hai đường bao.
2. Xác định điểm thuộc nửa trái hay nửa phải (`D8`).
3. Tính `xRatio` của điểm trong nửa đó.
4. Nội suy giữa đường bao trên và dưới theo `xRatio` và theo vị trí `y` tương đối
   (`getTransformedPoint`).

Đây là envelope distortion kiểu Illustrator: glyph **bị biến dạng nội tại**, nét dọc
không còn dọc — nên nhìn giống "xoay". Khác hoàn toàn `warp`.

---

## 9. Kết luận về báo cáo cũ

| Mục báo cáo cũ | Phán quyết |
|---|---|
| §5.1 Mô hình A vertical displacement | Gần đúng, thiếu thành phần arc-length remap |
| §10, §11-A, §17, §19 rigid glyph + `R(θ(s))` | **Sai** — Kittl không xoay glyph, đo được Δx = 0 tuyệt đối |
| §11-B point-wise deformation | **Đúng hướng** — Kittl map từng point, không phải từng glyph |
| §4 "không nên coi path là `y=f(x)`" | Đúng, và Kittl xử lý bằng arc-length param + clamp |
| §15.1 "`s` tính từ đâu?" | Từ `x` của **từng point** (không phải anchor glyph): `s = clamp(x − x₀, 0, L)` |
| §15.2 "param là gì?" | **Arc length**, không phải `t` |
| §15.6 "điểm nào của glyph gắn vào `P(s)`?" | Không phải điểm nào cả — gốc layout của cả dòng gắn vào `P(0)` |
| §15.5 "có scale không?" | Không có scale chủ động; co ngang là **hệ quả** của arc-length param |
