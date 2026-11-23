import type { EditorStore, EditorStoreApi } from '../core/store';
import { computeSelectionBounds } from '../render/interactions/groupTransformMath';
import { selectedNodesOf, selectionBox, worldPoint } from './SelectionOverlay';

/** Selection box in CSS px relative to the Editor's host element; rotation (deg) is 0 for multi-select. */
export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

type RectState = Pick<EditorStore, 'document' | 'activePageId' | 'selectedNodeIds' | 'camera'>;

// Same world boxes SelectionOverlay draws (single: warped text box; multi: computeSelectionBounds),
// as an axis-aligned rect through the camera. Canvas-local = host-local (canvas sits at the host's
// top-left in both modes; the stage offset lives in camera.pan).
export function selectionRect(state: RectState): SelectionRect | null {
  const nodes = selectedNodesOf(state);
  if (nodes.length === 0) return null;
  let min, max;
  if (nodes.length === 1) {
    const b = selectionBox(nodes[0]);
    const corners = [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x, y: b.y + b.height },
      { x: b.x + b.width, y: b.y + b.height },
    ].map((c) => worldPoint(nodes[0], c));
    min = { x: Math.min(...corners.map((c) => c.x)), y: Math.min(...corners.map((c) => c.y)) };
    max = { x: Math.max(...corners.map((c) => c.x)), y: Math.max(...corners.map((c) => c.y)) };
  } else {
    ({ min, max } = computeSelectionBounds(nodes));
  }
  const { zoom, panX, panY } = state.camera;
  return {
    x: min.x * zoom + panX,
    y: min.y * zoom + panY,
    width: (max.x - min.x) * zoom,
    height: (max.y - min.y) * zoom,
    rotation: nodes.length === 1 ? (nodes[0].transform.rotation * 180) / Math.PI : 0,
  };
}

export function sameRect(a: SelectionRect | null, b: SelectionRect | null): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height && a.rotation === b.rotation;
}

// EditorProps.onSelectionRectChange: at most once per animation frame, only when the rect differs
// from the last one sent. `host` resizes also trigger a check (stage refits move the camera anyway).
export function watchSelectionRect(
  store: EditorStoreApi,
  onChange: (rect: SelectionRect | null) => void,
  host?: HTMLElement | null,
): () => void {
  let last: SelectionRect | null = null;
  let frame = 0;
  const flush = () => {
    frame = 0;
    const rect = selectionRect(store.getState());
    if (sameRect(rect, last)) return;
    last = rect;
    onChange(rect);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(flush);
  };
  const unsubscribe = store.subscribe((s, p) => {
    if (s.document !== p.document || s.selectedNodeIds !== p.selectedNodeIds || s.camera !== p.camera || s.activePageId !== p.activePageId) schedule();
  });
  const observer = host && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
  if (host) observer?.observe(host);
  schedule();
  return () => {
    unsubscribe();
    observer?.disconnect();
    if (frame) cancelAnimationFrame(frame);
  };
}
