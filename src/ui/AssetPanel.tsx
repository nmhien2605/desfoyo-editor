import { useEditorStore, useEditorStoreApi } from './EditorContext';
import { defaultImageNode, defaultSvgNode, loadImageSize, svgNaturalSize } from './Toolbar';
import { decodeSvgText } from '../render/renderers/svgRenderer';

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
export function AssetPanel() {
  const store = useEditorStoreApi();
  const activePageId = useEditorStore((s) => s.activePageId);
  const assets = useEditorStore((s) => s.document.assets);
  const visibleAssets = Object.entries(assets).filter(([, asset]) => asset.type === 'image' || asset.type === 'svg');

  const addAtDefault = async (assetId: string, dataUri: string, type: 'image' | 'svg') => {
    const node =
      type === 'svg'
        ? defaultSvgNode(assetId, ...sizeTuple(svgNaturalSize(await decodeSvgText(dataUri))))
        : defaultImageNode(assetId, ...sizeTuple(await loadImageSize(dataUri)));
    store.getState().dispatch({ type: 'AddNode', pageId: activePageId, node });
    store.getState().select(node.id);
  };

  return (
    <div className="w-56 border-l border-gray-200 p-2">
      <div className="grid grid-cols-3 gap-1">
        {visibleAssets.map(([assetId, asset]) => (
          <img
            key={assetId}
            src={asset.dataUri}
            draggable
            onDragStart={(e) => e.dataTransfer.setData(ASSET_DRAG_TYPE, assetId)}
            onClick={() => void addAtDefault(assetId, asset.dataUri, asset.type as 'image' | 'svg')}
            className="h-16 w-16 cursor-pointer rounded object-cover"
          />
        ))}
      </div>
    </div>
  );
}
