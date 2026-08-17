# Text Wave — Vertical Displacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi warp của text từ "đặt glyph cứng lên path theo tiếp tuyến" sang "trường dịch chuyển dọc `(x, y) → (x, y + f(x))`", theo `docs/superpowers/specs/2026-08-17-text-wave-vertical-displacement-design.md`.

**Architecture:** `f(x)` là độ lệch dọc của warp path tại hoành độ `x`, dựng thành bảng tra bằng chia đôi đệ quy theo sai lệch **dọc**. Mỗi segment cubic của outline được chia nhỏ tới khi `f` gần affine trên đó, rồi áp `y' = y + L(x)` lên cả 4 control point — chính xác tuyệt đối khi `L` affine (cơ sở Bernstein tổng bằng 1), nên outline vẫn là polybezier, không phải flatten. `L` **nội suy `f` tại hai đầu mút on-curve** (không phải dây cung trên khoảng hoành độ) để mối nối giữa các segment khớp chính xác.

**Tech Stack:** TypeScript, Vitest, opentype.js, Pixi v8, React.

## Global Constraints

- Chạy mọi lệnh trong worktree `/Users/mihi/Documents/work/desfoyo/editor/.claude/worktrees/text-foundation-wave`. KHÔNG `cd` ra repo gốc.
- KHÔNG chạy `pnpm format` / `prettier --write .` trên cả repo. Chỉ format đúng các file mình sửa: `pnpm exec prettier --write <đường-dẫn-cụ-thể>`.
- KHÔNG `git add -A` / `git add .`. Chỉ stage đúng file liệt kê trong task.
- KHÔNG dùng `git stash` trần — stack stash dùng chung với worktree khác.
- Mỗi task phải xanh cả ba: `pnpm test`, `pnpm exec tsc --noEmit -p tsconfig.build.json`, `pnpm lint`. Vitest transpile-only nên test xanh KHÔNG chứng minh type đúng — luôn chạy `tsc`.
- Comment trong code viết tiếng Việt không dấu **hoặc** có dấu theo đúng file đang sửa (bám phong cách file hiện có). Giải thích *tại sao*, không mô tả lại code.
- Hằng số dùng đúng giá trị trong plan này: `LUT_TOL = 0.01`, `DISPLACE_TOL = 0.05`, `MAX_DEPTH = 10`, `MIN_DX = 1e-6`. (`MAX_DEPTH` sửa từ 8 lên 10 sau khi phát hiện lỗi thật trong Task 2: đo trên path dốc cực đoan — cùng anchor cách nhau `Δx ≈ 8px` nhưng `Δy ≈ 90px` — 84/151 mẫu chạm trần độ sâu 8 và bị chấp nhận "phẳng" dù chưa đạt `LUT_TOL`, không liên quan đến số điểm kiểm tra flatness. Đo thực nghiệm: độ sâu 9 đã đủ để thuật toán tự hội tụ đúng theo tiêu chí của chính nó — không nhờ trần; chọn 10 làm biên an toàn, chi phí thêm không đáng kể vì đệ quy dừng sớm hơn trần.)
- Không thêm dependency mới.

---

### Task 1: `bezier.ts` — `extrema` + `splitCubic`

Hai primitive dùng chung cho cả bbox lẫn thuật toán dịch chuyển. `extrema` đang là hàm private trong `textGeometry.ts`; chuyển lên đây, không sửa nội dung.

**Files:**
- Modify: `src/text/bezier.ts`
- Modify: `src/text/textGeometry.ts` (xoá `extrema` cục bộ, import từ `bezier`)
- Test: `src/text/__tests__/bezier.test.ts` (tạo mới)

**Interfaces:**
- Consumes: `evalCubic`, `evalD1` (đã có trong `bezier.ts`)
- Produces:
  - `export type Cubic = [number, number, number, number];`
  - `export function extrema(p0: number, c1: number, c2: number, p3: number): number[];`
  - `export function splitCubic(p0: number, c1: number, c2: number, p3: number, t: number): { left: Cubic; right: Cubic };`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/text/__tests__/bezier.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { evalCubic, evalD1, extrema, splitCubic } from '../bezier';

describe('extrema', () => {
  it('cung don dieu theo mot truc thi khong co cuc tri trong (0,1)', () => {
    expect(extrema(0, 1, 2, 3)).toEqual([]);
  });

  it('nghiem tra ve dung la cho B1(t) = 0', () => {
    const roots = extrema(0, 4, 1, 3);
    expect(roots).toHaveLength(2);
    for (const t of roots) {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(1);
      expect(evalD1(0, 4, 1, 3, t)).toBeCloseTo(0, 9);
    }
  });

  it('nhanh tuyen tinh khi he so bac hai trieu tieu', () => {
    // a = -p0 + 3c1 - 3c2 + p3 = 0 + 3 - 3 + 0 = 0 => B1 la da thuc bac 1.
    expect(extrema(0, 1, 1, 0)).toEqual([0.5]);
  });

  it('cung vuot ra ngoai khoang hai dau mut: cuc tri nam ngoai [p0, p3]', () => {
    // x cua segment nay cham 20 trong khi hai dau mut chi la 0 va 10.
    const roots = extrema(0, 30, 20, 10);
    const xs = roots.map((t) => evalCubic(0, 30, 20, 10, t));
    expect(Math.max(...xs)).toBeGreaterThan(10);
  });
});

