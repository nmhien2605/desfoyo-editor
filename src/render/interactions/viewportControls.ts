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
    // Host-fixed viewScale: leave the wheel to the page (scrolling), don't swallow it.
    if (store.getState().viewScale != null) return;
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

// Middle-mouse-drag always pans; left-mouse-drag pans only while Space is
// held (tracked locally — no store field needed, it's purely an input-mode
// toggle for this listener). panX/panY are applied to pageContainer.position
// independently of .scale in CanvasHost, so a screen-pixel pointer delta
// maps 1:1 onto them regardless of zoom.
export function attachPan(canvas: HTMLCanvasElement, store: EditorStoreApi): () => void {
  let spacePressed = false;
  let panning = false;
  let last = { x: 0, y: 0 };

  const updateCursor = () => {
    canvas.style.cursor = spacePressed || panning ? 'grab' : '';
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      spacePressed = true;
      updateCursor();
    }
  };
  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      spacePressed = false;
      updateCursor();
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 1 && !(event.button === 0 && spacePressed)) return;
    if (store.getState().viewScale != null) return;
    event.preventDefault();
    panning = true;
    last = { x: event.clientX, y: event.clientY };
    updateCursor();
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  const handlePointerMove = (event: PointerEvent) => {
    const delta = { x: event.clientX - last.x, y: event.clientY - last.y };
    last = { x: event.clientX, y: event.clientY };
    const { camera } = store.getState();
    store.getState().setCamera({ panX: camera.panX + delta.x, panY: camera.panY + delta.y });
  };
  const handlePointerUp = () => {
    panning = false;
    updateCursor();
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('pointerdown', handlePointerDown);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    canvas.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };
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
