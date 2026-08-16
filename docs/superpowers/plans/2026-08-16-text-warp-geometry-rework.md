# Text Warp Geometry Rework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay biến dạng per-point (envelope) bằng text-on-path rigid per-glyph, đúng ngữ nghĩa SVG `<textPath>`, giữ nguyên hình học glyph.

**Architecture:** Mỗi `GlyphShape` mang theo neo của chính nó (`anchorX`, `baselineY`). `placeOnPath` tra path một lần cho cả glyph rồi áp một phép biến đổi trực chuẩn. Path preset được co ngang để arc length khớp bề rộng chữ, thay vì kéo giãn chữ cho vừa path. Contour chuyển từ polyline sang polybezier, xoá toàn bộ code flatten.

**Tech Stack:** TypeScript, opentype.js 2.0, PixiJS v8, React, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-16-text-warp-geometry-rework-design.md`

## Global Constraints

- `measureText` và `node.size` **không đổi** — vẫn là hộp layout chưa warp. `node.size` là pivot của `applyTransform`, đổi nó làm node đã xoay nhảy vị trí.
- `src/text/glyphOutlines.ts` là **file duy nhất** đọc glyph outline từ opentype.js. `fontService.ts` chỉ parse font file.
- Pixi v8 **không** áp winding non-zero cho nhiều path trong một `fill()`. Phải `fill()` từng outer rồi `cut()` lỗ của chính nó.
- SVG export dùng `fill-rule="nonzero"`, không phải `evenodd`.
- Quy tắc "paths đã lưu thắng preset" giữ nguyên.
- `Contour` sau Task 5: `[x0,y0, c1x,c1y,c2x,c2y,x1,y1, ...]`, độ dài `2 + 6n`, luôn kín (điểm on-curve cuối trùng điểm đầu).
- Tên test viết tiếng Việt không dấu, khớp phong cách file test hiện có.
- Chạy `pnpm test` sau mỗi task; toàn bộ suite phải xanh trước khi commit.
- Chỉ chạy `pnpm prettier --write` trên **đúng các file vừa sửa**, không chạy script format toàn repo.

## File Structure

| File | Trách nhiệm | Task |
|---|---|---|
| `src/text/bezier.ts` (mới) | Đánh giá cubic và 3 đạo hàm — dùng chung bởi sampler, signedArea, bbox | 2 |
| `src/text/glyphOutlines.ts` | Đọc outline; neo glyph; polybezier; signedArea chính xác | 1, 5 |
| `src/text/layout.ts` | Đặt glyph vào hộp; neo tuyệt đối theo dòng | 1 |
| `src/text/warp.ts` | Sampler arc-length, bake scale, giải k, đặt glyph lên path | 2, 3, 4 |
| `src/text/textGeometry.ts` | Ghép pipeline; nguồn duy nhất của path đang dùng; bbox | 4, 6 |
| `src/render/renderers/textRenderer.ts` | Vẽ bezier lên Pixi | 5 |
| `src/services/svgSerializer.ts` | Phát `M/C/Z` | 5 |
| `src/ui/SelectionOverlay.tsx` | Khung chọn theo bbox thật | 6 |
| `src/ui/WarpHandlesOverlay.tsx` | Handle trên path đã bake | 7 |

---

### Task 1: Neo per-glyph trên GlyphShape

Mỗi shape phải biết trung điểm advance của glyph nó thuộc về, và baseline của **dòng** nó thuộc về. Đây là dữ liệu mà Task 4 cần để xoay từng glyph như một khối cứng và để xếp đúng dòng thứ 2 trở đi.

**Files:**
- Modify: `src/text/glyphOutlines.ts`
- Modify: `src/text/layout.ts`
- Test: `src/text/__tests__/glyphOutlines.test.ts`, `src/text/__tests__/layout.test.ts`

**Interfaces:**
- Produces: `GlyphShape` có thêm hai trường bắt buộc `anchorX: number`, `baselineY: number`.

- [ ] **Step 1: Viết test thất bại cho glyphOutlines**

Thêm vào `src/text/__tests__/glyphOutlines.test.ts`:

```ts
describe('neo glyph', () => {
  it('anchorX la trung diem advance, baselineY = 0 trong toa do glyph-local', () => {
    const [glyph] = getGlyphOutlines('H', poppins, 100);
    expect(glyph.shapes.length).toBeGreaterThan(0);
    for (const shape of glyph.shapes) {
      expect(shape.anchorX).toBeCloseTo(glyph.advance / 2, 9);
      expect(shape.baselineY).toBe(0);
    }
  });

  it('anchorX dung advance TU NHIEN, khong cong kerning', () => {
    // 'AV' co kerning am trong Poppins: advance cua 'A' bi tru bot, nhung
    // ban than muc chu 'A' khong hep lai — anchorX phai bam advance goc.
    const pair = getGlyphOutlines('AV', poppins, 100);
    const solo = getGlyphOutlines('A', poppins, 100);
    expect(pair[0].advance).not.toBeCloseTo(solo[0].advance, 6);
    expect(pair[0].shapes[0].anchorX).toBeCloseTo(solo[0].shapes[0].anchorX, 9);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/glyphOutlines.test.ts`
Expected: FAIL — `anchorX` là `undefined`.

- [ ] **Step 3: Thêm trường vào GlyphShape**

Trong `src/text/glyphOutlines.ts`, sửa interface:

```ts
export interface GlyphShape {
  outer: Contour;
  holes: Contour[];
  // Trung điểm advance của glyph. Đây là điểm mà glyph được neo lên path
  // (ngữ nghĩa SVG <textPath>), nên nó phải bám advance *tự nhiên* — kerning
  // dịch glyph kế tiếp, không làm mực chữ này hẹp lại.
  anchorX: number;
  // Baseline của dòng chứa glyph. Cần cho warp nhiều dòng: mỗi dòng chạy
  // trên một offset curve riêng của path.
  baselineY: number;
}
```

- [ ] **Step 4: Truyền anchorX qua groupIntoShapes**

Đổi chữ ký và chỗ tạo shape:

```ts
function groupIntoShapes(contours: Contour[], anchorX: number): GlyphShape[] {
```

```ts
    if (Math.sign(areas[i]) === outerSign)
      shapes.push({ outer: contour, holes: [], anchorX, baselineY: 0 });
```

- [ ] **Step 5: Gán anchorX trước vòng lặp kerning**

Trong `getGlyphOutlines`, thay khối `outlines`:

```ts
  const outlines = glyphs.map((glyph) => {
    const advance = (glyph.advanceWidth ?? 0) * scale;
    return {
      advance,
      shapes: groupIntoShapes(
        commandsToContours(glyph.getPath(0, 0, fontSize).commands),
        advance / 2,
      ),
    };
  });
```

Vòng lặp kerning ngay dưới giữ nguyên — nó cộng vào `outlines[i].advance` **sau** khi `anchorX` đã chốt, đúng ý Step 3.

- [ ] **Step 6: Chạy test glyphOutlines**

Run: `pnpm vitest run src/text/__tests__/glyphOutlines.test.ts`
Expected: PASS

- [ ] **Step 7: Viết test thất bại cho layout**

Thêm vào `src/text/__tests__/layout.test.ts`:

```ts
describe('neo tuyet doi', () => {
  it('anchorX cong don theo pen, baselineY theo dong', () => {
    const result = layout('Hi\nHi');
    const ascent = (poppins.ascender * 100) / poppins.unitsPerEm;
    const lineStep = 100 * 1.2;

    const line1 = result.shapes.filter((s) => s.baselineY === ascent);
    const line2 = result.shapes.filter((s) => s.baselineY === ascent + lineStep);
    expect(line1.length).toBeGreaterThan(0);
    expect(line2.length).toBe(line1.length);

    // Cung noi dung => anchorX hai dong trung nhau
    expect(line2.map((s) => s.anchorX)).toEqual(line1.map((s) => s.anchorX));
  });

  it('anchorX cua glyph dau bang nua advance cua chinh no', () => {
    const [first] = getGlyphOutlines('Hi', poppins, 100);
    expect(layout('Hi').shapes[0].anchorX).toBeCloseTo(first.advance / 2, 9);
  });
});
```

- [ ] **Step 8: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/layout.test.ts`
Expected: FAIL — `baselineY` là `undefined`.

- [ ] **Step 9: Gắn neo tuyệt đối trong layout**

Trong `src/text/layout.ts`, thay khối đẩy shape:

```ts
    for (const glyph of line.glyphs) {
      for (const shape of glyph.shapes) {
        shapes.push({
          outer: translateContour(shape.outer, penX, baseline),
          holes: shape.holes.map((hole) => translateContour(hole, penX, baseline)),
          anchorX: shape.anchorX + penX,
          baselineY: baseline,
        });
      }
      penX += glyph.advance + letterSpacing;
    }
```

- [ ] **Step 10: Chạy toàn bộ test**

Run: `pnpm test`
Expected: PASS (toàn suite — Task này chỉ thêm dữ liệu, không đổi hành vi)

- [ ] **Step 11: Commit**

```bash
git add src/text/glyphOutlines.ts src/text/layout.ts src/text/__tests__/glyphOutlines.test.ts src/text/__tests__/layout.test.ts
git commit -m "feat(text): GlyphShape mang neo anchorX/baselineY cua chinh no"
```

---

### Task 2: Sampler chính xác — tangent giải tích, lấy mẫu thích ứng

Sửa L4 (tangent suy biến làm glyph co về một điểm — vô hại với per-point, chí mạng với rigid) và L5 (tangent lấy từ dây cung). Chữ ký công khai không đổi, nên toàn bộ test hiện có phải tiếp tục xanh.

**Files:**
- Create: `src/text/bezier.ts`
- Modify: `src/text/warp.ts`
- Test: `src/text/__tests__/warp.test.ts`

**Interfaces:**
- Produces: `src/text/bezier.ts` xuất `evalCubic`, `evalD1`, `evalD2`, `evalD3` — Task 5 (signedArea) và Task 6 (bbox) đều dùng lại.
- `buildPathSampler(path, size)` giữ nguyên chữ ký; `PathSampler` giữ nguyên hình dạng.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/text/__tests__/warp.test.ts`:

```ts
// Tich phan do dai cung bang cach chia rat min — ban cai dat doc lap de doi
// chieu, khong dung lai code cua sampler.
function referenceLength(p: number[][], steps = 40000): number {
  const at = (t: number, i: number) => {
    const u = 1 - t;
    return u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i];
  };
  let total = 0;
  for (let k = 1; k <= steps; k++) {
    const t0 = (k - 1) / steps;
    const t1 = k / steps;
    total += Math.hypot(at(t1, 0) - at(t0, 0), at(t1, 1) - at(t0, 1));
  }
  return total;
}

describe('sampler chinh xac', () => {
  it('tangent khong suy bien khi anchor thieu handle', () => {
    // anchor dau khong co `out` => c1 = p0 => B'(0) = 0. Cong thuc cu tra
    // vector khong, lam glyph co ve mot diem khi ap phep bien doi cung.
    const noHandle: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5, in: { x: 0.5, y: 0.5 } }],
    };
    const { tangent } = buildPathSampler(noHandle, SIZE).at(0);
    expect(Math.hypot(tangent.x, tangent.y)).toBeCloseTo(1, 9);
    expect(tangent.x).toBeCloseTo(1, 6);
    expect(tangent.y).toBeCloseTo(0, 6);
  });

  it('do dai khop voi tich phan doc lap tren path cong manh', () => {
    const curved: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.9, out: { x: 0.1, y: 0.0 } },
        { x: 1, y: 0.9, in: { x: 0.9, y: 0.0 } },
      ],
    };
    const expected = referenceLength([
      [0, 90],
      [40, 0],
      [360, 0],
      [400, 90],
    ]);
    expect(buildPathSampler(curved, SIZE).length).toBeCloseTo(expected, 1);
  });

  it('tangent la vector don vi tai moi vi tri tren path cong', () => {
    const sampler = buildPathSampler(buildWavePath(1, 0.8), SIZE);
    for (let i = 0; i <= 10; i++) {
      const { tangent } = sampler.at((sampler.length * i) / 10);
      expect(Math.hypot(tangent.x, tangent.y)).toBeCloseTo(1, 9);
    }
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/warp.test.ts`
Expected: FAIL — test đầu tiên nhận `tangent = (0, 0)`, độ dài lệch quá `toBeCloseTo(_, 1)`.

- [ ] **Step 3: Tạo module bezier dùng chung**

Create `src/text/bezier.ts`:

```ts
// Đánh giá cubic Bezier và các đạo hàm của nó, trên MỘT trục (gọi hai lần
// cho x và y). Tách ra vì ba nơi cần: sampler arc-length (warp.ts), diện
// tích có dấu (glyphOutlines.ts), và bbox chính xác (textGeometry.ts).

export function evalCubic(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

export function evalD1(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return 3 * (u * u * (b - a) + 2 * u * t * (c - b) + t * t * (d - c));
}

export function evalD2(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return 6 * (u * (c - 2 * b + a) + t * (d - 2 * c + b));
}

// Đạo hàm bậc 3 của cubic là hằng số.
export function evalD3(a: number, b: number, c: number, d: number): number {
  return 6 * (d - 3 * c + 3 * b - a);
}
```

- [ ] **Step 4: Thay ruột buildPathSampler**

Trong `src/text/warp.ts`, thay `cubicPoint` và toàn bộ thân `buildPathSampler` bằng:

```ts
import { evalCubic, evalD1, evalD2, evalD3 } from './bezier';

const FLATNESS_TOL = 0.01; // px
const MIN_STEPS = 8;
const MAX_STEPS = 256;
const EPSILON = 1e-6;

interface Segment {
  p0: Point;
  c1: Point;
  c2: Point;
  p3: Point;
}

function segmentsOf(path: WarpPath, size: Size): Segment[] {
  const toPx = (p: { x: number; y: number }): Point => ({
    x: p.x * size.width,
    y: p.y * size.height,
  });
  const segments: Segment[] = [];
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const p0 = toPx(from);
    const p3 = toPx(to);
    segments.push({ p0, c1: from.out ? toPx(from.out) : p0, c2: to.in ? toPx(to.in) : p3, p3 });
  }
  return segments;
}

// Cận sai số chuẩn của xấp xỉ cubic bằng n đoạn thẳng: sai số ≤ (3/4)·M/n²
// với M là hiệu bậc hai lớn nhất của đa giác điều khiển. Thay cho 32 mẫu
// cố định — cung càng gắt càng nhiều mẫu, cung thoải thì ít.
function stepsFor(s: Segment): number {
  const m = Math.max(
    Math.hypot(s.p0.x - 2 * s.c1.x + s.c2.x, s.p0.y - 2 * s.c1.y + s.c2.y),
    Math.hypot(s.c1.x - 2 * s.c2.x + s.p3.x, s.c1.y - 2 * s.c2.y + s.p3.y),
  );
  const n = Math.ceil(Math.sqrt((0.75 * m) / FLATNESS_TOL));
  return Math.min(MAX_STEPS, Math.max(MIN_STEPS, Number.isFinite(n) ? n : MIN_STEPS));
}

function pointAt(s: Segment, t: number): Point {
  return {
    x: evalCubic(s.p0.x, s.c1.x, s.c2.x, s.p3.x, t),
    y: evalCubic(s.p0.y, s.c1.y, s.c2.y, s.p3.y, t),
  };
}

// B'(t) = 0 ở cusp và ở anchor thiếu handle (c1 = p0). Theo quy tắc
// L'Hôpital, hướng tiếp tuyến khi đó là hướng của đạo hàm bậc cao kế tiếp.
// Trả null chỉ khi cả segment suy biến thành một điểm.
function tangentAt(s: Segment, t: number): Point | null {
  const candidates: Point[] = [
    {
      x: evalD1(s.p0.x, s.c1.x, s.c2.x, s.p3.x, t),
      y: evalD1(s.p0.y, s.c1.y, s.c2.y, s.p3.y, t),
    },
    {
      x: evalD2(s.p0.x, s.c1.x, s.c2.x, s.p3.x, t),
      y: evalD2(s.p0.y, s.c1.y, s.c2.y, s.p3.y, t),
    },
    {
      x: evalD3(s.p0.x, s.c1.x, s.c2.x, s.p3.x),
      y: evalD3(s.p0.y, s.c1.y, s.c2.y, s.p3.y),
    },
  ];
  for (const v of candidates) {
    const n = Math.hypot(v.x, v.y);
    if (n > EPSILON) return { x: v.x / n, y: v.y / n };
  }
  return null;
}

// Chỉ tổng chiều dài, không dựng bảng — solveHorizontalScale gọi hàm này
// vài chục lần cho mỗi lần layout nên không muốn cấp phát bảng mỗi vòng.
export function arcLength(path: WarpPath, size: Size): number {
  let total = 0;
  let prev: Point | null = null;
  for (const s of segmentsOf(path, size)) {
    const n = stepsFor(s);
    for (let k = 0; k <= n; k++) {
      const p = pointAt(s, k / n);
      if (prev) total += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
  }
  return total;
}

export function buildPathSampler(path: WarpPath, size: Size): PathSampler {
  const segments = segmentsOf(path, size);
  const entries: { seg: number; t: number; s: number }[] = [];
  let acc = 0;
  let prev: Point | null = null;

  segments.forEach((segment, si) => {
    const n = stepsFor(segment);
    for (let k = 0; k <= n; k++) {
      // Mẫu đầu của mọi đoạn trừ đoạn đầu tiên trùng mẫu cuối của đoạn
      // trước — giữ lại sẽ tạo một bước dài 0 trong bảng arc-length.
      if (si > 0 && k === 0) continue;
      const t = k / n;
      const p = pointAt(segment, t);
      if (prev) acc += Math.hypot(p.x - prev.x, p.y - prev.y);
      entries.push({ seg: si, t, s: acc });
      prev = p;
    }
  });

  const length = acc;
  // Dùng khi một segment suy biến hẳn thành điểm: mượn hướng của chỗ khác
  // trên path thay vì trả vector không.
  let fallback: Point = { x: 1, y: 0 };
  for (const entry of entries) {
    const t = tangentAt(segments[entry.seg], entry.t);
    if (t) {
      fallback = t;
      break;
    }
  }

  return {
    length,
    at(distance: number) {
      if (entries.length === 0) return { point: { x: 0, y: 0 }, tangent: fallback };
      if (entries.length < 2 || length < EPSILON) {
        const first = entries[0];
        return {
          point: pointAt(segments[first.seg], first.t),
          tangent: tangentAt(segments[first.seg], first.t) ?? fallback,
        };
      }
      const clamped = Math.min(Math.max(distance, 0), length);

      let low = 0;
      let high = entries.length - 1;
      while (high - low > 1) {
        const mid = (low + high) >> 1;
        if (entries[mid].s <= clamped) low = mid;
        else high = mid;
      }

      const span = entries[high].s - entries[low].s;
      const f = span < EPSILON ? 0 : (clamped - entries[low].s) / span;
      // Khoảng bắc cầu giữa hai segment: mẫu `low` là t=1 của segment trước,
      // trùng điểm với t=0 của segment sau — nội suy trong segment sau.
      const sameSegment = entries[low].seg === entries[high].seg;
      const seg = sameSegment ? entries[low].seg : entries[high].seg;
      const t = sameSegment
        ? entries[low].t + (entries[high].t - entries[low].t) * f
        : entries[high].t * f;

      return {
        point: pointAt(segments[seg], t),
        tangent: tangentAt(segments[seg], t) ?? fallback,
      };
    },
  };
}
```

Xoá hàm `cubicPoint` cũ và hằng `SAMPLES_PER_SEGMENT`.

- [ ] **Step 5: Chạy test warp**

Run: `pnpm vitest run src/text/__tests__/warp.test.ts`
Expected: PASS — cả test mới lẫn test cũ (chữ ký không đổi).

- [ ] **Step 6: Chạy toàn bộ test**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/text/bezier.ts src/text/warp.ts src/text/__tests__/warp.test.ts
git commit -m "fix(text): tangent giai tich + lay mau thich ung cho PathSampler"
```

---

### Task 3: Bake hệ số co và giải k cho path preset

Sửa L2. Thay vì kéo giãn chữ cho vừa path, co path cho vừa chữ.

**Files:**
- Modify: `src/text/warp.ts`
- Test: `src/text/__tests__/warp.test.ts`

**Interfaces:**
- Produces: `bakeScale(path: WarpPath, k: number): WarpPath`, `solveHorizontalScale(path: WarpPath, size: Size, target: number): number`. Task 4 và Task 7 đều gọi.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/text/__tests__/warp.test.ts`:

```ts
import { arcLength, bakeScale, solveHorizontalScale } from '../warp';

describe('bakeScale', () => {
  it('co quanh tam ngang, giu nguyen y', () => {
    const baked = bakeScale(flatPath(0.5), 0.5);
    expect(baked.anchors[0].x).toBeCloseTo(0.25, 9);
    expect(baked.anchors[1].x).toBeCloseTo(0.75, 9);
    expect(baked.anchors[0].y).toBeCloseTo(0.5, 9);
    expect(baked.anchors[0].out?.x).toBeCloseTo(0.415, 9);
  });

  it('k = 1 la phep dong nhat', () => {
    expect(bakeScale(buildWavePath(1, 0.8), 1)).toEqual(buildWavePath(1, 0.8));
  });
});

describe('solveHorizontalScale', () => {
  it('path phang da vua chu => k = 1', () => {
    expect(solveHorizontalScale(flatPath(0.5), SIZE, SIZE.width)).toBe(1);
  });

  it('path cong => k < 1 va arc length khop be rong chu', () => {
    const path = buildWavePath(1, 0.8);
    const k = solveHorizontalScale(path, SIZE, SIZE.width);
    expect(k).toBeLessThan(1);
    expect(k).toBeGreaterThan(0.05);
    expect(arcLength(bakeScale(path, k), SIZE)).toBeCloseTo(SIZE.width, 1);
  });

  it('bien do qua lon so voi be rong => tra ve san MIN_SCALE', () => {
    // target rat nho: du co ngang het co, path van dai hon.
    const k = solveHorizontalScale(buildWavePath(1, 0.8), SIZE, 1);
    expect(k).toBeCloseTo(0.05, 9);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/warp.test.ts`
Expected: FAIL — `bakeScale`/`solveHorizontalScale` chưa tồn tại.

- [ ] **Step 3: Viết bakeScale**

Thêm vào `src/text/warp.ts`:

```ts
// Co toạ độ x của path quanh TÂM NGANG của hộp (không quanh gốc): nếu co
// quanh gốc, chữ sẽ trượt dần sang trái khi intensity tăng, trong khi
// node.size.width không đổi. k = 1 là phép đồng nhất.
export function bakeScale(path: WarpPath, k: number): WarpPath {
  const scale = (p: { x: number; y: number }) => ({ x: (p.x - 0.5) * k + 0.5, y: p.y });
  return {
    ...path,
    anchors: path.anchors.map((anchor) => ({
      ...scale(anchor),
      ...(anchor.in ? { in: scale(anchor.in) } : {}),
      ...(anchor.out ? { out: scale(anchor.out) } : {}),
    })),
  };
}
```

- [ ] **Step 4: Viết solveHorizontalScale**

```ts
const MIN_SCALE = 0.05;
const LENGTH_TOL = 0.01; // px

// Giải k sao cho arcLength(bakeScale(path, k)) ≈ target.
//
// Bisection hợp lệ vì L(k) = ∫√(k²x′² + y′²)dt tăng ngặt theo k > 0:
// dL/dk = ∫ k·x′²/√(k²x′² + y′²) dt ≥ 0, dương ở mọi nơi x′ ≠ 0.
//
// Path preset trải x ∈ [0, W] nên L(1) ≥ W = target ⇒ nghiệm nằm trong (0,1].
// Nhánh MIN_SCALE bắt trường hợp biên độ dọc lớn tới mức co hết cỡ vẫn dài
// hơn target — khi đó glyph tràn sẽ bị placeOnPath bỏ, đúng quy ước §2.3.
export function solveHorizontalScale(path: WarpPath, size: Size, target: number): number {
  if (target < EPSILON) return 1;
  if (arcLength(path, size) <= target) return 1;
  if (arcLength(bakeScale(path, MIN_SCALE), size) >= target) return MIN_SCALE;

  let low = MIN_SCALE;
  let high = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const length = arcLength(bakeScale(path, mid), size);
    if (Math.abs(length - target) < LENGTH_TOL) return mid;
    if (length > target) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}
```

- [ ] **Step 5: Chạy test warp**

Run: `pnpm vitest run src/text/__tests__/warp.test.ts`
Expected: PASS

- [ ] **Step 6: Chạy toàn bộ test**

Run: `pnpm test`
Expected: PASS (chưa ai gọi hai hàm mới)

- [ ] **Step 7: Commit**

```bash
git add src/text/warp.ts src/text/__tests__/warp.test.ts
git commit -m "feat(text): bakeScale + giai he so co ngang cho path preset"
```

---

### Task 4: placeOnPath — rigid per-glyph (sửa L1 và L3)

Đây là task đổi hành vi. Thay `warpShapes` per-point bằng phép biến đổi trực chuẩn một lần cho mỗi glyph, và cho mỗi dòng chạy trên offset curve riêng.

**Files:**
- Modify: `src/text/warp.ts` (xoá `warpContour`/`warpShapes`, thêm `placeOnPath`)
- Modify: `src/text/textGeometry.ts`
- Test: `src/text/__tests__/warp.test.ts`, `src/text/__tests__/textGeometry.test.ts`

**Interfaces:**
- Consumes: `GlyphShape.anchorX`/`baselineY` (Task 1), `PathSampler` (Task 2), `bakeScale`/`solveHorizontalScale` (Task 3).
- Produces:
  - `placeOnPath(shapes: GlyphShape[], sampler: PathSampler, pathBaselineY: number): GlyphShape[]`
  - `resolveWarpPath(node, baselineRatio): { path: WarpPath; fit: boolean } | null` (đổi kiểu trả về)
  - `resolveWarpGeometry(node: TextNode, layout: TextLayout): { path: WarpPath; sampler: PathSampler } | null` — **nguồn duy nhất** của "path thật sự đang dùng". Task 7 gọi để vẽ handle.

- [ ] **Step 1: Viết test thất bại cho placeOnPath**

Thay khối `describe('warpShapes', ...)` trong `src/text/__tests__/warp.test.ts` bằng:

```ts
import { placeOnPath } from '../warp';

function shape(points: number[], anchorX: number, baselineY: number): GlyphShape {
  return { outer: points, holes: [], anchorX, baselineY };
}

describe('placeOnPath', () => {
  it('path phang tai baseline la phep dong nhat', () => {
    const sampler = buildPathSampler(flatPath(0.5), SIZE);
    const input = [shape([10, 40, 30, 60], 20, 50)];
    const [out] = placeOnPath(input, sampler, 50);
    expect(out.outer[0]).toBeCloseTo(10, 6);
    expect(out.outer[1]).toBeCloseTo(40, 6);
    expect(out.outer[2]).toBeCloseTo(30, 6);
    expect(out.outer[3]).toBeCloseTo(60, 6);
  });

  it('bao toan khoang cach trong cung glyph tren path cong', () => {
    const sampler = buildPathSampler(buildWavePath(1, 0.5), SIZE);
    const input = [shape([10, 20, 30, 80], 20, 50)];
    const before = Math.hypot(10 - 30, 20 - 80);
    const [out] = placeOnPath(input, sampler, 50);
    const after = Math.hypot(out.outer[0] - out.outer[2], out.outer[1] - out.outer[3]);
    expect(after).toBeCloseTo(before, 6);
  });

  it('dong thu hai nam dung offset theo phap tuyen', () => {
    const sampler = buildPathSampler(buildWavePath(1, 0.5), SIZE);
    const lineStep = 120;
    const [a, b] = placeOnPath(
      [shape([20, 50], 20, 50), shape([20, 50 + lineStep], 20, 50 + lineStep)],
      sampler,
      50,
    );
    const { point, tangent } = sampler.at(20);
    expect(a.outer[0]).toBeCloseTo(point.x, 6);
    expect(a.outer[1]).toBeCloseTo(point.y, 6);
    expect(b.outer[0]).toBeCloseTo(point.x - tangent.y * lineStep, 6);
    expect(b.outer[1]).toBeCloseTo(point.y + tangent.x * lineStep, 6);
  });

  it('bo glyph co anchorX vuot qua cuoi path', () => {
    const sampler = buildPathSampler(flatPath(0.5), SIZE); // length = 400
    const out = placeOnPath([shape([0, 50], 100, 50), shape([0, 50], 500, 50)], sampler, 50);
    expect(out).toHaveLength(1);
    expect(out[0].anchorX).toBe(100);
  });

  it('giu nguyen khoang cach ARC-LENGTH giua hai glyph lien tiep', () => {
    // Neo dat theo advance that: s = anchorX. Khoang cach doc cung giua hai
    // neo phai bang hieu anchorX, khong bi keo gian theo do cong cua path.
    const sampler = buildPathSampler(buildWavePath(1, 0.5), SIZE);
    const [a, b] = placeOnPath([shape([120, 50], 120, 50), shape([200, 50], 200, 50)], sampler, 50);
    expect(a.outer[0]).toBeCloseTo(sampler.at(120).point.x, 6);
    expect(a.outer[1]).toBeCloseTo(sampler.at(120).point.y, 6);
    expect(b.outer[0]).toBeCloseTo(sampler.at(200).point.x, 6);
    expect(b.outer[1]).toBeCloseTo(sampler.at(200).point.y, 6);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/warp.test.ts`
Expected: FAIL — `placeOnPath` chưa tồn tại.

- [ ] **Step 3: Thay warpShapes bằng placeOnPath**

Trong `src/text/warp.ts`, xoá `warpContour` và `warpShapes`, thêm:

```ts
// Đặt từng glyph lên path như một khối cứng, theo ngữ nghĩa SVG <textPath>:
// điểm neo là trung điểm advance của glyph, glyph được xoay quanh điểm
// baseline của chính nó theo tiếp tuyến tại đó rồi tịnh tiến.
//
// Ma trận [T | N] trực chuẩn (‖T‖ = 1, N ⊥ T) nên phép biến đổi bảo toàn
// khoảng cách — hình glyph không thể méo. Đây là điểm khác căn bản với bản
// cũ, vốn tra tiếp tuyến riêng cho *từng điểm* outline.
//
// pathBaselineY là baseline dòng đầu (mốc quy chiếu của path). Dòng thứ i
// chạy trên offset curve cách path một khoảng (baselineY - pathBaselineY)
// theo pháp tuyến.
export function placeOnPath(
  shapes: GlyphShape[],
  sampler: PathSampler,
  pathBaselineY: number,
): GlyphShape[] {
  const placed: GlyphShape[] = [];
  for (const shape of shapes) {
    // Glyph vượt quá cuối path thì không vẽ (ngữ nghĩa SVG textPath). Với
    // path preset đã fit thì nhánh này không bao giờ chạy.
    if (shape.anchorX > sampler.length) continue;

    const { point, tangent } = sampler.at(shape.anchorX);
    const nx = -tangent.y;
    const ny = tangent.x;
    const offset = shape.baselineY - pathBaselineY;
    const ox = point.x + nx * offset;
    const oy = point.y + ny * offset;

    const place = (contour: Contour): Contour => {
      const out = new Array<number>(contour.length);
      for (let i = 0; i < contour.length; i += 2) {
        const dx = contour[i] - shape.anchorX;
        const dy = contour[i + 1] - shape.baselineY;
        out[i] = ox + tangent.x * dx + nx * dy;
        out[i + 1] = oy + tangent.y * dx + ny * dy;
      }
      return out;
    };

    placed.push({
      outer: place(shape.outer),
      holes: shape.holes.map(place),
      anchorX: shape.anchorX,
      baselineY: shape.baselineY,
    });
  }
  return placed;
}
```

- [ ] **Step 4: Chạy test warp**

Run: `pnpm vitest run src/text/__tests__/warp.test.ts`
Expected: PASS

- [ ] **Step 5: Viết test thất bại cho textGeometry**

Thêm vào `src/text/__tests__/textGeometry.test.ts` (và sửa mọi chỗ đang dùng `resolveWarpPath(...)` trực tiếp thành `resolveWarpPath(...)?.path`):

```ts
describe('text-on-path', () => {
  it('intensity = 0 cho hinh hoc trung khit layout, moi dong', () => {
    const node = textNode({ text: 'Hi\nHi', warp: { type: 'wave', intensity: 0 } });
    const geometry = textGeometry(node, poppins);
    const plain = textGeometry({ ...node, warp: undefined }, poppins);
    geometry.shapes.forEach((shape, i) => {
      shape.outer.forEach((value, j) => {
        expect(value).toBeCloseTo(plain.shapes[i].outer[j], 6);
      });
    });
  });

  it('wave bao toan hinh hoc tung glyph', () => {
    const node = textNode({ text: 'Headline', warp: { type: 'wave', intensity: 1 } });
    const warped = textGeometry(node, poppins);
    const plain = textGeometry({ ...node, warp: undefined }, poppins);
    expect(warped.shapes).toHaveLength(plain.shapes.length);
    warped.shapes.forEach((shape, i) => {
      const a = plain.shapes[i].outer;
      const b = shape.outer;
      for (let k = 2; k < a.length; k += 2) {
        expect(Math.hypot(b[k] - b[0], b[k + 1] - b[1])).toBeCloseTo(
          Math.hypot(a[k] - a[0], a[k + 1] - a[1]),
          4,
        );
      }
    });
  });

  it('node.size khong doi khi intensity doi', () => {
    const base = textNode({ text: 'Headline' });
    const flat = measureText({ ...base, warp: { type: 'wave', intensity: 0 } }, poppins);
    const curved = measureText({ ...base, warp: { type: 'wave', intensity: 1 } }, poppins);
    expect(curved).toEqual(flat);
  });

  it('resolveWarpPath danh dau preset la fit, path da luu la khong fit', () => {
    const preset = textNode({ warp: { type: 'wave', intensity: 1 } });
    expect(resolveWarpPath(preset, 0.8)?.fit).toBe(true);

    const stored = textNode({
      warp: { type: 'wave', intensity: 1, paths: [buildWavePath(0.5, 0.8)] },
    });
    expect(resolveWarpPath(stored, 0.8)?.fit).toBe(false);
  });
});
```

- [ ] **Step 6: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/textGeometry.test.ts`
Expected: FAIL — `resolveWarpPath` chưa trả `{ path, fit }`.

- [ ] **Step 7: Nối dây trong textGeometry**

Trong `src/text/textGeometry.ts`:

```ts
import type { TextLayout } from './layout';
import type { PathSampler } from './warp';
import { bakeScale, buildPathSampler, buildWavePath, placeOnPath, solveHorizontalScale } from './warp';

// paths đã lưu thắng preset. `fit` phân biệt hai chế độ đặt chữ: preset thì
// co path cho vừa chữ, path do user kéo tay thì giữ nguyên (text-on-path
// thật — chữ chạy hết path đến đâu thì thôi, phần thừa bị bỏ).
export function resolveWarpPath(
  node: TextNode,
  baselineRatio: number,
): { path: WarpPath; fit: boolean } | null {
  const warp = node.warp;
  if (!warp || warp.type === 'none') return null;

  const stored = warp.paths?.find((path) => path.role === 'baseline');
  if (stored) return stored.anchors.length >= 2 ? { path: stored, fit: false } : null;

  if (warp.type === 'wave') {
    return { path: buildWavePath(warp.intensity, baselineRatio), fit: true };
  }
  return null;
}

// Nguồn DUY NHẤT của "path thật sự đang dùng". WarpHandlesOverlay phải vẽ
// handle trên đúng path này — nếu nó tự ghép lại các bước thì handle và chữ
// sẽ lệch nhau ngay khi hệ số co khác 1.
export function resolveWarpGeometry(
  node: TextNode,
  layout: TextLayout,
): { path: WarpPath; sampler: PathSampler } | null {
  if (layout.height <= 0 || layout.width <= 0) return null;
  const resolved = resolveWarpPath(node, layout.baselineY / layout.height);
  if (!resolved) return null;

  const size = { width: layout.width, height: layout.height };
  const path = resolved.fit
    ? bakeScale(resolved.path, solveHorizontalScale(resolved.path, size, layout.width))
    : resolved.path;
  return { path, sampler: buildPathSampler(path, size) };
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

  const warped = resolveWarpGeometry(node, layout);
  if (!warped) return layout;
  return { ...layout, shapes: placeOnPath(layout.shapes, warped.sampler, layout.baselineY) };
}
```

- [ ] **Step 8: Chạy toàn bộ test**

Run: `pnpm test`
Expected: PASS. `warpHandles.test.ts` có thể fail vì `resolveWarpPath` đổi kiểu — sửa chỗ gọi thành `?.path`, chưa đụng logic bake (Task 7 làm).

- [ ] **Step 9: Kiểm bằng mắt**

Khởi động dev server **từ thư mục worktree này** với cổng chỉ định rõ (config mặc định của `preview_start` chạy từ repo gốc và sẽ phục vụ nội dung cũ):

```bash
pnpm dev --port 5199
```

Mở sample "Text + wave". Kiểm:
- Chữ không còn bị bẻ/xoè; hai chân chữ `H` song song.
- Kéo slider Wave Curve: khoảng cách giữa các chữ **không phình co**; hình chữ không đổi.
- Chữ chiếm ít bề ngang hơn khi intensity tăng — đây là hành vi đúng (spec §2.2), không phải lỗi.
- Text 2 dòng có wave: dòng 2 xếp song song dòng 1, không bị văng.

- [ ] **Step 10: Commit**

```bash
git add src/text/warp.ts src/text/textGeometry.ts src/text/__tests__/warp.test.ts src/text/__tests__/textGeometry.test.ts src/ui/__tests__/warpHandles.test.ts
git commit -m "fix(text): dat glyph len path nhu khoi cung thay vi warp tung diem"
```

---

### Task 5: Contour thành polybezier

Phép biến đổi ở Task 4 là affine, nên control point của bezier map thẳng — không cần lấy mẫu nữa. Xoá toàn bộ code flatten; Pixi và SVG nhận cung thật.

**Files:**
- Modify: `src/text/glyphOutlines.ts`
- Modify: `src/render/renderers/textRenderer.ts`
- Modify: `src/services/svgSerializer.ts`
- Test: `src/text/__tests__/glyphOutlines.test.ts`, `src/render/__tests__/textRenderer.test.ts`, `src/services/__tests__/svgSerializerText.test.ts`

**Interfaces:**
- Consumes: `evalCubic`, `evalD1` từ `src/text/bezier.ts` (Task 2).
- Produces: `Contour` = `[x0,y0, c1x,c1y,c2x,c2y,x1,y1, ...]`, độ dài `2 + 6n`, luôn kín.
- Produces: `TextDrawTarget` có `moveTo`/`bezierCurveTo`/`closePath`/`fill`/`cut`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/text/__tests__/glyphOutlines.test.ts`:

```ts
import { signedArea } from '../glyphOutlines';

// Đường tròn xấp xỉ bằng 4 cung cubic, hằng số kappa quen thuộc.
function circleContour(r: number): number[] {
  const k = 0.5522847498307936 * r;
  return [
    r, 0,
    r, k, k, r, 0, r,
    -k, r, -r, k, -r, 0,
    -r, -k, -k, -r, 0, -r,
    k, -r, r, -k, r, 0,
  ];
}

describe('contour polybezier', () => {
  it('do dai contour la 2 + 6n', () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    for (const shape of glyph.shapes) {
      expect((shape.outer.length - 2) % 6).toBe(0);
      for (const hole of shape.holes) expect((hole.length - 2) % 6).toBe(0);
    }
  });

  it('contour kin: diem on-curve cuoi trung diem dau', () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    const c = glyph.shapes[0].outer;
    expect(c[c.length - 2]).toBeCloseTo(c[0], 6);
    expect(c[c.length - 1]).toBeCloseTo(c[1], 6);
  });

  it('signedArea chinh xac tren cung, khong phai xap xi da giac', () => {
    // Hình xấp xỉ 4-cubic có diện tích lệch πr² khoảng 0.02% — sai số của
    // chính phép xấp xỉ, không phải của phép tính diện tích.
    expect(Math.abs(signedArea(circleContour(100)))).toBeCloseTo(Math.PI * 1e4, -1);
  });

  it('signedArea doi dau khi dao chieu contour', () => {
    const forward = circleContour(100);
    const reversed: number[] = [];
    for (let i = forward.length - 2; i >= 0; i -= 2) reversed.push(forward[i], forward[i + 1]);
    expect(Math.sign(signedArea(reversed))).toBe(-Math.sign(signedArea(forward)));
  });

  it("glyph 'o' co dung mot outer va mot hole", () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    expect(glyph.shapes).toHaveLength(1);
    expect(glyph.shapes[0].holes).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/glyphOutlines.test.ts`
Expected: FAIL — contour vẫn là polyline nên `(length - 2) % 6 !== 0`.

- [ ] **Step 3: Đổi commandsToContours sang polybezier**

Trong `src/text/glyphOutlines.ts`, thay comment đầu file về flatten, xoá `FLATTEN_STEP_PX`, `MIN_STEPS`, `MAX_STEPS`, `stepsFor`, `cubic`, `quadratic`, và thay `commandsToContours`:

```ts
// Toạ độ phẳng [x0,y0, c1x,c1y,c2x,c2y, x1,y1, ...] — một điểm on-curve mở
// đầu, rồi 3 điểm cho mỗi cung cubic. Độ dài luôn là 2 + 6n, contour luôn
// kín (điểm on-curve cuối trùng điểm đầu).
//
// MỌI cặp số là một điểm 2D, kể cả control point. Nhờ vậy placeOnPath (một
// phép affine) map đồng nhất cả mảng mà không cần biết cặp nào on-curve —
// đó là lý do không còn phải flatten bezier ở đây nữa.
export type Contour = number[];
```

```ts
function commandsToContours(commands: PathCommand[]): Contour[] {
  const contours: Contour[] = [];
  let current: Contour = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  const curve = (c1x: number, c1y: number, c2x: number, c2y: number, px: number, py: number) => {
    current.push(c1x, c1y, c2x, c2y, px, py);
    x = px;
    y = py;
  };
  // Đoạn thẳng biểu diễn chính xác bằng cubic với control point chia đều.
  const line = (px: number, py: number) =>
    curve(x + (px - x) / 3, y + (py - y) / 3, x + (2 * (px - x)) / 3, y + (2 * (py - y)) / 3, px, py);

  const finish = () => {
    // 2 + 6·1 = 8: cần ít nhất một cung mới thành contour.
    if (current.length >= 8) {
      if (x !== startX || y !== startY) line(startX, startY);
      contours.push(current);
    }
    current = [];
  };

  for (const command of commands) {
    switch (command.type) {
      case 'M':
        finish();
        current = [command.x, command.y];
        x = startX = command.x;
        y = startY = command.y;
        break;
      case 'L':
        line(command.x, command.y);
        break;
      case 'C':
        curve(command.x1, command.y1, command.x2, command.y2, command.x, command.y);
        break;
      case 'Q':
        // Nâng bậc quadratic -> cubic, chính xác tuyệt đối (TrueType dùng Q).
        curve(
          x + (2 / 3) * (command.x1 - x),
          y + (2 / 3) * (command.y1 - y),
          command.x + (2 / 3) * (command.x1 - command.x),
          command.y + (2 / 3) * (command.y1 - command.y),
          command.x,
          command.y,
        );
        break;
      case 'Z':
        finish();
        break;
    }
  }
  finish();
  return contours;
}
```

- [ ] **Step 4: Đổi signedArea sang Gauss–Legendre**

```ts
import { evalCubic, evalD1 } from './bezier';

// Cầu phương Gauss–Legendre 3 nút trên [0,1].
const GL_T = [0.5 - Math.sqrt(0.6) / 2, 0.5, 0.5 + Math.sqrt(0.6) / 2];
const GL_W = [5 / 18, 4 / 9, 5 / 18];

// Diện tích có dấu theo Green: A = ½∮(x dy − y dx) = ½∫(x·y′ − y·x′)dt.
// Hàm dưới dấu tích phân là đa thức bậc 3+2 = 5; Gauss–Legendre n nút chính
// xác đến bậc 2n−1, nên 3 nút cho kết quả ĐÚNG TUYỆT ĐỐI, không phải xấp xỉ.
//
// Dấu cho biết chiều quay của contour — đó là cách phân biệt outer với lỗ mà
// không cần biết font thuộc định dạng nào (TrueType vẽ outer theo chiều kim
// đồng hồ, CFF/OTF thì ngược lại).
export function signedArea(contour: Contour): number {
  let sum = 0;
  for (let i = 0; i + 7 < contour.length; i += 6) {
    const x0 = contour[i];
    const y0 = contour[i + 1];
    const x1 = contour[i + 2];
    const y1 = contour[i + 3];
    const x2 = contour[i + 4];
    const y2 = contour[i + 5];
    const x3 = contour[i + 6];
    const y3 = contour[i + 7];
    for (let g = 0; g < 3; g++) {
      const t = GL_T[g];
      sum +=
        GL_W[g] *
        (evalCubic(x0, x1, x2, x3, t) * evalD1(y0, y1, y2, y3, t) -
          evalCubic(y0, y1, y2, y3, t) * evalD1(x0, x1, x2, x3, t));
    }
  }
  return sum / 2;
}
```

- [ ] **Step 5: Sửa containsPoint chỉ duyệt điểm on-curve**

```ts
// Point-in-polygon kiểu ray casting trên các điểm on-curve. Chỉ cần khi một
// glyph có nhiều outer (ví dụ '%', 'ü') để biết lỗ nào thuộc outer nào.
//
// Trần đã biết: bỏ qua phần phình của cung so với dây cung, nên sai nếu điểm
// đầu của một lỗ rơi đúng vào khe giữa cung và dây cung của outer khác. Chưa
// gặp với font Latin — xem docs/text-future-work.md.
function containsPoint(contour: Contour, px: number, py: number): boolean {
  let inside = false;
  const count = (contour.length - 2) / 6;
  for (let s = 0; s < count; s++) {
    const i = s * 6;
    const j = ((s + count - 1) % count) * 6;
    const xi = contour[i];
    const yi = contour[i + 1];
    const xj = contour[j];
    const yj = contour[j + 1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
```

- [ ] **Step 6: Chạy test glyphOutlines**

Run: `pnpm vitest run src/text/__tests__/glyphOutlines.test.ts`
Expected: PASS

- [ ] **Step 7: Viết test thất bại cho renderer**

Thay assertion thứ tự lệnh trong `src/render/__tests__/textRenderer.test.ts` bằng:

```ts
it('ve outer bang moveTo + bezierCurveTo + closePath roi fill, hole thi cut', () => {
  const calls: string[] = [];
  const target = {
    moveTo: () => (calls.push('moveTo'), target),
    bezierCurveTo: () => (calls.push('bezierCurveTo'), target),
    closePath: () => (calls.push('closePath'), target),
    fill: () => (calls.push('fill'), target),
    cut: () => (calls.push('cut'), target),
  };
  drawTextShapes(
    target,
    [
      {
        outer: [0, 0, 1, 0, 2, 0, 3, 0],
        holes: [[0, 0, 1, 0, 2, 0, 3, 0]],
        anchorX: 0,
        baselineY: 0,
      },
    ],
    { type: 'solid', color: '#000000' },
  );
  expect(calls).toEqual([
    'moveTo', 'bezierCurveTo', 'closePath', 'fill',
    'moveTo', 'bezierCurveTo', 'closePath', 'cut',
  ]);
});
```

- [ ] **Step 8: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/render/__tests__/textRenderer.test.ts`
Expected: FAIL — `drawTextShapes` vẫn gọi `poly`.

- [ ] **Step 9: Đổi textRenderer sang bezier**

Trong `src/render/renderers/textRenderer.ts`:

```ts
// Đúng phần bề mặt Graphics mà việc vẽ chữ cần — tách ra để test được thứ tự
// lệnh vẽ mà không phải dựng WebGL.
export interface TextDrawTarget {
  moveTo(x: number, y: number): TextDrawTarget;
  bezierCurveTo(
    c1x: number,
    c1y: number,
    c2x: number,
    c2y: number,
    x: number,
    y: number,
  ): TextDrawTarget;
  closePath(): TextDrawTarget;
  fill(style?: unknown): TextDrawTarget;
  cut(): TextDrawTarget;
}

function trace(target: TextDrawTarget, contour: GlyphShape['outer']): void {
  target.moveTo(contour[0], contour[1]);
  for (let i = 2; i + 5 < contour.length; i += 6) {
    target.bezierCurveTo(
      contour[i],
      contour[i + 1],
      contour[i + 2],
      contour[i + 3],
      contour[i + 4],
      contour[i + 5],
    );
  }
  target.closePath();
}

// Lỗ trong chữ ('o', 'a', '8') phải khai báo tường minh: Pixi v8 KHÔNG áp
// dụng winding non-zero cho nhiều path trong cùng một fill() — mỗi path được
// tam giác hoá riêng nên ruột chữ sẽ bị tô đặc. cut() gắn lỗ vào shape cuối
// cùng của lệnh fill ngay trước đó (GraphicsContext.cut() clone _activePath,
// không phụ thuộc path được dựng bằng lệnh gì), nên phải fill *từng* outer
// rồi cut lỗ của chính nó — không gộp nhiều outer vào một fill.
export function drawTextShapes(target: TextDrawTarget, shapes: GlyphShape[], fill: Fill): void {
  const style = resolveFill(fill);
  for (const shape of shapes) {
    trace(target, shape.outer);
    target.fill(style);
    for (const hole of shape.holes) {
      trace(target, hole);
      target.cut();
    }
  }
}
```

- [ ] **Step 10: Đổi svgSerializer sang lệnh C**

Trong `src/services/svgSerializer.ts`, thay `contourToPathData`:

```ts
function contourToPathData(contour: number[]): string {
  const parts = [`M ${contour[0]} ${contour[1]}`];
  for (let i = 2; i + 5 < contour.length; i += 6) {
    parts.push(
      `C ${contour[i]} ${contour[i + 1]} ${contour[i + 2]} ${contour[i + 3]} ${contour[i + 4]} ${contour[i + 5]}`,
    );
  }
  parts.push('Z');
  return parts.join(' ');
}
```

Sửa test trong `src/services/__tests__/svgSerializerText.test.ts` để khớp: `d` bắt đầu bằng `M`, chứa `C`, kết thúc `Z`; giữ nguyên assertion `fill-rule="nonzero"`.

- [ ] **Step 11: Chạy toàn bộ test**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 12: Kiểm bằng mắt**

`pnpm dev --port 5199` từ worktree. Kiểm:
- Chữ 'o', 'a', 'e', '8' có lỗ đúng, không bị tô đặc.
- Zoom 800%: viền chữ mượt, không thấy cạnh gãy.
- Export SVG, mở file: chữ đúng hình, `d` chứa lệnh `C`.

- [ ] **Step 13: Commit**

```bash
git add src/text/glyphOutlines.ts src/render/renderers/textRenderer.ts src/services/svgSerializer.ts src/text/__tests__/glyphOutlines.test.ts src/render/__tests__/textRenderer.test.ts src/services/__tests__/svgSerializerText.test.ts
git commit -m "refactor(text): giu bezier xuyen suot, xoa code flatten"
```

---

### Task 6: Bbox chính xác và khung chọn theo bbox

`node.size` là hộp layout chưa warp, nên khung chọn hiện tại không bao được chữ đã uốn. Thêm bbox thật, chỉ dùng để **hiển thị** khung — pivot và transform vẫn bám `node.size`.

**Files:**
- Modify: `src/text/textGeometry.ts`
- Modify: `src/ui/SelectionOverlay.tsx`
- Test: `src/text/__tests__/textGeometry.test.ts`

**Interfaces:**
- Consumes: `evalCubic` từ `src/text/bezier.ts`.
- Produces: `TextGeometry.bounds: { minX, minY, maxX, maxY }`; `shapesBounds(shapes: GlyphShape[])`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/text/__tests__/textGeometry.test.ts`:

```ts
import { shapesBounds } from '../textGeometry';

describe('bounds', () => {
  it('bat cuc tri nam ngoai bao loi cac diem on-curve', () => {
    // Cung vong len tren y = 0 giua hai dau mut: cuc tri o t = 0.5 cho
    // y = -0.75·100 = -75. Lay min/max cac diem on-curve se ra 0.
    const bounds = shapesBounds([
      { outer: [0, 0, 0, -100, 100, -100, 100, 0], holes: [], anchorX: 50, baselineY: 0 },
    ]);
    expect(bounds.minY).toBeCloseTo(-75, 6);
    expect(bounds.maxY).toBeCloseTo(0, 6);
    expect(bounds.minX).toBeCloseTo(0, 6);
    expect(bounds.maxX).toBeCloseTo(100, 6);
  });

  it('mang rong tra ve hop 0', () => {
    expect(shapesBounds([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('wave lam bounds cao hon hop layout nhung node.size giu nguyen', () => {
    const node = textNode({ text: 'Headline', warp: { type: 'wave', intensity: 1 } });
    const geometry = textGeometry(node, poppins);
    expect(geometry.bounds.maxY - geometry.bounds.minY).toBeGreaterThan(geometry.height);
    expect(measureText(node, poppins).height).toBeCloseTo(geometry.height, 9);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/textGeometry.test.ts`
Expected: FAIL — `shapesBounds` chưa tồn tại.

- [ ] **Step 3: Viết shapesBounds**

Trong `src/text/textGeometry.ts`:

```ts
import { evalCubic } from './bezier';

export interface TextGeometry {
  shapes: GlyphShape[];
  // Kích thước text *chưa warp*. Đây cũng là mẫu số chuẩn hoá của warp path,
  // nên nó phải độc lập với warp — nếu lấy bbox sau warp thì path lại phụ
  // thuộc chính kết quả của nó, thành vòng lặp phản hồi. Cũng là nguồn của
  // node.size, tức pivot của applyTransform: đổi nó theo warp sẽ làm node đã
  // xoay nhảy vị trí mỗi lần kéo slider.
  width: number;
  height: number;
  baselineY: number;
  // Bbox thật của hình SAU warp. Chỉ để vẽ khung chọn — không đụng transform.
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

// Nghiệm của B'(t) = 0 trong (0,1), tức các cực trị của cung trên một trục.
// B'(t)/3 = at² + bt + c.
function extrema(p0: number, c1: number, c2: number, p3: number): number[] {
  const a = -p0 + 3 * c1 - 3 * c2 + p3;
  const b = 2 * (p0 - 2 * c1 + c2);
  const c = c1 - p0;
  const roots: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) roots.push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const r = Math.sqrt(disc);
      roots.push((-b + r) / (2 * a), (-b - r) / (2 * a));
    }
  }
  return roots.filter((t) => t > 0 && t < 1);
}

// Bbox chính xác: lấy hai đầu mút cộng các cực trị giải tích. Không dùng bao
// lồi của control point — nó nới rộng khung một cách không cần thiết.
// Bỏ qua holes: lỗ luôn nằm trong outer của chính nó.
export function shapesBounds(shapes: GlyphShape[]): TextGeometry['bounds'] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const shape of shapes) {
    const c = shape.outer;
    for (let i = 0; i + 7 < c.length; i += 6) {
      const xs = [c[i], c[i + 6]];
      const ys = [c[i + 1], c[i + 7]];
      for (const t of extrema(c[i], c[i + 2], c[i + 4], c[i + 6])) {
        xs.push(evalCubic(c[i], c[i + 2], c[i + 4], c[i + 6], t));
      }
      for (const t of extrema(c[i + 1], c[i + 3], c[i + 5], c[i + 7])) {
        ys.push(evalCubic(c[i + 1], c[i + 3], c[i + 5], c[i + 7], t));
      }
      for (const v of xs) {
        if (v < minX) minX = v;
        if (v > maxX) maxX = v;
      }
      for (const v of ys) {
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
      }
    }
  }

  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}
```

Và trả `bounds` từ `textGeometry`:

```ts
  const warped = resolveWarpGeometry(node, layout);
  const shapes = warped ? placeOnPath(layout.shapes, warped.sampler, layout.baselineY) : layout.shapes;
  return { ...layout, shapes, bounds: shapesBounds(shapes) };
```

`measureText` **không đổi** — vẫn dùng `width`/`height`.

- [ ] **Step 4: Chạy test textGeometry**

Run: `pnpm vitest run src/text/__tests__/textGeometry.test.ts`
Expected: PASS

- [ ] **Step 5: Dùng bounds cho khung chọn**

Trong `src/ui/SelectionOverlay.tsx`, thêm import và một helper cạnh `worldPoint`:

```ts
import { getLoadedFont } from '../text/fontService';
import { textGeometry } from '../text/textGeometry';
```

```ts
// Khung chọn của text bám hình đã warp, không bám node.size — node.size là
// hộp layout chưa warp (nó phải giữ nguyên vì là pivot của applyTransform).
// Font chưa nạp thì lùi về node.size, cùng quy ước "thiếu dữ liệu thì im
// lặng" mà textRenderer.ts dùng.
function selectionBox(node: Node): { x: number; y: number; width: number; height: number } {
  if (node.type === 'text') {
    const font = getLoadedFont(node.font.family)?.font;
    if (font) {
      const { bounds } = textGeometry(node, font);
      return {
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
      };
    }
  }
  return { x: 0, y: 0, width: node.size.width, height: node.size.height };
}
```

Trong component, sau `originY`, thêm:

```ts
  const box = selectionBox(node);
```

Đổi `topLeftScreen` để cộng gốc của box (pivot vẫn tính theo `node.size`, đúng như `applyTransform`):

```ts
  const topLeftScreen = viewport.toScreen({
    x: node.transform.x - originX * node.size.width + box.x,
    y: node.transform.y - originY * node.size.height + box.y,
  });
```

Và đổi `style` của khung:

```ts
          width: box.width * camera.zoom,
          height: box.height * camera.zoom,
```

Handle resize (`localCorner`/`worldPoint`) **không đụng** — chúng đã bị chặn cho text node bởi điều kiện `node.type !== 'text'`.

- [ ] **Step 6: Chạy toàn bộ test**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 7: Kiểm bằng mắt**

`pnpm dev --port 5199`. Chọn node text có wave intensity cao. Kiểm:
- Khung xanh bao trọn chữ, không còn chữ tràn ra ngoài.
- Kéo slider: khung co giãn theo chữ.
- Xoay node rồi kéo slider: node **không nhảy vị trí** (đây là điều Task này phải bảo toàn).
- Node text không có warp: khung vẫn ôm sát như trước.

- [ ] **Step 8: Commit**

```bash
git add src/text/textGeometry.ts src/ui/SelectionOverlay.tsx src/text/__tests__/textGeometry.test.ts
git commit -m "feat(text): bbox chinh xac cho khung chon, tach khoi text frame"
```

---

### Task 7: Handle wave trên path đã bake

Path preset nay bị co ngang, nên handle phải vẽ trên path đã co. Và lần kéo đầu tiên phải ghi path **đã bake** vào `warp.paths`, nếu không chữ sẽ nhảy ngay khi user chạm handle (vì path đã lưu có `fit = false` ⇒ lần render sau `k = 1`).

**Files:**
- Modify: `src/ui/WarpHandlesOverlay.tsx`
- Test: `src/text/__tests__/textGeometry.test.ts`

**Interfaces:**
- Consumes: `resolveWarpGeometry` (Task 4), `bakeScale`/`solveHorizontalScale` (Task 3).

**Ghi chú:** hai test dưới đây kiểm chính `resolveWarpGeometry` chứ không phải component, nên chúng thuộc `textGeometry.test.ts` — file đó đã có sẵn `textNode()` và `poppins`. `warpHandles.test.ts` không có hai helper này và không cần thêm; nó chỉ phải tiếp tục xanh.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/text/__tests__/textGeometry.test.ts` (bổ sung import `bakeScale`, `buildWavePath`, `placeOnPath`, `solveHorizontalScale` từ `../warp` và `resolveWarpGeometry` từ `../textGeometry`):

```ts
describe('bake he so co', () => {
  const layout = { shapes: [], width: 400, height: 100, baselineY: 80, bounds: { minX: 0, minY: 0, maxX: 400, maxY: 100 } };

  it('resolveWarpGeometry tra ve path DA bake voi preset', () => {
    const resolved = resolveWarpGeometry(textNode({ warp: { type: 'wave', intensity: 1 } }), layout)!;
    const raw = buildWavePath(1, 0.8);
    const k = solveHorizontalScale(raw, { width: 400, height: 100 }, 400);

    expect(k).toBeLessThan(1);
    expect(resolved.path.anchors[0].x).toBeCloseTo(bakeScale(raw, k).anchors[0].x, 9);
    expect(resolved.sampler.length).toBeCloseTo(400, 1);
  });

  it('luu path da bake roi render lai cho hinh trung khit', () => {
    const shapes = [{ outer: [10, 40, 30, 60], holes: [], anchorX: 20, baselineY: 80 }];
    const withShapes = { ...layout, shapes };
    const before = resolveWarpGeometry(textNode({ warp: { type: 'wave', intensity: 1 } }), withShapes)!;

    // Mo phong lan keo dau tien: ghi path dang hien thi vao warp.paths.
    const after = resolveWarpGeometry(
      textNode({ warp: { type: 'wave', intensity: 1, paths: [before.path] } }),
      withShapes,
    )!;

    const a = placeOnPath(shapes, before.sampler, 80)[0].outer;
    const b = placeOnPath(shapes, after.sampler, 80)[0].outer;
    a.forEach((value, i) => expect(b[i]).toBeCloseTo(value, 9));
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `pnpm vitest run src/text/__tests__/textGeometry.test.ts`
Expected: FAIL — `resolveWarpGeometry` chưa bake (Task 4 dựng nó có bake sẵn; nếu test đã xanh ngay thì ghi rõ điều đó vào report và chuyển sang Step 3, đây là test hồi quy khoá hành vi).

- [ ] **Step 3: Đổi overlay sang resolveWarpGeometry**

Trong `src/ui/WarpHandlesOverlay.tsx`, thay import và khối lấy path:

```ts
import { resolveWarpGeometry, textGeometry } from '../text/textGeometry';
```

```ts
  const geometry = textGeometry(node, font);
  if (geometry.height <= 0) return null;
  // Cùng nguồn với textGeometry: path ở đây đã bake hệ số co, nên handle
  // nằm đúng trên đường mà chữ đang chạy.
  const resolved = resolveWarpGeometry(node, geometry);
  if (!resolved) return null;
  const path = resolved.path;
```

Phần `box`, `toScreen`, `startDrag`, `movePathPoint` giữ nguyên — `startPath = path` nay đã là path đã bake, nên lần kéo đầu tiên ghi đúng toạ độ đang hiển thị.

Cập nhật comment ở `startDrag` cho khớp:

```ts
    // Chốt path tại thời điểm bắt đầu kéo. Path này đã bake hệ số co, nên
    // khi nó được ghi vào warp.paths (fit = false từ đó trở đi, k = 1) hình
    // hiển thị không đổi — điều user thấy lúc thả tay chính là điều được lưu.
    const startPath = path;
```

- [ ] **Step 4: Chạy test warpHandles**

Run: `pnpm vitest run src/ui/__tests__/warpHandles.test.ts`
Expected: PASS

- [ ] **Step 5: Chạy toàn bộ test**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 6: Kiểm bằng mắt**

`pnpm dev --port 5199`. Chọn node text có wave. Kiểm:
- 7 point (3 anchor + 4 handle) nằm **đúng trên** đường mà chữ đang chạy.
- Chạm và kéo nhẹ một handle: chữ **không nhảy** ở khung hình đầu tiên.
- Kéo handle ra xa để path dài hơn chữ: chữ giữ nguyên hình, chạy hết path rồi dừng.
- Kéo handle vào cho path ngắn hơn chữ: các glyph cuối biến mất dần (đúng §2.3), không bị dồn đống ở đầu mút.
- Xoay và scale node rồi kéo handle: handle vẫn bám con trỏ.

- [ ] **Step 7: Cập nhật tài liệu trần đã biết**

Thêm vào `docs/text-future-work.md`:

```markdown
## Trần của warp geometry (2026-08-16)

- Offset curve của dòng thứ 2 trở đi tự cắt khi bán kính cong của path nhỏ
  hơn khoảng cách dòng. Cố hữu của mô hình text-on-path; Illustrator cũng vậy.
- Pixi tessellate bezier theo `smoothness` mặc định, không theo camera zoom.
  Zoom rất sâu có thể thấy cạnh gãy. Nâng cấp: truyền `smoothness` theo zoom
  và vẽ lại khi zoom đổi.
- `containsPoint` trong `glyphOutlines.ts` ray-cast trên các điểm on-curve,
  bỏ qua phần phình của cung. Chính xác hẳn thì phải đếm giao điểm tia với
  từng cubic (giải phương trình bậc 3).
- `solveHorizontalScale` chỉ co theo trục x. Nếu có preset với biên độ dọc
  lớn tới mức `L(0.05) > W`, glyph cuối sẽ bị bỏ. Cần kẹp `intensity` hoặc
  đổi sang co đều hai trục.
- Envelope warp (hành vi per-point cũ) vẫn là mode tương lai — schema `Warp`
  đã chừa chỗ.
```

- [ ] **Step 8: Commit**

```bash
git add src/ui/WarpHandlesOverlay.tsx src/ui/__tests__/warpHandles.test.ts docs/text-future-work.md
git commit -m "fix(text): handle wave bam path da bake, khong nhay khi keo lan dau"
```

---

## Kiểm tra cuối

Sau Task 7, chạy một lượt end-to-end trước khi kết thúc branch:

```bash
pnpm test && pnpm lint && pnpm tsc --noEmit
```

Rồi `pnpm dev --port 5199` và duyệt lại toàn bộ checklist thị giác của Task 4, 5, 6, 7 trên cùng một document — thêm chữ, sửa chữ, đổi font, đổi size, bật/tắt wave, kéo slider, kéo handle, xoay, scale, export SVG.
