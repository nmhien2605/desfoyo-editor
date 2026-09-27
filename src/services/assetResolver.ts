import type { Document } from '../schema';

// Phase 1: no backend — assetId resolves straight to the base64 data URI
// embedded in document.assets, unless it's an 'image-url' asset, which
// already carries a plain URL (PixiJS Assets.load() accepts either kind of
// string identically).
export function resolveAsset(assetId: string, doc: Document): string {
  const asset = doc.assets[assetId];
  if (!asset) throw new Error(`Unknown assetId: ${assetId}`);
  return asset.type === 'image-url' ? asset.src : asset.dataUri;
}
