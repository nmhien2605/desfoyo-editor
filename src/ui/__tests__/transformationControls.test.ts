import { describe, expect, it } from 'vitest';
import type { Warp, WarpPath } from '../../schema';
import {
  resetWarp,
  setWarpIntensity,
  setWarpType,
  DEFAULT_WARP_INTENSITY,
} from '../TransformationControls';

const storedPath: WarpPath = {
  role: 'baseline',
  closed: false,
  anchors: [
    { x: 0, y: 0.9 },
    { x: 1, y: 0.5 },
  ],
};

const edited: Warp = { type: 'wave', intensity: 0.5, paths: [storedPath] };

describe('setWarpType', () => {
  it('tao warp moi voi intensity mac dinh khi chua co', () => {
    expect(setWarpType(undefined, 'wave')).toEqual({
      type: 'wave',
      intensity: DEFAULT_WARP_INTENSITY,
    });
  });

  it('doi kieu thi xoa paths cu vi path cua kieu khac khong dung nua', () => {
    expect(setWarpType(edited, 'arch').paths).toBeUndefined();
  });

  it('giu nguyen intensity khi doi kieu', () => {
    expect(setWarpType(edited, 'arch').intensity).toBe(0.5);
  });
});

describe('setWarpIntensity', () => {
  it('xoa paths de quay ve che do preset', () => {
    const next = setWarpIntensity(edited, 0.8);
    expect(next.intensity).toBe(0.8);
    expect(next.paths).toBeUndefined();
  });

  it('kep gia tri vao khoang 0..1', () => {
    expect(setWarpIntensity(edited, 5).intensity).toBe(1);
    expect(setWarpIntensity(edited, -2).intensity).toBe(0);
  });
});

describe('resetWarp', () => {
  it('xoa paths va tra intensity ve mac dinh, giu nguyen kieu', () => {
    expect(resetWarp(edited)).toEqual({ type: 'wave', intensity: DEFAULT_WARP_INTENSITY });
  });
});
