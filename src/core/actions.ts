import { nanoid } from 'nanoid';
import type { EditorStoreApi } from './store';
import { findNodeInTree } from './tree';
import { computeSelectionBounds, nodeBounds, type SelectionBounds } from '../render/interactions/groupTransformMath';
import type { Node } from '../schema';

type AlignEdge = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

function edgeValue(bounds: SelectionBounds, edge: AlignEdge): number {
  switch (edge) {
    case 'left':
      return bounds.min.x;
    case 'center':
      return bounds.pivot.x;
    case 'right':
      return bounds.max.x;
    case 'top':
      return bounds.min.y;
    case 'middle':
      return bounds.pivot.y;
    case 'bottom':
      return bounds.max.y;
  }
}

function selectedTopLevelNodes(store: EditorStoreApi): Node[] {
  const { selectedNodeIds, document, activePageId } = store.getState();
  const page = document.pages.find((p) => p.id === activePageId);
  if (!page) return [];
  return Array.from(selectedNodeIds)
    .map((id) => findNodeInTree(page.children, id)?.node)
    .filter((n): n is Node => !!n);
}

// Aligns each selected node's own bbox edge/center to the whole selection's
// bbox edge/center — delta-translation only (like applyGroupMove), no
// de-rotation. Matches standard align-by-bounding-box UX (Figma/Canva).
export function alignSelection(store: EditorStoreApi, edge: AlignEdge): void {
  const nodes = selectedTopLevelNodes(store);
  if (nodes.length < 2) return;
  const activePageId = store.getState().activePageId;
  const axis: 'x' | 'y' = edge === 'left' || edge === 'center' || edge === 'right' ? 'x' : 'y';
  const target = edgeValue(computeSelectionBounds(nodes), edge);

  store.getState().beginGesture('align');
  for (const node of nodes) {
    const delta = target - edgeValue(nodeBounds(node), edge);
    store.getState().dispatch({
      type: 'UpdateTransform',
      pageId: activePageId,
      nodeId: node.id,
      patch: axis === 'x' ? { x: node.transform.x + delta } : { y: node.transform.y + delta },
    });
  }
  store.getState().endGesture();
}

// Equalizes the gap between bbox edges along one axis, keeping the first and
// last node in place. No-op below 3 nodes (nothing to distribute).
export function distributeSelection(store: EditorStoreApi, axis: 'horizontal' | 'vertical'): void {
  const nodes = selectedTopLevelNodes(store);
  if (nodes.length < 3) return;
  const activePageId = store.getState().activePageId;

  const entries = nodes
    .map((node) => ({ node, bounds: nodeBounds(node) }))
    .sort((a, b) => edgeValue(a.bounds, axis === 'horizontal' ? 'center' : 'middle') - edgeValue(b.bounds, axis === 'horizontal' ? 'center' : 'middle'));

  const size = (bounds: SelectionBounds) => (axis === 'horizontal' ? bounds.max.x - bounds.min.x : bounds.max.y - bounds.min.y);
  const minOf = (bounds: SelectionBounds) => (axis === 'horizontal' ? bounds.min.x : bounds.min.y);

  const firstEdge = minOf(entries[0].bounds);
  const lastEdge = minOf(entries[entries.length - 1].bounds) + size(entries[entries.length - 1].bounds);
  const totalSize = entries.reduce((sum, e) => sum + size(e.bounds), 0);
  const gap = (lastEdge - firstEdge - totalSize) / (entries.length - 1);

  store.getState().beginGesture('distribute');
  let cursor = firstEdge + size(entries[0].bounds) + gap;
  for (let i = 1; i < entries.length - 1; i++) {
    const { node, bounds } = entries[i];
    const delta = cursor - minOf(bounds);
    store.getState().dispatch({
      type: 'UpdateTransform',
      pageId: activePageId,
      nodeId: node.id,
      patch: axis === 'horizontal' ? { x: node.transform.x + delta } : { y: node.transform.y + delta },
    });
    cursor += size(bounds) + gap;
  }
  store.getState().endGesture();
}

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
