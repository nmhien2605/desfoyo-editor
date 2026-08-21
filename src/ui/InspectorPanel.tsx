import {
  AlignCenter,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalJustifyCenter,
} from 'lucide-react';
import { useState } from 'react';
import { useEditorStore, useEditorStoreApi } from './EditorContext';
import { createToolActions } from './toolActions';
import { PropertiesPanel, singleSelectedNode } from './PropertiesPanel';
import { useEditorUI } from './EditorUIContext';

const EXPORT_SCALES = [1, 2, 3, 4];

export function InspectorPanel() {
  const store = useEditorStoreApi();
  const selectedCount = useEditorStore((s) => s.selectedNodeIds.size);
  const node = useEditorStore(singleSelectedNode);
  const title = useEditorStore((s) => s.document.meta.title);
  const actions = createToolActions(store, null);
  const { onExport } = useEditorUI();
  const [exportScale, setExportScale] = useState(1);

  return (
    <aside
      className="flex min-h-0 flex-col overflow-y-auto border-l text-sm"
      style={{ background: 'var(--inspector-bg)', borderColor: '#252d38' }}
    >
      <div className="p-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full" style={{ background: '#4ba3df' }} />
          <select
            value={exportScale}
            onChange={(e) => setExportScale(Number(e.target.value))}
            className="kittl-input ml-auto w-14 text-xs"
          >
            {EXPORT_SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {scale}×
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-md px-3 py-1 text-xs font-medium"
            style={{ background: '#f2f2f2', color: '#20242b' }}
            onClick={() => onExport?.('png', exportScale)}
          >
            Export
          </button>
        </div>
        <input
          type="text"
          value={title}
          readOnly
          className="kittl-input w-full"
          style={{ background: '#1a202a' }}
        />
      </div>

      {selectedCount >= 2 && (
        <section className="kittl-section">
          <div className="kittl-section-title">Alignment</div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ['left', AlignStartHorizontal],
                ['center', AlignCenter],
                ['right', AlignEndHorizontal],
                ['top', AlignStartVertical],
                ['middle', AlignVerticalJustifyCenter],
                ['bottom', AlignEndVertical],
              ] as const
            ).map(([edge, Icon]) => (
              <button
                key={edge}
                type="button"
                className="kittl-inspector-btn"
                title={edge}
                onClick={() => actions.alignSelection(edge)}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedCount === 1 && node && (
        <section className="kittl-section">
          <div className="kittl-section-title">Transform px</div>
          <div className="flex gap-2">
            <label className="flex flex-1 items-center gap-2">
              <span style={{ color: 'var(--text-muted)' }}>W</span>
              <input type="number" readOnly value={Math.round(node.size.width)} className="kittl-input w-full" />
            </label>
            <label className="flex flex-1 items-center gap-2">
              <span style={{ color: 'var(--text-muted)' }}>H</span>
              <input type="number" readOnly value={Math.round(node.size.height)} className="kittl-input w-full" />
            </label>
          </div>
        </section>
      )}

      <PropertiesPanel />

      {selectedCount === 0 && (
        <div className="p-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Select an object to edit properties
        </div>
      )}
    </aside>
  );
}
