import type { ColorSource } from 'pixi.js';
import type { Fill } from '../schema';

// Phase 1 only renders solid fills at full fidelity. Gradient/texture fills
// are valid schema data (so authoring them doesn't need a later migration)
// but resolve to an approximate solid color for now — full gradient/texture
// rendering isn't a Phase 1 deliverable.
// ponytail: solid-color fallback for gradient/texture, real rendering when Phase 3 effects work needs it.
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
