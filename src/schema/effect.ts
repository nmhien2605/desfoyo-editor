import { z } from 'zod';

// Full Effect union per docs/04-data-model.md. This is a type/validation
// surface only — Phase 1 wires up just one demo filter (e.g. shadow) at the
// render layer; the rest of the union costs nothing to declare now and
// avoids a schema migration when later phases add the renderer for them.
export const EffectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('shadow'),
    color: z.string(),
    blur: z.number(),
    offset: z.tuple([z.number(), z.number()]),
    alpha: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('inner-shadow'),
    color: z.string(),
    blur: z.number(),
    offset: z.tuple([z.number(), z.number()]),
    alpha: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('glow'),
    color: z.string(),
    strength: z.number(),
    outer: z.boolean(),
  }),
  z.object({
    type: z.literal('outline'),
    color: z.string(),
    thickness: z.number(),
  }),
  z.object({
    type: z.literal('extrude3d'),
    depth: z.number(),
    angle: z.number(),
    color: z.string(),
  }),
  z.object({
    type: z.literal('blur'),
    amount: z.number(),
  }),
  z.object({
    type: z.literal('custom'),
    shaderId: z.string(),
    uniforms: z.record(z.string(), z.union([z.number(), z.array(z.number())])),
  }),
]);
export type Effect = z.infer<typeof EffectSchema>;
