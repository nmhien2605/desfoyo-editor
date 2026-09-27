# Sử dụng

## API export chính (`src/index.ts`)

```ts
import {
  Editor,
  type EditorProps,
  type EditorHandle,
  // schema types (Document, Page, Node, Transform, AssetRef...)
  type Document,
  // font
  registerFont,
  loadFont,
  getLoadedFont,
  registeredFamilies,
  onFontLoaded,
  measureText, // đo size TextNode (xem mục 4)
  type HistoryState, // payload của onHistoryChange
  // headless render (không cần mount <Editor>)
  renderPageToPng,
  renderPageToSvg,
} from '@desfoyo/editor';
import '@desfoyo/editor/styles.css';
```

## 1. Render component `Editor`

`Editor` là **uncontrolled**: prop `document` chỉ được đọc **một lần lúc mount**, sau đó editor tự giữ document trong store nội bộ và báo thay đổi qua `onChange`. Đổi prop `document` sau khi mount **không có tác dụng** — muốn thay document dùng `ref.loadDocument()`, muốn thêm asset dùng `ref.addAsset()` (mục 2, 5).

```tsx
import { useState } from 'react';
import { Editor, type Document } from '@desfoyo/editor';
import '@desfoyo/editor/styles.css';

const emptyDocument: Document = {
  version: 1,
  id: 'doc-1',
  meta: { title: 'Untitled', createdAt: Date.now(), updatedAt: Date.now() },
  pages: [
    {
      id: 'page-1',
      name: 'Page 1',
      size: { width: 800, height: 600 },
      background: { type: 'color', value: '#ffffff' },
      children: [],
    },
  ],
  assets: {},
};

function App() {
  const [doc, setDoc] = useState<Document>(emptyDocument);

  return (
    <div style={{ height: 600 }}>
      <Editor document={doc} onChange={setDoc} />
    </div>
  );
}
```

- `document` phải khớp `DocumentSchema` — component sẽ `parse()` bằng Zod lúc mount, document sai shape sẽ throw.
- `onChange` bắn mỗi khi document trong store đổi (thêm/xoá node, sửa transform, undo/redo, v.v.) — dùng để lưu vào DB/localStorage. Truyền `setDoc` như ví dụ là để **lưu**, không phải để điều khiển editor.
- Mọi callback prop (`onChange`, `onSelectionChange`, `onHistoryChange`, `onNodeDoubleClick`) luôn gọi bản **mới nhất** của hàm ở lần render gần nhất — closure đọc React state của host không bị cũ, và callback truyền vào sau lần render đầu vẫn chạy.
- `Editor` fill 100% theo container cha (`h-full w-full`) — **cần container cha có height xác định** (như `style={{ height: 600 }}` ở trên, hoặc `h-screen` nếu muốn full-screen). Không tự set kích thước cố định nữa.
- `className` áp thêm vào container gốc của `Editor` (nối sau class mặc định) — dùng cho spacing/border/v.v., không bắt buộc để set kích thước.

Ví dụ page/node đầy đủ hơn (text, image, group...) xem `demo/samples.ts` trong repo gốc (không nằm trong package đã build, chỉ có trong source repo).

## 2. Điều khiển editor qua `ref` (`EditorHandle`)

```tsx
import { useRef } from 'react';
import { Editor, type EditorHandle } from '@desfoyo/editor';

function App() {
  const editorRef = useRef<EditorHandle>(null);

  const handleExportPng = async () => {
    const blob = await editorRef.current?.export('png', 2); // scale x2
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button onClick={() => editorRef.current?.undo()}>Undo</button>
      <button onClick={() => editorRef.current?.redo()}>Redo</button>
      <button onClick={handleExportPng}>Export PNG</button>
      <Editor ref={editorRef} document={doc} onChange={setDoc} />
    </>
  );
}
```

`EditorHandle`:

