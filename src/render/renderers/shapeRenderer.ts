import { Graphics } from 'pixi.js';
import type { ShapeNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { fillToColor } from '../fillToColor';

function draw(obj: Graphics, node: ShapeNode): void {
  const { width, height } = node.size;
  obj.clear();

  switch (node.shape) {
    case 'rect':
      if (node.cornerRadius) obj.roundRect(0, 0, width, height, node.cornerRadius);
      else obj.rect(0, 0, width, height);
      break;
    case 'ellipse':
      obj.ellipse(width / 2, height / 2, width / 2, height / 2);
      break;
    case 'polygon':
      obj.poly(node.points ?? [0, 0, width, 0, width / 2, height], true);
      break;
    case 'star':
      obj.star(width / 2, height / 2, 5, Math.min(width, height) / 2);
      break;
    case 'line':
      obj.moveTo(0, 0).lineTo(width, height);
      break;
    case 'path':
      // ponytail: arbitrary SVG path data isn't parsed in Phase 1 (no
      // toolbar action produces one yet); render the bbox as a stand-in.
      obj.rect(0, 0, width, height);
      break;
  }

  if (node.shape === 'line') {
    obj.stroke({ width: node.stroke?.width ?? 1, color: fillToColor(node.stroke?.fill ?? node.fill) });
  } else {
    obj.fill(fillToColor(node.fill));
    if (node.stroke) obj.stroke({ width: node.stroke.width, color: fillToColor(node.stroke.fill) });
  }
}

export const shapeRenderer = {
  create(node: ShapeNode): Graphics {
    const obj = new Graphics();
    this.update(obj, node);
    return obj;
  },
  update(obj: Graphics, node: ShapeNode): void {
    draw(obj, node);
    applyTransform(obj, node);
  },
};
