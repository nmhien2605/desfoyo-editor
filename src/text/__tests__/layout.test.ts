import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getGlyphOutlines } from '../glyphOutlines';
import { layoutText } from '../layout';

let poppins: opentype.Font;
beforeAll(() => {
  const path = fileURLToPath(new URL('../fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  poppins = opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
});

const base = {
  font: () => poppins,
  fontSize: 100,
  letterSpacing: 0,
  lineHeight: 1.2,
  align: 'left' as const,
};

function layout(text: string, overrides: Partial<Parameters<typeof layoutText>[0]> = {}) {
  return layoutText({
    text,
    font: poppins,
    fontSize: base.fontSize,
    letterSpacing: base.letterSpacing,
    lineHeight: base.lineHeight,
    align: base.align,
    ...overrides,
  });
}

describe('layoutText', () => {
  it('width bang tong advance khi letterSpacing = 0', () => {
    const advances = getGlyphOutlines('ab', poppins, 100).reduce((sum, g) => sum + g.advance, 0);
    expect(layout('ab').width).toBeCloseTo(advances, 5);
  });

  it('letterSpacing cong vao giua cac glyph, khong cong sau glyph cuoi', () => {
    const plain = layout('abc').width;
    expect(layout('abc', { letterSpacing: 10 }).width).toBeCloseTo(plain + 20, 5);
  });

  it('align center va right dich dung luong', () => {
    const left = layout('a\nabc');
    const center = layout('a\nabc', { align: 'center' });
    const right = layout('a\nabc', { align: 'right' });
    const firstX = (l: ReturnType<typeof layout>) =>
      Math.min(...l.shapes[0].outer.filter((_, i) => i % 2 === 0));
    const shortLineWidth = getGlyphOutlines('a', poppins, 100)[0].advance;
    const slack = left.width - shortLineWidth;
    expect(firstX(center) - firstX(left)).toBeCloseTo(slack / 2, 4);
    expect(firstX(right) - firstX(left)).toBeCloseTo(slack, 4);
  });

  it('them mot dong lam height tang dung mot lineStep', () => {
    const one = layout('a');
    const two = layout('a\nb');
    expect(two.height - one.height).toBeCloseTo(100 * 1.2, 5);
  });

  it('baselineY nam trong khoang 0..height', () => {
    const result = layout('Ag');
    expect(result.baselineY).toBeGreaterThan(0);
    expect(result.baselineY).toBeLessThan(result.height);
  });

  it('text rong khong lam vo layout', () => {
    const result = layout('');
    expect(result.shapes).toEqual([]);
    expect(result.width).toBe(0);
    expect(Number.isFinite(result.height)).toBe(true);
  });
});
