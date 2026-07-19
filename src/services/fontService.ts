import * as opentype from 'opentype.js';

// Phase 1: no FontService module — just a handful of fixed Google Fonts
// loaded at Editor mount, enough for flat PIXI.Text (TextNode) to render.
// A real service (upload, cache, feed opentype.js) lands in Phase 4.
// See CONTEXT.md "FontService".
export const DEFAULT_FONT_FAMILIES = ['Inter', 'Roboto', 'Playfair Display'];
const GOOGLE_FONTS_CSS_URL = `https://fonts.googleapis.com/css2?${DEFAULT_FONT_FAMILIES.map(
  (f) => `family=${encodeURIComponent(f)}:wght@400;700`,
).join('&')}&display=swap`;

let loaded: Promise<void> | null = null;

export function loadDefaultFonts(): Promise<void> {
  if (loaded) return loaded;

  loaded = new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_CSS_URL;
    // Don't block the editor on font hosting being reachable — worst case
    // PIXI.Text falls back to a system font for that family.
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  }).then(() => document.fonts.ready.then(() => undefined));

  return loaded;
}

// Phase 3: upload a custom font (.ttf/.otf/.woff2) from a data URI. Doesn't
// block the editor if the font fails to decode — same tolerance as
// loadDefaultFonts(), a broken upload just falls back to a system font.
export async function registerFont(family: string, dataUri: string): Promise<void> {
  const fontFace = new FontFace(family, `url(${dataUri})`);
  try {
    await fontFace.load();
    document.fonts.add(fontFace);
  } catch (err) {
    console.error(`Failed to load font "${family}":`, err);
  }
}

// Phase 3 (opentype gate, Pass A): raw .ttf sources for the glyph-outline
// pipeline, kept entirely separate from the FontFace-based rendering path
// above. Pinned to one google/fonts commit SHA — an immutable, maximally
// cacheable URL that never drifts under us; bump the SHA by hand if the
// default fonts ever need updating. See plan/phases/phase-3-glyph-outline-
// opentype.md §1 for why this is fetched at runtime instead of bundled, and
// why only the Regular static instance is targeted (variable-font default
// master ≈ weight 400 — bold/italic default-family text falls back to
// raster, same as any other font opentype.js can't outline).
const GOOGLE_FONTS_COMMIT_SHA = '389b770410cc0b7c21c85673bfa2077420fe7f65';
const DEFAULT_FONT_TTF_PATHS: Record<string, string> = {
  Inter: 'ofl/inter/Inter%5Bopsz,wght%5D.ttf',
  Roboto: 'ofl/roboto/Roboto%5Bwdth,wght%5D.ttf',
  'Playfair Display': 'ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf',
};

function defaultFontUrl(family: string): string | undefined {
  const path = DEFAULT_FONT_TTF_PATHS[family];
  return path ? `https://cdn.jsdelivr.net/gh/google/fonts@${GOOGLE_FONTS_COMMIT_SHA}/${path}` : undefined;
}

// WOFF2's magic number ('wOF2'). opentype.js can't decompress WOFF2 (brotli
// support was rejected upstream — see the linked plan doc) and this project
// deliberately doesn't add a WASM decompressor for it: any WOFF2 buffer,
// upload or default, short-circuits straight to the raster-fallback path
// rather than attempting (and failing) a parse.
function isWoff2(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  return new DataView(buffer).getUint32(0, false) === 0x774f4632;
}

function decodeDataUriToArrayBuffer(dataUri: string): ArrayBuffer {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// In-memory only (no IndexedDB/localStorage persistence) — refetched every
// session, a deliberate simplicity-over-bandwidth trade-off (plan doc §1).
const fontCache = new Map<string, Promise<opentype.Font | undefined>>();

async function resolveFontBinary(family: string, dataUri?: string): Promise<ArrayBuffer | undefined> {
  if (dataUri) return decodeDataUriToArrayBuffer(dataUri);
  const url = defaultFontUrl(family);
  if (!url) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    return await res.arrayBuffer();
  } catch {
    // Network/CORS/CDN failure — silent fallback, no warning UI (matches
    // loadDefaultFonts/registerFont's existing tolerance for font trouble).
    return undefined;
  }
}

// Parses a font's raw glyph-outline binary for the opentype gate (per-letter
// transforms, glyph-warp, vector SVG text export) — entirely separate from
// registerFont's FontFace/rendering path above; the two live side by side.
// Never throws: WOFF2, corrupt binaries, and unreachable default-font CDN
// fetches all resolve to `undefined`, which callers treat as "fall back to
// raster" rather than a hard error.
export function getFont(family: string, dataUri?: string): Promise<opentype.Font | undefined> {
  const cacheKey = dataUri ?? family;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const buffer = await resolveFontBinary(family, dataUri);
    if (!buffer || isWoff2(buffer)) return undefined;
    try {
      return opentype.parse(buffer);
    } catch {
      return undefined;
    }
  })();

  fontCache.set(cacheKey, promise);
  return promise;
}
