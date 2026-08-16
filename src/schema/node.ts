import { z } from 'zod';
import { BaseNodeShape, type BaseNode } from './base';
import { FillSchema, StrokeSchema } from './fill-stroke';
import { WarpSchema } from './warp';

// 'shape' | 'image' | 'group' are valid node types.
// 'svg' arrived in Phase 4 Pass E (see CONTEXT.md "Node" and
// plan/04-data-model.md) — Zod previously rejected it as out-of-phase.

export const ShapeNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('shape'),
  shape: z.enum(['rect', 'ellipse', 'line', 'polygon', 'star', 'path']),
  cornerRadius: z.number().optional(),
  points: z.array(z.number()).optional(),
  fill: FillSchema,
  stroke: StrokeSchema.optional(),
});
export type ShapeNode = z.infer<typeof ShapeNodeSchema>;

export const ImageNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('image'),
  assetId: z.string(),
  crop: z
    .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
    .optional(),
  mask: z.object({ type: z.literal('shape'), ref: z.string() }).optional(),
  filters: z
    .object({
      brightness: z.number().optional(),
      contrast: z.number().optional(),
      blur: z.number().optional(),
      saturation: z.number().optional(),
    })
    .optional(),
});
export type ImageNode = z.infer<typeof ImageNodeSchema>;

// SvgNode (Phase 4 Pass E): assetId references the raw SVG source (an
// AssetRef of type 'svg'); overrides recolors specific elements by their
// SVG `id` attribute. v1 only actually applies solid-color overrides (see
// svgRenderer.ts's applyOverrides) — gradient overrides are declared here
// to match plan/04-data-model.md's Record<string, Fill> shape but are
// silently inert for now, same convention buildFilters.ts's unknown
// 'custom' shaderId already uses.
export const SvgNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('svg'),
  assetId: z.string(),
  overrides: z.record(z.string(), FillSchema).optional(),
});
export type SvgNode = z.infer<typeof SvgNodeSchema>;

// TextNode: text là nội dung thô, mọi hình học suy ra từ đó tại render time
// (src/text/textGeometry.ts) chứ không lưu trong model. `align: 'justify'` mà
// plan/04-data-model.md nêu bị cắt khỏi v1 — justify cần auto-wrap, xem
// docs/text-future-work.md mục 2.
export const TextNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('text'),
  text: z.string(),
  font: z.object({
    family: z.string(),
    weight: z.number(),
    style: z.enum(['normal', 'italic']),
    size: z.number().positive(),
  }),
  align: z.enum(['left', 'center', 'right']),
  letterSpacing: z.number(),
  lineHeight: z.number().positive(),
  fill: FillSchema,
  warp: WarpSchema.optional(),
});
export type TextNode = z.infer<typeof TextNodeSchema>;

// GroupNode per plan/04-data-model.md: exactly BaseNode + children, no other
// fields. z.lazy() is required because NodeSchema is now self-referential
// (a group's children can themselves include groups).
export interface GroupNode extends BaseNode {
  type: 'group';
  children: Node[];
}

// Only the recursive `children` field needs z.lazy() — NodeSchema itself
// can stay a plain discriminatedUnion since module evaluation order means
// NodeSchema exists by the time this getter actually runs (at parse time,
// not at module-load time).
export const GroupNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('group'),
  children: z.lazy(() => z.array(NodeSchema)),
});

export const NodeSchema: z.ZodType<Node> = z.discriminatedUnion('type', [
  ShapeNodeSchema,
  ImageNodeSchema,
  SvgNodeSchema,
  TextNodeSchema,
  GroupNodeSchema,
]);
export type Node = ShapeNode | ImageNode | SvgNode | TextNode | GroupNode;
