export interface Point {
  x: number;
  y: number;
}

// Trivial compared to resize since rotation is already pivot-centered by
// convention — no anchor recomputation needed.
export function angleBetween(pivotWorld: Point, pointWorld: Point): number {
  return Math.atan2(pointWorld.y - pivotWorld.y, pointWorld.x - pivotWorld.x);
}

// grabOffset = the angle between pointer and pivot at grab time, minus the
// node's rotation at that time — keeps rotation continuous instead of
// snapping the node to point straight at the cursor on grab.
export function computeRotation(pivotWorld: Point, pointerWorld: Point, grabOffset: number): number {
  return angleBetween(pivotWorld, pointerWorld) - grabOffset;
}
