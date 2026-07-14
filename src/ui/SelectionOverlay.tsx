import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEditorStore, useEditorStoreApi, useCanvasContext } from './EditorContext';
import { createViewport, type Point } from '../render/viewport';
import { rotateVector, computeResize, type ResizeHandle } from '../render/interactions/resizeMath';
import { angleBetween, computeRotation } from '../render/interactions/rotate';
import type { Node, Transform } from '../schema';

const HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function localCorner(handle: ResizeHandle, width: number, height: number): Point {
  const x = handle.includes('e') ? width : handle.includes('w') ? 0 : width / 2;
  const y = handle.includes('s') ? height : handle.includes('n') ? 0 : height / 2;
  return { x, y };
}

function worldPoint(node: Node, local: Point): Point {
  const { transform, size } = node;
  const pivotLocal = { x: (transform.originX ?? 0) * size.width, y: (transform.originY ?? 0) * size.height };
  const offset = rotateVector(
    { x: (local.x - pivotLocal.x) * transform.scaleX, y: (local.y - pivotLocal.y) * transform.scaleY },
    transform.rotation,
  );
  return { x: transform.x + offset.x, y: transform.y + offset.y };
}

export function SelectionOverlay() {
  const store = useEditorStoreApi();
  const { canvas } = useCanvasContext();
  const activePageId = useEditorStore((s) => s.activePageId);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const node = useEditorStore((s) =>
    s.document.pages.find((p) => p.id === s.activePageId)?.children.find((n) => n.id === selectedNodeId),
  );

  if (!node || !canvas || node.locked) return null;
  const viewport = createViewport(canvas);
  // World space and the overlay's local pixel space coincide (the overlay
  // div shares the canvas element's exact top-left origin — no viewport
  // offset applies here). getBoundingClientRect-based conversion is only
  // needed for native PointerEvents below, whose clientX/clientY are
  // viewport-relative.
  const pivotLocal = { x: node.transform.x, y: node.transform.y };
  const rotationDeg = (node.transform.rotation * 180) / Math.PI;

  const startResize = (handle: ResizeHandle) => (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });

    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const delta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      const result = computeResize(node, handle, delta);
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: { size: result.size },
      });
      store.getState().dispatch({
        type: 'UpdateTransform',
        pageId: activePageId,
        nodeId: node.id,
        patch: { x: result.transform.x, y: result.transform.y } as Partial<Transform>,
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startRotate = (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const pivotWorld = { x: node.transform.x, y: node.transform.y };
    const grabWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    const grabOffset = angleBetween(pivotWorld, grabWorld) - node.transform.rotation;

    const onMove = (moveEvent: PointerEvent) => {
      const pointerWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const rotation = computeRotation(pivotWorld, pointerWorld, grabOffset);
      store.getState().dispatch({
        type: 'UpdateTransform',
        pageId: activePageId,
        nodeId: node.id,
        patch: { rotation },
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const rotateHandleLocal = { x: node.size.width / 2, y: -24 };
  const rotateHandlePos = worldPoint(node, rotateHandleLocal);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute border-2 border-blue-500"
        style={{
          left: pivotLocal.x - (node.transform.originX ?? 0) * node.size.width,
          top: pivotLocal.y - (node.transform.originY ?? 0) * node.size.height,
          width: node.size.width,
          height: node.size.height,
          transformOrigin: `${(node.transform.originX ?? 0) * 100}% ${(node.transform.originY ?? 0) * 100}%`,
          transform: `rotate(${rotationDeg}deg)`,
        }}
      />
      {HANDLES.map((handle) => {
        const pos = worldPoint(node, localCorner(handle, node.size.width, node.size.height));
        return (
          <div
            key={handle}
            onPointerDown={startResize(handle)}
            className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500 bg-white"
            style={{ left: pos.x, top: pos.y, cursor: `${handle}-resize` }}
          />
        );
      })}
      <div
        onPointerDown={startRotate}
        className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-blue-500 bg-white"
        style={{ left: rotateHandlePos.x, top: rotateHandlePos.y }}
      />
    </div>
  );
}
