import type { ColorSource } from 'pixi.js';
import type { PageBackground } from '../schema';
import { fillToColor } from './fillToColor';

// Shared by CanvasHost (interactive mount) and headlessRender (off-screen
// rasterize) — both need the same Pixi Application `background` color from a
// Page's schema-level background.
export function backgroundColor(bg: PageBackground): ColorSource {
  // 'transparent' maps to an opaque colour + backgroundAlpha() = 0: handing
  // Pixi an alpha-0 colour makes it warn "transparent background on an opaque
  // canvas" (it applies the colour before backgroundAlpha during init).
  if (bg.type === 'color' && bg.value === 'transparent') return 0x000000;
  return bg.type === 'color' ? bg.value : fillToColor(bg.value);
}

// Pixi only allows a transparent clear if the Application was initialised
// with backgroundAlpha < 1, so callers init with 0 and then set
// renderer.background.alpha to this per page.
export function backgroundAlpha(bg: PageBackground): number {
  return bg.type === 'color' && bg.value === 'transparent' ? 0 : 1;
}
