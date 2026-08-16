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
  const toPx = (p: { x: number; y: number }): Point => ({
    x: p.x * size.width,
    y: p.y * size.height,
  });
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
    distances.push(
      distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y),
    );
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

function warpContour(
  contour: Contour,
  sampler: PathSampler,
  box: { width: number; baselineY: number },
): Contour {
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
