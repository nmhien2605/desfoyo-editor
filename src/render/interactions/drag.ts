import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { EditorStoreApi } from '../../core/store';
import type { Node } from '../../schema';
import { findNodeInTree } from '../../core/tree';
import { applyGroupMove } from './groupTransformMath';

// Raw Pixi v8 pointer events — no @pixi/react. pointerdown resolves
// selection (plain click vs shift-click toggle) and starts the drag;
// pointermove/pointerup are listened on `stage` (not the object) so the
// drag continues even if the pointer leaves the object's bounds mid-move.
// Delta is computed via event.getLocalPosition(pageContainer) rather than
// event.global, so it stays correct once pageContainer has a non-identity
// zoom/pan transform (Phase 2). If multiple nodes are selected, dragging
// any one of them moves the whole selection by the same delta — this is
// NOT a GroupNode, just independent per-node UpdateTransform dispatches.
// See CONTEXT.md "Node" and "Command".
export function attachDrag(
  obj: Container,
  node: Node,
  store: EditorStoreApi,
  stage: Container,
  pageContainer: Container,
): void {
  obj.eventMode = 'static';
  obj.cursor = node.locked ? 'default' : 'move';

  obj.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation();

    const currentSelection = store.getState().selectedNodeIds;
    if (event.shiftKey) {
      store.getState().select(node.id, 'toggle');
    } else if (!currentSelection.has(node.id)) {
      // Plain click on an already-multi-selected node keeps the whole
      // selection (so you can drag a multi-select by any member); plain
      // click on anything else replaces the selection.
      store.getState().select(node.id, 'replace');
    }
    if (node.locked) return;

    const pageId = store.getState().activePageId;
    const page = store.getState().document.pages.find((p) => p.id === pageId);
    const selectedIds = Array.from(store.getState().selectedNodeIds);
    const startNodes: Node[] = page
      ? selectedIds.map((id) => findNodeInTree(page.children, id)?.node).filter((n): n is Node => !!n)
      : [];
    if (startNodes.length === 0) startNodes.push(node);

    const startWorld = event.getLocalPosition(pageContainer);
    store.getState().beginGesture(`drag:${node.id}`);

    const onMove = (moveEvent: FederatedPointerEvent) => {
      const current = moveEvent.getLocalPosition(pageContainer);
      const delta = { x: current.x - startWorld.x, y: current.y - startWorld.y };
      for (const patch of applyGroupMove(startNodes, delta)) {
        store.getState().dispatch({
          type: 'UpdateTransform',
          pageId,
          nodeId: patch.nodeId,
          patch: patch.transform,
        });
      }
    };

    const onUp = () => {
      stage.off('pointermove', onMove);
      stage.off('pointerup', onUp);
      stage.off('pointerupoutside', onUp);
      store.getState().endGesture();
    };

    stage.on('pointermove', onMove);
    stage.on('pointerup', onUp);
    stage.on('pointerupoutside', onUp);
  });
}
