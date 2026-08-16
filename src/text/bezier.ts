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
