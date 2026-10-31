import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getLoadedFont, loadFont, registerFont } from '../../text/fontService';
import { FillGradient, Graphics, Rectangle } from 'pixi.js';
import {
  drawTextShadow,
  drawTextShapes,
  textRenderer,
  type TextDrawTarget,
} from '../renderers/textRenderer';
import { textGeometry } from '../../text/textGeometry';
import type { TextNode } from '../../schema';

function readFontBuffer(fileName: string): ArrayBuffer {
  const path = fileURLToPath(new URL(`../../text/fonts/${fileName}`, import.meta.url));
  const buffer = readFileSync(path);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

function fakeTarget() {
  const calls: string[] = [];
  const target: TextDrawTarget = {
    moveTo() {
      calls.push('moveTo');
      return target;
    },
    bezierCurveTo() {
      calls.push('bezierCurveTo');
      return target;
    },
    closePath() {
      calls.push('closePath');
      return target;
    },
    fill() {
      calls.push('fill');
      return target;
    },
    cut() {
      calls.push('cut');
      return target;
    },
    stroke() {
      calls.push('stroke');
      return target;
    },
  };
  return { target, calls };
}

const node: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 300, height: 120 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'o',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

beforeAll(async () => {
  registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
  await loadFont('Poppins');
});

describe('drawTextShapes', () => {
  it('chu "o": fill outer roi cut lo, dung thu tu (khong hardcode so cung)', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry(node, font).shapes, node.fill);
    // moveTo, [bezierCurveTo]+, closePath, fill  ->  moveTo, [bezierCurveTo]+, closePath, cut
    expect(calls.join(',')).toMatch(
      /^moveTo(,bezierCurveTo)+,closePath,fill,moveTo(,bezierCurveTo)+,closePath,cut$/,
    );
    expect(calls.filter((c) => c === 'fill')).toHaveLength(1);
    expect(calls.filter((c) => c === 'cut')).toHaveLength(1);
  });

  it('chu khong lo chi fill, khong cut', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry({ ...node, text: 'l' }, font).shapes, node.fill);
    expect(calls[0]).toBe('moveTo');
    expect(calls[calls.length - 1]).toBe('fill');
    expect(calls.filter((c) => c === 'cut')).toHaveLength(0);
    expect(calls.filter((c) => c === 'fill')).toHaveLength(1);
  });

  it('text rong khong ve gi', () => {
    const { target, calls } = fakeTarget();
    const font = getLoadedFont('Poppins')!.font;
    drawTextShapes(target, textGeometry({ ...node, text: '' }, font).shapes, node.fill);
    expect(calls).toEqual([]);
  });

  it('ve outer bang moveTo + bezierCurveTo + closePath roi fill, hole thi cut', () => {
    const calls: string[] = [];
    const target = {
      moveTo: () => (calls.push('moveTo'), target),
      bezierCurveTo: () => (calls.push('bezierCurveTo'), target),
      closePath: () => (calls.push('closePath'), target),
      fill: () => (calls.push('fill'), target),
      cut: () => (calls.push('cut'), target),
      stroke: () => (calls.push('stroke'), target),
    };
    drawTextShapes(
      target,
      [
        {
          outer: [0, 0, 1, 0, 2, 0, 3, 0],
          holes: [[0, 0, 1, 0, 2, 0, 3, 0]],
        },
      ],
      { type: 'solid', color: '#000000' },
    );
    expect(calls).toEqual([
      'moveTo',
      'bezierCurveTo',
      'closePath',
      'fill',
      'moveTo',
      'bezierCurveTo',
      'closePath',
      'cut',
    ]);
  });
});

describe('drawTextShapes — gradient trai theo hop node', () => {
  const stops = [
    { offset: 0, color: '#ff0000' },
    { offset: 1, color: '#0000ff' },
  ];

  function fills(fill: TextNode['fill'], text: string, underline = false) {
    const styles: unknown[] = [];
    const { target } = fakeTarget();
    target.fill = (style) => (styles.push(style), target);
    const font = getLoadedFont('Poppins')!.font;
    const geometry = textGeometry({ ...node, text, underline, fill }, font);
    const box = { width: geometry.pivotWidth, height: geometry.height };
    drawTextShapes(target, geometry.shapes, fill, box);
    return { styles, box };
  }

  it('linear: moi glyph + doan gach chan dung CHUNG mot gradient global, khop quy uoc chuan hoa 0..1 cua hop', () => {
    const angle = 0.6;
    const { styles, box } = fills({ type: 'linear-gradient', angle, stops }, 'ab c', true);
    expect(styles.length).toBeGreaterThan(3);
    const g = styles[0] as FillGradient;
    expect(g).toBeInstanceOf(FillGradient);
    expect(styles.every((s) => s === g)).toBe(true);
    expect(g.textureSpace).toBe('global');
    // Tham số gradient tại mọi điểm px = tham số chuẩn hoá (u,v) trên đường
    // qua tâm hộp theo (cos, sin) — đúng gradientHandles.ts bên web.
    const d = { x: Math.cos(angle), y: Math.sin(angle) };
    const e = { x: g.end.x - g.start.x, y: g.end.y - g.start.y };
    const e2 = e.x * e.x + e.y * e.y;
    for (const [u, v] of [[0, 0], [1, 1], [0.3, 0.8], [0.5, 0.5]]) {
      const px = { x: u * box.width, y: v * box.height };
      const pixelT = ((px.x - g.start.x) * e.x + (px.y - g.start.y) * e.y) / e2;
      const normT = 0.5 + (u - 0.5) * d.x + (v - 0.5) * d.y;
      expect(pixelT).toBeCloseTo(normT, 9);
    }
  });

  it('radial: elip tam hop, ban kinh nua hop', () => {
    const { styles, box } = fills({ type: 'radial-gradient', stops }, 'ab');
    const g = styles[0] as FillGradient;
    expect(styles.every((s) => s === g)).toBe(true);
    expect(g.textureSpace).toBe('global');
    expect(g.center).toEqual({ x: box.width / 2, y: box.height / 2 });
    expect(g.outerRadius).toBeCloseTo(Math.max(box.width, box.height) / 2, 9);
    expect(g.outerRadius * g.scale).toBeCloseTo(Math.min(box.width, box.height) / 2, 9);
  });

  it('khong co box thi giu local nhu cu (shape)', () => {
    const { target } = fakeTarget();
    let style: unknown;
    target.fill = (s) => ((style = s), target);
    drawTextShapes(target, [{ outer: [0, 0, 1, 0, 2, 0, 3, 0], holes: [] }], { type: 'linear-gradient', angle: 0, stops });
    expect((style as FillGradient).textureSpace).toBe('local');
  });
});

