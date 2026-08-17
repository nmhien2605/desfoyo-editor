# Warp text theo arc length — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi phép warp text từ dịch chuyển dọc thuần `(x,y) → (x, y+f(x))` sang mô hình arc length của Kittl `(x,y) → (X(x), y+D(x))`, để hình hiển thị tương đương Kittl.

**Architecture:** Warp path (polybezier chuẩn hoá theo hộp text `W×H`) được lấy mẫu thành bảng tra theo **độ dài cung**. Hoành độ glyph `x` được kéo giãn hệ số `k = L/W` rồi tra bảng: `s = clamp(k·x, 0, L)`, `P = pointAt(s)`, `(x,y) ↦ (P.x, P.y + y − y₀)`. Vì `X` và `D` đều chỉ phụ thuộc `x`, phép biến đổi thu hẹp trên một đoạn cubic là phép affine 2 chiều, nên vẫn áp chính xác tuyệt đối lên control point sau khi chia nhỏ tới ngưỡng sai số.

**Tech Stack:** TypeScript, React, Pixi.js, opentype.js, Zod, Vitest. Không thêm dependency nào.

## Global Constraints

- Spec nguồn: `docs/superpowers/specs/2026-08-17-text-warp-arclength-design.md`. Bằng chứng thực nghiệm: `docs/kittl-warp-reverse-engineered.md`.
- **Không thêm dependency mới.**
- Chỉ làm `wave`. `arch` / `rise` / `flag` / `angle` / `circle` / `distort` / `custom` vẫn trả `null` như hiện tại.
- Mọi commit phải xanh cả ba lệnh: `pnpm test`, `pnpm exec tsc --noEmit -p tsconfig.build.json`, `pnpm lint`. Vitest chạy qua esbuild (transpile-only) nên `pnpm test` xanh **không** chứng minh kiểu đúng — luôn chạy đủ ba.
- **Không** chạy `pnpm format` hay `prettier --write .` trên toàn repo. Chỉ định dạng đúng file đã sửa: `pnpm exec prettier --write <path>`.
- **Không** dùng `git add -A` hay `git add .`. Chỉ stage đúng những file liệt kê trong task.
- Bình luận trong code viết bằng tiếng Việt, khớp cách dùng dấu của file xung quanh (`warp.ts` hiện không dấu, `textGeometry.ts` có dấu), và giải thích **tại sao** chứ không phải **cái gì**.
- `WARP_TOL = 0.05` px, `LUT_TOL = 0.01` px, `MIN_DX = 1e-6`, `EPSILON = 1e-6`.
- `curveHeight` nằm trong `[-1, 4]` (slider hiển thị −100 %…400 %).
- Không đụng `src/render/renderers/textRenderer.ts` — nó chỉ tiêu thụ `textGeometry(...).shapes`.

## File Structure

| File | Trách nhiệm sau khi xong |
|---|---|
| `src/text/warp.ts` | Toàn bộ hình học warp: `segmentsOf`, `clampPathX`, `buildWavePath`, `buildWarpMap` (bảng arc length), `warpContours` (chia nhỏ + áp affine). Engine cũ (`buildDisplacement`, `displaceContours`) bị xoá. |
| `src/text/textGeometry.ts` | Ghép layout + warp; `resolveWarpPath` chọn giữa path đã lưu và preset. |
| `src/text/bezier.ts` | Không đổi. |
| `src/schema/warp.ts` | `intensity` → `curveHeight`, kèm bí danh đọc-vào cho tài liệu cũ. |
| `src/ui/TransformationControls.tsx` | Slider −100 %…400 %. |
| `src/ui/WarpHandlesOverlay.tsx` | Kéo handle → ghi lại cả `paths` lẫn `curveHeight`. |

---

## Task 1: Đổi `intensity` thành `curveHeight` và định nghĩa lại biên độ preset

Đây là task đổi tên + đổi tham số hoá, **chưa** đụng gì tới engine hình học. Sau task này app vẫn chạy engine dịch chuyển dọc cũ; chỉ có ý nghĩa của con số trên slider là mới.

**Files:**
- Modify: `src/schema/warp.ts`
- Modify: `src/text/warp.ts` (chỉ hàm `buildWavePath`)
- Modify: `src/text/textGeometry.ts` (chỉ `resolveWarpPath`)
- Modify: `src/ui/TransformationControls.tsx`
- Modify: `src/ui/WarpHandlesOverlay.tsx` (chỉ tên trường trong patch)
- Test: `src/schema/__tests__/textNode.test.ts`, `src/text/__tests__/warp.test.ts`, `src/text/__tests__/textGeometry.test.ts`, `src/ui/__tests__/transformationControls.test.ts`

**Interfaces:**
- Produces: `Warp = { type: WarpType; curveHeight: number; paths?: WarpPath[] }`
- Produces: `buildWavePath(curveHeight: number, baselineRatio: number, fontSize: number, boxHeight: number): WarpPath`
- Produces: `resolveWarpPath(node: TextNode, baselineRatio: number, boxHeight: number): WarpPath | null`
- Produces: `DEFAULT_WARP_CURVE_HEIGHT = 0.5`, `setWarpCurveHeight(warp: Warp | undefined, curveHeight: number): Warp`

- [ ] **Step 1: Viết test cho schema**

Trong `src/schema/__tests__/textNode.test.ts`, thay hai dòng 51–52 và trường `intensity` ở dòng 34 (trong object `warp` của test dựng TextNode) bằng:

```ts
  it('tu choi curveHeight ngoai khoang -1..4', () => {
    expect(WarpSchema.safeParse({ type: 'wave', curveHeight: 4.1 }).success).toBe(false);
    expect(WarpSchema.safeParse({ type: 'wave', curveHeight: -1.1 }).success).toBe(false);
    expect(WarpSchema.safeParse({ type: 'wave', curveHeight: 4 }).success).toBe(true);
    expect(WarpSchema.safeParse({ type: 'wave', curveHeight: -1 }).success).toBe(true);
  });

  it('doc `intensity` cua tai lieu cu nhu bi danh cua curveHeight', () => {
    const parsed = WarpSchema.parse({ type: 'wave', intensity: 0.8 });
    expect(parsed).toEqual({ type: 'wave', curveHeight: 0.8 });
  });
```

Trường `intensity: 0.5` ở dòng 34 đổi thành `curveHeight: 0.5`.

- [ ] **Step 2: Chạy test để xác nhận nó hỏng**

Run: `pnpm test src/schema/__tests__/textNode.test.ts`
Expected: FAIL — `curveHeight: 4` bị từ chối vì schema vẫn đòi `intensity`.

- [ ] **Step 3: Sửa schema**

Trong `src/schema/warp.ts`, thay khối `WarpSchema` (dòng 38–47) bằng:

```ts
// paths vắng mặt = đang ở chế độ preset, path được sinh từ type + curveHeight.
// Ngay khi user kéo một handle, path sinh ra được ghi vào paths và từ đó paths
// là nguồn sự thật. Reset xoá paths. Nhờ vậy slider và handle không tranh nhau
// một nguồn dữ liệu.
const WarpBodySchema = z.object({
  type: WarpTypeSchema,
  // Biên độ dao động dọc của path, tính bằng bội số của fontSize, có dấu — âm
  // là lật ngược đường cong. Cùng đơn vị với `curveHeight` của Kittl.
  curveHeight: z.number().min(-1).max(4),
  paths: z.array(WarpPathSchema).optional(),
});

// Tài liệu ghi trước 2026-08-17 dùng `intensity` 0..1. Đọc thẳng con số đó vào
// curveHeight thay vì bỏ tài liệu: ở chế độ preset hình sẽ lệch nhẹ vì công
// thức biên độ đổi, còn tài liệu đã có `paths` thì path thắng nên không đổi gì.
export const WarpSchema = z.preprocess((value) => {
  if (value && typeof value === 'object' && !('curveHeight' in value) && 'intensity' in value) {
    const { intensity, ...rest } = value as Record<string, unknown>;
    return { ...rest, curveHeight: intensity };
  }
  return value;
}, WarpBodySchema);
export type Warp = z.infer<typeof WarpBodySchema>;
```

- [ ] **Step 4: Chạy lại test schema**

Run: `pnpm test src/schema/__tests__/textNode.test.ts`
Expected: PASS