describe('splitCubic', () => {
  it('hai nua bieu dien CHINH XAC cung goc', () => {
    const [p0, c1, c2, p3] = [1, 7, -3, 5];
    const { left, right } = splitCubic(p0, c1, c2, p3, 0.3);
    for (let k = 0; k <= 10; k++) {
      const s = k / 10;
      expect(evalCubic(left[0], left[1], left[2], left[3], s)).toBeCloseTo(
        evalCubic(p0, c1, c2, p3, 0.3 * s),
        9,
      );
      expect(evalCubic(right[0], right[1], right[2], right[3], s)).toBeCloseTo(
        evalCubic(p0, c1, c2, p3, 0.3 + 0.7 * s),
        9,
      );
    }
  });

  it('diem noi dung bang nhau o hai nua', () => {
    const { left, right } = splitCubic(1, 7, -3, 5, 0.42);
    expect(left[3]).toBe(right[0]);
  });

  it('giu nguyen hai dau mut goc', () => {
    const { left, right } = splitCubic(1, 7, -3, 5, 0.42);
    expect(left[0]).toBe(1);
    expect(right[3]).toBe(5);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

```bash
pnpm exec vitest run src/text/__tests__/bezier.test.ts
```

Expected: FAIL — `extrema`/`splitCubic` chưa được export từ `../bezier`.

- [ ] **Step 3: Thêm hai hàm vào `src/text/bezier.ts`**

Thêm vào cuối file:

```ts
export type Cubic = [number, number, number, number];

// Nghiem cua B'(t) = 0 trong (0,1), tuc cac cuc tri cua cung tren mot truc.
// B'(t)/3 = at² + bt + c. Chuyen len day tu textGeometry.ts: gio ca bbox lan
// displaceContours (warp.ts) deu can khoang gia tri that cua mot segment.
export function extrema(p0: number, c1: number, c2: number, p3: number): number[] {
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

// de Casteljau: tach cubic tai t. Hai nua bieu dien cung goc CHINH XAC (khong
// phai xap xi), nen chia nho bao nhieu lan cung khong lam sai hinh.
export function splitCubic(
  p0: number,
  c1: number,
  c2: number,
  p3: number,
  t: number,
): { left: Cubic; right: Cubic } {
  const a = p0 + (c1 - p0) * t;
  const b = c1 + (c2 - c1) * t;
  const c = c2 + (p3 - c2) * t;
  const d = a + (b - a) * t;
  const e = b + (c - b) * t;
  const m = d + (e - d) * t;
  return { left: [p0, a, d, m], right: [m, e, c, p3] };
}
```

- [ ] **Step 4: Xoá `extrema` cục bộ trong `textGeometry.ts`**

Xoá nguyên khối hàm `function extrema(...)` (kèm comment `// Nghiệm của B'(t) = 0 ...` ngay trên nó), và đổi dòng import:

```ts
import { evalCubic, extrema } from './bezier';
```

Không đụng gì khác trong file.

- [ ] **Step 5: Chạy đủ ba lệnh**

```bash
pnpm test
```

```bash
pnpm exec tsc --noEmit -p tsconfig.build.json
```

```bash
pnpm lint
```

Expected: tất cả PASS. Test cũ của `shapesBounds` phải vẫn xanh — `extrema` chuyển chỗ chứ không đổi hành vi.

- [ ] **Step 6: Commit**

```bash
git add src/text/bezier.ts src/text/textGeometry.ts src/text/__tests__/bezier.test.ts
git commit -m "feat(text): them splitCubic va chuyen extrema len bezier.ts"
```

---

### Task 2: `buildDisplacement` — bảng tra `f(x)`

Dựng `f(x) = curveY(x) − baselineY`. Bảng `(x, y)` sinh bằng chia đôi đệ quy tới khi sai lệch **dọc** giữa cung và dây cung theo hoành độ của nó dưới `LUT_TOL`.

Vì sao đo theo phương dọc chứ không dùng lại công thức `n = ceil(sqrt(0.75·M/TOL))` của bản cũ: cận đó chặn khoảng cách **vuông góc**, còn bảng này được tra theo `x` nên cái phải chặn là sai lệch **dọc**; hai đại lượng lệch nhau hệ số `1/cos θ` theo độ dốc, path dốc thì cận vuông góc không còn nói gì về sai số thật.

**Files:**
- Modify: `src/text/warp.ts` (chỉ THÊM; chưa xoá gì)
- Test: `src/text/__tests__/warp.test.ts` (thêm describe mới, không sửa test cũ)

**Interfaces:**
- Consumes: `evalCubic`, `splitCubic`, `Cubic` từ `./bezier`; `Size`, `WarpPath` từ `../schema`
- Produces: `export function buildDisplacement(path: WarpPath, size: Size, baselineY: number): (x: number) => number;`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/text/__tests__/warp.test.ts`:

```ts
// Nghich dao doc lap: tim t sao cho Bx(t) = x bang chia doi, roi tra By(t).
// Khong dung lai code cua buildDisplacement — day la ban doi chieu.
function curveYAt(path: WarpPath, size: { width: number; height: number }, x: number): number {
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const px = [from.x, (from.out ?? from).x, (to.in ?? to).x, to.x].map((v) => v * size.width);
    const py = [from.y, (from.out ?? from).y, (to.in ?? to).y, to.y].map((v) => v * size.height);
    if (x < px[0] || x > px[3]) continue;
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 80; k++) {
      const m = (lo + hi) / 2;
      if (evalCubic(px[0], px[1], px[2], px[3], m) < x) lo = m;
      else hi = m;
    }
    return evalCubic(py[0], py[1], py[2], py[3], (lo + hi) / 2);
  }
  throw new Error(`x = ${x} nam ngoai path`);
}

describe('buildDisplacement', () => {
  it('path phang dung tai baseline cho f = 0 TUYET DOI', () => {
    const f = buildDisplacement(buildWavePath(0, 0.5), SIZE, 50);
    for (let x = -50; x <= 450; x += 25) expect(f(x)).toBe(0);
  });

  it('path phang lech baseline cho hang so dung bang do lech', () => {
    const f = buildDisplacement(flatPath(0.8), SIZE, 50);
    expect(f(0)).toBeCloseTo(30, 9);
    expect(f(123.4)).toBeCloseTo(30, 9);
    expect(f(400)).toBeCloseTo(30, 9);
  });

  it('kep ve gia tri dau mut khi x ra ngoai khoang', () => {
    const f = buildDisplacement(buildWavePath(1, 0.5), SIZE, 50);
    expect(f(-100)).toBe(f(0));
    expect(f(900)).toBe(f(400));
  });

  it('khop duong cong that duoi 0.011px tren preset wave', () => {
    const path = buildWavePath(1, 0.5);
    const f = buildDisplacement(path, SIZE, 50);
    for (let x = 0; x <= 400; x += 4) {
      expect(Math.abs(f(x) - (curveYAt(path, SIZE, x) - 50))).toBeLessThan(0.011);
    }
  });

  it('path DOC: sai so do theo phuong DOC van duoi nguong', () => {
    // Handle keo gan het bien do dung trong mot doan x rat hep => cung cuc doc.
    // Day la truong hop can vuong goc noi doi tra: no van bao 0.01px trong khi
    // sai so doc lon hon nhieu lan.
    const steep: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.05, out: { x: 0.02, y: 0.95 } },
        { x: 1, y: 0.95, in: { x: 0.98, y: 0.05 } },
      ],
    };
    const f = buildDisplacement(steep, SIZE, 50);
    for (let x = 0; x <= 400; x += 2) {
      expect(Math.abs(f(x) - (curveYAt(steep, SIZE, x) - 50))).toBeLessThan(0.011);
    }
  });

  it('path duoi 2 anchor cho f = 0', () => {
    const single: WarpPath = { role: 'baseline', closed: false, anchors: [{ x: 0, y: 0.5 }] };
    expect(buildDisplacement(single, SIZE, 50)(100)).toBe(0);
  });
});
```

Thêm `evalCubic` vào import của file test:

```ts
import { evalCubic } from '../bezier';
```

và `buildDisplacement` vào danh sách import từ `../warp`.

- [ ] **Step 2: Chạy test để xác nhận fail**

```bash
pnpm exec vitest run src/text/__tests__/warp.test.ts
```

Expected: FAIL — `buildDisplacement is not a function`.

- [ ] **Step 3: Cài đặt trong `src/text/warp.ts`**

Đổi dòng import đầu file thành:

```ts
import { type Cubic, evalCubic, evalD1, evalD2, evalD3, splitCubic } from './bezier';
```

Thêm khối sau vào cuối file:

```ts
const LUT_TOL = 0.01; // px — sai lech DOC toi da giua cung va day cung theo x
const MAX_DEPTH = 10;

