# Kittl "Custom" text transform — số liệu đo thật (2026-08-19)

Đo qua Chrome extension nối vào một project Kittl thật (`app.kittl.com`), đọc
trực tiếp `window.getDesignState()` — hàm nội bộ của Kittl trả về document
model đầy đủ (không phải suy luận từ ảnh chụp màn hình). Trước mỗi phát hiện
quan trọng đều có JSON số liệu gốc kèm theo.

## 1. Tên nội bộ của 8 kiểu Transformation

Nút UI tên gì thì `activeTransformPlugin.name` trên object KHÔNG trùng chữ đó.
Đọc `state.boards[0].objects[i].activeTransformPlugin.name` cho từng object đã
áp transform, ánh xạ ra:

| Nút UI (text-effect.md) | `activeTransformPlugin.name` | Số điểm (`points.length`) | Field khác |
|---|---|---|---|
| Angle, Arch, Rise, Wave, Flag | `warp` | 7 (cố định, không đổi theo độ dài text) | `type` (arch/rise/wave/flag/angle), `curveHeight` |
| **Custom** | **`freeLine`** | **7 (cố định)** | không có `type`, không có `curveHeight` |
| Distort | `freeForm` | 10 | không có `type`/`curveHeight` |
| Circle | `circle` | 4 | `directionInverted` |

Nút DOM cũng xác nhận đúng tên này (`read_page` trên panel Transformation):
`transformation-freeLine`, `transformation-freeForm`, `transformation-circle`,
`transformation-angle`, `transformation-arch`, `transformation-rise`,
`transformation-wave`, `transformation-flag`.

**Kết luận quan trọng nhất: `freeLine` (Custom) và `warp` (5 preset còn lại)
dùng chung cấu trúc 7 điểm.** Đúng khớp với suy luận đã có sẵn trong
[text-future-work.md](./text-future-work.md) mục 5 — "Arch/Rise thực ra là 3
anchor + 4 handle như Wave" — 3 anchor + 4 handle = 7 điểm phẳng. Nghĩa là
`freeLine` rất có thể chỉ là **`warp` bỏ `type`/`curveHeight`, giữ nguyên
`points`** — cùng một pipeline hình học, khác đúng cách sinh/khoá giá trị đầu.
Vì `Custom` trong editor hiện tại của mình dùng đúng field `WarpPath.anchors`
(`{x, y, in?, out?}`, 3 anchor mặc định) — cấu trúc 3 anchor × (1 điểm chính +
tối đa 2 handle in/out) = tối đa 7 điểm phẳng — **khớp chính xác với số liệu
đo được ở Kittl**. Không cần thiết kế schema mới cho Custom, tái dùng
`WarpPath` đã có.

## 2. Custom KHÔNG bắt đầu từ text phẳng — kế thừa hình dạng đang hiển thị

Thực nghiệm: tạo text mới hoàn toàn ("FRESH", chưa từng động vào
Transformation) → mở panel Transformation lần đầu → **Kittl tự động preview
"Angle" 80% NGAY LẬP TỨC**, dù chưa click nút nào:

```json
// activeTransformPlugin trên node vừa tạo, ngay sau khi mở panel, TRƯỚC khi
// click bất kỳ nút transform nào
{ "name": "warp", "type": "angle", "curveHeight": 0.8 (80%), "points": [...7 điểm...] }
```

Sau đó click nút **Custom**: shape trên canvas GIỮ NGUYÊN y hệt Angle 80% vừa
rồi (không nhảy về flat). Đọc lại `activeTransformPlugin`:

```json
{
  "id": "c8027081-...", "name": "freeLine", "version": "v1",
  "points": [
    { "x": -0.507, "y": 0.216 }, { "x": -0.336, "y": 0.216 },
    { "x": -0.166, "y": -0.022 }, { "x": 0.005, "y": -0.022 },
    { "x": 0.176, "y": -0.022 }, { "x": 0.346, "y": 0.216 },
    { "x": 0.517, "y": 0.216 }
  ]
}
```

7 điểm này **giống hệt** 7 điểm của bản `warp`/Angle 80% ngay trước đó (chỉ
mất `type`/`curveHeight`). Kết luận: **chọn Custom = "đóng băng" hình dạng
đang active tại thời điểm click thành `points` tĩnh, không có công thức sinh
lại.** Nếu trước đó đang ở preset khác (Wave, Arch...) thì Custom sẽ đóng băng
đúng hình Wave/Arch đó, không phải luôn là Angle — Angle chỉ là default khi
panel chưa từng được tương tác.