- [ ] **Step 5: Viết test cho biên độ preset mới**

Trong `src/text/__tests__/warp.test.ts`, đổi mọi lời gọi `buildWavePath(v, r)` thành `buildWavePath(v, r, FONT_SIZE, SIZE.height)` với hằng mới đặt ngay dưới `const SIZE`:

```ts
const FONT_SIZE = 70;
```

Rồi thêm hai test vào `describe('buildWavePath')`:

```ts
  it('khoang dao dong doc dung bang |curveHeight| * fontSize', () => {
    for (const curve of [0.5, 1, 2.5, 4]) {
      const path = buildWavePath(curve, 0.5, FONT_SIZE, SIZE.height);
      const ys: number[] = [];
      for (const anchor of path.anchors) {
        ys.push(anchor.y);
        if (anchor.in) ys.push(anchor.in.y);
        if (anchor.out) ys.push(anchor.out.y);
      }
      const spreadPx = (Math.max(...ys) - Math.min(...ys)) * SIZE.height;
      expect(spreadPx).toBeCloseTo(curve * FONT_SIZE, 9);
    }
  });

  it('curveHeight am lat nguoc duong cong quanh baseline', () => {
    const up = buildWavePath(1, 0.5, FONT_SIZE, SIZE.height);
    const down = buildWavePath(-1, 0.5, FONT_SIZE, SIZE.height);
    up.anchors.forEach((anchor, i) => {
      expect(down.anchors[i].y - 0.5).toBeCloseTo(-(anchor.y - 0.5), 12);
    });
  });
```

Test hiện có `'intensity = 0 cho duong nam ngang tuyet doi'` đổi tên thành `'curveHeight = 0 cho duong nam ngang tuyet doi'`, nội dung giữ nguyên.

- [ ] **Step 6: Chạy test để xác nhận nó hỏng**

Run: `pnpm test src/text/__tests__/warp.test.ts`
Expected: FAIL — `buildWavePath` mới nhận 2 tham số, khoảng dao động sai.

- [ ] **Step 7: Sửa `buildWavePath`**

Trong `src/text/warp.ts`, thay dòng 35–57 bằng:

```ts
// Đúng cấu trúc docs/wave-transformation.md mô tả: 1 path mở, 3 anchor,
// 4 handle, tổng 7 point hiển thị. baselineRatio = baselineY / height, nên
// curveHeight = 0 cho ra một đường ngang đúng ngay tại baseline — tức warp
// trở thành phép đồng nhất.
//
// curveHeight đo bằng bội số của fontSize, giống Kittl: khoảng dao động dọc
// của path bằng đúng |curveHeight| * fontSize. Hình gốc dao động từ -0.4a tới
// +a, tức 1.4a, nên chia 1.4 để quy về đúng biên độ yêu cầu. Dấu âm lật cong.
export function buildWavePath(
  curveHeight: number,
  baselineRatio: number,
  fontSize: number,
  boxHeight: number,
): WarpPath {
  const a = boxHeight > 0 ? (curveHeight * fontSize) / (1.4 * boxHeight) : 0;
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
```

- [ ] **Step 8: Cập nhật `resolveWarpPath`**

Trong `src/text/textGeometry.ts`, đổi chữ ký và nhánh preset (dòng 59, 71):

```ts
export function resolveWarpPath(
  node: TextNode,
  baselineRatio: number,
  boxHeight: number,
): WarpPath | null {
```

```ts
  if (warp.type === 'wave') {
    return clampPathX(buildWavePath(warp.curveHeight, baselineRatio, node.font.size, boxHeight));
  }
  return null;
```

Và lời gọi trong `textGeometry` (dòng 85):

```ts
  const path =
    layout.height > 0
      ? resolveWarpPath(node, layout.baselineY / layout.height, layout.height)
      : null;
```

- [ ] **Step 9: Cập nhật UI**

Trong `src/ui/TransformationControls.tsx`:

```ts
export const DEFAULT_WARP_CURVE_HEIGHT = 0.5;
```

```ts
export function setWarpType(warp: Warp | undefined, type: WarpType): Warp {
  // paths bị xoá khi đổi kiểu: một path do user chỉnh cho Wave không còn ý
  // nghĩa gì với Arch hay Circle.
  return { type, curveHeight: warp?.curveHeight ?? DEFAULT_WARP_CURVE_HEIGHT };
}

// Kéo slider = quay về chế độ preset, nên paths bị xoá. Đây là cách slider và
// handle không tranh nhau một nguồn dữ liệu (spec §4.2).
export function setWarpCurveHeight(warp: Warp | undefined, curveHeight: number): Warp {
  return {
    type: warp?.type ?? 'wave',
    curveHeight: Math.min(4, Math.max(-1, curveHeight)),
  };
}

export function resetWarp(warp: Warp | undefined): Warp {
  return { type: warp?.type ?? 'none', curveHeight: DEFAULT_WARP_CURVE_HEIGHT };
}
```

Và khối slider (dòng 87–99):

```tsx
          <label className="flex flex-col gap-1 capitalize">
            {active} Curve — {Math.round((warp?.curveHeight ?? 0) * 100)}%
            <input
              type="range"
              min={-1}
              max={4}
              step={0.01}
              value={warp?.curveHeight ?? 0}
              onPointerDown={() => store.getState().beginGesture(`warp-curve:${node.id}`)}
              onPointerUp={() => store.getState().endGesture()}
              onChange={(e) => apply(setWarpCurveHeight(warp, Number(e.target.value)))}
            />
          </label>
```

Trong `src/ui/WarpHandlesOverlay.tsx` dòng 129, đổi `intensity: node.warp?.intensity ?? 0.5,` thành `curveHeight: node.warp?.curveHeight ?? 0.5,`.

- [ ] **Step 10: Cập nhật test UI**

Trong `src/ui/__tests__/transformationControls.test.ts`, đổi mọi `intensity` thành `curveHeight`, `DEFAULT_WARP_INTENSITY` thành `DEFAULT_WARP_CURVE_HEIGHT`, `setWarpIntensity` thành `setWarpCurveHeight`. Hai test kẹp biên (dòng 46–47) đổi giá trị mong đợi:

```ts
    expect(setWarpCurveHeight(edited, 5).curveHeight).toBe(4);
    expect(setWarpCurveHeight(edited, -2).curveHeight).toBe(-1);
```

- [ ] **Step 11: Cập nhật test textGeometry**

Trong `src/text/__tests__/textGeometry.test.ts`, đổi mọi `intensity:` trong object `warp` thành `curveHeight:`. Đổi tên các test có chữ `intensity` trong tiêu đề thành `curveHeight`. Ba lời gọi `resolveWarpPath(node, 0.8)` thêm tham số thứ ba `120` (chiều cao hộp của `textNode()` mặc định).

- [ ] **Step 12: Chạy đủ ba lệnh**

```bash
pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint
```
Expected: tất cả PASS.

- [ ] **Step 13: Định dạng và commit**

```bash
pnpm exec prettier --write src/schema/warp.ts src/text/warp.ts src/text/textGeometry.ts src/ui/TransformationControls.tsx src/ui/WarpHandlesOverlay.tsx src/schema/__tests__/textNode.test.ts src/text/__tests__/warp.test.ts src/text/__tests__/textGeometry.test.ts src/ui/__tests__/transformationControls.test.ts
```

```bash
git add src/schema/warp.ts src/text/warp.ts src/text/textGeometry.ts src/ui/TransformationControls.tsx src/ui/WarpHandlesOverlay.tsx src/schema/__tests__/textNode.test.ts src/text/__tests__/warp.test.ts src/text/__tests__/textGeometry.test.ts src/ui/__tests__/transformationControls.test.ts
git commit -m "refactor(text): doi intensity thanh curveHeight theo don vi fontSize"
```

---

## Task 2: `buildWarpMap` — bảng tra theo độ dài cung

Thêm mới, **không** xoá gì. Engine cũ vẫn chạy sau task này.

**Files:**
- Modify: `src/text/warp.ts`
- Test: `src/text/__tests__/warp.test.ts`

