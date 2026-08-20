import { useRef } from 'react';
import { Grid3x3, Image, Layers, Menu, Square, Type, Upload } from 'lucide-react';
import { useEditorUI } from './EditorUIContext';
import { useCanvasContext, useEditorStoreApi } from './EditorContext';
import { createToolActions } from './toolActions';

export function LeftSidebar() {
  const store = useEditorStoreApi();
  const { app } = useCanvasContext();
  const { drawer, toggleDrawer, activeTool, setActiveTool } = useEditorUI();
  const actions = createToolActions(store, app);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const runTool = (tool: typeof activeTool, fn: () => void) => {
    setActiveTool(tool);
    fn();
  };

  return (
    <aside
      className="flex flex-col border-r"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--panel-border)' }}
    >
      <div className="mt-2 flex h-9 items-center justify-center text-lg font-bold text-white/90">K</div>

      <button type="button" className="kittl-sidebar-btn" title="Menu" onClick={() => toggleDrawer('dev')}>
        <Menu size={18} strokeWidth={1.5} />
      </button>

      <div className="mt-1 flex flex-col" style={{ gap: '6px' }}>
        <button
          type="button"
          className={`kittl-sidebar-btn ${activeTool === 'text' ? 'active' : ''}`}
          title="Text"
          onClick={() => void runTool('text', () => actions.handleAddText())}
        >
          <Type size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={`kittl-sidebar-btn ${activeTool === 'shape' ? 'active' : ''}`}
          title="Shape"
          onClick={() => runTool('shape', () => actions.addShape())}
        >
          <Square size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={`kittl-sidebar-btn ${activeTool === 'image' ? 'active' : ''}`}
          title="Image"
          onClick={() => imageInputRef.current?.click()}
        >
          <Image size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={`kittl-sidebar-btn ${drawer === 'assets' ? 'active' : ''}`}
          title="Upload / Assets"
          onClick={() => toggleDrawer('assets')}
        >
          <Upload size={18} strokeWidth={1.5} />
        </button>
        <button type="button" className="kittl-sidebar-btn" title="Grid" onClick={() => actions.toggleGrid()}>
          <Grid3x3 size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-auto flex flex-col pb-2">
        <button
          type="button"
          className={`kittl-sidebar-btn ${drawer === 'layers' ? 'active' : ''}`}
          title="Layers"
          onClick={() => toggleDrawer('layers')}
        >
          <Layers size={18} strokeWidth={1.5} />
        </button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void actions.handleImageFile(file);
          e.target.value = '';
        }}
      />
    </aside>
  );
}
