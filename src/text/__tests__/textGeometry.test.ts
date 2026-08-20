import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TextNode, WarpPath } from '../../schema';
import { layoutText } from '../layout';
import {
  measureText,
  resolveCircleParams,
  resolveWarpPath,
  shapesBounds,
  textGeometry,
} from '../textGeometry';

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

function layoutOf(node: TextNode) {
  return layoutText({
    text: node.text,
    font: poppins,
    fontSize: node.font.size,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
    align: node.align,
  });
}

describe('resolveWarpPath', () => {
  it('tra null khi khong co warp hoac warp type none', () => {
    expect(resolveWarpPath(textNode(), 0.8, 120, 0.5)).toBeNull();
    expect(
      resolveWarpPath(textNode({ warp: { type: 'none', curveHeight: 0.5 } }), 0.8, 120, 0.5),
    ).toBeNull();
  });

  it('sinh path preset cho wave khi chua co paths', () => {
    const path = resolveWarpPath(
      textNode({ warp: { type: 'wave', curveHeight: 0.5 } }),
      0.8,
      120,
      0.5,
    );
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
      textNode({ warp: { type: 'wave', curveHeight: 0.5, paths: [stored] } }),
      0.8,
      120,
      0.5,
    );
    expect(path).toEqual(stored);
  });

  it('kep path da luu giu don dieu, khong can ep ve [0,1] (arc-length model chap nhan x bat ky)', () => {
    // Tai lieu truoc plan nay co the luu path voi span hep hon [0,1] (co che
    // fit-to-arc-length cu) — sau khi dua ra mo hinh arc-length moi (spec
    // §2.3) va cho phep endpoint di dong (plan 2026-08-18-warp-endpoint-resize),
    // clampPathX chi con dam bao DON DIEU (endpoint tu do tuy y, khong can
    // ghim ve 0/1). buildWarpMap co the xu ly path voi x bat ky miễn là
    // monotone.
    const stored = {
      role: 'baseline' as const,
      closed: false,
      anchors: [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.9 },
      ],
    };
    const path = resolveWarpPath(
      textNode({ warp: { type: 'wave', curveHeight: 0.5, paths: [stored] } }),
      0.8,
      120,
      0.5,
    );
    expect(path).not.toBeNull();
    expect(path?.anchors[0].x).toBeCloseTo(0.1, 10);
    expect(path?.anchors[path!.anchors.length - 1].x).toBeCloseTo(0.9, 10);
  });

  it('bo qua paths co duoi 2 anchor', () => {
    const broken = { role: 'baseline' as const, closed: false, anchors: [{ x: 0, y: 0.5 }] };
    expect(
      resolveWarpPath(
        textNode({ warp: { type: 'wave', curveHeight: 0.5, paths: [broken] } }),
        0.8,
        120,
        0.5,
      ),
    ).toBeNull();
  });

  it('tra null cho transformation chua co preset (circle/distort can envelope/engine rieng)', () => {
    expect(
      resolveWarpPath(textNode({ warp: { type: 'circle', curveHeight: 0.5 } }), 0.8, 120, 0.5),
    ).toBeNull();
    expect(
      resolveWarpPath(textNode({ warp: { type: 'distort', curveHeight: 0.5 } }), 0.8, 120, 0.5),
    ).toBeNull();
  });

  it('custom: sinh path khoi tao tai CENTER (khong phai baseline) — 2 anchor dau/cuoi nam giua dong chu ngay tu dau', () => {
    // baselineRatio (0.8) va centerRatio (0.3) co tinh khac nhau — assert
    // 2 anchor dau/cuoi bam theo centerRatio, KHONG phai baselineRatio, moi
    // bat duoc bug "path khoi tao khong nam giua dong chu" (path bi sinh tai
    // baseline).
    const path = resolveWarpPath(
      textNode({ warp: { type: 'custom', curveHeight: 0.5 } }),
      0.8,
      120,
      0.3,
    );
    expect(path?.anchors).toHaveLength(3);
    expect(path!.anchors[0].y).toBeCloseTo(0.3, 9);
    expect(path!.anchors[0].out!.y).toBeCloseTo(0.3, 9);
    expect(path!.anchors[2].y).toBeCloseTo(0.3, 9);
    expect(path!.anchors[2].in!.y).toBeCloseTo(0.3, 9);
  });

  it('custom: anchor GIUA nang cao hon 2 dau (goi y duong cong + tach cac handle de de bam)', () => {
    const path = resolveWarpPath(
      textNode({ warp: { type: 'custom', curveHeight: 0.5 } }),
      0.8,
      120,
      0.3,
    )!;
    // y nho hon = cao hon tren man hinh (quy uoc y-down).
    expect(path.anchors[1].y).toBeLessThan(path.anchors[0].y);
    expect(path.anchors[1].in!.y).toBeCloseTo(path.anchors[1].y, 9);
    expect(path.anchors[1].out!.y).toBeCloseTo(path.anchors[1].y, 9);
  });

  it('sinh path preset cho arch/rise/flag/angle khi chua co paths', () => {
    for (const type of ['arch', 'rise', 'flag'] as const) {
      const path = resolveWarpPath(textNode({ warp: { type, curveHeight: 0.5 } }), 0.8, 120, 0.5);
      expect(path?.anchors).toHaveLength(3);
    }
    const angle = resolveWarpPath(
      textNode({ warp: { type: 'angle', curveHeight: 0.5 } }),
      0.8,
      120,
      0.5,
    );
    expect(angle?.anchors).toHaveLength(2);
  });
});