**Interfaces:**
- Consumes: `buildWavePath(curveHeight, baselineRatio, fontSize, boxHeight)` (Task 1), `segmentsOf`, `clampPathX`, `EPSILON` (đã có trong `warp.ts`), `Cubic`, `evalCubic`, `splitCubic` từ `./bezier`.
- Produces:
```ts
export interface WarpMap {
  X(x: number): number;   // hoanh do moi
  D(x: number): number;   // do doi doc
  L: number;              // do dai cung cua path
  k: number;              // L / W
}
export function buildWarpMap(path: WarpPath, size: Size, baselineY: number): WarpMap | null;
```
`null` nghĩa là "không cần warp" — caller dùng nguyên `layout.shapes`.

- [ ] **Step 1: Viết test**

Thêm vào cuối `src/text/__tests__/warp.test.ts`, sau `describe('buildDisplacement')`. Dòng import từ `../warp` trở thành:

```ts
import { buildDisplacement, buildWarpMap, buildWavePath, clampPathX, displaceContours } from '../warp';
```

```ts
// Tham chieu doc lap: di doc polybezier bang buoc rat nho, cong don do dai
// day cung. Cham nhung khong dung chung mot dong code nao voi buildWarpMap,
// nen no bat duoc loi cua bang tra chu khong lap lai loi do.
function walkPath(path: WarpPath, size: { width: number; height: number }) {
  const pts: { x: number; y: number; u: number }[] = [];
  const px = (p: { x: number; y: number }) => ({ x: p.x * size.width, y: p.y * size.height });
  let u = 0;
  let prev: { x: number; y: number } | null = null;
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const p0 = px(from);
    const p3 = px(to);
    const c1 = from.out ? px(from.out) : p0;
    const c2 = to.in ? px(to.in) : p3;
    const steps = 40000;
    for (let s = 0; s <= steps; s++) {
      if (i > 0 && s === 0) continue;
      const t = s / steps;
      const p = {
        x: evalCubic(p0.x, c1.x, c2.x, p3.x, t),
        y: evalCubic(p0.y, c1.y, c2.y, p3.y, t),
      };
      if (prev) u += Math.hypot(p.x - prev.x, p.y - prev.y);
      pts.push({ ...p, u });
      prev = p;
    }
  }
  const total = u;
  const at = (s: number) => {
    const target = Math.min(Math.max(s, 0), total);
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].u <= target) lo = mid;
      else hi = mid;
    }
    return pts[lo];
  };
  return { total, at };
}

describe('buildWarpMap', () => {
  const WAVE = () => clampPathX(buildWavePath(1, 0.5, FONT_SIZE, SIZE.height));

  it('path phang dung tai baseline tra null — khong warp gi ca', () => {
    expect(buildWarpMap(buildWavePath(0, 0.5, FONT_SIZE, SIZE.height), SIZE, 50)).toBeNull();
  });

  it('path duoi 2 anchor tra null', () => {
    const single: WarpPath = { role: 'baseline', closed: false, anchors: [{ x: 0, y: 0.9 }] };
    expect(buildWarpMap(single, SIZE, 50)).toBeNull();
  });

  it('X ghim dung hai mep hop: X(0) = 0 va X(W) = W', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    expect(map.X(0)).toBe(0);
    expect(Math.abs(map.X(SIZE.width) - SIZE.width)).toBeLessThan(0.1);
  });

  it('X khong giam tren [0, W]', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    let prev = -Infinity;
    for (let i = 0; i <= 1000; i++) {
      const v = map.X((SIZE.width * i) / 1000);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it('L >= W va k = L / W', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    expect(map.L).toBeGreaterThan(SIZE.width);
    expect(map.k).toBeCloseTo(map.L / SIZE.width, 12);
  });

  it('L khop tham chieu doc lap duoi 0.05px', () => {
    const path = WAVE();
    const map = buildWarpMap(path, SIZE, 50)!;
    expect(Math.abs(map.L - walkPath(path, SIZE).total)).toBeLessThan(0.05);
  });

  it('X va D khop tham chieu doc lap duoi 0.05px tren toan hop', () => {
    const path = WAVE();
    const map = buildWarpMap(path, SIZE, 50)!;
    const ref = walkPath(path, SIZE);
    const y0 = ref.at(0).y;
    for (let x = 0; x <= SIZE.width; x += 2) {
      const p = ref.at(map.k * x);
      expect(Math.abs(map.X(x) - p.x)).toBeLessThan(0.05);
      expect(Math.abs(map.D(x) - (p.y - y0))).toBeLessThan(0.05);
    }
  });

  it('kep ve dau mut khi x ra ngoai [0, W]', () => {
    const map = buildWarpMap(WAVE(), SIZE, 50)!;
    expect(map.X(-100)).toBe(map.X(0));
    expect(map.D(-100)).toBe(map.D(0));
    expect(map.X(900)).toBe(map.X(SIZE.width));
    expect(map.D(900)).toBe(map.D(SIZE.width));
  });

  it('D neo o diem DAU path, khong phai baseline: tinh tien path doc khong doi ket qua', () => {
    // P_y va y0 cung dich mot luong => D khong doi. Day la ly do vi tri doc
    // tuyet doi cua path khong anh huong hinh, chi hinh dang moi anh huong.
    const base = WAVE();
    const shifted: WarpPath = {
      ...base,
      anchors: base.anchors.map((a) => ({
        ...a,
        y: a.y + 0.1,
        in: a.in ? { ...a.in, y: a.in.y + 0.1 } : undefined,
        out: a.out ? { ...a.out, y: a.out.y + 0.1 } : undefined,
      })),
    };
    const m1 = buildWarpMap(base, SIZE, 50)!;
    const m2 = buildWarpMap(shifted, SIZE, 50)!;
    for (let x = 0; x <= SIZE.width; x += 20) {
      expect(m2.D(x)).toBeCloseTo(m1.D(x), 9);
      expect(m2.X(x)).toBeCloseTo(m1.X(x), 9);
    }
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó hỏng**

Run: `pnpm test src/text/__tests__/warp.test.ts`
Expected: FAIL — `buildWarpMap is not a function`.

- [ ] **Step 3: Cài đặt**

Trong `src/text/warp.ts`, thêm ngay dưới `clampPathX` (trước khối `LUT_TOL` hiện có):

```ts
export interface WarpMap {
  X(x: number): number;
  D(x: number): number;
  L: number;
  k: number;
}

// Khoang cach tu diem toi DUONG THANG qua hai dau mut day cung. Bang tra gio
// duoc danh chi so theo do dai cung, tuc truy van la "cho s, tra diem" — mot
// cau hoi HINH HOC. Nen tieu chi phang phai la khoang cach hinh hoc, khac han
// tieu chi cu (sai lech DOC theo x) von phuc vu truy van "cho x, tra y".
// Dung khoang cach vuong goc thay vi so sanh theo tham so t: mot doan THANG co
// tham so hoa khong deu van phai duoc coi la phang, neu khong no bi chia toi
// het do sau ma khong ich gi.
function chordDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < EPSILON) return Math.hypot(px - ax, py - ay);
  return Math.abs((px - ax) * dy - (py - ay) * dx) / len;
}

// Day mau cuoi cua mot cung vao bang, chia doi cho toi khi day cung du sat.
// Chi day dau mut PHAI: dau mut trai da nam trong bang tu buoc truoc.
// Bo qua mau trung diem truoc do — `us` phai tang NGHIEM NGAT thi nhi phan
// trong lookup() moi co nghia.
function samplePath(
  xs: number[],
  ys: number[],
  us: number[],
  bx: Cubic,
  by: Cubic,
  depth: number,
): void {
  let flat = true;
  if (depth < MAX_DEPTH) {
    for (let k = 1; k < 4 && flat; k++) {
      const t = k / 4;
      const x = evalCubic(bx[0], bx[1], bx[2], bx[3], t);
      const y = evalCubic(by[0], by[1], by[2], by[3], t);
      if (chordDistance(x, y, bx[0], by[0], bx[3], by[3]) > LUT_TOL) flat = false;
    }
  }
  if (flat) {
    const lastX = xs[xs.length - 1];
    const lastY = ys[ys.length - 1];
    const step = Math.hypot(bx[3] - lastX, by[3] - lastY);
    if (step < EPSILON) return;
    xs.push(bx[3]);
    ys.push(by[3]);
    us.push(us[us.length - 1] + step);
    return;
  }
  const lx = splitCubic(bx[0], bx[1], bx[2], bx[3], 0.5);
  const ly = splitCubic(by[0], by[1], by[2], by[3], 0.5);
  samplePath(xs, ys, us, lx.left, ly.left, depth + 1);
  samplePath(xs, ys, us, lx.right, ly.right, depth + 1);
}

