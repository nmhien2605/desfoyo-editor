import { describe, expect, it } from 'vitest';
import { buildShadowLayers } from '../textShadow';
import type { GlyphShape } from '../glyphOutlines';
import type { Effect } from '../../schema';

// Hinh chu nhat don gian: 1 outer, khong hole, 4 diem on-curve (8 so).
const square: GlyphShape = {
  outer: [0, 0, 3, 0, 6, 0, 10, 0, 10, 10, 6, 10, 3, 10, 0, 10],
  holes: [],
};

const base: Extract<Effect, { type: 'text-shadow' }> = {
  type: 'text-shadow',
  style: 'block',
  color: '#000000',
  angle: 0, // +x
  distance: 0.1,
};
const fontSize = 100; // => distance*fontSize = 10px

describe('buildShadowLayers', () => {
  it('drop khong sinh lop hinh hoc nao — do la filter, khong phai geometry', () => {
    expect(buildShadowLayers([square], { ...base, style: 'drop' }, fontSize)).toEqual([]);
  });

  it('block: dung 1 lop, fill, dich dung (dx,dy) theo angle*distance*fontSize', () => {
    const layers = buildShadowLayers([square], { ...base, style: 'block' }, fontSize);
    expect(layers).toHaveLength(1);
    expect(layers[0].mode).toBe('fill');
    const outer = layers[0].shapes[0].outer;
    for (let i = 0; i < outer.length; i += 2) {
      expect(outer[i]).toBeCloseTo(square.outer[i] + 10, 6); // angle=0 => dx=10, dy=0
      expect(outer[i + 1]).toBeCloseTo(square.outer[i + 1], 6);
    }
  });

  it('line: dung 1 lop, stroke, cung cong thuc dich chuyen nhu block', () => {
    const layers = buildShadowLayers([square], { ...base, style: 'line' }, fontSize);
    expect(layers).toHaveLength(1);
    expect(layers[0].mode).toBe('stroke');
  });

  it('block/line giu nguyen holes (dich chuyen ca hole)', () => {
    const withHole: GlyphShape = { outer: square.outer, holes: [square.outer] };
    const layers = buildShadowLayers([withHole], { ...base, style: 'block' }, fontSize);
    expect(layers[0].shapes[0].holes).toHaveLength(1);
    expect(layers[0].shapes[0].holes[0][0]).toBeCloseTo(10, 6);
  });

  it('3d: dung dung "steps" lop, xep xa truoc gan sau (lop dau tien la offset LON nhat)', () => {
    const layers = buildShadowLayers([square], { ...base, style: '3d', steps: 4 }, fontSize);
    expect(layers).toHaveLength(4);
    expect(layers.every((l) => l.mode === 'fill')).toBe(true);
    // Lop 0 la offset lon nhat (4/4 * 10 = 10px), lop cuoi nho nhat (1/4 * 10 = 2.5px)
    expect(layers[0].shapes[0].outer[0]).toBeCloseTo(10, 6);
    expect(layers[3].shapes[0].outer[0]).toBeCloseTo(2.5, 6);
  });

  it('3d: steps mac dinh la 6 khi khong truyen', () => {
    const layers = buildShadowLayers([square], { ...base, style: '3d' }, fontSize);
    expect(layers).toHaveLength(6);
  });

  it('angle = PI/2 (huong xuong): dy duong, dx ~0', () => {
    const layers = buildShadowLayers([square], { ...base, style: 'block', angle: Math.PI / 2 }, fontSize);
    expect(layers[0].shapes[0].outer[0]).toBeCloseTo(0, 6);
    expect(layers[0].shapes[0].outer[1]).toBeCloseTo(10, 6);
  });
});
