import { afterEach, describe, expect, it } from 'vitest';
import type { Document, TextNode } from '../../schema';
import { serializeNode } from '../../services/svgSerializer';
import {
  getLoadedFont,
  loadFont,
  registerFont,
  resetFontsForTest,
  resolveFontVariant,
} from '../fontService';
import { emboldenContour, FAUX_BOLD_EM, getGlyphOutlines, signedArea } from '../glyphOutlines';
import { measureText, shapesBounds, textGeometry } from '../textGeometry';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function readFontBuffer(fileName: string): ArrayBuffer {
  const buffer = readFileSync(fileURLToPath(new URL(`../fonts/${fileName}`, import.meta.url)));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

afterEach(() => resetFontsForTest());

function textNode(font: Partial<TextNode['font']> = {}, text = 'Wave'): TextNode {
  return {
    id: 'text-1',
    type: 'text',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
    size: { width: 300, height: 120 },
    opacity: 1,
    visible: true,
    locked: false,
    text,
    font: { family: 'Poppins', weight: 400, style: 'normal', size: 100, ...font },
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#000000' },
  };
}

async function regularOnly() {
  registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
  return (await loadFont('Poppins'))!.font;
}

describe('font variants: lookup', () => {
  // File khác nhau cho từng biến thể để nhận ra file nào được chọn.
  async function setup() {
    registerFont('Fam', readFontBuffer('Poppins-Regular.ttf'));
    registerFont('Fam', readFontBuffer('Anton-Regular.ttf'), { weight: 700 });
    registerFont('Fam', readFontBuffer('Lobster-Regular.ttf'), { style: 'italic' });
    const regular = (await loadFont('Fam'))!;
    const bold = (await loadFont('Fam', { weight: 700 }))!;
    const italic = (await loadFont('Fam', { style: 'italic' }))!;
    return { regular, bold, italic };
  }

  it('2-arg registerFont/loadFont(family) van la ban 400/normal', async () => {
    const { regular } = await setup();
    expect(regular).toMatchObject({ weight: 400, style: 'normal' });
    expect(getLoadedFont('Fam')).toBe(regular);
  });

  it('khop chinh xac weight/style', async () => {
    const { bold, italic } = await setup();
    expect(getLoadedFont('Fam', { weight: 700 })).toBe(bold);
    expect(getLoadedFont('Fam', { weight: 400, style: 'italic' })).toBe(italic);
  });

  it('weight gan nhat, uu tien dung style', async () => {
    const { regular, bold, italic } = await setup();
    expect(getLoadedFont('Fam', { weight: 900 })).toBe(bold);
    expect(getLoadedFont('Fam', { weight: 600 })).toBe(bold);
    expect(getLoadedFont('Fam', { weight: 500 })).toBe(regular);
    expect(getLoadedFont('Fam', { weight: 100 })).toBe(regular);
    // Chi co italic 400: italic 700 van lay file italic (style truoc weight).
    expect(getLoadedFont('Fam', { weight: 700, style: 'italic' })).toBe(italic);
  });

  it('file khop nhat chua nap thi getLoadedFont tra null', async () => {
    registerFont('Fam', readFontBuffer('Poppins-Regular.ttf'));
    registerFont('Fam', readFontBuffer('Anton-Regular.ttf'), { weight: 700 });
    await loadFont('Fam');
    expect(getLoadedFont('Fam', { weight: 700 })).toBeNull();
  });

  it('khong co file khop thi faux; co file that thi khong faux', async () => {
    const { regular, bold, italic } = await setup();
    expect(resolveFontVariant({ family: 'Fam', weight: 700, style: 'normal' }, regular.font)).toEqual({
      font: bold.font,
      fauxBold: false,
      fauxItalic: false,
    });
    // Bold italic: file italic 400 -> italic that, bold gia.
    expect(resolveFontVariant({ family: 'Fam', weight: 700, style: 'italic' }, regular.font)).toEqual({
      font: italic.font,
      fauxBold: true,
      fauxItalic: false,
    });
  });

  it('chi co ban thuong: faux bold >= 600, faux italic, 500 thi khong', async () => {
    const font = await regularOnly();
    const spec = (weight: number, style: 'normal' | 'italic' = 'normal') => ({ family: 'Poppins', weight, style });
    expect(resolveFontVariant(spec(700), font)).toEqual({ font, fauxBold: true, fauxItalic: false });
    expect(resolveFontVariant(spec(500), font)).toEqual({ font, fauxBold: false, fauxItalic: false });
    expect(resolveFontVariant(spec(400, 'italic'), font)).toEqual({ font, fauxBold: false, fauxItalic: true });
  });
});

describe('font variants: faux geometry', () => {
  it('400/normal do y nhu truoc (khong faux)', async () => {
    const font = await regularOnly();
    const geometry = textGeometry(textNode(), font);
    const raw = getGlyphOutlines('Wave', font, 100).reduce((sum, g) => sum + g.advance, 0);
    expect(geometry.width).toBeCloseTo(raw, 9);
  });

  it('faux bold: rong hon ban thuong, moi glyph them 2d', async () => {
    const font = await regularOnly();
    const regular = measureText(textNode(), font);
    const bold = measureText(textNode({ weight: 700 }), font);
    expect(bold.width).toBeCloseTo(regular.width + 4 * 2 * FAUX_BOLD_EM * 100, 9);
    expect(bold.height).toBe(regular.height);
  });

  it('faux bold no outer, co lo (o)', async () => {
    const font = await regularOnly();
    const [plain] = getGlyphOutlines('o', font, 100);
    const [bold] = getGlyphOutlines('o', font, 100, { bold: true });
    const d = FAUX_BOLD_EM * 100;
    const pb = shapesBounds(plain.shapes);
    const bb = shapesBounds(bold.shapes);
    expect(bb.maxX - bb.minX).toBeCloseTo(pb.maxX - pb.minX + 2 * d, 0);
    expect(bb.maxY - bb.minY).toBeCloseTo(pb.maxY - pb.minY + 2 * d, 0);
    expect(Math.abs(signedArea(bold.shapes[0].holes[0]))).toBeLessThan(
      Math.abs(signedArea(plain.shapes[0].holes[0])),
    );
  });

  it('emboldenContour: hinh vuong no dung d moi phia', () => {
    // Vuong 0..10 (doan thang dang cubic), dien tich duong.
    const pts = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    const c: number[] = [0, 0];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      c.push(x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3, x0 + (2 * (x1 - x0)) / 3, y0 + (2 * (y1 - y0)) / 3, x1, y1);
    }
    const sign = Math.sign(signedArea(c));
    const b = shapesBounds([{ outer: emboldenContour(c, 1, sign), holes: [] }]);
    expect(b.minX).toBeCloseTo(-1, 9);
    expect(b.minY).toBeCloseTo(-1, 9);
    expect(b.maxX).toBeCloseTo(11, 9);
    expect(b.maxY).toBeCloseTo(11, 9);
  });

  it('faux italic: muc khong vuot ra ngoai hop [0, width] x [0, height]', async () => {
    const font = await regularOnly();
    for (const text of ['Wave', 'fly', 'Hg\njT']) {
      const node = textNode({ style: 'italic', weight: 700 }, text);
      const g = textGeometry(node, font);
      const plain = textGeometry(textNode({}, text), font).bounds;
      // Ben trai: khong lan hon ban thuong ('j' von co LSB am trong font).
      expect(g.bounds.minX).toBeGreaterThanOrEqual(Math.min(0, plain.minX) - 1e-6);
      expect(g.bounds.maxX).toBeLessThanOrEqual(g.width + 1e-6);
      expect(g.bounds.minY).toBeGreaterThanOrEqual(0);
      expect(g.bounds.maxY).toBeLessThanOrEqual(g.height + 1e-6);
      // Thuc su nghieng: khac hinh ban thuong.
      expect(g.bounds).not.toEqual(plain);
    }
  });

  it('dung file bien the that khi da nap, du caller dua ban thuong', async () => {
    registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
    registerFont('Poppins', readFontBuffer('Anton-Regular.ttf'), { weight: 700 });
    const regular = (await loadFont('Poppins'))!.font;
    const bold = (await loadFont('Poppins', { weight: 700 }))!.font;
    const node = textNode({ weight: 700 });
    expect(measureText(node, regular)).toEqual(measureText(node, bold));
  });
});

