// Đánh giá cubic Bezier và đạo hàm bậc 1 của nó, trên MỘT trục (gọi hai lần
// cho x và y). Tách ra vì hai nơi cần: diện tích có dấu (glyphOutlines.ts),
// và bbox chính xác (textGeometry.ts).

export function evalCubic(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

export function evalD1(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return 3 * (u * u * (b - a) + 2 * u * t * (c - b) + t * t * (d - c));
}

export type Cubic = [number, number, number, number];

// Nghiệm của B'(t) = 0 trong (0,1), tức các cực trị của cung trên một trục.
// B'(t)/3 = at² + bt + c. Chuyển lên đây từ textGeometry.ts: giờ cả bbox lẫn
// displaceContours (warp.ts) đều cần khoảng giá trị thực của một segment.
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

// de Casteljau: tách cubic tại t. Hai nửa biểu diễn cung gốc CHÍNH XÁC (không
// phải xấp xỉ), nên chia nhỏ bao nhiêu lần cũng không làm sai hình.
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
