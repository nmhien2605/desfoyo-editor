import { FillGradient, type ColorSource } from 'pixi.js';
import type { Fill } from '../schema';

// Approximate-solid-color version, kept for call sites that need a plain
// ColorSource (e.g. Application background, which isn't a Graphics fill and
// can't take a gradient).
export function fillToColor(fill: Fill): ColorSource {
  switch (fill.type) {
    case 'solid':
      return fill.color;
    case 'linear-gradient':
    case 'radial-gradient':
      return fill.stops[0]?.color ?? '#000000';
    case 'texture':
      return '#808080';
  }
}

// Resolves a schema Fill to a real Pixi FillInput for Graphics.fill()/
// .stroke() and Text `fill`/`stroke` style — uses Pixi v8's native
// FillGradient for linear/radial gradients instead of a custom shader.
// `texture` still falls back to an approximate solid color: real asset
// rendering needs the asset pipeline, which is Phase 4 scope.
export function resolveFill(fill: Fill): ColorSource | FillGradient {
  switch (fill.type) {
    case 'solid':
      // ponytail: per-fill alpha isn't composited here (only node-level
      // opacity is, in applyTransform.ts) — same scope cut the prior
      // solid-only fillToColor already had.
      return fill.color;
    case 'linear-gradient': {
      const dx = Math.cos(fill.angle) * 0.5;
      const dy = Math.sin(fill.angle) * 0.5;
      const gradient = new FillGradient({
        type: 'linear',
        start: { x: 0.5 - dx, y: 0.5 - dy },
        end: { x: 0.5 + dx, y: 0.5 + dy },
        textureSpace: 'local',
      });
      for (const stop of fill.stops) gradient.addColorStop(stop.offset, stop.color);
      return gradient;
    }
    case 'radial-gradient': {
      const gradient = new FillGradient({
        type: 'radial',
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        textureSpace: 'local',
      });
      for (const stop of fill.stops) gradient.addColorStop(stop.offset, stop.color);
      return gradient;
    }
    case 'texture':
      return '#808080';
  }
}
