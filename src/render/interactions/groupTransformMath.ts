import type { Node } from '../../schema';
import { rotateVector } from './resizeMath';

export interface NodeTransformPatch {
  nodeId: string;
  transform: { x: number; y: number; rotation?: number };
}

export interface SelectionBounds {
  pivot: { x: number; y: number };
  min: { x: number; y: number };
  max: { x: number; y: number };
}

// Multi-select is NOT a GroupNode — this only ever applies deltas to each
// node's own transform, never wraps them in a group. Real GroupNode
// transform needs no special math (Pixi's container nesting handles it),
// this module is only for ungrouped multi-select.
export function computeSelectionBounds(nodes: Node[]): SelectionBounds {
  const corners = nodes.flatMap((node) => nodeWorldCorners(node));
  const min = { x: Math.min(...corners.map((c) => c.x)), y: Math.min(...corners.map((c) => c.y)) };
  const max = { x: Math.max(...corners.map((c) => c.x)), y: Math.max(...corners.map((c) => c.y)) };
  return { pivot: { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2 }, min, max };
}

// Single-node axis-aligned world bbox — shared by marquee hit-testing,
// align/distribute, and snapping. Just computeSelectionBounds([node]).
export function nodeBounds(node: Node): SelectionBounds {
  return computeSelectionBounds([node]);
}

export function nodeWorldCorners(node: Node): Array<{ x: number; y: number }> {
  const { transform, size } = node;
  const originX = transform.originX ?? 0;
  const originY = transform.originY ?? 0;
  const pivotLocal = { x: originX * size.width, y: originY * size.height };
  const localCorners = [
    { x: 0, y: 0 },
    { x: size.width, y: 0 },
    { x: 0, y: size.height },
    { x: size.width, y: size.height },
  ];
  return localCorners.map((corner) => {
    const offset = rotateVector(
      { x: (corner.x - pivotLocal.x) * transform.scaleX, y: (corner.y - pivotLocal.y) * transform.scaleY },
      transform.rotation,
    );
    return { x: transform.x + offset.x, y: transform.y + offset.y };
  });
}

// Translate every node by the same world delta — pivot-independent, no
// rotation math needed.
export function applyGroupMove(nodes: Node[], delta: { x: number; y: number }): NodeTransformPatch[] {
  return nodes.map((node) => ({
    nodeId: node.id,
    transform: { x: node.transform.x + delta.x, y: node.transform.y + delta.y },
  }));
}

// Rotate every node's pivot around the shared external pivot by
// deltaRotation, AND add deltaRotation to each node's own rotation (so
// objects spin in place while also orbiting the shared pivot — matches
// standard multi-select rotate behavior).
// ponytail: move + rotate cover the DoD's group/ungroup scenario (which
// rotates a real GroupNode, needing no math here at all); multi-select
// resize isn't required by the DoD and is deferred.
export function applyGroupRotate(
  nodes: Node[],
  pivot: { x: number; y: number },
  deltaRotation: number,
): NodeTransformPatch[] {
  return nodes.map((node) => {
    const relative = { x: node.transform.x - pivot.x, y: node.transform.y - pivot.y };
    const rotated = rotateVector(relative, deltaRotation);
    return {
      nodeId: node.id,
      transform: {
        x: pivot.x + rotated.x,
        y: pivot.y + rotated.y,
        rotation: node.transform.rotation + deltaRotation,
      },
    };
  });
}
