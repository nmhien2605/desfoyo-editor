import { useRef } from 'react';
import { nanoid } from 'nanoid';
import { useEditorStore, useEditorStoreApi, useCanvasContext } from './EditorContext';
import {
  deleteSelection,
  groupSelection,
  ungroupSelection,
  isSingleGroupSelected,
  alignSelection,
  distributeSelection,
} from '../core/actions';
import { fitToScreen } from '../render/interactions/viewportControls';
import { decodeSvgText } from '../render/renderers/svgRenderer';
import type { ImageNode, ShapeNode, SvgNode, TextNode, Transform } from '../schema';
import { DEFAULT_FONT_FAMILY } from '../fonts/googleFonts';

const DEFAULT_TRANSFORM: Transform = { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 };

function defaultShapeNode(): ShapeNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width: 150, height: 150 },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'shape',
    shape: 'rect',
    fill: { type: 'solid', color: '#3b82f6' },
  };
}

export function defaultTextNode(): TextNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width: 200, height: 60 },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'text',
    content: 'Text',
    font: { family: DEFAULT_FONT_FAMILY, size: 48 },
    align: 'left',
    fill: { type: 'solid', color: '#000000' },
  };
}

export function defaultImageNode(assetId: string, width: number, height: number): ImageNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width, height },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'image',
    assetId,
  };
}

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function loadImageSize(dataUri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 200, height: 200 });
    img.src = dataUri;
  });
}

export function defaultSvgNode(assetId: string, width: number, height: number): SvgNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width, height },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'svg',
    assetId,
  };
}

// Prefers viewBox (width/height attrs are often omitted or in non-pixel
// units like "100%") — falls back to width/height attrs, then a fixed
// default, same "reasonable fallback, never throw" convention
// loadImageSize uses for a failed image load.
export function svgNaturalSize(svgText: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const root = doc.documentElement;
  const viewBox = root.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) return { width: parts[2], height: parts[3] };
  }
  const width = parseFloat(root.getAttribute('width') ?? '');
  const height = parseFloat(root.getAttribute('height') ?? '');
  if (width > 0 && height > 0) return { width, height };
  return { width: 200, height: 200 };
}

export function Toolbar() {
  const store = useEditorStoreApi();
  const activePageId = useEditorStore((s) => s.activePageId);
  const selectedNodeIds = useEditorStore((s) => s.selectedNodeIds);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const isSingleGroup = useEditorStore(() => isSingleGroupSelected(store) !== null);
  const grid = useEditorStore((s) => s.grid);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);
  const { app } = useCanvasContext();

  const handleFitToScreen = () => {
    if (!app) return;
    const page = store.getState().document.pages.find((p) => p.id === activePageId);
    if (!page) return;
    fitToScreen(store, { width: app.screen.width, height: app.screen.height }, page.size);
  };

  const addNode = (node: ShapeNode | ImageNode | SvgNode | TextNode) => {
    store.getState().dispatch({ type: 'AddNode', pageId: activePageId, node });
    store.getState().select(node.id);
  };

  const handleImageFile = async (file: File) => {
    const dataUri = await readAsDataUri(file);
    const { width, height } = await loadImageSize(dataUri);
    const assetId = nanoid();
    store.getState().addAsset(assetId, dataUri);
    addNode(defaultImageNode(assetId, width, height));
  };

  const handleSvgFile = async (file: File) => {
    const dataUri = await readAsDataUri(file);
    const { width, height } = svgNaturalSize(await decodeSvgText(dataUri));
    const assetId = nanoid();
    store.getState().addSvgAsset(assetId, dataUri);
    addNode(defaultSvgNode(assetId, width, height));
  };

  return (
    <div className="flex gap-2 border-b border-gray-200 p-2">
      <button type="button" onClick={() => store.getState().undo()} disabled={!canUndo} className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50">
        Undo
      </button>
      <button type="button" onClick={() => store.getState().redo()} disabled={!canRedo} className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50">
        Redo
      </button>
      <button type="button" onClick={handleFitToScreen} className="rounded bg-gray-100 px-3 py-1">
        Fit to Screen
      </button>
      <button type="button" onClick={() => addNode(defaultShapeNode())} className="rounded bg-gray-100 px-3 py-1">
        Add Shape
      </button>
      <button type="button" onClick={() => addNode(defaultTextNode())} className="rounded bg-gray-100 px-3 py-1">
        Add Text
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded bg-gray-100 px-3 py-1"
      >
        Add Image
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => svgInputRef.current?.click()}
        className="rounded bg-gray-100 px-3 py-1"
      >
        Add SVG
      </button>
      <input
        ref={svgInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleSvgFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={selectedNodeIds.size < 2}
        onClick={() => groupSelection(store)}
        className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50"
      >
        Group
      </button>
      <button
        type="button"
        disabled={!isSingleGroup}
        onClick={() => ungroupSelection(store)}
        className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50"
      >
        Ungroup
      </button>
      <button
        type="button"
        disabled={selectedNodeIds.size === 0}
        onClick={() => deleteSelection(store)}
        className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50"
      >
        Delete
      </button>
      {(
        [
          ['left', 'Align Left'],
          ['center', 'Align Center'],
          ['right', 'Align Right'],
          ['top', 'Align Top'],
          ['middle', 'Align Middle'],
          ['bottom', 'Align Bottom'],
        ] as const
      ).map(([edge, label]) => (
        <button
          key={edge}
          type="button"
          disabled={selectedNodeIds.size < 2}
          onClick={() => alignSelection(store, edge)}
          className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50"
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        disabled={selectedNodeIds.size < 3}
        onClick={() => distributeSelection(store, 'horizontal')}
        className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50"
      >
        Distribute H
      </button>
      <button
        type="button"
        disabled={selectedNodeIds.size < 3}
        onClick={() => distributeSelection(store, 'vertical')}
        className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50"
      >
        Distribute V
      </button>
      <button
        type="button"
        onClick={() => store.getState().setGrid({ enabled: !grid.enabled })}
        className={`rounded px-3 py-1 ${grid.enabled ? 'bg-blue-200' : 'bg-gray-100'}`}
      >
        Grid
      </button>
      <button
        type="button"
        disabled={!grid.enabled}
        onClick={() => store.getState().setGrid({ snap: !grid.snap })}
        className={`rounded px-3 py-1 disabled:opacity-50 ${grid.snap ? 'bg-blue-200' : 'bg-gray-100'}`}
      >
        Snap to Grid
      </button>
    </div>
  );
}
