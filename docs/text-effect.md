# Tài liệu phân tích: 8 hiệu ứng Text Transformation
*(Tham khảo từ Kittl – kittl.com/features/text-effects — chỉ dùng cho mục đích phân tích/tài liệu nội bộ)*

## 1. Mục đích & phạm vi

Tài liệu mô tả lại 8 kiểu biến đổi văn bản (Text Transformation) trong panel "Transformation", dựa trên quan sát trực tiếp từ:
- Ảnh giao diện panel Transformation (8 nút chọn + thanh trượt/toggle tương ứng).
- Ảnh minh hoạ path (đường dẫn màu xanh) và các point/anchor/handle xuất hiện trên canvas khi chọn từng hiệu ứng.

Toàn bộ mô tả về path và cách uốn cong được viết theo quan sát hình ảnh, không dùng công thức toán học, không giả định tính năng ngoài những gì thấy trên UI.

## 2. Cấu trúc chung của panel "Transformation"

- Panel hiển thị dạng lưới 4 cột x 2 hàng gồm 8 nút: **Custom, Distort, Circle, Angle, Arch, Rise, Wave, Flag**.
- Mỗi nút đang chọn được viền sáng (highlight) màu xanh dương.
- 5 hiệu ứng có tên chữ hiển thị cong/uốn ngay trên icon nút (Circle, Angle, Arch, Rise, Wave, Flag) để gợi ý hình dạng kết quả; riêng Custom và Distort hiển thị chữ thẳng.
- Bên dưới lưới nút là vùng thông số riêng cho từng hiệu ứng:
  - **Custom, Distort**: không có thanh trượt, chỉ có 2 nút **Reset** và **Confirm**.
  - **Circle**: có 1 công tắc (toggle) **"Direction Inverted"**.
  - **Angle, Arch, Rise, Wave, Flag**: mỗi hiệu ứng có đúng 1 thanh trượt phần trăm, đặt tên theo hiệu ứng (ví dụ "Arch Curve", "Wave Curve"...), khoảng giá trị 0–100%.
- Khi 1 hiệu ứng đang được áp dụng, trên canvas xuất hiện:
  - 1 đường **path** màu xanh dương chạy dọc theo văn bản (hoặc bao quanh văn bản với Distort).
  - Các **point** hình tròn rỗng nằm trên hoặc quanh path, có thể kéo bằng chuột để chỉnh hình dạng.

## 3. Phân nhóm hiệu ứng

| Nhóm | Hiệu ứng | Đặc điểm nhóm |
|---|---|---|
| **A. Biến dạng tự do (Freeform)** | Custom, Distort | Không có thanh trượt %, chỉnh hoàn toàn bằng cách kéo point/khung bao tay; kết quả không đối xứng, tuỳ ý người dùng |
| **B. Đường dẫn thẳng/nghiêng đơn giản** | Angle | Path chỉ là 1 đoạn thẳng, không có độ cong |
| **C. Đường dẫn cong đơn (1 cung cong)** | Arch, Rise | Path là 1 cung cong liền mạch, chỉ cong về 1 phía |
| **D. Đường dẫn sóng (nhiều cung cong)** | Wave, Flag | Path gồm nhiều đoạn cong nối tiếp, tạo hình lượn sóng |
| **E. Đường dẫn khép kín** | Circle | Path là 1 đường tròn khép kín, văn bản chạy vòng quanh |
