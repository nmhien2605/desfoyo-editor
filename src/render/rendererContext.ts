import type { Renderer } from 'pixi.js';

// Module-level singleton, not a threaded param: CanvasHost.tsx already
// documents the invariant "the only component allowed to touch
// PIXI.Application directly" — one app, one renderer, for the mount's
// lifetime. Only textRenderer.ts's warp path needs this (generateTexture()
// lives on Renderer); threading it through SceneReconciler's
// createDisplayObject/updateDisplayObject would touch all 4 renderers for
// one consumer. Unset in tests (jsdom never calls app.init()) — textRenderer
// falls back to flat (unwarped) text when getRenderer() is undefined, which
// is correct offline/test behavior, not a gap.
let activeRenderer: Renderer | undefined;

export function setRenderer(renderer: Renderer | undefined): void {
  activeRenderer = renderer;
}

export function getRenderer(): Renderer | undefined {
  return activeRenderer;
}
