import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getLoadedFont,
  loadFont,
  onFontLoaded,
  registerFont,
  registeredFamilies,
  resetFontsForTest,
} from '../fontService';

export function readFontBuffer(fileName: string): ArrayBuffer {
  const path = fileURLToPath(new URL(`../fonts/${fileName}`, import.meta.url));
  const buffer = readFileSync(path);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

afterEach(() => resetFontsForTest());

describe('fontService', () => {
  it('nap font tu ArrayBuffer va cache lai', async () => {
    registerFont('Anton', readFontBuffer('Anton-Regular.ttf'));
    expect(registeredFamilies()).toEqual(['Anton']);
    expect(getLoadedFont('Anton')).toBeNull();

    const loaded = await loadFont('Anton');
    expect(loaded?.family).toBe('Anton');
    expect(loaded?.font.unitsPerEm).toBeGreaterThan(0);
    expect(getLoadedFont('Anton')).toBe(loaded);
  });

  it('bao cho listener khi font nap xong', async () => {
    const seen: string[] = [];
    const off = onFontLoaded((family) => seen.push(family));
    registerFont('Poppins', readFontBuffer('Poppins-Regular.ttf'));
    await loadFont('Poppins');
    off();
    expect(seen).toEqual(['Poppins']);
  });

  it('tra null cho family chua dang ky, khong throw', async () => {
    expect(await loadFont('KhongTonTai')).toBeNull();
  });

  it('tra null khi file font hong, khong throw', async () => {
    registerFont('Hong', new Uint8Array([1, 2, 3, 4]).buffer);
    expect(await loadFont('Hong')).toBeNull();
  });
});
