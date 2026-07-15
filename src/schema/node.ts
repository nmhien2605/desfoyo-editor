import { z } from 'zod';
import { BaseNodeShape, type BaseNode } from './base';
import { FillSchema, StrokeSchema } from './fill-stroke';

// Phase 2 scope: 'text' | 'shape' | 'image' | 'group' are valid node types.
// 'svg' arrives in Phase 4 (see CONTEXT.md "Node" and plan/04-data-model.md)
// — until then, Zod rejects documents containing it rather than silently
// accepting an out-of-phase node.

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
  // Phase 3: multi-layer stroke (Kittl-style layered outlines), rendered as
  // stacked Text clones in textRenderer.ts. Absent in Phase 1/2 documents.
  stroke: StrokeSchema.optional(),
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
  TextNodeSchema,
  ShapeNodeSchema,
  ImageNodeSchema,
  GroupNodeSchema,
]);
export type Node = TextNode | ShapeNode | ImageNode | GroupNode;
