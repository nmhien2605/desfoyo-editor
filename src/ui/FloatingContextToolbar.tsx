import { Copy, Trash2 } from 'lucide-react';
import { useEditorStore, useEditorStoreApi } from './EditorContext';
import { duplicateSelection } from '../services/clipboard';
import { createToolActions } from './toolActions';
import { useSelectionScreenBounds } from './selectionScreenBounds';

export function FloatingContextToolbar() {
  const store = useEditorStoreApi();
  const selectedNodeIds = useEditorStore((s) => s.selectedNodeIds);
  const bounds = useSelectionScreenBounds();
  const actions = createToolActions(store, null);

  if (!bounds || selectedNodeIds.size !== 1) return null;

  return (
    <div
      className="pointer-events-auto absolute z-20 flex items-center gap-1 px-2"
      style={{
        left: bounds.left + bounds.width / 2,
        top: Math.max(8, bounds.top - 52),
        transform: 'translateX(-50%)',
        height: 44,
        background: '#171d27',
        border: '1px solid #2a313d',
        borderRadius: 14,
        boxShadow: '0 8px 30px rgba(0,0,0,.25)',
        color: '#d8dde6',
      }}
    >
      <button type="button" className="kittl-pill-btn" title="Duplicate" onClick={() => duplicateSelection(store)}>
        <Copy size={16} strokeWidth={1.5} />
      </button>
      <button type="button" className="kittl-pill-btn" title="Delete" onClick={() => actions.deleteSelection()}>
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
