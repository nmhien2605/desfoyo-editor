import type { Container, FederatedPointerEvent } from 'pixi.js';
import { activePage, type EditorStoreApi } from '../../core/store';
import type { Node } from '../../schema';
import { findNodeInTree } from '../../core/tree';
import { applyGroupMove, computeSelectionBounds, nodeBounds } from './groupTransformMath';
import { computeSnap } from './snapping';

const SNAP_THRESHOLD_PX = 6;

// Raw Pixi v8 pointer events — no @pixi/react. pointerdown resolves
// selection (plain click vs shift-click toggle) and starts the drag;
// pointermove/pointerup are listened on `stage` (not the object) so the
// drag continues even if the pointer leaves the object's bounds mid-move.
// Delta is computed via event.getLocalPosition(pageContainer) rather than
// event.global, so it stays correct once pageContainer has a non-identity
// zoom/pan transform (Phase 2). If multiple nodes are selected, dragging
// any one of them moves the whole selection by the same delta — this is
// NOT a GroupNode, just independent per-node UpdateTransform dispatches.
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

    const state = store.getState();
    const pageId = state.activePageId;
    const page = activePage(state);
    const selectedIds = Array.from(store.getState().selectedNodeIds);
    const startNodes: Node[] = page
      ? selectedIds.map((id) => findNodeInTree(page.children, id)?.node).filter((n): n is Node => !!n)
      : [];
    if (startNodes.length === 0) startNodes.push(node);

    const startWorld = event.getLocalPosition(pageContainer);
    const startNodeIds = new Set(startNodes.map((n) => n.id));
    const siblingBounds = (page?.children ?? [])
      .filter((n) => !startNodeIds.has(n.id))
      .map((n) => nodeBounds(n));
    if (page) {
      siblingBounds.push({
        min: { x: 0, y: 0 },
        max: { x: page.size.width, y: page.size.height },
        pivot: { x: page.size.width / 2, y: page.size.height / 2 },
      });
    }
    store.getState().beginGesture(`drag:${node.id}`);

    const onMove = (moveEvent: FederatedPointerEvent) => {
      const current = moveEvent.getLocalPosition(pageContainer);
      const rawDelta = { x: current.x - startWorld.x, y: current.y - startWorld.y };
      const movingBounds = computeSelectionBounds(startNodes);
      movingBounds.min.x += rawDelta.x;
      movingBounds.max.x += rawDelta.x;
      movingBounds.pivot.x += rawDelta.x;
      movingBounds.min.y += rawDelta.y;
      movingBounds.max.y += rawDelta.y;
      movingBounds.pivot.y += rawDelta.y;

      const threshold = SNAP_THRESHOLD_PX / store.getState().camera.zoom;
      const { delta: snapOffset, guides } = computeSnap(movingBounds, siblingBounds, threshold);
      const delta = { x: rawDelta.x + snapOffset.x, y: rawDelta.y + snapOffset.y };

      // Object-snap takes priority; grid-snap only fills in an axis that
      // object-snap didn't already match.
      const grid = store.getState().grid;
      if (grid.enabled && grid.snap) {
        if (snapOffset.x === 0) delta.x += Math.round(movingBounds.min.x / grid.size) * grid.size - movingBounds.min.x;
        if (snapOffset.y === 0) delta.y += Math.round(movingBounds.min.y / grid.size) * grid.size - movingBounds.min.y;
      }
      store.getState().setActiveGuides(guides);

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
      store.getState().setActiveGuides([]);
      store.getState().endGesture();
    };

    stage.on('pointermove', onMove);
    stage.on('pointerup', onUp);
    stage.on('pointerupoutside', onUp);
  });
}
