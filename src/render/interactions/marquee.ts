import type { Container, FederatedPointerEvent } from 'pixi.js';
import { activePage, type EditorStoreApi } from '../../core/store';
import { nodeBounds } from './groupTransformMath';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function normalizeRect(start: { x: number; y: number }, end: { x: number; y: number }): Rect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function intersects(rect: Rect, bounds: { min: { x: number; y: number }; max: { x: number; y: number } }): boolean {
  return (
    rect.x <= bounds.max.x &&
    rect.x + rect.width >= bounds.min.x &&
    rect.y <= bounds.max.y &&
    rect.y + rect.height >= bounds.min.y
  );
}

// Rubber-band select: only fires from a `stage` pointerdown, which — since
// every node's own pointerdown handler in drag.ts calls stopPropagation() —
// only bubbles up here on an empty-canvas click. See CONTEXT.md "Selection".
export function attachMarquee(stage: Container, pageContainer: Container, store: EditorStoreApi): void {
  stage.on('pointerdown', (event: FederatedPointerEvent) => {
    if (event.target !== stage) return;

    const startWorld = event.getLocalPosition(pageContainer);
    if (!event.shiftKey) store.getState().select(null);

    const onMove = (moveEvent: FederatedPointerEvent) => {
      const current = moveEvent.getLocalPosition(pageContainer);
      store.getState().setMarqueeRect(normalizeRect(startWorld, current));
    };

    const onUp = () => {
      stage.off('pointermove', onMove);
      stage.off('pointerup', onUp);
      stage.off('pointerupoutside', onUp);

      const rect = store.getState().marqueeRect;
      store.getState().setMarqueeRect(null);
      if (!rect) return;

      const page = activePage(store.getState());
      if (!page) return;
      for (const node of page.children) {
        if (intersects(rect, nodeBounds(node))) store.getState().select(node.id, 'toggle');
      }
    };

    stage.on('pointermove', onMove);
    stage.on('pointerup', onUp);
    stage.on('pointerupoutside', onUp);
  });
}
