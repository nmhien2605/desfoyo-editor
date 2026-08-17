import type { Font } from 'opentype.js';
import type { TextNode, WarpPath } from '../schema';
import { evalCubic, extrema } from './bezier';
import type { GlyphShape } from './glyphOutlines';
import { layoutText } from './layout';
import { buildDisplacement, buildWavePath, clampPathX, displaceContours } from './warp';

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

// paths đã lưu thắng preset. Không còn có `fit`: chữ không chạy dọc theo cung
// nữa mà đứng yên theo phương ngang, nên không bao giờ phải ép path vừa chữ.
export function resolveWarpPath(node: TextNode, baselineRatio: number): WarpPath | null {
  const warp = node.warp;
  if (!warp || warp.type === 'none') return null;

  // clampPathX ap dung vo dieu kien cho ca hai nhanh: path tu buildWavePath da
  // full-span/don dieu san nen clamp la no-op, nhung path `stored` co the tu
  // tai lieu cu (span hep do co che fit-to-arc-length truoc day, hoac chua
  // tung qua UI moi co clampPathX) — khong clamp thi buildDisplacement se
  // nhan mot f() phang o hai dau hoac roi vao nhanh phong thu khong don dieu.
  const stored = warp.paths?.find((path) => path.role === 'baseline');
  if (stored) return stored.anchors.length >= 2 ? clampPathX(stored) : null;

  if (warp.type === 'wave') return clampPathX(buildWavePath(warp.intensity, baselineRatio));
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
  const shapes = path
    ? displaceContours(
        layout.shapes,
        buildDisplacement(path, { width: layout.width, height: layout.height }, layout.baselineY),
      )
    : layout.shapes;

  return { ...layout, shapes, bounds: shapesBounds(shapes) };
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