describe('resolveCircleParams', () => {
  it('tra null khi khong co warp, type khac circle, hoac text co xuong dong', () => {
    expect(resolveCircleParams(textNode(), layoutOf(textNode()))).toBeNull();
    const wave = textNode({ warp: { type: 'wave', curveHeight: 0.5 } });
    expect(resolveCircleParams(wave, layoutOf(wave))).toBeNull();
    const multiline = textNode({ text: 'a\nb', warp: { type: 'circle', curveHeight: 0.5 } });
    expect(resolveCircleParams(multiline, layoutOf(multiline))).toBeNull();
  });

  it('preset mac dinh: center/radius theo advanceWidth va height, chuan hoa theo fontSize', () => {
    const node = textNode({ warp: { type: 'circle', curveHeight: 0.5 } });
    const layout = layoutOf(node);
    const params = resolveCircleParams(node, layout);
    expect(params).toEqual({
      centerX: (0.5 * layout.advanceWidth) / node.font.size,
      centerY: (0.5 * layout.height) / node.font.size,
      radius: (layout.advanceWidth / Math.PI) / node.font.size,
    });
  });

  it('preset khong phu thuoc letterSpacing (fix)', () => {
    const plain = textNode({ warp: { type: 'circle', curveHeight: 0.5 }, letterSpacing: 0 });
    const spaced = textNode({ warp: { type: 'circle', curveHeight: 0.5 }, letterSpacing: 30 });
    expect(resolveCircleParams(spaced, layoutOf(spaced))).toEqual(
      resolveCircleParams(plain, layoutOf(plain)),
    );
  });

  it('circle da luu thang preset', () => {
    const stored = { centerX: 0.4, centerY: 0.6, radius: 0.25 };
    const node = textNode({ warp: { type: 'circle', curveHeight: 0.5, circle: stored } });
    const params = resolveCircleParams(node, layoutOf(node));
    expect(params).toEqual(stored);
  });
});

