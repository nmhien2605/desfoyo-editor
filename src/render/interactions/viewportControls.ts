import type { EditorStoreApi } from '../../core/store';
import { MIN_ZOOM, MAX_ZOOM } from '../../core/store';

function clamp(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

// Wheel-to-zoom, zoom toward the cursor: the world point under the cursor
// stays fixed on screen after zooming. Pan/zoom live in uiSlice.camera, not
// the document — camera changes never go through dispatch/history.
export function attachViewportControls(canvas: HTMLCanvasElement, store: EditorStoreApi): () => void {
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const { camera } = store.getState();
    const rect = canvas.getBoundingClientRect();
    const cursorScreen = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const newZoom = clamp(camera.zoom * Math.exp(-event.deltaY * 0.001));
    if (newZoom === camera.zoom) return;

    const ratio = newZoom / camera.zoom;
    const panX = cursorScreen.x - (cursorScreen.x - camera.panX) * ratio;
    const panY = cursorScreen.y - (cursorScreen.y - camera.panY) * ratio;
    store.getState().setCamera({ zoom: newZoom, panX, panY });
  };

  canvas.addEventListener('wheel', handleWheel, { passive: false });
  return () => canvas.removeEventListener('wheel', handleWheel);
}

// Fits the page to the canvas viewport size, centered.
export function fitToScreen(
  store: EditorStoreApi,
  canvasSize: { width: number; height: number },
  pageSize: { width: number; height: number },
): void {
  const zoom = clamp(
    Math.min(canvasSize.width / pageSize.width, canvasSize.height / pageSize.height) * 0.9,
  );
  const panX = (canvasSize.width - pageSize.width * zoom) / 2;
  const panY = (canvasSize.height - pageSize.height * zoom) / 2;
  store.getState().setCamera({ zoom, panX, panY });
}