// Day mau cuoi cua mot cung vao bang, chia doi cho toi khi day cung du sat.
// Chi day dau mut PHAI: dau mut trai da nam trong bang tu buoc truoc.
function sampleSegment(xs: number[], ys: number[], bx: Cubic, by: Cubic, depth: number): void {
  const dx = bx[3] - bx[0];
  let flat = true;
  if (depth < MAX_DEPTH && Math.abs(dx) > EPSILON) {
    const slope = (by[3] - by[0]) / dx;
    for (let k = 1; k < 4 && flat; k++) {
      const t = k / 4;
      const x = evalCubic(bx[0], bx[1], bx[2], bx[3], t);
      const y = evalCubic(by[0], by[1], by[2], by[3], t);
      if (Math.abs(y - (by[0] + slope * (x - bx[0]))) > LUT_TOL) flat = false;
    }
  }
  if (flat) {
    xs.push(bx[3]);
    ys.push(by[3]);
    return;
  }
  const lx = splitCubic(bx[0], bx[1], bx[2], bx[3], 0.5);
  const ly = splitCubic(by[0], by[1], by[2], by[3], 0.5);
  sampleSegment(xs, ys, lx.left, ly.left, depth + 1);
  sampleSegment(xs, ys, lx.right, ly.right, depth + 1);
}

// f(x) = do lech doc cua warp path tai hoanh do x, tinh tu baseline phang.
// intensity = 0 cho path nam dung tai baseline nen f = 0 tuyet doi — warp
// tro thanh phep dong nhat, khong con sai so lam tron nao.
export function buildDisplacement(
  path: WarpPath,
  size: Size,
  baselineY: number,
): (x: number) => number {
  const xs: number[] = [];
  const ys: number[] = [];
  const segments = segmentsOf(path, size);
  segments.forEach((s, i) => {
    if (i === 0) {
      xs.push(s.p0.x);
      ys.push(s.p0.y);
    }
    sampleSegment(
      xs,
      ys,
      [s.p0.x, s.c1.x, s.c2.x, s.p3.x],
      [s.p0.y, s.c1.y, s.c2.y, s.p3.y],
      0,
    );
  });
  if (xs.length === 0) return () => 0;

  // Phong thu: path quat nguoc (le ra da bi UI chan, xem spec §2.3) lam bang
  // het don dieu, nhi phan mat nghia. Suy giam muot bang cach quet tim mau co
  // x gan nhat, thay vi tra ra rac.
  let monotone = true;
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] < xs[i - 1]) {
      monotone = false;
      break;
    }
  }

  return (x: number): number => {
    if (!monotone) {
      let best = 0;
      for (let i = 1; i < xs.length; i++) {
        if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
      }
      return ys[best] - baselineY;
    }
    if (x <= xs[0]) return ys[0] - baselineY;
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1] - baselineY;

    let low = 0;
    let high = xs.length - 1;
    while (high - low > 1) {
      const mid = (low + high) >> 1;
      if (xs[mid] <= x) low = mid;
      else high = mid;
    }
    const span = xs[high] - xs[low];
    const k = span < EPSILON ? 0 : (x - xs[low]) / span;
    return ys[low] + (ys[high] - ys[low]) * k - baselineY;
  };
}
```

`segmentsOf` và `EPSILON` đã có sẵn trong file — dùng lại, không viết bản thứ hai.

- [ ] **Step 4: Chạy test để xác nhận pass**

```bash
pnpm exec vitest run src/text/__tests__/warp.test.ts
```

Expected: PASS, kể cả toàn bộ test cũ của sampler/bakeScale.

- [ ] **Step 5: Chạy đủ ba lệnh**

```bash
pnpm test
```

```bash
pnpm exec tsc --noEmit -p tsconfig.build.json
```

```bash
pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add src/text/warp.ts src/text/__tests__/warp.test.ts
git commit -m "feat(text): buildDisplacement — bang tra do lech doc theo hoanh do"
```

---

### Task 3: `displaceContours` — chia nhỏ tới affine rồi áp lên control point

Lõi toán của spec. Với mỗi segment cubic:

1. `L` **nội suy `f` tại hai đầu mút on-curve** — `L(p0.x) = f(p0.x)`, `L(p3.x) = f(p3.x)`. Đây là điều kiện để mối nối giữa hai segment kề khớp chính xác và contour vẫn kín tuyệt đối. **Không** dùng dây cung trên khoảng hoành độ `[xa, xb]`: segment có cực trị hoành độ (mọi điểm trái nhất/phải nhất của `o`, `e`, `c`, `S`) có `p0.x` nằm hẳn trong `(xa, xb)`, khi đó dây cung cho `L(p0.x) ≠ f(p0.x)` ⇒ contour hở và gãy khúc tới `2·DISPLACE_TOL`.
2. Đo sai số trên **toàn khoảng hoành độ thật** `[xa, xb]` = hai đầu mút cộng cực trị của `Bx` — khoảng này có thể rộng hơn `[p0.x, p3.x]`, ở phần vượt ra `L` là ngoại suy nên sai số lớn hơn.
3. Vượt `DISPLACE_TOL` thì chia đôi tại `t = 0.5` và đệ quy.
4. Đạt thì áp `y' = y + L(x)` lên cả 4 control point — chính xác tuyệt đối vì cơ sở Bernstein tổng bằng 1.

**Files:**
- Modify: `src/text/warp.ts` (chỉ THÊM)
- Test: `src/text/__tests__/warp.test.ts` (thêm describe mới)

**Interfaces:**
- Consumes: `extrema`, `evalCubic`, `splitCubic`, `Cubic` từ `./bezier`; `Contour`, `GlyphShape` từ `./glyphOutlines`
- Produces: `export function displaceContours(shapes: GlyphShape[], f: (x: number) => number): GlyphShape[];`

**Lưu ý cho người cài đặt:** ở thời điểm task này, `GlyphShape` VẪN còn hai trường `anchorX`/`baselineY` (Task 5 mới xoá). Dùng `...shape` khi tạo shape mới để `tsc` xanh; Task 5 sẽ bỏ spread đó.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/text/__tests__/warp.test.ts`:

```ts
// Dung mot doan thang bang cubic voi control point chia deu — dung cach
// commandsToContours dang lam, nen contour test giong contour that.
function lineSeg(out: number[], x0: number, y0: number, x1: number, y1: number): void {
  out.push(
    x0 + (x1 - x0) / 3,
    y0 + (y1 - y0) / 3,
    x0 + (2 * (x1 - x0)) / 3,
    y0 + (2 * (y1 - y0)) / 3,
    x1,
    y1,
  );
}

function rect(x0: number, y0: number, x1: number, y1: number): number[] {
  const c = [x0, y0];
  lineSeg(c, x0, y0, x1, y0);
  lineSeg(c, x1, y0, x1, y1);
  lineSeg(c, x1, y1, x0, y1);
  lineSeg(c, x0, y1, x0, y0);
  return c;
}

const wavy = (x: number) => 12 * Math.sin(x / 25);