describe('textGeometry', () => {
  it('khong warp thi giong het layout thuan', () => {
    const plain = textGeometry(textNode(), poppins);
    const noneWarp = textGeometry(textNode({ warp: { type: 'none', curveHeight: 0.5 } }), poppins);
    expect(noneWarp.shapes[0].outer).toEqual(plain.shapes[0].outer);
  });

  it('wave voi curveHeight = 0 la phep dong nhat', () => {
    const plain = textGeometry(textNode(), poppins);
    const flat = textGeometry(textNode({ warp: { type: 'wave', curveHeight: 0 } }), poppins);
    plain.shapes[0].outer.forEach((value, i) =>
      expect(flat.shapes[0].outer[i]).toBeCloseTo(value, 4),
    );
  });

  it('wave voi curveHeight > 0 lam doi hinh hoc', () => {
    const plain = textGeometry(textNode(), poppins);
    const waved = textGeometry(textNode({ warp: { type: 'wave', curveHeight: 0.8 } }), poppins);
    expect(waved.shapes[0].outer).not.toEqual(plain.shapes[0].outer);
    expect(waved.shapes[0].outer.every(Number.isFinite)).toBe(true);
  });

  it('width/height khong doi khi warp — do la kich thuoc chua warp', () => {
    const plain = textGeometry(textNode(), poppins);
    const waved = textGeometry(textNode({ warp: { type: 'wave', curveHeight: 0.8 } }), poppins);
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
      textNode({ text: '', warp: { type: 'wave', curveHeight: 0.8 } }),
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

describe('textGeometry — circle', () => {
  it('nhanh circle duoc kich hoat: shapes khac layout phang (khong = toa do goc)', () => {
    const plain = textGeometry(textNode(), poppins);
    const circle = textGeometry(textNode({ warp: { type: 'circle', curveHeight: 0.5 } }), poppins);
    expect(circle.shapes[0].outer).not.toEqual(plain.shapes[0].outer);
    expect(circle.shapes.length).toBe(plain.shapes.length);
  });

  it('bounds van tinh qua shapesBounds tren shapes da warp', () => {
    const circle = textGeometry(textNode({ warp: { type: 'circle', curveHeight: 0.5 } }), poppins);
    expect(circle.bounds).toEqual(shapesBounds(circle.shapes));
  });

  it('text nhieu dong tren circle roi ve layout phang khong warp (ngoai pham vi)', () => {
    const node = textNode({ text: 'ab\ncd', warp: { type: 'circle', curveHeight: 0.5 } });
    const circle = textGeometry(node, poppins);
    const plain = textGeometry(textNode({ text: 'ab\ncd' }), poppins);
    expect(circle.shapes).toEqual(plain.shapes);
  });

  it('directionInverted lam glyph huong nguoc (kiem tra gian tiep qua toa do khac nhau)', () => {
    const normal = textGeometry(textNode({ warp: { type: 'circle', curveHeight: 0.5 } }), poppins);
    const inverted = textGeometry(
      textNode({ warp: { type: 'circle', curveHeight: 0.5, directionInverted: true } }),
      poppins,
    );
    expect(inverted.shapes[0].outer).not.toEqual(normal.shapes[0].outer);
  });

  it('letterSpacing khong doi ban kinh preset (fix) — glyph dau trung khit', () => {
    const base = textNode({
      text: 'Wave',
      letterSpacing: 0,
      warp: { type: 'circle', curveHeight: 0.5 },
    });
    const spaced = textNode({
      text: 'Wave',
      letterSpacing: 40,
      warp: { type: 'circle', curveHeight: 0.5 },
    });
    const a = textGeometry(base, poppins);
    const b = textGeometry(spaced, poppins);
    expect(b.shapes[0].outer).toEqual(a.shapes[0].outer);
  });

  it('letterSpacing khong doi circle DA LUU (dong bang tuyet doi theo B2)', () => {
    const stored = { centerX: 0.5, centerY: 0.5, radius: 0.3 };
    const base = textNode({
      text: 'Wave',
      letterSpacing: 0,
      warp: { type: 'circle', curveHeight: 0.5, circle: stored },
    });
    const spaced = textNode({
      text: 'Wave',
      letterSpacing: 40,
      warp: { type: 'circle', curveHeight: 0.5, circle: stored },
    });
    const a = textGeometry(base, poppins);
    const b = textGeometry(spaced, poppins);
    expect(b.shapes[0].outer).toEqual(a.shapes[0].outer);
  });
});

describe('textGeometry — letterSpacing khong lam doi path (linear family, fix)', () => {
  it('preset: glyph dau trung khit du doi letterSpacing', () => {
    const base = textNode({
      text: 'Wave',
      letterSpacing: 0,
      warp: { type: 'wave', curveHeight: 0.8 },
    });
    const spaced = textNode({
      text: 'Wave',
      letterSpacing: 25,
      warp: { type: 'wave', curveHeight: 0.8 },
    });
    const a = textGeometry(base, poppins);
    const b = textGeometry(spaced, poppins);
    expect(b.shapes[0].outer).toEqual(a.shapes[0].outer);
  });

  it('path da luu: glyph dau trung khit du doi letterSpacing', () => {
    const stored: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.2 },
        { x: 1, y: 0.8 },
      ],
    };
    const base = textNode({
      text: 'Wave',
      letterSpacing: 0,
      warp: { type: 'wave', curveHeight: 0.5, paths: [stored] },
    });
    const spaced = textNode({
      text: 'Wave',
      letterSpacing: 25,
      warp: { type: 'wave', curveHeight: 0.5, paths: [stored] },
    });
    const a = textGeometry(base, poppins);
    const b = textGeometry(spaced, poppins);
    expect(b.shapes[0].outer).toEqual(a.shapes[0].outer);
  });
});

describe('text-on-path', () => {
  it('curveHeight = 0 cho hinh hoc trung khit layout, moi dong', () => {
    const node = textNode({ text: 'Hi\nHi', warp: { type: 'wave', curveHeight: 0 } });
    const geometry = textGeometry(node, poppins);
    const plain = textGeometry({ ...node, warp: undefined }, poppins);
    geometry.shapes.forEach((shape, i) => {
      shape.outer.forEach((value, j) => {
        expect(value).toBeCloseTo(plain.shapes[i].outer[j], 6);
      });
    });
  });

  it('node.size khong doi khi curveHeight doi', () => {
    const base = textNode({ text: 'Headline' });
    const flat = measureText({ ...base, warp: { type: 'wave', curveHeight: 0 } }, poppins);
    const curved = measureText({ ...base, warp: { type: 'wave', curveHeight: 1 } }, poppins);
    expect(curved).toEqual(flat);
  });

  it('node.size (pivot cua applyTransform) khong doi khi letterSpacing doi, mien la co warp — fix loi path bi dich chuyen', () => {
    // Bug: node.size dong bo theo measureText, truoc day dung `width` (gom
    // letterSpacing) lam pivot cho applyTransform. Hinh warp (path/circle) da
    // duoc co dinh theo advanceWidth/fontSize (khong doi theo letterSpacing) o
    // fix truoc, nhung pivot van doi theo letterSpacing => CA NODE nhin nhu
    // dich chuyen moi lan doi letterSpacing du hinh khong doi kich thuoc/vi tri
    // cuc bo. Fix: measureText dung pivotWidth (= advanceWidth khi co warp).
    const base = textNode({ text: 'Headline', warp: { type: 'wave', curveHeight: 0.8 } });
    const plain = measureText({ ...base, letterSpacing: 0 }, poppins);
    const spaced = measureText({ ...base, letterSpacing: 30 }, poppins);
    expect(spaced).toEqual(plain);
  });

  it('circle: node.size cung khong doi khi letterSpacing doi', () => {
    const base = textNode({ text: 'Headline', warp: { type: 'circle', curveHeight: 0.5 } });
    const plain = measureText({ ...base, letterSpacing: 0 }, poppins);
    const spaced = measureText({ ...base, letterSpacing: 30 }, poppins);
    expect(spaced).toEqual(plain);
  });

  it('KHONG warp: node.size (width) VAN doi theo letterSpacing nhu binh thuong (doi chung, khong phai qua tay)', () => {
    const base = textNode({ text: 'Headline' }); // warp: undefined
    const plain = measureText({ ...base, letterSpacing: 0 }, poppins);
    const spaced = measureText({ ...base, letterSpacing: 30 }, poppins);
    expect(spaced.width).toBeGreaterThan(plain.width);
  });
});

describe('textGeometry — custom (rigid-transform-per-glyph)', () => {
  it('chua keo tay: co goi y cong nhe (khong con phang tuyet doi — xem CUSTOM_INIT_CURVE_HEIGHT), nhung van RIGID', () => {
    const custom = textGeometry(textNode({ warp: { type: 'custom', curveHeight: 0.5 } }), poppins);
    const plain = textGeometry(textNode(), poppins);
    // Khong con bang tuyet doi (path khoi tao co bump nhe o giua) — nhung
    // glyph dau (pivotX gan 0, gan anchor dau chua bi doi) phai LECH RAT IT
    // so voi layout goc — pivotX cua glyph dau khong dung tuyet doi tai s=0
    // (la tam glyph, khong phai canh trai) nen van co mot chut xoay/dich,
    // nguong 30px (tren fontSize=100, CUSTOM_INIT_CURVE_HEIGHT=0.5) du rong
    // de qua test nhung van chan duoc lech hang tram px cua bug that.
    const dx = custom.shapes[0].outer[0] - plain.shapes[0].outer[0];
    const dy = custom.shapes[0].outer[1] - plain.shapes[0].outer[1];
    expect(Math.hypot(dx, dy)).toBeLessThan(30);

    // Van la rigid transform (dac trung cua Custom) — khoang cach giua 2
    // diem bat ky tren cung 1 glyph khong doi, ke ca khi da co goi y cong.
    const before = plain.shapes[0].outer;
    const after = custom.shapes[0].outer;
    const dist = (pts: number[], i: number, j: number) =>
      Math.hypot(pts[i] - pts[j], pts[i + 1] - pts[j + 1]);
    for (let i = 0; i < before.length; i += 2) {
      for (let j = i + 2; j < before.length; j += 2) {
        expect(dist(after, i, j)).toBeCloseTo(dist(before, i, j), 6);
      }
    }
  });

  it('co paths lech khoi baseline: shapes doi, nhung KHONG meo hinh — chi xoay cung glyph', () => {
    const stored: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.5 },
        { x: 0.5, y: 0.2 },
        { x: 1, y: 0.5 },
      ],
    };
    const node = textNode({
      text: 'Wave',
      warp: { type: 'custom', curveHeight: 0.5, paths: [stored] },
    });
    const custom = textGeometry(node, poppins);
    const plain = textGeometry(textNode({ text: 'Wave' }), poppins);
    expect(custom.shapes[0].outer).not.toEqual(plain.shapes[0].outer);

    // Bat bien rigid: khoang cach giua 2 diem BAT KY tren cung 1 glyph khong
    // doi truoc/sau — dac trung cua rigid transform, KHONG dung cho Wave (co
    // the meo). Day la test phan biet Custom voi 5 preset con lai.
    const before = plain.shapes[0].outer;
    const after = custom.shapes[0].outer;
    expect(after.length).toBe(before.length);
    const dist = (pts: number[], i: number, j: number) =>
      Math.hypot(pts[i] - pts[j], pts[i + 1] - pts[j + 1]);
    for (let i = 0; i < before.length; i += 2) {
      for (let j = i + 2; j < before.length; j += 2) {
        expect(dist(after, i, j)).toBeCloseTo(dist(before, i, j), 6);
      }
    }
  });

  it('letterSpacing khong doi node.size (pivotWidth) khi da co warp thuc su', () => {
    const stored: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.4 },
        { x: 1, y: 0.6 },
      ],
    };
    const base = textNode({
      text: 'Headline',
      warp: { type: 'custom', curveHeight: 0.5, paths: [stored] },
    });
    const plain = measureText({ ...base, letterSpacing: 0 }, poppins);
    const spaced = measureText({ ...base, letterSpacing: 30 }, poppins);
    expect(spaced).toEqual(plain);
  });

  it('path khoi tao nam DUNG GIUA dong chu (centerY), khong phai duoi chan (baseline) — bug bao cao 2026-08-20', () => {
    // Doc lai path khoi tao qua resolveWarpPath (dung centerRatio, khong con
    // baselineRatio) roi so voi centerY/baselineY thuc te cua layout — day la
    // phep do TRUC TIEP, khong suy tu hanh vi khac.
    const node = textNode({ text: 'Headline', warp: { type: 'custom', curveHeight: 0.5 } });
    const layout = layoutOf(node);
    const path = resolveWarpPath(
      node,
      layout.baselineY / layout.height,
      layout.height,
      layout.centerY / layout.height,
    )!;
    const pathY = path.anchors[0].y * layout.height;
    expect(pathY).toBeCloseTo(layout.centerY, 6);
    expect(pathY).not.toBeCloseTo(layout.baselineY, 1);
  });

  it('keo 1 diem KHONG lam chu o phan con lai cua path (van con o centerY) nhay vi tri — bug bao cao 2026-08-20', () => {
    // Truoc fix: path khoi tao flat tai baselineY nhung engine dat pivot tai
    // centerY — ngay khi 1 diem bat ky bi keo (path khong con flat-tai-
    // baselineY nua), TOAN BO chu (ke ca phan path con nguyen o baseline) bi
    // dat lai theo centerY, nhay het mot khoang (baselineY - centerY). Sau
    // fix: path khoi tao flat tai centerY, nen phan CHUA bi keo van dat dung
    // cho cu — glyph dau (nam o phan path con nguyen) phai gan nhu KHONG doi
    // so voi layout chua warp.
    const text = 'Headline';
    const node = textNode({ text, warp: { type: 'custom', curveHeight: 0.5 } });
    const layout = layoutOf(node);
    const flatPath = resolveWarpPath(
      node,
      layout.baselineY / layout.height,
      layout.height,
      layout.centerY / layout.height,
    )!;
    // Chi keo anchor CUOI (o dau ben phai) lech xuong — anchor dau + handle
    // cua no van y nguyen gia tri flat centerY, mo phong dung mot cu keo tay
    // thuc te (chi 1 diem doi, cac diem khac giu nguyen).
    const dragged: WarpPath = {
      ...flatPath,
      anchors: flatPath.anchors.map((a, i) =>
        i === flatPath.anchors.length - 1 ? { ...a, y: a.y + 0.3 } : a,
      ),
    };
    const warped = textGeometry(
      { ...node, warp: { type: 'custom', curveHeight: 0.5, paths: [dragged] } },
      poppins,
    );
    const plain = textGeometry(textNode({ text }), poppins);
    // Glyph dau tien (gan anchor 0, chua bi keo) phai gan nhu trung khop voi
    // layout goc — sai so nho (khong bang 0 tuyet doi vi path khong CON hoan
    // toan flat, chi 1 doan gan dau van gan phang) chu KHONG duoc lech hang
    // chuc px nhu bug cu.
    const dx = warped.shapes[0].outer[0] - plain.shapes[0].outer[0];
    const dy = warped.shapes[0].outer[1] - plain.shapes[0].outer[1];
    expect(Math.hypot(dx, dy)).toBeLessThan(10);
  });

  it('ky tu vuot qua 2 dau path bi loai het (khong hien ra ngoai path)', () => {
    const shortPath: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.4 },
        { x: 0.1, y: 0.6 },
      ],
    };
    const node = textNode({
      text: 'Headline',
      warp: { type: 'custom', curveHeight: 0.5, paths: [shortPath] },
    });
    const geometry = textGeometry(node, poppins);
    const plain = textGeometry(textNode({ text: 'Headline' }), poppins);
    expect(geometry.shapes.length).toBeLessThan(plain.shapes.length);
  });
});

