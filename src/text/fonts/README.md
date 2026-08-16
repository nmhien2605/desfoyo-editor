# Font bundle

Ba font dùng cho demo và cho test của `src/text/`. Tất cả đều là SIL Open Font
License 1.1, tải từ https://github.com/google/fonts.

| File                  | Family  | Nguồn         | Vai trò                                      |
| --------------------- | ------- | ------------- | -------------------------------------------- |
| `Poppins-Regular.ttf` | Poppins | `ofl/poppins` | sans trung tính, font mặc định khi thêm text |
| `Anton-Regular.ttf`   | Anton   | `ofl/anton`   | display đậm, hợp để thử text effect          |
| `Lobster-Regular.ttf` | Lobster | `ofl/lobster` | script, để thử chữ có nét cong phức tạp      |

Thư viện xuất bản **không** kèm font — `src/index.ts` không import thư mục này.
Ứng dụng nhúng editor tự gọi `registerFont()` với font của mình.
