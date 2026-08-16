import type { EditorStoreApi } from '../core/store';
import { deepCloneNode, findNodeInTree } from '../core/tree';
import type { Node } from '../schema';

const PASTE_OFFSET = 10;

// Plain module-level in-memory clipboard — not the OS clipboard. Real OS
// clipboard integration is a separate feature with its own permissions
// surface the Phase 2 spec doesn't ask for; this only needs to survive
// within one <Editor> mount's lifetime. See CONTEXT.md "Command".
let clipboard: Node[] = [];

function selectedNodes(store: EditorStoreApi): Node[] {
  const { document, activePageId, selectedNodeIds } = store.getState();
  const page = document.pages.find((p) => p.id === activePageId);
  if (!page) return [];
  return Array.from(selectedNodeIds)
    .map((id) => findNodeInTree(page.children, id)?.node)
    .filter((n): n is Node => !!n);
}

function pasteNodes(store: EditorStoreApi, nodes: Node[]): void {
  if (nodes.length === 0) return;
  const pageId = store.getState().activePageId;
  const clones = nodes.map((n) => {
    const clone = deepCloneNode(n);
    clone.transform = { ...clone.transform, x: clone.transform.x + PASTE_OFFSET, y: clone.transform.y + PASTE_OFFSET };
    return clone;
  });
  store.getState().beginGesture('paste');
  for (const clone of clones) {
    store.getState().dispatch({ type: 'AddNode', pageId, node: clone });
  }
  store.getState().endGesture();
  store.getState().select(clones[0]?.id ?? null);
  for (let i = 1; i < clones.length; i++) store.getState().select(clones[i].id, 'toggle');
}

export function duplicateSelection(store: EditorStoreApi): void {
  pasteNodes(store, selectedNodes(store));
}

export function copySelection(store: EditorStoreApi): void {
  const nodes = selectedNodes(store);
  if (nodes.length > 0) clipboard = nodes;
}

export function cutSelection(store: EditorStoreApi): void {
  copySelection(store);
  const ids = Array.from(store.getState().selectedNodeIds);
  if (ids.length === 0) return;
  const pageId = store.getState().activePageId;
  store.getState().beginGesture('cut');
  for (const id of ids) store.getState().dispatch({ type: 'RemoveNode', pageId, nodeId: id });
  store.getState().endGesture();
}

export function pasteClipboard(store: EditorStoreApi): void {
  pasteNodes(store, clipboard);
}
