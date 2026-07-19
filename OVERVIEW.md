# Desfoyo Editor — Tổng quan tiến độ dự án

*Tài liệu dành cho PM, cập nhật theo trạng thái thực tế của code. Chi tiết kỹ thuật xem `CONTEXT.md`.*

## Sản phẩm là gì

Một thư viện editor thiết kế đồ họa cho web (nhúng vào ứng dụng React), kiểu **Canva**, với điểm khác biệt cốt lõi là engine **hiệu ứng chữ nâng cao** kiểu **Kittl** (uốn cong, đổ bóng, viền nhiều lớp, khối 3D...).

Dự án chia làm **5 giai đoạn (phase)**. Hiện đang ở **Phase 4/5**.

## Tình trạng tổng quan

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 1. Nền tảng Canvas | Dựng, chọn, kéo/thả, resize object, xuất ảnh cơ bản | ✅ Hoàn thành |
| 2. Thao tác chỉnh sửa | Undo/redo, group/ungroup, căn chỉnh, snap lưới, zoom/pan, copy/paste | ✅ Hoàn thành |
| 3. Hiệu ứng chữ | Font, viền/đổ bóng/glow, uốn cong chữ, chữ chạy theo đường dẫn, khối 3D, hiệu ứng shader tùy chỉnh, bộ preset dựng sẵn | ✅ Hoàn thành |
| 4. Template & Asset | Multi-page, quản lý ảnh/font, chỉnh sửa ảnh, thư viện SVG, xuất PDF/SVG | 🟡 Đang làm (1/5 phần) |
| 5. Nâng cao & Cộng tác | Làm việc nhóm real-time, lưu cloud, animation, plugin | ⬜ Chưa bắt đầu |

## Đã làm được gì (chi tiết dễ hiểu)

**Phase 1-2 — Canvas cơ bản** đã xong hoàn toàn: người dùng có thể tạo trang thiết kế, thêm chữ/hình/ảnh, kéo thả, xoay, resize, nhóm nhiều object lại, căn chỉnh, dùng phím tắt, undo/redo, zoom/pan, snap vào lưới hoặc vào cạnh object khác — đầy đủ trải nghiệm chỉnh sửa cơ bản như một trình thiết kế thật.

**Phase 3 — Hiệu ứng chữ (điểm bán hàng chính của sản phẩm)** đã xong hoàn toàn:
- Upload font riêng, viền chữ nhiều lớp (nhiều màu/độ dày chồng lên nhau).
- Các hiệu ứng: đổ bóng ngoài, đổ bóng trong, glow (phát sáng), viền tách, làm mờ, khối 3D nổi thật (không phải giả lập).
- Uốn chữ theo 6 kiểu: cong, sóng, phồng, cờ bay, phối cảnh, và **chữ chạy theo một đường cong tự vẽ** (kéo thả điểm điều khiển ngay trên canvas).
- Hiệu ứng shader tùy chỉnh (kiểu hiệu ứng ảnh nghệ thuật).
- **Bộ preset 1-chạm**: chọn sẵn 5 phong cách (neon, chrome/kim loại, sticker, retro, 3D) áp ngay lên chữ, không cần chỉnh tay từng thông số.

Nói đơn giản: người dùng có thể biến một dòng chữ thường thành logo/text nghệ thuật chỉ bằng vài cú click, tương đương các tính năng "hot" nhất của Kittl.

**Phase 4 — Template & Asset**, mới hoàn thành phần đầu tiên:
- ✅ **Multi-page**: một document giờ có thể có nhiều trang/khổ (ví dụ: bài Instagram vuông, story dọc, A4, poster...), có thanh chuyển trang, nhân bản trang, xóa trang, đổi thứ tự trang.
- ⬜ Còn lại 4 phần chưa làm: chỉnh sửa ảnh (crop/mask/lọc màu), thư viện tài nguyên (upload & quản lý ảnh/icon tái sử dụng), lưu template & mở lại, và nhập/xuất file SVG + xuất PDF nhiều trang.

**Phase 5 — Nâng cao & Cộng tác**: chưa bắt đầu (làm việc nhóm real-time, lưu trên cloud, animation, hệ thống plugin).

## Rủi ro / điểm cần quyết định sớm

- **Phase 4 phần "lưu trữ" (persistence)** cần PM/product quyết định hướng trước khi làm: thư viện chỉ hỗ trợ chức năng (bên dùng thư viện tự lo việc lưu file), hay thư viện tự lưu vào trình duyệt (autosave) và có màn hình quản lý template? Hai hướng này chênh lệch khối lượng công việc khá lớn.
- **Phần xuất SVG cho chữ có hiệu ứng**: cần chọn giữa giữ chữ dạng text (sửa được nhưng mất hiệu ứng khi mở lại) hay chuyển thành hình vẽ cố định (giữ đúng hình nhưng không sửa chữ được nữa).
- Storybook (thư viện demo trực quan từng hiệu ứng) đã chủ động bỏ qua ở giai đoạn này vì dự án chưa gần ngày public — có thể làm lại khi cần.

## Ghi chú

Các thay đổi của Phase 3 (Pass C, D) và Phase 4 (Pass A) hiện **chưa commit vào git** — đã code xong, test và kiểm tra chạy thử đầy đủ, chờ xác nhận trước khi chốt.
