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

  it('shapePivotX cung do dai va thu tu voi shapes', () => {
    const result = layout('ij');
    expect(result.shapePivotX).toHaveLength(result.shapes.length);
    expect(result.shapePivotX.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('nhieu shape cua cung mot glyph (vd cham + than chu i) dung chung mot pivotX', () => {
    // 'i' trong Poppins co the tach cham/than thanh 2 outer rieng (khong long
    // nhau) — chi test duoc neu font that su co glyph nhu vay, tranh gia dinh
    // chua kiem chung; bo qua neu khong tim thay (CI khac font se skip êm).
    const glyphs = getGlyphOutlines('i', poppins, 100);
    const multiShapeGlyphIndex = glyphs.findIndex((g) => g.shapes.length > 1);
    if (multiShapeGlyphIndex === -1) return;
    const result = layout('i');
    // Tim tat ca shapePivotX ung voi cac shape cua glyph 'i' (chi co 1 glyph
    // trong text nay) — tat ca phai bang nhau.
    const uniquePivots = new Set(result.shapePivotX.map((v) => v.toFixed(6)));
    expect(uniquePivots.size).toBe(1);
  });

  it('advanceWidth khong gom letterSpacing, width co gom (fix path/circle bi keo gian theo letterSpacing)', () => {
    const plain = layout('abc');
    const spaced = layout('abc', { letterSpacing: 10 });
    expect(spaced.advanceWidth).toBeCloseTo(plain.advanceWidth, 5);
    expect(plain.advanceWidth).toBeCloseTo(plain.width, 5); // letterSpacing=0: width == advanceWidth
    expect(spaced.width).toBeCloseTo(plain.advanceWidth + 20, 5); // 2 khoang * 10
  });

  it('advanceWidth lay max qua nhieu dong, giong cach tinh width', () => {
    const result = layout('a\nabc');
    const shortAdv = getGlyphOutlines('a', poppins, 100)[0].advance;
    const longAdv = getGlyphOutlines('abc', poppins, 100).reduce((s, g) => s + g.advance, 0);
    expect(result.advanceWidth).toBeCloseTo(Math.max(shortAdv, longAdv), 5);
  });
});
