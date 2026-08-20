import { beforeAll, describe, expect, it } from 'vitest';
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { samples } from '../../../demo/samples';
import { measureText } from '../textGeometry';

// Bug that prompted this file: sample-kittl-showcase's text nodes had
// hand-guessed round `size` values instead of measureText() output. Any node
// selected the FIRST time in the app triggers reconcileStaleSize
// (PropertiesPanel.tsx), which silently corrects a wrong size — the pivot
// jumps at that exact moment, looking like "the node jumped when I clicked
// it". Only 'text-play' happened to be pre-selected by the demo, so its size
// self-corrected before the user ever saw it; every other node visibly
// jumped on first click. Guard against this recurring: every sample text
// node's stored size must already match measureText() for its own font.
const FONT_FILES: Record<string, string> = {
  Poppins: 'Poppins-Regular.ttf',
  Anton: 'Anton-Regular.ttf',
  Lobster: 'Lobster-Regular.ttf',
};

const fonts: Record<string, opentype.Font> = {};
beforeAll(() => {
  for (const [family, file] of Object.entries(FONT_FILES)) {
    const path = fileURLToPath(new URL(`../fonts/${file}`, import.meta.url));
    const buffer = readFileSync(path);
    fonts[family] = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  }
});

describe('demo/samples.ts — text node size khong bi doan tay', () => {
  for (const [sampleName, doc] of Object.entries(samples)) {
    for (const page of doc.pages) {
      for (const node of page.children) {
        if (node.type !== 'text') continue;
        it(`${sampleName} / ${node.id}: size khop measureText`, () => {
          // fonts chi duoc dien trong beforeAll (chay o pha thuc thi test),
          // khong duoc doc font o pha collect (than than ham describe) —
          // luc do fonts van con rong.
          const font = fonts[node.font.family];
          expect(font, `chua co font test cho family "${node.font.family}"`).toBeDefined();
          const measured = measureText(node, font);
          expect(node.size.width).toBeCloseTo(measured.width, 2);
          expect(node.size.height).toBeCloseTo(measured.height, 2);
        });
      }
    }
  }
});
