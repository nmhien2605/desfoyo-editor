# Kittl — Text Decoration (reverse-engineered)

**Ngày đo:** 21/08/2026 · **Cách đo:** mở editor thật (`app.kittl.com`), đọc trực tiếp runtime
object model qua DevTools/extension. Kittl dựng trên **Fabric.js** (`canvas.lower-canvas`,
`window.fabric`) với các lớp riêng `fabric.RichText` / `PathText` / `OverlayTexture`. Text
effects là một **hệ plugin**: `pluginManager.{activeTransformPlugin, activeRenderPlugins,
activeDecorationPlugins}`.

Toàn bộ công thức dưới đây **lấy từ chính source đã deminify của Kittl**, không phải suy ra từ
ảnh. Số liệu bbox lấy từ object thật.

---

## 1. Cải chính quan trọng so với [kittl.md](./kittl.md) FR-05

Tài liệu BA viết decoration gồm *"strokes, cuts, lines, textures"* — đó là câu marketing trên
landing page, **không phải sản phẩm thật**. 4 decoration thật trong editor là:

| # | Nhãn UI | `type` nội bộ | Bản chất |
|---|---|---|---|
| 1 | **Horizontal Lines** | `horizontalLines` | dải ngang lặp |
| 2 | **Color Cut** | `colorCut` | một dải đặc từ đỉnh xuống |
| 3 | **Oblique Lines** | `obliqueLines` | dải xiên 45° lặp |
| 4 | **Fading Color Cut** | `fadingColorCut` | dải đặc + 5 dải nhỏ dần (fade kiểu halftone) |

**Không có** stroke (viền đã là mục "Border" riêng), **không có** texture (đó là
`OverlayTexture`, một loại object khác, không phải decoration).

**Cả 4 đều cùng một bản chất hình học: `dải chữ nhật ∩ hình chữ`.** Khác nhau đúng ở hàm sinh
dải.

---

## 2. Panel UI

Section **"Text Decoration"** (dưới "Text Shadow"), có nút `+`/`−` để thêm/gỡ. Khi bật:

- Lưới **4 nút** chọn kiểu — **single-select**, bấm nút khác là THAY THẾ (plugin instance mới,
  `id` uuid mới). Không có cách nào bật 2 decoration cùng lúc.
- Ô màu + opacity — mặc định **`#ABABAB` 100%** (`fillStyle` mã hoá `0xABABABFF`).
- Slider **Weight** và slider **Distance**. Hai slider dùng chung cho cả 4 kiểu, map sang field
  khác nhau tuỳ kiểu; kiểu nào không dùng thì slider bị **disable** (xám).

| kiểu | Weight (min..max, mặc định) → field | Distance (min..max, mặc định) → field |
|---|---|---|
| `horizontalLines` | 1..10, **1** → `thickness` = W/100 | 1..50, **1** → `gap` = D/100 |
| `obliqueLines` | 1..10, **1** → `thickness` = W/100 | 1..50, **1** → `gap` = D/100 |
| `colorCut` | *disabled* (hiển thị 5) | 1..100, **50** → `verticalCoverage` = D/100 |
| `fadingColorCut` | 1..10, **5** → `spread` = W/100 | 1..100, **50** → `verticalCoverage` = D/100 |

Giá trị hiển thị là **phần trăm**, giá trị lưu là **tỉ lệ** (chia 100).

---

## 3. Hệ quy chiếu — **ink bbox**, không phải fontSize, không phải line box

Mọi tham số tỉ lệ đều nhân với `H` = **chiều cao bbox khít của outline chữ đã layout**
(`layoutResult.joinedPath.boundsRect.height`), và `X/Y/W` là góc trên-trái + bề rộng của chính
bbox đó.

Số đo thật (Roboto Bold, fontSize 72, text `"Headline"`, không warp):

```
joinedPath.boundsRect = { x: -138.62109375, y: -31.38192, width: 279.94921875, height: 54.703125 }
object dimensions     = { width: 300, height: 81.36 }        // = fontSize × lineHeight
fontSize              = 72
```

⇒ `H = 54.70`, **không phải** 72 (fontSize) và **không phải** 81.36 (line box). Decoration vì
vậy tự khít theo phần mực thật của chữ.

---

## 4. Công thức từng kiểu (deminify nguyên văn)

Ký hiệu chung: bbox `{x: X, y: Y, width: W, height: H}`. Tất cả rect đều **trải hết bề rộng
bbox** (`x: X, width: W`).

### 4.1. `horizontalLines`

```js
o = thickness * H                 // bề dày một dải
l = o + gap * H                   // bước lặp
s = Math.ceil(H / l)              // số dải
for (k = 0; k < s; k++)
  rect(X, Y + k*l, W, o)          // dải đầu tiên KHÍT mép trên bbox
```

### 4.2. `colorCut`

```js
rect(X, Y, W, H * verticalCoverage)   // đúng một dải đặc từ đỉnh xuống
```

### 4.3. `obliqueLines` — cố định **45°**, không có control góc

