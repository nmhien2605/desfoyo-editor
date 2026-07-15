// shaderId -> GLSL fragment source registry for the 'custom' effect type
// (Effect.uniforms keys map onto uniforms here as `u_<key>`, see
// buildFilters.ts's 'custom' case). 'custom' means "pick a built-in named
// shader", not arbitrary user-authored GLSL — that's a much bigger surface
// (compile-error UX, sandboxing untrusted shader code) this pass doesn't
// take on.
// ponytail: one built-in to start; add more entries here as design time
// allows — buildFilters.ts's lookup doesn't need to change.
export const customShaders: Record<string, string> = {
  'chromatic-aberration': `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float u_strength;

void main(void) {
  vec2 texel = uInputSize.zw;
  vec2 offset = vec2(u_strength, 0.0) * texel;
  float r = texture(uTexture, vTextureCoord - offset).r;
  float g = texture(uTexture, vTextureCoord).g;
  float b = texture(uTexture, vTextureCoord + offset).b;
  float a = texture(uTexture, vTextureCoord).a;
  finalColor = vec4(r, g, b, a);
}
`,
};
