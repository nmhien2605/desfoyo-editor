import { z } from 'zod';

export const GradientStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: z.string(),
  alpha: z.number().min(0).max(1).optional(),
});
export type GradientStop = z.infer<typeof GradientStopSchema>;

export const FillSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: z.string(), alpha: z.number().min(0).max(1).optional() }),
  z.object({
    type: z.literal('linear-gradient'),
    stops: z.array(GradientStopSchema),
    angle: z.number(),
  }),
  z.object({ type: z.literal('radial-gradient'), stops: z.array(GradientStopSchema) }),
  z.object({
    type: z.literal('texture'),
    assetId: z.string(),
    scale: z.number().optional(),
    offset: z.tuple([z.number(), z.number()]).optional(),
  }),
]);
export type Fill = z.infer<typeof FillSchema>;

export const StrokeSchema = z.object({
  fill: FillSchema,
  width: z.number(),
  align: z.enum(['inside', 'center', 'outside']),
  layers: z
    .array(
      z.object({
        width: z.number(),
        fill: FillSchema,
        offset: z.tuple([z.number(), z.number()]).optional(),
      }),
    )
    .optional(),
});
export type Stroke = z.infer<typeof StrokeSchema>;
