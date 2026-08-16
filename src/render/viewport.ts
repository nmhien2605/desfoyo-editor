export interface Point {
  x: number;
  y: number;
}

export interface Camera {
  zoom: number;
  panX: number;
  panY: number;
}

// Phase 1 had no zoom/pan, so world space and canvas pixel space were
// identical. Phase 2 fills in the seam: `camera` (zoom scale + pan offset,
// applied to pageContainer.scale/.position in CanvasHost) means world space
// and canvas-local pixel space now differ by that transform.
//
// toWorld: native PointerEvent clientX/clientY (viewport-relative) -> world
// (document) coordinates — subtracts the canvas element's screen offset,
// then inverts the camera transform.
//
// toScreen: world coordinates -> canvas-local pixel coordinates. NOT
// viewport-relative — SelectionOverlay's DOM handles share the canvas
// element's exact top-left origin (no getBoundingClientRect offset needed
// there), so this only applies the camera's forward transform.
export function createViewport(canvas: HTMLCanvasElement, getCamera: () => Camera) {
  return {
    toWorld(screenPoint: Point): Point {
      const rect = canvas.getBoundingClientRect();
      const camera = getCamera();
      const canvasLocal = { x: screenPoint.x - rect.left, y: screenPoint.y - rect.top };
      return {
        x: (canvasLocal.x - camera.panX) / camera.zoom,
        y: (canvasLocal.y - camera.panY) / camera.zoom,
      };
    },
    toScreen(worldPoint: Point): Point {
      const camera = getCamera();
      return {
        x: worldPoint.x * camera.zoom + camera.panX,
        y: worldPoint.y * camera.zoom + camera.panY,
      };
    },
  };
}

export type Viewport = ReturnType<typeof createViewport>;
