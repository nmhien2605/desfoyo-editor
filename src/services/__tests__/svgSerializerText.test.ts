import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadFont, registerFont, resetFontsForTest } from '../../text/fontService';
import { serializeNode } from '../svgSerializer';
import type { Document, TextNode } from '../../schema';

const doc: Document = {
  version: 1,
  id: 'doc-1',
  meta: { title: 'test', createdAt: 0, updatedAt: 0 },
  pages: [],
  assets: {},
};

const node: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 300, height: 120 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'o',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#ff0000' },
};

function loadFontBuffer(relativePath: string): ArrayBuffer {
  const path = fileURLToPath(new URL(relativePath, import.meta.url));
  const buffer = readFileSync(path);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

// Parser + winding-number check độc lập với production code (không import từ
// svgSerializer.ts/glyphOutlines.ts) — để test này thực sự là một phép kiểm
// tra chéo, không phải suy ra công thức rồi tự khớp với chính nó.
//
// Contour giờ là polybezier (lệnh C), nhưng winding-number chỉ cần đa giác xấp
// xỉ bằng các điểm on-curve — bỏ qua độ phình của cung so với dây cung là đủ
// chính xác cho test này (không phải điểm biên giáp ranh giữa hai contour).
function parseSubpaths(d: string): Array<Array<[number, number]>> {
  const subpaths: Array<Array<[number, number]>> = [];
  const re =
    /M ([-\d.]+) ([-\d.]+)((?:\s+C\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+)*)\s+Z/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const pts: Array<[number, number]> = [[parseFloat(m[1]), parseFloat(m[2])]];
    const cre = /C\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+([-\d.]+)\s+([-\d.]+)/g;
    let cm: RegExpExecArray | null;
    while ((cm = cre.exec(m[3]))) pts.push([parseFloat(cm[1]), parseFloat(cm[2])]);
    subpaths.push(pts);
  }
  return subpaths;
}

// evenodd: đếm số lần cạnh cắt qua tia ngang từ điểm, chẵn/lẻ quyết định tô.
function evenOddFilled(subpaths: Array<Array<[number, number]>>, px: number, py: number): boolean {
  let count = 0;
  for (const pts of subpaths) {
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) count++;
    }
  }
  return count % 2 === 1;
}

// nonzero: cộng dồn dấu (+1 lên, -1 xuống) của mỗi lần cắt, khác 0 thì tô.
function nonzeroFilled(subpaths: Array<Array<[number, number]>>, px: number, py: number): boolean {
  let winding = 0;
  for (const pts of subpaths) {
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
        winding += yj > yi ? 1 : -1;
      }
    }
  }
  return winding !== 0;
}

beforeAll(async () => {
  resetFontsForTest();
  registerFont('Poppins', loadFontBuffer('../../text/fonts/Poppins-Regular.ttf'));
  registerFont('Lobster', loadFontBuffer('../../text/fonts/Lobster-Regular.ttf'));
  await loadFont('Poppins');
  await loadFont('Lobster');
});

describe('serializeNode cho text', () => {
  it('xuat ra <path> vector chu khong phai <image>', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg).toContain('<path');
    expect(svg).not.toContain('<image');
  });

  it('mang mau fill va fill-rule nonzero cho lo', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill-rule="nonzero"');
  });

  it('chu "o" xuat ra 2 subpath: outer + lo', () => {
    const svg = serializeNode(node, doc, []);
    expect(svg.match(/M /g)?.length).toBe(2);
  });

  it('warp lam doi path data', () => {
    const plain = serializeNode(node, doc, []);
    const waved = serializeNode({ ...node, warp: { type: 'wave', curveHeight: 0.8 } }, doc, []);
    expect(waved).not.toBe(plain);
    expect(waved).toContain('<path');
  });

  it('font chua nap thi bo qua node, khong throw', () => {
    const svg = serializeNode({ ...node, font: { ...node.font, family: 'KhongCo' } }, doc, []);
    expect(svg).toBe('');
  });

  it('node an thi khong xuat gi', () => {
    expect(serializeNode({ ...node, visible: false }, doc, [])).toBe('');
  });

  // Font script "Lobster" khien glyph 'b' va 's' trong tu "Lobster" chong
  // outer-outer len nhau thuc su (khong phai quan he outer/hole). Da xac
  // minh bang khao sat hinh hoc: tai diem (183, 93.75) trong khong gian
  // local cua text, outer cua 'b' VA outer cua 's' deu chua diem nay, ca hai
  // cuon cung chieu (cung la outer trong font nay) nen winding cong don
  // thanh +-2 (khac 0) — nonzero to dung (khop canvas, ve tung glyph doc
  // lap), con evenodd dem duoc 2 lan cat (chan) nen KHONG to — sinh lo gia
  // khong ton tai. Day chinh la bug ma fix #2 sua.
  //
  // Toa do da doi tu (182.74, 94.87) sang (183, 93.75) o Task 5: contour gio
  // la polybezier, parseSubpaths chi lay diem on-curve (bo qua do phinh cua
  // cung) nen da giac xap xi thay doi hinh dang chut it — quet lai bang
  // script doc lap de tim diem con thoa dieu kien, khong sua cong thuc.
  it('overlap outer-outer that giua 2 glyph (font Lobster) van duoc to dung duoi nonzero, se sai duoi evenodd', () => {
    const overlapNode: TextNode = {
      ...node,
      text: 'Lobster',
      font: { family: 'Lobster', weight: 400, style: 'normal', size: 110 },
      size: { width: 300, height: 160 },
    };
    const svg = serializeNode(overlapNode, doc, []);
    expect(svg).toContain('fill-rule="nonzero"');

    const d = svg.match(/d="([^"]+)"/)?.[1];
    expect(d).toBeTruthy();
    const subpaths = parseSubpaths(d!);
    // 7 chu cai, 3 co lo (o, b, e) => 10 subpath.
    expect(subpaths.length).toBeGreaterThan(7);

    const px = 183;
    const py = 93.75;
    // Day la khang dinh cot loi: diem nam trong vung "b" va "s" chong len
    // nhau (khong phai lo) phai duoc to duoi nonzero...
    expect(nonzeroFilled(subpaths, px, py)).toBe(true);
    // ...nhung se KHONG duoc to duoi evenodd — chung minh 2 luat khac nhau
    // that su tren chinh du lieu nay, khong phai gia dinh suong.
    expect(evenOddFilled(subpaths, px, py)).toBe(false);
  });
});
