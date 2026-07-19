import { z } from 'zod';
import { PageSchema } from './page';

// Phase 1 asset representation: assetId resolves to an embedded base64 data
// URI stored directly in the document (no backend exists yet). Phase 5
// swaps the resolver to fetch from S3/R2 by the same assetId — this schema
// shape is expected to change then. See CONTEXT.md "Asset".
// 'font' variant added in Phase 3 for uploaded (.ttf/.otf/.woff2) fonts —
// `family` is the FontFace family name registered via fontService.ts,
// `document.fonts` tracks which family names are in use by the document.
// 'svg' variant added in Phase 4 Pass E for uploaded SVG icons/artwork —
// `dataUri` is the raw SVG markup (an uploaded-file data URI, same as
// 'image'), decoded back to text at render time by svgRenderer.ts.
export const AssetRefSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('image'), dataUri: z.string() }),
  z.object({ type: z.literal('font'), family: z.string(), dataUri: z.string() }),
  z.object({ type: z.literal('svg'), dataUri: z.string() }),
]);
export type AssetRef = z.infer<typeof AssetRefSchema>;

export const DocumentMetaSchema = z.object({
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type DocumentMeta = z.infer<typeof DocumentMetaSchema>;

// Phase 3 Pass C: a single open quadratic bezier (start, control, end) a
// text node's warp can follow (TextNode.warp.pathId keys into this map).
// Points are normalized (u,v) in 0..1, scaled to the mesh's actual pixel
// size at render time — see computeWarpGrid in text/warpGeometry.ts.
// ponytail: one quadratic segment only, no multi-segment/closed paths;
// upgrade the tuple shape if a real S-curve need shows up.
export const PathDataSchema = z.object({
  points: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]),
});
export type PathData = z.infer<typeof PathDataSchema>;

export const DocumentSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  meta: DocumentMetaSchema,
  pages: z.array(PageSchema),
  assets: z.record(z.string(), AssetRefSchema),
  fonts: z.array(z.string()),
  // default({}) rather than required — keeps documents saved before this
  // field existed loadable without a migration.
  paths: z.record(z.string(), PathDataSchema).default({}),
});
export type Document = z.infer<typeof DocumentSchema>;
