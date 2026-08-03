import * as opentype from 'opentype.js';

export interface UnicodeRange {
  start: number;
  end: number;
}

export interface FontFaceBlock {
  url: string;
  ranges: UnicodeRange[];
}

// Parses a Google Fonts CSS2 response into every @font-face block's WOFF2
// url + the codepoint ranges it covers. This is the fix for the exact bug
// class slice 1's final review caught in <link>-based loading (grabbing the
// wrong subset) — here at the parsing layer, since we need the actual font
// bytes rather than letting the browser's CSS engine pick a subset for us.
export function parseFontFaceBlocks(css: string): FontFaceBlock[] {
  const blocks: FontFaceBlock[] = [];
  const blockRe = /@font-face\s*{([^}]*)}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(css))) {
    const body = match[1];
    const urlMatch = /src:\s*url\(([^)]+)\)/.exec(body);
    const rangeMatch = /unicode-range:\s*([^;]+);/.exec(body);
    if (!urlMatch || !rangeMatch) continue;
    const ranges = rangeMatch[1].split(',').map((part) => parseRange(part.trim()));
    blocks.push({ url: urlMatch[1].trim(), ranges });
  }
  return blocks;
}

function parseRange(token: string): UnicodeRange {
  // Tokens look like "U+0000-00FF" (range) or "U+0131" (single codepoint).
  const [startHex, endHex] = token.replace(/^U\+/i, '').split('-');
  const start = parseInt(startHex, 16);
  return { start, end: endHex ? parseInt(endHex, 16) : start };
}

function blockForCodepoint(blocks: FontFaceBlock[], codepoint: number): FontFaceBlock | undefined {
  return blocks.find((b) => b.ranges.some((r) => codepoint >= r.start && codepoint <= r.end));
}

const fontCache = new Map<string, Promise<opentype.Font | null>>();

// Fetches the real WOFF2 font file(s) covering `text`'s codepoints, decompresses
// with wawoff2, and parses with opentype.js. Cached per family:weight — the
// whole parsed Font is reused for any later text on that family/weight, since
// re-fetching per node/per-render would be wasteful and opentype.js's Font
// object works for characters outside the text that first triggered the load
// as long as they're in the same Google-served subset(s).
//
// Multi-subset fonts (a character needing e.g. both 'latin' and 'latin-ext')
// aren't merged — only the FIRST subset covering the FIRST fetch's codepoints
// is parsed. This is a deliberate v1 scope cut: mixed-subset single nodes are
// rare (most real text stays within one subset), and the fallback (an
// unresolved character renders un-warped, see warpMesh.ts) degrades safely
// rather than crashing.
export async function getFontForWarp(family: string, weight: number, text: string): Promise<opentype.Font | null> {
  const key = `${family}:${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
      const cssRes = await fetch(cssUrl);
      const css = await cssRes.text();
      const blocks = parseFontFaceBlocks(css);
      if (blocks.length === 0) return null;

      const firstCodepoint = text.codePointAt(0) ?? 0x41;
      const block = blockForCodepoint(blocks, firstCodepoint) ?? blocks[0];

      const fontRes = await fetch(block.url);
      const compressed = new Uint8Array(await fontRes.arrayBuffer());
      const wawoff2 = await import('wawoff2');
      const decompressed = await wawoff2.decompress(compressed);
      return opentype.parse(decompressed.buffer);
    } catch {
      // Network failure, decompression failure, or a malformed font: warp
      // falls back to un-warped rendering (see warpMesh.ts) rather than
      // crashing the editor — same convention as loadGoogleFont's catch.
      return null;
    }
  })();

  fontCache.set(key, promise);
  return promise;
}
