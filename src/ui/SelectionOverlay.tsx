import { useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore, useEditorStoreApi, useCanvasContext } from './EditorContext';
import { createViewport, type Point, type Viewport } from '../render/viewport';
import { rotateVector, computeResize, type ResizeHandle } from '../render/interactions/resizeMath';
import { angleBetween, computeRotation } from '../render/interactions/rotate';
import { computeSelectionBounds, applyGroupRotate } from '../render/interactions/groupTransformMath';
import type { Rect } from '../render/interactions/marquee';
import type { SnapGuide } from '../render/interactions/snapping';
import type { ImageNode, Node, TextNode, Transform } from '../schema';

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
  const { canvas } = useCanvasContext();
  const activePageId = useEditorStore((s) => s.activePageId);
  const camera = useEditorStore((s) => s.camera);
  const marqueeRect = useEditorStore((s) => s.marqueeRect);
  const activeGuides = useEditorStore((s) => s.activeGuides);
  // useShallow: .filter() below allocates a new array every call — without
  // shallow comparison, useSyncExternalStore sees a "new" snapshot on every
  // render (even when the selection is unchanged) and loops.
  const selectedNodes = useEditorStore(
    useShallow((s) => {
      const children = s.document.pages.find((p) => p.id === s.activePageId)?.children ?? [];
      return children.filter((n) => s.selectedNodeIds.has(n.id));
    }),
  );

  if (!canvas) return null;
  const viewport = createViewport(canvas, () => camera);

  const extras = (
    <>
      {marqueeRect && <Marquee rect={marqueeRect} viewport={viewport} />}
      {activeGuides.length > 0 && <SnapGuides guides={activeGuides} viewport={viewport} />}
    </>
  );

  if (selectedNodes.length === 0) return <div className="pointer-events-none absolute inset-0">{extras}</div>;
  if (selectedNodes.length > 1) {
    return (
      <>
        <MultiSelectionOverlay nodes={selectedNodes} activePageId={activePageId} />
        <div className="pointer-events-none absolute inset-0">{extras}</div>
      </>
    );
  }

  const node = selectedNodes[0];
  if (node.locked) return <div className="pointer-events-none absolute inset-0">{extras}</div>;
  return (
    <SingleSelectionOverlay node={node} activePageId={activePageId} camera={camera} viewport={viewport} extras={extras} />
  );
}

