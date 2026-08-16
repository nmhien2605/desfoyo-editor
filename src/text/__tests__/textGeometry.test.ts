import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TextNode } from '../../schema';
import {
  measureText,
  resolveWarpGeometry,
  resolveWarpPath,
  shapesBounds,
  textGeometry,
} from '../textGeometry';
import { bakeScale, buildWavePath, placeOnPath, solveHorizontalScale } from '../warp';

let poppins: opentype.Font;
beforeAll(() => {
  const path = fileURLToPath(new URL('../fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  poppins = opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
});

function textNode(overrides: Partial<TextNode> = {}): TextNode {
  return {
    id: 'text-1',
    type: 'text',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
    size: { width: 300, height: 120 },
    opacity: 1,
    visible: true,
    locked: false,
    text: 'Wave',
    font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#000000' },
    ...overrides,
  };
}

describe('resolveWarpPath', () => {
  it('tra null khi khong co warp hoac warp type none', () => {
    expect(resolveWarpPath(textNode(), 0.8)).toBeNull();
    expect(resolveWarpPath(textNode({ warp: { type: 'none', intensity: 0.5 } }), 0.8)).toBeNull();
  });

  it('sinh path preset cho wave khi chua co paths', () => {
    const path = resolveWarpPath(textNode({ warp: { type: 'wave', intensity: 0.5 } }), 0.8)?.path;
    expect(path?.anchors).toHaveLength(3);
  });

  it('uu tien paths da luu hon preset', () => {
    const stored = {
      role: 'baseline' as const,
      closed: false,
      anchors: [
        { x: 0, y: 0.1 },
        { x: 1, y: 0.9 },
      ],
    };
    const path = resolveWarpPath(
      textNode({ warp: { type: 'wave', intensity: 0.5, paths: [stored] } }),
      0.8,
    )?.path;
    expect(path).toEqual(stored);
  });

  it('bo qua paths co duoi 2 anchor', () => {
    const broken = { role: 'baseline' as const, closed: false, anchors: [{ x: 0, y: 0.5 }] };
    expect(
      resolveWarpPath(textNode({ warp: { type: 'wave', intensity: 0.5, paths: [broken] } }), 0.8),
    ).toBeNull();
  });

  it('tra null cho transformation chua co preset', () => {
    expect(resolveWarpPath(textNode({ warp: { type: 'arch', intensity: 0.5 } }), 0.8)).toBeNull();
  });
});

describe('textGeometry', () => {
  it('khong warp thi giong het layout thuan', () => {
    const plain = textGeometry(textNode(), poppins);
    const noneWarp = textGeometry(textNode({ warp: { type: 'none', intensity: 0.5 } }), poppins);
    expect(noneWarp.shapes[0].outer).toEqual(plain.shapes[0].outer);
  });

  it('wave voi intensity = 0 la phep dong nhat', () => {
    const plain = textGeometry(textNode(), poppins);
    const flat = textGeometry(textNode({ warp: { type: 'wave', intensity: 0 } }), poppins);
    plain.shapes[0].outer.forEach((value, i) =>
      expect(flat.shapes[0].outer[i]).toBeCloseTo(value, 4),
    );
  });

  it('wave voi intensity > 0 lam doi hinh hoc', () => {
    const plain = textGeometry(textNode(), poppins);
    const waved = textGeometry(textNode({ warp: { type: 'wave', intensity: 0.8 } }), poppins);
    expect(waved.shapes[0].outer).not.toEqual(plain.shapes[0].outer);
    expect(waved.shapes[0].outer.every(Number.isFinite)).toBe(true);
  });

  it('width/height khong doi khi warp — do la kich thuoc chua warp', () => {
    const plain = textGeometry(textNode(), poppins);
    const waved = textGeometry(textNode({ warp: { type: 'wave', intensity: 0.8 } }), poppins);
    expect(waved.width).toBeCloseTo(plain.width, 6);
    expect(waved.height).toBeCloseTo(plain.height, 6);
  });

  it('measureText khop voi textGeometry', () => {
    const node = textNode();
    const geometry = textGeometry(node, poppins);
    expect(measureText(node, poppins)).toEqual({ width: geometry.width, height: geometry.height });
  });

  it('text rong khong throw', () => {
    const geometry = textGeometry(
      textNode({ text: '', warp: { type: 'wave', intensity: 0.8 } }),
      poppins,
    );
    expect(geometry.shapes).toEqual([]);
  });

  it('measureText co chieu rong toi thieu de node rong van chon duoc', () => {
    const empty = textNode({ text: '' });
    expect(textGeometry(empty, poppins).width).toBe(0);
    expect(measureText(empty, poppins).width).toBeGreaterThan(0);
  });
});

describe('text-on-path', () => {
  it('intensity = 0 cho hinh hoc trung khit layout, moi dong', () => {
    const node = textNode({ text: 'Hi\nHi', warp: { type: 'wave', intensity: 0 } });
    const geometry = textGeometry(node, poppins);
    const plain = textGeometry({ ...node, warp: undefined }, poppins);
    geometry.shapes.forEach((shape, i) => {
      shape.outer.forEach((value, j) => {
        expect(value).toBeCloseTo(plain.shapes[i].outer[j], 6);
      });
    });
  });

  it('wave bao toan hinh hoc tung glyph', () => {
    const node = textNode({ text: 'Headline', warp: { type: 'wave', intensity: 1 } });
    const warped = textGeometry(node, poppins);
    const plain = textGeometry({ ...node, warp: undefined }, poppins);
    expect(warped.shapes).toHaveLength(plain.shapes.length);
    warped.shapes.forEach((shape, i) => {
      const a = plain.shapes[i].outer;
      const b = shape.outer;
      for (let k = 2; k < a.length; k += 2) {
        expect(Math.hypot(b[k] - b[0], b[k + 1] - b[1])).toBeCloseTo(
          Math.hypot(a[k] - a[0], a[k + 1] - a[1]),
          4,
        );
      }
    });
  });

  it('node.size khong doi khi intensity doi', () => {
    const base = textNode({ text: 'Headline' });
    const flat = measureText({ ...base, warp: { type: 'wave', intensity: 0 } }, poppins);
    const curved = measureText({ ...base, warp: { type: 'wave', intensity: 1 } }, poppins);
    expect(curved).toEqual(flat);
  });

  it('resolveWarpPath danh dau preset la fit, path da luu la khong fit', () => {
    const preset = textNode({ warp: { type: 'wave', intensity: 1 } });
    expect(resolveWarpPath(preset, 0.8)?.fit).toBe(true);

    const stored = textNode({
      warp: { type: 'wave', intensity: 1, paths: [buildWavePath(0.5, 0.8)] },
    });
    expect(resolveWarpPath(stored, 0.8)?.fit).toBe(false);
  });
});

describe('bounds', () => {
  it('bat cuc tri nam ngoai bao loi cac diem on-curve', () => {
    // Cung vong len tren y = 0 giua hai dau mut: cuc tri o t = 0.5 cho
    // y = -0.75·100 = -75. Lay min/max cac diem on-curve se ra 0.
    const bounds = shapesBounds([
      { outer: [0, 0, 0, -100, 100, -100, 100, 0], holes: [], anchorX: 50, baselineY: 0 },
    ]);
    expect(bounds.minY).toBeCloseTo(-75, 6);
    expect(bounds.maxY).toBeCloseTo(0, 6);
    expect(bounds.minX).toBeCloseTo(0, 6);
    expect(bounds.maxX).toBeCloseTo(100, 6);
  });

  it('mang rong tra ve hop 0', () => {
    expect(shapesBounds([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('wave lam bounds cao hon hop layout nhung node.size giu nguyen', () => {
    const node = textNode({ text: 'Headline', warp: { type: 'wave', intensity: 1 } });
    const geometry = textGeometry(node, poppins);
    expect(geometry.bounds.maxY - geometry.bounds.minY).toBeGreaterThan(geometry.height);
    expect(measureText(node, poppins).height).toBeCloseTo(geometry.height, 9);
  });
});

describe('bake he so co', () => {
  const layout = {
    shapes: [],
    width: 400,
    height: 100,
    baselineY: 80,
    bounds: { minX: 0, minY: 0, maxX: 400, maxY: 100 },
  };

  it('resolveWarpGeometry tra ve path DA bake voi preset', () => {
    const resolved = resolveWarpGeometry(
      textNode({ warp: { type: 'wave', intensity: 1 } }),
      layout,
    )!;
    const raw = buildWavePath(1, 0.8);
    const k = solveHorizontalScale(raw, { width: 400, height: 100 }, 400);

    expect(k).toBeLessThan(1);
    expect(resolved.path.anchors[0].x).toBeCloseTo(bakeScale(raw, k).anchors[0].x, 9);
    expect(resolved.sampler.length).toBeCloseTo(400, 1);
  });

  it('luu path da bake roi render lai cho hinh trung khit', () => {
    const shapes = [{ outer: [10, 40, 30, 60], holes: [], anchorX: 20, baselineY: 80 }];
    const withShapes = { ...layout, shapes };
    const before = resolveWarpGeometry(
      textNode({ warp: { type: 'wave', intensity: 1 } }),
      withShapes,
    )!;

    // Mo phong lan keo dau tien: ghi path dang hien thi vao warp.paths.
    const after = resolveWarpGeometry(
      textNode({ warp: { type: 'wave', intensity: 1, paths: [before.path] } }),
      withShapes,
    )!;

    const a = placeOnPath(shapes, before.sampler, 80)[0].outer;
    const b = placeOnPath(shapes, after.sampler, 80)[0].outer;
    a.forEach((value, i) => expect(b[i]).toBeCloseTo(value, 9));
  });
});
