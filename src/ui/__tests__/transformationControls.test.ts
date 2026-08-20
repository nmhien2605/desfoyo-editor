import { describe, expect, it } from 'vitest';
import type { Warp, WarpPath } from '../../schema';
import {
  ENABLED_WARP_TYPES,
  resetWarp,
  setWarpCurveHeight,
  setWarpType,
  toggleCircleDirectionInverted,
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
      directionInverted: false,
    });
  });

  it('doi kieu thi xoa paths cu vi path cua kieu khac khong dung nua', () => {
    expect(setWarpType(edited, 'arch').paths).toBeUndefined();
  });

  it('giu nguyen curveHeight khi doi kieu', () => {
    expect(setWarpType(edited, 'arch').curveHeight).toBe(0.5);
  });

  it('doi sang custom cung xoa paths cu — Custom LUON bat dau flat, khong ke thua hinh dang truoc do', () => {
    expect(setWarpType(edited, 'custom').paths).toBeUndefined();
    expect(setWarpType(edited, 'custom').type).toBe('custom');
  });
});

describe('ENABLED_WARP_TYPES', () => {
  it('custom da duoc bat', () => {
    expect(ENABLED_WARP_TYPES).toContain('custom');
  });

  it('distort van khoa (chua cai dat)', () => {
    expect(ENABLED_WARP_TYPES).not.toContain('distort');
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
    expect(resetWarp(edited)).toEqual({
      type: 'wave',
      curveHeight: DEFAULT_WARP_CURVE_HEIGHT,
      directionInverted: false,
    });
  });
});

describe('toggleCircleDirectionInverted', () => {
  it('dao dung, giu nguyen circle/curveHeight', () => {
    const withCircle: Warp = {
      type: 'circle',
      curveHeight: 0.5,
      circle: { centerX: 0.5, centerY: 0.5, radius: 0.3 },
      directionInverted: false,
    };
    const toggled = toggleCircleDirectionInverted(withCircle);
    expect(toggled.directionInverted).toBe(true);
    expect(toggled.circle).toEqual(withCircle.circle);
    expect(toggled.curveHeight).toBe(0.5);
  });

  it('dao 2 lan tra ve false', () => {
    const once = toggleCircleDirectionInverted(undefined);
    expect(once.directionInverted).toBe(true);
    const twice = toggleCircleDirectionInverted(once);
    expect(twice.directionInverted).toBe(false);
  });
});