// Split out from SelectionOverlay so the crop-mode toggle (double-click an
// image node's bounding box) can be local component state keyed to the
// selected node's id, without lifting ephemeral "am I cropping" state into
// the store the way Camera/Grid/Snapping are (crop mode is UI-only, never
// undoable, and only ever relevant while exactly one image node is
// selected).
function SingleSelectionOverlay({
  node,
  activePageId,
  camera,
  viewport,
  extras,
}: {
  node: Node;
  activePageId: string;
  camera: { zoom: number; panX: number; panY: number };
  viewport: Viewport;
  extras: ReactNode;
}) {
  const store = useEditorStoreApi();
  const [croppingNodeId, setCroppingNodeId] = useState<string | null>(null);
  const isCropping = node.type === 'image' && croppingNodeId === node.id;
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
        onDoubleClick={() => node.type === 'image' && setCroppingNodeId(isCropping ? null : node.id)}
        className={`absolute border-2 border-blue-500 ${node.type === 'image' ? 'pointer-events-auto' : ''}`}
        style={{
          left: topLeftScreen.x,
          top: topLeftScreen.y,
          width: node.size.width * camera.zoom,
          height: node.size.height * camera.zoom,
          transformOrigin: `${originX * 100}% ${originY * 100}%`,
          transform: `rotate(${rotationDeg}deg)`,
        }}
      />
      {!isCropping &&
        HANDLES.map((handle) => {
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
      {!isCropping && (
        <div
          onPointerDown={startRotate}
          className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-blue-500 bg-white"
          style={{ left: rotateHandlePos.x, top: rotateHandlePos.y }}
        />
      )}
      {node.type === 'text' && node.warp?.type === 'path' && (
        <TextPathHandles node={node} activePageId={activePageId} viewport={viewport} />
      )}
      {isCropping && node.type === 'image' && (
        <ImageCropHandles node={node} activePageId={activePageId} viewport={viewport} />
      )}
      {extras}
    </div>
  );
}

// 3 draggable dots (start/control/end of the quadratic bezier) for a text
// node's 'path' warp — the whole path-authoring UX for v1 (no separate pen
// tool). Points are stored normalized (0..1, see schema/document.ts's
// PathData) and rendered via worldPoint() the same way resize-handle
// corners are, since node.size defines the same local 0..1-scaled space.
function TextPathHandles({ node, activePageId, viewport }: { node: TextNode; activePageId: string; viewport: Viewport }) {
  const store = useEditorStoreApi();
  const pathId = node.warp?.pathId;
  const points = useEditorStore((s) => (pathId ? s.document.paths[pathId]?.points : undefined));
  if (!pathId || !points) return null;

  const startDrag = (i: number) => (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    const startPoints = points;
    store.getState().beginGesture(`path:${pathId}:${i}`);

    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      // Same world-delta -> node-local-delta projection computeResize uses:
      // un-rotate, then un-scale. Points are normalized 0..1, so also
      // divide by node.size to turn the local pixel delta into a uv delta.
      const local = rotateVector(worldDelta, -node.transform.rotation);
      const scaleX = node.transform.scaleX || 1;
      const scaleY = node.transform.scaleY || 1;
      const duv = { x: local.x / scaleX / node.size.width, y: local.y / scaleY / node.size.height };
      const next = [...startPoints] as typeof startPoints;
      next[i * 2] = startPoints[i * 2] + duv.x;
      next[i * 2 + 1] = startPoints[i * 2 + 1] + duv.y;
      store.getState().dispatch({ type: 'UpdatePath', pageId: activePageId, nodeId: node.id, pathId, points: next });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      store.getState().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
      {[0, 1, 2].map((i) => {
        const local = { x: points[i * 2] * node.size.width, y: points[i * 2 + 1] * node.size.height };
        const pos = viewport.toScreen(worldPoint(node, local));
        return (
          <div
            key={i}
            onPointerDown={startDrag(i)}
            className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-500 bg-white"
            style={{ left: pos.x, top: pos.y }}
          />
        );
      })}
    </>
  );
}

const CROP_HANDLES: Array<'nw' | 'ne' | 'se' | 'sw'> = ['nw', 'ne', 'se', 'sw'];
const DEFAULT_CROP = { x: 0, y: 0, width: 1, height: 1 };

// node.crop is normalized (0..1 fractions of the image's own display box,
// same convention warp path points use for node.size) — see
// imageRenderer.ts's applyCrop for how that maps onto the actual texture's
// pixel frame at render time.
export function updateCropHandle(
  crop: { x: number; y: number; width: number; height: number },
  handle: 'nw' | 'ne' | 'se' | 'sw',
  duv: Point,
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = crop;
  if (handle.includes('w')) {
    x += duv.x;
    width -= duv.x;
  } else {
    width += duv.x;
  }
  if (handle.includes('n')) {
    y += duv.y;
    height -= duv.y;
  } else {
    height += duv.y;
  }
  x = Math.max(0, Math.min(1, x));
  y = Math.max(0, Math.min(1, y));
  width = Math.max(0.01, Math.min(1 - x, width));
  height = Math.max(0.01, Math.min(1 - y, height));
  return { x, y, width, height };
}

// 4 corner handles for freeform crop, entered via double-clicking an image
// node's bounding box (see isCropping in SingleSelectionOverlay). Reuses
// the exact toWorld/toScreen + rotateVector un-rotate/un-scale drag math
// TextPathHandles already uses for its normalized-uv dots.
function ImageCropHandles({ node, activePageId, viewport }: { node: ImageNode; activePageId: string; viewport: Viewport }) {
  const store = useEditorStoreApi();
  const crop = node.crop ?? DEFAULT_CROP;

  const startDrag = (handle: 'nw' | 'ne' | 'se' | 'sw') => (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    const startCrop = crop;
    store.getState().beginGesture(`crop:${node.id}:${handle}`);

    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      const local = rotateVector(worldDelta, -node.transform.rotation);
      const scaleX = node.transform.scaleX || 1;
      const scaleY = node.transform.scaleY || 1;
      const duv = { x: local.x / scaleX / node.size.width, y: local.y / scaleY / node.size.height };
      const nextCrop = updateCropHandle(startCrop, handle, duv);
      store.getState().dispatch({ type: 'UpdateProps', pageId: activePageId, nodeId: node.id, patch: { crop: nextCrop } });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      store.getState().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
      {CROP_HANDLES.map((handle) => {
        const local = {
          x: (handle.includes('w') ? crop.x : crop.x + crop.width) * node.size.width,
          y: (handle.includes('n') ? crop.y : crop.y + crop.height) * node.size.height,
        };
        const pos = viewport.toScreen(worldPoint(node, local));
        return (
          <div
            key={handle}
            onPointerDown={startDrag(handle)}
            className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500 bg-white"
            style={{ left: pos.x, top: pos.y, cursor: `${handle}-resize` }}
          />
        );
      })}
    </>
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

function Marquee({ rect, viewport }: { rect: Rect; viewport: Viewport }) {
  const topLeft = viewport.toScreen({ x: rect.x, y: rect.y });
  const bottomRight = viewport.toScreen({ x: rect.x + rect.width, y: rect.y + rect.height });
  return (
    <div
      className="absolute border border-dashed border-blue-400 bg-blue-400/10"
      style={{
        left: topLeft.x,
        top: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
      }}
    />
  );
}

// Full-length lines through each matched snap candidate, spanning the whole
// overlay rather than just the dragged object — matches standard smart-guide
// UX (Figma/Canva draw guides across the visible canvas, not just locally).
function SnapGuides({ guides, viewport }: { guides: SnapGuide[]; viewport: Viewport }) {
  return (
    <>
      {guides.map((guide, i) => {
        const a = viewport.toScreen(guide.axis === 'x' ? { x: guide.value, y: 0 } : { x: 0, y: guide.value });
        return (
          <div
            key={i}
            className="absolute bg-pink-500"
            style={
              guide.axis === 'x'
                ? { left: a.x, top: 0, width: 1, height: '100%' }
                : { left: 0, top: a.y, width: '100%', height: 1 }
            }
          />
        );
      })}
    </>
  );
}
