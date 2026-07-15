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
