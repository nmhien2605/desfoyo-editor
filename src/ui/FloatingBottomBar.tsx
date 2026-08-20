import { Grid3x3, Minus, Plus, Redo2, Square, Type, Undo2 } from 'lucide-react';
import { useCanvasContext, useEditorStore, useEditorStoreApi } from './EditorContext';
import { createToolActions } from './toolActions';
import { useEditorUI } from './EditorUIContext';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

export function FloatingBottomBar() {
  const store = useEditorStoreApi();
  const { app } = useCanvasContext();
  const actions = createToolActions(store, app);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const zoom = useEditorStore((s) => s.camera.zoom);
  const { activeTool, setActiveTool } = useEditorUI();

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="kittl-pill px-1">
        <button type="button" className="kittl-pill-btn" title="Grid" onClick={() => actions.toggleGrid()}>
          <Grid3x3 size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={`kittl-pill-btn ${activeTool === 'shape' ? 'active' : ''}`}
          title="Rectangle"
          onClick={() => {
            setActiveTool('shape');
            actions.addShape();
          }}
        >
          <Square size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={`kittl-pill-btn ${activeTool === 'text' ? 'active' : ''}`}
          title="Text"
          onClick={() => {
            setActiveTool('text');
            void actions.handleAddText();
          }}
        >
          <Type size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="kittl-pill px-1">
        <button type="button" className="kittl-pill-btn" title="Undo" disabled={!canUndo} onClick={() => actions.undo()}>
          <Undo2 size={16} strokeWidth={1.5} />
        </button>
        <button type="button" className="kittl-pill-btn" title="Redo" disabled={!canRedo} onClick={() => actions.redo()}>
          <Redo2 size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="kittl-pill px-2" style={{ width: 120 }}>
        <button
          type="button"
          className="kittl-pill-btn"
          title="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => actions.zoomBy(1 / 1.2)}
        >
          <Minus size={16} strokeWidth={1.5} />
        </button>
        <span className="flex-1 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {zoomPercent}%
        </span>
        <button
          type="button"
          className="kittl-pill-btn"
          title="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => actions.zoomBy(1.2)}
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      </div>

      <button
        type="button"
        className="kittl-pill px-3 text-xs"
        style={{ color: 'var(--text-muted)' }}
        title="Fit to screen"
        onClick={() => actions.handleFitToScreen()}
      >
        ⊕ Fit
      </button>
    </div>
  );
}
