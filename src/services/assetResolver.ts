import type { Document } from '../schema';

// Phase 1: no backend — assetId resolves straight to the base64 data URI
// embedded in document.assets. Phase 5 swaps this for an async S3/R2 fetch
// by the same assetId (the signature will need to become async then; not
// wrapped in a Promise now since there's nothing to await yet).
export function resolveAsset(assetId: string, doc: Document): string {
  const asset = doc.assets[assetId];
  if (!asset) throw new Error(`Unknown assetId: ${assetId}`);
  return asset.dataUri;
}
