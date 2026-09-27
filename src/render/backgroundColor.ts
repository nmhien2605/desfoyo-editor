import type { ColorSource } from 'pixi.js';
import type { PageBackground } from '../schema';
import { fillToColor } from './fillToColor';

// Shared by CanvasHost (interactive mount) and headlessRender (off-screen
// rasterize) — both need the same Pixi Application `background` color from a
// Page's schema-level background.
export function backgroundColor(bg: PageBackground): ColorSource {
  return bg.type === 'color' ? bg.value : fillToColor(bg.value);
}