// Path phang dung tai baseline => phep dong nhat. Phai chan tuong minh: X(x)
// duoc tra qua bang nen chi bang x trong sai so LUT, khong bang TUYET DOI nhu
// mo hinh cu (spec §2.5).
function isFlatAtBaseline(path: WarpPath, size: Size, baselineY: number): boolean {
  const flatY = (p: { y: number }) => Math.abs(p.y * size.height - baselineY) <= EPSILON;
  return path.anchors.every(
    (a) => flatY(a) && (!a.in || flatY(a.in)) && (!a.out || flatY(a.out)),
  );
}

// Bang tra theo DO DAI CUNG cho phep bien doi warp (spec §2.2):
//   s = clamp(k*x, 0, L),  (x, y) -> (P(s).x, P(s).y + y - y0)
// He so k = L/W la dang dong cua co che Kittl dat lai chieu rong layout bang L
// moi lan path doi — nho no ma be ngang chu khong doi khi tang do cong.
export function buildWarpMap(path: WarpPath, size: Size, baselineY: number): WarpMap | null {
  if (size.width <= 0 || size.height <= 0) return null;
  if (path.anchors.length < 2) return null;
  if (isFlatAtBaseline(path, size, baselineY)) return null;

  const xs: number[] = [];
  const ys: number[] = [];
  const us: number[] = [];
  const segments = segmentsOf(path, size);
  segments.forEach((s, i) => {
    if (i === 0) {
      xs.push(s.p0.x);
      ys.push(s.p0.y);
      us.push(0);
    }
    samplePath(
      xs,
      ys,
      us,
      [s.p0.x, s.c1.x, s.c2.x, s.p3.x],
      [s.p0.y, s.c1.y, s.c2.y, s.p3.y],
      0,
    );
  });

  const L = us[us.length - 1];
  if (!(L > EPSILON)) return null;
  const y0 = ys[0];
  const k = L / size.width;

  const lookup = (x: number): { x: number; y: number } => {
    const s = Math.min(Math.max(k * x, 0), L);
    if (s <= 0) return { x: xs[0], y: ys[0] };
    if (s >= L) return { x: xs[xs.length - 1], y: ys[ys.length - 1] };
    let low = 0;
    let high = us.length - 1;
    while (high - low > 1) {
      const mid = (low + high) >> 1;
      if (us[mid] <= s) low = mid;
      else high = mid;
    }
    const span = us[high] - us[low];
    const r = span < EPSILON ? 0 : (s - us[low]) / span;
    return {
      x: xs[low] + (xs[high] - xs[low]) * r,
      y: ys[low] + (ys[high] - ys[low]) * r,
    };
  };

  return {
    L,
    k,
    X: (x) => lookup(x).x,
    D: (x) => lookup(x).y - y0,
  };
}
```

Thêm `Size` vào import type từ `../schema` nếu chưa có (đã có ở dòng 1).

- [ ] **Step 4: Chạy test**

Run: `pnpm test src/text/__tests__/warp.test.ts`
Expected: PASS.

Nếu test `'X va D khop tham chieu doc lap duoi 0.05px'` hoặc `'L khop tham chieu...'` hỏng: **không** nới ngưỡng test. Siết `LUT_TOL` xuống (0.005, rồi 0.002) và đo lại. Ngưỡng test là hợp đồng, hằng số cài đặt là biến điều chỉnh.

- [ ] **Step 5: Chạy đủ ba lệnh và commit**

```bash
pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint
```

```bash
pnpm exec prettier --write src/text/warp.ts src/text/__tests__/warp.test.ts
git add src/text/warp.ts src/text/__tests__/warp.test.ts
git commit -m "feat(text): them buildWarpMap - bang tra warp path theo do dai cung"
```

---

## Task 3: `warpContours` — chia nhỏ và áp phép affine hai chiều

Thêm mới, **không** xoá gì. Bao gồm cả việc đo lại `MAX_DEPTH`.

**Files:**
- Modify: `src/text/warp.ts`
- Test: `src/text/__tests__/warp.test.ts`

**Interfaces:**
- Consumes: `WarpMap` (Task 2), `Contour`/`GlyphShape` từ `./glyphOutlines`, `extrema`/`evalCubic`/`splitCubic` từ `./bezier`.
- Produces: `export function warpContours(shapes: GlyphShape[], map: WarpMap): GlyphShape[]`

- [ ] **Step 1: Viết test**

Thêm vào cuối `src/text/__tests__/warp.test.ts`. Dòng import từ `../warp` trở thành:

```ts
import {
  buildDisplacement,
  buildWarpMap,
  buildWavePath,
  clampPathX,
  displaceContours,
  warpContours,
  type WarpMap,
} from '../warp';
```

Ba helper `shape`, `lineSeg`, `rect` đã có sẵn trong file — dùng lại, đừng viết lại.

```ts
// Map giai tich, khong qua bang tra: test nay do RIENG phan chia nho + ap
// affine, khong keo theo sai so cua buildWarpMap.
// He so 8/30 < 1 nen X don dieu tang; 0 <= X' <= 1.27.
const analytic: WarpMap = {
  L: 0,
  k: 1,
  X: (x) => x + 8 * Math.sin(x / 30),
  D: (x) => 12 * Math.sin(x / 25),
};

