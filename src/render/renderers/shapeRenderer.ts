import { Graphics } from 'pixi.js';
import type { ShapeNode, Stroke } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill, strokeColorFields } from '../fillToColor';

const STROKE_ALIGNMENT: Record<Stroke['align'], number> = { inside: 1, center: 0.5, outside: 0 };

// Draws the shape's outline path translated by [dx, dy] — factored out so
// each multi-layer stroke entry can redraw the same path at its own offset
// before stroking it, then the true (untranslated) path is drawn once more
// for the fill/base stroke. Exported so imageRenderer.ts can reuse the same
// silhouette for shape-type image masks (Phase 4 Pass B) without
// duplicating the per-shape-type geometry.
export function drawPath(obj: Graphics, node: ShapeNode, [dx, dy]: [number, number]): void {
  const { width, height } = node.size;
  switch (node.shape) {
    case 'rect':
      if (node.cornerRadius) obj.roundRect(dx, dy, width, height, node.cornerRadius);
      else obj.rect(dx, dy, width, height);
      break;
    case 'ellipse':
      obj.ellipse(dx + width / 2, dy + height / 2, width / 2, height / 2);
      break;
    case 'polygon':
      obj.poly((node.points ?? [0, 0, width, 0, width / 2, height]).map((v, i) => v + (i % 2 === 0 ? dx : dy)), true);
      break;
    case 'star':
      obj.star(dx + width / 2, dy + height / 2, 5, Math.min(width, height) / 2);
      break;
    case 'line':
      obj.moveTo(dx, dy).lineTo(dx + width, dy + height);
      break;
    case 'path':
      // ponytail: arbitrary SVG path data isn't parsed in Phase 1 (no
      // toolbar action produces one yet); render the bbox as a stand-in.
      obj.rect(dx, dy, width, height);
      break;
  }
}

function draw(obj: Graphics, node: ShapeNode): void {
  obj.clear();

  const layers = node.stroke?.layers ?? (node.stroke ? [{ width: node.stroke.width, fill: node.stroke.fill }] : []);
  for (const layer of layers) {
    drawPath(obj, node, layer.offset ?? [0, 0]);
    obj.stroke({
      width: layer.width,
      alignment: node.stroke ? STROKE_ALIGNMENT[node.stroke.align] : 0.5,
      ...strokeColorFields(layer.fill),
    });
  }

  drawPath(obj, node, [0, 0]);
  if (node.shape === 'line') {
    if (layers.length === 0) obj.stroke({ width: 1, ...strokeColorFields(node.fill) });
  } else {
    obj.fill(resolveFill(node.fill));
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