| Method | Mô tả |
| --- | --- |
| `getDocument(): Document` | Lấy snapshot document hiện tại từ store (đồng bộ, không đợi `onChange`). |
| `loadDocument(doc: Document): void` | Thay toàn bộ document, reset selection + undo/redo history. Dùng khi load 1 design khác vào editor đang mở. |
| `export(format: 'png' \| 'svg', scale?: number): Promise<Blob>` | Export page đang active. `scale` chỉ áp dụng cho `'png'` (mặc định 1). PNG luôn có kích thước đúng `page.size × scale` (khung cả page, không phụ thuộc nội dung hay zoom đang xem). Tự chờ các ảnh/SVG còn đang load xong mới xuất — gọi ngay sau `loadDocument`/`addNode` vẫn ra ảnh đầy đủ. Throw nếu gọi trước khi editor mount xong canvas. |
| `undo(): void` / `redo(): void` | Điều khiển undo/redo history. |
| `canUndo(): boolean` / `canRedo(): boolean` | Còn bước undo/redo không — dùng để enable/disable nút. Muốn tự cập nhật theo sự kiện thì dùng prop `onHistoryChange`. |
| `addAsset(assetId: string, asset: AssetRef): void` | Thêm/ghi đè 1 asset (`image`, `svg`, `image-url`), validate bằng `AssetRefSchema` (sai shape sẽ throw). **Không** tạo history entry — undo `addNode` dùng asset đó chỉ xoá node, asset vẫn giữ để redo được. Xem mục 5. |
| `addNode(node: Node, opts?: { pageId?, parentId?, index? }): void` | Thêm node vào document. `node` phải khớp `NodeSchema` (build tay hoặc validate bằng `NodeSchema.parse`). `pageId` mặc định là page đang active. |
| `removeNode(nodeId, opts?: { pageId?, parentId? }): void` | Xoá node theo id. |
| `updateNodeProps(nodeId, patch: Partial<Node>, opts?: { pageId? }): void` | Patch field bất kỳ của node (fill, opacity, font...). |
| `updateNodeTransform(nodeId, patch: Partial<Transform>, opts?: { pageId? }): void` | Patch riêng `transform` (x/y/scale/rotation) — tách khỏi `updateNodeProps` vì đây là thao tác hay lặp lại khi kéo/resize/rotate bằng code. |
| `reorderNode(nodeId, to: 'up' \| 'down' \| 'top' \| 'bottom', opts?: { pageId?, parentId? }): void` | Đổi thứ tự layer (z-index) trong page/group. |
| `selectNode(nodeIds: string[]): void` | Thay toàn bộ selection bằng danh sách này. Mảng rỗng `[]` = clear selection. |
| `groupSelection(): void` / `ungroupSelection(): void` | Gộp/tách các node đang chọn thành `GroupNode`. |
| `deleteSelection(): void` | Xoá các node đang chọn. |
| `duplicateSelection(): void` | Nhân đôi các node đang chọn (giống `mod+d`). |
| `copySelection(): void` / `cutSelection(): void` / `pasteClipboard(): void` | Copy/cut/paste nội bộ (clipboard riêng của editor, không dùng OS clipboard). |

Tất cả method add/update/remove/reorder ở trên đi qua cùng hệ thống undo/redo của editor (mỗi lệnh là 1 history entry) — không cần tự quản lý riêng.

## 3. Props đầy đủ (`EditorProps`)

| Prop | Kiểu | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `document` | `Document` | ✅ | Document ban đầu, validate bằng Zod. |
| `onChange` | `(doc: Document) => void` | | Callback mỗi khi document thay đổi. |
| `onSelectionChange` | `(nodeIds: string[]) => void` | | Callback mỗi khi selection thay đổi thật sự (so sánh nội dung, không fire nhầm khi chỉ document đổi). Dùng để bind properties panel / enable-disable nút action tự build. |
| `className` | `string` | | Class nối thêm vào container gốc (spacing/border...) — không dùng để set kích thước, xem mục 1. |
| `initialSelectedNodeIds` | `string[]` | | Node được chọn sẵn lúc mount. |
| `shortcuts` | `false \| string[]` | | `undefined` (mặc định) giữ nguyên toàn bộ phím tắt tích hợp sẵn (`mod+z`, `mod+d`, `delete`, `mod+g`...). `false` tắt hết — dùng khi host tự bind phím riêng và gọi qua `EditorHandle`. `string[]` whitelist các key muốn giữ (vd `['mod+z', 'mod+shift+z']`), tắt phần còn lại — tránh đụng độ với shortcut app đã có. |
| `onExport` | `(format: 'png' \| 'svg') => void` | | Callback khi user bấm nút export trong toolbar (không thay thế `ref.export`, chỉ là hook UI). |
| `devMenu` | `DevMenuConfig` | | Chỉ dùng nội bộ để demo chuyển đổi giữa các sample document — bỏ qua trong app thật. |
| `chrome` | `boolean` | | Mặc định `true` (UI đầy đủ: sidebar, inspector, toolbar). `false` = chỉ render canvas + khung chọn, không có gì khác — xem mục 3b. |
| `viewScale` | `number` | | Zoom cố định do host quyết định: canvas có kích thước CSS = `page.size × viewScale`, tắt wheel-zoom, pan (Space/chuột giữa), phím tắt zoom và "Fit". Đổi giá trị lúc runtime sẽ resize canvas tại chỗ (không remount, giữ history). Không truyền = hành vi zoom/pan bình thường. |
| `onNodeDoubleClick` | `(nodeId, nodeType) => boolean \| void` | | Gọi khi double-click node đang chọn. Khi có prop này, hành vi mặc định (sửa text inline, crop ảnh) **chỉ chạy nếu callback trả `true`** — dùng để mở modal sửa text của host. |
| `onHistoryChange` | `(h: HistoryState) => void` | | Bắn sau mỗi thay đổi history: `{ canUndo, canRedo, pastLength, reason }`, `reason` là `'push'` (edit mới), `'undo'`, `'redo'` hoặc `'reset'` (`loadDocument`). Một lần kéo/resize/rotate = đúng 1 `'push'` lúc thả chuột. |

