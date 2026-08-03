import { BlurFilter, Color, Filter, GlProgram, defaultFilterVert } from 'pixi.js';
import { BevelFilter, DropShadowFilter, GlowFilter, OutlineFilter } from 'pixi-filters';
import type { Effect, Node } from '../schema';
import { innerShadowFrag } from './shaders/innerShadow.frag';
import { lineShadowFrag } from './shaders/lineShadow.frag';
import { customShaders } from './shaders/customShaders';

// Phase 1 wired up only 'shadow'. Phase 3 Pass A adds glow/outline/blur
// (direct 1:1 matches with existing pixi-filters/pixi.js filters) and
// extrude3d (approximated with BevelFilter — a 2D bevel, not true mesh
// extrusion; real extrude needs geometry work, deferred to a later pass).
// Phase 3 Pass D adds 'inner-shadow' (a hand-written GLSL filter — no
// pixi-filters class does this) and 'custom' (picks a named shader from
// customShaders.ts's registry; not arbitrary user-authored GLSL).
// Slice 2 adds 'block-shadow' and '3d-shadow' (both reuse DropShadowFilter —
// no new shader) and a `basis` scaling parameter so shadow-family effects
// stay proportional on text nodes.

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

const SHADOW_3D_STEPS = 6;

// Darkens a color toward black by `amount` (0..1) — used by the '3d-shadow'
// case to progressively shade each chained layer, giving a receding-depth
// look. Exported for its own focused unit test (no Pixi renderer needed).
export function darkenColor(color: string, amount: number): string {
  const [r, g, b] = new Color(color).toArray();
  return new Color([r * (1 - amount), g * (1 - amount), b * (1 - amount)]).toHex();
}

// basis: text nodes scale the 4 shadow-family effects (shadow/block-shadow/
// line-shadow/3d-shadow) by font size, so the same stored Effect looks
// proportional at any text size — see docs/superpowers/specs/2026-08-03-text-effects-design.md
// "Auto-scale with text size". basis is always 1 for non-text nodes (or
// when no node is passed at all), so shape rendering is byte-for-byte
// unchanged from before this parameter existed.
export function buildFilters(effects: Effect[] | undefined, node?: Node): Filter[] {
  if (!effects) return [];
  const basis = node?.type === 'text' ? node.font.size : 1;

  const filters: Filter[] = [];
  for (const effect of effects) {
    switch (effect.type) {
      case 'shadow':
        filters.push(
          new DropShadowFilter({
            color: effect.color,
            blur: effect.blur * basis,
            offset: { x: effect.offset[0] * basis, y: effect.offset[1] * basis },
            alpha: effect.alpha,
          }),
        );
        break;
      case 'block-shadow':
        filters.push(
          new DropShadowFilter({
            color: effect.color,
            blur: 0,
            offset: { x: effect.offset[0] * basis, y: effect.offset[1] * basis },
            alpha: effect.alpha,
          }),
        );
        break;
      case '3d-shadow': {
        const depth = effect.depth * basis;
        for (let i = 1; i <= SHADOW_3D_STEPS; i++) {
          const t = i / SHADOW_3D_STEPS;
          filters.push(
            new DropShadowFilter({
              color: darkenColor(effect.color, t * 0.6),
              blur: 0,
              offset: { x: Math.cos(effect.angle) * depth * t, y: Math.sin(effect.angle) * depth * t },
              alpha: effect.alpha,
            }),
          );
        }
        break;
      }
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
      case 'line-shadow': {
        const [r, g, b] = new Color(effect.color).toArray();
        filters.push(
          new Filter({
            glProgram: new GlProgram({ vertex: defaultFilterVert, fragment: lineShadowFrag, name: 'line-shadow-filter' }),
            resources: {
              lineShadowUniforms: {
                uColor: { value: new Float32Array([r, g, b]), type: 'vec3<f32>' },
                uAlpha: { value: effect.alpha, type: 'f32' },
                uOffset: { value: [effect.offset[0] * basis, effect.offset[1] * basis], type: 'vec2<f32>' },
                uThickness: { value: effect.thickness * basis, type: 'f32' },
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
