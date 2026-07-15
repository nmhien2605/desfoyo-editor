import { z } from 'zod';
import { EffectSchema } from './effect';
import { FillSchema } from './fill-stroke';

// A named, canned fill+effects combo a text node can apply in one click.
// 'target' is always 'text' for now (Phase 3 scope) — kept as a discriminant
// field rather than omitted so a future 'shape' preset target is a schema
// addition, not a breaking shape change. Shape per plan/04-data-model.md.
export const PresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  target: z.literal('text'),
  apply: z.object({
    fill: FillSchema.optional(),
    effects: z.array(EffectSchema).optional(),
  }),
});
export type Preset = z.infer<typeof PresetSchema>;
