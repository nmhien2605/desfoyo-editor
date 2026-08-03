// GLSL fragment source for "line shadow" (FR-04's 4th shadow kind): a thin
// outline-only shadow tracing the boundary of an *offset* copy of the
// node's own alpha, rather than a filled silhouette (that's block-shadow)
// or a blurred one (that's shadow/drop-shadow). Same hand-written-filter
// approach this codebase already uses for inner-shadow (innerShadow.frag.ts)
// — a fixed cross-sample (here checking 4 neighbors at uThickness texels
// away from the offset position) rather than a real, more expensive
// multi-tap edge/Sobel filter.
// ponytail: 4-tap cross edge test, not a proper Sobel/gradient edge
// detector — upgrade if visual quality falls short at large uThickness.
export const lineShadowFrag = `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec3 uColor;
uniform float uAlpha;
uniform vec2 uOffset;
uniform float uThickness;

void main(void) {
  vec4 base = texture(uTexture, vTextureCoord);
  vec2 texel = uInputSize.zw;
  vec2 shadowUv = vTextureCoord - uOffset * texel;

  float here = texture(uTexture, shadowUv).a;
  float n = texture(uTexture, shadowUv + vec2(0.0, uThickness) * texel).a;
  float s = texture(uTexture, shadowUv - vec2(0.0, uThickness) * texel).a;
  float e = texture(uTexture, shadowUv + vec2(uThickness, 0.0) * texel).a;
  float w = texture(uTexture, shadowUv - vec2(uThickness, 0.0) * texel).a;
  float minNeighbor = min(min(n, s), min(e, w));

  // "here" is inside the offset silhouette but at least one neighbor
  // uThickness texels away falls outside it — a boundary ring around the
  // offset copy, not a filled shape.
  float edge = here * (1.0 - minNeighbor) * uAlpha;
  finalColor = vec4(mix(base.rgb, uColor, edge), max(base.a, edge));
}
`;
