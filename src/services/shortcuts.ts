import type { EditorStoreApi } from '../core/store';
import { deleteSelection, groupSelection, ungroupSelection, selectAll, nudgeSelection } from '../core/actions';
import { duplicateSelection, copySelection, cutSelection, pasteClipboard } from './clipboard';

const NUDGE = 1;
const NUDGE_LARGE = 10;
const ZOOM_FACTOR = 1.2;

type ShortcutHandler = (store: EditorStoreApi) => void;

// Flat lookup table, no dependency — 15 entries doesn't justify a library.
// 'mod' = metaKey (Mac) or ctrlKey (Windows/Linux).
const SHORTCUTS: Record<string, ShortcutHandler> = {
  'mod+z': (store) => store.getState().undo(),
  'mod+shift+z': (store) => store.getState().redo(),
  'mod+y': (store) => store.getState().redo(),
  'mod+d': (store) => duplicateSelection(store),
  'mod+c': (store) => copySelection(store),
  'mod+x': (store) => cutSelection(store),
  'mod+v': (store) => pasteClipboard(store),
  delete: (store) => deleteSelection(store),
  backspace: (store) => deleteSelection(store),
  'mod+a': (store) => selectAll(store),
  'mod+g': (store) => groupSelection(store),
  'mod+shift+g': (store) => ungroupSelection(store),
  arrowup: (store) => nudgeSelection(store, 0, -NUDGE),
  arrowdown: (store) => nudgeSelection(store, 0, NUDGE),
  arrowleft: (store) => nudgeSelection(store, -NUDGE, 0),
  arrowright: (store) => nudgeSelection(store, NUDGE, 0),
  'shift+arrowup': (store) => nudgeSelection(store, 0, -NUDGE_LARGE),
  'shift+arrowdown': (store) => nudgeSelection(store, 0, NUDGE_LARGE),
  'shift+arrowleft': (store) => nudgeSelection(store, -NUDGE_LARGE, 0),
  'shift+arrowright': (store) => nudgeSelection(store, NUDGE_LARGE, 0),
  // ponytail: not cursor-anchored like wheel-zoom (that needs canvas size,
  // which this store-only handler doesn't have) — just scales the current
  // view. Add cursor-anchoring later if it's actually requested.
  'mod+=': (store) => zoomBy(store, ZOOM_FACTOR),
  'mod++': (store) => zoomBy(store, ZOOM_FACTOR),
  'mod+-': (store) => zoomBy(store, 1 / ZOOM_FACTOR),
};

function zoomBy(store: EditorStoreApi, factor: number): void {
  const { camera } = store.getState();
  store.getState().setCamera({ zoom: camera.zoom * factor });
}

function isTypingInField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

function normalizeCombo(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push('mod');
  if (event.shiftKey) parts.push('shift');
  if (event.altKey) parts.push('alt');
  parts.push(event.key.toLowerCase());
  return parts.join('+');
}

// Decoupled from any component — attached once from Editor.tsx's effect.
// `enabled`: undefined keeps every built-in shortcut (default), false detaches
// none at all, string[] whitelists which keys stay active — lets a host app
// that binds its own keyboard shortcuts avoid colliding with these.
export function attachShortcuts(store: EditorStoreApi, enabled?: false | string[]): () => void {
  if (enabled === false) return () => {};
  const allowed = enabled ? new Set(enabled) : null;
  const handler = (event: KeyboardEvent) => {
    if (isTypingInField(event.target)) return;
    const combo = normalizeCombo(event);
    if (allowed && !allowed.has(combo)) return;
    const handlerFn = SHORTCUTS[combo];
    if (handlerFn) {
      event.preventDefault();
      handlerFn(store);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
