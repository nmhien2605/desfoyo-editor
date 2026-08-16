import { z } from 'zod';
import { EffectSchema } from './effect';

export const BlendModeSchema = z.enum([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
]);
export type BlendMode = z.infer<typeof BlendModeSchema>;

// x/y = position of the pivot point (not the unrotated top-left corner).
// originX/originY (0..1) locate the pivot inside the node's own bounding box.
// Rotation/scale happen in place around (x, y) — no recompute of x/y needed
// after a rotation. See plan/04-data-model.md and CONTEXT.md ("Node").
export const TransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
  rotation: z.number(), // radians
  skewX: z.number().optional(),
  skewY: z.number().optional(),
  originX: z.number().min(0).max(1).optional(),
  originY: z.number().min(0).max(1).optional(),
});
export type Transform = z.infer<typeof TransformSchema>;

export const SizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});
export type Size = z.infer<typeof SizeSchema>;

// Base fields shared by every node type. Concrete node schemas extend this
// via z.object({ ...BaseNodeShape, type: z.literal(...), ... }).
export const BaseNodeShape = {
  id: z.string(),
  name: z.string().optional(),
  transform: TransformSchema,
  size: SizeSchema,
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  locked: z.boolean(),
  blendMode: BlendModeSchema.optional(),
  effects: z.array(EffectSchema).optional(),
};

// Real schema + inferred type for the fields every node shares — used by
// GroupNode (src/schema/node.ts) to extend cleanly without re-deriving the
// shape by hand.
export const BaseNodeSchema = z.object(BaseNodeShape);
export type BaseNode = z.infer<typeof BaseNodeSchema>;
