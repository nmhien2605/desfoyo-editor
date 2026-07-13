# Phase 4 — Templates & Assets

Đưa sản phẩm thành công cụ dùng được cho end-user: template, asset library, multi-page, và export vector/PDF.

## Mục tiêu

- Lưu/tải document; thư viện template.
- Upload & quản lý asset (image, SVG, font).
- Import SVG, mask/crop ảnh, filter ảnh.
- Multi-page / nhiều artboard, kích thước preset.
- Export SVG & PDF (ngoài PNG/JPG đã có).

## Phạm vi chức năng

### Persistence & template
- Serialize/deserialize document (.json) + autosave.
- **Template library**: lưu document làm template, duyệt & áp dụng.
- Thumbnail tự sinh (render offscreen thu nhỏ).
- Kích thước preset: social post, story, A4, poster, custom…

### Asset management
- Upload image/SVG/font; lưu trữ (local hoặc S3/R2) qua **AssetService**.
- Panel asset: tìm kiếm, kéo-thả vào canvas (dnd-kit).
- Thư viện shape/icon/background dựng sẵn.

### Image editing
- **Crop** (freeform + tỉ lệ), **mask** bằng shape hoặc text.
- Filter ảnh cơ bản: brightness, contrast, saturation, blur (WebGL filters).
- Thay ảnh giữ nguyên khung/mask.

### SVG
- **Import SVG** → parse (svgson) → map sang node model (path/shape).
- Đổi màu theo path (overrides).
- **Export SVG**: serializer riêng từ model → vector thuần (text-outline khi cần).

### Multi-page
- Nhiều page/artboard trong một document.
- Điều hướng page, thêm/xóa/nhân bản page, sắp xếp thứ tự.

### Export
- **PDF** đa trang qua pdf-lib (mỗi page → 1 trang), chèn ảnh/vector.
- Tùy chọn chất lượng/scale, bleed cơ bản.
- Batch export nhiều page.

## Việc kỹ thuật

- **PersistenceService** + schema migration (đảm bảo mở file cũ an toàn).
- **AssetService** (upload, cache, thumbnail, tham chiếu bằng id).
- **SVG import/export** module (map 2 chiều model ↔ SVG).
- **ExportService** mở rộng: SVG serializer + PDF builder.
- UI: TemplatePanel, AssetPanel, PageManager, ExportDialog.

## Deliverables

- Save/load + autosave + template library có thumbnail.
- Upload asset + panel kéo-thả.
- Crop/mask + filter ảnh.
- Import & export SVG; export PDF đa trang.
- Multi-page manager.
- Test round-trip: export SVG → import lại → khớp cơ bản.

## DoD

- Tạo template, áp vào document mới → dựng lại đầy đủ (font/asset resolve đúng).
- Export PDF 5 trang mở đúng trên trình đọc phổ biến.
- Import SVG icon giữ hình & cho đổi màu.

## Rủi ro & lưu ý

- Resolve font/asset khi mở template (thiếu asset → fallback rõ ràng).
- Export SVG cho text có effect: quyết định outline vs giữ text (mất effect) — tài liệu hóa hành vi.
- Migration schema phải kỹ để không hỏng document cũ.

## Ước lượng

~4–5 tuần.
