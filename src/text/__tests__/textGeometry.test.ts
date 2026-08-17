import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TextNode } from '../../schema';
import { measureText, resolveWarpPath, shapesBounds, textGeometry } from '../textGeometry';

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
    const path = resolveWarpPath(textNode({ warp: { type: 'wave', intensity: 0.5 } }), 0.8);
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
    );
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

  it('node.size khong doi khi intensity doi', () => {
    const base = textNode({ text: 'Headline' });
    const flat = measureText({ ...base, warp: { type: 'wave', intensity: 0 } }, poppins);
    const curved = measureText({ ...base, warp: { type: 'wave', intensity: 1 } }, poppins);
    expect(curved).toEqual(flat);
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
    // geometry.height (hop metric font) KHONG con la moc dang tin: no gom ca
    // khoang descender ma "Headline" khong dung toi, va truong dich chuyen doc
    // chi lech deu theo bien do duong cong — khong khuech dai theo do cao
    // glyph nhu xoay cung tung lam — nen o intensity toi da (= 1, tran cua
    // WarpSchema), bounds do thuc te KHONG BAO GIO vuot geometry.height nua
    // (do thuc nghiem tren nhieu text: 'Headline' 139.86/140, 'HEADLINE'
    // 133.4/140, 'Hi' 130.8/140 — luon hut). Day la khac biet THAT so voi
    // ban rigid-rotation cu, khong phai loi cai dat.
    //
    // Moc dang tin duy nhat con lai la ink bbox CHUA warp (plain.bounds): warp
    // luon lam no cao han han — do o cung dieu kien (text 'Headline',
    // intensity 1) la ~1.82x, va do tren nhieu text/intensity khac dao dong
    // 1.38x-1.91x, khong bao gio duoi 1.3x. Neo cung 1.3x thay vi so sanh
    // tran trui `>` de test van bat duoc loi that (vd f() bi trieu tieu ve
    // gan 0) thay vi chi doi mot chenh lech vo cung nho.
    const plain = textGeometry({ ...node, warp: undefined }, poppins);
    const plainDiff = plain.bounds.maxY - plain.bounds.minY;
    expect(geometry.bounds.maxY - geometry.bounds.minY).toBeGreaterThan(plainDiff * 1.3);
    expect(measureText(node, poppins).height).toBeCloseTo(geometry.height, 9);
  });
});

describe('truong dich chuyen doc', () => {
  it('B2 — hoanh do cua moi glyph khong doi khi intensity doi', () => {
    const plain = textGeometry(textNode({ warp: { type: 'wave', intensity: 0 } }), poppins);
    const warped = textGeometry(textNode({ warp: { type: 'wave', intensity: 1 } }), poppins);
    expect(warped.shapes).toHaveLength(plain.shapes.length);
    warped.shapes.forEach((shape, i) => {
      const xsA = shape.outer.filter((_, k) => k % 2 === 0);
      const xsB = plain.shapes[i].outer.filter((_, k) => k % 2 === 0);
      expect(Math.min(...xsA)).toBeCloseTo(Math.min(...xsB), 9);
      expect(Math.max(...xsA)).toBeCloseTo(Math.max(...xsB), 9);
    });
  });

  it('B4 — khong sinh chong lan moi: bbox hoanh do tung glyph giu nguyen', () => {
    // Path cuc doan: keo anchor dau xuong that sau.
    const extreme = textNode({
      warp: {
        type: 'wave',
        intensity: 1,
        paths: [
          {
            role: 'baseline',
            closed: false,
            anchors: [
              { x: 0, y: 1.63, out: { x: 0.2, y: 1.63 } },
              { x: 0.5, y: 0.8, in: { x: 0.35, y: 1.2 }, out: { x: 0.65, y: 0.5 } },
              { x: 1, y: 1.0, in: { x: 0.75, y: 0.3 } },
            ],
          },
        ],
      },
    });
    const plain = textGeometry(textNode({}), poppins);
    const warped = textGeometry(extreme, poppins);
    warped.shapes.forEach((shape, i) => {
      const xsA = shape.outer.filter((_, k) => k % 2 === 0);
      const xsB = plain.shapes[i].outer.filter((_, k) => k % 2 === 0);
      expect(Math.min(...xsA)).toBeCloseTo(Math.min(...xsB), 9);
      expect(Math.max(...xsA)).toBeCloseTo(Math.max(...xsB), 9);
    });
  });

  it('B8 — hai dong giu song song: hieu y tai cung hoanh do dung bang lineStep', () => {
    const node = textNode({ text: 'no\nno', warp: { type: 'wave', intensity: 1 } });
    const geometry = textGeometry(node, poppins);
    const half = geometry.shapes.length / 2;
    const lineStep = node.font.size * node.lineHeight;
    for (let i = 0; i < half; i++) {
      const a = geometry.shapes[i].outer;
      const b = geometry.shapes[i + half].outer;
      expect(a.length).toBe(b.length);
      for (let k = 0; k < a.length; k += 2) {
        expect(a[k]).toBeCloseTo(b[k], 9);
        expect(b[k + 1] - a[k + 1]).toBeCloseTo(lineStep, 6);
      }
    }
  });

  it('B7 — contour sau warp van kin va dung dinh dang', () => {
    const geometry = textGeometry(textNode({ warp: { type: 'wave', intensity: 1 } }), poppins);
    for (const shape of geometry.shapes) {
      for (const contour of [shape.outer, ...shape.holes]) {
        expect((contour.length - 2) % 6).toBe(0);
        // Hoanh do bit-exact (splitCubic khong dung toi p3). Tung do thi chi
        // exact khi doan dong la doan DOC (xem warp.test.ts, nhanh MIN_DX cua
        // displaceSegment) — voi contour font that, doan dong thuong xien, nen
        // alpha+beta*x chi khop f(x) toi may bit cuoi.
        expect(contour[contour.length - 2]).toBe(contour[0]);
        expect(contour[contour.length - 1]).toBeCloseTo(contour[1], 9);
      }
    }
  });
});
