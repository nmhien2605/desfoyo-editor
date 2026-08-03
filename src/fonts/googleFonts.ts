export interface GoogleFontEntry {
  family: string;
  weights: number[];
}

// Curated static list (not the full ~1500-font Google catalog — see
// docs/superpowers/specs/2026-08-03-text-effects-design.md for why: no API
// key, no runtime catalog fetch). Extending this is a data change, not a
// code change.
export const GOOGLE_FONTS: GoogleFontEntry[] = [
  { family: 'Roboto', weights: [300, 400, 500, 700, 900] },
  { family: 'Open Sans', weights: [300, 400, 600, 700, 800] },
  { family: 'Montserrat', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Lato', weights: [300, 400, 700, 900] },
  { family: 'Poppins', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Oswald', weights: [300, 400, 500, 600, 700] },
  { family: 'Playfair Display', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Bebas Neue', weights: [400] },
  { family: 'Inter', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Merriweather', weights: [300, 400, 700, 900] },
];

export const DEFAULT_FONT_FAMILY = GOOGLE_FONTS[0].family;

const loaded = new Set<string>();

// Loads a Google Font via its public CSS2 endpoint (the same one <link>
// tags use — no API key needed) + the FontFace API. No-ops outside a
// browser that has FontFace/document.fonts (jsdom in tests has neither) —
// text still renders with the browser's fallback font in that case, same
// "never throw, just degrade" convention loadImageSize/svgNaturalSize
// (Toolbar.tsx) already use.
export async function loadGoogleFont(family: string, weight = 400): Promise<void> {
  const key = `${family}:${weight}`;
  if (loaded.has(key)) return;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return;

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const cssResponse = await fetch(cssUrl);
  const css = await cssResponse.text();
  const match = css.match(/url\((https:\/\/[^)]+)\)/);
  if (!match) return;

  const fontFace = new FontFace(family, `url(${match[1]})`, { weight: String(weight) });
  await fontFace.load();
  document.fonts.add(fontFace);
  loaded.add(key);
}
