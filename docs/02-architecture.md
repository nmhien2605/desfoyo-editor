# 02 — Kiến trúc tổng thể

## Nguyên tắc chủ đạo

1. **Model ≠ Renderer.** Document là JSON thuần (source of truth). PixiJS chỉ đọc model và vẽ. Không lưu state UI trong đối tượng Pixi.
2. **Headless core.** Toàn bộ logic (commands, history, selection, layout, effects) không phụ thuộc React. React chỉ là lớp trình bày UI + binding.
3. **Unidirectional data flow.** UI phát _command_ → store cập nhật _model_ → renderer _reconcile_ → screen.
4. **Effect = pipeline filter.** Mọi hiệu ứng là một hoặc nhiều WebGL filter xếp chồng, cấu hình bằng params trong model.

## Sơ đồ layer

```
┌───────────────────────────────────────────────────────────┐
│  UI Layer (React + TS)                                    │
│  Toolbar · Panels (layers, properties, effects) · Menus   │
│  Bindings: đọc store, dispatch command                    │
└───────────────▲───────────────────────┬───────────────────┘
                │ subscribe             │ dispatch(command)
┌───────────────┴───────────────────────▼───────────────────┐
│  Editor Core (headless, framework-agnostic)               │
│  • Store (Zustand)   • Command bus   • History (undo/redo)│
│  • Selection & transform   • Snapping/guides              │
│  • Document model (JSON schema, validation, migration)    │
└───────────────▲───────────────────────┬───────────────────┘
                │ model diff            │ read model
┌───────────────┴───────────────────────▼───────────────────┐
│  Render Layer (PixiJS / WebGL)                            │
│  • SceneReconciler: model node → Pixi DisplayObject       │
│  • Effect pipeline (filters/shaders)                      │
│  • Text engine (opentype.js → geometry/mesh)              │
│  • Hit-testing, viewport (zoom/pan), export renderer      │
└───────────────▲───────────────────────┬───────────────────┘
                │                       │
┌───────────────┴───────────────────────▼───────────────────┐
│  Services                                                 │
│  Fonts · Assets/Storage · Persistence · Collab (Yjs)      │
│  Export (PNG/JPG/SVG/PDF)                                 │
└───────────────────────────────────────────────────────────┘
```

## Các module cốt lõi

### 1. Document Model

- Cây node (scene graph) dạng JSON, có `id`, `type`, `transform`, `props`, `children`.
- Versioned schema + migration.
- Chi tiết ở [04-data-model.md](./04-data-model.md).

### 2. Store & State

- **Zustand** giữ document + editor state (selection, tool đang dùng, viewport).
- **Immer** cho immutable update.
- Tách `documentSlice` (được undo/redo, được sync collab) khỏi `uiSlice` (ephemeral: hover, zoom, panel mở/đóng).

### 3. Command Bus + History

- Mọi thay đổi model đi qua **command** (ví dụ `AddNode`, `UpdateProps`, `Reorder`, `Group`).
- Command có `apply` / `invert` → nền tảng cho **undo/redo** (pattern Command + inverse) hoặc dùng patch-based (immer `produceWithPatches`).
- History stack giới hạn kích thước, hỗ trợ gộp (coalesce) khi kéo slider liên tục.

### 4. SceneReconciler (model → Pixi)

- **Quyết định**: không tự viết bộ diff cây JSON tổng quát. Mọi thay đổi đi qua command bus, và mỗi command đã biết chính xác `nodeId` bị ảnh hưởng (`UpdateProps(nodeId, ...)`, `AddNode(parentId, node)`...). Store phát thông báo theo `nodeId`, reconciler subscribe theo id và cập nhật/tạo/xóa đúng `DisplayObject` đó — không cần diff lại từ đầu.
- Mỗi node type có một **renderer adapter** (`TextRenderer`, `ShapeRenderer`, `ImageRenderer`, `GroupRenderer`).
- **Không dùng `@pixi/react`**: viết binding thủ công quanh Pixi để reconciler này là điểm diff duy nhất, giữ render layer độc lập với React (đúng nguyên tắc headless core).