describe('textRenderer.update — hitArea', () => {
  it('hitArea la khung hinh hoc, khong phai net chu: diem giua hai ky tu van tinh la trung node', () => {
    const font = getLoadedFont('Poppins')!.font;
    const twoLetters: TextNode = { ...node, text: 'll' };
    const obj = new Graphics();
    textRenderer.update(obj, twoLetters);

    const { bounds } = textGeometry(twoLetters, font);
    const hit = obj.hitArea as Rectangle;
    expect(hit.x).toBeCloseTo(bounds.minX, 6);
    expect(hit.y).toBeCloseTo(bounds.minY, 6);
    expect(hit.width).toBeCloseTo(bounds.maxX - bounds.minX, 6);
    expect(hit.height).toBeCloseTo(bounds.maxY - bounds.minY, 6);

    // Khoang trang giua hai net doc cua "ll" khong thuoc path da to nao — day
    // dung la truong hop truoc kia bam vao bi hieu la bam ra nen va mat chon.
    expect(hit.contains((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2)).toBe(
      true,
    );
  });

  it('font chua nap thi xoa hitArea, khong de lai vung bam cua lan ve truoc', () => {
    const obj = new Graphics();
    textRenderer.update(obj, { ...node, text: 'l' });
    expect(obj.hitArea).not.toBeNull();
    textRenderer.update(obj, { ...node, font: { ...node.font, family: 'KhongTonTai' } });
    expect(obj.hitArea).toBeNull();
  });
});

describe('drawTextShadow', () => {
  it('fill mode: ve outer roi fill, hole thi cut (giong drawTextShapes)', () => {
    const { target, calls } = fakeTarget();
    drawTextShadow(
      target,
      [{ shapes: [{ outer: [0, 0, 1, 0, 2, 0, 3, 0], holes: [] }], mode: 'fill' }],
      '#888888',
      undefined,
    );
    expect(calls).toEqual(['moveTo', 'bezierCurveTo', 'closePath', 'fill']);
  });

  it('stroke mode: ve outer roi stroke, KHONG fill, hole cung duoc stroke rieng (khong cut)', () => {
    const { target, calls } = fakeTarget();
    drawTextShadow(
      target,
      [
        {
          shapes: [{ outer: [0, 0, 1, 0, 2, 0, 3, 0], holes: [[0, 0, 1, 0, 2, 0, 3, 0]] }],
          mode: 'stroke',
        },
      ],
      '#888888',
      3,
    );
    expect(calls).toEqual([
      'moveTo',
      'bezierCurveTo',
      'closePath',
      'stroke',
      'moveTo',
      'bezierCurveTo',
      'closePath',
      'stroke',
    ]);
    expect(calls.filter((c) => c === 'cut')).toHaveLength(0);
  });

  it('nhieu lop (3d): ve tuan tu theo dung thu tu mang truyen vao', () => {
    const { target, calls } = fakeTarget();
    drawTextShadow(
      target,
      [
        { shapes: [{ outer: [0, 0, 1, 0, 2, 0, 3, 0], holes: [] }], mode: 'fill' },
        { shapes: [{ outer: [0, 0, 1, 0, 2, 0, 3, 0], holes: [] }], mode: 'fill' },
      ],
      '#888888',
      undefined,
    );
    expect(calls.filter((c) => c === 'fill')).toHaveLength(2);
  });
});

describe('textRenderer.update — shadow ve truoc, chu chinh ve sau (z-order)', () => {
  it('node co text-shadow: lenh fill dau tien la mau shadow, lenh fill cuoi la mau chu', () => {
    const plain = new Graphics();
    textRenderer.update(plain, { ...node, text: 'l' });
    const plainCallCount = plain.context.instructions.length;

    const withShadow = new Graphics();
    textRenderer.update(withShadow, {
      ...node,
      text: 'l',
      effects: [{ type: 'text-shadow', style: 'block', color: '#888888', angle: 0, distance: 0.1 }],
    });
    expect(withShadow.context.instructions.length).toBeGreaterThan(plainCallCount);
  });
});
