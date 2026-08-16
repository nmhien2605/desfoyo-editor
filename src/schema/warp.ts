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

// paths vắng mặt = đang ở chế độ preset, path được sinh từ type + intensity.
// Ngay khi user kéo một handle, path sinh ra được ghi vào paths và từ đó paths
// là nguồn sự thật. Reset xoá paths. Nhờ vậy slider và handle không tranh nhau
// một nguồn dữ liệu.
export const WarpSchema = z.object({
  type: WarpTypeSchema,
  intensity: z.number().min(0).max(1),
  paths: z.array(WarpPathSchema).optional(),
});
export type Warp = z.infer<typeof WarpSchema>;