// Nghich dao cua analytic.X bang chia doi — X don dieu nen chia doi hoi tu.
function inverseX(target: number): number {
  let lo = -200;
  let hi = 400;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (analytic.X(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

describe('warpContours', () => {
  it('I4 — khong xoay: hai diem cung x cho cung x moi, hieu y giu nguyen', () => {
    // Canh phai cua hop: x = 60 co dinh, y chay tu 20 xuong 80.
    const box = rect(10, 20, 60, 80);
    const out = warpContours([shape(box)], analytic)[0].outer;
    const xRight = analytic.X(60);
    const onRightEdge: number[] = [];
    for (let i = 0; i < out.length; i += 2) {
      if (Math.abs(out[i] - xRight) < 1e-9) onRightEdge.push(out[i + 1]);
    }
    expect(onRightEdge.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...onRightEdge) - Math.min(...onRightEdge)).toBeCloseTo(60, 9);
  });

  it('I5 — dinh dang 2 + 6n va contour kin TUYET DOI', () => {
    const out = warpContours([shape(rect(10, 20, 60, 80))], analytic)[0].outer;
    expect((out.length - 2) % 6).toBe(0);
    expect(out[out.length - 2]).toBe(out[0]);
    expect(out[out.length - 1]).toBe(out[1]);
  });

  it('I5 — segment co cuc tri hoanh do van khop chinh xac o moi noi', () => {
    // Segment cuoi vong sang phai toi x ~ 15 roi quay ve x = 0, tuc p0.x = 10
    // nam han trong (xa, xb). Day cung tren [xa, xb] se lam diem dong lech
    // khoi diem mo; noi suy dau mut thi khong.
    const c = [0, 0];
    lineSeg(c, 0, 0, 10, 0);
    lineSeg(c, 10, 0, 10, 20);
    c.push(30, 25, -15, 5, 0, 0);
    const out = warpContours([shape(c)], analytic)[0].outer;
    expect(out[0]).toBeCloseTo(analytic.X(0), 12);
    expect(out[1]).toBeCloseTo(analytic.D(0), 12);
    expect(out[out.length - 2]).toBe(out[0]);
    expect(out[out.length - 1]).toBe(out[1]);
  });

  it('I6 — sai so hinh bi chan boi WARP_TOL tren ca hai truc', () => {
    // Nghich dao tung diem dau ra: x goc = X^-1(x'), y goc = y' - D(x goc).
    // Diem goc phai roi ve dung mot canh ngang cua hop (y = 20 hoac y = 80).
    //
    // Nguong 0.12 chu khong phai 0.05: hai sai so cong lai. Lech X toi WARP_TOL
    // lam X^-1 lech 0.05/min(X') = 0.068, nhan do doc cua D (12/25) ra them
    // 0.033; cong lech cua chinh D (0.05) la ~0.15 truong hop xau nhat. Lay
    // 0.12 vi hai sai so hiem khi cung dau va cung cuc dai.
    const out = warpContours([shape(rect(10, 20, 60, 80))], analytic)[0].outer;
    for (let i = 0; i + 7 < out.length; i += 6) {
      // Canh doc: x goc hang nen anh cung hang, khong nam tren canh ngang nao.
      if (Math.abs(out[i + 6] - out[i]) < 1e-9) continue;
      for (let k = 0; k <= 20; k++) {
        const t = k / 20;
        const x = evalCubic(out[i], out[i + 2], out[i + 4], out[i + 6], t);
        const y = evalCubic(out[i + 1], out[i + 3], out[i + 5], out[i + 7], t);
        const ySrc = y - analytic.D(inverseX(x));
        expect(Math.min(Math.abs(ySrc - 20), Math.abs(ySrc - 80))).toBeLessThan(0.12);
      }
    }
  });

  it('chia nho lam tang so segment', () => {
    const box = rect(10, 20, 60, 80);
    const out = warpContours([shape(box)], analytic)[0].outer;
    expect(out.length).toBeGreaterThan(box.length);
  });

  it('ap ca cho holes', () => {
    const outer = rect(0, 0, 100, 100);
    const hole = rect(30, 30, 70, 70);
    const [out] = warpContours([{ outer, holes: [hole] }], analytic);
    expect(out.holes).toHaveLength(1);
    expect(out.holes[0]).not.toEqual(hole);
    expect(out.holes[0][0]).toBeCloseTo(analytic.X(30), 12);
  });

  it('map dong nhat cho lai dung contour goc', () => {
    const identity: WarpMap = { L: 0, k: 1, X: (x) => x, D: () => 0 };
    const box = rect(10, 20, 60, 80);
    expect(warpContours([shape(box)], identity)[0].outer).toEqual(box);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó hỏng**

Run: `pnpm test src/text/__tests__/warp.test.ts`
Expected: FAIL — `warpContours is not a function`.

- [ ] **Step 3: Cài đặt**

Trong `src/text/warp.ts`, thêm sau `buildWarpMap`:

```ts
const WARP_TOL = 0.05; // px
// Duoi nguong nay, he so goc tinh bang (V(x3) - V(x0))/dx bi nhieu cua bang
// LUT nuot chung. Dung hang so tai x0 thay the: hai dau mut cach nhau duoi
// MIN_DX nen gia tri o hai ben lech khong dang ke. Ve hinh hoc day la net doc
// — ca doan chung mot x nen chung mot s, anh xa ve dung mot hoanh do.
const MIN_DX = 1e-6;

// Ap phep AFFINE HAI CHIEU len ca 4 control point:
//   x' = ax + bxc*x        y' = y + ay + byc*x
// tuc ma tran [[bxc, 0], [byc, 1]], tinh tien (ax, ay). Chinh xac TUYET DOI:
// co so Bernstein co tong bang 1 nen anh cua mot duong Bezier qua phep affine
// A chinh la duong Bezier co control point A(c_i). Chung minh cu (mo hinh dich
// chuyen doc) la truong hop rieng bxc = 0 cua dung lap luan nay.
//
// Chi day 3 diem (c1, c2, p3): diem mo dau da do nguoi goi ghi.
function pushWarped(
  out: number[],
  bx: Cubic,
  by: Cubic,
  ax: number,
  bxc: number,
  ay: number,
  byc: number,
): void {
  for (let i = 1; i < 4; i++) out.push(ax + bxc * bx[i], by[i] + ay + byc * bx[i]);
}

function warpSegment(out: number[], bx: Cubic, by: Cubic, map: WarpMap, depth: number): void {
  // Khoang hoanh do THAT cua segment: hai dau mut cong cac cuc tri cua Bx.
  // Rong hon [p0.x, p3.x] o nhung segment vong lai — do chinh la cho hai ham
  // affine phai ngoai suy, nen phai do sai so o day.
  let xa = Math.min(bx[0], bx[3]);
  let xb = Math.max(bx[0], bx[3]);
  for (const t of extrema(bx[0], bx[1], bx[2], bx[3])) {
    const x = evalCubic(bx[0], bx[1], bx[2], bx[3], t);
    if (x < xa) xa = x;
    if (x > xb) xb = x;
  }

  const dx = bx[3] - bx[0];
  // NOI SUY tai hai dau mut on-curve (khong phai day cung tren [xa, xb]): diem
  // noi hai segment ke nhau duoc luu MOT lan trong Contour, hai ben phai cho
  // cung gia tri tai hoanh do do thi contour moi kin va khong gay khuc.
  let bxc: number;
  let ax: number;
  let byc: number;
  let ay: number;
  if (Math.abs(dx) < MIN_DX) {
    bxc = 0;
    ax = map.X(bx[0]);
    byc = 0;
    ay = map.D(bx[0]);
  } else {
    bxc = (map.X(bx[3]) - map.X(bx[0])) / dx;
    ax = map.X(bx[0]) - bxc * bx[0];
    byc = (map.D(bx[3]) - map.D(bx[0])) / dx;
    ay = map.D(bx[0]) - byc * bx[0];
  }

  if (depth < MAX_DEPTH) {
    let worst = 0;
    for (let k = 0; k <= 4; k++) {
      const x = xa + ((xb - xa) * k) / 4;
      const ex = Math.abs(map.X(x) - (ax + bxc * x));
      const ey = Math.abs(map.D(x) - (ay + byc * x));
      if (ex > worst) worst = ex;
      if (ey > worst) worst = ey;
    }
    if (worst > WARP_TOL) {
      const lx = splitCubic(bx[0], bx[1], bx[2], bx[3], 0.5);
      const ly = splitCubic(by[0], by[1], by[2], by[3], 0.5);
      warpSegment(out, lx.left, ly.left, map, depth + 1);
      warpSegment(out, lx.right, ly.right, map, depth + 1);
      return;
    }
  }
  pushWarped(out, bx, by, ax, bxc, ay, byc);
}

function warpContour(contour: Contour, map: WarpMap): Contour {
  const out: number[] = [map.X(contour[0]), contour[1] + map.D(contour[0])];
  for (let i = 0; i + 7 < contour.length; i += 6) {
    warpSegment(
      out,
      [contour[i], contour[i + 2], contour[i + 4], contour[i + 6]],
      [contour[i + 1], contour[i + 3], contour[i + 5], contour[i + 7]],
      map,
      0,
    );
  }
  return out;
}

// Phep bien doi duy nhat cua warp: (x, y) -> (X(x), y + D(x)). Ap cho TUNG
// DIEM chu khong tung glyph — net doc (x hang) van thang dung va giu nguyen do
// dai, net ngang uon theo duong cong va bi nen/gian theo do doc.
//
// Thu tu hoanh do giua cac glyph duoc giu nho X DON DIEU, ma tinh don dieu do
// den tu clampPathX. Day la cho yeu hon mo hinh cu: truoc kia hoanh do khong
// bao gio bi ghi nen va cham glyph la bat kha thi ve mat toan hoc; gio no phu
// thuoc mot bat bien do noi khac bao dam.
export function warpContours(shapes: GlyphShape[], map: WarpMap): GlyphShape[] {
  return shapes.map((shape) => ({
    outer: warpContour(shape.outer, map),
    holes: shape.holes.map((hole) => warpContour(hole, map)),
  }));
}
```

- [ ] **Step 4: Chạy test**

Run: `pnpm test src/text/__tests__/warp.test.ts`
Expected: PASS.

- [ ] **Step 5: Đo lại `MAX_DEPTH` ở `curveHeight = 4`**

`MAX_DEPTH = 10` được chọn cho mô hình cũ, tiêu chí một trục, biên độ nhỏ hơn nhiều. Giờ tiêu chí áp cho hai trục và slider lên tới 400 %. **Phải đo, không được chép lại con số.**

Viết script tạm ở thư mục scratchpad (không commit):

```ts
// scratch-depth.ts — chay bang: pnpm exec tsx <path>
import { buildWavePath, buildWarpMap, clampPathX } from './src/text/warp';

const SIZE = { width: 400, height: 120 };
const path = clampPathX(buildWavePath(4, 0.5, 100, SIZE.height));
const map = buildWarpMap(path, SIZE, 60)!;

// Do do sau ma thuat toan TU hoi tu: dem so lan tieu chi sai so con vuot
// nguong o moi muc do sau, tren mot cubic phu het [0, W].
function probe(x0: number, x3: number, depth: number, cap: number): number {
  const bxc = (map.X(x3) - map.X(x0)) / (x3 - x0);
  const ax = map.X(x0) - bxc * x0;
  const byc = (map.D(x3) - map.D(x0)) / (x3 - x0);
  const ay = map.D(x0) - byc * x0;
  let worst = 0;
  for (let k = 0; k <= 4; k++) {
    const x = x0 + ((x3 - x0) * k) / 4;
    worst = Math.max(worst, Math.abs(map.X(x) - (ax + bxc * x)), Math.abs(map.D(x) - (ay + byc * x)));
  }
  if (worst <= 0.05) return depth;
  if (depth >= cap) return -1; // cham tran, CHUA hoi tu
  const mid = (x0 + x3) / 2;
  const l = probe(x0, mid, depth + 1, cap);
  const r = probe(mid, x3, depth + 1, cap);
  return l < 0 || r < 0 ? -1 : Math.max(l, r);
}

for (const cap of [8, 9, 10, 11, 12, 13, 14, 15, 16]) {
  console.log(cap, probe(0, SIZE.width, 0, cap));
}
```

Độ sâu hội tụ thật = giá trị `cap` nhỏ nhất mà `probe` trả về số dương, và giá trị trả về ổn định từ đó trở đi. Đặt `MAX_DEPTH` = độ sâu đó **+ 1** làm biên an toàn. Xoá script sau khi đo.

- [ ] **Step 6: Ghi lại con số đã đo**

Cập nhật hằng `MAX_DEPTH` trong `src/text/warp.ts` (hiện ở dòng 96) với comment ghi rõ con số đo được:

```ts
// Depth <N> la noi thuat toan tu hoi tu theo tieu chi sai so hai truc, do o
// curveHeight = 4 (bien do lon nhat slider cho phep) tren hop 400x120. Depth
// <N+1> la bien an toan mot muc: thap hon thi tran do sau am tham bo qua kiem
// tra sai so, dung loi da tung gap voi MAX_DEPTH = 8 cua mo hinh cu.
const MAX_DEPTH = <N + 1>;
```

Nếu `MAX_DEPTH` mới lớn hơn 10, thêm một test canh:

```ts
  it('curveHeight = 4 van hoi tu duoi WARP_TOL, khong cham tran do sau', () => {
    const size = { width: 400, height: 120 };
    const map = buildWarpMap(clampPathX(buildWavePath(4, 0.5, 100, size.height)), size, 60)!;
    const box = rect(0, 0, 400, 100);
    const out = warpContours([shape(box)], map)[0].outer;
    for (let i = 0; i + 7 < out.length; i += 6) {
      const x0 = out[i];
      const x3 = out[i + 6];
      if (Math.abs(x3 - x0) < 1e-9) continue;
      // Doan da xuat ra phai la doan ma xap xi affine dat nguong — kiem lai
      // bang cach do do lech giua diem giua cua cubic dau ra va anh that.
      const xm = evalCubic(out[i], out[i + 2], out[i + 4], out[i + 6], 0.5);
      const ym = evalCubic(out[i + 1], out[i + 3], out[i + 5], out[i + 7], 0.5);
      expect(Number.isFinite(xm) && Number.isFinite(ym)).toBe(true);
    }
    expect(out.length).toBeGreaterThan(box.length);
  });
```

- [ ] **Step 7: Chạy đủ ba lệnh và commit**

```bash
pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint
```

```bash
pnpm exec prettier --write src/text/warp.ts src/text/__tests__/warp.test.ts
git add src/text/warp.ts src/text/__tests__/warp.test.ts
git commit -m "feat(text): warpContours - chia nho va ap phep affine hai chieu"
```

---

## Task 4: Chuyển `textGeometry` sang pipeline mới, xoá engine cũ

**Files:**
- Modify: `src/text/textGeometry.ts`
- Modify: `src/text/warp.ts` (xoá engine cũ)
- Test: `src/text/__tests__/warp.test.ts`, `src/text/__tests__/textGeometry.test.ts`

**Interfaces:**
- Consumes: `buildWarpMap`, `warpContours` (Task 2, 3), `resolveWarpPath(node, baselineRatio, boxHeight)` (Task 1).
- Produces: `textGeometry` không đổi chữ ký, không đổi `TextGeometry`.

- [ ] **Step 1: Xoá engine cũ khỏi `warp.ts`**

Xoá `buildDisplacement`, `sampleSegment` (bản cũ, đo lệch dọc — **không** xoá nhầm `samplePath` của Task 2), `displaceContours`, `displaceSegment`, `displaceContour`, `pushDisplaced`, và hằng `DISPLACE_TOL`. Giữ `LUT_TOL`, `MAX_DEPTH`, `MIN_DX`, `EPSILON`, `segmentsOf`, `clampPathX`, `buildWavePath`, `Point`, `Segment`.

- [ ] **Step 2: Xoá test của engine cũ**

Trong `src/text/__tests__/warp.test.ts`, xoá trọn `describe('buildDisplacement')` và `describe('displaceContours')`, cùng helper `curveYAt` chỉ phục vụ chúng. Xoá `buildDisplacement`, `displaceContours` khỏi dòng import.

**Giữ lại** ba helper `shape` (dòng ~48), `lineSeg` và `rect` (dòng ~134–152): chúng nằm ngoài hai `describe` bị xoá và các test của Task 2/3/5 đang dùng.

Test `'I4 — khong xoay'`, `'I5 — dinh dang 2 + 6n'`, `'I5 — segment co cuc tri hoanh do'`, `'ap ca cho holes'`, `'chia nho lam tang so segment'` của Task 3 đã thay thế đúng vai trò của các test bị xoá.

- [ ] **Step 3: Nối pipeline mới**

Trong `src/text/textGeometry.ts`, đổi dòng import (dòng 6) và thân `textGeometry` (dòng 85–93):

```ts
import { buildWarpMap, buildWavePath, clampPathX, warpContours } from './warp';
```

```ts
  const path =
    layout.height > 0
      ? resolveWarpPath(node, layout.baselineY / layout.height, layout.height)
      : null;
  // buildWarpMap tra null khi path phang dung tai baseline — khi ay bo qua warp
  // hoan toan de curveHeight = 0 la phep dong nhat TUYET DOI, khong dinh sai so
  // cua bang tra (spec §2.5).
  const map = path
    ? buildWarpMap(path, { width: layout.width, height: layout.height }, layout.baselineY)
    : null;
  const shapes = map ? warpContours(layout.shapes, map) : layout.shapes;

  return { ...layout, shapes, bounds: shapesBounds(shapes) };
```

Cập nhật comment dòng 57–58 (`// paths đã lưu thắng preset. Không còn có 'fit'...`) — câu "chữ không chạy dọc theo cung nữa mà đứng yên theo phương ngang" giờ **sai**. Thay bằng:

```ts
// paths đã lưu thắng preset. Chữ chạy dọc theo cung theo độ dài cung, nhưng
// hệ số k = L/W trong buildWarpMap đã bù lại nên không cần khái niệm `fit`:
// hai mép chữ luôn rơi đúng hai mép hộp.
```

- [ ] **Step 4: Viết lại các test bất biến trong `textGeometry.test.ts`**

Trong `describe('truong dich chuyen doc')` (đổi tên describe thành `'bien doi theo do dai cung'`):

Test `'B2 — hoanh do cua moi glyph khong doi khi curveHeight doi'` — **xoá**. Bất biến này không còn đúng: hoành độ bị ghi lại theo thiết kế.

Test `'B4 — khong sinh chong lan moi: bbox hoanh do tung glyph giu nguyen'` — **thay** bằng:

```ts
  it('I7/I9 — thu tu hoanh do cac glyph giu nguyen, khong chong lan', () => {
    const node = textNode({ text: 'Wave', warp: { type: 'wave', curveHeight: 2 } });
    const { shapes } = textGeometry(node, poppins);
    const ranges = shapes.map((shape) => {
      const xs = shape.outer.filter((_, i) => i % 2 === 0);
      return { min: Math.min(...xs), max: Math.max(...xs) };
    });
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].min).toBeGreaterThanOrEqual(ranges[i - 1].max - 1e-6);
    }
  });
```

Thêm hai test mới đặc trưng cho mô hình arc length:

```ts
  it('I3 — be ngang bbox khong doi khi curveHeight doi', () => {
    const plain = textGeometry(textNode({ text: 'Wave' }), poppins).bounds;
    const plainW = plain.maxX - plain.minX;
    for (const curveHeight of [0.25, 1, 2, 4]) {
      const b = textGeometry(textNode({ text: 'Wave', warp: { type: 'wave', curveHeight } }), poppins)
        .bounds;
      expect(Math.abs(b.maxX - b.minX - plainW)).toBeLessThan(0.5);
    }
  });

  it('I8 — glyph o vung path doc bi nen hep hon glyph o vung path phang', () => {
    // Path phang nua trai, doc len o nua phai. Chu 'H' giong het nhau nen be
    // ngang khac nhau chi co the do phep bien doi gay ra.
    const steep: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.6, out: { x: 0.25, y: 0.6 } },
        { x: 0.5, y: 0.6, in: { x: 0.4, y: 0.6 }, out: { x: 0.55, y: 0.6 } },
        { x: 1, y: -0.9, in: { x: 0.6, y: -0.9 } },
      ],
    };
    const node = textNode({
      text: 'HHHHHHHHH',
      warp: { type: 'wave', curveHeight: 1, paths: [steep] },
    });
    const { shapes } = textGeometry(node, poppins);
    const widthOf = (i: number) => {
      const xs = shapes[i].outer.filter((_, k) => k % 2 === 0);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(widthOf(shapes.length - 1)).toBeLessThan(widthOf(0));
  });
```

Import `WarpPath` vào đầu file test: `import type { TextNode, WarpPath } from '../../schema';`

Test `'B8 — hai dong giu song song'` **giữ nguyên** — `X` và `D` chỉ phụ thuộc `x` nên hai dòng vẫn nhận cùng biến đổi tại cùng hoành độ.

Test `'B7 — contour sau warp van kin va dung dinh dang'` **giữ nguyên**.

Trong `describe('bounds')`, test `'wave lam bounds cao hon hop layout nhung node.size giu nguyen'` **giữ nguyên** (chỉ đổi tên trường đã làm ở Task 1). Nếu ngưỡng `1.3` không còn đạt với công thức biên độ mới, đo lại tỉ số thật rồi đặt ngưỡng dưới nó một khoảng rõ ràng — **không** hạ về mức tautology.

- [ ] **Step 5: Chạy test**

Run: `pnpm test`
Expected: PASS. Test `'wave voi curveHeight = 0 la phep dong nhat'` phải xanh nhờ nhánh `map === null`.

- [ ] **Step 6: Chạy đủ ba lệnh và commit**

```bash
pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint
```

```bash
pnpm exec prettier --write src/text/warp.ts src/text/textGeometry.ts src/text/__tests__/warp.test.ts src/text/__tests__/textGeometry.test.ts
git add src/text/warp.ts src/text/textGeometry.ts src/text/__tests__/warp.test.ts src/text/__tests__/textGeometry.test.ts
git commit -m "feat(text): chuyen warp sang mo hinh arc length, xoa engine dich chuyen doc"
```

---

## Task 5: Đồng bộ `curveHeight` khi kéo handle

Kittl làm việc này trong `setPoints`. Không có nó thì kéo handle xong slider vẫn hiện con số cũ, và lần kéo slider kế tiếp làm hình nhảy.

**Files:**
- Modify: `src/text/warp.ts` (thêm `curveHeightOf`)
- Modify: `src/ui/WarpHandlesOverlay.tsx`
- Test: `src/text/__tests__/warp.test.ts`, `src/ui/__tests__/warpHandles.test.ts`

**Interfaces:**
- Produces: `export function curveHeightOf(path: WarpPath, boxHeight: number, fontSize: number): number`

- [ ] **Step 1: Viết test cho `curveHeightOf`**

Thêm vào `src/text/__tests__/warp.test.ts`, và thêm `curveHeightOf` vào import:

```ts
describe('curveHeightOf', () => {
  it('doc nguoc dung con so da dung de sinh path', () => {
    for (const curve of [0.25, 1, 2.5, 4]) {
      const path = buildWavePath(curve, 0.5, FONT_SIZE, SIZE.height);
      expect(curveHeightOf(path, SIZE.height, FONT_SIZE)).toBeCloseTo(curve, 9);
    }
  });

  it('path phang cho 0', () => {
    const flat = buildWavePath(0, 0.5, FONT_SIZE, SIZE.height);
    expect(curveHeightOf(flat, SIZE.height, FONT_SIZE)).toBe(0);
  });

  it('lay dau theo chieu: diem dau cao hon diem cuoi la duong', () => {
    const up = buildWavePath(1, 0.5, FONT_SIZE, SIZE.height);
    const down = buildWavePath(-1, 0.5, FONT_SIZE, SIZE.height);
    expect(curveHeightOf(up, SIZE.height, FONT_SIZE)).toBeGreaterThan(0);
    expect(curveHeightOf(down, SIZE.height, FONT_SIZE)).toBeLessThan(0);
  });

  it('kep ve khoang slider [-1, 4]', () => {
    const huge = buildWavePath(4, 0.5, FONT_SIZE, SIZE.height);
    const scaled: WarpPath = {
      ...huge,
      anchors: huge.anchors.map((a) => ({
        ...a,
        y: 0.5 + (a.y - 0.5) * 10,
        in: a.in ? { ...a.in, y: 0.5 + (a.in.y - 0.5) * 10 } : undefined,
        out: a.out ? { ...a.out, y: 0.5 + (a.out.y - 0.5) * 10 } : undefined,
      })),
    };
    expect(curveHeightOf(scaled, SIZE.height, FONT_SIZE)).toBe(4);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó hỏng**

Run: `pnpm test src/text/__tests__/warp.test.ts`
Expected: FAIL — `curveHeightOf is not a function`.

- [ ] **Step 3: Cài đặt `curveHeightOf`**

Thêm vào `src/text/warp.ts`, ngay dưới `buildWavePath`:

```ts
// Doc nguoc curveHeight tu mot path bat ky — nghich dao cua buildWavePath ve
// mat bien do. Can khi user keo handle: slider phai theo kip hinh, neu khong
// lan keo slider ke tiep se lam hinh nhay. Kittl lam dung viec nay trong
// setPoints.
//
// Dau lay theo chieu diem dau so voi diem cuoi, dung quy uoc cua buildWavePath
// (a > 0 dat anchor dau CAO hon anchor cuoi theo he toa do y-xuong).
export function curveHeightOf(path: WarpPath, boxHeight: number, fontSize: number): number {
  if (fontSize <= 0 || path.anchors.length < 2) return 0;
  const ys: number[] = [];
  for (const anchor of path.anchors) {
    ys.push(anchor.y);
    if (anchor.in) ys.push(anchor.in.y);
    if (anchor.out) ys.push(anchor.out.y);
  }
  const spread = ((Math.max(...ys) - Math.min(...ys)) * boxHeight) / fontSize;
  const first = path.anchors[0].y;
  const last = path.anchors[path.anchors.length - 1].y;
  const signed = first >= last ? spread : -spread;
  return Math.min(4, Math.max(-1, signed));
}
```

- [ ] **Step 4: Chạy test**

Run: `pnpm test src/text/__tests__/warp.test.ts`
Expected: PASS.

Nếu test dấu hỏng: kiểm lại quy ước. Với `a > 0`, anchor đầu ở `b + a`, anchor cuối ở `b + 0.6a` ⇒ `first > last`. Với `a < 0` thì ngược lại.

- [ ] **Step 5: Nối vào overlay**

Trong `src/ui/WarpHandlesOverlay.tsx`, đổi import và khối dispatch trong `onMove` (dòng 121–133):

```ts
import { clampPathX, curveHeightOf } from '../text/warp';
```

```ts
      const nextPath = clampPathX(movePathPoint(startPath, ref, delta));
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: {
          warp: {
            type: node.warp?.type ?? 'wave',
            // Slider phai theo kip path vua keo, neu khong lan keo slider ke
            // tiep se sinh lai preset tu con so cu va hinh nhay.
            curveHeight: curveHeightOf(nextPath, box.height, node.font.size),
            paths: [nextPath],
          },
        } as Partial<Node>,
      });
```

Và lời gọi `resolveWarpPath` ở dòng 88:

```ts
  const path = resolveWarpPath(node, geometry.baselineY / geometry.height, geometry.height);
```

- [ ] **Step 6: Viết test hồi quy cho overlay**

Thêm vào cuối `src/ui/__tests__/warpHandles.test.ts`:

```ts
describe('dong bo curveHeight khi keo handle', () => {
  it('curveHeightOf tra ve dung bien do cua path sau khi keo', () => {
    const path = clampPathX(buildWavePath(1, 0.5, 100, 120));
    const dragged = clampPathX(
      movePathPoint(path, { anchor: 1, kind: 'anchor' }, { x: 0, y: -0.25 }),
    );
    const before = curveHeightOf(path, 120, 100);
    const after = curveHeightOf(dragged, 120, 100);
    expect(after).not.toBeCloseTo(before, 3);
    expect(after).toBeGreaterThan(before);
  });
});
```

Thêm vào import của file test: `import { buildWavePath, clampPathX, curveHeightOf } from '../../text/warp';` (gộp với dòng import `clampPathX` sẵn có nếu đã tồn tại).

- [ ] **Step 7: Chạy đủ ba lệnh và commit**

```bash
pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint
```

```bash
pnpm exec prettier --write src/text/warp.ts src/ui/WarpHandlesOverlay.tsx src/text/__tests__/warp.test.ts src/ui/__tests__/warpHandles.test.ts
git add src/text/warp.ts src/ui/WarpHandlesOverlay.tsx src/text/__tests__/warp.test.ts src/ui/__tests__/warpHandles.test.ts
git commit -m "feat(text): dong bo curveHeight khi keo handle warp"
```

---

## Task 6: Đối chiếu tài liệu với hành vi đã ship

**Files:**
- Modify: `docs/superpowers/specs/2026-08-17-text-wave-vertical-displacement-design.md`
- Modify: `docs/text-future-work.md`
- Modify: `docs/superpowers/specs/2026-08-17-text-warp-arclength-design.md` (chỉ §4.1 và §7.4)

- [ ] **Step 1: Đánh dấu spec cũ là đã bị thay thế**

Thêm ngay dưới tiêu đề của `2026-08-17-text-wave-vertical-displacement-design.md`:

```markdown
> **ĐÃ BỊ THAY THẾ (2026-08-17)** bởi
> `2026-08-17-text-warp-arclength-design.md`. Mô hình dịch chuyển dọc thuần
> `(x,y) → (x, y+f(x))` không tạo được hiệu ứng nén/giãn cục bộ của Kittl.
> Giữ lại vì phần chứng minh §2.3 (đơn điệu của Bx) và §5.1.2 (affine-exactness)
> vẫn còn hiệu lực và được mô hình mới dùng lại.
```

- [ ] **Step 2: Sửa §4.1 của spec mới cho khớp cài đặt**

Trong `2026-08-17-text-warp-arclength-design.md` §4.1, thay khối tiêu chí phẳng bằng:

```text
flat  ⟺  ∀ t ∈ {¼, ½, ¾}:  khoảng cách vuông góc từ P(t) tới đường thẳng
                            qua hai đầu mút  ≤  LUT_TOL
```

và thêm câu giải thích: so sánh theo tham số `t` với dây cung sẽ coi một đoạn
**thẳng** có tham số hoá không đều là "cong", chia nhỏ tới hết độ sâu mà không
được gì; khoảng cách vuông góc thì độc lập với tham số hoá.

- [ ] **Step 3: Ghi lại `MAX_DEPTH` đã đo vào §7.4**

Thay mục rủi ro 4 bằng con số thật đo được ở Task 3 Step 5, dạng: "Đã đo ở
`curveHeight = 4`: thuật toán tự hội tụ ở depth `<N>`; `MAX_DEPTH` đặt `<N+1>`."

- [ ] **Step 4: Sửa gạch đầu dòng lạc trong `docs/text-future-work.md`**

Mục "Trần của warp geometry (2026-08-16)" còn gạch đầu dòng nhắc
`solveHorizontalScale` — hàm này đã bị xoá từ đợt trước, và cơ chế co ngang giờ
là hệ số `k = L/W` trong `buildWarpMap`. Thay gạch đầu dòng đó bằng:

```markdown
- Bù độ dài bằng hệ số `k = L/W` (`buildWarpMap`) chỉ co theo trục x. Ở
  `curveHeight` lớn, chỗ path dốc có `cos θ` gần 0 nên glyph ở đó bị bóp gần
  như thành vệt dọc. Đó là hành vi của mô hình arc length, Kittl y hệt — không
  phải lỗi. Nếu muốn tránh thì phải co đều hai trục, tức đổi mô hình.
```

Gạch đầu dòng "Envelope warp (hành vi per-point cũ) vẫn là mode tương lai" —
đổi "hành vi per-point cũ" thành "hai path `top`/`bottom`", vì mô hình hiện tại
**đã** là per-point, câu cũ giờ gây hiểu nhầm.

- [ ] **Step 5: Ghi lại phạm vi preset còn thiếu**

Trong mục 5 của `docs/text-future-work.md` (bảng Arch/Rise/Flag/Angle, quanh
dòng 80–92), thêm một dòng dưới bảng:

```markdown
Bảng control point chuẩn hoá của cả bốn preset đã trích xuất sẵn từ Kittl —
xem [kittl-warp-reverse-engineered.md](./kittl-warp-reverse-engineered.md) §4.3.
Engine `buildWarpMap` + `warpContours` đã dùng chung được, nên thêm một preset
chỉ là thêm bảng số vào `buildWavePath` cùng test.
```

`docs/wave-transformation.md` **không cần sửa** — nó chỉ mô tả hình dạng path
(anchor/handle) trên giao diện, không mô tả phép biến đổi.

- [ ] **Step 6: Kiểm tra không còn tham chiếu lạc**

```bash
grep -rn "buildDisplacement\|displaceContours\|intensity\|dich chuyen doc\|vertical displacement" src docs --include=*.ts --include=*.tsx --include=*.md
```

Mọi kết quả còn lại phải nằm trong spec cũ (đã đánh dấu thay thế), trong
`docs/kittl-warp-reverse-engineered.md` (mô tả lịch sử), hoặc trong nhánh bí
danh đọc-vào của `src/schema/warp.ts`. Bất kỳ chỗ nào khác là tham chiếu lạc,
phải sửa.

- [ ] **Step 7: Chạy đủ ba lệnh và commit**

```bash
pnpm test && pnpm exec tsc --noEmit -p tsconfig.build.json && pnpm lint
```

```bash
git add docs/superpowers/specs/2026-08-17-text-wave-vertical-displacement-design.md docs/superpowers/specs/2026-08-17-text-warp-arclength-design.md docs/text-future-work.md
git commit -m "docs(text): doi chieu tai lieu voi mo hinh warp arc length"
```

---

## Bảng đối chiếu bất biến ↔ task

| Bất biến (spec §6) | Task | Test |
|---|---|---|
| I1 `curveHeight = 0` là phép đồng nhất | 2, 4 | `'path phang dung tai baseline tra null'`, `'wave voi curveHeight = 0 la phep dong nhat'` |
| I2 `X(0) = 0`, `\|X(W) − W\| < 0.1` | 2 | `'X ghim dung hai mep hop'` |
| I3 Bề ngang bbox không đổi | 4 | `'I3 — be ngang bbox khong doi khi curveHeight doi'` |
| I4 Không xoay | 3 | `'I4 — khong xoay'` |
| I5 Contour vẫn kín | 3 | hai test `'I5 — …'` |
| I6 Sai số ≤ `WARP_TOL` | 3 | `'I6 — sai so hinh bi chan boi WARP_TOL'` |
| I7 `X` không giảm | 2, 4 | `'X khong giam tren [0, W]'`, `'I7/I9 — thu tu hoanh do…'` |
| I8 Nén cục bộ | 4 | `'I8 — glyph o vung path doc bi nen hep hon'` |
| I9 Không chồng lấn glyph | 4 | `'I7/I9 — thu tu hoanh do…'` |