describe('font variants: SVG export', () => {
  const doc: Document = {
    version: 1,
    id: 'doc-1',
    meta: { title: 'test', createdAt: 0, updatedAt: 0 },
    pages: [],
    assets: {},
  };

  it('path data mang faux bold/italic, ban thuong khong doi', async () => {
    await regularOnly();
    const regular = serializeNode(textNode(), doc, []);
    const bold = serializeNode(textNode({ weight: 700 }), doc, []);
    const italic = serializeNode(textNode({ style: 'italic' }), doc, []);
    expect(regular).toContain('<path');
    expect(bold).not.toBe(regular);
    expect(italic).not.toBe(regular);
    expect(italic).not.toBe(bold);
  });

  it('dung file bien the that da nap', async () => {
    registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
    registerFont('Poppins', readFontBuffer('Anton-Regular.ttf'), { weight: 700 });
    await loadFont('Poppins');
    // Chua nap file 700: bo qua node (quy uoc font chua nap).
    expect(serializeNode(textNode({ weight: 700 }), doc, [])).toBe('');
    await loadFont('Poppins', { weight: 700 });
    registerFont('Anton', readFontBuffer('Anton-Regular.ttf'));
    await loadFont('Anton');
    const viaVariant = serializeNode(textNode({ weight: 700 }), doc, []);
    expect(viaVariant).toContain('<path');
    expect(viaVariant).toBe(serializeNode(textNode({ family: 'Anton' }), doc, []));
  });
});