```js
ang = 45°
l = 0.7 * thickness * H           // CHÚ Ý hệ số 0.7 — mảnh hơn horizontalLines cùng Weight
s = (gap + thickness) * H          // bước lặp; s === 0 → không vẽ gì
d = hypot(H, H) + 2*l              // chiều dài mỗi vệt
c = X + H/2 + hypot(l, l)/2        // mốc quét theo trục x
u = c + W
h = Y + H/2                        // trục giữa theo y

// lượt 1: quét theo x
for (e = c; e <= u; e += s)
  ORect(x: e - d/2, y: h - l/2, width: d, height: l)  xoay 45° quanh tâm

// lượt 2: quét theo y
p = Y + H/2;  g = p + H;  m = d + l
for (e = p; e <= g; e += s)
  ORect(x: c - m/2, y: e - l/2, width: m, height: l)  xoay 45° quanh tâm
```

Hai lượt quét cùng sinh ra các vệt **song song 45°**; chia làm hai lượt chỉ để phủ hết bbox theo
cả hai chiều. Kết quả là gạch chéo một chiều, không phải ca-rô.

### 4.4. `fadingColorCut`

```js
totalEffectHeight() = 0.39  * (0.1 + 10*spread)
gapHeight(k)        = 0.013 * (6 - k) * (0.1 + 10*spread)   // k = 1..5 — dải CÓ tô, nhỏ dần
segmentHeight(k)    = 0.013 * k       * (0.1 + 10*spread)   // k = 1..5 — khoảng TRỐNG, lớn dần

o = H * (verticalCoverage - totalEffectHeight()/2)
if (o > 0) rect(X, Y, W, o)                                  // khối đặc phía trên
for (k = 1; k <= 5; k++) {
  l  = gapHeight(k) * H
  o += segmentHeight(k) * H
  if (o <= H && o + l >= 0)
    rect(X, Y + max(0, o), W, l + min(0, o))                 // clamp mép trên/dưới
  o += l
}
```

Kiểm tra nhất quán: `Σ(gapHeight + segmentHeight) = 0.013·30·(0.1+10·spread) = 0.39·(...)` =
`totalEffectHeight()`. ✔

---

## 5. Cách ghép với hình chữ

**Decoration vẽ ĐÈ LÊN lớp fill của chữ, và bị CLIP vào chính outline chữ.** Không tràn ra
ngoài nét chữ trong mọi trường hợp (đã soi ở zoom 530%).

SVG export của Kittl (`toSvgWithDecorationPlugins`) sinh đúng cấu trúc:

```xml
<g clip-path="url(#clip-N)">
  <clipPath id="clip-N"><path d="{compound path của toàn bộ glyph}"/></clipPath>
  <path d="{path decoration}" fill="{fillStyle}" fill-opacity="{alpha}"/>
</g>
```

Phía canvas **không** có `ctx.clip()` ở bất kỳ đâu trong chuỗi prototype của object — họ dựng
sẵn hình học đã giao nhau và cache lại (mỗi plugin có `getCacheKey()`).

---

## 6. Quan hệ với Transformation (warp) — **decoration bị warp theo chữ**

Đã kiểm chứng trực tiếp: áp `horizontalLines` lên một text đang bật **Distort** → các đường kẻ
**nghiêng và cong theo envelope**, không nằm ngang.

Cơ chế trong code (`generateAndApplyLayoutResult`):

```js
r = joinedBounds(styleRunPaths, decorationPaths)          // bbox tính ở không gian PHẲNG
a = transformWithPlugin(transformPlugin, { styleRunPaths, joinedBounds: r })   // glyph
o = transformWithPlugin(transformPlugin, { styleRunPaths: t, joinedBounds: r }) // decoration
```

⇒ dải được sinh trong **không gian phẳng (trước warp)** rồi mới đẩy qua **đúng phép warp của
glyph**. Đó cũng là lý do mọi rect trục-chuẩn được `appendSegmentedARect(rect, 50)` — chia sẵn
50 đoạn để đường thẳng có chỗ mà uốn theo warp. Riêng vệt xiên dùng `appendORect` (không chia).

---

## 7. Quan hệ với Text Shadow — **độc lập**

Shadow và decoration là hai slot plugin khác nhau, bật cùng lúc được. Đã kiểm chứng: bật drop
shadow + `colorCut` → **shadow KHÔNG bị decoration đụng tới** (bóng vẫn là một khối mờ nguyên
vẹn, decoration chỉ tô nửa trên của nét chữ). Decoration chỉ clip vào outline chữ, còn shadow
dựng từ letterform gốc.

---

## 8. Trần / chỗ Kittl làm xấp xỉ

- `appendSegmentedARect(rect, 50)`: dải thẳng được xấp xỉ bằng **50 đoạn gãy** rồi mới warp —
  ở warp cong mạnh, biên dải là đường gấp khúc chứ không phải đường cong thật.
- `obliqueLines` cố định 45°, không cho chỉnh góc.
- `fadingColorCut` cố định đúng **5** bậc fade.
- Decoration luôn bắt đầu từ **mép trên** bbox (`y = Y`), không có tham số offset.