## 3b. Nhúng chỉ canvas (host tự làm UI)

Khi app đã có toolbar/modal riêng và chỉ cần vùng vẽ (vd đặt canvas lên ảnh mockup sản phẩm):

```tsx
<Editor
  ref={editorRef}
  document={doc}
  chrome={false}          // không sidebar/inspector/toolbar
  viewScale={scale}       // canvas = page.size × scale (px CSS), không zoom/pan
  shortcuts={false}       // host tự bind phím, gọi qua ref
  onChange={save}
  onSelectionChange={setSelectedIds}
  onHistoryChange={(h) => setHistory(h)}
  onNodeDoubleClick={(id, type) => { if (type === 'text') openTextModal(id); }}
/>
```

- Ở chế độ này container gốc là `inline-block`, kích thước **bằng đúng canvas** — host tự canh vị trí/căn giữa. Không đặt `transform: scale()` lên cha của editor để phóng to/thu nhỏ (hit-test sẽ lệch); dùng `viewScale`.
- **Scale text**: text có 4 handle góc, kéo sẽ scale đều qua `transform.scaleX/scaleY` (giống fabric) — `font.size` và `node.size` giữ nguyên, hiệu ứng (shadow, outline…) scale theo. 1 lần kéo = 1 bước undo.
- **Nền trong suốt**: đặt `page.background = { type: 'color', value: 'transparent' }` — canvas sẽ trong suốt, thấy nội dung phía sau. PNG export (`ref.export('png')`, `renderPageToPng`) vốn không bao giờ chứa màu nền page (kể cả nền đục).
- **Đổi giao diện khung chọn**: override các biến CSS trên `.df-editor` trong CSS của host:

```css
.df-editor {
  --df-sel-border-color: rgba(88, 177, 56, 1);
  --df-sel-border-width: 1px;
  --df-sel-border-style: dashed;
  --df-handle-size: 8px;
  --df-handle-radius: 0;
  --df-handle-bg: rgba(88, 177, 56, 1);
  --df-handle-border-color: rgba(88, 177, 56, 1);
  --df-marquee-color: rgba(88, 177, 56, 1); /* khung kéo-chọn nhiều node */
}
```

Handle của warp/circle text vẫn dùng màu cố định, chưa theo các biến này.

## 4. Custom font

Mặc định editor không có font nào ngoài font hệ thống. Đăng ký font trước khi render `Editor` (thường ở entry point app), rồi dùng đúng `family` name đó trong `TextNode.font.family` của document:

```ts
import { registerFont } from '@desfoyo/editor';
import poppinsUrl from './fonts/Poppins-Regular.ttf?url'; // hoặc URL bất kỳ tới file .ttf/.otf

registerFont('Poppins', poppinsUrl);
```

`registerFont(family, source)` nhận `source` là URL string hoặc `ArrayBuffer`. Font được load lazy (`loadFont`) khi có node text dùng đến family đó — không cần `await` trước khi render `Editor`.

Các helper khác:

- `loadFont(family): Promise<LoadedFont | null>` — chủ động preload 1 font.
- `getLoadedFont(family): LoadedFont | null` — kiểm tra font đã load chưa.
- `registeredFamilies(): string[]` — danh sách family đã đăng ký.
- `onFontLoaded(cb): () => void` — subscribe sự kiện font load xong (trả về hàm unsubscribe).
- `measureText(node: TextNode, font): { width, height }` — tính `size` đúng cho 1 `TextNode` (bắt buộc có trong schema). Dùng khi host tự tạo/sửa text (đổi nội dung, font, line height) để pivot/khung chọn khớp với text thật:

