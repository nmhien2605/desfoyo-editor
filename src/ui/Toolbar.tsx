import { useRef } from 'react';
import { nanoid } from 'nanoid';
import { useEditorStore, useEditorStoreApi } from './EditorContext';
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
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        disabled={!selectedNodeId}
        onClick={() => {
          if (!selectedNodeId) return;
          store.getState().dispatch({ type: 'RemoveNode', pageId: activePageId, nodeId: selectedNodeId });
        }}
        className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
