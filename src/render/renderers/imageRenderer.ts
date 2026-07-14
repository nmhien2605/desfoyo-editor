import { Assets, Sprite, Texture } from 'pixi.js';
import type { Document, ImageNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveAsset } from '../../services/assetResolver';

// Tracks which assetId is currently loaded per sprite, so update() (called
// on every command touching this node, including drag/resize) only
// re-decodes the image when the assetId actually changes.
const loadedAssetId = new WeakMap<Sprite, string>();

function loadTexture(obj: Sprite, node: ImageNode, doc: Document): void {
  loadedAssetId.set(obj, node.assetId);
  const dataUri = resolveAsset(node.assetId, doc);
  Assets.load(dataUri)
    .then((texture: Texture) => {
      if (obj.destroyed) return;
      obj.texture = texture;
    })
    .catch((err: unknown) => {
      // A broken/undecodable asset shouldn't crash the editor — leave the
      // sprite showing Texture.EMPTY (an empty placeholder).
      console.error(`Failed to load image asset ${node.assetId}:`, err);
    });
}

export const imageRenderer = {
  create(node: ImageNode, doc: Document): Sprite {
    const obj = new Sprite(Texture.EMPTY);
    loadTexture(obj, node, doc);
    this.update(obj, node, doc);
    return obj;
  },
  update(obj: Sprite, node: ImageNode, doc: Document): void {
    if (loadedAssetId.get(obj) !== node.assetId) {
      loadTexture(obj, node, doc);
    }
    obj.width = node.size.width;
    obj.height = node.size.height;
    applyTransform(obj, node);
  },
};