### 5. Effect Pipeline

- Danh sách filter theo thứ tự, mỗi filter là `PIXI.Filter` với uniforms lấy từ `node.props.effects`.
- Ví dụ chuỗi cho text: `Fill(gradient/texture) → Stroke → InnerShadow → Extrude3D → OuterGlow`.
- **Caching (RenderTexture)**: Xây khi thực sự xếp chồng nhiều filter và cần tránh re-render toàn bộ.

### 6. Text Engine

- **opentype.js** để lấy glyph path, đo metric, dựng path cho **text-on-path / curved / warp**.
- Chuyển path → geometry (mesh) khi cần warp/3D; hoặc dùng `PIXI.Text`/`BitmapText` cho text phẳng đơn giản (nhanh hơn).
- Chiến lược lai: text đơn giản dùng Pixi Text; text có effect nặng chuyển sang mesh/shader.

### 7. Viewport

- Container gốc có transform (scale = zoom, position = pan).
- Hit-testing qua Pixi interaction; tọa độ screen ↔ world convert qua ma trận viewport.

### 8. Services

- **FontService**: load Google Fonts / font upload, cache, cung cấp cho opentype.js + CSS.
- **AssetService**: upload, lưu trữ (S3/R2), sinh thumbnail. Tạm thời chưa có backend — `AssetResolver` nội bộ resolve `assetId` → base64 data URI nhúng trong document JSON.
- **PersistenceService**: serialize/deserialize document, autosave.
- **ExportService**: render offscreen ở scale cao → PNG/JPG; export vector → SVG; ghép → PDF.

## Luồng dữ liệu ví dụ (kéo slider "độ cong chữ")

1. UI slider `onChange` → `dispatch(UpdateProps(nodeId, { curve: 0.4 }))`.
2. Command apply patch vào model; đẩy vào history (coalesce với các bước kéo trước).
3. Store thông báo thay đổi node đó.
4. SceneReconciler cập nhật `TextRenderer` của node → tính lại geometry theo `curve`.
5. Effect pipeline re-render texture của node → screen. Các node khác không đụng tới.

## Public API (React component)

- `<Editor document={initialDocument} onChange={(doc) => ...} ref={editorRef} />` — **uncontrolled**: editor tự giữ Zustand store nội bộ (selection, history, document), không phải controlled input.
- `onChange` báo document mới nhất (để host app persist/autosave); không lift toàn bộ state lên mỗi frame kéo/resize.
- `ref` expose API mệnh lệnh: `getDocument()`, `loadDocument(doc)`, `export(format)`, `undo()/redo()`.
- Lý do: state nội bộ (selection, drag đang diễn ra) đổi ở tần suất 60fps, không hợp để lift vào state React của host app mỗi lần; đã tách `uiSlice` khỏi `documentSlice` cho đúng mục đích này.

## Repo structure (quyết định)

- **Single package**, không phải monorepo. Tách theo folder (`core/render/effects/text/services/ui/schema`) là đủ; tách package riêng (core/ui/demo) chỉ làm khi có nhu cầu thực sự (ví dụ package ngoài cần dùng riêng `core`).

## Validation boundary (Zod)

- Chỉ validate ở **trust boundary**: load document, import file, paste từ clipboard/JSON. Không validate lại toàn bộ document sau mỗi command (kéo/resize chạy qua TypeScript đã type-safe, không cần Zod trên hot path).

## Cấu trúc thư mục đề xuất (source code)

```
src/
  core/            # headless: store, commands, history, model, selection
  render/          # PixiJS: reconciler, renderers, viewport, hit-test
  effects/         # filters/shaders + effect registry & presets
  text/            # opentype integration, layout, warp, path
  services/        # fonts, assets, persistence, export, collab
  ui/              # React components (toolbar, panels, canvas host)
  schema/          # types + zod + migrations
  index.ts         # public API của library
```
