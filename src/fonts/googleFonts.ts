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

// Loads a Google Font by injecting a <link rel="stylesheet"> to its public
// CSS2 endpoint (the same one Google's own embed snippet uses — no API key
// needed), then waiting on document.fonts.load. The browser's own CSS
// engine resolves which of the response's several per-script @font-face
// subsets (cyrillic, greek, vietnamese, latin, ...) applies to which
// codepoints via each block's unicode-range — a manual fetch+regex+FontFace
// build (the previous approach) can only ever grab one subset's URL, and it
// isn't necessarily the Latin one. No-ops outside a browser that has
// document.fonts (jsdom in tests has none) — text still renders with the
// browser's fallback font in that case, same "never throw, just degrade"
// convention loadImageSize/svgNaturalSize (Toolbar.tsx) already use.
export async function loadGoogleFont(family: string, weight = 400): Promise<void> {
  const key = `${family}:${weight}`;
  if (loaded.has(key)) return;
  if (typeof document === 'undefined' || !document.fonts) return;
  loaded.add(key);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  // document.fonts.load() only matches @font-face rules already registered
  // in the CSSOM — which only happens once this stylesheet's fetch completes
  // and is parsed. Wait for the link's own load/error event first; a failed
  // fetch resolves (not rejects) so it can't hang the caller, same
  // never-throw convention as the rest of this function.
  await new Promise<void>((resolve) => {
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });

  await document.fonts.load(`${weight} 16px "${family}"`);
}
