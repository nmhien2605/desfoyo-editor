# Text Foundation + Wave Transformation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền tảng text cho editor (node, font engine, layout, render, sửa chữ, panel) và build đúng một transformation là **Wave** theo tài liệu, với path 3 anchor / 4 handle kéo được trên canvas.

**Architecture:** Mọi thứ quy về một hàm thuần `textGeometry(node, font) → GlyphShape[]`: font → outline glyph → layout → warp. Renderer chỉ vẽ kết quả; sau này shadow và decoration cũng đọc chung kết quả đó. Toàn bộ phần tính toán nằm trong `src/text/`, không đụng Pixi và không đụng React, nên test được bằng vitest thuần.

**Tech Stack:** TypeScript · opentype.js 2.0 · PixiJS v8 (`Graphics`) · Zod · Zustand · React 19 · Tailwind · Vitest

**Spec:** [2026-08-16-text-foundation-wave-design.md](../specs/2026-08-16-text-foundation-wave-design.md)

## Global Constraints

- **Package manager: `pnpm`.** Test: `pnpm test` (= `vitest run`). Lint: `pnpm lint`. Dev server: `pnpm dev` (port 5173).
- **Vitest chỉ nhận file `src/**/*.test.ts`** (xem `vitest.config.ts`) — đuôi `.ts`, không phải `.tsx`. Test đặt trong `src/<module>/__tests__/`.
- **Môi trường test mặc định là `node`.** File nào cần DOM thì thêm dòng đầu `// @vitest-environment jsdom`, đúng như `src/render/__tests__/applyTransform.test.ts` đang làm.
- **Prettier:** `semi: true`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`.
- **Không dùng `@pixi/react`.** Binding Pixi viết tay, `SceneReconciler` là điểm diff duy nhất.
- **Mọi thay đổi model đi qua `store.dispatch(command)`.** Không mutate document trực tiếp.
- **Kéo liên tục phải bọc `beginGesture(label)` / `endGesture()`** để history gộp thành một bước undo.
- **Toạ độ warp path chuẩn hoá 0..1** theo bbox node, giống quy ước `ImageNode.crop`.
- **y hướng xuống** ở mọi nơi (quy ước canvas/Pixi). `font.descender` trong opentype là số âm.
- **Không throw vào render loop.** Font hỏng/thiếu thì log rồi vẽ rỗng, theo đúng quy ước "silently inert" mà `buildFilters.ts` đang dùng cho `shaderId` lạ.
- **Commit sau mỗi task**, message tiếng Việt không dấu hoặc tiếng Anh, prefix `feat:` / `test:` / `chore:`.

## Giới hạn đã biết, chấp nhận ở v1

- `node.size` là kích thước text **chưa warp**. Khi wave biên độ lớn, chữ có thể tràn ra ngoài khung chọn. Sửa được bằng cách tính bbox sau warp, nhưng bbox lại là mẫu số chuẩn hoá của chính path → vòng lặp phản hồi. Để nguyên, ghi nhận.
- Không auto-wrap, chỉ ngắt dòng ở `\n`.
- Resize text node bị khoá (chỉ còn handle rotate).
- Khi đang sửa chữ, textarea hiện chữ thẳng dù node đang warp.

## Cấu trúc file

**Tạo mới**

| File | Trách nhiệm |
|---|---|
| `src/text/fonts/*.ttf` + `README.md` | 3 font OFL bundle sẵn + ghi nguồn/giấy phép |
| `src/text/fontService.ts` | đăng ký / nạp / cache font, phát sự kiện khi nạp xong, đăng ký `FontFace` cho DOM |
| `src/text/glyphOutlines.ts` | **seam duy nhất chạm opentype.js**: glyph → `GlyphShape[]` (outer + holes), flatten bezier |
| `src/text/layout.ts` | ngắt dòng, align, letterSpacing, lineHeight, đo bbox, định vị shape |
| `src/text/warp.ts` | sampler arc-length trên bezier, `buildWavePath`, `warpShapes` |
| `src/text/textGeometry.ts` | keo dán: `TextNode` + font → `GlyphShape[]` đã warp, `measureText` |
| `src/schema/warp.ts` | Zod cho `Warp` / `WarpPath` |
| `src/render/renderers/textRenderer.ts` | Pixi `Graphics`, vẽ shape + `cut()` cho lỗ |
| `src/ui/TextEditOverlay.tsx` | `<textarea>` đè lên canvas để sửa chữ |
| `src/ui/TransformationControls.tsx` | lưới 8 nút + slider Wave Curve + Reset |
| `src/ui/WarpHandlesOverlay.tsx` | vẽ path xanh + 7 point, kéo được |

**Sửa**

`src/schema/node.ts` (thêm `TextNodeSchema` vào union) · `src/schema/index.ts` · `src/render/SceneReconciler.ts` (case `'text'`) · `src/ui/Toolbar.tsx` (nút Add Text) · `src/ui/SelectionOverlay.tsx` (khoá resize cho text, double-click vào edit, gắn 2 overlay mới) · `src/ui/PropertiesPanel.tsx` (khối Text + Transformation) · `src/services/svgSerializer.ts` (text → `<path>`) · `demo/main.tsx` + `demo/samples.ts` · `package.json`

---

## Task 1: Font service + font bundle

**Files:**
- Create: `src/text/fonts/Poppins-Regular.ttf`, `src/text/fonts/Anton-Regular.ttf`, `src/text/fonts/Lobster-Regular.ttf`, `src/text/fonts/README.md`
- Create: `src/text/fontService.ts`
- Test: `src/text/__tests__/fontService.test.ts`
- Modify: `package.json` (dependencies)

**Interfaces:**
- Consumes: — (task đầu tiên)
- Produces:
  - `registerFont(family: string, source: string | ArrayBuffer): void`
  - `registeredFamilies(): string[]`
  - `getLoadedFont(family: string): LoadedFont | null` (đồng bộ, đọc cache)
  - `loadFont(family: string): Promise<LoadedFont | null>`
  - `onFontLoaded(cb: (family: string) => void): () => void`
  - `resetFontsForTest(): void`
  - `interface LoadedFont { family: string; font: opentype.Font }`

- [ ] **Step 1: Cài dependency**

```bash
pnpm add opentype.js
pnpm add -D @types/opentype.js
```

opentype.js 2.0 không ship type declaration; `@types/opentype.js@1.3.10` phủ đúng phần API dùng ở đây (`parse`, `Font`, `stringToGlyphs`, `Glyph.getPath`, `advanceWidth`, `unitsPerEm`, `ascender`, `descender`, `Path.commands`).

- [ ] **Step 2: Tải 3 font OFL vào repo**

```bash
mkdir -p src/text/fonts
curl -sL -o src/text/fonts/Poppins-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf"
curl -sL -o src/text/fonts/Anton-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf"
curl -sL -o src/text/fonts/Lobster-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/lobster/Lobster-Regular.ttf"
file src/text/fonts/*.ttf
```

Cả 3 phải in ra `TrueType Font data`. Nếu file nào ra `HTML document text` thì URL sai (GitHub trả trang 404) — dừng lại, tìm đúng đường dẫn trong repo `google/fonts` rồi tải lại.

- [ ] **Step 3: Ghi nguồn và giấy phép**

Tạo `src/text/fonts/README.md`:

```markdown
# Font bundle

Ba font dùng cho demo và cho test của `src/text/`. Tất cả đều là SIL Open Font
License 1.1, tải từ https://github.com/google/fonts.

| File | Family | Nguồn | Vai trò |
|---|---|---|---|
| `Poppins-Regular.ttf` | Poppins | `ofl/poppins` | sans trung tính, font mặc định khi thêm text |
| `Anton-Regular.ttf` | Anton | `ofl/anton` | display đậm, hợp để thử text effect |
| `Lobster-Regular.ttf` | Lobster | `ofl/lobster` | script, để thử chữ có nét cong phức tạp |

Thư viện xuất bản **không** kèm font — `src/index.ts` không import thư mục này.
Ứng dụng nhúng editor tự gọi `registerFont()` với font của mình.
```

- [ ] **Step 4: Viết test thất bại**

Tạo `src/text/__tests__/fontService.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getLoadedFont,
  loadFont,
  onFontLoaded,
  registerFont,
  registeredFamilies,
  resetFontsForTest,
} from '../fontService';

export function readFontBuffer(fileName: string): ArrayBuffer {
  const path = fileURLToPath(new URL(`../fonts/${fileName}`, import.meta.url));
  const buffer = readFileSync(path);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

afterEach(() => resetFontsForTest());

describe('fontService', () => {
  it('nap font tu ArrayBuffer va cache lai', async () => {
    registerFont('Anton', readFontBuffer('Anton-Regular.ttf'));
    expect(registeredFamilies()).toEqual(['Anton']);
    expect(getLoadedFont('Anton')).toBeNull();

    const loaded = await loadFont('Anton');
    expect(loaded?.family).toBe('Anton');
    expect(loaded?.font.unitsPerEm).toBeGreaterThan(0);
    expect(getLoadedFont('Anton')).toBe(loaded);
  });

  it('bao cho listener khi font nap xong', async () => {
    const seen: string[] = [];
    const off = onFontLoaded((family) => seen.push(family));
    registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
    await loadFont('Poppins');
    off();
    expect(seen).toEqual(['Poppins']);
  });

  it('tra null cho family chua dang ky, khong throw', async () => {
    expect(await loadFont('KhongTonTai')).toBeNull();
  });

  it('tra null khi file font hong, khong throw', async () => {
    registerFont('Hong', new Uint8Array([1, 2, 3, 4]).buffer);
    expect(await loadFont('Hong')).toBeNull();
  });
});
```

- [ ] **Step 5: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/text/__tests__/fontService.test.ts
```

Kỳ vọng: FAIL, không resolve được `../fontService`.

- [ ] **Step 6: Viết `src/text/fontService.ts`**

```ts
import opentype from 'opentype.js';

export interface LoadedFont {
  family: string;
  font: opentype.Font;
}

type Source = { kind: 'url'; url: string } | { kind: 'buffer'; buffer: ArrayBuffer };

const sources = new Map<string, Source>();
const loaded = new Map<string, LoadedFont>();
const pending = new Map<string, Promise<LoadedFont | null>>();
const listeners = new Set<(family: string) => void>();

// Thư viện không ship font nào. Ứng dụng nhúng editor (và demo/main.tsx) tự
// khai báo font của mình ở đây — `source` là URL (Vite `?url` import) hoặc
// ArrayBuffer sẵn có (test đọc thẳng từ đĩa).
export function registerFont(family: string, source: string | ArrayBuffer): void {
  sources.set(family, typeof source === 'string' ? { kind: 'url', url: source } : { kind: 'buffer', buffer: source });
}

export function registeredFamilies(): string[] {
  return [...sources.keys()];
}

// Bản đồng bộ cho render path: renderer chạy trong vòng vẽ, không await được.
export function getLoadedFont(family: string): LoadedFont | null {
  return loaded.get(family) ?? null;
}

export function onFontLoaded(cb: (family: string) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export async function loadFont(family: string): Promise<LoadedFont | null> {
  const cached = loaded.get(family);
  if (cached) return cached;
  const inflight = pending.get(family);
  if (inflight) return inflight;
  const source = sources.get(family);
  if (!source) return null;

  const promise = (async (): Promise<LoadedFont | null> => {
    try {
      const buffer = source.kind === 'buffer' ? source.buffer : await fetchBuffer(source.url);
      const entry: LoadedFont = { family, font: opentype.parse(buffer) };
      loaded.set(family, entry);
      registerFontFace(family, buffer);
      for (const cb of [...listeners]) cb(family);
      return entry;
    } catch (error) {
      // Không ném vào render loop — font hỏng chỉ khiến node không vẽ ra gì,
      // đúng quy ước "silently inert" mà buildFilters.ts dùng cho shaderId lạ.
      console.error(`[desfoyo] khong nap duoc font "${family}"`, error);
      return null;
    } finally {
      pending.delete(family);
    }
  })();

  pending.set(family, promise);
  return promise;
}

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} khi tai ${url}`);
  return response.arrayBuffer();
}

// TextEditOverlay.tsx dùng <textarea> DOM thật, nên cần đúng font đó ở phía
// CSS dưới cùng tên family. Bọc guard vì môi trường test mặc định là 'node',
// không có FontFace lẫn document.
function registerFontFace(family: string, buffer: ArrayBuffer): void {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') return;
  const face = new FontFace(family, buffer);
  void face
    .load()
    .then((ready) => document.fonts.add(ready))
    .catch(() => {});
}

export function resetFontsForTest(): void {
  sources.clear();
  loaded.clear();
  pending.clear();
  listeners.clear();
}
```

- [ ] **Step 7: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/text/__tests__/fontService.test.ts
```

Kỳ vọng: 4 test PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml src/text
git commit -m "feat(text): font service + bundle 3 font OFL"
```

---

## Task 2: Glyph outline — seam sang opentype.js

**Files:**
- Create: `src/text/glyphOutlines.ts`
- Test: `src/text/__tests__/glyphOutlines.test.ts`

**Interfaces:**
- Consumes: `LoadedFont.font` (`opentype.Font`) từ Task 1.
- Produces:
  - `type Contour = number[]` — toạ độ phẳng `[x0, y0, x1, y1, ...]`
  - `interface GlyphShape { outer: Contour; holes: Contour[] }`
  - `interface GlyphOutline { advance: number; shapes: GlyphShape[] }`
  - `getGlyphOutlines(text: string, font: opentype.Font, fontSize: number): GlyphOutline[]`
  - `signedArea(contour: Contour): number`
  - `translateContour(contour: Contour, dx: number, dy: number): Contour`

**Vì sao cần `GlyphShape` chứ không phải `Contour[]` phẳng:** Pixi v8 **không** áp dụng winding non-zero cho nhiều `poly()` trong một `fill()` — mỗi polygon được tam giác hoá riêng, nên ruột chữ `o` sẽ bị tô đặc. Lỗ phải khai báo tường minh bằng `cut()`. Phân loại outer/hole làm ở đây, trước khi warp.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/text/__tests__/glyphOutlines.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getGlyphOutlines, signedArea, translateContour } from '../glyphOutlines';

function loadTestFont(fileName: string): opentype.Font {
  const path = fileURLToPath(new URL(`../fonts/${fileName}`, import.meta.url));
  const buffer = readFileSync(path);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

let poppins: opentype.Font;
beforeAll(() => {
  poppins = loadTestFont('Poppins-Regular.ttf');
});

describe('getGlyphOutlines', () => {
  it('chu "o" ra dung 1 shape voi 1 lo', () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    expect(glyph.shapes).toHaveLength(1);
    expect(glyph.shapes[0].holes).toHaveLength(1);
  });

  it('chu "i" ra 2 shape roi nhau, khong lo', () => {
    const [glyph] = getGlyphOutlines('i', poppins, 100);
    expect(glyph.shapes).toHaveLength(2);
    expect(glyph.shapes.flatMap((s) => s.holes)).toHaveLength(0);
  });

  it('lo nam nguoc chieu voi outer', () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    const { outer, holes } = glyph.shapes[0];
    expect(Math.sign(signedArea(outer))).not.toBe(Math.sign(signedArea(holes[0])));
  });

  it('advance duong va ti le theo fontSize', () => {
    const [small] = getGlyphOutlines('A', poppins, 50);
    const [big] = getGlyphOutlines('A', poppins, 100);
    expect(small.advance).toBeGreaterThan(0);
    expect(big.advance).toBeCloseTo(small.advance * 2, 5);
  });

  it('moi toa do deu huu han', () => {
    const points = getGlyphOutlines('Wave', poppins, 100)
      .flatMap((g) => g.shapes)
      .flatMap((s) => [s.outer, ...s.holes])
      .flat();
    expect(points.length).toBeGreaterThan(0);
    expect(points.every(Number.isFinite)).toBe(true);
  });

  it('khoang trang khong co shape nhung van co advance', () => {
    const [glyph] = getGlyphOutlines(' ', poppins, 100);
    expect(glyph.shapes).toHaveLength(0);
    expect(glyph.advance).toBeGreaterThan(0);
  });

  it('translateContour doi cho dung', () => {
    expect(translateContour([0, 0, 10, 5], 3, -2)).toEqual([3, -2, 13, 3]);
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/text/__tests__/glyphOutlines.test.ts
```

Kỳ vọng: FAIL, không resolve được `../glyphOutlines`.

- [ ] **Step 3: Viết `src/text/glyphOutlines.ts`**

```ts
import type { Font, PathCommand } from 'opentype.js';

// Toạ độ phẳng [x0, y0, x1, y1, ...] — cùng dạng Pixi Graphics.poly() nhận,
// nên không phải chuyển đổi ở tầng render.
export type Contour = number[];

export interface GlyphShape {
  outer: Contour;
  holes: Contour[];
}

export interface GlyphOutline {
  advance: number;
  shapes: GlyphShape[];
}

// Bezier được flatten thành polyline ngay tại đây chứ không mang theo dưới
// dạng đường cong, vì warp map từng điểm qua một hàm phi tuyến — map điểm
// điều khiển bezier thay vì điểm đã lấy mẫu sẽ cho ra đường cong sai.
// Bước 2px giữ sai số vồng (sagitta) dưới ~0.13px với mọi cung bán kính >= 4px.
const FLATTEN_STEP_PX = 2;
const MIN_STEPS = 4;
const MAX_STEPS = 32;

function stepsFor(points: Array<[number, number]>): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return Math.min(MAX_STEPS, Math.max(MIN_STEPS, Math.ceil(length / FLATTEN_STEP_PX)));
}

function cubic(t: number, a: number, b: number, c: number, d: number): number {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

function quadratic(t: number, a: number, b: number, c: number): number {
  const u = 1 - t;
  return u * u * a + 2 * u * t * b + t * t * c;
}

// Diện tích có dấu theo công thức shoelace. Dấu cho biết chiều quay của
// contour — đó là cách phân biệt outer với lỗ mà không cần biết font thuộc
// định dạng nào (TrueType vẽ outer theo chiều kim đồng hồ, CFF/OTF thì ngược lại).
export function signedArea(contour: Contour): number {
  let sum = 0;
  for (let i = 0; i < contour.length; i += 2) {
    const j = (i + 2) % contour.length;
    sum += contour[i] * contour[j + 1] - contour[j] * contour[i + 1];
  }
  return sum / 2;
}

export function translateContour(contour: Contour, dx: number, dy: number): Contour {
  const out = new Array<number>(contour.length);
  for (let i = 0; i < contour.length; i += 2) {
    out[i] = contour[i] + dx;
    out[i + 1] = contour[i + 1] + dy;
  }
  return out;
}

function commandsToContours(commands: PathCommand[]): Contour[] {
  const contours: Contour[] = [];
  let current: Contour = [];
  let x = 0;
  let y = 0;

  const push = (px: number, py: number) => {
    current.push(px, py);
    x = px;
    y = py;
  };

  for (const command of commands) {
    switch (command.type) {
      case 'M':
        if (current.length >= 6) contours.push(current);
        current = [];
        push(command.x, command.y);
        break;
      case 'L':
        push(command.x, command.y);
        break;
      case 'C': {
        const steps = stepsFor([
          [x, y],
          [command.x1, command.y1],
          [command.x2, command.y2],
          [command.x, command.y],
        ]);
        const [x0, y0] = [x, y];
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          current.push(
            cubic(t, x0, command.x1, command.x2, command.x),
            cubic(t, y0, command.y1, command.y2, command.y),
          );
        }
        x = command.x;
        y = command.y;
        break;
      }
      case 'Q': {
        const steps = stepsFor([
          [x, y],
          [command.x1, command.y1],
          [command.x, command.y],
        ]);
        const [x0, y0] = [x, y];
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          current.push(quadratic(t, x0, command.x1, command.x), quadratic(t, y0, command.y1, command.y));
        }
        x = command.x;
        y = command.y;
        break;
      }
      case 'Z':
        if (current.length >= 6) contours.push(current);
        current = [];
        break;
    }
  }
  if (current.length >= 6) contours.push(current);
  return contours;
}

// Point-in-polygon kiểu ray casting. Chỉ cần khi một glyph có nhiều outer
// (ví dụ '%', 'ü') để biết lỗ nào thuộc outer nào.
function containsPoint(contour: Contour, px: number, py: number): boolean {
  let inside = false;
  for (let i = 0, j = contour.length - 2; i < contour.length; j = i, i += 2) {
    const xi = contour[i];
    const yi = contour[i + 1];
    const xj = contour[j];
    const yj = contour[j + 1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Contour có |diện tích| lớn nhất chắc chắn là một outer. Cùng dấu với nó là
// outer, ngược dấu là lỗ — đúng cho cả TrueType lẫn CFF mà không cần biết
// font thuộc loại nào.
function groupIntoShapes(contours: Contour[]): GlyphShape[] {
  if (contours.length === 0) return [];
  const areas = contours.map(signedArea);
  let largest = 0;
  for (let i = 1; i < areas.length; i++) {
    if (Math.abs(areas[i]) > Math.abs(areas[largest])) largest = i;
  }
  const outerSign = Math.sign(areas[largest]);

  const shapes: GlyphShape[] = [];
  const holes: Contour[] = [];
  contours.forEach((contour, i) => {
    if (Math.sign(areas[i]) === outerSign) shapes.push({ outer: contour, holes: [] });
    else holes.push(contour);
  });

  for (const hole of holes) {
    const owner = shapes.find((shape) => containsPoint(shape.outer, hole[0], hole[1])) ?? shapes[0];
    owner.holes.push(hole);
  }
  return shapes;
}

// Chỉ nơi duy nhất trong codebase gọi vào opentype.js. Đổi sang harfbuzzjs
// hay fontkit về sau chỉ phải viết lại file này — xem docs/text-future-work.md.
//
// Trả về một phần tử cho mỗi *glyph* chứ không phải mỗi ký tự: khi font có
// ligature, số glyph ít hơn số ký tự. layout.ts vì vậy tự cắt dòng theo '\n'
// trước rồi mới gọi hàm này cho từng dòng, để không phải map ngược glyph về
// ký tự.
export function getGlyphOutlines(text: string, font: Font, fontSize: number): GlyphOutline[] {
  const scale = fontSize / font.unitsPerEm;
  return font.stringToGlyphs(text).map((glyph) => ({
    advance: (glyph.advanceWidth ?? 0) * scale,
    shapes: groupIntoShapes(commandsToContours(glyph.getPath(0, 0, fontSize).commands)),
  }));
}
```

- [ ] **Step 4: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/text/__tests__/glyphOutlines.test.ts
```

Kỳ vọng: 7 test PASS. Nếu test `'i'` ra 1 shape thay vì 2, kiểm tra lại `commandsToContours` có đang đóng contour ở lệnh `Z` không.

- [ ] **Step 5: Commit**

```bash
git add src/text/glyphOutlines.ts src/text/__tests__/glyphOutlines.test.ts
git commit -m "feat(text): glyph outline + phan loai outer/hole"
```

---

## Task 3: Layout

**Files:**
- Create: `src/text/layout.ts`
- Test: `src/text/__tests__/layout.test.ts`

**Interfaces:**
- Consumes: `getGlyphOutlines`, `translateContour`, `GlyphShape`, `Contour` (Task 2).
- Produces:
  - `interface TextLayout { shapes: GlyphShape[]; width: number; height: number; baselineY: number }`
  - `interface LayoutOptions { text: string; font: opentype.Font; fontSize: number; letterSpacing: number; lineHeight: number; align: 'left' | 'center' | 'right' }`
  - `layoutText(options: LayoutOptions): TextLayout`

`shapes` trả về đã được dịch vào đúng vị trí trong hộp, gốc toạ độ ở góc trên-trái, y hướng xuống. `baselineY` là baseline của **dòng đầu**.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/text/__tests__/layout.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getGlyphOutlines } from '../glyphOutlines';
import { layoutText } from '../layout';

let poppins: opentype.Font;
beforeAll(() => {
  const path = fileURLToPath(new URL('../fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  poppins = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
});

const base = { font: () => poppins, fontSize: 100, letterSpacing: 0, lineHeight: 1.2, align: 'left' as const };

function layout(text: string, overrides: Partial<Parameters<typeof layoutText>[0]> = {}) {
  return layoutText({
    text,
    font: poppins,
    fontSize: base.fontSize,
    letterSpacing: base.letterSpacing,
    lineHeight: base.lineHeight,
    align: base.align,
    ...overrides,
  });
}

describe('layoutText', () => {
  it('width bang tong advance khi letterSpacing = 0', () => {
    const advances = getGlyphOutlines('ab', poppins, 100).reduce((sum, g) => sum + g.advance, 0);
    expect(layout('ab').width).toBeCloseTo(advances, 5);
  });

  it('letterSpacing cong vao giua cac glyph, khong cong sau glyph cuoi', () => {
    const plain = layout('abc').width;
    expect(layout('abc', { letterSpacing: 10 }).width).toBeCloseTo(plain + 20, 5);
  });

  it('align center va right dich dung luong', () => {
    const left = layout('a\nabc');
    const center = layout('a\nabc', { align: 'center' });
    const right = layout('a\nabc', { align: 'right' });
    const firstX = (l: ReturnType<typeof layout>) => Math.min(...l.shapes[0].outer.filter((_, i) => i % 2 === 0));
    const shortLineWidth = getGlyphOutlines('a', poppins, 100)[0].advance;
    const slack = left.width - shortLineWidth;
    expect(firstX(center) - firstX(left)).toBeCloseTo(slack / 2, 4);
    expect(firstX(right) - firstX(left)).toBeCloseTo(slack, 4);
  });

  it('them mot dong lam height tang dung mot lineStep', () => {
    const one = layout('a');
    const two = layout('a\nb');
    expect(two.height - one.height).toBeCloseTo(100 * 1.2, 5);
  });

  it('baselineY nam trong khoang 0..height', () => {
    const result = layout('Ag');
    expect(result.baselineY).toBeGreaterThan(0);
    expect(result.baselineY).toBeLessThan(result.height);
  });

  it('text rong khong lam vo layout', () => {
    const result = layout('');
    expect(result.shapes).toEqual([]);
    expect(result.width).toBe(0);
    expect(Number.isFinite(result.height)).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/text/__tests__/layout.test.ts
```

Kỳ vọng: FAIL, không resolve được `../layout`.

- [ ] **Step 3: Viết `src/text/layout.ts`**

```ts
import type { Font } from 'opentype.js';
import { getGlyphOutlines, translateContour, type GlyphShape } from './glyphOutlines';

export interface TextLayout {
  // Đã dịch vào đúng vị trí trong hộp: gốc toạ độ ở góc trên-trái, y xuống.
  shapes: GlyphShape[];
  width: number;
  height: number;
  baselineY: number; // baseline của dòng đầu tiên
}

export interface LayoutOptions {
  text: string;
  font: Font;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number; // bội số của fontSize
  align: 'left' | 'center' | 'right';
}

// Không auto-wrap: chỉ ngắt dòng ở '\n'. Có wrap thì node.size.width phải trở
// thành đầu vào của layout thay vì đầu ra, đảo chiều quan hệ giữa kích thước
// node và nội dung — xem docs/text-future-work.md mục 2.
export function layoutText(options: LayoutOptions): TextLayout {
  const { text, font, fontSize, letterSpacing, lineHeight, align } = options;
  const scale = fontSize / font.unitsPerEm;
  const ascent = font.ascender * scale;
  const descent = -font.descender * scale; // descender là số âm trong font units
  const lineStep = fontSize * lineHeight;
  const lines = text.split('\n');

  const measured = lines.map((line) => {
    const glyphs = getGlyphOutlines(line, font, fontSize);
    const width =
      glyphs.reduce((sum, glyph) => sum + glyph.advance, 0) + Math.max(0, glyphs.length - 1) * letterSpacing;
    return { glyphs, width };
  });

  const width = measured.reduce((max, line) => Math.max(max, line.width), 0);
  const height = ascent + descent + (lines.length - 1) * lineStep;

  const shapes: GlyphShape[] = [];
  measured.forEach((line, lineIndex) => {
    const slack = width - line.width;
    const offsetX = align === 'center' ? slack / 2 : align === 'right' ? slack : 0;
    const baseline = ascent + lineIndex * lineStep;
    let penX = offsetX;
    for (const glyph of line.glyphs) {
      for (const shape of glyph.shapes) {
        shapes.push({
          outer: translateContour(shape.outer, penX, baseline),
          holes: shape.holes.map((hole) => translateContour(hole, penX, baseline)),
        });
      }
      penX += glyph.advance + letterSpacing;
    }
  });

  return { shapes, width, height, baselineY: ascent };
}
```

- [ ] **Step 4: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/text/__tests__/layout.test.ts
```

Kỳ vọng: 6 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/text/layout.ts src/text/__tests__/layout.test.ts
git commit -m "feat(text): layout da dong, align, letterSpacing"
```

---

## Task 4: Schema — TextNode + Warp

**Files:**
- Create: `src/schema/warp.ts`
- Modify: `src/schema/node.ts`, `src/schema/index.ts`
- Test: `src/schema/__tests__/textNode.test.ts`

**Interfaces:**
- Consumes: `BaseNodeShape` (`src/schema/base.ts`), `FillSchema` (`src/schema/fill-stroke.ts`).
- Produces:
  - `WarpAnchorSchema` / `type WarpAnchor = { x: number; y: number; in?: { x: number; y: number }; out?: { x: number; y: number } }`
  - `WarpPathSchema` / `type WarpPath = { role: 'baseline' | 'top' | 'bottom'; closed: boolean; anchors: WarpAnchor[] }`
  - `WarpSchema` / `type Warp = { type: WarpType; intensity: number; paths?: WarpPath[] }`
  - `type WarpType = 'none' | 'wave' | 'arch' | 'rise' | 'flag' | 'circle' | 'angle' | 'distort' | 'custom'`
  - `TextNodeSchema` / `type TextNode`
  - `Node` union có thêm `TextNode`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/schema/__tests__/textNode.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { NodeSchema, TextNodeSchema, WarpSchema, type TextNode } from '../index';

const validText: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 300, height: 120 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'Wave',
  font: { family: 'Anton', weight: 400, style: 'normal', size: 96 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#111827' },
};

describe('TextNodeSchema', () => {
  it('nhan text node hop le', () => {
    expect(TextNodeSchema.parse(validText)).toEqual(validText);
  });

  it('NodeSchema nhan type "text"', () => {
    expect(NodeSchema.parse(validText)).toEqual(validText);
  });

  it('nhan warp co paths', () => {
    const withWarp: TextNode = {
      ...validText,
      warp: {
        type: 'wave',
        intensity: 0.5,
        paths: [
          {
            role: 'baseline',
            closed: false,
            anchors: [
              { x: 0, y: 0.9, out: { x: 0.2, y: 0.9 } },
              { x: 1, y: 0.7, in: { x: 0.75, y: 0.6 } },
            ],
          },
        ],
      },
    };
    expect(TextNodeSchema.parse(withWarp)).toEqual(withWarp);
  });

  it('tu choi intensity ngoai khoang 0..1', () => {
    expect(WarpSchema.safeParse({ type: 'wave', intensity: 1.5 }).success).toBe(false);
    expect(WarpSchema.safeParse({ type: 'wave', intensity: -0.1 }).success).toBe(false);
  });

  it('tu choi fontSize <= 0', () => {
    const bad = { ...validText, font: { ...validText.font, size: 0 } };
    expect(TextNodeSchema.safeParse(bad).success).toBe(false);
  });

  it('tu choi align "justify" (chua ho tro)', () => {
    expect(TextNodeSchema.safeParse({ ...validText, align: 'justify' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/schema/__tests__/textNode.test.ts
```

Kỳ vọng: FAIL, `TextNodeSchema` chưa được export.

- [ ] **Step 3: Viết `src/schema/warp.ts`**

```ts
import { z } from 'zod';

// Toạ độ chuẩn hoá 0..1 theo bbox của node, cùng quy ước ImageNode.crop dùng
// — path không phải tính lại khi node đổi kích thước. Giá trị có thể vượt
// ngoài [0, 1]: biên độ wave lớn đẩy path ra ngoài hộp, đó là chủ ý.
const PointSchema = z.object({ x: z.number(), y: z.number() });

export const WarpAnchorSchema = z.object({
  x: z.number(),
  y: z.number(),
  in: PointSchema.optional(),
  out: PointSchema.optional(),
});
export type WarpAnchor = z.infer<typeof WarpAnchorSchema>;

// role là chỗ chừa cho envelope warp về sau: thêm path 'top' + 'bottom' là đủ,
// không phải migration schema. v1 chỉ dùng 'baseline'. closed dành cho Circle.
export const WarpPathSchema = z.object({
  role: z.enum(['baseline', 'top', 'bottom']),
  closed: z.boolean(),
  anchors: z.array(WarpAnchorSchema),
});
export type WarpPath = z.infer<typeof WarpPathSchema>;

export const WarpTypeSchema = z.enum([
  'none',
  'wave',
  'arch',
  'rise',
  'flag',
  'circle',
  'angle',
  'distort',
  'custom',
]);
export type WarpType = z.infer<typeof WarpTypeSchema>;

// paths vắng mặt = đang ở chế độ preset, path được sinh từ type + intensity.
// Ngay khi user kéo một handle, path sinh ra được ghi vào paths và từ đó paths
// là nguồn sự thật. Reset xoá paths. Nhờ vậy slider và handle không tranh nhau
// một nguồn dữ liệu.
export const WarpSchema = z.object({
  type: WarpTypeSchema,
  intensity: z.number().min(0).max(1),
  paths: z.array(WarpPathSchema).optional(),
});
export type Warp = z.infer<typeof WarpSchema>;
```

- [ ] **Step 4: Thêm `TextNodeSchema` vào `src/schema/node.ts`**

Thêm import ở đầu file, cạnh các import sẵn có:

```ts
import { WarpSchema } from './warp';
```

Thêm schema ngay trước `GroupNode` (giữ thứ tự shape → image → svg → text → group):

```ts
// TextNode: text là nội dung thô, mọi hình học suy ra từ đó tại render time
// (src/text/textGeometry.ts) chứ không lưu trong model. `align: 'justify'` mà
// plan/04-data-model.md nêu bị cắt khỏi v1 — justify cần auto-wrap, xem
// docs/text-future-work.md mục 2.
export const TextNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('text'),
  text: z.string(),
  font: z.object({
    family: z.string(),
    weight: z.number(),
    style: z.enum(['normal', 'italic']),
    size: z.number().positive(),
  }),
  align: z.enum(['left', 'center', 'right']),
  letterSpacing: z.number(),
  lineHeight: z.number().positive(),
  fill: FillSchema,
  warp: WarpSchema.optional(),
});
export type TextNode = z.infer<typeof TextNodeSchema>;
```

Thêm `TextNodeSchema` vào union và `TextNode` vào type alias:

```ts
export const NodeSchema: z.ZodType<Node> = z.discriminatedUnion('type', [
  ShapeNodeSchema,
  ImageNodeSchema,
  SvgNodeSchema,
  TextNodeSchema,
  GroupNodeSchema,
]);
export type Node = ShapeNode | ImageNode | SvgNode | TextNode | GroupNode;
```

- [ ] **Step 5: Export từ `src/schema/index.ts`**

Thêm một dòng, giữ thứ tự alphabet gần đúng như hiện tại (`warp` trước `node` vì `node` phụ thuộc nó):

```ts
export * from './warp';
```

- [ ] **Step 6: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/schema/__tests__/textNode.test.ts
pnpm vitest run src/schema
```

Kỳ vọng: 6 test mới PASS, và test schema cũ (`document.test.ts`) vẫn PASS.

- [ ] **Step 7: Commit**

```bash
git add src/schema
git commit -m "feat(schema): TextNode + Warp"
```

---

## Task 5: Warp — sampler, wave preset, biến đổi contour

**Files:**
- Create: `src/text/warp.ts`
- Test: `src/text/__tests__/warp.test.ts`

**Interfaces:**
- Consumes: `WarpPath` (Task 4), `Contour` / `GlyphShape` (Task 2), `Size` (`src/schema/base.ts`).
- Produces:
  - `interface Point { x: number; y: number }`
  - `interface PathSampler { length: number; at(distance: number): { point: Point; tangent: Point } }`
  - `buildPathSampler(path: WarpPath, size: Size): PathSampler`
  - `buildWavePath(intensity: number, baselineRatio: number): WarpPath`
  - `warpShapes(shapes: GlyphShape[], sampler: PathSampler, box: { width: number; baselineY: number }): GlyphShape[]`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/text/__tests__/warp.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import { buildPathSampler, buildWavePath, warpShapes } from '../warp';
import type { GlyphShape } from '../glyphOutlines';

const SIZE = { width: 400, height: 100 };

function flatPath(y: number): WarpPath {
  return {
    role: 'baseline',
    closed: false,
    anchors: [
      { x: 0, y, out: { x: 0.33, y } },
      { x: 1, y, in: { x: 0.66, y } },
    ],
  };
}

describe('buildPathSampler', () => {
  it('do dai cua path thang bang khoang cach hai dau mut', () => {
    expect(buildPathSampler(flatPath(0.5), SIZE).length).toBeCloseTo(400, 4);
  });

  it('lay mau dung diem va tiep tuyen tren path thang', () => {
    const sampler = buildPathSampler(flatPath(0.5), SIZE);
    const { point, tangent } = sampler.at(200);
    expect(point.x).toBeCloseTo(200, 4);
    expect(point.y).toBeCloseTo(50, 4);
    expect(tangent.x).toBeCloseTo(1, 4);
    expect(tangent.y).toBeCloseTo(0, 4);
  });

  it('path suy bien (moi anchor trung nhau) co length = 0', () => {
    const degenerate: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
      ],
    };
    expect(buildPathSampler(degenerate, SIZE).length).toBeCloseTo(0, 6);
  });
});

describe('buildWavePath', () => {
  it('dung 3 anchor va 4 handle', () => {
    const path = buildWavePath(0.5, 0.8);
    expect(path.anchors).toHaveLength(3);
    const handles = path.anchors.flatMap((a) => [a.in, a.out]).filter(Boolean);
    expect(handles).toHaveLength(4);
  });

  it('anchor dau chi co out, anchor cuoi chi co in, anchor giua co ca hai', () => {
    const [first, middle, last] = buildWavePath(0.5, 0.8).anchors;
    expect(first.in).toBeUndefined();
    expect(first.out).toBeDefined();
    expect(middle.in).toBeDefined();
    expect(middle.out).toBeDefined();
    expect(last.in).toBeDefined();
    expect(last.out).toBeUndefined();
  });

  it('intensity = 0 cho duong nam ngang tuyet doi', () => {
    const path = buildWavePath(0, 0.8);
    const ys = path.anchors.flatMap((a) => [a.y, a.in?.y, a.out?.y].filter((v): v is number => v !== undefined));
    expect(ys.every((y) => Math.abs(y - 0.8) < 1e-9)).toBe(true);
  });

  it('anchor giua nam giua theo truc x, anchor dau va cuoi o hai mep', () => {
    const path = buildWavePath(0.5, 0.8);
    expect(path.anchors.map((a) => a.x)).toEqual([0, 0.5, 1]);
  });

  it('handle vao anchor cuoi nam cao hon anchor cuoi, tao cung vong len', () => {
    const path = buildWavePath(0.5, 0.8);
    const last = path.anchors[2];
    // y nhỏ hơn = cao hơn trên màn hình
    expect(last.in!.y).toBeLessThan(last.y);
  });
});

describe('warpShapes', () => {
  const shapes: GlyphShape[] = [{ outer: [0, 40, 100, 40, 100, 60, 0, 60], holes: [[10, 45, 20, 45, 20, 55]] }];
  const box = { width: 400, baselineY: 50 };

  it('path phang cho phep dong nhat', () => {
    const sampler = buildPathSampler(flatPath(0.5), SIZE);
    const result = warpShapes(shapes, sampler, box);
    result[0].outer.forEach((value, i) => expect(value).toBeCloseTo(shapes[0].outer[i], 4));
    result[0].holes[0].forEach((value, i) => expect(value).toBeCloseTo(shapes[0].holes[0][i], 4));
  });

  it('giu nguyen so shape va so lo', () => {
    const sampler = buildPathSampler(buildWavePath(0.6, 0.5), SIZE);
    const result = warpShapes(shapes, sampler, box);
    expect(result).toHaveLength(1);
    expect(result[0].holes).toHaveLength(1);
    expect(result[0].outer).toHaveLength(shapes[0].outer.length);
  });

  it('path cong lam toa do doi va van huu han', () => {
    const sampler = buildPathSampler(buildWavePath(1, 0.5), SIZE);
    const result = warpShapes(shapes, sampler, box);
    expect(result[0].outer.every(Number.isFinite)).toBe(true);
    expect(result[0].outer).not.toEqual(shapes[0].outer);
  });

  it('sampler suy bien tra ve shape goc, khong chia cho 0', () => {
    const sampler = { length: 0, at: () => ({ point: { x: 0, y: 0 }, tangent: { x: 1, y: 0 } }) };
    expect(warpShapes(shapes, sampler, box)).toBe(shapes);
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/text/__tests__/warp.test.ts
```

Kỳ vọng: FAIL, không resolve được `../warp`.

- [ ] **Step 3: Viết `src/text/warp.ts`**

```ts
import type { Size, WarpAnchor, WarpPath } from '../schema';
import type { Contour, GlyphShape } from './glyphOutlines';

export interface Point {
  x: number;
  y: number;
}

export interface PathSampler {
  length: number;
  at(distance: number): { point: Point; tangent: Point };
}

const SAMPLES_PER_SEGMENT = 32;
const EPSILON = 1e-6;

function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

// Chuyển path chuẩn hoá 0..1 thành bảng {khoảng cách tích luỹ, điểm} trong px.
// Tra cứu theo arc-length (chứ không theo tham số t của bezier) là điều kiện
// để chữ phân bố đều dọc đường cong — tham số t chạy nhanh chậm không đều.
export function buildPathSampler(path: WarpPath, size: Size): PathSampler {
  const toPx = (p: { x: number; y: number }): Point => ({ x: p.x * size.width, y: p.y * size.height });
  const anchorPoint = (a: WarpAnchor): Point => toPx(a);

  const points: Point[] = [];
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const p0 = anchorPoint(from);
    const p3 = anchorPoint(to);
    const p1 = from.out ? toPx(from.out) : p0;
    const p2 = to.in ? toPx(to.in) : p3;
    for (let step = 0; step <= SAMPLES_PER_SEGMENT; step++) {
      // Bỏ mẫu đầu của mọi đoạn trừ đoạn đầu tiên — nó trùng với mẫu cuối
      // của đoạn trước, để lại sẽ tạo một bước dài 0 trong bảng arc-length.
      if (i > 0 && step === 0) continue;
      points.push(cubicPoint(p0, p1, p2, p3, step / SAMPLES_PER_SEGMENT));
    }
  }

  const distances: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const length = distances[distances.length - 1] ?? 0;

  return {
    length,
    at(distance: number) {
      if (points.length < 2 || length < EPSILON) {
        return { point: points[0] ?? { x: 0, y: 0 }, tangent: { x: 1, y: 0 } };
      }
      const clamped = Math.min(Math.max(distance, 0), length);

      let low = 0;
      let high = distances.length - 1;
      while (high - low > 1) {
        const mid = (low + high) >> 1;
        if (distances[mid] <= clamped) low = mid;
        else high = mid;
      }

      const span = distances[high] - distances[low];
      const t = span < EPSILON ? 0 : (clamped - distances[low]) / span;
      const a = points[low];
      const b = points[high];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const norm = Math.hypot(dx, dy) || 1;
      return {
        point: { x: a.x + dx * t, y: a.y + dy * t },
        tangent: { x: dx / norm, y: dy / norm },
      };
    },
  };
}

// Đúng cấu trúc docs/wave-transformation.md mô tả: 1 path mở, 3 anchor,
// 4 handle, tổng 7 point hiển thị. baselineRatio = baselineY / height, nên
// intensity = 0 cho ra một đường ngang đúng ngay tại baseline — tức warp
// trở thành phép đồng nhất.
export function buildWavePath(intensity: number, baselineRatio: number): WarpPath {
  const a = intensity * 0.4;
  const b = baselineRatio;
  return {
    role: 'baseline',
    closed: false,
    anchors: [
      // Xuất phát thấp bên trái, handle nằm ngang: đoạn đầu gần như thẳng
      // rồi mới cong lên (tài liệu §6, đoạn 1).
      { x: 0, y: b + a, out: { x: 0.2, y: b + a } },
      // Hai handle đối xứng qua anchor giữa ⇒ thẳng hàng, chuyển tiếp mượt
      // giữa hai đoạn cong (tài liệu §2).
      { x: 0.5, y: b, in: { x: 0.35, y: b + 0.15 * a }, out: { x: 0.65, y: b - 0.15 * a } },
      // Handle vào nằm *trên* anchor cuối ⇒ cung lớn vồng lên ở khoảng
      // giữa-phải rồi hạ xuống điểm kết thúc (tài liệu §6, đoạn 2).
      { x: 1, y: b + 0.6 * a, in: { x: 0.75, y: b - 0.4 * a } },
    ],
  };
}

function warpContour(contour: Contour, sampler: PathSampler, box: { width: number; baselineY: number }): Contour {
  const out = new Array<number>(contour.length);
  for (let i = 0; i < contour.length; i += 2) {
    const { point, tangent } = sampler.at((contour[i] / box.width) * sampler.length);
    const dy = contour[i + 1] - box.baselineY;
    // N = (-T.y, T.x): pháp tuyến trong hệ y hướng xuống. Với path phẳng
    // (T = (1,0), N = (0,1)) công thức rút về p' = p — phép đồng nhất.
    out[i] = point.x - tangent.y * dy;
    out[i + 1] = point.y + tangent.x * dy;
  }
  return out;
}

// Chữ được kéo giãn cho vừa chiều dài path: hoành độ trong hộp ánh xạ tuyến
// tính sang arc-length. Chiều cao chữ giữ nguyên, chỉ trượt và nghiêng theo
// tiếp tuyến (baseline follow — xem spec §6.2).
export function warpShapes(
  shapes: GlyphShape[],
  sampler: PathSampler,
  box: { width: number; baselineY: number },
): GlyphShape[] {
  if (sampler.length < EPSILON || box.width < EPSILON) return shapes;
  return shapes.map((shape) => ({
    outer: warpContour(shape.outer, sampler, box),
    holes: shape.holes.map((hole) => warpContour(hole, sampler, box)),
  }));
}
```

- [ ] **Step 4: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/text/__tests__/warp.test.ts
```

Kỳ vọng: 11 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/text/warp.ts src/text/__tests__/warp.test.ts
git commit -m "feat(text): arc-length sampler + wave path + warp contour"
```

---

## Task 6: textGeometry — keo dán

**Files:**
- Create: `src/text/textGeometry.ts`
- Test: `src/text/__tests__/textGeometry.test.ts`

**Interfaces:**
- Consumes: `layoutText` (Task 3), `buildPathSampler` / `buildWavePath` / `warpShapes` (Task 5), `TextNode` / `WarpPath` (Task 4), `GlyphShape` (Task 2).
- Produces:
  - `interface TextGeometry { shapes: GlyphShape[]; width: number; height: number; baselineY: number }`
  - `textGeometry(node: TextNode, font: opentype.Font): TextGeometry`
  - `measureText(node: TextNode, font: opentype.Font): { width: number; height: number }`
  - `resolveWarpPath(node: TextNode, baselineRatio: number): WarpPath | null`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/text/__tests__/textGeometry.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TextNode } from '../../schema';
import { measureText, resolveWarpPath, textGeometry } from '../textGeometry';

let poppins: opentype.Font;
beforeAll(() => {
  const path = fileURLToPath(new URL('../fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  poppins = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
});

function textNode(overrides: Partial<TextNode> = {}): TextNode {
  return {
    id: 'text-1',
    type: 'text',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
    size: { width: 300, height: 120 },
    opacity: 1,
    visible: true,
    locked: false,
    text: 'Wave',
    font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#000000' },
    ...overrides,
  };
}

describe('resolveWarpPath', () => {
  it('tra null khi khong co warp hoac warp type none', () => {
    expect(resolveWarpPath(textNode(), 0.8)).toBeNull();
    expect(resolveWarpPath(textNode({ warp: { type: 'none', intensity: 0.5 } }), 0.8)).toBeNull();
  });

  it('sinh path preset cho wave khi chua co paths', () => {
    const path = resolveWarpPath(textNode({ warp: { type: 'wave', intensity: 0.5 } }), 0.8);
    expect(path?.anchors).toHaveLength(3);
  });

  it('uu tien paths da luu hon preset', () => {
    const stored = {
      role: 'baseline' as const,
      closed: false,
      anchors: [
        { x: 0, y: 0.1 },
        { x: 1, y: 0.9 },
      ],
    };
    const path = resolveWarpPath(textNode({ warp: { type: 'wave', intensity: 0.5, paths: [stored] } }), 0.8);
    expect(path).toEqual(stored);
  });

  it('bo qua paths co duoi 2 anchor', () => {
    const broken = { role: 'baseline' as const, closed: false, anchors: [{ x: 0, y: 0.5 }] };
    expect(resolveWarpPath(textNode({ warp: { type: 'wave', intensity: 0.5, paths: [broken] } }), 0.8)).toBeNull();
  });

  it('tra null cho transformation chua co preset', () => {
    expect(resolveWarpPath(textNode({ warp: { type: 'arch', intensity: 0.5 } }), 0.8)).toBeNull();
  });
});

describe('textGeometry', () => {
  it('khong warp thi giong het layout thuan', () => {
    const plain = textGeometry(textNode(), poppins);
    const noneWarp = textGeometry(textNode({ warp: { type: 'none', intensity: 0.5 } }), poppins);
    expect(noneWarp.shapes[0].outer).toEqual(plain.shapes[0].outer);
  });

  it('wave voi intensity = 0 la phep dong nhat', () => {
    const plain = textGeometry(textNode(), poppins);
    const flat = textGeometry(textNode({ warp: { type: 'wave', intensity: 0 } }), poppins);
    plain.shapes[0].outer.forEach((value, i) => expect(flat.shapes[0].outer[i]).toBeCloseTo(value, 4));
  });

  it('wave voi intensity > 0 lam doi hinh hoc', () => {
    const plain = textGeometry(textNode(), poppins);
    const waved = textGeometry(textNode({ warp: { type: 'wave', intensity: 0.8 } }), poppins);
    expect(waved.shapes[0].outer).not.toEqual(plain.shapes[0].outer);
    expect(waved.shapes[0].outer.every(Number.isFinite)).toBe(true);
  });

  it('width/height khong doi khi warp — do la kich thuoc chua warp', () => {
    const plain = textGeometry(textNode(), poppins);
    const waved = textGeometry(textNode({ warp: { type: 'wave', intensity: 0.8 } }), poppins);
    expect(waved.width).toBeCloseTo(plain.width, 6);
    expect(waved.height).toBeCloseTo(plain.height, 6);
  });

  it('measureText khop voi textGeometry', () => {
    const node = textNode();
    const geometry = textGeometry(node, poppins);
    expect(measureText(node, poppins)).toEqual({ width: geometry.width, height: geometry.height });
  });

  it('text rong khong throw', () => {
    const geometry = textGeometry(textNode({ text: '', warp: { type: 'wave', intensity: 0.8 } }), poppins);
    expect(geometry.shapes).toEqual([]);
  });

  it('measureText co chieu rong toi thieu de node rong van chon duoc', () => {
    const empty = textNode({ text: '' });
    expect(textGeometry(empty, poppins).width).toBe(0);
    expect(measureText(empty, poppins).width).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/text/__tests__/textGeometry.test.ts
```

Kỳ vọng: FAIL, không resolve được `../textGeometry`.

- [ ] **Step 3: Viết `src/text/textGeometry.ts`**

```ts
import type { Font } from 'opentype.js';
import type { TextNode, WarpPath } from '../schema';
import type { GlyphShape } from './glyphOutlines';
import { layoutText } from './layout';
import { buildPathSampler, buildWavePath, warpShapes } from './warp';

export interface TextGeometry {
  shapes: GlyphShape[];
  // Kích thước text *chưa warp*. Đây cũng là mẫu số chuẩn hoá của warp path,
  // nên nó phải độc lập với warp — nếu lấy bbox sau warp thì path lại phụ
  // thuộc chính kết quả của nó, thành vòng lặp phản hồi.
  width: number;
  height: number;
  baselineY: number;
}

// paths đã lưu thắng preset. Preset chỉ tồn tại cho 'wave' ở v1; 7 kiểu còn
// lại trả null (vẽ như không warp) cho tới khi có hàm sinh path riêng —
// cùng quy ước "silently inert" mà buildFilters.ts dùng cho shaderId lạ.
export function resolveWarpPath(node: TextNode, baselineRatio: number): WarpPath | null {
  const warp = node.warp;
  if (!warp || warp.type === 'none') return null;

  const stored = warp.paths?.find((path) => path.role === 'baseline');
  if (stored) return stored.anchors.length >= 2 ? stored : null;

  if (warp.type === 'wave') return buildWavePath(warp.intensity, baselineRatio);
  return null;
}

export function textGeometry(node: TextNode, font: Font): TextGeometry {
  const layout = layoutText({
    text: node.text,
    font,
    fontSize: node.font.size,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
    align: node.align,
  });

  const path = layout.height > 0 ? resolveWarpPath(node, layout.baselineY / layout.height) : null;
  if (!path) return layout;

  const sampler = buildPathSampler(path, { width: layout.width, height: layout.height });
  return {
    ...layout,
    shapes: warpShapes(layout.shapes, sampler, { width: layout.width, baselineY: layout.baselineY }),
  };
}

// Dùng bởi UI để giữ node.size khớp với nội dung sau khi sửa chữ/font —
// node.size là nguồn cho pivot (applyTransform.ts) và cho khung chọn
// (SelectionOverlay.tsx), nên không được để nó lệch khỏi text thật.
//
// Sàn chiều rộng: text rỗng đo ra width = 0, mà khung chọn rộng 0 thì không
// click trúng được nữa — node sẽ chỉ chọn được qua LayersPanel. Sàn này chỉ
// áp cho node.size, không đụng tới hình học thật mà textGeometry trả về.
export function measureText(node: TextNode, font: Font): { width: number; height: number } {
  const { width, height } = textGeometry(node, font);
  return { width: Math.max(width, node.font.size * 0.5), height };
}
```

- [ ] **Step 4: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/text/__tests__/textGeometry.test.ts
pnpm test
```

Kỳ vọng: 12 test mới PASS, và toàn bộ test cũ vẫn PASS.

- [ ] **Step 5: Commit**

```bash
git add src/text/textGeometry.ts src/text/__tests__/textGeometry.test.ts
git commit -m "feat(text): textGeometry gop layout + warp"
```

---

## Task 7: Render text lên canvas

Kết thúc task này là lần đầu **nhìn thấy chữ** trên canvas.

**Files:**
- Create: `src/render/renderers/textRenderer.ts`
- Modify: `src/render/SceneReconciler.ts`, `src/ui/Toolbar.tsx`, `src/ui/SelectionOverlay.tsx`, `demo/main.tsx`, `demo/samples.ts`
- Test: `src/render/__tests__/textRenderer.test.ts`

**Interfaces:**
- Consumes: `textGeometry` / `measureText` (Task 6), `getLoadedFont` / `loadFont` / `onFontLoaded` / `registeredFamilies` (Task 1), `resolveFill` (`src/render/fillToColor.ts`), `applyTransform` (`src/render/applyTransform.ts`).
- Produces:
  - `textRenderer: { create(node: TextNode): Graphics; update(obj: Graphics, node: TextNode): void }`
  - `defaultTextNode(family: string, size: { width: number; height: number }): TextNode` (export từ `src/ui/Toolbar.tsx`, cùng chỗ `defaultImageNode` / `defaultSvgNode` đang nằm)

- [ ] **Step 1: Viết test thất bại**

`textRenderer` đụng Pixi nên không test render thật ở đây; test khoá đúng phần logic quyết định thứ tự lệnh vẽ (fill từng shape rồi cut từng lỗ), qua một `Graphics` giả.

Tạo `src/render/__tests__/textRenderer.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getLoadedFont, loadFont, registerFont } from '../../text/fontService';
import { drawTextShapes, type TextDrawTarget } from '../renderers/textRenderer';
import { textGeometry } from '../../text/textGeometry';
import type { TextNode } from '../../schema';

function readFontBuffer(fileName: string): ArrayBuffer {
  const path = fileURLToPath(new URL(`../../text/fonts/${fileName}`, import.meta.url));
  const buffer = readFileSync(path);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function fakeTarget() {
  const calls: string[] = [];
  const target: TextDrawTarget = {
    poly() {
      calls.push('poly');
      return target;
    },
    fill() {
      calls.push('fill');
      return target;
    },
    cut() {
      calls.push('cut');
      return target;
    },
  };
  return { target, calls };
}

const node: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 300, height: 120 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'o',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

beforeAll(async () => {
  registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
  await loadFont('Poppins');
});

describe('drawTextShapes', () => {
  it('chu "o": fill outer roi cut lo, dung thu tu', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry(node, font).shapes, node.fill);
    // poly(outer) -> fill -> poly(hole) -> cut
    expect(calls).toEqual(['poly', 'fill', 'poly', 'cut']);
  });

  it('chu khong lo chi fill, khong cut', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry({ ...node, text: 'l' }, font).shapes, node.fill);
    expect(calls).toEqual(['poly', 'fill']);
  });

  it('text rong khong ve gi', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry({ ...node, text: '' }, font).shapes, node.fill);
    expect(calls).toEqual([]);
  });
});
```

Nếu chữ `l` của Poppins ra nhiều hơn 1 shape, đổi sang `'I'` — kiểm tra nhanh bằng `getGlyphOutlines('l', font, 100)[0].shapes.length`.

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/render/__tests__/textRenderer.test.ts
```

Kỳ vọng: FAIL, không resolve được `../renderers/textRenderer`.

- [ ] **Step 3: Viết `src/render/renderers/textRenderer.ts`**

```ts
import { Graphics } from 'pixi.js';
import type { Fill, TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill } from '../fillToColor';
import { getLoadedFont, loadFont, onFontLoaded } from '../../text/fontService';
import { textGeometry } from '../../text/textGeometry';
import type { GlyphShape } from '../../text/glyphOutlines';

// Đúng phần bề mặt Graphics mà việc vẽ chữ cần — tách ra để test được thứ tự
// lệnh vẽ mà không phải dựng WebGL.
export interface TextDrawTarget {
  poly(points: number[], close?: boolean): TextDrawTarget;
  fill(style?: unknown): TextDrawTarget;
  cut(): TextDrawTarget;
}

// Lỗ trong chữ ('o', 'a', '8') phải khai báo tường minh: Pixi v8 KHÔNG áp
// dụng winding non-zero cho nhiều poly() trong cùng một fill() — mỗi polygon
// được tam giác hoá riêng nên ruột chữ sẽ bị tô đặc. cut() gắn lỗ vào shape
// cuối cùng của lệnh fill ngay trước đó (xem GraphicsContext.cut() trong
// pixi.js), nên phải fill *từng* outer rồi cut lỗ của chính nó — không gộp
// nhiều outer vào một fill.
export function drawTextShapes(target: TextDrawTarget, shapes: GlyphShape[], fill: Fill): void {
  const style = resolveFill(fill);
  for (const shape of shapes) {
    target.poly(shape.outer, true).fill(style);
    for (const hole of shape.holes) target.poly(hole, true).cut();
  }
}

type TextGraphics = Graphics & { textNode?: TextNode; offFontLoaded?: () => void };

function draw(obj: TextGraphics, node: TextNode): void {
  obj.clear();
  const loaded = getLoadedFont(node.font.family);
  if (!loaded) {
    // Font chưa nạp xong: không vẽ gì và kích hoạt nạp. Callback đăng ký ở
    // create() sẽ vẽ lại khi font sẵn sàng.
    void loadFont(node.font.family);
    return;
  }
  drawTextShapes(obj as unknown as TextDrawTarget, textGeometry(node, loaded.font).shapes, node.fill);
}

export const textRenderer = {
  create(node: TextNode): Graphics {
    const obj: TextGraphics = new Graphics();
    // textNode được làm mới ở mỗi update() nên callback không bao giờ vẽ lại
    // một node đã cũ.
    obj.offFontLoaded = onFontLoaded((family) => {
      if (!obj.destroyed && obj.textNode && family === obj.textNode.font.family) draw(obj, obj.textNode);
    });
    obj.once('destroyed', () => obj.offFontLoaded?.());
    this.update(obj, node);
    return obj;
  },
  update(obj: Graphics, node: TextNode): void {
    const target = obj as TextGraphics;
    target.textNode = node;
    draw(target, node);
    applyTransform(obj, node);
  },
};
```

- [ ] **Step 4: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/render/__tests__/textRenderer.test.ts
```

Kỳ vọng: 3 test PASS.

- [ ] **Step 5: Nối vào `SceneReconciler`**

Trong `src/render/SceneReconciler.ts`, thêm import và hai case:

```ts
import { textRenderer } from './renderers/textRenderer';
```

Trong `createDisplayObject`:

```ts
    case 'text':
      return textRenderer.create(node);
```

Trong `updateDisplayObject`:

```ts
    case 'text':
      textRenderer.update(obj as never, node);
      break;
```

- [ ] **Step 6: Thêm nút "Add Text" vào `src/ui/Toolbar.tsx`**

Thêm import:

```ts
import { getLoadedFont, loadFont, registeredFamilies } from '../text/fontService';
import { measureText } from '../text/textGeometry';
import type { TextNode } from '../schema';
```

Thêm hàm tạo node, cạnh `defaultShapeNode`:

```ts
// Kích thước text là *kết quả* của layout chứ không phải đầu vào, nên node
// được tạo với size đo thật ngay từ đầu — SelectionOverlay và applyTransform
// đều đọc node.size.
export function defaultTextNode(family: string, size: { width: number; height: number }): TextNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size,
    opacity: 1,
    visible: true,
    locked: false,
    type: 'text',
    text: 'Your text',
    font: { family, weight: 400, style: 'normal', size: 96 },
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#111827' },
  };
}
```

Trong component `Toolbar`, thêm handler và nút:

```ts
  const fontFamilies = registeredFamilies();

  const handleAddText = async () => {
    const family = fontFamilies[0];
    if (!family) return;
    const loaded = getLoadedFont(family) ?? (await loadFont(family));
    if (!loaded) return;
    const draft = defaultTextNode(family, { width: 1, height: 1 });
    addNode({ ...draft, size: measureText(draft, loaded.font) });
  };
```

`addNode` hiện có kiểu `(node: ShapeNode | ImageNode | SvgNode)` — mở rộng thành:

```ts
  const addNode = (node: ShapeNode | ImageNode | SvgNode | TextNode) => {
```

Nút, đặt ngay sau nút "Add Shape":

```tsx
      <button
        type="button"
        disabled={fontFamilies.length === 0}
        title={fontFamilies.length === 0 ? 'Chua dang ky font nao (registerFont)' : undefined}
        onClick={() => void handleAddText()}
        className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50"
      >
        Add Text
      </button>
```

- [ ] **Step 7: Khoá resize cho text node trong `src/ui/SelectionOverlay.tsx`**

Text node tự co theo nội dung, nên 8 handle resize không có gì hợp lý để làm với nó (spec §2 quyết định #5). Bọc khối `HANDLES.map(...)`:

```tsx
      {!isCropping &&
        node.type !== 'text' &&
        HANDLES.map((handle) => {
```

Handle rotate giữ nguyên.

- [ ] **Step 8: Đăng ký font trong demo**

Ở đầu `demo/main.tsx`, sau các import sẵn có:

```ts
import { registerFont } from '../src/text/fontService';
import poppinsUrl from '../src/text/fonts/Poppins-Regular.ttf?url';
import antonUrl from '../src/text/fonts/Anton-Regular.ttf?url';
import lobsterUrl from '../src/text/fonts/Lobster-Regular.ttf?url';

registerFont('Poppins', poppinsUrl);
registerFont('Anton', antonUrl);
registerFont('Lobster', lobsterUrl);
```

`?url` cần khai báo type của Vite. Tạo `demo/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 9: Thêm sample có sẵn text vào `demo/samples.ts`**

Thêm export mới trước `export const samples`:

```ts
export const textWaveSample: Document = baseDoc({
  id: 'sample-text-wave',
  assets: {},
  pages: [
    {
      id: 'page-1',
      name: 'Page 1',
      size: { width: 900, height: 500 },
      background: { type: 'color', value: '#ffffff' },
      children: [
        {
          id: 'text-plain',
          type: 'text',
          transform: { x: 450, y: 140, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
          size: { width: 420, height: 130 },
          opacity: 1,
          visible: true,
          locked: false,
          text: 'Desfoyo',
          font: { family: 'Anton', weight: 400, style: 'normal', size: 110 },
          align: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          fill: { type: 'solid', color: '#111827' },
        },
        {
          id: 'text-waved',
          type: 'text',
          transform: { x: 450, y: 340, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
          size: { width: 420, height: 130 },
          opacity: 1,
          visible: true,
          locked: false,
          text: 'Desfoyo',
          font: { family: 'Anton', weight: 400, style: 'normal', size: 110 },
          align: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          fill: { type: 'solid', color: '#2563eb' },
          warp: { type: 'wave', intensity: 0.5 },
        },
      ],
    },
  ],
});
```

Và thêm vào map:

```ts
export const samples: Record<string, Document> = {
  'Basic shapes': basicShapesSample,
  'Shadow effect': shadowEffectSample,
  'Text + wave': textWaveSample,
};
```

- [ ] **Step 10: Kiểm chứng bằng mắt trên dev server**

Mở preview (`preview_start` với config `dev` trong `.claude/launch.json`), chọn sample **Text + wave**, rồi kiểm:

1. Dòng trên hiện chữ "Desfoyo" thẳng, màu đen — **ruột chữ `o` phải rỗng**, không bị tô đặc. Nếu đặc, phần `cut()` sai: xem lại thứ tự lệnh trong `drawTextShapes`.
2. Dòng dưới hiện chữ cong theo sóng, màu xanh.
3. Console không có lỗi (`read_console_messages`).
4. Bấm "Add Text" → node text mới hiện ra và kéo di chuyển được.
5. Chọn node text → chỉ thấy handle rotate, không có 8 handle resize.

Chụp screenshot làm bằng chứng.

- [ ] **Step 11: Lint và chạy toàn bộ test**

```bash
pnpm lint
pnpm test
```

- [ ] **Step 12: Commit**

```bash
git add src demo
git commit -m "feat(text): textRenderer + nut Add Text + sample demo"
```

---

## Task 8: Sửa chữ bằng overlay textarea

**Files:**
- Create: `src/ui/TextEditOverlay.tsx`
- Modify: `src/ui/SelectionOverlay.tsx`
- Test: `src/ui/__tests__/textEditOverlay.test.ts`

**Interfaces:**
- Consumes: `measureText` / `getLoadedFont` (Task 1, 6), `createViewport` (`src/render/viewport.ts`), `TextNode` (Task 4).
- Produces:
  - `textEditPatch(node: TextNode, text: string, font: opentype.Font | null): Partial<TextNode>` — hàm thuần, gộp text mới với size đo lại
  - `<TextEditOverlay node viewport activePageId onClose />`

- [ ] **Step 1: Viết test thất bại**

Chỉ test phần thuần (`textEditPatch`); phần JSX kiểm chứng bằng mắt ở Step 6.

Tạo `src/ui/__tests__/textEditOverlay.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TextNode } from '../../schema';
import { textEditPatch } from '../TextEditOverlay';

let poppins: opentype.Font;
beforeAll(() => {
  const path = fileURLToPath(new URL('../../text/fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  poppins = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
});

const node: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 10, height: 10 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'a',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

describe('textEditPatch', () => {
  it('doi text va do lai size', () => {
    const patch = textEditPatch(node, 'abc', poppins);
    expect(patch.text).toBe('abc');
    expect(patch.size!.width).toBeGreaterThan(0);
    expect(patch.size!.height).toBeGreaterThan(0);
  });

  it('text dai hon thi size rong hon', () => {
    const short = textEditPatch(node, 'a', poppins).size!.width;
    const long = textEditPatch(node, 'aaaa', poppins).size!.width;
    expect(long).toBeGreaterThan(short);
  });

  it('khong co font thi chi doi text, giu nguyen size', () => {
    expect(textEditPatch(node, 'abc', null)).toEqual({ text: 'abc' });
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/ui/__tests__/textEditOverlay.test.ts
```

Kỳ vọng: FAIL, không resolve được `../TextEditOverlay`.

- [ ] **Step 3: Viết `src/ui/TextEditOverlay.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import type { Font } from 'opentype.js';
import { useEditorStoreApi } from './EditorContext';
import type { Viewport } from '../render/viewport';
import { getLoadedFont } from '../text/fontService';
import { measureText } from '../text/textGeometry';
import type { Node, TextNode } from '../schema';

// node.size là kết quả của layout, nên mỗi lần nội dung đổi thì size phải đo
// lại cùng lúc — applyTransform.ts (pivot) và SelectionOverlay.tsx (khung
// chọn) đều đọc node.size, để lệch là khung chọn sai ngay.
export function textEditPatch(node: TextNode, text: string, font: Font | null): Partial<TextNode> {
  if (!font) return { text };
  return { text, size: measureText({ ...node, text }, font) };
}

// Dùng <textarea> DOM thật thay vì tự vẽ caret trên canvas: trình duyệt lo
// caret, bôi đen và IME tiếng Việt. Đánh đổi đã biết: khi node đang warp,
// textarea vẫn hiện chữ thẳng — xem docs/text-future-work.md mục 10.
export function TextEditOverlay({
  node,
  viewport,
  activePageId,
  onClose,
}: {
  node: TextNode;
  viewport: Viewport;
  activePageId: string;
  onClose: () => void;
}) {
  const store = useEditorStoreApi();
  const [value, setValue] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const commit = () => {
    if (value !== node.text) {
      const font = getLoadedFont(node.font.family)?.font ?? null;
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: textEditPatch(node, value, font) as Partial<Node>,
      });
    }
    onClose();
  };

  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;
  const topLeft = viewport.toScreen({
    x: node.transform.x - originX * node.size.width,
    y: node.transform.y - originY * node.size.height,
  });
  const zoom = viewport.toScreen({ x: 1, y: 0 }).x - viewport.toScreen({ x: 0, y: 0 }).x;

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          setValue(node.text);
          onClose();
        }
      }}
      className="pointer-events-auto absolute resize-none overflow-hidden border-2 border-blue-500 bg-white/90 p-0 outline-none"
      style={{
        left: topLeft.x,
        top: topLeft.y,
        width: node.size.width * zoom,
        height: node.size.height * zoom,
        // Cùng family mà fontService đã đăng ký qua FontFace, nên chữ trong
        // textarea trông sát với chữ trên canvas.
        fontFamily: `"${node.font.family}", sans-serif`,
        fontSize: node.font.size * zoom,
        lineHeight: node.lineHeight,
        letterSpacing: node.letterSpacing * zoom,
        textAlign: node.align,
        color: node.fill.type === 'solid' ? node.fill.color : '#000000',
        transformOrigin: `${originX * 100}% ${originY * 100}%`,
        transform: `rotate(${(node.transform.rotation * 180) / Math.PI}deg)`,
      }}
    />
  );
}
```

- [ ] **Step 4: Nối vào `src/ui/SelectionOverlay.tsx`**

Thêm import:

```tsx
import { TextEditOverlay } from './TextEditOverlay';
```

Trong `SingleSelectionOverlay`, thêm state cạnh `croppingNodeId`:

```tsx
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const isEditingText = node.type === 'text' && editingNodeId === node.id;
```

Sửa handler double-click của khung bao để nhận cả text:

```tsx
        onDoubleClick={() => {
          if (node.type === 'image') setCroppingNodeId(isCropping ? null : node.id);
          if (node.type === 'text') setEditingNodeId(isEditingText ? null : node.id);
        }}
```

Khối `className`/`onPointerDown` của khung bao hiện chỉ bật `pointer-events-auto` cho image. Text cần y hệt lý do đã ghi trong comment ở file đó (nhận double-click nhưng vẫn phải chuyển tiếp pointerdown xuống canvas để `attachDrag` chạy) — đổi cả hai chỗ `node.type !== 'image'` / `node.type === 'image'` thành kiểm tra hai loại:

```tsx
        onPointerDown={(e) => {
          if ((node.type !== 'image' && node.type !== 'text') || !canvas) return;
          canvas.dispatchEvent(
            new PointerEvent('pointerdown', {
              bubbles: true,
              cancelable: true,
              clientX: e.clientX,
              clientY: e.clientY,
              pointerId: e.pointerId,
              pointerType: e.pointerType,
              button: e.button,
              buttons: e.buttons,
              isPrimary: e.isPrimary,
            }),
          );
        }}
        className={`absolute border-2 border-blue-500 ${
          node.type === 'image' || node.type === 'text' ? 'pointer-events-auto' : ''
        }`}
```

Thêm render overlay, ngay trước `{extras}`:

```tsx
      {isEditingText && node.type === 'text' && (
        <TextEditOverlay
          node={node}
          viewport={viewport}
          activePageId={activePageId}
          onClose={() => setEditingNodeId(null)}
        />
      )}
```

Và ẩn 8 handle + handle rotate khi đang sửa chữ, để textarea không bị che: đổi điều kiện của handle rotate thành `{!isCropping && !isEditingText && (`.

- [ ] **Step 5: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/ui/__tests__/textEditOverlay.test.ts
pnpm lint
```

Kỳ vọng: 3 test PASS, lint sạch.

- [ ] **Step 6: Kiểm chứng bằng mắt**

Trên dev server, sample "Text + wave":

1. Double-click node text → textarea hiện đúng vị trí, chữ được bôi đen sẵn.
2. Gõ chữ mới → blur (click ra ngoài) → chữ trên canvas đổi theo, **khung chọn ôm sát chữ mới** (chứng tỏ size đã đo lại).
3. Gõ rồi bấm Escape → chữ giữ nguyên như cũ.
4. Gõ Enter giữa chữ → xuống dòng, canvas hiện 2 dòng.
5. Undo một lần → về nội dung cũ.

- [ ] **Step 7: Commit**

```bash
git add src/ui
git commit -m "feat(text): sua chu bang overlay textarea"
```

---

## Task 9: Panel thuộc tính cho text

**Files:**
- Modify: `src/ui/PropertiesPanel.tsx`

**Interfaces:**
- Consumes: `registeredFamilies` / `getLoadedFont` (Task 1), `measureText` (Task 6), `TextNode` (Task 4), `FillControls` (đã có sẵn trong `PropertiesPanel.tsx`).
- Produces: `<TextControls node onChange />` (nội bộ file này)

- [ ] **Step 1: Thêm import**

```ts
import { getLoadedFont, registeredFamilies } from '../text/fontService';
import { measureText } from '../text/textGeometry';
import type { TextNode } from '../schema';
```

- [ ] **Step 2: Cho text dùng lại `FillControls`**

`hasFill` hiện chỉ nhận shape. Sửa:

```ts
function hasFill(node: Node): node is Node & { fill: Fill } {
  return node.type === 'shape' || node.type === 'text';
}
```

- [ ] **Step 3: Gắn `TextControls` vào panel**

Trong `PropertiesPanel`, thêm ngay trước dòng `{node.type === 'image' && (`:

```tsx
      {node.type === 'text' && (
        <TextControls node={node} onChange={(patch) => updateProps(patch as Partial<Node>)} />
      )}
```

- [ ] **Step 4: Viết `TextControls`**

Thêm vào cuối file:

```tsx
// Mọi thay đổi ảnh hưởng tới hình chữ (nội dung, font, size, spacing, line
// height, align) đều phải đo lại node.size cùng lúc — size là kết quả của
// layout, và cả pivot lẫn khung chọn đều đọc nó.
function TextControls({ node, onChange }: { node: TextNode; onChange: (patch: Partial<TextNode>) => void }) {
  const families = registeredFamilies();

  const applyWithMeasure = (patch: Partial<TextNode>) => {
    const next = { ...node, ...patch } as TextNode;
    const font = getLoadedFont(next.font.family)?.font;
    onChange(font ? { ...patch, size: measureText(next, font) } : patch);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-gray-200 pt-2">
      <span className="font-medium">Text</span>

      <label className="flex flex-col gap-1">
        Content
        <textarea
          value={node.text}
          rows={2}
          onChange={(e) => applyWithMeasure({ text: e.target.value })}
          className="resize-none rounded border border-gray-300 px-1 py-0.5"
        />
      </label>

      <label className="flex flex-col gap-1">
        Font
        <select
          value={node.font.family}
          onChange={(e) => applyWithMeasure({ font: { ...node.font, family: e.target.value } })}
          className="rounded border border-gray-300 px-1 py-0.5"
        >
          {families.map((family) => (
            <option key={family} value={family}>
              {family}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Size
        <input
          type="number"
          min={1}
          value={node.font.size}
          onChange={(e) => applyWithMeasure({ font: { ...node.font, size: Math.max(1, Number(e.target.value)) } })}
          className="rounded border border-gray-300 px-1 py-0.5"
        />
      </label>

      <label className="flex flex-col gap-1">
        Align
        <select
          value={node.align}
          onChange={(e) => applyWithMeasure({ align: e.target.value as TextNode['align'] })}
          className="rounded border border-gray-300 px-1 py-0.5"
        >
          {(['left', 'center', 'right'] as const).map((align) => (
            <option key={align} value={align}>
              {align}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Letter Spacing
        <input
          type="number"
          step={0.5}
          value={node.letterSpacing}
          onChange={(e) => applyWithMeasure({ letterSpacing: Number(e.target.value) })}
          className="rounded border border-gray-300 px-1 py-0.5"
        />
      </label>

      <label className="flex flex-col gap-1">
        Line Height
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={node.lineHeight}
          onChange={(e) => applyWithMeasure({ lineHeight: Math.max(0.1, Number(e.target.value)) })}
          className="rounded border border-gray-300 px-1 py-0.5"
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 5: Kiểm chứng bằng mắt**

Chọn node text trong sample "Text + wave" rồi lần lượt:

1. Đổi Font sang Lobster → chữ đổi kiểu, khung chọn ôm sát chữ mới.
2. Đổi Size → chữ to/nhỏ theo, khung chọn theo kịp.
3. Đổi Align sang center với text 2 dòng → dòng ngắn canh giữa.
4. Đổi Letter Spacing → giãn chữ.
5. Đổi màu ở khối Fill → chữ đổi màu.
6. Console không có lỗi.

- [ ] **Step 6: Lint, test, commit**

```bash
pnpm lint
pnpm test
git add src/ui/PropertiesPanel.tsx
git commit -m "feat(text): panel thuoc tinh cho text node"
```

---

## Task 10: Panel Transformation + slider Wave Curve

**Files:**
- Create: `src/ui/TransformationControls.tsx`
- Modify: `src/ui/PropertiesPanel.tsx`
- Test: `src/ui/__tests__/transformationControls.test.ts`

**Interfaces:**
- Consumes: `Warp` / `WarpType` / `TextNode` (Task 4).
- Produces:
  - `WARP_TYPES: WarpType[]` — 8 kiểu theo đúng thứ tự lưới của Kittl
  - `ENABLED_WARP_TYPES: WarpType[]` — chỉ `['none', 'wave']` ở v1
  - `setWarpType(warp: Warp | undefined, type: WarpType): Warp` — hàm thuần
  - `setWarpIntensity(warp: Warp | undefined, intensity: number): Warp` — hàm thuần, **xoá `paths`**
  - `resetWarp(warp: Warp | undefined): Warp` — hàm thuần
  - `<TransformationControls node onChange />`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/ui/__tests__/transformationControls.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Warp, WarpPath } from '../../schema';
import { resetWarp, setWarpIntensity, setWarpType, DEFAULT_WARP_INTENSITY } from '../TransformationControls';

const storedPath: WarpPath = {
  role: 'baseline',
  closed: false,
  anchors: [
    { x: 0, y: 0.9 },
    { x: 1, y: 0.5 },
  ],
};

const edited: Warp = { type: 'wave', intensity: 0.5, paths: [storedPath] };

describe('setWarpType', () => {
  it('tao warp moi voi intensity mac dinh khi chua co', () => {
    expect(setWarpType(undefined, 'wave')).toEqual({ type: 'wave', intensity: DEFAULT_WARP_INTENSITY });
  });

  it('doi kieu thi xoa paths cu vi path cua kieu khac khong dung nua', () => {
    expect(setWarpType(edited, 'arch').paths).toBeUndefined();
  });

  it('giu nguyen intensity khi doi kieu', () => {
    expect(setWarpType(edited, 'arch').intensity).toBe(0.5);
  });
});

describe('setWarpIntensity', () => {
  it('xoa paths de quay ve che do preset', () => {
    const next = setWarpIntensity(edited, 0.8);
    expect(next.intensity).toBe(0.8);
    expect(next.paths).toBeUndefined();
  });

  it('kep gia tri vao khoang 0..1', () => {
    expect(setWarpIntensity(edited, 5).intensity).toBe(1);
    expect(setWarpIntensity(edited, -2).intensity).toBe(0);
  });
});

describe('resetWarp', () => {
  it('xoa paths va tra intensity ve mac dinh, giu nguyen kieu', () => {
    expect(resetWarp(edited)).toEqual({ type: 'wave', intensity: DEFAULT_WARP_INTENSITY });
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/ui/__tests__/transformationControls.test.ts
```

Kỳ vọng: FAIL, không resolve được `../TransformationControls`.

- [ ] **Step 3: Viết `src/ui/TransformationControls.tsx`**

```tsx
import type { TextNode, Warp, WarpType } from '../schema';
import { useEditorStoreApi } from './EditorContext';

export const DEFAULT_WARP_INTENSITY = 0.5;

// Đúng lưới 4 cột x 2 hàng của panel Transformation trong docs/text-effect.md.
export const WARP_TYPES: WarpType[] = ['custom', 'distort', 'circle', 'angle', 'arch', 'rise', 'wave', 'flag'];

// v1 chỉ build Wave. 7 kiểu còn lại hiện nhưng bị khoá — xem
// docs/text-future-work.md mục 5.
export const ENABLED_WARP_TYPES: WarpType[] = ['wave'];

export function setWarpType(warp: Warp | undefined, type: WarpType): Warp {
  // paths bị xoá khi đổi kiểu: một path do user chỉnh cho Wave không còn ý
  // nghĩa gì với Arch hay Circle.
  return { type, intensity: warp?.intensity ?? DEFAULT_WARP_INTENSITY };
}

// Kéo slider = quay về chế độ preset, nên paths bị xoá. Đây là cách slider và
// handle không tranh nhau một nguồn dữ liệu (spec §4.2).
export function setWarpIntensity(warp: Warp | undefined, intensity: number): Warp {
  return {
    type: warp?.type ?? 'wave',
    intensity: Math.min(1, Math.max(0, intensity)),
  };
}

export function resetWarp(warp: Warp | undefined): Warp {
  return { type: warp?.type ?? 'none', intensity: DEFAULT_WARP_INTENSITY };
}

export function TransformationControls({
  node,
  activePageId,
}: {
  node: TextNode;
  activePageId: string;
}) {
  const store = useEditorStoreApi();
  const warp = node.warp;
  const active = warp?.type ?? 'none';

  const apply = (next: Warp) => {
    store.getState().dispatch({
      type: 'UpdateProps',
      pageId: activePageId,
      nodeId: node.id,
      patch: { warp: next } as Partial<TextNode>,
    });
  };

  return (
    <div className="flex flex-col gap-2 border-t border-gray-200 pt-2">
      <span className="font-medium">Transformation</span>

      <div className="grid grid-cols-4 gap-1">
        {WARP_TYPES.map((type) => {
          const enabled = ENABLED_WARP_TYPES.includes(type);
          return (
            <button
              key={type}
              type="button"
              disabled={!enabled}
              title={enabled ? type : `${type} — chua build`}
              onClick={() => apply(setWarpType(warp, type))}
              className={`rounded px-1 py-1 text-xs capitalize disabled:opacity-40 ${
                active === type ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {active !== 'none' && (
        <>
          <label className="flex flex-col gap-1 capitalize">
            {active} Curve — {Math.round((warp?.intensity ?? 0) * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={warp?.intensity ?? 0}
              onPointerDown={() => store.getState().beginGesture(`warp-intensity:${node.id}`)}
              onPointerUp={() => store.getState().endGesture()}
              onChange={(e) => apply(setWarpIntensity(warp, Number(e.target.value)))}
            />
          </label>

          <button
            type="button"
            onClick={() => apply(resetWarp(warp))}
            className="rounded bg-gray-100 px-2 py-1 text-xs"
          >
            Reset
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Gắn vào `src/ui/PropertiesPanel.tsx`**

Thêm import:

```ts
import { TransformationControls } from './TransformationControls';
```

Thêm ngay sau khối `TextControls`:

```tsx
      {node.type === 'text' && <TransformationControls node={node} activePageId={activePageId} />}
```

- [ ] **Step 5: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/ui/__tests__/transformationControls.test.ts
pnpm lint
```

Kỳ vọng: 6 test PASS.

- [ ] **Step 6: Kiểm chứng bằng mắt**

Chọn node text thẳng trong sample:

1. Lưới hiện 8 nút, chỉ **Wave** bấm được, 7 nút còn lại mờ.
2. Bấm Wave → chữ cong ngay, nút Wave sáng xanh.
3. Kéo slider "Wave Curve" → chữ cong real-time theo.
4. Kéo slider về 0% → chữ **thẳng hoàn toàn**, trùng với chữ chưa warp.
5. Undo một lần sau khi kéo slider liên tục → về đúng trạng thái trước lần kéo đó (một bước, không phải hàng chục bước).
6. Bấm Reset → về 50%.

- [ ] **Step 7: Commit**

```bash
git add src/ui
git commit -m "feat(text): panel transformation + slider wave curve"
```

---

## Task 11: Handle wave trên canvas

**Files:**
- Create: `src/ui/WarpHandlesOverlay.tsx`
- Modify: `src/ui/SelectionOverlay.tsx`
- Test: `src/ui/__tests__/warpHandles.test.ts`

**Interfaces:**
- Consumes: `resolveWarpPath` / `textGeometry` (Task 6), `getLoadedFont` (Task 1), `createViewport` (`src/render/viewport.ts`), `rotateVector` (`src/render/interactions/resizeMath.ts`), `WarpPath` (Task 4).
- Produces:
  - `type HandleRef = { anchor: number; kind: 'anchor' | 'in' | 'out' }`
  - `listHandles(path: WarpPath): HandleRef[]`
  - `movePathPoint(path: WarpPath, ref: HandleRef, delta: { x: number; y: number }): WarpPath` — hàm thuần; kéo anchor thì handle của nó đi theo
  - `<WarpHandlesOverlay node activePageId viewport />`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/ui/__tests__/warpHandles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { WarpPath } from '../../schema';
import { listHandles, movePathPoint } from '../WarpHandlesOverlay';

const path: WarpPath = {
  role: 'baseline',
  closed: false,
  anchors: [
    { x: 0, y: 0.9, out: { x: 0.2, y: 0.9 } },
    { x: 0.5, y: 0.8, in: { x: 0.35, y: 0.83 }, out: { x: 0.65, y: 0.77 } },
    { x: 1, y: 0.86, in: { x: 0.75, y: 0.72 } },
  ],
};

describe('listHandles', () => {
  it('liet ke dung 7 point: 3 anchor + 4 handle', () => {
    const handles = listHandles(path);
    expect(handles).toHaveLength(7);
    expect(handles.filter((h) => h.kind === 'anchor')).toHaveLength(3);
    expect(handles.filter((h) => h.kind !== 'anchor')).toHaveLength(4);
  });
});

describe('movePathPoint', () => {
  it('keo handle chi doi handle do', () => {
    const next = movePathPoint(path, { anchor: 0, kind: 'out' }, { x: 0.1, y: -0.05 });
    expect(next.anchors[0].out!.x).toBeCloseTo(0.3, 10);
    expect(next.anchors[0].out!.y).toBeCloseTo(0.85, 10);
    expect(next.anchors[0].x).toBe(0);
    expect(next.anchors[0].y).toBe(0.9);
  });

  it('keo anchor keo theo ca hai handle cua no', () => {
    const next = movePathPoint(path, { anchor: 1, kind: 'anchor' }, { x: 0.1, y: 0.1 });
    expect(next.anchors[1].x).toBeCloseTo(0.6, 10);
    expect(next.anchors[1].y).toBeCloseTo(0.9, 10);
    expect(next.anchors[1].in!.x).toBeCloseTo(0.45, 10);
    expect(next.anchors[1].in!.y).toBeCloseTo(0.93, 10);
    expect(next.anchors[1].out!.x).toBeCloseTo(0.75, 10);
    expect(next.anchors[1].out!.y).toBeCloseTo(0.87, 10);
  });

  it('khong dung toi cac anchor khac', () => {
    const next = movePathPoint(path, { anchor: 1, kind: 'anchor' }, { x: 0.1, y: 0.1 });
    expect(next.anchors[0]).toEqual(path.anchors[0]);
    expect(next.anchors[2]).toEqual(path.anchors[2]);
  });

  it('khong sua path goc', () => {
    const before = JSON.stringify(path);
    movePathPoint(path, { anchor: 0, kind: 'anchor' }, { x: 1, y: 1 });
    expect(JSON.stringify(path)).toBe(before);
  });
});
```

Nếu con số `0.30000000000000004` ở test đầu gây khó chịu vì sai số dấu phẩy động, đổi sang `toBeCloseTo` cho cả x và y.

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/ui/__tests__/warpHandles.test.ts
```

Kỳ vọng: FAIL, không resolve được `../WarpHandlesOverlay`.

- [ ] **Step 3: Viết `src/ui/WarpHandlesOverlay.tsx`**

```tsx
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEditorStoreApi } from './EditorContext';
import type { Viewport } from '../render/viewport';
import { rotateVector } from '../render/interactions/resizeMath';
import { getLoadedFont } from '../text/fontService';
import { resolveWarpPath, textGeometry } from '../text/textGeometry';
import type { Node, TextNode, WarpAnchor, WarpPath } from '../schema';

export type HandleRef = { anchor: number; kind: 'anchor' | 'in' | 'out' };

export function listHandles(path: WarpPath): HandleRef[] {
  const refs: HandleRef[] = [];
  path.anchors.forEach((anchor, index) => {
    refs.push({ anchor: index, kind: 'anchor' });
    if (anchor.in) refs.push({ anchor: index, kind: 'in' });
    if (anchor.out) refs.push({ anchor: index, kind: 'out' });
  });
  return refs;
}

function shift(point: { x: number; y: number }, delta: { x: number; y: number }) {
  return { x: point.x + delta.x, y: point.y + delta.y };
}

// Kéo anchor thì hai handle của nó đi theo — nếu không, đoạn cong quanh anchor
// sẽ giật hình dạng ngay khi anchor nhích một chút (tài liệu §8).
export function movePathPoint(path: WarpPath, ref: HandleRef, delta: { x: number; y: number }): WarpPath {
  const anchors = path.anchors.map((anchor, index): WarpAnchor => {
    if (index !== ref.anchor) return anchor;
    if (ref.kind === 'anchor') {
      return {
        ...shift(anchor, delta),
        in: anchor.in ? shift(anchor.in, delta) : undefined,
        out: anchor.out ? shift(anchor.out, delta) : undefined,
      };
    }
    // Viết tách hai nhánh thay vì dùng computed key `[ref.kind]`: TypeScript
    // nới lỏng kiểu khi key là union, làm mất tính đúng đắn của WarpAnchor.
    if (ref.kind === 'in') return anchor.in ? { ...anchor, in: shift(anchor.in, delta) } : anchor;
    return anchor.out ? { ...anchor, out: shift(anchor.out, delta) } : anchor;
  });
  return { ...path, anchors };
}

// Path và point vẽ bằng DOM overlay ở toạ độ màn hình, không vẽ vào Pixi —
// cùng cách SelectionOverlay.tsx đang làm với handle resize/crop, nên dùng
// lại được toàn bộ toWorld/toScreen và beginGesture/endGesture.
export function WarpHandlesOverlay({
  node,
  activePageId,
  viewport,
}: {
  node: TextNode;
  activePageId: string;
  viewport: Viewport;
}) {
  const store = useEditorStoreApi();
  const font = getLoadedFont(node.font.family)?.font;
  if (!font) return null;

  const geometry = textGeometry(node, font);
  if (geometry.height <= 0) return null;
  const path = resolveWarpPath(node, geometry.baselineY / geometry.height);
  if (!path) return null;

  const box = { width: geometry.width, height: geometry.height };
  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;

  // Point của path nằm trong local space chưa xoay/chưa scale của node; đưa
  // về world rồi về screen theo đúng phép biến đổi worldPoint() trong
  // SelectionOverlay.tsx dùng cho handle resize.
  const toScreen = (point: { x: number; y: number }) => {
    const local = { x: point.x * box.width, y: point.y * box.height };
    const pivot = { x: originX * node.size.width, y: originY * node.size.height };
    const offset = rotateVector(
      { x: (local.x - pivot.x) * node.transform.scaleX, y: (local.y - pivot.y) * node.transform.scaleY },
      node.transform.rotation,
    );
    return viewport.toScreen({ x: node.transform.x + offset.x, y: node.transform.y + offset.y });
  };

  const startDrag = (ref: HandleRef) => (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    // Chốt path tại thời điểm bắt đầu kéo: nếu đang ở chế độ preset thì
    // chính lần kéo này là lúc path được ghi cứng vào warp.paths (spec §4.2).
    const startPath = path;
    store.getState().beginGesture(`warp-handle:${node.id}`);

    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      const local = rotateVector(worldDelta, -node.transform.rotation);
      const delta = {
        x: local.x / (node.transform.scaleX || 1) / box.width,
        y: local.y / (node.transform.scaleY || 1) / box.height,
      };
      const nextPath = movePathPoint(startPath, ref, delta);
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: {
          warp: {
            type: node.warp?.type ?? 'wave',
            intensity: node.warp?.intensity ?? 0.5,
            paths: [nextPath],
          },
        } as Partial<Node>,
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      store.getState().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const polyline = path.anchors
    .flatMap((anchor, index) => {
      const next = path.anchors[index + 1];
      if (!next) return [];
      const p0 = toScreen(anchor);
      const p1 = toScreen(anchor.out ?? anchor);
      const p2 = toScreen(next.in ?? next);
      const p3 = toScreen(next);
      return [`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`];
    })
    .join(' ');

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <path d={polyline} fill="none" stroke="#2563eb" strokeWidth={1.5} />
        {path.anchors.map((anchor, index) => {
          const a = toScreen(anchor);
          return (
            <g key={index}>
              {anchor.in && (
                <line x1={a.x} y1={a.y} x2={toScreen(anchor.in).x} y2={toScreen(anchor.in).y} stroke="#2563eb" strokeWidth={1} />
              )}
              {anchor.out && (
                <line x1={a.x} y1={a.y} x2={toScreen(anchor.out).x} y2={toScreen(anchor.out).y} stroke="#2563eb" strokeWidth={1} />
              )}
            </g>
          );
        })}
      </svg>
      {listHandles(path).map((ref) => {
        const anchor = path.anchors[ref.anchor];
        const point = ref.kind === 'anchor' ? anchor : ref.kind === 'in' ? anchor.in! : anchor.out!;
        const screen = toScreen(point);
        return (
          <div
            key={`${ref.anchor}-${ref.kind}`}
            onPointerDown={startDrag(ref)}
            className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-blue-600 bg-white ${
              ref.kind === 'anchor' ? 'h-3 w-3' : 'h-2.5 w-2.5'
            }`}
            style={{ left: screen.x, top: screen.y }}
          />
        );
      })}
    </>
  );
}
```

- [ ] **Step 4: Gắn vào `src/ui/SelectionOverlay.tsx`**

Thêm import:

```tsx
import { WarpHandlesOverlay } from './WarpHandlesOverlay';
```

Thêm ngay trước `{extras}` trong `SingleSelectionOverlay`, sau khối `TextEditOverlay`:

```tsx
      {!isEditingText && node.type === 'text' && node.warp && node.warp.type !== 'none' && (
        <WarpHandlesOverlay node={node} activePageId={activePageId} viewport={viewport} />
      )}
```

- [ ] **Step 5: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/ui/__tests__/warpHandles.test.ts
pnpm lint
```

Kỳ vọng: 5 test PASS.

- [ ] **Step 6: Kiểm chứng bằng mắt — đây là DoD chính của tài liệu Wave**

Chọn node text đã bật Wave:

1. Đếm được **đúng 7 point** trên canvas: 3 point to (anchor) + 4 point nhỏ (handle).
2. Đường path màu xanh chạy qua cả 3 anchor, và mỗi handle nối với anchor của nó bằng một đoạn thẳng mảnh.
3. Hình dạng path khớp mô tả tài liệu: bắt đầu thấp bên trái gần như nằm ngang, cong lên qua anchor giữa, tạo cung lớn vồng lên ở khoảng giữa-phải rồi hạ xuống anchor cuối.
4. Kéo **từng handle một** (cả 4) → đoạn cong tương ứng đổi hình, chữ đổi theo.
5. Kéo **từng anchor một** (cả 3) → anchor và hai handle của nó cùng dịch, chữ đổi theo.
6. Sau khi kéo handle, kéo slider "Wave Curve" → path quay về preset (chỉnh sửa handle bị bỏ, đúng thiết kế đã chốt).
7. Undo một lần sau một lần kéo handle → về đúng path trước đó.
8. Xoay node rồi kéo handle → handle vẫn bám đúng chữ (kiểm phép un-rotate).

- [ ] **Step 7: Commit**

```bash
git add src/ui
git commit -m "feat(text): handle wave keo duoc tren canvas"
```

---

## Task 12: Export SVG cho text

**Files:**
- Modify: `src/services/svgSerializer.ts`
- Test: `src/services/__tests__/svgSerializerText.test.ts`

**Interfaces:**
- Consumes: `textGeometry` (Task 6), `getLoadedFont` (Task 1), `GlyphShape` (Task 2).
- Produces: `serializeNode` xử lý thêm `node.type === 'text'` (chữ ký không đổi)

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/__tests__/svgSerializerText.test.ts`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadFont, registerFont, resetFontsForTest } from '../../text/fontService';
import { serializeNode } from '../svgSerializer';
import type { Document, TextNode } from '../../schema';

const doc: Document = {
  version: 1,
  id: 'doc-1',
  meta: { title: 'test', createdAt: 0, updatedAt: 0 },
  pages: [],
  assets: {},
};

const node: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 300, height: 120 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'o',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#ff0000' },
};

beforeAll(async () => {
  resetFontsForTest();
  const path = fileURLToPath(new URL('../../text/fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  registerFont('Poppins', buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
  await loadFont('Poppins');
});

describe('serializeNode cho text', () => {
  it('xuat ra <path> vector chu khong phai <image>', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg).toContain('<path');
    expect(svg).not.toContain('<image');
  });

  it('mang mau fill va fill-rule evenodd cho lo', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill-rule="evenodd"');
  });

  it('chu "o" xuat ra 2 subpath: outer + lo', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg.match(/M /g)?.length).toBe(2);
  });

  it('warp lam doi path data', () => {
    const plain = serializeNode(node, doc, []);
    const waved = serializeNode({ ...node, warp: { type: 'wave', intensity: 0.8 } }, doc, []);
    expect(waved).not.toBe(plain);
    expect(waved).toContain('<path');
  });

  it('font chua nap thi bo qua node, khong throw', () => {
    const svg = serializeNode({ ...node, font: { ...node.font, family: 'KhongCo' } }, doc, []);
    expect(svg).toBe('');
  });

  it('node an thi khong xuat gi', () => {
    expect(serializeNode({ ...node, visible: false }, doc, [])).toBe('');
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

```bash
pnpm vitest run src/services/__tests__/svgSerializerText.test.ts
```

Kỳ vọng: FAIL — text node hiện rơi vào nhánh cuối và được xử lý như `ShapeNode`.

- [ ] **Step 3: Sửa `src/services/svgSerializer.ts`**

Thêm import ở đầu file:

```ts
import type { Document, Fill, GroupNode, Node, ShapeNode, TextNode } from '../schema';
import { getLoadedFont } from '../text/fontService';
import { textGeometry } from '../text/textGeometry';
import type { GlyphShape } from '../text/glyphOutlines';
```

Thêm hai hàm trước `serializeNode`:

```ts
function contourToPathData(contour: number[]): string {
  const parts: string[] = [`M ${contour[0]} ${contour[1]}`];
  for (let i = 2; i < contour.length; i += 2) parts.push(`L ${contour[i]} ${contour[i + 1]}`);
  parts.push('Z');
  return parts.join(' ');
}

// Text xuất ra vector thật (khác 'svg' node vốn phải rasterize) vì contour đã
// có sẵn từ textGeometry — không cần nhúng font, không cần <text>. Lỗ đi kèm
// outer trong cùng một `d` và để SVG tự cắt bằng fill-rule="evenodd".
function textElement(node: TextNode, defs: string[]): string {
  const loaded = getLoadedFont(node.font.family);
  // Font chưa nạp thì bỏ qua node, cùng quy ước "thiếu dữ liệu thì im lặng"
  // mà nhánh 'svg' phía dưới dùng khi thiếu bản rasterize.
  if (!loaded) return '';
  const shapes: GlyphShape[] = textGeometry(node, loaded.font).shapes;
  if (shapes.length === 0) return '';
  const data = shapes
    .map((shape) => [shape.outer, ...shape.holes].map(contourToPathData).join(' '))
    .join(' ');
  return `<path d="${data}" fill-rule="evenodd" ${fillAttr(node.fill, defs)}/>`;
}
```

Thêm nhánh trong `serializeNode`, ngay trước nhánh `group`:

```ts
  if (node.type === 'text') {
    const element = textElement(node, defs);
    return element ? `<g${groupAttrs(node)}>${element}</g>` : '';
  }
```

- [ ] **Step 4: Chạy test cho tới khi pass**

```bash
pnpm vitest run src/services/__tests__/svgSerializerText.test.ts
pnpm test
pnpm lint
```

Kỳ vọng: 6 test mới PASS, toàn bộ test cũ vẫn PASS, lint sạch.

- [ ] **Step 5: Kiểm chứng đầu-cuối**

Trên dev server, sample "Text + wave":

1. Bấm **Export SVG** → mở file tải về bằng trình duyệt: cả chữ thẳng lẫn chữ cong hiện đúng, ruột chữ `o` rỗng.
2. Mở file bằng text editor: có `<path d="M ...`, không có `<image>` cho node text.
3. Bấm **Export PNG** → ảnh khớp với canvas.
4. Reload trang → sample render lại y hệt.

- [ ] **Step 6: Commit**

```bash
git add src/services
git commit -m "feat(text): export SVG vector cho text node"
```

---

## Kiểm tra cuối

- [ ] `pnpm test` — toàn bộ xanh
- [ ] `pnpm lint` — sạch
- [ ] Đối chiếu lại 10 mục "Định nghĩa hoàn thành" trong spec §11
- [ ] Nếu có chỗ nào lệch khỏi spec khi làm thật, sửa spec cho khớp rồi commit kèm
