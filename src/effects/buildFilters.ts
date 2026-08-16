import { BlurFilter, Color, Filter, GlProgram, defaultFilterVert } from 'pixi.js';
import { BevelFilter, DropShadowFilter, GlowFilter, OutlineFilter } from 'pixi-filters';
import type { Effect } from '../schema';
import { innerShadowFrag } from './shaders/innerShadow.frag';
import { customShaders } from './shaders/customShaders';

// Phase 1 wired up only 'shadow'. Phase 3 Pass A adds glow/outline/blur
// (direct 1:1 matches with existing pixi-filters/pixi.js filters) and
// extrude3d (approximated with BevelFilter — a 2D bevel, not true mesh
// extrusion; real extrude needs geometry work, deferred to a later pass).
// Phase 3 Pass D adds 'inner-shadow' (a hand-written GLSL filter — no
// pixi-filters class does this) and 'custom' (picks a named shader from
// customShaders.ts's registry; not arbitrary user-authored GLSL).

// Effect.uniforms values map onto GLSL uniforms as `u_<key>`, inferring the
// resource type tag from the JS value shape — a number is 'f32', an array
// of length N is 'vecN<f32>'. No per-shader uniform-type table needed since
// every built-in shader in customShaders.ts is written to match this
// convention.
function customUniforms(uniforms: Record<string, number | number[]>): Record<string, { value: number | Float32Array; type: string }> {
  const resources: Record<string, { value: number | Float32Array; type: string }> = {};
  for (const [key, value] of Object.entries(uniforms)) {
    resources[`u_${key}`] = Array.isArray(value)
      ? { value: new Float32Array(value), type: `vec${value.length}<f32>` }
      : { value, type: 'f32' };
  }
  return resources;
}

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
        filters.push(
          new BevelFilter({
            thickness: effect.depth,
            rotation: (effect.angle * 180) / Math.PI,
            lightColor: effect.color,
            shadowColor: effect.color,
          }),
        );
        break;
      case 'inner-shadow': {
        const [r, g, b] = new Color(effect.color).toArray();
        filters.push(
          new Filter({
            glProgram: new GlProgram({ vertex: defaultFilterVert, fragment: innerShadowFrag, name: 'inner-shadow-filter' }),
            resources: {
              innerShadowUniforms: {
                uAlpha: { value: effect.alpha, type: 'f32' },
                uColor: { value: new Float32Array([r, g, b]), type: 'vec3<f32>' },
                uOffset: { value: effect.offset, type: 'vec2<f32>' },
                uBlur: { value: effect.blur, type: 'f32' },
              },
            },
          }),
        );
        break;
      }
      case 'custom': {
        const fragment = customShaders[effect.shaderId];
        // Unknown shaderId stays inert rather than throwing — same
        // silently-inert convention this file already used for
        // 'inner-shadow'/'custom' before either had a real implementation.
        if (!fragment) break;
        filters.push(
          new Filter({
            glProgram: new GlProgram({ vertex: defaultFilterVert, fragment, name: `custom-${effect.shaderId}-filter` }),
            resources: { customUniforms: customUniforms(effect.uniforms) },
          }),
        );
        break;
      }
    }
  }
  return filters;
}
