import type { PointerEvent as ReactPointerEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore, useEditorStoreApi, useCanvasContext } from './EditorContext';
import { createViewport, type Point } from '../render/viewport';
import { rotateVector, computeResize, type ResizeHandle } from '../render/interactions/resizeMath';
import { angleBetween, computeRotation } from '../render/interactions/rotate';
import { computeSelectionBounds, applyGroupRotate } from '../render/interactions/groupTransformMath';
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
  const camera = useEditorStore((s) => s.camera);
  // useShallow: .filter() below allocates a new array every call — without
  // shallow comparison, useSyncExternalStore sees a "new" snapshot on every
  // render (even when the selection is unchanged) and loops.
  const selectedNodes = useEditorStore(
    useShallow((s) => {
      const children = s.document.pages.find((p) => p.id === s.activePageId)?.children ?? [];
      return children.filter((n) => s.selectedNodeIds.has(n.id));
    }),
  );

  if (!canvas || selectedNodes.length === 0) return null;
  if (selectedNodes.length > 1) {
    return <MultiSelectionOverlay nodes={selectedNodes} activePageId={activePageId} />;
  }

  const node = selectedNodes[0];
  if (node.locked) return null;
  const viewport = createViewport(canvas, () => camera);
  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;
  // Un-rotated top-left corner in world space; CSS `transform: rotate()`
  // with transformOrigin does the visual rotation, so this only needs the
  // camera's zoom/pan applied, not the node's own rotation.
  const topLeftScreen = viewport.toScreen({
    x: node.transform.x - originX * node.size.width,
    y: node.transform.y - originY * node.size.height,
  });
  const rotationDeg = (node.transform.rotation * 180) / Math.PI;

  const startResize = (handle: ResizeHandle) => (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    store.getState().beginGesture(`resize:${node.id}`);

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
      store.getState().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startRotate = (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const pivotWorld = { x: node.transform.x, y: node.transform.y };
    const grabWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    const grabOffset = angleBetween(pivotWorld, grabWorld) - node.transform.rotation;
    store.getState().beginGesture(`rotate:${node.id}`);

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
      store.getState().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const rotateHandleLocal = { x: node.size.width / 2, y: -24 / camera.zoom };
  const rotateHandlePos = viewport.toScreen(worldPoint(node, rotateHandleLocal));

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute border-2 border-blue-500"
        style={{
          left: topLeftScreen.x,
          top: topLeftScreen.y,
          width: node.size.width * camera.zoom,
          height: node.size.height * camera.zoom,
          transformOrigin: `${originX * 100}% ${originY * 100}%`,
          transform: `rotate(${rotationDeg}deg)`,
        }}
      />
      {HANDLES.map((handle) => {
        const pos = viewport.toScreen(worldPoint(node, localCorner(handle, node.size.width, node.size.height)));
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

// Ungrouped multi-select: one axis-aligned bbox outline (rotation is always
// 0 here since members may have independent rotations — matches standard
// multi-select UX) with a single rotate handle that orbits every member
// around the shared bbox-center pivot. No resize handles — multi-select
// resize isn't required by the Phase 2 Pass A DoD, deferred alongside the
// rest of groupTransformMath's documented scope cut.
function MultiSelectionOverlay({ nodes, activePageId }: { nodes: Node[]; activePageId: string }) {
  const store = useEditorStoreApi();
  const { canvas } = useCanvasContext();
  const camera = useEditorStore((s) => s.camera);
  if (!canvas) return null;
  const viewport = createViewport(canvas, () => camera);
  const bounds = computeSelectionBounds(nodes);
  const screenMin = viewport.toScreen(bounds.min);

  const startRotate = (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const pivotWorld = bounds.pivot;
    const grabWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    let lastAngle = angleBetween(pivotWorld, grabWorld);
    store.getState().beginGesture('group-rotate');

    const onMove = (moveEvent: PointerEvent) => {
      const pointerWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const angle = angleBetween(pivotWorld, pointerWorld);
      const deltaRotation = angle - lastAngle;
      lastAngle = angle;
      for (const patch of applyGroupRotate(nodes, pivotWorld, deltaRotation)) {
        store.getState().dispatch({
          type: 'UpdateTransform',
          pageId: activePageId,
          nodeId: patch.nodeId,
          patch: patch.transform,
        });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      store.getState().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const rotateHandlePos = viewport.toScreen({ x: bounds.pivot.x, y: bounds.min.y - 24 / camera.zoom });

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute border-2 border-dashed border-blue-500"
        style={{
          left: screenMin.x,
          top: screenMin.y,
          width: (bounds.max.x - bounds.min.x) * camera.zoom,
          height: (bounds.max.y - bounds.min.y) * camera.zoom,
        }}
      />
      <div
        onPointerDown={startRotate}
        className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-blue-500 bg-white"
        style={{ left: rotateHandlePos.x, top: rotateHandlePos.y }}
      />
    </div>
  );
}
