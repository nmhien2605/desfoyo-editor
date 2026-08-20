import { Matrix, type Container } from 'pixi.js';
import type { Node, Size, Transform } from '../schema';
import { buildFilters } from '../effects/buildFilters';

// Pixi's DisplayObject.pivot is in the object's local, unscaled space, and
// its transform order (subtract pivot, then scale/rotate, then add
// position) already matches the schema's convention: transform.x/y is the
// pivot's position, originX/originY (0..1) locate the pivot inside the
// node's own bounding box. No extra math is needed — that's why the schema
// convention was chosen to mirror Pixi's own model.
export function applyTransform(obj: Container, node: Node): void {
  const { transform, size } = node;
  const originX = transform.originX ?? 0;
  const originY = transform.originY ?? 0;

  obj.pivot.set(originX * size.width, originY * size.height);
  obj.position.set(transform.x, transform.y);
  obj.scale.set(transform.scaleX, transform.scaleY);
  obj.rotation = transform.rotation;
  obj.skew.set(transform.skewX ?? 0, transform.skewY ?? 0);
  obj.alpha = node.opacity;
  obj.visible = node.visible;
  obj.blendMode = node.blendMode ?? 'normal';
  obj.filters = buildFilters(node.effects, node.type === 'text' ? node.font.size : undefined);
}

function transformToMatrix(t: Transform, size: Size): Matrix {
  const pivotX = (t.originX ?? 0) * size.width;
  const pivotY = (t.originY ?? 0) * size.height;
  return new Matrix().setTransform(t.x, t.y, pivotX, pivotY, t.scaleX, t.scaleY, t.rotation, t.skewX ?? 0, t.skewY ?? 0);
}

// Group/ungroup need to rewrite a node's transform when it moves between
// parent containers (page <-> a GroupNode), so the document's stored
// numbers keep meaning the same visual position/rotation/scale. Verified
// empirically against Pixi's own Container nesting (see git history) —
// Matrix.appendFrom(A, B) composes as "apply A's transform, then B's".
//
// composeTransform: given a parent's world transform and a child's
// transform expressed in that parent's local space, returns the child's
// resulting transform in the parent's own parent's space (i.e. one level
// up — "what would this child's transform be if it moved directly into
// the parent's parent, unchanged visually").
export function composeTransform(
  parent: Transform,
  parentSize: Size,
  child: Transform,
  childSize: Size,
): Transform {
  const parentMatrix = transformToMatrix(parent, parentSize);
  const childMatrix = transformToMatrix(child, childSize);
  const worldMatrix = new Matrix().appendFrom(childMatrix, parentMatrix);
  return matrixToTransform(worldMatrix, child, childSize);
}

// decomposeTransform: inverse of composeTransform — given a node's current
// transform expressed in some outer space (e.g. page.children) and the
// transform of a new parent it's about to move into (e.g. a new GroupNode),
// returns the node's transform re-expressed relative to that new parent, so
// composeTransform(newParent, ..., result, ...) reproduces the original.
export function decomposeTransform(
  newParent: Transform,
  newParentSize: Size,
  worldChild: Transform,
  childSize: Size,
): Transform {
  const parentMatrix = transformToMatrix(newParent, newParentSize);
  const worldMatrix = transformToMatrix(worldChild, childSize);
  const parentInverse = parentMatrix.clone().invert();
  const localMatrix = new Matrix().appendFrom(worldMatrix, parentInverse);
  return matrixToTransform(localMatrix, worldChild, childSize);
}

function matrixToTransform(matrix: Matrix, origin: Transform, size: Size): Transform {
  const pivotX = (origin.originX ?? 0) * size.width;
  const pivotY = (origin.originY ?? 0) * size.height;
  const target = {
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    pivot: { x: pivotX, y: pivotY },
    skew: { x: 0, y: 0 },
    rotation: 0,
  };
  matrix.decompose(target);
  return {
    x: target.position.x,
    y: target.position.y,
    scaleX: target.scale.x,
    scaleY: target.scale.y,
    rotation: target.rotation,
    skewX: target.skew.x,
    skewY: target.skew.y,
    originX: origin.originX,
    originY: origin.originY,
  };
}
