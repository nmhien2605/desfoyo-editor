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
