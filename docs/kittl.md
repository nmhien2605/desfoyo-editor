# Tài liệu Yêu cầu Tính năng (Feature Requirements)
## Sản phẩm: Kittl — Text Effects
**Nguồn tham khảo:** https://www.kittl.com/features/text-effects
**Người tổng hợp:** Business Analyst
**Ngày:** 19/07/2026

---

## 1. Tổng quan (Overview)

Trang "Text Effects" giới thiệu module hiệu ứng chữ (text effects) trong nền tảng thiết kế Kittl, cho phép người dùng biến đổi, tạo bóng đổ và trang trí chữ chỉ với vài thao tác, phục vụ các nhu cầu thiết kế logo, poster, merchandise, bao bì, mạng xã hội...

---

## 2. Danh sách yêu cầu tính năng (Feature Requirements)

### FR-01: Thư viện font tích hợp sẵn (Built-in Designer Fonts)
- Cung cấp hơn 1.400 font chữ có sẵn trong hệ thống.
- Bao gồm 135 font cao cấp thuộc bộ Monotype.
- Bao gồm các font độc quyền do Kittl thiết kế riêng cho logo và thiết kế nổi bật.

### FR-02: Tải lên font riêng (Upload Custom Fonts)
- Cho phép người dùng upload file font riêng (font thương hiệu/brand font).
- Font tải lên phải áp dụng được đầy đủ các hiệu ứng chữ nâng cao như font hệ thống.

### FR-03: Biến đổi hình dạng chữ (Text Transformations) — 8 kiểu
- Hỗ trợ tối thiểu 8 kiểu biến đổi: **arch (vòm), wave (sóng), rise (nâng), flag (cờ), circle (tròn), distort (méo), angle (nghiêng), custom mesh (lưới tùy chỉnh)**.
- Cho phép điều chỉnh cường độ đường cong (curve intensity) bằng thanh trượt (slider) trực tiếp.
- Cho phép điều chỉnh hướng (direction) và góc (angle) bằng slider.
- Cho phép kéo-thả (drag) các handle biến đổi trực tiếp trên canvas để tùy chỉnh đường dẫn (path).

### FR-04: Hiệu ứng bóng đổ có thể chỉnh sửa (Fully Editable Shadows)
- Hỗ trợ 4 kiểu bóng: **drop shadow (đổ bóng), line shadow (bóng đường viền), block shadow (bóng khối), 3D shadow (bóng 3D)**.
- Cho phép tùy chỉnh đầy đủ: độ mờ (blur), độ lệch (offset), màu sắc (color), góc (angle).
- Bóng đổ tự động scale (co giãn) theo kích thước chữ.
- Bóng đổ vẫn giữ trạng thái có thể chỉnh sửa (editable) sau khi export, không cần dựng lại hiệu ứng khi thay đổi nội dung chữ.

### FR-05: Trang trí chữ động (Dynamic Text Decorations)
- Hỗ trợ các dạng trang trí: **strokes (viền), cuts (cắt), lines (đường kẻ), textures (họa tiết)** để tạo điểm nhấn hoặc tương phản.
- Hỗ trợ tạo phong cách: vintage fade, editorial line, poster-style accent.
- Cho phép bật/tắt (toggle) từng lớp trang trí (decoration layer) độc lập mà không ảnh hưởng đến layout tổng thể.

### FR-06: Kết hợp nhiều hiệu ứng (Layered / Combined Effects)
- Cho phép kết hợp đồng thời nhiều loại hiệu ứng (shadow + decoration + transformation) trên cùng một đối tượng chữ.
- Chỉnh sửa hoặc xóa từng hiệu ứng độc lập tại bất kỳ thời điểm nào.
- Toàn bộ thao tác chỉnh sửa hiệu ứng phải là **non-destructive editing** (không phá hủy dữ liệu gốc).

### FR-07: Bảng điều khiển hiệu ứng (Effects Panel)
- Cung cấp panel "Effects" ở khu vực bên phải giao diện editor để chọn và áp dụng hiệu ứng cho text đang được chọn.
- Cho phép áp dụng hiệu ứng chỉ bằng vài cú click (one-click apply).
- Cung cấp tùy chọn nâng cao (advanced settings) cho người dùng chuyên nghiệp: blur, color, offset, angle...

### FR-08: Xuất file có giữ hiệu ứng (Export with Effects Preserved)
- Cho phép xuất thiết kế có áp dụng text effects ra các định dạng: **PNG, JPG, SVG, PDF**.
- Hiệu ứng phải được giữ nguyên (preserved) trong file xuất, phục vụ cả nhu cầu in ấn (print) và kỹ thuật số (digital).

---

## 3. Câu hỏi thường gặp liên quan đến tính năng (tổng hợp từ FAQ)

| STT | Câu hỏi | Ghi chú yêu cầu liên quan |
|---|---|---|
| 1 | Cách thêm/tùy chỉnh hiệu ứng chữ | Liên quan FR-07 |
| 2 | Hiệu ứng nào là độc quyền của Kittl | Shading, Decorations, Transformations (FR-03, FR-04, FR-05) |
| 3 | Có thể kết hợp nhiều hiệu ứng trên cùng 1 text không | FR-06 |
| 4 | Phù hợp cả người mới lẫn designer chuyên nghiệp | Yêu cầu UX: giao diện đơn giản nhưng có chế độ nâng cao |
| 5 | So sánh với Canva/Adobe Express | Điểm khác biệt: độ chi tiết của shadow, mesh, distortion control |
| 6 | Hỗ trợ xuất file có hiệu ứng | FR-08 |

---

## 4. Ghi chú (Notes)
- Tài liệu này được tổng hợp dựa trên nội dung công khai trên trang landing page sản phẩm, mang tính chất mô tả tính năng ở mức high-level (không phải đặc tả kỹ thuật chi tiết/Backlog).
- Cần làm việc thêm với đội Product/UX để bổ sung: acceptance criteria, use case chi tiết, ràng buộc kỹ thuật (giới hạn số lượng hiệu ứng, hiệu năng render, giới hạn dung lượng font upload...).