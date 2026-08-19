import type { Font } from 'opentype.js';
import type { CircleParams, TextNode, WarpPath } from '../schema';
import { evalCubic, extrema } from './bezier';
import { warpContoursCircle } from './circleWarp';
import type { GlyphShape } from './glyphOutlines';
import { layoutText, type TextLayout } from './layout';
import {
  buildAnglePath,
  buildArchPath,
  buildFlagPath,
  buildRisePath,
  buildWarpMap,
  buildWavePath,
  clampPathX,
  warpContours,
} from './warp';

export interface TextGeometry {
  shapes: GlyphShape[];
  // Kích thước text *chưa warp*, TÍNH CẢ letterSpacing — dùng để đo (hiển thị
  // số đo) và làm sàn cho node rỗng, KHÔNG dùng làm nguồn node.size nữa khi
  // đang warp (xem pivotWidth bên dưới).
  width: number;
  advanceWidth: number;
  // Width nên dùng để đồng bộ node.size (nguồn pivot của applyTransform.ts).
  // Khi CÓ warp thực sự (path/circle đã áp dụng), bằng advanceWidth — vì hình
  // đã warp neo theo advanceWidth (hoặc fontSize, với circle đã lưu), không
  // đổi theo letterSpacing; nếu pivot vẫn đồng bộ theo `width` (letterSpacing-
  // inclusive) thì pivot trôi theo letterSpacing còn hình thì đứng yên, tạo ra
  // lệch pha khiến CẢ NODE (bao gồm hình đã warp) nhìn như bị dịch chuyển mỗi
  // lần đổi letterSpacing — dù bản thân hình không đổi kích thước hay vị trí
  // cục bộ. Khi KHÔNG warp, bằng `width` như cũ (nội dung phẳng thật sự giãn
  // theo letterSpacing, pivot phải theo kịp mới đúng khung chọn/pivot).
  pivotWidth: number;
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

// paths đã lưu thắng preset. Chữ chạy dọc theo cung theo đúng độ dài cung của
// chính nó (buildWarpMap không còn hệ số k = L/W ép khớp bề rộng W — ký tự
// giữ nguyên kích thước bất kể path dài/ngắn). Nếu path ngắn hơn W, phần text
// vượt quá bị buildWarpMap + clipContourAtX cắt bỏ hẳn, không hiển thị.
//
// 5 preset (wave/arch/rise/flag/angle) dùng chung buildWarpMap/warpContours —
// khác nhau đúng một chỗ: hàm sinh path ban đầu (buildXxxPath trong warp.ts).
export function resolveWarpPath(
  node: TextNode,
  baselineRatio: number,
  boxHeight: number,
): WarpPath | null {
  const warp = node.warp;
  if (!warp || warp.type === 'none') return null;

  // clampPathX ap dung vo dieu kien cho ca hai nhanh: path tu buildWavePath da
  // full-span/don dieu san nen clamp la no-op, nhung path `stored` co the tu
  // tai lieu cu (span hep do co che fit-to-arc-length truoc day, hoac chua
  // tung qua UI moi co clampPathX) — khong clamp thi buildWarpMap se nhan mot
  // bang tra khong phu tron [0, width] hoac khong don dieu.
  const stored = warp.paths?.find((path) => path.role === 'baseline');
  if (stored) return stored.anchors.length >= 2 ? clampPathX(stored) : null;

  const { curveHeight } = warp;
  const size = node.font.size;
  if (warp.type === 'wave') return clampPathX(buildWavePath(curveHeight, baselineRatio, size, boxHeight));
  if (warp.type === 'arch') return clampPathX(buildArchPath(curveHeight, baselineRatio, size, boxHeight));
  if (warp.type === 'rise') return clampPathX(buildRisePath(curveHeight, baselineRatio, size, boxHeight));
  if (warp.type === 'flag') return clampPathX(buildFlagPath(curveHeight, baselineRatio, size, boxHeight));
  if (warp.type === 'angle') return clampPathX(buildAnglePath(curveHeight, baselineRatio, size, boxHeight));
  return null;
}

// Circle dung rigid-transform-per-glyph (xem circleWarp.ts), khong phai
// WarpPath — nen can ham resolve rieng, khong dung chung voi resolveWarpPath.
// Pham vi hien tai: chi 1 dong (hanh vi nhieu dong tren Circle chua duoc do
// tren Kittl that — xem docs/kittl-circle-reverse-engineered.md §7). Neu
// node.text co '\n' thi tra null, textGeometry() se roi ve layout phang
// khong warp (giong het cach cac warp.type chua build khac dang bi bo qua).
//
// centerX/centerY/radius LUON chuan hoa theo node.font.size (khong phai
// layout.width/height) — de mot khi da luu (keo handle), Circle DONG BANG
// tuyet doi: khong doi theo letterSpacing lan noi dung text, chi doi qua
// keo handle. Circle khong co co che clip (khac warp family — text dai hon
// chu vi thi chong len chinh no, xem docs/kittl-circle-reverse-engineered.md
// §6) nen khong the dua vao clip lam luoi an toan nhu warp family — phai
// dong bang triet de hon.
export function resolveCircleParams(
  node: TextNode,
  layout: Pick<TextLayout, 'advanceWidth' | 'height'>,
): CircleParams | null {
  const warp = node.warp;
  if (!warp || warp.type !== 'circle') return null;
  if (node.text.includes('\n')) return null;
  if (warp.circle) return warp.circle;
  const fontSize = node.font.size;
  if (fontSize <= 0) return null;
  // Preset (chua keo handle): muc tieu pixel la cx=0.5*advanceWidth (giua hop
  // THEO NOI DUNG, khong tinh letterSpacing), cy=0.5*height, r=advanceWidth/pi
  // (quyet dinh rieng, Kittl khong lo cong thuc that — xem implement.md). Quy
  // doi ca 3 ve don vi fontSize de denormalize o textGeometry() luon dung MOT
  // cong thuc (*fontSize) cho ca preset lan da luu, khong phai re nhanh.
  return {
    centerX: (0.5 * layout.advanceWidth) / fontSize,
    centerY: (0.5 * layout.height) / fontSize,
    radius: layout.advanceWidth / Math.PI / fontSize,
  };
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

  const circleParams = resolveCircleParams(node, layout);
  let shapes: GlyphShape[];
  let warped: boolean;
  if (circleParams) {
    shapes = warpContoursCircle(layout.shapes, layout.shapePivotX, layout.baselineY, {
      cx: circleParams.centerX * node.font.size,
      cy: circleParams.centerY * node.font.size,
      r: circleParams.radius * node.font.size,
      directionInverted: node.warp?.directionInverted ?? false,
    });
    warped = true;
  } else {
    const result = warpShapesFromPath(node, layout);
    shapes = result.shapes;
    warped = result.warped;
  }

  const pivotWidth = warped ? layout.advanceWidth : layout.width;
  return { ...layout, shapes, pivotWidth, bounds: shapesBounds(shapes) };
}

function warpShapesFromPath(
  node: TextNode,
  layout: TextLayout,
): { shapes: GlyphShape[]; warped: boolean } {
  const path =
    layout.height > 0
      ? resolveWarpPath(node, layout.baselineY / layout.height, layout.height)
      : null;
  // buildWarpMap tra null khi path phang dung tai baseline — khi ay bo qua warp
  // hoan toan de curveHeight = 0 la phep dong nhat TUYET DOI, khong dinh sai so
  // cua bang tra (spec §2.5).
  // advanceWidth (khong tinh letterSpacing), khong phai width — de letterSpacing
  // chi giai cach ky tu tren path, khong keo dai/thu ngan chinh path.
  const map = path
    ? buildWarpMap(path, { width: layout.advanceWidth, height: layout.height }, layout.baselineY)
    : null;
  return map
    ? { shapes: warpContours(layout.shapes, map), warped: true }
    : { shapes: layout.shapes, warped: false };
}

// Dùng bởi UI để giữ node.size khớp với nội dung sau khi sửa chữ/font —
// node.size là nguồn cho pivot (applyTransform.ts) và cho khung chọn
// (SelectionOverlay.tsx dùng bounds thật khi có warp, nhưng pivot luôn đọc
// node.size), nên không được để nó lệch khỏi text thật.
//
// Dùng pivotWidth (KHÔNG phải width) — xem giải thích ở TextGeometry.pivotWidth:
// khi có warp, letterSpacing không còn được phép đổi node.size.width nữa, nếu
// không pivot trôi trong khi hình warp (đã cố định theo advanceWidth/fontSize)
// đứng yên, làm cả node nhìn như bị dịch chuyển mỗi lần đổi letterSpacing.
//
// Sàn chiều rộng: text rỗng đo ra width = 0, mà khung chọn rộng 0 thì không
// click trúng được nữa — node sẽ chỉ chọn được qua LayersPanel. Sàn này chỉ
// áp cho node.size, không đụng tới hình học thật mà textGeometry trả về.
export function measureText(node: TextNode, font: Font): { width: number; height: number } {
  const { pivotWidth, height } = textGeometry(node, font);
  return { width: Math.max(pivotWidth, node.font.size * 0.5), height };
}
