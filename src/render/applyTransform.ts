import type { Container } from 'pixi.js';
import type { Node } from '../schema';
import { buildFilters } from '../effects/dropShadowFilter';

// Pixi's DisplayObject.pivot is in the object's local, unscaled space, and
// its transform order (subtract pivot, then scale/rotate, then add
// position) already matches the schema's convention: transform.x/y is the
// pivot's position, originX/originY (0..1) locate the pivot inside the
// node's own bounding box. No extra math is needed — that's why the schema
// convention was chosen to mirror Pixi's own model. See CONTEXT.md "Node".
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
  obj.filters = buildFilters(node.effects);
}
