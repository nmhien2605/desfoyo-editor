import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Application, Container } from 'pixi.js';
import { createEditorStore, type EditorStoreApi } from '../core/store';
import { DocumentSchema, type Document } from '../schema';
import { EditorStoreProvider, CanvasProvider, type CanvasContextValue } from './EditorContext';
import { CanvasHost } from './CanvasHost';
import { SelectionOverlay } from './SelectionOverlay';
import { Toolbar } from './Toolbar';
import { LayersPanel } from './LayersPanel';
import { loadDefaultFonts } from '../services/fontService';
import { exportPng } from '../services/exportService';

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
          selectedNodeId: null,
          lastCommand: null,
        });
      },
      export: async (format) => {
        if (format !== 'png') throw new Error(`Unsupported export format: ${format}`);
        const { app, pageContainer } = canvasValueRef.current;
        if (!app || !pageContainer) throw new Error('Editor is not mounted yet');
        return exportPng(app, pageContainer);
      },
      // Stubs — history/undo lands in Phase 2. Method shape exists now so
      // the public API doesn't change when it's filled in.
      undo: () => {},
      redo: () => {},
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
            </div>
            <LayersPanel />
          </div>
        </div>
      </CanvasProvider>
    </EditorStoreProvider>
  );
});
