import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEditorStore, useEditorStoreApi } from './EditorContext';
import { activePage } from '../core/store';
import type { Node } from '../schema';

function labelFor(node: Node): string {
  if (node.name) return node.name;
  return `${node.type[0].toUpperCase()}${node.type.slice(1)}`;
}

// The store's children array order *is* the list order *is* the z-order —
// no separate/duplicated ordering state. Rendered reversed so the top of
// the list corresponds to the topmost (last-drawn) object, matching the
// universal layers-panel UX convention. Group rows recurse into their own
// children the same way.
export function LayersPanel() {
  const activePageId = useEditorStore((s) => s.activePageId);
  const children = useEditorStore((s) => activePage(s)?.children ?? []);

  return (
    <div className="w-56 border-l border-gray-200 p-2">
      <ul className="flex flex-col gap-1">
        {[...children].reverse().map((node) => (
          <LayerRow key={node.id} node={node} depth={0} pageId={activePageId} />
        ))}
      </ul>
    </div>
  );
}

function LayerRow({ node, depth, pageId }: { node: Node; depth: number; pageId: string }) {
  const store = useEditorStoreApi();
  const selectedNodeIds = useEditorStore((s) => s.selectedNodeIds);
  const isSelected = selectedNodeIds.has(node.id);

  const reorder = (to: 'up' | 'down' | 'top' | 'bottom') => {
    store.getState().dispatch({ type: 'Reorder', pageId, nodeId: node.id, to });
  };

  const onRowClick = (event: ReactMouseEvent) => {
    store.getState().select(node.id, event.shiftKey ? 'toggle' : 'replace');
  };

  return (
    <li>
      <div
        className={`flex items-center justify-between gap-1 rounded px-2 py-1 text-sm ${
          isSelected ? 'bg-blue-100' : 'bg-gray-50'
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={onRowClick}
      >
        <span className="truncate">{labelFor(node)}</span>
        <span className="flex gap-1">
          <button type="button" onClick={() => reorder('top')} title="Bring to front">
            ⤒
          </button>
          <button type="button" onClick={() => reorder('up')} title="Bring forward">
            ↑
          </button>
          <button type="button" onClick={() => reorder('down')} title="Send backward">
            ↓
          </button>
          <button type="button" onClick={() => reorder('bottom')} title="Send to back">
            ⤓
          </button>
          <button
            type="button"
            title={node.visible ? 'Hide' : 'Show'}
            onClick={() =>
              store.getState().dispatch({
                type: 'UpdateProps',
                pageId,
                nodeId: node.id,
                patch: { visible: !node.visible },
              })
            }
          >
            {node.visible ? '👁' : '🚫'}
          </button>
        </span>
      </div>
      {node.type === 'group' && node.children.length > 0 && (
        <ul className="flex flex-col gap-1">
          {[...node.children].reverse().map((child) => (
            <LayerRow key={child.id} node={child} depth={depth + 1} pageId={pageId} />
          ))}
        </ul>
      )}
    </li>
  );
}
