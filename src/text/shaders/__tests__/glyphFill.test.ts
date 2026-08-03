// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildGlyphFillShader } from '../glyphFill';

describe('buildGlyphFillShader', () => {
  it('sets fillType 0 for solid fills', () => {
    const shader = buildGlyphFillShader({ type: 'solid', color: '#ff0000' });
    expect(shader.resources.glyphFillUniforms.uniforms.uFillType).toBe(0);
  });

  it('sets fillType 1 and stop data for linear-gradient fills', () => {
    const shader = buildGlyphFillShader({
      type: 'linear-gradient',
      angle: Math.PI / 2,
      stops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#ffffff' }],
    });
    expect(shader.resources.glyphFillUniforms.uniforms.uFillType).toBe(1);
    expect(shader.resources.glyphFillUniforms.uniforms.uStopCount).toBe(2);
  });

  it('caps stop count at MAX_GRADIENT_STOPS for an over-long stop list', () => {
    const stops = Array.from({ length: 12 }, (_, i) => ({ offset: i / 11, color: '#000000' }));
    const shader = buildGlyphFillShader({ type: 'radial-gradient', stops });
    expect(shader.resources.glyphFillUniforms.uniforms.uStopCount).toBe(8);
  });
});
