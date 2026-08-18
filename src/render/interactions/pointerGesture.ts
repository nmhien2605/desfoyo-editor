import type { EditorStoreApi } from '../../core/store';

// Rut ra tu 5 cho lap y het cau truc nay: SelectionOverlay.tsx (resize,
// rotate don, crop drag, rotate multi-select), WarpHandlesOverlay.tsx
// (keo handle warp). Dang tren window (khong phai object) vi drag phai
// tiep tuc theo con tro ke ca khi ra khoi bounds cua handle dang keo.
export function startPointerGesture(
  store: EditorStoreApi,
  gestureId: string,
  onMove: (event: PointerEvent) => void,
): void {
  store.getState().beginGesture(gestureId);
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    store.getState().endGesture();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}
