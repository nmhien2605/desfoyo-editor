import { z } from 'zod';
import { NodeSchema } from './node';
import { FillSchema } from './fill-stroke';

export const PageBackgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('color'), value: z.string() }),
  z.object({ type: z.literal('fill'), value: FillSchema }),
]);
export type PageBackground = z.infer<typeof PageBackgroundSchema>;

export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.object({ width: z.number(), height: z.number() }),
  background: PageBackgroundSchema,
  children: z.array(NodeSchema),
});
export type Page = z.infer<typeof PageSchema>;
