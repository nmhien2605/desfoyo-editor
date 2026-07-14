import type { Filter } from 'pixi.js';
import { DropShadowFilter } from 'pixi-filters';
import type { Effect } from '../schema';

// Phase 1 wires up only the 'shadow' variant of the Effect union. The other
// 6 variants are valid schema data (so documents authored later don't need
// a migration) but are inert here — a node carrying one just renders
// without that effect until its renderer lands in a later phase.
export function buildFilters(effects: Effect[] | undefined): Filter[] {
  if (!effects) return [];

  const filters: Filter[] = [];
  for (const effect of effects) {
    if (effect.type === 'shadow') {
      filters.push(
        new DropShadowFilter({
          color: effect.color,
          blur: effect.blur,
          offset: { x: effect.offset[0], y: effect.offset[1] },
          alpha: effect.alpha,
        }),
      );
    }
  }
  return filters;
}
