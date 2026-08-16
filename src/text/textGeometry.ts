import type { Font } from 'opentype.js';
import type { TextNode, WarpPath } from '../schema';
import type { GlyphShape } from './glyphOutlines';
import type { TextLayout } from './layout';
import { layoutText } from './layout';
import type { PathSampler } from './warp';
import {
  bakeScale,
  buildPathSampler,
  buildWavePath,
  placeOnPath,
  solveHorizontalScale,
} from './warp';

export interface TextGeometry {
  shapes: GlyphShape[];
  // Kích thước text *chưa warp*. Đây cũng là mẫu số chuẩn hoá của warp path,
  // nên nó phải độc lập với warp — nếu lấy bbox sau warp thì path lại phụ
  // thuộc chính kết quả của nó, thành vòng lặp phản hồi.
  width: number;
  height: number;
  baselineY: number;
}

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
