export interface Point {
  x: number;
  y: number;
}

// Phase 1 has no zoom/pan (that's Phase 2), so world space and canvas pixel
// space are identical — only the canvas element's screen offset matters.
// Kept as its own module so call sites (SelectionOverlay's DOM handles,
// which get native PointerEvents with clientX/clientY, not Pixi's
// stage-relative event.global) don't need to change when zoom/pan lands.
export function createViewport(canvas: HTMLCanvasElement) {
  return {
    toWorld(screenPoint: Point): Point {
      const rect = canvas.getBoundingClientRect();
      return { x: screenPoint.x - rect.left, y: screenPoint.y - rect.top };
    },
    toScreen(worldPoint: Point): Point {
      const rect = canvas.getBoundingClientRect();
      return { x: worldPoint.x + rect.left, y: worldPoint.y + rect.top };
    },
  };
}

export type Viewport = ReturnType<typeof createViewport>;
