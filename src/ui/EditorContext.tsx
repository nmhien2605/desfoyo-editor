import { createContext, useContext } from 'react';
import type { Application, Container } from 'pixi.js';
import type { EditorStoreApi } from '../core/store';

const EditorStoreContext = createContext<EditorStoreApi | null>(null);
export const EditorStoreProvider = EditorStoreContext.Provider;

export function useEditorStoreApi(): EditorStoreApi {
  const store = useContext(EditorStoreContext);
  if (!store) throw new Error('useEditorStoreApi must be used within <Editor>');
  return store;
}

// Thin selector hook — re-renders only when the selected slice changes.
export function useEditorStore<T>(selector: (state: ReturnType<EditorStoreApi['getState']>) => T): T {
  const store = useEditorStoreApi();
  return store(selector);
}

export interface CanvasContextValue {
  app: Application | null;
  pageContainer: Container | null;
  canvas: HTMLCanvasElement | null;
}

const CanvasContext = createContext<CanvasContextValue>({ app: null, pageContainer: null, canvas: null });
export const CanvasProvider = CanvasContext.Provider;

export function useCanvasContext(): CanvasContextValue {
  return useContext(CanvasContext);
}