describe('displaceContours', () => {
  it('f = 0 la phep dong nhat, khong chia nho gi', () => {
    const box = rect(10, 20, 60, 80);
    const [out] = displaceContours([shape(box, 35, 80)], () => 0);
    expect(out.outer).toEqual(box);
  });

  it('B2 — hoanh do khong bao gio bi ghi', () => {
    // Cong hang so vao f khong lam doi sai so tuyen tinh hoa (alpha dich theo,
    // beta giu nguyen) => hai lan chay chia nho y HET nhau. Vay hoanh do phai
    // trung dung bit, con tung do lech dung bang hang so do.
    const box = rect(10, 20, 60, 80);
    const a = displaceContours([shape(box, 35, 80)], wavy)[0].outer;
    const b = displaceContours([shape(box, 35, 80)], (x) => wavy(x) + 1000)[0].outer;
    expect(b.length).toBe(a.length);
    for (let i = 0; i < a.length; i += 2) {
      expect(b[i]).toBe(a[i]);
      expect(b[i + 1] - a[i + 1]).toBeCloseTo(1000, 9);
    }
  });

  it('B3 — net doc van doc va giu nguyen do dai', () => {
    // Canh phai cua hop: x = 60 co dinh, y chay tu 20 xuong 80.
    const box = rect(10, 20, 60, 80);
    const out = displaceContours([shape(box, 35, 80)], wavy)[0].outer;
    const onRightEdge = [];
    for (let i = 0; i < out.length; i += 2) {
      if (Math.abs(out[i] - 60) < 1e-9) onRightEdge.push(out[i + 1]);
    }
    expect(onRightEdge.length).toBeGreaterThanOrEqual(2);
    // Ca canh nhan cung mot do lech => hieu y giua hai dau van dung 60.
    expect(Math.max(...onRightEdge) - Math.min(...onRightEdge)).toBeCloseTo(60, 9);
  });

  it('B7 — dinh dang 2 + 6n va contour kin TUYET DOI', () => {
    const box = rect(10, 20, 60, 80);
    const out = displaceContours([shape(box, 35, 80)], wavy)[0].outer;
    expect((out.length - 2) % 6).toBe(0);
    expect(out[out.length - 2]).toBe(out[0]);
    expect(out[out.length - 1]).toBe(out[1]);
  });

  it('B11 — segment co cuc tri hoanh do van khop chinh xac o moi noi', () => {
    // Segment cuoi vong sang phai toi x ~ 15 roi quay ve x = 0, tuc p0.x = 10
    // nam han trong (xa, xb). Day cung tren [xa, xb] se lam diem dong lech
    // khoi diem mo; noi suy dau mut thi khong.
    const c = [0, 0];
    lineSeg(c, 0, 0, 10, 0);
    lineSeg(c, 10, 0, 10, 20);
    c.push(30, 25, -15, 5, 0, 0);
    const out = displaceContours([shape(c, 5, 20)], wavy)[0].outer;
    expect(out[0]).toBe(0);
    expect(out[1]).toBeCloseTo(wavy(0), 12);
    expect(out[out.length - 2]).toBe(out[0]);
    expect(out[out.length - 1]).toBe(out[1]);
  });

  it('B6 — sai so tuyen tinh hoa bi chan boi DISPLACE_TOL', () => {
    // Lay mau day tren ket qua roi tru f(x): moi diem phai roi ve dung mot
    // canh ngang cua hop goc (y = 20 hoac y = 80) trong pham vi DISPLACE_TOL.
    // Canh doc thi x hang nen bo qua.
    const box = rect(10, 20, 60, 80);
    const out = displaceContours([shape(box, 35, 80)], wavy)[0].outer;
    for (let i = 0; i + 7 < out.length; i += 6) {
      const vertical = Math.abs(out[i + 6] - out[i]) < 1e-9;
      if (vertical) continue;
      for (let k = 0; k <= 20; k++) {
        const t = k / 20;
        const x = evalCubic(out[i], out[i + 2], out[i + 4], out[i + 6], t);
        const y = evalCubic(out[i + 1], out[i + 3], out[i + 5], out[i + 7], t);
        const y0 = y - wavy(x);
        expect(Math.min(Math.abs(y0 - 20), Math.abs(y0 - 80))).toBeLessThan(0.051);
      }
    }
  });

  it('chia nho lam tang so segment tren f cong manh', () => {
    const box = rect(10, 20, 60, 80);
    const out = displaceContours([shape(box, 35, 80)], wavy)[0].outer;
    expect(out.length).toBeGreaterThan(box.length);
  });

  it('ap ca cho holes', () => {
    const outer = rect(0, 0, 100, 100);
    const hole = rect(30, 30, 70, 70);
    const [out] = displaceContours(
      [{ outer, holes: [hole], anchorX: 50, baselineY: 100 }],
      wavy,
    );
    expect(out.holes).toHaveLength(1);
    expect(out.holes[0]).not.toEqual(hole);
    expect(out.holes[0][0]).toBe(30);
  });
});
```

Thêm `displaceContours` vào import từ `../warp`.

- [ ] **Step 2: Chạy test để xác nhận fail**

```bash
pnpm exec vitest run src/text/__tests__/warp.test.ts
```

Expected: FAIL — `displaceContours is not a function`.

- [ ] **Step 3: Cài đặt trong `src/text/warp.ts`**

Bổ sung `extrema` vào import từ `./bezier`. Thêm vào cuối file:

```ts
const DISPLACE_TOL = 0.05; // px
// Duoi nguong nay, (f(x3) - f(x0))/dx bi nhieu cua bang LUT nuot chung — he
// so goc thanh rac. Dung hang so f(p0.x) thay the: van khop moi noi vi hai
// dau mut cach nhau duoi MIN_DX nen f o hai ben lech khong dang ke.
const MIN_DX = 1e-6;

// Ap phep affine L(x) = alpha + beta·x len ca 4 control point. Chinh xac
// TUYET DOI khi L affine: co so Bernstein co tong bang 1 nen hang so alpha co
// control point deu bang alpha, con beta·Bx co control point beta·(cp x). Vay
// By + L(Bx) co control point thu i dung bang c_i.y + L(c_i.x).
//
// Chi day 3 diem (c1, c2, p3): diem mo dau da do nguoi goi ghi.
function pushDisplaced(out: number[], bx: Cubic, by: Cubic, alpha: number, beta: number): void {
  for (let i = 1; i < 4; i++) out.push(bx[i], by[i] + alpha + beta * bx[i]);
}