Nút **Reset** không đưa về flat — thử nghiệm bấm Reset ngay sau khi chọn
Custom (chưa kéo tay điểm nào) thì `points` không đổi (no-op vì chưa có gì để
undo). Chưa xác định được Reset làm gì khi ĐÃ kéo tay ít nhất 1 điểm — nghi
ngờ nó revert về đúng `points` tại thời điểm bấm Custom (baseline đã đóng
băng), nhưng **chưa đo trực tiếp** vì kéo điểm chính xác bằng automation khó
(xem mục 5).

Nút **Confirm**: so sánh `activeTransformPlugin` trước/sau khi bấm — **hoàn
toàn không đổi**. Model đã ghi nhận thay đổi ngay khi chọn type/kéo điểm (live
update), Confirm chỉ là hành động UI (thoát chế độ edit), không phải bước
"commit" dữ liệu riêng.

## 3. Custom BỊ lỗi giống hệt bug mình vừa fix — letterSpacing kéo giãn path

Tăng `charSpacing` (letterSpacing, đơn vị per-mille fabric.js) từ 0 lên 50 trên
node đang ở Custom:

```json
// truoc
{"charSpacing":0, "width":211.30, "points":[{"x":-0.507,"y":0.216}, ...]}
// sau khi doi charSpacing = 50
{"charSpacing":50, "width":222.37, "points":[{"x":-0.468,"y":0.327}, ...]}
```

`width` của node tăng theo letterSpacing (211→222px), và TOÀN BỘ 7 điểm
`points` đổi giá trị chuẩn hoá (dù không ai kéo tay điểm nào) — vì `points`
chuẩn hoá theo bbox hiện tại của node (`left/top/width/height`), mà bbox này
đổi theo letterSpacing. Quan sát trên canvas: đường cong path không còn khớp
với chữ nữa (chữ cuối tràn ra ngoài đường path). **Đây đúng là bug mà mình vừa
fix ở [textGeometry.ts](../src/text/textGeometry.ts) (pivotWidth) — Kittl có
bug này thật, không phải do editor của mình làm sai.** Cần quyết định ở mục 6
bên dưới: có nên bắt chước hành vi lỗi này cho giống Kittl, hay giữ nguyên bất
biến "letterSpacing không đổi path" đã áp dụng cho 5 preset + Circle.

## 4. Custom luôn 7 điểm bất kể độ dài nội dung

