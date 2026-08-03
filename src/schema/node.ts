import { z } from 'zod';
import { BaseNodeShape, type BaseNode } from './base';
import { FillSchema, StrokeSchema } from './fill-stroke';

// 'shape' | 'image' | 'group' | 'text' | 'svg' are valid node types.
// 'svg' arrived in Phase 4 Pass E (see CONTEXT.md "Node" and
// plan/04-data-model.md) — Zod previously rejected it as out-of-phase.
// 'text' arrived in Phase 5 Pass B.

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

// TextNode (TextNode foundation slice, see
// docs/superpowers/specs/2026-08-03-text-effects-design.md): plain text,
// no warp/decorations yet (later slices). `stroke` reuses StrokeSchema
// as-is but is schema-only for now — textRenderer.ts doesn't render it,
// same "declared now, wired later" convention SvgNode.overrides' gradient
// case already uses. `size` is the text box's wrap width/height (see
// textRenderer.ts's wordWrap usage), not an auto-fit-to-content box.
export const TextNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('text'),
  content: z.string(),
  font: z.object({
    family: z.string(),
    size: z.number(),
    weight: z.number().optional(),
    italic: z.boolean().optional(),
    letterSpacing: z.number().optional(),
    lineHeight: z.number().optional(),
  }),
  align: z.enum(['left', 'center', 'right']),
  fill: FillSchema,
  stroke: StrokeSchema.optional(),
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
  GroupNodeSchema,
  TextNodeSchema,
]);
export type Node = ShapeNode | ImageNode | SvgNode | GroupNode | TextNode;
