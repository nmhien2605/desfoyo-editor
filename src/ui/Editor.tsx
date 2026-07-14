import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Application, Container } from 'pixi.js';
import { createEditorStore, type EditorStoreApi } from '../core/store';
import { DocumentSchema, type Document } from '../schema';
import { EditorStoreProvider, CanvasProvider, type CanvasContextValue } from './EditorContext';
import { CanvasHost } from './CanvasHost';
import { SelectionOverlay } from './SelectionOverlay';
import { Rulers } from './Rulers';
import { Toolbar } from './Toolbar';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { loadDefaultFonts } from '../services/fontService';
import { exportPng } from '../services/exportService';
import { attachShortcuts } from '../services/shortcuts';

export interface EditorHandle {
  getDocument(): Document;
  loadDocument(doc: Document): void;
  export(format: 'png'): Promise<Blob>;
  undo(): void;
  redo(): void;
}

export interface EditorProps {
  document: Document;
  onChange?: (doc: Document) => void;
  className?: string;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(props, ref) {
  const [store] = useState<EditorStoreApi>(() => createEditorStore(DocumentSchema.parse(props.document)));
  const canvasValueRef = useRef<CanvasContextValue>({ app: null, pageContainer: null, canvas: null });
  const [canvasValue, setCanvasValue] = useState<CanvasContextValue>(canvasValueRef.current);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    void loadDefaultFonts().then(() => setFontsReady(true));
  }, []);

  useEffect(() => attachShortcuts(store), [store]);

  useEffect(() => {
    if (!props.onChange) return;
    return store.subscribe((state, prev) => {
      if (state.document !== prev.document) props.onChange?.(state.document);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store is stable, onChange read via closure is acceptable for Phase 1
  }, [store]);

  useImperativeHandle(
    ref,
    () => ({
      getDocument: () => store.getState().document,
      loadDocument: (doc) => {
        const validated = DocumentSchema.parse(doc);
        store.setState({
          document: validated,
          activePageId: validated.pages[0]?.id ?? '',
          selectedNodeIds: new Set(),
          lastCommand: null,
          past: [],
          future: [],
        });
      },
      export: async (format) => {
        if (format !== 'png') throw new Error(`Unsupported export format: ${format}`);
        const { app, pageContainer } = canvasValueRef.current;
        if (!app || !pageContainer) throw new Error('Editor is not mounted yet');
        return exportPng(app, pageContainer);
      },
      undo: () => store.getState().undo(),
      redo: () => store.getState().redo(),
    }),
    [store],
  );

  if (!fontsReady) return null;

  return (
    <EditorStoreProvider value={store}>
      <CanvasProvider value={canvasValue}>
        <div className={props.className}>
          <Toolbar />
          <div className="flex">
            <div className="relative">
              <CanvasHost
                onReady={(app: Application, pageContainer: Container) => {
                  const value = { app, pageContainer, canvas: app.canvas as HTMLCanvasElement };
                  canvasValueRef.current = value;
                  setCanvasValue(value);
                }}
              />
              <SelectionOverlay />
              <Rulers />
            </div>
            <LayersPanel />
            <PropertiesPanel />
          </div>
        </div>
      </CanvasProvider>
    </EditorStoreProvider>
  );
});