function displaceSegment(
  out: number[],
  bx: Cubic,
  by: Cubic,
  f: (x: number) => number,
  depth: number,
): void {
  // Khoang hoanh do THAT cua segment: hai dau mut cong cac cuc tri cua Bx.
  // Rong hon [p0.x, p3.x] o nhung segment vong lai — do chinh la cho L phai
  // ngoai suy, nen phai do sai so o day chu khong chi giua hai dau mut.
  let xa = Math.min(bx[0], bx[3]);
  let xb = Math.max(bx[0], bx[3]);
  for (const t of extrema(bx[0], bx[1], bx[2], bx[3])) {
    const x = evalCubic(bx[0], bx[1], bx[2], bx[3], t);
    if (x < xa) xa = x;
    if (x > xb) xb = x;
  }

  const dx = bx[3] - bx[0];
  // L NOI SUY f tai hai dau mut on-curve (khong phai day cung tren [xa, xb]):
  // diem noi hai segment ke nhau duoc luu MOT lan trong Contour, hai ben phai
  // cho cung mot gia tri tai hoanh do do thi contour moi kin va khong gay khuc.
  let beta: number;
  let alpha: number;
  if (Math.abs(dx) < MIN_DX) {
    beta = 0;
    alpha = f(bx[0]);
  } else {
    beta = (f(bx[3]) - f(bx[0])) / dx;
    alpha = f(bx[0]) - beta * bx[0];
  }

  if (depth < MAX_DEPTH) {
    let worst = 0;
    for (let k = 0; k <= 4; k++) {
      const x = xa + ((xb - xa) * k) / 4;
      const d = Math.abs(f(x) - (alpha + beta * x));
      if (d > worst) worst = d;
    }
    if (worst > DISPLACE_TOL) {
      const lx = splitCubic(bx[0], bx[1], bx[2], bx[3], 0.5);
      const ly = splitCubic(by[0], by[1], by[2], by[3], 0.5);
      displaceSegment(out, lx.left, ly.left, f, depth + 1);
      displaceSegment(out, lx.right, ly.right, f, depth + 1);
      return;
    }
  }
  pushDisplaced(out, bx, by, alpha, beta);
}

function displaceContour(contour: Contour, f: (x: number) => number): Contour {
  const out: number[] = [contour[0], contour[1] + f(contour[0])];
  for (let i = 0; i + 7 < contour.length; i += 6) {
    displaceSegment(
      out,
      [contour[i], contour[i + 2], contour[i + 4], contour[i + 6]],
      [contour[i + 1], contour[i + 3], contour[i + 5], contour[i + 7]],
      f,
      0,
    );
  }
  return out;
}

