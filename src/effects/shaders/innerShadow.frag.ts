// GLSL fragment source for a single-pass approximate inner shadow: darkens
// a shape's interior wherever an offset+blurred sample of its own alpha
// falls off the shape (i.e. near the inside of an edge). The blur is a
// fixed 5-tap cross sample scaled by uBlur, not a real (multi-pass, much
// more expensive) Gaussian like pixi-filters' DropShadowFilter uses
// internally for its outer shadow — see buildFilters.ts's 'inner-shadow'
// case for how the uniforms are populated from the Effect schema.
// ponytail: fixed 5-tap cross blur, not a proper Gaussian — upgrade to a
// real multi-pass blur filter if visual quality falls short at large uBlur.
export const innerShadowFrag = `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float uAlpha;
uniform vec3 uColor;
uniform vec2 uOffset;
uniform float uBlur;

void main(void) {
  vec4 base = texture(uTexture, vTextureCoord);
  vec2 texel = uInputSize.zw;
  vec2 shadowUv = vTextureCoord - uOffset * texel;

  float shadowAlpha = texture(uTexture, shadowUv).a;
  shadowAlpha += texture(uTexture, shadowUv + vec2(uBlur, 0.0) * texel).a;
  shadowAlpha += texture(uTexture, shadowUv - vec2(uBlur, 0.0) * texel).a;
  shadowAlpha += texture(uTexture, shadowUv + vec2(0.0, uBlur) * texel).a;
  shadowAlpha += texture(uTexture, shadowUv - vec2(0.0, uBlur) * texel).a;
  shadowAlpha /= 5.0;

  float inner = base.a * (1.0 - shadowAlpha) * uAlpha;
  finalColor = vec4(mix(base.rgb, uColor, inner), base.a);
}
`;
