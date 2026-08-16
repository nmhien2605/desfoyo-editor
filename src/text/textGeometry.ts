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
    shapes: warpShapes(layout.shapes, sampler, {
      width: layout.width,
      baselineY: layout.baselineY,
    }),
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