// Phep bien doi duy nhat cua warp: (x, y) -> (x, y + f(x)). Ap cho TUNG DIEM
// chu khong tung glyph — net doc (x hang) dich deu nen van thang dung va giu
// nguyen do dai, net ngang uon theo duong cong.
//
// Hoanh do khong bao gio bi ghi, nen khoang cach ngang giua hai glyph luon
// dung advance tu nhien => va cham glyph bat kha thi ve mat toan hoc.
export function displaceContours(shapes: GlyphShape[], f: (x: number) => number): GlyphShape[] {
  return shapes.map((shape) => ({
    ...shape,
    outer: displaceContour(shape.outer, f),
    holes: shape.holes.map((hole) => displaceContour(hole, f)),
  }));
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

```bash
pnpm exec vitest run src/text/__tests__/warp.test.ts
```

Expected: PASS.

Nếu `B11` fail: kiểm lại rằng `alpha`/`beta` được dựng từ `f(bx[0])`/`f(bx[3])` chứ không từ `f(xa)`/`f(xb)` — đó đúng là lỗi mà test này canh.

- [ ] **Step 5: Chạy đủ ba lệnh**

```bash
pnpm test
```

```bash
pnpm exec tsc --noEmit -p tsconfig.build.json
```

```bash
pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add src/text/warp.ts src/text/__tests__/warp.test.ts
git commit -m "feat(text): displaceContours — chia nho toi affine roi ap len control point"
```

---

### Task 4: Chuyển pipeline sang trường dịch chuyển, xoá bộ máy arc-length

Task đổi hành vi. Sau task này text warp chạy theo phương án mới và toàn bộ code arc-length biến mất.

**Files:**
- Modify: `src/text/textGeometry.ts`
- Modify: `src/text/warp.ts` (xoá phần cũ)
- Modify: `src/text/bezier.ts` (xoá `evalD2`, `evalD3`)
- Modify: `src/ui/WarpHandlesOverlay.tsx` (đổi sang `resolveWarpPath`)
- Test: `src/text/__tests__/textGeometry.test.ts`, `src/text/__tests__/warp.test.ts`

**Interfaces:**
- Consumes: `buildDisplacement`, `displaceContours` (Task 2, 3)
- Produces:
  - `export function resolveWarpPath(node: TextNode, baselineRatio: number): WarpPath | null;` — **đổi kiểu trả về**, không còn `{ path, fit }`
  - `resolveWarpGeometry` bị xoá hẳn

- [ ] **Step 1: Viết test thất bại**

Trong `src/text/__tests__/textGeometry.test.ts`, bốn nhóm sửa:

**(a) Xoá thứ đã hết tồn tại.** Xoá nguyên `describe('bake he so co', ...)` và test `'resolveWarpPath danh dau preset la fit, path da luu la khong fit'`. Xoá `resolveWarpGeometry` khỏi import từ `../textGeometry`, và xoá dòng `import { bakeScale, buildWavePath, placeOnPath, solveHorizontalScale } from '../warp';` (thay bằng `import { buildDisplacement } from '../warp';` nếu Step này cần — xem (d)).

**(b) `resolveWarpPath` không còn bọc trong object.** Ba chỗ đang đọc `?.path` / `.path` đổi thành đọc thẳng:

```ts
    const path = resolveWarpPath(textNode({ warp: { type: 'wave', intensity: 0.5 } }), 0.8);
    expect(path?.anchors).toHaveLength(3);
```

Áp cùng cách cho test `'uu tien paths da luu hon preset'` và `'bo qua paths co duoi 2 anchor'`.

**(c) Xoá test tính cứng — nó SẼ đỏ và phải đỏ.** Test `'wave bao toan hinh hoc tung glyph'` khẳng định **mọi** khoảng cách trong một glyph được bảo toàn. Đó là tính chất của phép xoay cứng, và đúng là thứ phương án C đánh đổi có chủ đích (spec §7 trần #1: nét ngang uốn theo đường cong). Xoá nó.

Không viết bản thay thế ở tầng này: chia nhỏ làm số phần tử của contour đổi nên không so được theo chỉ số với bản chưa warp. Tính chất còn lại được phủ ở hai chỗ khác — B2 dưới đây kiểm trên font thật rằng hoành độ từng glyph không đổi, và B3 (Task 3) kiểm trên contour dựng sẵn rằng nét dọc giữ nguyên độ dài.

**(d) Thêm `describe` mới:**

```ts
describe('truong dich chuyen doc', () => {
  it('B2 — hoanh do cua moi glyph khong doi khi intensity doi', () => {
    const plain = textGeometry(textNode({ warp: { type: 'wave', intensity: 0 } }), poppins);
    const warped = textGeometry(textNode({ warp: { type: 'wave', intensity: 1 } }), poppins);
    expect(warped.shapes).toHaveLength(plain.shapes.length);
    warped.shapes.forEach((shape, i) => {
      const xsA = shape.outer.filter((_, k) => k % 2 === 0);
      const xsB = plain.shapes[i].outer.filter((_, k) => k % 2 === 0);
      expect(Math.min(...xsA)).toBeCloseTo(Math.min(...xsB), 9);
      expect(Math.max(...xsA)).toBeCloseTo(Math.max(...xsB), 9);
    });
  });

  it('B4 — khong sinh chong lan moi: bbox hoanh do tung glyph giu nguyen', () => {
    // Path cuc doan: keo anchor dau xuong that sau.
    const extreme = textNode({
      warp: {
        type: 'wave',
        intensity: 1,
        paths: [
          {
            role: 'baseline',
            closed: false,
            anchors: [
              { x: 0, y: 1.63, out: { x: 0.2, y: 1.63 } },
              { x: 0.5, y: 0.8, in: { x: 0.35, y: 1.2 }, out: { x: 0.65, y: 0.5 } },
              { x: 1, y: 1.0, in: { x: 0.75, y: 0.3 } },
            ],
          },
        ],
      },
    });
    const plain = textGeometry(textNode({}), poppins);
    const warped = textGeometry(extreme, poppins);
    warped.shapes.forEach((shape, i) => {
      const xsA = shape.outer.filter((_, k) => k % 2 === 0);
      const xsB = plain.shapes[i].outer.filter((_, k) => k % 2 === 0);
      expect(Math.min(...xsA)).toBeCloseTo(Math.min(...xsB), 9);
      expect(Math.max(...xsA)).toBeCloseTo(Math.max(...xsB), 9);
    });
  });

  it('B8 — hai dong giu song song: hieu y tai cung hoanh do dung bang lineStep', () => {
    const node = textNode({ text: 'no\nno', warp: { type: 'wave', intensity: 1 } });
    const geometry = textGeometry(node, poppins);
    const half = geometry.shapes.length / 2;
    const lineStep = node.font.size * node.lineHeight;
    for (let i = 0; i < half; i++) {
      const a = geometry.shapes[i].outer;
      const b = geometry.shapes[i + half].outer;
      expect(a.length).toBe(b.length);
      for (let k = 0; k < a.length; k += 2) {
        expect(a[k]).toBeCloseTo(b[k], 9);
        expect(b[k + 1] - a[k + 1]).toBeCloseTo(lineStep, 6);
      }
    }
  });

  it('B7 — contour sau warp van kin va dung dinh dang', () => {
    const geometry = textGeometry(textNode({ warp: { type: 'wave', intensity: 1 } }), poppins);
    for (const shape of geometry.shapes) {
      for (const contour of [shape.outer, ...shape.holes]) {
        expect((contour.length - 2) % 6).toBe(0);
        expect(contour[contour.length - 2]).toBe(contour[0]);
        expect(contour[contour.length - 1]).toBe(contour[1]);
      }
    }
  });

});
```

`textNode(...)` và `poppins` là helper/biến có sẵn ở đầu file test — dùng lại, không viết mới.

B5 (baseline bám đường cong) không lặp lại ở tầng này: nó chính là test `'khop duong cong that duoi 0.011px tren preset wave'` của Task 2, đo trực tiếp trên `f` bằng bản nghịch đảo độc lập.

Trong `src/text/__tests__/warp.test.ts`: xoá các `describe` `'buildPathSampler'`, `'placeOnPath'`, `'bakeScale'`, `'solveHorizontalScale'`, `'sampler chinh xac'`, hàm `referenceLength`, hàm `shape(...)` nếu không còn ai dùng, và các import tương ứng. Giữ nguyên `describe('buildWavePath')`, `buildDisplacement`, `displaceContours`.

- [ ] **Step 2: Chạy test để xác nhận fail**

```bash
pnpm exec vitest run src/text/__tests__/textGeometry.test.ts
```

Expected: FAIL — `resolveWarpPath` vẫn trả `{ path, fit }`, và geometry vẫn theo phép xoay nên B2/B4/B8 sai.

- [ ] **Step 3: Viết lại `textGeometry.ts`**

Đổi import đầu file:

```ts
import { buildDisplacement, buildWavePath, displaceContours } from './warp';
```

Xoá import `PathSampler`, `TextLayout` (nếu không còn dùng), `bakeScale`, `buildPathSampler`, `placeOnPath`, `solveHorizontalScale`.

Thay `resolveWarpPath` bằng:

```ts
// paths da luu thang preset. Khong con co `fit`: chu khong chay doc theo cung
// nua ma dung yen theo phuong ngang, nen khong bao gio phai ep path vua chu.
export function resolveWarpPath(node: TextNode, baselineRatio: number): WarpPath | null {
  const warp = node.warp;
  if (!warp || warp.type === 'none') return null;

  const stored = warp.paths?.find((path) => path.role === 'baseline');
  if (stored) return stored.anchors.length >= 2 ? stored : null;

  if (warp.type === 'wave') return buildWavePath(warp.intensity, baselineRatio);
  return null;
}
```

Xoá nguyên hàm `resolveWarpGeometry` (kèm comment trên nó).

Thay thân `textGeometry` phần sau `layoutText(...)` bằng:

```ts
  const path = layout.height > 0 ? resolveWarpPath(node, layout.baselineY / layout.height) : null;
  const shapes = path
    ? displaceContours(
        layout.shapes,
        buildDisplacement(
          path,
          { width: layout.width, height: layout.height },
          layout.baselineY,
        ),
      )
    : layout.shapes;

  return { ...layout, shapes, bounds: shapesBounds(shapes) };
```

- [ ] **Step 4: Xoá bộ máy cũ trong `warp.ts` và `bezier.ts`**

Trong `src/text/warp.ts` xoá: `PathSampler` (interface), `FLATNESS_TOL`, `MIN_STEPS`, `MAX_STEPS`, `stepsFor`, `pointAt`, `tangentAt`, `arcLength`, `buildPathSampler`, `placeOnPath`, `bakeScale`, `MIN_SCALE`, `LENGTH_TOL`, `solveHorizontalScale`.

Giữ: `Point`, `Segment`, `segmentsOf`, `EPSILON`, `buildWavePath`, và toàn bộ phần Task 2/3.

Đổi import đầu file thành:

```ts
import { type Cubic, evalCubic, extrema, splitCubic } from './bezier';
```

Trong `src/text/bezier.ts` xoá `evalD2` và `evalD3` (chỉ `tangentAt` dùng, mà `tangentAt` vừa bị xoá). Kiểm chứng trước khi xoá:

```bash
grep -rn "evalD2\|evalD3" src
```

Expected sau khi xoá: không còn kết quả nào ngoài file test nếu có — nếu test nào còn dùng thì xoá test đó cùng.

- [ ] **Step 5: Sửa `WarpHandlesOverlay.tsx` (mức tối thiểu)**

Đổi import:

```ts
import { resolveWarpPath, textGeometry } from '../text/textGeometry';
```

Thay hai dòng:

```ts
  const resolved = resolveWarpGeometry(node, geometry);
  if (!resolved) return null;
  const path = resolved.path;
```

bằng:

```ts
  const path = resolveWarpPath(node, geometry.baselineY / geometry.height);
  if (!path) return null;
```

Sửa hai comment nhắc tới "bake hệ số co" (một trên `const resolved`, một trong `startDrag`) — không còn khái niệm bake, path hiển thị chính là path được lưu.

- [ ] **Step 6: Chạy đủ ba lệnh**

```bash
pnpm test
```

```bash
pnpm exec tsc --noEmit -p tsconfig.build.json
```

```bash
pnpm lint
```

Expected: PASS. Regression phải vẫn xanh: kerning, fill-rule `nonzero`, lỗ chữ `o`/`e`, bbox chính xác, khung chọn khi xoay, text rỗng không co về 0.

- [ ] **Step 7: Commit**

```bash
git add src/text/textGeometry.ts src/text/warp.ts src/text/bezier.ts src/ui/WarpHandlesOverlay.tsx src/text/__tests__/textGeometry.test.ts src/text/__tests__/warp.test.ts
git commit -m "feat(text): warp chuyen sang truong dich chuyen doc, xoa bo may arc-length"
```

---

### Task 5: Bỏ `anchorX`/`baselineY` khỏi `GlyphShape`

Hai trường này chỉ phục vụ phép xoay per-glyph, giờ thành dữ liệu chết. Trường dịch chuyển toàn cục không cần biết ranh giới glyph.

**Files:**
- Modify: `src/text/glyphOutlines.ts`
- Modify: `src/text/layout.ts`
- Modify: `src/text/warp.ts` (bỏ `...shape` trong `displaceContours`)
- Test: `src/text/__tests__/glyphOutlines.test.ts`, `src/text/__tests__/layout.test.ts`, `src/text/__tests__/warp.test.ts`

**Interfaces:**
- Produces: `export interface GlyphShape { outer: Contour; holes: Contour[]; }`

- [ ] **Step 1: Xoá test của hai trường đã chết**

Trong `src/text/__tests__/glyphOutlines.test.ts`: xoá nguyên `describe('neo glyph', ...)` (hai test `anchorX là trung điểm advance...` và `anchorX dùng advance TỰ NHIÊN...`).

Trong `src/text/__tests__/layout.test.ts`: xoá nguyên `describe('neo tuyet doi', ...)`.

Trong `src/text/__tests__/warp.test.ts`: sửa helper `shape(...)` thành:

```ts
function shape(points: number[]): GlyphShape {
  return { outer: points, holes: [] };
}
```

và bỏ hai tham số thừa ở mọi chỗ gọi; test `'ap ca cho holes'` bỏ `anchorX`/`baselineY` khỏi object literal.

Trong `src/text/__tests__/textGeometry.test.ts`: test `'bat cuc tri nam ngoai bao loi cac diem on-curve'` dựng `GlyphShape` bằng object literal — bỏ hai trường:

```ts
    const bounds = shapesBounds([{ outer: [0, 0, 0, -100, 100, -100, 100, 0], holes: [] }]);
```

Đây là chỗ chỉ `tsc` bắt được, `pnpm test` sẽ xanh dù chưa sửa (vitest transpile-only) — nên phải chạy `tsc` ở Step 6.

- [ ] **Step 2: Chạy test để xác nhận fail**

```bash
pnpm exec tsc --noEmit -p tsconfig.build.json
```

Expected: FAIL — `GlyphShape` vẫn đòi `anchorX`/`baselineY`.

- [ ] **Step 3: Sửa `glyphOutlines.ts`**

Rút gọn interface (xoá cả hai comment mô tả hai trường):

```ts
export interface GlyphShape {
  outer: Contour;
  holes: Contour[];
}
```

Đổi chữ ký và thân `groupIntoShapes`:

```ts
function groupIntoShapes(contours: Contour[]): GlyphShape[] {
```

và dòng tạo shape:

```ts
    if (Math.sign(areas[i]) === outerSign) shapes.push({ outer: contour, holes: [] });
```

Trong `getGlyphOutlines`, bỏ đối số thứ hai:

```ts
      shapes: groupIntoShapes(commandsToContours(glyph.getPath(0, 0, fontSize).commands)),
```

`advance` vẫn phải tính trước vòng lặp kerning như cũ — không đụng tới.

- [ ] **Step 4: Sửa `layout.ts`**

Trong vòng lặp đẩy shape, bỏ hai dòng gán:

```ts
        shapes.push({
          outer: translateContour(shape.outer, penX, baseline),
          holes: shape.holes.map((hole) => translateContour(hole, penX, baseline)),
        });
```

- [ ] **Step 5: Bỏ spread trong `displaceContours`**

Trong `src/text/warp.ts`:

```ts
  return shapes.map((shape) => ({
    outer: displaceContour(shape.outer, f),
    holes: shape.holes.map((hole) => displaceContour(hole, f)),
  }));
```

- [ ] **Step 6: Chạy đủ ba lệnh**

```bash
pnpm test
```

```bash
pnpm exec tsc --noEmit -p tsconfig.build.json
```

```bash
pnpm lint
```

Expected: PASS. Nếu `tsc` còn báo chỗ nào đọc `anchorX`/`baselineY`, xoá luôn chỗ đó — không còn nơi hợp lệ nào dùng hai trường này.

- [ ] **Step 7: Commit**

```bash
git add src/text/glyphOutlines.ts src/text/layout.ts src/text/warp.ts src/text/__tests__/glyphOutlines.test.ts src/text/__tests__/layout.test.ts src/text/__tests__/warp.test.ts src/text/__tests__/textGeometry.test.ts
git commit -m "refactor(text): bo anchorX/baselineY khoi GlyphShape"
```

---

### Task 6: Kẹp hoành độ khi kéo handle

`f(x)` chỉ xác định khi path là hàm của `x`. Kẹp cả anchor lẫn handle mỗi lần kéo.

Điều kiện này **đủ**, có chứng minh: chuẩn hoá `p0.x = 0`, `p3.x = 1`, `c1.x = u`, `c2.x = v`, thì `Bx'(t)/3` là dạng Bernstein bậc hai với hệ số `a = u`, `b = v − u`, `c = 1 − v`; dạng đó không âm trên `[0,1]` khi `a, c ≥ 0` và (`b ≥ 0` hoặc `b² ≤ ac`). Kẹp cho `u, v ∈ [0,1]` nên `a, c ≥ 0`; còn `(u−v)² − u(1−v) ≤ 0` trên cả hình vuông (điểm dừng trong tại `(2/3, 1/3)` cho `−1/3`, bốn cạnh đều `≤ 0`). Vậy `Bx' ≥ 0`.

Vì `clampPathX` chạy trên **toàn** path mỗi lần kéo nên handle của hai anchor lân cận cũng tự được kẹp lại sau khi anchor di chuyển — đúng yêu cầu spec §2.3.

**Files:**
- Modify: `src/ui/WarpHandlesOverlay.tsx`
- Test: `src/ui/__tests__/warpHandles.test.ts`

**Interfaces:**
- Produces: `export function clampPathX(path: WarpPath): WarpPath;`

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/ui/__tests__/warpHandles.test.ts`:

```ts
import { evalD1 } from '../../text/bezier';

function isMonotoneX(path: WarpPath): boolean {
  for (let i = 0; i < path.anchors.length - 1; i++) {
    const from = path.anchors[i];
    const to = path.anchors[i + 1];
    const p0 = from.x;
    const c1 = (from.out ?? from).x;
    const c2 = (to.in ?? to).x;
    const p3 = to.x;
    for (let k = 0; k <= 200; k++) {
      if (evalD1(p0, c1, c2, p3, k / 200) < -1e-12) return false;
    }
  }
  return true;
}

describe('clampPathX', () => {
  it('ghim hai mep o 0 va 1', () => {
    const moved = movePathPoint(buildWavePath(0.5, 0.8), { anchor: 0, kind: 'anchor' }, {
      x: 0.3,
      y: 0,
    });
    const clamped = clampPathX(moved);
    expect(clamped.anchors[0].x).toBe(0);
    expect(clamped.anchors[clamped.anchors.length - 1].x).toBe(1);
  });

  it('anchor giua khong vuot qua anchor phai', () => {
    const moved = movePathPoint(buildWavePath(0.5, 0.8), { anchor: 1, kind: 'anchor' }, {
      x: 0.9,
      y: 0,
    });
    const clamped = clampPathX(moved);
    expect(clamped.anchors[1].x).toBeLessThanOrEqual(clamped.anchors[2].x);
  });

  it('handle bi keo vuot ra ngoai segment thi bi kep ve bien', () => {
    const moved = movePathPoint(buildWavePath(0.5, 0.8), { anchor: 0, kind: 'out' }, {
      x: 2,
      y: 0,
    });
    const clamped = clampPathX(moved);
    expect(clamped.anchors[0].out!.x).toBeLessThanOrEqual(clamped.anchors[1].x);
    expect(clamped.anchors[0].out!.x).toBeGreaterThanOrEqual(clamped.anchors[0].x);
  });

  it('keo anchor xong thi handle KE cua anchor lan can cung duoc kep lai', () => {
    // Keo anchor giua sang trai qua khoi handle `out` cua anchor 0 (x = 0.2).
    const moved = movePathPoint(buildWavePath(0.5, 0.8), { anchor: 1, kind: 'anchor' }, {
      x: -0.4,
      y: 0,
    });
    const clamped = clampPathX(moved);
    expect(clamped.anchors[0].out!.x).toBeLessThanOrEqual(clamped.anchors[1].x);
  });

  it('B10 — path sau khi kep luon don dieu theo x', () => {
    const drags: { anchor: number; kind: 'anchor' | 'in' | 'out' }[] = [
      { anchor: 1, kind: 'anchor' },
      { anchor: 0, kind: 'out' },
      { anchor: 2, kind: 'in' },
      { anchor: 1, kind: 'in' },
    ];
    for (const ref of drags) {
      for (const dx of [-3, -0.7, 0.7, 3]) {
        const path = clampPathX(movePathPoint(buildWavePath(1, 0.8), ref, { x: dx, y: 0.2 }));
        expect(isMonotoneX(path)).toBe(true);
      }
    }
  });

  it('khong dung toi tung do', () => {
    const before = buildWavePath(0.5, 0.8);
    const after = clampPathX(before);
    before.anchors.forEach((anchor, i) => {
      expect(after.anchors[i].y).toBe(anchor.y);
      expect(after.anchors[i].in?.y).toBe(anchor.in?.y);
      expect(after.anchors[i].out?.y).toBe(anchor.out?.y);
    });
  });
});
```

Thêm `clampPathX` vào import từ `../WarpHandlesOverlay`, và `buildWavePath` từ `../../text/warp` nếu chưa có.

- [ ] **Step 2: Chạy test để xác nhận fail**

```bash
pnpm exec vitest run src/ui/__tests__/warpHandles.test.ts
```

Expected: FAIL — `clampPathX is not a function`.

- [ ] **Step 3: Cài đặt `clampPathX`**

Thêm vào `src/ui/WarpHandlesOverlay.tsx`, ngay dưới `movePathPoint`:

```ts
// f(x) chi xac dinh khi path la ham cua x. Dieu kien du: hoanh do anchor khong
// giam, va hai handle cua moi segment nam trong khoang hoanh do cua segment do
// — khi ay Bx'(t)/3 la dang Bernstein bac hai voi ca ba he so thoa a, c >= 0 va
// b² <= ac, nen Bx' >= 0 (spec §2.3).
//
// Chay tren TOAN path moi lan keo, nen keo mot anchor cung tu dong kep lai
// handle ke cua hai anchor lan can.
export function clampPathX(path: WarpPath): WarpPath {
  const anchors = path.anchors.map((anchor) => ({ ...anchor }));
  const last = anchors.length - 1;
  if (last < 1) return path;

  // Hai mep ghim o 0 va 1 de f phu tron [0, width].
  anchors[0].x = 0;
  for (let i = 1; i <= last; i++) anchors[i].x = Math.max(anchors[i].x, anchors[i - 1].x);
  anchors[last].x = 1;
  for (let i = last - 1; i >= 1; i--) anchors[i].x = Math.min(anchors[i].x, anchors[i + 1].x);

  for (let i = 0; i < last; i++) {
    const lo = anchors[i].x;
    const hi = anchors[i + 1].x;
    const clamp = (v: number) => Math.min(Math.max(v, lo), hi);
    const out = anchors[i].out;
    if (out) anchors[i].out = { ...out, x: clamp(out.x) };
    const into = anchors[i + 1].in;
    if (into) anchors[i + 1].in = { ...into, x: clamp(into.x) };
  }

  return { ...path, anchors };
}
```

- [ ] **Step 4: Nối vào luồng kéo**

Trong `startDrag` → `onMove`, đổi một dòng:

```ts
      const nextPath = clampPathX(movePathPoint(startPath, ref, delta));
```

- [ ] **Step 5: Chạy test để xác nhận pass**

```bash
pnpm exec vitest run src/ui/__tests__/warpHandles.test.ts
```

Expected: PASS.

- [ ] **Step 6: Chạy đủ ba lệnh**

```bash
pnpm test
```

```bash
pnpm exec tsc --noEmit -p tsconfig.build.json
```

```bash
pnpm lint
```

- [ ] **Step 7: Commit**

```bash
git add src/ui/WarpHandlesOverlay.tsx src/ui/__tests__/warpHandles.test.ts
git commit -m "feat(text): kep hoanh do handle de path luon la ham cua x"
```

---

## Đối chiếu spec

| Mục spec | Task |
| --- | --- |
| §2.1 trường dịch chuyển dọc | 3, 4 |
| §2.2 xoá arc-length | 4 |
| §2.3 path là hàm của x + chứng minh | 6 |
| §2.4 affine chính xác trên control point | 3 |
| §4.2 `GlyphShape` bỏ hai trường neo | 5 |
| §5.1.1 `buildDisplacement` | 2 |
| §5.1.2 `displaceContours` | 3 |
| §5.2 `extrema` + `splitCubic`, xoá `evalD2`/`evalD3` | 1, 4 |
| §5.3 `layout.ts` | 5 |
| §5.4 `glyphOutlines.ts` | 5 |
| §5.5 `textGeometry.ts` | 4 |
| §5.6 `textRenderer.ts`/`svgSerializer.ts` không đổi | — (không task nào chạm vào) |
| §5.7 `WarpHandlesOverlay.tsx` | 4, 6 |
| §5.8 `SelectionOverlay.tsx` không đổi | — |
| B1 | 4 (test cũ `intensity = 0` giữ nguyên) |
| B2 | 3, 4 |
| B3 | 3 |
| B4 | 4 |
| B5 | 2 (`khop duong cong that duoi 0.011px`) |
| B6 | 3 |
| B7 | 3, 4 |
| B8 | 4 |
| B9 | 4 (test `node.size không đổi` giữ nguyên) |
| B10 | 6 |
| B11 | 3 |
