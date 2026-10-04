import type { Node } from '../../schema';

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface ResizeResult {
  size: { width: number; height: number };
  transform: { x: number; y: number };
}

const MIN_SIZE = 2;

// (fixedXFraction, fixedYFraction) locate the corner/edge-point that must
// stay put in world space while the opposite edge/corner is dragged. For
// edge handles the unchanged axis uses originX/originY so that fraction
// naturally cancels against the pivot (no drift on the axis that isn't
// being resized).
function anchorFraction(handle: ResizeHandle, originX: number, originY: number) {
  switch (handle) {
    case 'nw':
      return { x: 1, y: 1 };
    case 'ne':
      return { x: 0, y: 1 };
    case 'sw':
      return { x: 1, y: 0 };
    case 'se':
      return { x: 0, y: 0 };
    case 'n':
      return { x: originX, y: 1 };
    case 's':
      return { x: originX, y: 0 };
    case 'e':
      return { x: 0, y: originY };
    case 'w':
      return { x: 1, y: originY };
  }
}

export function rotateVector(v: { x: number; y: number }, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

// The one genuinely fiddly bit of Phase 1: opposite-corner-anchored resize
// needs the pivot's new world position recomputed, since transform.x/y is
// the pivot, not a corner. Isolated here as a pure,
// unit-testable function so it doesn't get buried in event-handler code.
export function computeResize(
  node: Node,
  handle: ResizeHandle,
  worldDelta: { x: number; y: number },
): ResizeResult {
  const { transform, size } = node;
  const originX = transform.originX ?? 0;
  const originY = transform.originY ?? 0;
  const scaleX = transform.scaleX || 1;
  const scaleY = transform.scaleY || 1;

  // Project the world-space mouse delta into the node's local, unscaled,
  // unrotated space.
  const unrotated = rotateVector(worldDelta, -transform.rotation);
  const localDelta = { x: unrotated.x / scaleX, y: unrotated.y / scaleY };

  const growX = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0;
  const growY = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0;

  const newWidth = Math.max(MIN_SIZE, size.width + growX * localDelta.x);
  const newHeight = Math.max(MIN_SIZE, size.height + growY * localDelta.y);

  const anchor = anchorFraction(handle, originX, originY);
  const oldPivotLocal = { x: originX * size.width, y: originY * size.height };
  const newPivotLocal = { x: originX * newWidth, y: originY * newHeight };
  const anchorLocalOld = { x: anchor.x * size.width, y: anchor.y * size.height };
  const anchorLocalNew = { x: anchor.x * newWidth, y: anchor.y * newHeight };

  const anchorOffsetOld = rotateVector(
    { x: (anchorLocalOld.x - oldPivotLocal.x) * scaleX, y: (anchorLocalOld.y - oldPivotLocal.y) * scaleY },
    transform.rotation,
  );
  const anchorWorldOld = { x: transform.x + anchorOffsetOld.x, y: transform.y + anchorOffsetOld.y };

  const anchorOffsetNew = rotateVector(
    { x: (anchorLocalNew.x - newPivotLocal.x) * scaleX, y: (anchorLocalNew.y - newPivotLocal.y) * scaleY },
    transform.rotation,
  );

  return {
    size: { width: newWidth, height: newHeight },
    transform: {
      x: anchorWorldOld.x - anchorOffsetNew.x,
      y: anchorWorldOld.y - anchorOffsetNew.y,
    },
  };
}

const MIN_SCALE = 0.01;

// Scale-resize for text (L14/L30): writes transform.scaleX/Y (like fabric)
// instead of node.size, which for text is the measured layout box. `box` is
// the node's selection box in local unscaled units (the warped bounds for
// text); the point of that box opposite the handle stays fixed in world space.
// Corners project the pointer onto the box diagonal, so the existing
// scaleX:scaleY ratio is kept; n/s change scaleY only, e/w scaleX only (a
// stretch — there is no wrap width to edit).
export function computeScaleResize(
  node: Node,
  handle: ResizeHandle,
  worldDelta: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number },
): { scaleX: number; scaleY: number; x: number; y: number } {
  const { transform, size } = node;
  const { scaleX: sx, scaleY: sy, rotation } = transform;
  const pivot = { x: (transform.originX ?? 0) * size.width, y: (transform.originY ?? 0) * size.height };
  // Handle position on the box as fractions; the anchor is its mirror.
  const hx = handle.includes('e') ? 1 : handle.includes('w') ? 0 : 0.5;
  const hy = handle.includes('s') ? 1 : handle.includes('n') ? 0 : 0.5;
  const anchor = { x: box.x + (1 - hx) * box.width, y: box.y + (1 - hy) * box.height };

  // anchor→dragged and anchor→pointer, both in scaled, unrotated space.
  const d = { x: (2 * hx - 1) * box.width * sx, y: (2 * hy - 1) * box.height * sy };
  const local = rotateVector(worldDelta, -rotation);
  const v = { x: d.x + local.x, y: d.y + local.y };
  const clamp = (f: number, s: number) => (Number.isFinite(f) ? Math.max(MIN_SCALE / Math.abs(s), f) : 1);
  let fx = 1;
  let fy = 1;
  if (hx !== 0.5 && hy !== 0.5) {
    const minS = Math.min(Math.abs(sx), Math.abs(sy));
    fx = fy = clamp((v.x * d.x + v.y * d.y) / (d.x * d.x + d.y * d.y), minS);
  } else if (hx !== 0.5) {
    fx = clamp(v.x / d.x, sx);
  } else {
    fy = clamp(v.y / d.y, sy);
  }

  const anchorOffsetOld = rotateVector({ x: (anchor.x - pivot.x) * sx, y: (anchor.y - pivot.y) * sy }, rotation);
  const anchorOffsetNew = rotateVector({ x: (anchor.x - pivot.x) * sx * fx, y: (anchor.y - pivot.y) * sy * fy }, rotation);
  return {
    scaleX: sx * fx,
    scaleY: sy * fy,
    x: transform.x + anchorOffsetOld.x - anchorOffsetNew.x,
    y: transform.y + anchorOffsetOld.y - anchorOffsetNew.y,
  };
}
