import { nanoid } from 'nanoid';
import type { EditorStoreApi } from './store';
import { findNodeInTree } from './tree';

// Composed actions shared by Toolbar buttons and keyboard shortcuts — one
// place for "what a batch of dispatches means as a single undo step."
export function deleteSelection(store: EditorStoreApi): void {
  const { selectedNodeIds, activePageId } = store.getState();
  if (selectedNodeIds.size === 0) return;
  store.getState().beginGesture('multi-delete');
  for (const id of selectedNodeIds) {
    store.getState().dispatch({ type: 'RemoveNode', pageId: activePageId, nodeId: id });
  }
  store.getState().endGesture();
}

export function groupSelection(store: EditorStoreApi): void {
  const { selectedNodeIds, activePageId } = store.getState();
  if (selectedNodeIds.size < 2) return;
  const groupId = nanoid();
  store.getState().dispatch({
    type: 'GroupNodes',
    pageId: activePageId,
    nodeIds: Array.from(selectedNodeIds),
    groupId,
  });
  store.getState().select(groupId);
}

export function isSingleGroupSelected(store: EditorStoreApi): string | null {
  const { selectedNodeIds, document, activePageId } = store.getState();
  if (selectedNodeIds.size !== 1) return null;
  const page = document.pages.find((p) => p.id === activePageId);
  const [id] = selectedNodeIds;
  if (!page || findNodeInTree(page.children, id)?.node.type !== 'group') return null;
  return id;
}

export function ungroupSelection(store: EditorStoreApi): void {
  const groupId = isSingleGroupSelected(store);
  if (!groupId) return;
  store.getState().dispatch({ type: 'UngroupNode', pageId: store.getState().activePageId, groupId });
  store.getState().select(null);
}

export function selectAll(store: EditorStoreApi): void {
  const { document, activePageId } = store.getState();
  const page = document.pages.find((p) => p.id === activePageId);
  if (!page || page.children.length === 0) return;
  store.getState().select(page.children[0].id, 'replace');
  for (let i = 1; i < page.children.length; i++) store.getState().select(page.children[i].id, 'toggle');
}

export function nudgeSelection(store: EditorStoreApi, dx: number, dy: number): void {
  const { selectedNodeIds, document, activePageId } = store.getState();
  if (selectedNodeIds.size === 0) return;
  const page = document.pages.find((p) => p.id === activePageId);
  if (!page) return;
  store.getState().beginGesture('nudge');
  for (const id of selectedNodeIds) {
    const location = findNodeInTree(page.children, id);
    if (!location) continue;
    store.getState().dispatch({
      type: 'UpdateTransform',
      pageId: activePageId,
      nodeId: id,
      patch: { x: location.node.transform.x + dx, y: location.node.transform.y + dy },
    });
  }
  store.getState().endGesture();
}
