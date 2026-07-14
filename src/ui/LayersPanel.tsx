import { useEditorStore, useEditorStoreApi } from './EditorContext';
import type { Node } from '../schema';

function labelFor(node: Node): string {
  if (node.name) return node.name;
  if (node.type === 'text') return node.text || 'Text';
  return `${node.type[0].toUpperCase()}${node.type.slice(1)}`;
}

// The store's children array order *is* the list order *is* the z-order —
// no separate/duplicated ordering state. Rendered reversed so the top of
// the list corresponds to the topmost (last-drawn) object, matching the
// universal layers-panel UX convention.
export function LayersPanel() {
  const store = useEditorStoreApi();
  const activePageId = useEditorStore((s) => s.activePageId);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const children = useEditorStore(
    (s) => s.document.pages.find((p) => p.id === s.activePageId)?.children ?? [],
  );

  const reorder = (nodeId: string, to: 'up' | 'down' | 'top' | 'bottom') => {
    store.getState().dispatch({ type: 'Reorder', pageId: activePageId, nodeId, to });
  };

  return (
    <div className="w-56 border-l border-gray-200 p-2">
      <ul className="flex flex-col gap-1">
        {[...children].reverse().map((node) => (
          <li
            key={node.id}
            className={`flex items-center justify-between gap-1 rounded px-2 py-1 text-sm ${
              node.id === selectedNodeId ? 'bg-blue-100' : 'bg-gray-50'
            }`}
            onClick={() => store.getState().select(node.id)}
          >
            <span className="truncate">{labelFor(node)}</span>
            <span className="flex gap-1">
              <button type="button" onClick={() => reorder(node.id, 'top')} title="Bring to front">
                ⤒
              </button>
              <button type="button" onClick={() => reorder(node.id, 'up')} title="Bring forward">
                ↑
              </button>
              <button type="button" onClick={() => reorder(node.id, 'down')} title="Send backward">
                ↓
              </button>
              <button type="button" onClick={() => reorder(node.id, 'bottom')} title="Send to back">
                ⤓
              </button>
              <button
                type="button"
                title={node.visible ? 'Hide' : 'Show'}
                onClick={() =>
                  store.getState().dispatch({
                    type: 'UpdateProps',
                    pageId: activePageId,
                    nodeId: node.id,
                    patch: { visible: !node.visible },
                  })
                }
              >
                {node.visible ? '👁' : '🚫'}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