```ts
const loaded = await loadFont(node.font.family);
if (loaded) node.size = measureText(node, loaded.font);
editorRef.current?.addNode(node);
```

## 5. Asset ảnh: nhúng base64 hoặc URL

`document.assets[assetId]` nhận 3 dạng:

```ts
{ type: 'image', dataUri: string }      // base64 nhúng thẳng trong document
{ type: 'svg', dataUri: string }        // SVG raw markup, cũng nhúng thẳng
{ type: 'image-url', src: string }      // URL ảnh remote — không nhúng vào document
```

Dùng `image-url` cho ảnh lớn (in ấn, độ phân giải cao) để tránh document JSON phình to khi lưu DB. Với editor đang mở, thêm asset qua `ref.addAsset()` rồi mới `addNode` (đổi prop `document` không có tác dụng sau khi mount — mục 1):

```ts
editorRef.current?.addAsset(assetId, { type: 'image-url', src: 'https://cdn.example.com/photo.png' });
editorRef.current?.addNode({ id: nodeId, type: 'image', assetId, /* transform, size... */ });
```

Với document chưa mount (lưu DB, `loadDocument`, headless render) thì cứ ghi thẳng vào `document.assets`. URL không cần có đuôi file (`.png`/`.jpg`). URL `.svg` (hoặc `data:image/svg+xml`) cũng dùng được: editor rasterize SVG ở 2× kích thước gốc để vẫn nét khi phóng to.

Node ảnh (`ImageNode.assetId`) trỏ tới asset này y hệt như với `image` — không cần đổi gì ở phía node. Lưu ý: ảnh remote cross-origin cần server ảnh set CORS header đúng (editor load với `crossOrigin="anonymous"`), nếu không ảnh sẽ không hiển thị — đây là việc phía hạ tầng ảnh, không phải của editor. Hiện chỉ `image` có biến thể URL; `svg` vẫn chỉ nhúng base64 (SVG thường đã nhỏ, chưa cần).

## 6. Render ảnh không cần mount `<Editor>` (headless)

Dùng khi cần rasterize 1 document đã lưu thành ảnh mà không mở editor tương tác — ví dụ tạo thumbnail cho trang danh sách, texture cho preview 3D.

```ts
import { renderPageToPng, renderPageToSvg } from '@desfoyo/editor';

const blob = await renderPageToPng(doc.pages[0], doc, 2); // scale x2, trả về Blob PNG
const svgString = await renderPageToSvg(doc.pages[0], doc);
```

- **Chỉ chạy được trong browser** (cần WebGL/canvas context thật) — không chạy được trong Node.js/server. Nếu cần rasterize hàng loạt phía server, mở 1 tab/iframe ẩn và gọi hàm này từ đó, không gọi trực tiếp từ server code.
- **Không tự đợi font load** — nếu `page` có text dùng font chưa `registerFont`/`loadFont` từ trước, kết quả sẽ dùng font fallback. Gọi `await loadFont(family)` (hoặc đảm bảo đã `registerFont` sớm ở entry point app) trước khi render.
- Độc lập với mọi `<Editor>` đang mở — không cần `ref`, không ảnh hưởng editor đang hiển thị.

## 7. Lưu ý

- Package chỉ export ESM (`"type": "module"`) — không dùng được với `require()`/CommonJS.
- `pixi.js`, `react`, `react-dom` là peer dependencies — project host tự cài, editor không bundle kèm để tránh duplicate React/WebGL context.
- `Editor` fill theo container cha (không auto-grow theo content) — bọc trong 1 `div` có height xác định (mục 1).
- Mọi thay đổi document (kể cả qua `EditorHandle`, kể cả `addAsset`) đều phản ánh lại qua `onChange`. Selection, history, zoom là state nội bộ — đọc qua `onSelectionChange`/`onHistoryChange`/`canUndo()`.
- Chưa test việc mount **nhiều `<Editor>` cùng lúc trên 1 trang** (vd nhiều canvas cạnh nhau) — mỗi instance tự gắn `window` keydown listener riêng cho shortcuts; nếu cần dùng nhiều instance, cân nhắc set `shortcuts={false}` ở tất cả trừ 1 instance để tránh nhiều listener cùng phản ứng 1 phím.
