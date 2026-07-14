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
import type { ImageNode, ShapeNode, TextNode, Transform } from '../schema';

const DEFAULT_TRANSFORM: Transform = { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 };

function defaultTextNode(): TextNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width: 200, height: 40 },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'text',
    text: 'Text',
    font: { family: 'Inter', weight: 400, style: 'normal', size: 24 },
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#111111' },
  };
}

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

function defaultImageNode(assetId: string, width: number, height: number): ImageNode {
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

function loadImageSize(dataUri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 200, height: 200 });
    img.src = dataUri;
  });
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
  const { app } = useCanvasContext();

  const handleFitToScreen = () => {
    if (!app) return;
    const page = store.getState().document.pages.find((p) => p.id === activePageId);
    if (!page) return;
    fitToScreen(store, { width: app.screen.width, height: app.screen.height }, page.size);
  };

  const addNode = (node: TextNode | ShapeNode | ImageNode) => {
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
      <button type="button" onClick={() => addNode(defaultTextNode())} className="rounded bg-gray-100 px-3 py-1">
        Add Text
      </button>
      <button type="button" onClick={() => addNode(defaultShapeNode())} className="rounded bg-gray-100 px-3 py-1">
        Add Shape
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
