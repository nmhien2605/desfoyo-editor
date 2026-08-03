import { Shader, Color } from 'pixi.js';
import type { Fill } from '../../schema';

export const MAX_GRADIENT_STOPS = 8;

// Uniform/attribute names below are not invented — they match exactly what
// Pixi's GlMeshAdaptor auto-binds via groups 100 (global) / 101 (local) to
// ANY shader assigned to Mesh.shader, verified directly against
// node_modules/pixi.js/lib/rendering/high-shader/defaultProgramTemplate.js
// and .../shader-bits/{globalUniformsBit,localUniformBit}.js. This mirrors
// the codebase's existing "hand-written raw GLSL" convention
// (inner-shadow.frag.ts / lineShadow.frag.ts) — those target Filters, this
// targets a Mesh, the first of its kind here, but the same "trust real
// engine source over guessed uniform names" discipline applies.
const vertex = /* glsl */ `
in vec2 aPosition;
in vec2 aUV;

out vec4 vColor;
out vec2 vGradientUv;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform vec4 uWorldColorAlpha;
uniform mat3 uTransformMatrix;
uniform vec4 uColor;
uniform float uRound;

void main(void) {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vColor = uColor * uWorldColorAlpha;
  vGradientUv = aUV;
}
`;

// fillType: 0 = solid (vColor alone, no gradient loop), 1 = linear, 2 = radial.
const fragment = /* glsl */ `
precision highp float;
in vec4 vColor;
in vec2 vGradientUv;
out vec4 finalColor;

uniform float uFillType;
uniform float uStopCount;
uniform float uStopOffsets[${MAX_GRADIENT_STOPS}];
uniform vec4 uStopColors[${MAX_GRADIENT_STOPS}];
uniform float uGradientAngle;

vec4 sampleGradient(float t) {
  t = clamp(t, 0.0, 1.0);
  // uStopColors[0] is a compile-time-constant index (legal in GLSL ES 1.00).
  // result starts here so the "count < 2" and "loop never matched" cases
  // (which the old code handled via uStopColors[int(uStopCount) - 1], a
  // runtime-indexed lookup outside any loop) fall out for free without ever
  // indexing the array by anything but a constant or the loop's own "i".
  vec4 result = uStopColors[0];
  if (uStopCount >= 1.5) {
    for (int i = 0; i < ${MAX_GRADIENT_STOPS} - 1; i++) {
      if (float(i) + 1.0 >= uStopCount) break;
      if (t <= uStopOffsets[i + 1] || float(i) + 2.0 >= uStopCount) {
        float span = max(uStopOffsets[i + 1] - uStopOffsets[i], 0.0001);
        float localT = clamp((t - uStopOffsets[i]) / span, 0.0, 1.0);
        result = mix(uStopColors[i], uStopColors[i + 1], localT);
        break;
      }
    }
  }
  return result;
}

void main(void) {
  if (uFillType < 0.5) {
    finalColor = vColor;
    return;
  }
  float t;
  if (uFillType < 1.5) {
    // linear: project vGradientUv (0..1 box space) onto the gradient axis
    vec2 dir = vec2(cos(uGradientAngle), sin(uGradientAngle));
    t = dot(vGradientUv - vec2(0.5), dir) + 0.5;
  } else {
    // radial: distance from box center, normalized so the box's inscribed
    // circle (radius 0.5) maps to t=1
    t = length(vGradientUv - vec2(0.5)) / 0.5;
  }
  finalColor = sampleGradient(t) * vColor.a;
}
`;

export function buildGlyphFillShader(fill: Fill): Shader {
  const stopOffsets = new Float32Array(MAX_GRADIENT_STOPS);
  const stopColors = new Float32Array(MAX_GRADIENT_STOPS * 4);
  let stopCount = 0;
  let fillType = 0;
  let angle = 0;

  if (fill.type === 'linear-gradient' || fill.type === 'radial-gradient') {
    fillType = fill.type === 'linear-gradient' ? 1 : 2;
    angle = fill.type === 'linear-gradient' ? fill.angle : 0;
    stopCount = Math.min(fill.stops.length, MAX_GRADIENT_STOPS);
    fill.stops.slice(0, MAX_GRADIENT_STOPS).forEach((stop, i) => {
      const c = new Color(stop.color);
      stopOffsets[i] = stop.offset;
      stopColors[i * 4] = c.red;
      stopColors[i * 4 + 1] = c.green;
      stopColors[i * 4 + 2] = c.blue;
      stopColors[i * 4 + 3] = stop.alpha ?? 1;
    });
  }

  return Shader.from({
    gl: { vertex, fragment, name: 'glyph-fill-shader' },
    resources: {
      glyphFillUniforms: {
        uFillType: { value: fillType, type: 'f32' },
        uStopCount: { value: stopCount, type: 'f32' },
        uStopOffsets: { value: stopOffsets, type: 'f32', size: MAX_GRADIENT_STOPS },
        uStopColors: { value: stopColors, type: 'vec4<f32>', size: MAX_GRADIENT_STOPS },
        uGradientAngle: { value: angle, type: 'f32' },
      },
    },
  });
}

// Exposes fillType===0's solid RGBA for callers that need to set it via
// uColor directly rather than the glyphFillUniforms group — Pixi's mesh
// pipeline drives `uColor` itself via the localUniformBit's uColor uniform,
// so textRenderer.ts sets mesh.tint/mesh.alpha for solids the ordinary Pixi
// way instead of duplicating that path here; this function exists only so
// callers have a single documented way to derive that tint/alpha pair from
// a Fill, even though the vertex shader's uColor is Pixi-driven, not this
// module's.
export function solidFillTintAlpha(fill: Fill): { tint: number; alpha: number } {
  if (fill.type !== 'solid') return { tint: 0xffffff, alpha: 1 };
  return { tint: new Color(fill.color).toNumber(), alpha: fill.alpha ?? 1 };
}
