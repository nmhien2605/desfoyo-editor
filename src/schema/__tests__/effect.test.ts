import { describe, expect, it } from 'vitest';
import { EffectSchema } from '../effect';

describe('EffectSchema — text-shadow', () => {
  it('chap nhan ca 4 kieu kittl', () => {
    for (const style of ['drop', 'line', 'block', '3d'] as const) {
      const result = EffectSchema.safeParse({
        type: 'text-shadow',
        style,
        color: '#000000',
        angle: Math.PI / 4,
        distance: 0.06,
      });
      expect(result.success).toBe(true);
    }
  });

  it('tu choi style ngoai 4 kieu kittl', () => {
    const result = EffectSchema.safeParse({
      type: 'text-shadow',
      style: 'wrong',
      color: '#000000',
      angle: 0,
      distance: 0.06,
    });
    expect(result.success).toBe(false);
  });

  it('inner-shadow da bi xoa khoi union', () => {
    const result = EffectSchema.safeParse({
      type: 'inner-shadow',
      color: '#000000',
      blur: 4,
      offset: [2, 2],
      alpha: 0.5,
    });
    expect(result.success).toBe(false);
  });

  it('shadow (generic, non-text) van con nguyen — khong dung toi', () => {
    const result = EffectSchema.safeParse({
      type: 'shadow',
      color: '#000000',
      blur: 4,
      offset: [2, 2],
      alpha: 0.5,
    });
    expect(result.success).toBe(true);
  });
});
