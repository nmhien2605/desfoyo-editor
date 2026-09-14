# Sử dụng

## API export chính (`src/index.ts`)

```ts
import {
  Editor,
  type EditorProps,
  type EditorHandle,
  // schema types (Document, Page, Node, ...)
  type Document,
  // font
  registerFont,
  loadFont,
  getLoadedFont,
  registeredFamilies,
  onFontLoaded,
} from '@desfoyo/editor';
import '@desfoyo/editor/styles.css';
```

## 1. Render component `Editor`

`Editor` là **controlled component** — bạn giữ `document` (JSON thuần, validate bằng Zod) ở state của app, editor không tự lưu trữ gì ngoài React tree.

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

  return <Editor document={doc} onChange={setDoc} className="h-screen" />;
}
```

- `document` phải khớp `DocumentSchema` — component sẽ `parse()` bằng Zod lúc mount, document sai shape sẽ throw.
- `onChange` bắn mỗi khi document trong store đổi (thêm/xoá node, sửa transform, undo/redo, v.v.) — dùng để lưu vào DB/localStorage.
- `className` áp lên container gốc — dùng để set kích thước (`Editor` fill theo container, cần container có height rõ ràng, vd `h-screen` hoặc `style={{ height: 600 }}`).

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
| `export(format: 'png' \| 'svg', scale?: number): Promise<Blob>` | Export page đang active. `scale` chỉ áp dụng cho `'png'` (mặc định 1). Throw nếu gọi trước khi editor mount xong canvas. |
| `undo(): void` / `redo(): void` | Điều khiển undo/redo history. |

## 3. Props đầy đủ (`EditorProps`)

| Prop | Kiểu | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `document` | `Document` | ✅ | Document ban đầu, validate bằng Zod. |
| `onChange` | `(doc: Document) => void` | | Callback mỗi khi document thay đổi. |
| `className` | `string` | | Class cho container gốc (đặt kích thước ở đây). |
| `initialSelectedNodeIds` | `string[]` | | Node được chọn sẵn lúc mount. |
| `onExport` | `(format: 'png' \| 'svg') => void` | | Callback khi user bấm nút export trong toolbar (không thay thế `ref.export`, chỉ là hook UI). |
| `devMenu` | `DevMenuConfig` | | Chỉ dùng nội bộ để demo chuyển đổi giữa các sample document — bỏ qua trong app thật. |

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

## 5. Lưu ý

- Package chỉ export ESM (`"type": "module"`) — không dùng được với `require()`/CommonJS.
- `pixi.js`, `react`, `react-dom` là peer dependencies — project host tự cài, editor không bundle kèm để tránh duplicate React/WebGL context.
- `Editor` cần container có kích thước xác định (không auto-grow theo content) — set height qua `className` hoặc wrapper `div`.
- Document là nguồn sự thật duy nhất — không có API nào đọc/ghi trực tiếp DOM ngoài `export()`.