describe('bounds', () => {
  it('bat cuc tri nam ngoai bao loi cac diem on-curve', () => {
    // Cung vong len tren y = 0 giua hai dau mut: cuc tri o t = 0.5 cho
    // y = -0.75·100 = -75. Lay min/max cac diem on-curve se ra 0.
    const bounds = shapesBounds([{ outer: [0, 0, 0, -100, 100, -100, 100, 0], holes: [] }]);
    expect(bounds.minY).toBeCloseTo(-75, 6);
    expect(bounds.maxY).toBeCloseTo(0, 6);
    expect(bounds.minX).toBeCloseTo(0, 6);
    expect(bounds.maxX).toBeCloseTo(100, 6);
  });

  it('mang rong tra ve hop 0', () => {
    expect(shapesBounds([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('wave lam bounds cao hon hop layout nhung node.size giu nguyen', () => {
    const node = textNode({ text: 'Headline', warp: { type: 'wave', curveHeight: 1 } });
    const geometry = textGeometry(node, poppins);
    // geometry.height (hop metric font) KHONG con la moc dang tin: no gom ca
    // khoang descender ma "Headline" khong dung toi, va warp arc-length chi
    // lech deu theo bien do duong cong — khong khuech dai theo do cao glyph
    // nhu xoay cung tung lam — nen o curveHeight toi da (= 4, tran cua
    // WarpSchema), bounds do thuc te KHONG BAO GIO vuot geometry.height nua
    // (do thuc nghiem tren nhieu text: 'Headline' 139.86/140, 'HEADLINE'
    // 133.4/140, 'Hi' 130.8/140 — luon hut). Day la khac biet THAT so voi
    // ban rigid-rotation cu, khong phai loi cai dat.
    //
    // Moc dang tin duy nhat con lai la ink bbox CHUA warp (plain.bounds): warp
    // luon lam no cao han han — do o cung dieu kien (text 'Headline',
    // curveHeight 1) la ~1.82x, va do tren nhieu text/curveHeight khac dao dong
    // 1.38x-1.91x, khong bao gio duoi 1.3x. Neo cung 1.3x thay vi so sanh
    // tran trui `>` de test van bat duoc loi that (vd f() bi trieu tieu ve
    // gan 0) thay vi chi doi mot chenh lech vo cung nho.
    const plain = textGeometry({ ...node, warp: undefined }, poppins);
    const plainDiff = plain.bounds.maxY - plain.bounds.minY;
    expect(geometry.bounds.maxY - geometry.bounds.minY).toBeGreaterThan(plainDiff * 1.3);
    expect(measureText(node, poppins).height).toBeCloseTo(geometry.height, 9);
  });
});

describe('bien doi theo do dai cung', () => {
  it('I7/I9 — thu tu hoanh do cac glyph giu nguyen, khong chong lan', () => {
    const node = textNode({ text: 'Wave', warp: { type: 'wave', curveHeight: 2 } });
    const { shapes } = textGeometry(node, poppins);
    const ranges = shapes.map((shape) => {
      const xs = shape.outer.filter((_, i) => i % 2 === 0);
      return { min: Math.min(...xs), max: Math.max(...xs) };
    });
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].min).toBeGreaterThanOrEqual(ranges[i - 1].max - 1e-6);
    }
  });

  it('I3 (moi) — be ngang bbox sau warp khong bao gio vuot be ngang truoc warp', () => {
    // Khong con he so k = L/W ep khop W voi L: buildWarpMap gio dat s = x
    // truc tiep (khong nhan k), nen dX/dx = cos(theta) <= 1 tai moi diem (theta
    // la goc tiep tuyen cua path) — X(x) <= x voi moi x, suy ra be ngang bbox
    // sau warp khong bao gio VUOT qua be ngang truoc warp, chi co the bang
    // hoac hep hon (do nen cuc bo o cho path doc, xem test I8 ben duoi). Day
    // la bang chung truc tiep cho yeu cau "ky tu khong bi keo gian theo do
    // dai path": truoc day (k = L/W > 1 khi path cong) bbox LUON bang dung
    // plainW du curveHeight bao nhieu; gio no <= plainW, khong con bi ep dung.
    const plain = textGeometry(textNode({ text: 'Wave' }), poppins).bounds;
    const plainW = plain.maxX - plain.minX;
    for (const curveHeight of [0.25, 1, 2, 4]) {
      const b = textGeometry(
        textNode({ text: 'Wave', warp: { type: 'wave', curveHeight } }),
        poppins,
      ).bounds;
      expect(b.maxX - b.minX).toBeLessThanOrEqual(plainW + 0.5);
    }
  });

  it('I3 ap dung cho ca arch/rise/flag/angle — bat bien khong rieng cua Wave', () => {
    // dX/dx = cos(theta) <= 1 dung voi BAT KY path nao (khong phu thuoc hinh
    // dang preset), nen bat bien nay phai giu dung cho ca 4 preset moi.
    const plain = textGeometry(textNode({ text: 'Wave' }), poppins).bounds;
    const plainW = plain.maxX - plain.minX;
    for (const type of ['arch', 'rise', 'flag', 'angle'] as const) {
      for (const curveHeight of [-1, 0.5, 2, 4]) {
        const b = textGeometry(textNode({ text: 'Wave', warp: { type, curveHeight } }), poppins)
          .bounds;
        expect(b.maxX - b.minX).toBeLessThanOrEqual(plainW + 0.5);
      }
    }
  });

  it('I8 — glyph o vung path doc bi nen hep hon glyph o vung path phang', () => {
    // Path phang nua trai, doc len o nua phai. Chu 'H' giong het nhau nen be
    // ngang khac nhau chi co the do phep bien doi gay ra.
    const steep: WarpPath = {
      role: 'baseline',
      closed: false,
      anchors: [
        { x: 0, y: 0.6, out: { x: 0.25, y: 0.6 } },
        { x: 0.5, y: 0.6, in: { x: 0.4, y: 0.6 }, out: { x: 0.55, y: 0.6 } },
        { x: 1, y: -0.9, in: { x: 0.6, y: -0.9 } },
      ],
    };
    const node = textNode({
      text: 'HHHHHHHHH',
      warp: { type: 'wave', curveHeight: 1, paths: [steep] },
    });
    const { shapes } = textGeometry(node, poppins);
    const widthOf = (i: number) => {
      const xs = shapes[i].outer.filter((_, k) => k % 2 === 0);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(widthOf(shapes.length - 1)).toBeLessThan(widthOf(0));
  });

  it('B8 — hai dong giu song song: hieu y tai cung hoanh do dung bang lineStep', () => {
    const node = textNode({ text: 'no\nno', warp: { type: 'wave', curveHeight: 1 } });
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
    const geometry = textGeometry(textNode({ warp: { type: 'wave', curveHeight: 1 } }), poppins);
    for (const shape of geometry.shapes) {
      for (const contour of [shape.outer, ...shape.holes]) {
        expect((contour.length - 2) % 6).toBe(0);
        // Hoanh do bit-exact (splitCubic khong dung toi p3). Tung do thi chi
        // exact khi doan dong la doan DOC (xem warp.test.ts, nhanh MIN_DX cua
        // displaceSegment) — voi contour font that, doan dong thuong xien, nen
        // alpha+beta*x chi khop f(x) toi may bit cuoi.
        // toBeCloseTo (khong phai toBe): affine ngoai suy va map.X() truc
        // tiep co the lech vai bit cuoi cua so thap phan tuy thuoc a/b cua
        // path — sai khac ~1e-13, khong phai loi hinh hoc.
        expect(contour[contour.length - 2]).toBeCloseTo(contour[0], 9);
        expect(contour[contour.length - 1]).toBeCloseTo(contour[1], 9);
      }
    }
  });
});
