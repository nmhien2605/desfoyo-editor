import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getGlyphOutlines, signedArea, translateContour } from '../glyphOutlines';

function loadTestFont(fileName: string): opentype.Font {
  const path = fileURLToPath(new URL(`../fonts/${fileName}`, import.meta.url));
  const buffer = readFileSync(path);
  return opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
}

let poppins: opentype.Font;
let anton: opentype.Font;
beforeAll(() => {
  poppins = loadTestFont('Poppins-Regular.ttf');
  anton = loadTestFont('Anton-Regular.ttf');
});

describe('getGlyphOutlines', () => {
  it('chu "o" ra dung 1 shape voi 1 lo', () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    expect(glyph.shapes).toHaveLength(1);
    expect(glyph.shapes[0].holes).toHaveLength(1);
  });

  it('chu "i" ra 2 shape roi nhau, khong lo', () => {
    const [glyph] = getGlyphOutlines('i', poppins, 100);
    expect(glyph.shapes).toHaveLength(2);
    expect(glyph.shapes.flatMap((s) => s.holes)).toHaveLength(0);
  });

  it('lo nam nguoc chieu voi outer', () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    const { outer, holes } = glyph.shapes[0];
    expect(Math.sign(signedArea(outer))).not.toBe(Math.sign(signedArea(holes[0])));
  });

  it('advance duong va ti le theo fontSize', () => {
    const [small] = getGlyphOutlines('A', poppins, 50);
    const [big] = getGlyphOutlines('A', poppins, 100);
    expect(small.advance).toBeGreaterThan(0);
    expect(big.advance).toBeCloseTo(small.advance * 2, 5);
  });

  it('moi toa do deu huu han', () => {
    const points = getGlyphOutlines('Wave', poppins, 100)
      .flatMap((g) => g.shapes)
      .flatMap((s) => [s.outer, ...s.holes])
      .flat();
    expect(points.length).toBeGreaterThan(0);
    expect(points.every(Number.isFinite)).toBe(true);
  });

  it('khoang trang khong co shape nhung van co advance', () => {
    const [glyph] = getGlyphOutlines(' ', poppins, 100);
    expect(glyph.shapes).toHaveLength(0);
    expect(glyph.advance).toBeGreaterThan(0);
  });

  it('translateContour doi cho dung', () => {
    expect(translateContour([0, 0, 10, 5], 3, -2)).toEqual([3, -2, 13, 3]);
  });

  // Font Anton co cap kern "AV" = -44 don vi font (unitsPerEm 2048), xac minh
  // truc tiep bang font.getKerningValue trong test nay. Neu kerning bi bo
  // qua, tong advance cua "AV" se dung bang tong advance rieng le cua 'A' va
  // 'V' — test nay that bai truoc khi fix duoc ap dung.
  it('ap dung kerning: cap "AV" trong Anton co advance nho hon tong advance rieng le', () => {
    const glyphsAV = anton.stringToGlyphs('AV');
    const rawKern = anton.getKerningValue(glyphsAV[0], glyphsAV[1]);
    expect(rawKern).toBeLessThan(0); // xac nhan cap nay thuc su co kern am

    const [a] = getGlyphOutlines('A', anton, 110);
    const [v] = getGlyphOutlines('V', anton, 110);
    const [avA, avV] = getGlyphOutlines('AV', anton, 110);

    const scale = 110 / anton.unitsPerEm;
    // advance cua glyph dung truoc trong cap phai duoc cong them kern*scale.
    expect(avA.advance).toBeCloseTo(a.advance + rawKern * scale, 5);
    // Chu 'V' dung sau, khong doi.
    expect(avV.advance).toBeCloseTo(v.advance, 5);

    const kernedTotal = avA.advance + avV.advance;
    const unkernedTotal = a.advance + v.advance;
    expect(kernedTotal).toBeLessThan(unkernedTotal);
  });
});

// Đường tròn xấp xỉ bằng 4 cung cubic, hằng số kappa quen thuộc.
function circleContour(r: number): number[] {
  const k = 0.5522847498307936 * r;
  return [r, 0, r, k, k, r, 0, r, -k, r, -r, k, -r, 0, -r, -k, -k, -r, 0, -r, k, -r, r, -k, r, 0];
}

describe('contour polybezier', () => {
  it('do dai contour la 2 + 6n', () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    for (const shape of glyph.shapes) {
      expect((shape.outer.length - 2) % 6).toBe(0);
      for (const hole of shape.holes) expect((hole.length - 2) % 6).toBe(0);
    }
  });

  it('contour kin: diem on-curve cuoi trung diem dau', () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    const c = glyph.shapes[0].outer;
    expect(c[c.length - 2]).toBeCloseTo(c[0], 6);
    expect(c[c.length - 1]).toBeCloseTo(c[1], 6);
  });

  it('signedArea chinh xac tren cung, khong phai xap xi da giac', () => {
    // Hình xấp xỉ 4-cubic có diện tích lệch πr² khoảng 0.028% (~8.8 don vi
    // tren r=100, xac minh bang tich phan shoelace day mau doc lap) — sai so
    // cua chinh phep xap xi hinh hoc, khong phai cua phep tinh dien tich.
    // precision -2 (dung sai 50) du long de bao dung sai xap xi that (~8.8)
    // ma van chat de bat loi neu signedArea quay lai tinh tren day polygon.
    expect(Math.abs(signedArea(circleContour(100)))).toBeCloseTo(Math.PI * 1e4, -2);
  });

  it('signedArea doi dau khi dao chieu contour', () => {
    const forward = circleContour(100);
    const reversed: number[] = [];
    for (let i = forward.length - 2; i >= 0; i -= 2) reversed.push(forward[i], forward[i + 1]);
    expect(Math.sign(signedArea(reversed))).toBe(-Math.sign(signedArea(forward)));
  });

  it("glyph 'o' co dung mot outer va mot hole", () => {
    const [glyph] = getGlyphOutlines('o', poppins, 100);
    expect(glyph.shapes).toHaveLength(1);
    expect(glyph.shapes[0].holes).toHaveLength(1);
  });
});
