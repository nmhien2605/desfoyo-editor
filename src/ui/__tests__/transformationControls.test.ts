import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TextNode, Warp, WarpPath } from '../../schema';
import { measureText } from '../../text/textGeometry';
import {
  ENABLED_WARP_TYPES,
  resetWarp,
  setWarpCurveHeight,
  setWarpType,
  toggleCircleDirectionInverted,
  warpUpdatePatch,
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

  it('distort da duoc bat', () => {
    expect(ENABLED_WARP_TYPES).toContain('distort');
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

describe('warpUpdatePatch — fix bug node "nhay" vi tri khi chon lai sau khi doi warp type', () => {
  let poppins: opentype.Font;
  beforeAll(() => {
    const path = fileURLToPath(new URL('../../text/fonts/Poppins-Regular.ttf', import.meta.url));
    const buffer = readFileSync(path);
    poppins = opentype.parse(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    );
  });

  const baseNode: TextNode = {
    id: 'text-1',
    type: 'text',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
    size: { width: 0, height: 0 },
    opacity: 1,
    visible: true,
    locked: false,
    text: 'Hello',
    font: { family: 'Poppins', weight: 400, style: 'normal', size: 96 },
    align: 'left',
    letterSpacing: 30, // >0 — bug chi lo ra khi co letterSpacing (xem textGeometry.ts's pivotWidth)
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#000000' },
  };

  it('font chua nap: patch chi co warp, khong doan size', () => {
    const patch = warpUpdatePatch(baseNode, null, setWarpType(undefined, 'distort'));
    expect(patch).toEqual({ warp: setWarpType(undefined, 'distort') });
  });

  it('doi tu khong-warp (pivotWidth=width, tinh letterSpacing) sang co-warp (pivotWidth=advanceWidth): patch tra dung size moi, khong stale', () => {
    // node.size dang luu dung theo cong thuc KHONG warp (truoc khi doi type).
    const unwarpedNode = { ...baseNode, size: measureText(baseNode, poppins) };
    const nextWarp = setWarpType(undefined, 'distort');
    const patch = warpUpdatePatch(unwarpedNode, poppins, nextWarp);
    expect(patch.warp).toEqual(nextWarp);
    expect(patch.size).toBeDefined();
    // size moi phai KHAC size cu (do da doi warped: false -> true, cong thuc
    // pivotWidth doi tu width sang advanceWidth) — day chinh la gia tri ma
    // truoc day KHONG duoc ghi cung patch, gay stale size + node "nhay" khi
    // chon lai (PropertiesPanel.tsx's reconcileStaleSize tu sua sau do).
    expect(patch.size!.width).not.toBeCloseTo(unwarpedNode.size.width, 1);
    const warpedNode = { ...unwarpedNode, warp: nextWarp };
    expect(patch.size).toEqual(measureText(warpedNode, poppins));
  });
});