Đổi text từ "FRESH" (5 ký tự) sang "A LONGER HEADLINE TEXT HERE" (nhiều từ) —
`points.length` vẫn là 7. Xác nhận: `freeLine` không phải lưới N×M theo nội
dung như `text-future-work.md` mục 5 dự đoán trước đây ("Custom: lưới mesh
N×M kéo từng điểm") — dự đoán đó **sai**, số liệu thật cho thấy Custom dùng
đúng 7 điểm cố định giống warp family, không phải mesh. Tài liệu cũ cần sửa.

`freeForm` (Distort) mới là 10 điểm — cũng không đổi theo nội dung trong lần
đo (chỉ test 1 mẫu, chưa đổi text để xác nhận Distort cũng cố định điểm).

## 4b. QUAN TRỌNG: Custom KHÔNG dùng engine point-wise bend của warp family — dùng rigid-transform-per-glyph giống Circle

Phát hiện này suýt bị bỏ sót ở lần đo đầu (chỉ đo `points`/letterSpacing,
chưa đo cách RENDER glyph). User lưu ý trực tiếp, đo lại xác nhận đúng.

**Thực nghiệm so sánh trên cùng 1 text "HOUSE":**

1. Bật **Wave**, kéo `Wave Curve` lên gần max (~99%), zoom canvas 500%,
   zoom chụp riêng chữ "H" ở đoạn path dốc nhất — chữ "H" bị **méo/xiên rõ
   rệt**, hai nét sổ dọc không còn song song, như bị cắt lệch theo phương
   ngang cục bộ. Đúng hành vi point-wise bend đã biết của `warpContours` (mỗi
   điểm trên contour bị uốn riêng theo `buildWarpMap`, xem
   [warp.ts](../src/text/warp.ts) — đúng như phần "Trần của warp geometry" đã
   ghi trong [text-future-work.md](./text-future-work.md): "Ở `curveHeight`
   lớn, chỗ path dốc có `cos θ` gần 0 nên glyph ở đó bị bóp gần như thành vệt
   dọc").
2. Bấm **Custom** ngay sau đó (đóng băng hình đang có thành `freeLine`, xem
   mục 2) — chữ "H" **LẬP TỨC hết méo**: hai nét sổ dọc song song tuyệt đối,
   độ dày nét đều, y hệt chữ H gốc chưa warp, chỉ khác là bị XOAY như một khối
   cứng theo đúng hướng tiếp tuyến path tại vị trí đó. Zoom riêng "H" xác nhận
   không còn dấu vết biến dạng nào — đây là bằng chứng trực tiếp Custom dùng
   **rigid rotate per-glyph**, không phải point-wise bend, dù `points` lúc đó
   vẫn đang mô tả gần như cùng một đường cong.
3. Path (đường polyline xanh) khi ở Custom cắt **NGANG QUA GIỮA** thân chữ —
   quan sát trực tiếp trên "O" và "U": đường path đi qua đúng khoảng giữa
   theo chiều dọc của các chữ này, KHÔNG chạy dưới chân chữ như baseline của
   Wave/Arch (nơi toàn bộ chữ luôn nằm phía trên path). Xác nhận: **path của
   Custom neo vào tâm dọc của glyph, không phải baseline.**

**Kết luận kiến trúc — ảnh hưởng trực tiếp tới implement.md:** Custom phải
dùng chung kiểu engine với `circleWarp.ts` (`warpContoursCircle`— xoay + tịnh
tiến CỨNG toàn bộ glyph quanh tâm của chính glyph đó, neo theo path thay vì
theo đường tròn), KHÔNG được tái dùng `warpShapesFromPath`/`buildWarpMap` của
5 preset còn lại (kiểu uốn từng điểm trên contour — đúng cho baseline-follow
nhưng sai bản chất cho Custom). Đây là điều chỉnh so với bản kế hoạch cũ trong
`implement.md` (bản cũ giả định sai — tưởng Custom tái dùng nguyên
`warpShapesFromPath`).

## 5. Chưa đo được (giới hạn của phương pháp)

- **Cấu trúc chính xác của 7 điểm freeLine có phải đúng 3 anchor + 4 handle
  (bezier) hay là 7 điểm polyline phẳng không có handle riêng biệt.** Dữ liệu
  JSON chỉ có `{x, y}` — không có `in`/`out` như `WarpAnchor` của mình. Nhìn
  trên canvas đường nối giữa các điểm là đường cong mượt (không phải đoạn
  thẳng gãy khúc), gợi ý Kittl **tự nội suy spline** (kiểu Catmull-Rom hoặc
  bezier tự sinh từ 7 điểm) ở tầng render, KHÔNG cho user kéo tay handle riêng
  — khác với `WarpAnchor.in/out` của editor hiện tại (handle tách biệt, user
  kéo được). Cần quyết định: Custom của mình có thêm handle kéo tay riêng hay
  chỉ 7 điểm point-only giống Kittl (xem mục 6).
- **Kéo tay từng điểm ảnh hưởng điểm khác thế nào** (có mirror bezier không,
  hay hoàn toàn độc lập). Thử kéo 1 điểm bằng automation bị lệch tay nhiều lần
  (điểm quá nhỏ ở zoom 88-300%, khó click chính xác bằng toạ độ suy đoán từ
  ảnh chụp) — chỉ quan sát được hiệu ứng renormalize toàn cục qua bbox (mục
  3), KHÔNG tách được "điểm nào thực sự di chuyển do tay kéo" khỏi "điểm nào
  chỉ đổi số chuẩn hoá do bbox đổi". Cần lần đo sau dùng chuột thật (không qua
  automation click) hoặc script gọi thẳng API nội bộ Kittl để set điểm chính
  xác.
- **Reset khi ĐÃ kéo tay** — như đã nói ở mục 2, chưa xác nhận được Reset trả
  về đâu (baseline lúc chọn Custom, hay flat tuyệt đối, hay giá trị mặc định
  khác).
- **Multi-line text với Custom** — chưa test text có `\n`.
- **Circle: 4 điểm** — khớp với model hiện tại của mình (4 handle N/S/E/W),
  không đo sâu thêm vì Circle đã có tài liệu riêng
  ([kittl-circle-reverse-engineered.md](./kittl-circle-reverse-engineered.md)).

## 6. Câu hỏi cần chốt trước khi viết implement.md (xem AskUserQuestion)

1. Custom có kế thừa hình dạng của transform trước đó khi chuyển sang (đúng
   như Kittl), hay luôn bắt đầu từ flat/path rỗng (đơn giản hơn, dễ đoán hành
   vi hơn cho user)?
2. Custom có bị bug "letterSpacing kéo giãn path" giống Kittl, hay áp dụng
   đúng bất biến đã fix cho 5 preset + Circle (path cố định, chỉ ký tự giãn
   cách)?
3. 7 điểm của Custom có handle bezier kéo tay riêng (`in`/`out`, đúng
   `WarpAnchor` sẵn có) hay chỉ 7 điểm phẳng nối bằng spline tự động (đúng như
   Kittl đo được, không cho kéo handle)?
