// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { GOOGLE_FONTS, DEFAULT_FONT_FAMILY, loadGoogleFont } from '../googleFonts';

describe('GOOGLE_FONTS', () => {
  it('has at least one entry, each with a non-empty family and at least one weight', () => {
    expect(GOOGLE_FONTS.length).toBeGreaterThan(0);
    for (const entry of GOOGLE_FONTS) {
      expect(entry.family.length).toBeGreaterThan(0);
      expect(entry.weights.length).toBeGreaterThan(0);
    }
  });

  it('DEFAULT_FONT_FAMILY matches the first entry in the list', () => {
    expect(DEFAULT_FONT_FAMILY).toBe(GOOGLE_FONTS[0].family);
  });
});

describe('loadGoogleFont', () => {
  it('resolves without throwing and without a network call when FontFace is unavailable (jsdom has none)', async () => {
    await expect(loadGoogleFont('Roboto', 400)).resolves.toBeUndefined();
  });
});
