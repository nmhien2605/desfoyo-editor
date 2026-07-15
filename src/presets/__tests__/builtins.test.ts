import { describe, expect, it } from 'vitest';
import { builtinPresets } from '../builtins';
import { EffectSchema, FillSchema } from '../../schema';

describe('builtinPresets', () => {
  it('is non-empty', () => {
    expect(builtinPresets.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = builtinPresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(builtinPresets)('$id: apply.fill and apply.effects validate against the schema', (preset) => {
    if (preset.apply.fill) expect(() => FillSchema.parse(preset.apply.fill)).not.toThrow();
    for (const effect of preset.apply.effects ?? []) expect(() => EffectSchema.parse(effect)).not.toThrow();
  });
});
