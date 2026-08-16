import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TextNode } from '../../schema';
import { reconcileStaleSize } from '../PropertiesPanel';

let poppins: opentype.Font;
beforeAll(() => {
  const path = fileURLToPath(new URL('../../text/fonts/Poppins-Regular.ttf', import.meta.url));
  const buffer = readFileSync(path);
  poppins = opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
});

const node: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 10, height: 10 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'abc',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 100 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

describe('reconcileStaleSize', () => {
  it('font chua nap thi tra null, khong doan mo', () => {
    expect(reconcileStaleSize(node, null)).toBeNull();
  });

  it('node.size sai lech (vi du: reselect sau khi font tai xong trong luc bi bo chon) thi tra patch dung', () => {
    // node.size = 10x10 co tinh, khong khop voi kich thuoc that cua "abc" o
    // Poppins 100px — mo phong dung tinh huong finding #6: font da nap xong
    // tu truoc (vi du trong luc node bi bo chon, listener onFontLoaded da
    // ban roi) nhung size chua duoc sua.
    const patch = reconcileStaleSize(node, poppins);
    expect(patch).not.toBeNull();
    expect(patch!.width).toBeGreaterThan(50);
    expect(patch!.height).toBeGreaterThan(50);
  });

  it('node.size da khop (trong pham vi epsilon) thi tra null, khong dispatch thua', () => {
    const measured = reconcileStaleSize(node, poppins)!;
    const synced: TextNode = { ...node, size: measured };
    expect(reconcileStaleSize(synced, poppins)).toBeNull();
  });

  it('sai lech nho hon epsilon (0.01) van tra null', () => {
    const measured = reconcileStaleSize(node, poppins)!;
    const almostSynced: TextNode = {
      ...node,
      size: { width: measured.width + 0.005, height: measured.height - 0.005 },
    };
    expect(reconcileStaleSize(almostSynced, poppins)).toBeNull();
  });
});
