import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { EditorStoreApi } from '../../core/store';
import { anchoredCamera, clampStageZoom } from '../stage';
import type { Camera, Point } from '../viewport';

const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 20;

export function resetStageView(store: EditorStoreApi): void {
  const { stageFit, setCamera } = store.getState();
  if (stageFit) setCamera(stageFit);
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

const midpoint = (a: Point, b: Point = a): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Stage-mode zoom/pan (EditorProps.stage). `area` is the canvas plus its DOM
// overlays, so gestures starting on the selection box count too. Pointer
// listeners sit on window in the capture phase: they run before Pixi (canvas
// pointerdown, document pointermove), the overlays' React handlers and
// startPointerGesture's window listeners, so they can keep events from them.
// Normal mode keeps attachViewportControls/attachPan; those skip stage mode.
export function attachStageGestures(area: HTMLElement, store: EditorStoreApi): () => void {
  let space = false;
  // Space is only swallowed over this editor: elsewhere it still scrolls the page / presses the focused button.
  let hover = false;
  let pan: { id: number; last: Point } | null = null;
  const touches = new Map<number, Point>();
  // Set from the 2nd touch until every finger lifts; meanwhile touch moves never reach the editor.
  let pinch: { camera: Camera; mid: Point; dist: number } | null = null;

  const local = (event: { clientX: number; clientY: number }): Point => {
    // Stage mode: the canvas fills `area`, so area-local = canvas-local.
    const rect = area.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  // A data attribute + !important rule (styles.css), since Pixi rewrites the canvas cursor on hover.
  const updateCursor = () => {
    if (pan || space) area.dataset.dfPan = pan ? 'grabbing' : 'grab';
    else delete area.dataset.dfPan;
  };
  const twoTouches = () => Array.from(touches.values()).slice(0, 2);
  const restartPinch = () => {
    const [a, b] = twoTouches();
    pinch = { camera: store.getState().camera, mid: midpoint(a, b), dist: b ? Math.hypot(b.x - a.x, b.y - a.y) : 0 };
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code !== 'Space' || isEditable(event.target)) return;
    if (hover) event.preventDefault();
    space = true;
    updateCursor();
  };
  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.code !== 'Space') return;
    space = false;
    updateCursor();
  };
  // A Space keyup lost to another window would otherwise leave left-drag stuck panning.
  const handleBlur = () => {
    space = false;
    updateCursor();
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!(event.target instanceof Node) || !area.contains(event.target)) return;
    if (event.pointerType === 'mouse') {
      if (event.button !== 1 && !(event.button === 0 && space)) return;
      // Pan only: no node drag, marquee or handle.
      event.preventDefault();
      event.stopImmediatePropagation();
      pan = { id: event.pointerId, last: { x: event.clientX, y: event.clientY } };
      updateCursor();
      return;
    }
    touches.set(event.pointerId, local(event));
    if (touches.size < 2) return; // one finger selects/drags as usual
    event.stopImmediatePropagation(); // the extra finger must not select or start its own drag
    if (!pinch) store.getState().cancelGesture();
    restartPinch();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (pan?.id === event.pointerId) {
      const { camera, setCamera } = store.getState();
      setCamera({ panX: camera.panX + event.clientX - pan.last.x, panY: camera.panY + event.clientY - pan.last.y });
      pan.last = { x: event.clientX, y: event.clientY };
      return;
    }
    if (!touches.has(event.pointerId)) return;
    touches.set(event.pointerId, local(event));
    if (!pinch) return;
    // Starves the cancelled drag/marquee/handle of moves until its pointerup tears it down.
    event.stopImmediatePropagation();
    const { stage, stageFit, setCamera } = store.getState();
    if (!stage || !stageFit) return;
    const [a, b] = twoTouches();
    // One finger left after a pinch: pan only.
    const ratio = b && pinch.dist > 0 ? Math.hypot(b.x - a.x, b.y - a.y) / pinch.dist : 1;
    const zoom = clampStageZoom(pinch.camera.zoom * ratio, stageFit.zoom, stage.maxZoom);
    setCamera(anchoredCamera(pinch.camera, pinch.mid, midpoint(a, b), zoom));
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (pan?.id === event.pointerId) {
      pan = null;
      updateCursor();
    }
    if (!touches.delete(event.pointerId) || !pinch) return;
    if (touches.size === 0) pinch = null;
    else restartPinch();
  };

  // ctrl/meta + wheel, which is also how trackpad pinch arrives. A plain wheel stays the page's.
  const handleWheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const { camera, stage, stageFit, setCamera } = store.getState();
    if (!stage || !stageFit) return;
    event.preventDefault();
    // Capped so one mouse-wheel notch (deltaY ~100) is a step, not a jump; trackpad deltas are small.
    const step = Math.min(25, Math.max(-25, event.deltaY)) * 0.01;
    const zoom = clampStageZoom(camera.zoom * Math.exp(-step), stageFit.zoom, stage.maxZoom);
    const cursor = local(event);
    setCamera(anchoredCamera(camera, cursor, cursor, zoom));
  };

  const capture = { capture: true };
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('pointerdown', handlePointerDown, capture);
  window.addEventListener('pointermove', handlePointerMove, capture);
  window.addEventListener('pointerup', handlePointerUp, capture);
  window.addEventListener('pointercancel', handlePointerUp, capture);
  area.addEventListener('wheel', handleWheel, { passive: false });
  const handleEnter = () => (hover = true);
  const handleLeave = () => (hover = false);
  area.addEventListener('pointerenter', handleEnter);
  area.addEventListener('pointerleave', handleLeave);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('pointerdown', handlePointerDown, capture);
    window.removeEventListener('pointermove', handlePointerMove, capture);
    window.removeEventListener('pointerup', handlePointerUp, capture);
    window.removeEventListener('pointercancel', handlePointerUp, capture);
    area.removeEventListener('wheel', handleWheel);
    area.removeEventListener('pointerenter', handleEnter);
    area.removeEventListener('pointerleave', handleLeave);
    delete area.dataset.dfPan;
  };
}

// Double-click / double-tap on empty canvas (Pixi target is the stage itself,
// as for the marquee) → back to fit. Node double-clicks never reach here:
// drag.ts stops their pointerdown.
export function attachDoubleTapReset(stage: Container, store: EditorStoreApi): void {
  let last: { time: number; x: number; y: number } | null = null;
  stage.on('pointerdown', (event: FederatedPointerEvent) => {
    if (event.target !== stage || !store.getState().stage) return;
    const near = last && Math.hypot(event.global.x - last.x, event.global.y - last.y) < DOUBLE_TAP_PX;
    if (last && near && event.timeStamp - last.time < DOUBLE_TAP_MS) {
      last = null;
      resetStageView(store);
      return;
    }
    last = { time: event.timeStamp, x: event.global.x, y: event.global.y };
  });
}
