import { describe, expect, it } from 'vitest';
import type { Warp, WarpPath } from '../../schema';
import {
  resetWarp,
  setWarpCurveHeight,
  setWarpType,
  DEFAULT_WARP_CURVE_HEIGHT,
} from '../TransformationControls';

const storedPath: WarpPath = {
  role: 'baseline',
  closed: false,
  anchors: [
    { x: 0, y: 0.9 },
    { x: 1, y: 0.5 },
  ],
};

const edited: Warp = { type: 'wave', curveHeight: 0.5, paths: [storedPath] };

describe('setWarpType', () => {
  it('tao warp moi voi curveHeight mac dinh khi chua co', () => {
    expect(setWarpType(undefined, 'wave')).toEqual({
      type: 'wave',
      curveHeight: DEFAULT_WARP_CURVE_HEIGHT,
    });
  });

  it('doi kieu thi xoa paths cu vi path cua kieu khac khong dung nua', () => {
    expect(setWarpType(edited, 'arch').paths).toBeUndefined();
  });

  it('giu nguyen curveHeight khi doi kieu', () => {
    expect(setWarpType(edited, 'arch').curveHeight).toBe(0.5);
  });
});

describe('setWarpCurveHeight', () => {
  it('xoa paths de quay ve che do preset', () => {
    const next = setWarpCurveHeight(edited, 0.8);
    expect(next.curveHeight).toBe(0.8);
    expect(next.paths).toBeUndefined();
  });

  it('kep gia tri vao khoang -1..4', () => {
    expect(setWarpCurveHeight(edited, 5).curveHeight).toBe(4);
    expect(setWarpCurveHeight(edited, -2).curveHeight).toBe(-1);
  });
});

describe('resetWarp', () => {
  it('xoa paths va tra curveHeight ve mac dinh, giu nguyen kieu', () => {
    expect(resetWarp(edited)).toEqual({ type: 'wave', curveHeight: DEFAULT_WARP_CURVE_HEIGHT });
  });
});
