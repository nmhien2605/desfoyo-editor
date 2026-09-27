import { z } from 'zod';
import { PageSchema } from './page';

// Phase 1 asset representation: assetId resolves to an embedded base64 data
// URI stored directly in the document (no backend exists yet). Phase 5
// swaps the resolver to fetch from S3/R2 by the same assetId — this schema
// shape is expected to change then.
// 'svg' variant added in Phase 4 Pass E for uploaded SVG icons/artwork —
// `dataUri` is the raw SVG markup (an uploaded-file data URI, same as
// 'image'), decoded back to text at render time by svgRenderer.ts.
export const AssetRefSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('image'), dataUri: z.string() }),
  z.object({ type: z.literal('svg'), dataUri: z.string() }),
  // Remote-hosted alternative to embedding a data URI — for large raster
  // images where base64-in-JSON would bloat the stored document. Only
  // covers 'image' for now; 'svg' stays data-URI-only until a real need
  // for remote SVG assets shows up (SVGs are small enough already).
  z.object({ type: z.literal('image-url'), src: z.string().url() }),
]);
export type AssetRef = z.infer<typeof AssetRefSchema>;

export const DocumentMetaSchema = z.object({
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type DocumentMeta = z.infer<typeof DocumentMetaSchema>;

export const DocumentSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  meta: DocumentMetaSchema,
  pages: z.array(PageSchema),
  assets: z.record(z.string(), AssetRefSchema),
});
export type Document = z.infer<typeof DocumentSchema>;
