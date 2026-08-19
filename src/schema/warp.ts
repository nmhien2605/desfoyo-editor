import { z } from 'zod';

// Toạ độ chuẩn hoá 0..1 theo bbox của node, cùng quy ước ImageNode.crop dùng
// — path không phải tính lại khi node đổi kích thước. Giá trị có thể vượt
// ngoài [0, 1]: biên độ wave lớn đẩy path ra ngoài hộp, đó là chủ ý.
const PointSchema = z.object({ x: z.number(), y: z.number() });

export const WarpAnchorSchema = z.object({
  x: z.number(),
  y: z.number(),
  in: PointSchema.optional(),
  out: PointSchema.optional(),
});
export type WarpAnchor = z.infer<typeof WarpAnchorSchema>;

// role là chỗ chừa cho envelope warp về sau: thêm path 'top' + 'bottom' là đủ,
// không phải migration schema. v1 chỉ dùng 'baseline'. closed dành cho Circle.
export const WarpPathSchema = z.object({
  role: z.enum(['baseline', 'top', 'bottom']),
  closed: z.boolean(),
  anchors: z.array(WarpAnchorSchema),
});
export type WarpPath = z.infer<typeof WarpPathSchema>;

export const WarpTypeSchema = z.enum([
  'none',
  'wave',
  'arch',
  'rise',
  'flag',
  'circle',
  'angle',
  'distort',
  'custom',
]);
export type WarpType = z.infer<typeof WarpTypeSchema>;

// centerX/centerY/radius chuẩn hoá theo node.font.size (KHÔNG phải
// width/height của layout) — để một khi đã lưu (user kéo handle), Circle
// đóng băng tuyệt đối: letterSpacing hay sửa nội dung text không còn làm
// bán kính/tâm đổi nữa, chỉ kéo handle mới đổi được (xem
// src/text/textGeometry.ts's resolveCircleParams). Khác warp family (chuẩn
// hoá theo layout.advanceWidth/height, vẫn tự khớp theo nội dung) vì Circle
// không có clipping để làm lưới an toàn khi kích thước lệch khỏi text.
export const CircleParamsSchema = z.object({
  centerX: z.number(),
  centerY: z.number(),
  radius: z.number(),
});
export type CircleParams = z.infer<typeof CircleParamsSchema>;

// paths vắng mặt = đang ở chế độ preset, path được sinh từ type + curveHeight.
// Ngay khi user kéo một handle, path sinh ra được ghi vào paths và từ đó paths
// là nguồn sự thật. Reset xoá paths. Nhờ vậy slider và handle không tranh nhau
// một nguồn dữ liệu. `circle` là bản tương đương của `paths` nhưng dành riêng
// cho warp.type === 'circle' (không dùng WarpPath — xem docs/kittl-circle-
// reverse-engineered.md, Circle dùng rigid-transform-per-glyph chứ không phải
// point-wise warp theo path).
const WarpBodySchema = z.object({
  type: WarpTypeSchema,
  // Biên độ dao động dọc của path, tính bằng bội số của fontSize, có dấu — âm
  // là lật ngược đường cong. Cùng đơn vị với `curveHeight` của Kittl. Không
  // dùng cho circle (Kittl không có slider Curve cho Circle Text).
  curveHeight: z.number().min(-1).max(4),
  paths: z.array(WarpPathSchema).optional(),
  circle: CircleParamsSchema.optional(),
  // Ngang hàng curveHeight (không nằm trong `circle`) để đổi được thuần tuý
  // (không cần load font/layout để tính preset center/radius trước).
  directionInverted: z.boolean().default(false),
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
