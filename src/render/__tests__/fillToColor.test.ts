import { describe, expect, it, vi } from 'vitest';
import { FillGradient, Graphics } from 'pixi.js';
import { GradientCache, gradientCacheFor, resolveFill } from '../fillToColor';
import type { Fill } from '../../schema';

const radial: Fill = {
  type: 'radial-gradient',
  stops: [
    { offset: 0, color: '#ff0000' },
    { offset: 1, color: '#0000ff' },
  ],
};
const box = { width: 100, height: 50 };

describe('GradientCache', () => {
  it('reuses the same gradient across redraws of an unchanged fill', () => {
    const cache = new GradientCache();
    const a = resolveFill(radial, box, cache);
    cache.commit();
    const b = resolveFill(radial, box, cache);
    cache.commit();
    expect(a).toBeInstanceOf(FillGradient);
    expect(b).toBe(a);
  });

  it('destroys a gradient only once a redraw stops using it', () => {
    const cache = new GradientCache();
    const old = resolveFill(radial, box, cache) as FillGradient;
    cache.commit();
    const destroy = vi.spyOn(old, 'destroy');
    const next = resolveFill(radial, { width: 200, height: 50 }, cache);
    expect(destroy).not.toHaveBeenCalled(); // still drawn until commit
    cache.commit();
    expect(next).not.toBe(old);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('the same fill used twice in one redraw is one gradient, kept', () => {
    const cache = new GradientCache();
    const a = resolveFill(radial, undefined, cache);
    const b = resolveFill(radial, undefined, cache);
    cache.commit();
    expect(b).toBe(a);
    const destroy = vi.spyOn(a as FillGradient, 'destroy');
    resolveFill(radial, undefined, cache);
    cache.commit();
    expect(destroy).not.toHaveBeenCalled();
  });

  it('solid fills bypass the cache', () => {
    expect(resolveFill({ type: 'solid', color: '#123456' }, box, new GradientCache())).toBe('#123456');
  });

  it('frees every gradient when its display object is destroyed', () => {
    const obj = new Graphics();
    const cache = gradientCacheFor(obj);
    expect(gradientCacheFor(obj)).toBe(cache);
    const g = resolveFill(radial, box, cache) as FillGradient;
    cache.commit();
    const destroy = vi.spyOn(g, 'destroy');
    obj.destroy();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
