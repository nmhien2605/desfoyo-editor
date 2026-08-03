import { describe, it, expect } from 'vitest';
import { parseFontFaceBlocks } from '../googleFontFiles';

const FIXTURE_CSS = `
/* latin-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/roboto/v30/latin-ext.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/roboto/v30/latin.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`;

describe('parseFontFaceBlocks', () => {
  it('extracts every @font-face block with its unicode-range and url', () => {
    const blocks = parseFontFaceBlocks(FIXTURE_CSS);
    expect(blocks).toHaveLength(2);
    expect(blocks[1].url).toBe('https://fonts.gstatic.com/s/roboto/v30/latin.woff2');
    expect(blocks[1].ranges).toContainEqual({ start: 0x0000, end: 0x00ff });
  });

  it('picks the block covering a given Latin codepoint, not the first block in the response', () => {
    const blocks = parseFontFaceBlocks(FIXTURE_CSS);
    const covering = blocks.find((b) => b.ranges.some((r) => 0x41 >= r.start && 0x41 <= r.end)); // 'A' = U+0041
    expect(covering?.url).toBe('https://fonts.gstatic.com/s/roboto/v30/latin.woff2');
  });
});
