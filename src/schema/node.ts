import { z } from 'zod';
import { BaseNodeShape } from './base';
import { FillSchema, StrokeSchema } from './fill-stroke';

// Phase 1 scope: only 'text' | 'shape' | 'image' are valid node types.
// 'group' arrives in Phase 2, 'svg' in Phase 4 (see CONTEXT.md "Node" and
// plan/04-data-model.md) — until then, Zod rejects documents containing
// them rather than silently accepting an out-of-phase node.

export const TextNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('text'),
  text: z.string(),
  font: z.object({
    family: z.string(),
    weight: z.number(),
    style: z.enum(['normal', 'italic']),
    size: z.number(),
  }),
  align: z.enum(['left', 'center', 'right', 'justify']),
  letterSpacing: z.number(),
  lineHeight: z.number(),
  fill: FillSchema,
  // Warp/curve is a Phase 3 rendering feature; the field is declared now
  // (type-only cost) so the schema doesn't need a breaking change later.
  warp: z
    .object({
      type: z.enum(['none', 'arc', 'wave', 'bulge', 'flag', 'perspective', 'path']),
      intensity: z.number(),
      pathId: z.string().optional(),
    })
    .optional(),
});
export type TextNode = z.infer<typeof TextNodeSchema>;

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
  mask: z.object({ type: z.enum(['shape', 'text']), ref: z.string() }).optional(),
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

export const NodeSchema = z.discriminatedUnion('type', [
  TextNodeSchema,
  ShapeNodeSchema,
  ImageNodeSchema,
]);
export type Node = z.infer<typeof NodeSchema>;
