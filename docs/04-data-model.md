# 04 — Data Model (Document Schema)

Document là **JSON thuần**, là source of truth duy nhất. PixiJS render từ đây; undo/redo, collab, export đều thao tác trên model này.

## Cấu trúc gốc

```jsonc
{
  "version": 1,
  "id": "doc_xxx",
  "meta": { "title": "Untitled", "createdAt": 0, "updatedAt": 0 },
  "pages": [
    {
      "id": "page_1",
      "name": "Page 1",
      "size": { "width": 1080, "height": 1080 },
      "background": { "type": "color", "value": "#ffffff" },
      "children": [ /* node[] */ ]
    }
  ],
  "assets": { /* id -> asset ref (image/font) */ },
  "fonts": [ /* font đã dùng */ ]
}
```

## Node cơ bản (base)

Mọi node kế thừa các trường chung:

```ts
interface BaseNode {
  id: string;
  // Union đầy đủ ở version cuối; theo phase, Zod schema chỉ chấp nhận subset:
  type: 'text' | 'shape' | 'image' | 'svg' | 'group';
  name?: string;
  transform: {
    // x, y = vị trí của pivot point (không phải góc trên-trái).
    // originX/originY (0..1) định vị pivot bên trong bounding box;
    // rotate/scale xảy ra tại chỗ quanh (x, y), không cần tính lại x/y sau khi xoay.
    x: number; y: number;
    scaleX: number; scaleY: number;
    rotation: number;      // radian
    skewX?: number; skewY?: number;
    originX?: number; originY?: number; // pivot 0..1
  };
  size: { width: number; height: number };
  opacity: number;         // 0..1
  visible: boolean;
  locked: boolean;
  blendMode?: BlendMode;
  effects?: Effect[];      // pipeline hiệu ứng (xem dưới)
}
```

## Các node type

### TextNode
```ts
interface TextNode extends BaseNode {
  type: 'text';
  text: string;
  font: { family: string; weight: number; style: 'normal' | 'italic'; size: number };
  align: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number;
  lineHeight: number;
  fill: Fill;              // màu/gradient/texture
  // Biến dạng text
  warp?: {
    type: 'none' | 'arc' | 'wave' | 'bulge' | 'flag' | 'perspective' | 'path';
    intensity: number;
    pathId?: string;       // nếu type = 'path'
  };
}
```

### ShapeNode
```ts
interface ShapeNode extends BaseNode {
  type: 'shape';
  shape: 'rect' | 'ellipse' | 'line' | 'polygon' | 'star' | 'path';
  cornerRadius?: number;
  points?: number[];       // cho polygon/path
  fill: Fill;
  stroke?: Stroke;
}
```

### ImageNode
```ts
interface ImageNode extends BaseNode {
  type: 'image';
  assetId: string;
  crop?: { x: number; y: number; width: number; height: number };
  mask?: { type: 'shape' | 'text'; ref: string };
  filters?: { brightness?: number; contrast?: number; blur?: number; saturation?: number };
}
```

### SvgNode
```ts
interface SvgNode extends BaseNode {
  type: 'svg';
  assetId: string;         // svg gốc
  overrides?: Record<string, Fill>; // đổi màu theo path id
}
```

### GroupNode
```ts
interface GroupNode extends BaseNode {
  type: 'group';
  children: Node[];
}
```

## Fill & Stroke

```ts
type Fill =
  | { type: 'solid'; color: string; alpha?: number }
  | { type: 'linear-gradient'; stops: GradientStop[]; angle: number }
  | { type: 'radial-gradient'; stops: GradientStop[] }
  | { type: 'texture'; assetId: string; scale?: number; offset?: [number, number] };

interface GradientStop { offset: number; color: string; alpha?: number }

interface Stroke {
  fill: Fill;
  width: number;
  align: 'inside' | 'center' | 'outside';
  // nhiều lớp stroke
  layers?: Array<{ width: number; fill: Fill; offset?: [number, number] }>;
}
```

## Effect (pipeline)

Danh sách hiệu ứng, áp theo thứ tự. Mỗi effect map tới một filter/shader ở render layer.

```ts
type Effect =
  | { type: 'shadow'; color: string; blur: number; offset: [number, number]; alpha: number }
  | { type: 'inner-shadow'; color: string; blur: number; offset: [number, number]; alpha: number }
  | { type: 'glow'; color: string; strength: number; outer: boolean }
  | { type: 'outline'; color: string; thickness: number }
  | { type: 'extrude3d'; depth: number; angle: number; color: string }
  | { type: 'blur'; amount: number }
  | { type: 'custom'; shaderId: string; uniforms: Record<string, number | number[]> };
```

## Preset (Text Effect)

Preset là JSON mô tả một bộ (fill + stroke + effects) áp 1 click:

```jsonc
{
  "id": "neon-blue",
  "name": "Neon Blue",
  "target": "text",
  "apply": {
    "fill": { "type": "solid", "color": "#00eaff" },
    "effects": [
      { "type": "glow", "color": "#00eaff", "strength": 0.8, "outer": true },
      { "type": "outline", "color": "#0066ff", "thickness": 2 }
    ]
  }
}
```

## Versioning & migration

- `version` tăng khi schema breaking.
- Mỗi bước có hàm `migrate_vN_to_vN+1(doc)`; load luôn chạy migrate lên version hiện tại.
- Zod schema per-version để validate an toàn khi mở file cũ.

## Vì sao thiết kế như vậy

- **Serializable hoàn toàn** → autosave, export, collab (Yjs map/array ánh xạ trực tiếp).
- **Effect tách khỏi geometry** → tái dùng preset giữa các node type.
- **Assets/fonts tham chiếu bằng id** → không nhân bản dữ liệu nặng, dễ CDN hóa.
  - (chưa có backend): `assetId` resolve qua một `AssetResolver` nội bộ trả về base64 data URI nhúng thẳng trong `assets` của document JSON — tự chứa, thỏa DoD "reload JSON render lại y hệt" mà không cần server.
  - (có backend): cùng field `assetId`, nhưng resolver trả về URL từ S3/R2. Đổi resolver, không đổi schema.
- **Transform tách khỏi props** → chuẩn hóa hit-test, snapping, group math.
