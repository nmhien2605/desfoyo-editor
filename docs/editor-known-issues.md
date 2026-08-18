# Editor — vấn đề đã biết, chưa sửa

Ghi lại các vấn đề đã điều tra và tái hiện được, nhưng cố tình chưa sửa trong đợt này. Khác với [text-future-work.md](./text-future-work.md) (riêng cho tính năng text/warp), file này ghi các vấn đề ở tầng canvas/editor chung.

---

## 1. Kéo node ra khỏi mép canvas thì dừng lại giữa chừng

**Triệu chứng.** Kéo một node (hoặc handle resize/rotate) vượt ra ngoài biên canvas: con trỏ tiếp tục di chuyển nhưng node dừng đứng lại đúng tại mép, không theo chuột nữa cho tới khi chuột quay lại vào trong canvas.

**Nguyên nhân đã xác nhận.** `attachDrag` ([src/render/interactions/drag.ts:108](./../src/render/interactions/drag.ts)) đăng ký `pointermove`/`pointerup` trên `stage` (đối tượng Pixi), không phải trên `window`/`document`. Pixi's `EventSystem` phát sinh các sự kiện này từ listener DOM gắn vào chính `<canvas>`, nên khi con trỏ rời khỏi vùng canvas, không còn sự kiện `pointermove` nào được Pixi bắn ra nữa — `onMove` trong `attachDrag` ngừng được gọi dù nút chuột vẫn đang giữ.

Đã đo trực tiếp trên trình duyệt: kéo một text node từ CSS `y=451` lên `y=45` (vượt hẳn ra ngoài canvas phía trên) — `transform.y` của node dừng lại đúng giá trị ứng với điểm chạm mép canvas, không tiếp tục giảm theo con trỏ.

**Vì sao hoãn.** Phát hiện ngoài phạm vi 3 lỗi được yêu cầu sửa lần này (chữ mờ, unselect giữa ký tự, drag bị trình duyệt cướp). Không tự ý mở rộng sang sửa luôn.

**Khi nào cần.** Ngay khi có báo cáo user "kéo/resize gần mép bị giật/dừng".

**Chạm vào đâu.** `src/render/interactions/drag.ts`, và có thể cả `rotate.ts`/`resizeMath.ts`'s gesture handlers nếu chúng dùng cùng pattern (`stage.on('pointermove', ...)`). Hướng sửa chuẩn: dùng [Pointer Capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) (`canvas.setPointerCapture(event.pointerId)` tại `pointerdown`) để canvas tiếp tục nhận `pointermove` ngay cả khi con trỏ đã rời khỏi biên của nó — không cần đổi target sang `window`. Cần kiểm tra Pixi v8's `EventSystem` có tự động set pointer capture hay phải làm thủ công qua `app.canvas`.

---

## 2. Không có pasteboard — nội dung tràn quá mép page bị cắt cứng, không cuộn/scroll ra ngoài được

**Triệu chứng.** Với text warp cong sâu (hoặc bất kỳ node nào lớn hơn trang), phần tràn ra ngoài `page.size` bị cắt bởi chính biên của `<canvas>` — không có vùng "bàn làm việc" (pasteboard) màu xám xung quanh trang như Figma/Illustrator/Canva, nơi nội dung tràn vẫn hiển thị được (chỉ bị cắt khi export).

**Nguyên nhân đã xác nhận.** `CanvasHost.tsx` khởi tạo `Application` với kích thước đúng bằng `page.size` ([CanvasHost.tsx:58-67](./../src/ui/CanvasHost.tsx)) — canvas **chính là** trang, không có khung nhìn rộng hơn. Đã tái hiện: warp text cao ~430px trong local space bị cắt phẳng tại `y=500` (đáy trang 900×500).

**Vì sao hoãn.** Đây là quyết định kiến trúc lớn (đụng camera, marquee, ruler, export — xem trao đổi trước đó về "vấn đề 3" của warp text), không phải bug nhỏ, và không nằm trong 3 việc được yêu cầu ở lượt sửa này.

**Khi nào cần.** Khi làm bất kỳ tính năng nào có nội dung dễ vượt khung trang (warp sâu, shape lớn, ảnh phóng to) — hoặc ngay khi user phàn nàn cụ thể về việc này.

**Chạm vào đâu.** `src/ui/CanvasHost.tsx` (Application phải rộng bằng viewport thay vì `page.size`, trang chỉ là một `Graphics` rect vẽ bên trong), `src/render/viewport.ts` (world↔screen vẫn giữ nguyên vì đã tách biệt với kích thước canvas), export (`exportService.ts` phải crop về đúng `page.size` khi xuất, không xuất nguyên viewport), và `SelectionOverlay.tsx`/`Rulers.tsx` (kiểm tra có giả định ngầm `canvas size == page size` không).
