import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { EditorStoreApi } from '../../core/store';
import type { Node } from '../../schema';
import { selectNode } from './selection';

// Raw Pixi v8 pointer events — no @pixi/react. pointerdown starts the drag
// and selects the node; pointermove/pointerup are listened on `stage` (not
// the object) so the drag continues even if the pointer leaves the
// object's bounds mid-move. Because transform.x/y is the pivot, translating
// is a pure delta-add regardless of rotation/origin — no compensation
// needed. See CONTEXT.md "Node".
export function attachDrag(obj: Container, node: Node, store: EditorStoreApi, stage: Container): void {
  obj.eventMode = 'static';
  obj.cursor = node.locked ? 'default' : 'move';

  obj.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation();
    selectNode(store, node.id);
    if (node.locked) return;

    const pageId = store.getState().activePageId;
    const startWorld = { x: event.global.x, y: event.global.y };
    const startTransform = { ...node.transform };

    const onMove = (moveEvent: FederatedPointerEvent) => {
      const dx = moveEvent.global.x - startWorld.x;
      const dy = moveEvent.global.y - startWorld.y;
      store.getState().dispatch({
        type: 'UpdateTransform',
        pageId,
        nodeId: node.id,
        patch: { x: startTransform.x + dx, y: startTransform.y + dy },
      });
    };

    const onUp = () => {
      stage.off('pointermove', onMove);
      stage.off('pointerup', onUp);
      stage.off('pointerupoutside', onUp);
    };

    stage.on('pointermove', onMove);
    stage.on('pointerup', onUp);
    stage.on('pointerupoutside', onUp);
  });
}
