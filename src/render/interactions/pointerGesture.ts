import type { EditorStoreApi } from '../../core/store';

// Rut ra tu 5 cho lap y het cau truc nay: SelectionOverlay.tsx (resize,
// rotate don, crop drag, rotate multi-select), WarpHandlesOverlay.tsx
// (keo handle warp). Dang tren window (khong phai object) vi drag phai
// tiep tuc theo con tro ke ca khi ra khoi bounds cua handle dang keo.
// pointercancel (iOS scroll/system gesture) and window blur end it too, or
// the gesture stays open: listeners leak and history stays suspended.
// `pointerId` (the pointerdown's) ignores other fingers; omitted = any pointer.
export function startPointerGesture(
  store: EditorStoreApi,
  gestureId: string,
  onMove: (event: PointerEvent) => void,
  pointerId?: number,
): void {
  store.getState().beginGesture(gestureId);
  const mine = (event: Event) => pointerId === undefined || !(event instanceof PointerEvent) || event.pointerId === pointerId;
  const move = (event: PointerEvent) => {
    if (mine(event)) onMove(event);
  };
  const end = (event: Event) => {
    if (!mine(event)) return;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    window.removeEventListener('blur', end);
    store.getState().endGesture();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  window.addEventListener('blur', end);
}

// For gestures begun by an element's own pointerdown (range sliders): ends it
// on pointerup/pointercancel/blur, but never another gesture that started
// since (a handle pointerdown elsewhere blurs the slider).
export function endOwnGesture(store: EditorStoreApi, gestureId: string): void {
  if (store.getState().activeGestureId === gestureId) store.getState().endGesture();
}

// Pixi's EventSystem never listens for pointercancel, so stage-driven drags
// (drag.ts, marquee.ts) would wait forever for a pointerup after an iOS
// system gesture. Calls `cancel` once on that pointer's cancel or window
// blur; returns the detach to call from the normal pointerup path.
export function onPointerCancel(pointerId: number, cancel: () => void): () => void {
  const handle = (event: Event) => {
    if (event instanceof PointerEvent && event.pointerId !== pointerId) return;
    detach();
    cancel();
  };
  const detach = () => {
    window.removeEventListener('pointercancel', handle);
    window.removeEventListener('blur', handle);
  };
  window.addEventListener('pointercancel', handle);
  window.addEventListener('blur', handle);
  return detach;
}
