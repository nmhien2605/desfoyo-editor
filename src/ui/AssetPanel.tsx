import { useEditorStore, useEditorStoreApi } from './EditorContext';
import { defaultImageNode, defaultSvgNode, loadImageSize, svgNaturalSize } from './toolActions';
import { decodeSvgText } from '../render/renderers/svgRenderer';
import type { AssetRef } from '../schema';

type EmbeddedAssetRef = Extract<AssetRef, { dataUri: string }>;

function isEmbeddedAsset(asset: AssetRef): asset is EmbeddedAssetRef {
  return asset.type === 'image' || asset.type === 'svg';
}

// Drag payload key shared with Editor.tsx's canvas drop target.
export const ASSET_DRAG_TYPE = 'text/desfoyo-asset-id';

function sizeTuple(size: { width: number; height: number }): [number, number] {
  return [size.width, size.height];
}

// Browse/reuse document.assets (Phase 4 Pass C, extended in Pass E for
// 'svg' assets) — drag a thumbnail onto the canvas, or click it, to add a
// node referencing the *same* assetId rather than re-uploading. Only
// image/svg assets are node-representable; fonts live in the same dict but
// aren't listed here. Browsers render an SVG data URI in <img> the same as
// a raster one, so no special thumbnail code is needed for 'svg' assets.
export function AssetPanel({ onClose }: { onClose?: () => void }) {
  const store = useEditorStoreApi();
  const activePageId = useEditorStore((s) => s.activePageId);
  const assets = useEditorStore((s) => s.document.assets);
  const visibleAssets = Object.entries(assets).filter((entry): entry is [string, EmbeddedAssetRef] => isEmbeddedAsset(entry[1]));

  const addAtDefault = async (assetId: string, dataUri: string, type: 'image' | 'svg') => {
    const node =
      type === 'svg'
        ? defaultSvgNode(assetId, ...sizeTuple(svgNaturalSize(await decodeSvgText(dataUri))))
        : defaultImageNode(assetId, ...sizeTuple(await loadImageSize(dataUri)));
    store.getState().dispatch({ type: 'AddNode', pageId: activePageId, node });
    store.getState().select(node.id);
  };

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Assets
        </span>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Close
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {visibleAssets.map(([assetId, asset]) => (
          <img
            key={assetId}
            src={asset.dataUri}
            draggable
            onDragStart={(e) => e.dataTransfer.setData(ASSET_DRAG_TYPE, assetId)}
            onClick={() => void addAtDefault(assetId, asset.dataUri, asset.type as 'image' | 'svg')}
            className="h-16 w-16 cursor-pointer rounded object-cover"
            style={{ border: '1px solid var(--panel-border)' }}
          />
        ))}
      </div>
    </div>
  );
}
