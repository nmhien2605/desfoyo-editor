import type { EditorStoreApi } from '../core/store';
import { deleteSelection, groupSelection, ungroupSelection, selectAll, nudgeSelection } from '../core/actions';
import { duplicateSelection, copySelection, cutSelection, pasteClipboard } from './clipboard';

const NUDGE = 1;
const NUDGE_LARGE = 10;

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
};

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
export function attachShortcuts(store: EditorStoreApi): () => void {
  const handler = (event: KeyboardEvent) => {
    if (isTypingInField(event.target)) return;
    const handlerFn = SHORTCUTS[normalizeCombo(event)];
    if (handlerFn) {
      event.preventDefault();
      handlerFn(store);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
