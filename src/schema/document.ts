import { z } from 'zod';
import { PageSchema } from './page';

// Phase 1 asset representation: assetId resolves to an embedded base64 data
// URI stored directly in the document (no backend exists yet). Phase 5
// swaps the resolver to fetch from S3/R2 by the same assetId — this schema
// shape is expected to change then. See CONTEXT.md "Asset".
export const AssetRefSchema = z.object({
  type: z.literal('image'),
  dataUri: z.string(),
});
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
  fonts: z.array(z.string()),
});
export type Document = z.infer<typeof DocumentSchema>;
