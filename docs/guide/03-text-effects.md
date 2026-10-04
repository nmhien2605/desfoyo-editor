# Guide — Làm UI text & hiệu ứng chữ bằng `@desfoyo/editor`

Tài liệu cho dev **host** (vd `/editor_v2`) tự làm UI chỉnh chữ của riêng mình (modal thêm text, thanh hiệu ứng, slider warp…) và điều khiển editor qua `EditorHandle`. Editor chỉ lo **render + handle trên canvas**; mọi nút/slider là của host.

Đọc trước [02-usage.md](./02-usage.md) (`ref`, `chrome={false}`, `onSelectionChange`, `onNodeDoubleClick`).

## Mục lục

1. [Bản đồ tính năng](#1-bản-đồ-tính-năng)
2. [3 quy tắc bắt buộc](#2-3-quy-tắc-bắt-buộc)
3. [Helper dùng chung (copy vào host)](#3-helper-dùng-chung-copy-vào-host)
4. [Thêm text](#4-thêm-text)
5. [Nội dung & kiểu chữ](#5-nội-dung--kiểu-chữ)
6. [Màu chữ (fill)](#6-màu-chữ-fill)
7. [Text shadow (drop / line / block / 3d)](#7-text-shadow-drop--line--block--3d)
8. [Filter effects (glow, outline, blur, extrude3d, shadow, custom)](#8-filter-effects)
9. [Warp / Transformation](#9-warp--transformation)
10. [Opacity, blend mode, scale, xoay](#10-opacity-blend-mode-scale-xoay)
11. [Đọc trạng thái để hiển thị UI](#11-đọc-trạng-thái-để-hiển-thị-ui)
12. [Giới hạn đã biết](#12-giới-hạn-đã-biết)

---

## 1. Bản đồ tính năng

Mọi thứ đều là field trên `TextNode` (`import type { TextNode } from '@desfoyo/editor'`):

| Tính năng | Field | Đo lại `size`? | PNG export | SVG export |
|---|---|:-:|:-:|:-:|
| Nội dung | `text` (`\n` = xuống dòng) | ✅ | ✅ | ✅ |
| Font / cỡ chữ (bold/italic = family riêng, §5) | `font.family`, `font.size` | ✅ | ✅ | ✅ |
| Căn lề | `align: 'left' \| 'center' \| 'right'` | ✅ | ✅ | ✅ |
| Giãn chữ | `letterSpacing` (px) | ✅ | ✅ | ✅ |
| Giãn dòng | `lineHeight` (bội số của `font.size`) | ✅ | ✅ | ✅ |
| Màu: solid / linear / radial gradient | `fill` | — | ✅ | ✅ |
| Text shadow drop/line/block/3d | `effects[]` phần tử `type: 'text-shadow'` | — | ✅ | ✅ |
| Glow / outline / blur / extrude3d / shadow / custom shader | `effects[]` | — | ✅ | ❌ (bị bỏ qua) |
| Warp: wave, arch, rise, flag, angle, circle, distort, custom | `warp` | ✅ | ✅ | ✅ |
| Độ mờ, blend mode | `opacity`, `blendMode` | — | ✅ | ✅ |
| Phóng to/thu nhỏ, xoay, vị trí | `transform` | — | ✅ | ✅ |

"Đo lại `size`" = đổi field đó làm đổi hình dạng chữ → phải tính lại `node.size` cùng lúc (quy tắc 2).

## 2. 3 quy tắc bắt buộc

**Quy tắc 1 — Patch là shallow.** `updateNodeProps(id, patch)` làm `Object.assign(node, patch)`. Field lồng nhau (`font`, `fill`, `warp`, `effects`) phải gửi **nguyên object/mảng mới**, không gửi một phần:

```ts
// ❌ mất family/weight/style
ref.updateNodeProps(id, { font: { size: 120 } });
// ✅
ref.updateNodeProps(id, { font: { ...node.font, size: 120 } });
```

**Quy tắc 2 — Đổi hình chữ thì gửi kèm `size` mới trong CÙNG patch.** `node.size` là kết quả layout (pivot xoay/scale và khung chọn đều đọc nó). Tính bằng `measureText(node, font)` với font **đã load**. Gửi 2 patch riêng = 2 bước undo và node "nhảy" giữa chừng. Dùng helper `patchText` ở mục 3.

**Quy tắc 3 — Font phải được đăng ký + load.** `registerFont(family, url)` một lần lúc khởi động, rồi `await loadFont(family)` trước khi đo. Font chưa load thì editor không vẽ chữ đó (tự load và vẽ lại sau), nhưng host sẽ không đo được `size`.

```ts
import { registerFont, loadFont } from '@desfoyo/editor';
registerFont('Anton', '/fonts/Anton-Regular.ttf');
registerFont('Lobster', '/fonts/Lobster-Regular.ttf');
```

## 3. Helper dùng chung (copy vào host)

Các helper này tương đương logic nội bộ của inspector có sẵn (`PropertiesPanel`, `TransformationControls`, `TextShadowControls`) — lib chưa export chúng nên host tự giữ một bản:

```ts
// textEdit.ts
import { loadFont, measureText, type EditorHandle, type Effect, type TextNode } from '@desfoyo/editor';

export function getTextNode(ref: EditorHandle, id: string): TextNode | null {
  const find = (nodes: any[]): any =>
    nodes.map((n) => (n.id === id ? n : n.type === 'group' ? find(n.children) : null)).find(Boolean);
  for (const page of ref.getDocument().pages) {
    const n = find(page.children);
    if (n) return n.type === 'text' ? n : null;
  }
  return null;
}

/** Patch field ảnh hưởng hình chữ (text/font/align/spacing/lineHeight/warp) + size mới, 1 bước undo. */
export async function patchText(ref: EditorHandle, id: string, patch: Partial<TextNode>): Promise<void> {
  const node = getTextNode(ref, id);
  if (!node) return;
  const next = { ...node, ...patch } as TextNode;
  const loaded = await loadFont(next.font.family);
  ref.updateNodeProps(id, loaded ? { ...patch, size: measureText(next, loaded.font) } : patch);
}

/** Patch chỉ đổi màu/hiệu ứng — không cần đo. */
export function patchStyle(ref: EditorHandle, id: string, patch: Partial<TextNode>): void {
  ref.updateNodeProps(id, patch);
}

/** Thay (hoặc thêm) đúng 1 effect theo `type`, giữ nguyên các effect khác. null = xoá. */
export function setEffect<T extends Effect['type']>(
  effects: Effect[] | undefined,
  type: T,
  effect: Extract<Effect, { type: T }> | null,
): Effect[] {
  const rest = (effects ?? []).filter((e) => e.type !== type);
  return effect ? [...rest, effect] : rest;
}

export function getEffect<T extends Effect['type']>(effects: Effect[] | undefined, type: T) {
  return effects?.find((e): e is Extract<Effect, { type: T }> => e.type === type);
}
```

## 4. Thêm text

```ts
import { loadFont, measureText, type TextNode } from '@desfoyo/editor';

async function addText(ref: EditorHandle, text: string, family = 'Anton', page = { width: 300, height: 400 }) {
  const loaded = await loadFont(family);
  if (!loaded) throw new Error(`Font ${family} chưa registerFont`);
  const draft: TextNode = {
    id: crypto.randomUUID(),
    type: 'text',
    text,
    font: { family, weight: 400, style: 'normal', size: 80 },
    align: 'center',
    letterSpacing: 0,
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#000000' },
    // x/y = vị trí pivot; origin 0.5 = pivot ở tâm → đặt giữa page
    transform: { x: page.width / 2, y: page.height / 2, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
    size: { width: 1, height: 1 }, // tạm, đo ngay dưới
    opacity: 1,
    visible: true,
    locked: false,
  };
  const node = { ...draft, size: measureText(draft, loaded.font) };
  ref.addNode(node);
  ref.selectNode([node.id]);
  return node.id;
}
```

Luôn dùng `originX/originY: 0.5` cho text: scale bằng handle góc, xoay, và warp đều quanh tâm chữ — giống fabric.

**Double-click để mở modal sửa chữ của host** (tắt textarea sửa inline của lib):

```tsx
<Editor onNodeDoubleClick={(id, type) => { if (type === 'text') openTextModal(id); }} … />
```

## 5. Nội dung & kiểu chữ

Tất cả dùng `patchText` (có đo lại):

```ts
await patchText(ref, id, { text: 'Hello\nWorld' });
await patchText(ref, id, { font: { ...node.font, family: 'Lobster' } });   // đổi font: patchText tự load font mới
await patchText(ref, id, { font: { ...node.font, family: 'Poppins Bold' } }); // bold = family riêng, xem ghi chú
await patchText(ref, id, { font: { ...node.font, size: 120 } });
await patchText(ref, id, { align: 'right' });
await patchText(ref, id, { letterSpacing: 10 });  // px, cộng giữa mỗi 2 ký tự
await patchText(ref, id, { lineHeight: 1.5 });    // 1.5 × font.size
```

Ghi chú:
- `font.weight`/`font.style` chỉ là dữ liệu lưu kèm — renderer **không đọc** chúng: chữ luôn vẽ bằng outline glyph của đúng file đã `registerFont(family, …)`, không có bold/italic giả. Muốn Bold/Italic thật: đăng ký file đó dưới một `family` riêng (vd `registerFont('Anton Bold', …)`) rồi đổi `font.family`.
- Không có auto-wrap: chữ chỉ xuống dòng ở `\n`.
- Muốn chữ to/nhỏ mà không đổi `font.size` (giống kéo góc trong fabric): đổi `transform.scaleX/scaleY` (mục 10) — không cần đo lại.

## 6. Màu chữ (fill)

```ts
// solid
patchStyle(ref, id, { fill: { type: 'solid', color: '#e11d48' } });

// linear gradient — angle radian (0 = trái→phải, π/2 = trên→dưới), offset 0..1
patchStyle(ref, id, {
  fill: {
    type: 'linear-gradient',
    angle: Math.PI / 2,
    stops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#dc2626' }],
  },
});

// radial gradient — từ tâm khung chữ ra ngoài
patchStyle(ref, id, {
  fill: { type: 'radial-gradient', stops: [{ offset: 0, color: '#fff' }, { offset: 1, color: '#2563eb' }] },
});
```

- Gradient trải theo khung của chính node (không theo từng ký tự).
- `fill.alpha` và `stop.alpha` **chưa** được áp dụng khi render — muốn trong suốt dùng `opacity` của node (mục 10).
- `type: 'texture'` có trong schema nhưng chưa render thật (ra màu xám) — đừng đưa vào UI.

## 7. Text shadow (drop / line / block / 3d)

Một node chỉ có **tối đa 1** text-shadow (entry `type: 'text-shadow'` trong `effects`, luôn thay thế chứ không cộng thêm).

```ts
type TextShadow = {
  type: 'text-shadow';
  style: 'drop' | 'line' | 'block' | '3d';
  color: string;
  angle: number;      // radian, hướng đổ bóng: 0 = sang phải, π/2 = xuống dưới
  distance: number;   // TỈ LỆ theo font.size (0.06 = 6% cỡ chữ) — tự co giãn khi đổi cỡ chữ
  blur?: number;      // px, chỉ dùng cho 'drop' (mặc định 4)
  thickness?: number; // px nét viền, chỉ dùng cho 'line' (mặc định 2)
};
```

| Style | Nhìn như | Field dùng |
|---|---|---|
| `drop` | bóng mờ lệch khỏi chữ | color, angle, distance, blur |
| `line` | viền rỗng (outline) của chữ, lệch theo angle/distance | color, angle, distance, thickness |
| `block` | bản sao đặc, lệch | color, angle, distance |
| `3d` | khối đặc nối liền chữ với bản lệch (extrude) | color, angle, distance |

Giá trị mặc định của inspector có sẵn (nên dùng làm default của host) và slider:

```ts
const DEFAULT_TEXT_SHADOW = { type: 'text-shadow', style: 'drop', color: '#000000', angle: Math.PI / 4, distance: 0.06, blur: 4 } as const;
// slider: angle 0..2π, distance 0..0.5, blur ≥ 0, thickness ≥ 0
```

```ts
// Bật / đổi
const shadow = { ...(getEffect(node.effects, 'text-shadow') ?? DEFAULT_TEXT_SHADOW), style: '3d' as const, color: '#1d4ed8' };
patchStyle(ref, id, { effects: setEffect(node.effects, 'text-shadow', shadow) });

// Tắt
patchStyle(ref, id, { effects: setEffect(node.effects, 'text-shadow', null) });
```

Text shadow đi theo warp (bóng cũng cong theo chữ) và co giãn theo cả `font.size` lẫn `transform.scale`. `line`/`block`/`3d` là hình học thật nên SVG export giữ nguyên; `drop` xuất ra SVG bằng `<filter>`.

## 8. Filter effects

Các effect này là **filter áp lên cả node** (sau khi vẽ chữ + text-shadow). Có thể bật nhiều cái cùng lúc; thứ tự trong mảng = thứ tự áp filter. Dùng `setEffect` để mỗi loại chỉ có 1 entry.

| `type` | Field | Default của inspector | Ghi chú |
|---|---|---|---|
| `outline` | `color`, `thickness` (px) | `{ color: '#000000', thickness: 2 }` | Viền đặc quanh chữ (khác `text-shadow` style `line`) |
| `glow` | `color`, `strength`, `outer` | `{ color: '#ffffff', strength: 2, outer: true }` | `outer: false` = sáng cả trong lẫn ngoài |
| `blur` | `amount` | `{ amount: 4 }` | Làm mờ cả chữ |
| `extrude3d` | `depth`, `angle` (radian), `color` | `{ depth: 4, angle: Math.PI / 4, color: '#000000' }` | Bevel 2D, không phải extrude thật — muốn khối 3D đẹp dùng text-shadow `3d` |
| `shadow` | `color`, `blur`, `offset: [x, y]` (px), `alpha` 0..1 | `{ color: '#000000', blur: 4, offset: [2, 2], alpha: 0.5 }` | Bóng generic (dùng cho mọi loại node). Với text nên dùng `text-shadow` |
| `custom` | `shaderId`, `uniforms` | `{ shaderId: 'chromatic-aberration', uniforms: { strength: 2 } }` | Chỉ các shader có sẵn trong lib; `shaderId` lạ bị bỏ qua |

```ts
patchStyle(ref, id, { effects: setEffect(node.effects, 'outline', { type: 'outline', color: '#ffffff', thickness: 4 }) });
patchStyle(ref, id, { effects: setEffect(node.effects, 'glow', null) }); // tắt glow
```

Lưu ý:
- Đơn vị là **px màn hình**, cố định: `thickness`/`blur`/`offset` **không** co giãn theo `transform.scale`, zoom/`viewScale` hay `font.size` (đã kiểm tra: outline 6px trên chữ scale ×3 vẫn dày 6px). Nên chữ càng to thì viền trông càng mảnh, và độ dày tương đối trên canvas thu nhỏ khác với PNG export. Cần viền tỉ lệ với chữ → dùng text-shadow (hình học thật, co giãn theo tất cả).
- SVG export bỏ qua các filter này (PNG export giữ đầy đủ). Nếu sản phẩm cần SVG, chỉ nên cho người dùng text-shadow.

## 9. Warp / Transformation

```ts
type Warp = {
  type: 'none' | 'wave' | 'arch' | 'rise' | 'flag' | 'angle' | 'circle' | 'distort' | 'custom';
  curveHeight: number;          // -1..4, bội số của font.size; âm = lật cong. Mặc định 0.5
  directionInverted: boolean;   // chỉ dùng cho circle: chữ chạy phía trong/ngoài vòng
  paths?: WarpPath[];           // có = path người dùng đã kéo (thắng preset); không có = preset
  circle?: { centerX: number; centerY: number; radius: number }; // circle đã kéo; đơn vị = font.size
};
```

| `type` | UI host cần | Handle trên canvas (khi node được chọn) |
|---|---|---|
| `wave`, `arch`, `rise`, `flag`, `angle` | nút chọn + slider `curveHeight` (-1..4, bước 0.01) | có — kéo điểm trên path; sau khi kéo, `paths` được lưu và slider không còn tác dụng tới khi Reset |
| `circle` | nút chọn + checkbox "Direction inverted" | có — kéo để đổi tâm/bán kính (lưu vào `warp.circle`) |
| `distort` | chỉ nút chọn | có — kéo mép trên/dưới (4 góc + tay cầm) |
| `custom` | chỉ nút chọn | có — kéo path bezier giữa chữ |

Handle warp là của lib và **vẫn hiện ở chế độ `chrome={false}`** — host không phải vẽ gì.

Mọi thay đổi warp đổi hình chữ → dùng `patchText` (có đo lại `size`). Cách build object `Warp` giống inspector có sẵn:

```ts
const DEFAULT_CURVE = 0.5;

// Chọn kiểu: bỏ paths/circle cũ (về preset), giữ curveHeight hiện tại
const setWarpType = (w: Warp | undefined, type: Warp['type']): Warp => ({
  type,
  curveHeight: w?.curveHeight ?? DEFAULT_CURVE,
  directionInverted: w?.directionInverted ?? false,
});

// Slider: cũng bỏ paths → quay về preset với độ cong mới
const setCurve = (w: Warp | undefined, curveHeight: number): Warp => ({
  type: w?.type ?? 'wave',
  curveHeight: Math.min(4, Math.max(-1, curveHeight)),
  directionInverted: w?.directionInverted ?? false,
});

// Circle: đảo chiều, GIỮ circle/paths đã kéo
const toggleInverted = (w: Warp | undefined): Warp => ({
  type: w?.type ?? 'circle',
  curveHeight: w?.curveHeight ?? DEFAULT_CURVE,
  paths: w?.paths,
  circle: w?.circle,
  directionInverted: !(w?.directionInverted ?? false),
});

// Reset: về preset mặc định của kiểu hiện tại
const resetWarp = (w: Warp | undefined): Warp => ({ type: w?.type ?? 'none', curveHeight: DEFAULT_CURVE, directionInverted: false });

await patchText(ref, id, { warp: setWarpType(node.warp, 'arch') });
await patchText(ref, id, { warp: setCurve(node.warp, 1.2) });
await patchText(ref, id, { warp: { type: 'none', curveHeight: DEFAULT_CURVE, directionInverted: false } }); // tắt warp
```

Giới hạn:
- `circle` chỉ hỗ trợ 1 dòng — text có `\n` sẽ hiện phẳng.
- Warp dạng path (wave…custom) làm việc trên cả khối chữ; chữ quá dài so với vòng tròn (circle) sẽ đè lên nhau — không tự co.

## 10. Opacity, blend mode, scale, xoay

```ts
patchStyle(ref, id, { opacity: 0.6 });                          // 0..1
patchStyle(ref, id, { blendMode: 'multiply' });                 // normal | multiply | screen | overlay | darken | lighten
ref.updateNodeTransform(id, { scaleX: 1.5, scaleY: 1.5 });      // to/nhỏ đều, không đổi font.size, không cần đo
ref.updateNodeTransform(id, { rotation: (15 * Math.PI) / 180 }); // radian
ref.updateNodeTransform(id, { x: 150, y: 200 });                 // vị trí pivot (tâm nếu origin 0.5)
```

Người dùng cũng tự làm được trên canvas: kéo để di chuyển, 8 handle để scale (ghi vào `scaleX/scaleY`, điểm đối diện đứng yên): 4 góc scale đều, trên/dưới chỉ đổi `scaleY`, trái/phải chỉ đổi `scaleX`; handle tròn phía trên để xoay. Mỗi thao tác kéo = 1 bước undo. Handle trái/phải kéo giãn chữ chứ không xuống dòng lại như fabric (lib không có auto-wrap).

Lật chữ (`scaleX < 0`) chưa được hỗ trợ ở khung chọn — đừng đưa vào UI.

## 11. Đọc trạng thái để hiển thị UI

Panel của host cần node đang chọn **mới nhất** (sau undo/redo, sau khi người dùng kéo handle warp/scale):

```tsx
const [selectedText, setSelectedText] = useState<TextNode | null>(null);
const selectedIdRef = useRef<string | null>(null);

const refresh = () => {
  const id = selectedIdRef.current;
  setSelectedText(id && editorRef.current ? getTextNode(editorRef.current, id) : null);
};

<Editor
  ref={editorRef}
  onSelectionChange={(ids) => { selectedIdRef.current = ids.length === 1 ? ids[0] : null; refresh(); }}
  onChange={refresh}               // mọi thay đổi document (kể cả undo/redo, kéo handle)
  …
/>
```

Rồi bind control vào `selectedText`: `getEffect(selectedText.effects, 'text-shadow')`, `selectedText.warp?.type ?? 'none'`, `selectedText.font.family`…

## 12. Giới hạn đã biết

- **Slider tạo nhiều bước undo**: `EditorHandle` chưa có `beginGesture/endGesture`, nên mỗi lần `onChange` của slider = 1 bước undo. Cách tạm: cập nhật UI cục bộ khi kéo và chỉ gọi `patchText`/`patchStyle` ở `onPointerUp` (hoặc sự kiện `change` gốc của `<input type="range">`), hoặc chấp nhận nhiều bước. Inspector có sẵn của lib gộp được vì dùng store nội bộ.
- **Filter effects không vào SVG export** (mục 8). Text-shadow, fill, warp thì có.
- `fill.alpha`, gradient stop `alpha`, `fill.type: 'texture'` chưa render.
- Không có bold/italic giả, không auto-wrap, circle chỉ 1 dòng.
- Font chưa load: chữ không hiện cho tới khi load xong; export (`ref.export`) chờ ảnh nhưng **không** chờ font — hãy `await loadFont` mọi family dùng trong document trước khi export.
