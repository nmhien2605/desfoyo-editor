import { BlurFilter, type Filter } from 'pixi.js';
import { BevelFilter, DropShadowFilter, GlowFilter, OutlineFilter } from 'pixi-filters';
import type { Effect } from '../schema';

// Phase 1 wired up only 'shadow'. Phase 3 Pass A adds glow/outline/blur
// (direct 1:1 matches with existing pixi-filters/pixi.js filters) and
// extrude3d (approximated with BevelFilter — a 2D bevel, not true mesh
// extrusion; real extrude needs geometry work, deferred to a later pass).
// 'inner-shadow' and 'custom' stay inert — no existing filter maps to
// inner-shadow, and 'custom' is arbitrary GLSL, exactly the shader R&D this
// pass intentionally defers.
export function buildFilters(effects: Effect[] | undefined): Filter[] {
  if (!effects) return [];

  const filters: Filter[] = [];
  for (const effect of effects) {
    switch (effect.type) {
      case 'shadow':
        filters.push(
          new DropShadowFilter({
            color: effect.color,
            blur: effect.blur,
            offset: { x: effect.offset[0], y: effect.offset[1] },
            alpha: effect.alpha,
          }),
        );
        break;
      case 'glow':
        filters.push(
          new GlowFilter({
            color: effect.color,
            outerStrength: effect.strength,
            innerStrength: effect.outer ? 0 : effect.strength,
          }),
        );
        break;
      case 'outline':
        filters.push(new OutlineFilter({ thickness: effect.thickness, color: effect.color }));
        break;
      case 'blur':
        filters.push(new BlurFilter({ strength: effect.amount }));
        break;
      case 'extrude3d':
        // Text nodes bypass this — applyTransform.ts strips extrude3d
        // before calling here and textRenderer.ts renders it as real
        // stacked-clone geometry instead. Shapes (and any other node type)
        // still get this 2D bevel approximation.
        filters.push(
          new BevelFilter({
            thickness: effect.depth,
            rotation: (effect.angle * 180) / Math.PI,
            lightColor: effect.color,
            shadowColor: effect.color,
          }),
        );
        break;
    }
  }
  return filters;
}
