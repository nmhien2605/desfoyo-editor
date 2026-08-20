export {
  defaultShapeNode,
  defaultImageNode,
  defaultSvgNode,
  defaultTextNode,
  loadImageSize,
  svgNaturalSize,
  createToolActions,
} from './toolActions';
export type { ToolActions } from './toolActions';

import { useRef } from 'react';
import { useEditorStore, useEditorStoreApi, useCanvasContext } from './EditorContext';
import { isSingleGroupSelected } from '../core/actions';
import { createToolActions } from './toolActions';

/** @deprecated Use LeftSidebar + FloatingBottomBar instead. Kept for backward compatibility. */
export function Toolbar() {
  const store = useEditorStoreApi();
  const selectedNodeIds = useEditorStore((s) => s.selectedNodeIds);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const isSingleGroup = useEditorStore((_state) => isSingleGroupSelected(store) !== null);
  const grid = useEditorStore((s) => s.grid);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);
  const { app } = useCanvasContext();
  const actions = createToolActions(store, app);

  return (
    <div className="flex gap-2 border-b border-gray-200 p-2">
      <button type="button" onClick={() => actions.undo()} disabled={!canUndo} className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50">
        Undo
      </button>
      <button type="button" onClick={() => actions.redo()} disabled={!canRedo} className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50">
        Redo
      </button>
      <button type="button" onClick={() => actions.handleFitToScreen()} className="rounded bg-gray-100 px-3 py-1">
        Fit to Screen
      </button>
      <button type="button" onClick={() => actions.addShape()} className="rounded bg-gray-100 px-3 py-1">
        Add Shape
      </button>
      <button type="button" onClick={() => void actions.handleAddText()} className="rounded bg-gray-100 px-3 py-1">
        Add Text
      </button>
      <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded bg-gray-100 px-3 py-1">
        Add Image
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void actions.handleImageFile(file);
          e.target.value = '';
        }}
      />
      <button type="button" onClick={() => svgInputRef.current?.click()} className="rounded bg-gray-100 px-3 py-1">
        Add SVG
      </button>
      <input
        ref={svgInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void actions.handleSvgFile(file);
          e.target.value = '';
        }}
      />
      <button type="button" disabled={selectedNodeIds.size < 2} onClick={() => actions.groupSelection()} className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50">
        Group
      </button>
      <button type="button" disabled={!isSingleGroup} onClick={() => actions.ungroupSelection()} className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50">
        Ungroup
      </button>
      <button type="button" disabled={selectedNodeIds.size === 0} onClick={() => actions.deleteSelection()} className="rounded bg-gray-100 px-3 py-1 disabled:opacity-50">
        Delete
      </button>
      <button type="button" onClick={() => actions.toggleGrid()} className={`rounded px-3 py-1 ${grid.enabled ? 'bg-blue-200' : 'bg-gray-100'}`}>
        Grid
      </button>
      <button type="button" disabled={!grid.enabled} onClick={() => actions.toggleSnap()} className={`rounded px-3 py-1 disabled:opacity-50 ${grid.snap ? 'bg-blue-200' : 'bg-gray-100'}`}>
        Snap to Grid
      </button>
    </div>
  );
}
