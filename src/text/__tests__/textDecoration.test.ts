import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TextNodeSchema, type Document, type TextNode } from '../../schema';
import { serializeNode } from '../../services/svgSerializer';
import { loadFont, registerFont, resetFontsForTest } from '../fontService';
import { signedArea } from '../glyphOutlines';
import { underlineMetrics } from '../layout';
import { applyTextCase, measureText, shapesBounds, textGeometry } from '../textGeometry';

function readFontBuffer(fileName: string): ArrayBuffer {
  const buffer = readFileSync(fileURLToPath(new URL(`../fonts/${fileName}`, import.meta.url)));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

async function poppins() {
  registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
  return (await loadFont('Poppins'))!.font;
}

afterEach(() => resetFontsForTest());

function textNode(extra: Partial<TextNode> = {}): TextNode {
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
    ...extra,
  };
}

describe('schema: underline / textCase', () => {
  it('tai lieu cu khong co field nao van parse y het', () => {
    const old = textNode();
    expect(TextNodeSchema.parse(old)).toEqual(old);
    expect('underline' in TextNodeSchema.parse(old)).toBe(false);
  });

  it('nhan gia tri hop le, tu choi textCase la', () => {
    const node = textNode({ underline: true, textCase: 'upper' });
    expect(TextNodeSchema.parse(node)).toEqual(node);
    expect(() => TextNodeSchema.parse({ ...node, textCase: 'title' })).toThrow();
  });
});

describe('textCase', () => {
  it('upper/lower giu dau tieng Viet', () => {
    expect(applyTextCase('đường', 'upper')).toBe('ĐƯỜNG');
    expect(applyTextCase('ĐƯỜNG Phố', 'lower')).toBe('đường phố');
    expect(applyTextCase('Abc', 'none')).toBe('Abc');
    expect(applyTextCase('Abc', undefined)).toBe('Abc');
  });

  it('chi doi hien thi: geometry bang text da viet hoa, node.text giu nguyen', async () => {
    const font = await poppins();
    const node = textNode({ text: 'wave', textCase: 'upper' });
    expect(textGeometry(node, font).shapes).toEqual(textGeometry(textNode({ text: 'WAVE' }), font).shapes);
    expect(node.text).toBe('wave');
  });
});

describe('underline', () => {
  it('them hinh duoi baseline, khong doi width/height', async () => {
    const font = await poppins();
    const plain = textGeometry(textNode(), font);
    const under = textGeometry(textNode({ underline: true }), font);
    expect(under.shapes.length).toBeGreaterThan(plain.shapes.length);
    expect(under.width).toBe(plain.width);
    expect(under.height).toBe(plain.height);
    expect(measureText(textNode({ underline: true }), font)).toEqual(measureText(textNode(), font));

    const plainOuters = new Set(plain.shapes.map((s) => s.outer.join()));
    const extra = under.shapes.filter((s) => !plainOuters.has(s.outer.join()));
    expect(extra.length).toBe(4); // mot doan moi glyph
    // Cung chieu quay voi outer glyph: nonzero trong SVG khong duc lo cho chong len chan chu.
    const outerSign = Math.sign(signedArea(plain.shapes[0].outer));
    for (const s of extra) expect(Math.sign(signedArea(s.outer))).toBe(outerSign);
    const b = shapesBounds(extra);
    const m = underlineMetrics(font, 100);
    expect(b.minY).toBeCloseTo(under.baselineY + m.top, 6);
    expect(b.maxY).toBeCloseTo(under.baselineY + m.bottom, 6);
    expect(m.top).toBeGreaterThan(0); // duoi baseline
    // Phu tu dau den cuoi dong
    expect(b.minX).toBeCloseTo(0, 6);
    expect(b.maxX).toBeLessThanOrEqual(under.width + 1e-9);
  });

  it('fallback khi font khong co bang post', async () => {
    const font = await poppins();
    const fake = { ...font, unitsPerEm: font.unitsPerEm, tables: {} } as unknown as typeof font;
    expect(underlineMetrics(fake, 100)).toEqual({ top: 10, bottom: 15 });
  });

  it('theo warp circle (moi doan xoay theo glyph)', async () => {
    const font = await poppins();
    const node = textNode({ underline: true, warp: { type: 'circle', curveHeight: 0, directionInverted: false } } as Partial<TextNode>);
    const geometry = textGeometry(node, font);
    for (const shape of geometry.shapes) for (const v of shape.outer) expect(Number.isFinite(v)).toBe(true);
  });

  const doc: Document = { version: 1, id: 'doc-1', meta: { title: 't', createdAt: 0, updatedAt: 0 }, pages: [], assets: {} };

  it('SVG export co dai gach chan', async () => {
    await poppins();
    const plain = serializeNode(textNode(), doc, []);
    const under = serializeNode(textNode({ underline: true }), doc, []);
    expect(under.length).toBeGreaterThan(plain.length);
    expect((under.match(/M /g) ?? []).length).toBeGreaterThan((plain.match(/M /g) ?? []).length);
  });
});
