import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type DragEvent } from 'react';
import type { Application, Container } from 'pixi.js';
import { activePage, createEditorStore, type EditorStoreApi } from '../core/store';
import { DocumentSchema, type Document } from '../schema';
import { EditorStoreProvider, CanvasProvider, type CanvasContextValue } from './EditorContext';
import { EditorUIProvider, type DevMenuConfig } from './EditorUIContext';
import { CanvasHost } from './CanvasHost';
import { SelectionOverlay } from './SelectionOverlay';
import { FloatingContextToolbar } from './FloatingContextToolbar';
import { LeftSidebar } from './LeftSidebar';
import { Workspace } from './Workspace';
import { InspectorPanel } from './InspectorPanel';
import { defaultImageNode, defaultSvgNode, loadImageSize, svgNaturalSize } from './toolActions';
import { ASSET_DRAG_TYPE } from './AssetPanel';
import { decodeSvgText } from '../render/renderers/svgRenderer';
import { createViewport } from '../render/viewport';
import type { SceneReconciler } from '../render/SceneReconciler';
import { exportPng, exportSvg } from '../services/exportService';
import { attachShortcuts } from '../services/shortcuts';

function toSizeTuple(size: { width: number; height: number }): [number, number] {
  return [size.width, size.height];
}

export interface EditorHandle {
  getDocument(): Document;
  loadDocument(doc: Document): void;
  export(format: 'png' | 'svg'): Promise<Blob>;
  undo(): void;
  redo(): void;
}

export interface EditorProps {
  document: Document;
  onChange?: (doc: Document) => void;
  className?: string;
  devMenu?: DevMenuConfig;
  onExport?: (format: 'png' | 'svg') => void;
  initialSelectedNodeIds?: string[];
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(props, ref) {
  const [store] = useState<EditorStoreApi>(() => {
    const parsed = DocumentSchema.parse(props.document);
    const api = createEditorStore(parsed);
    if (props.initialSelectedNodeIds?.length) {
      api.getState().select(props.initialSelectedNodeIds[0], 'replace');
      for (const id of props.initialSelectedNodeIds.slice(1)) {
        api.getState().select(id, 'toggle');
      }
    }
    return api;
  });
  const canvasValueRef = useRef<CanvasContextValue>({ app: null, pageContainer: null, canvas: null });
  const [canvasValue, setCanvasValue] = useState<CanvasContextValue>(canvasValueRef.current);
  const reconcilerRef = useRef<SceneReconciler | null>(null);

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
        const { app, pageContainer } = canvasValueRef.current;
        if (!app || !pageContainer) throw new Error('Editor is not mounted yet');
        if (format === 'png') return exportPng(app, pageContainer);

        const reconciler = reconcilerRef.current;
        if (!reconciler) throw new Error('Editor is not mounted yet');
        const state = store.getState();
        const doc = state.document;
        const page = activePage(state) ?? doc.pages[0];
        const svg = await exportSvg(app, page, doc, reconciler);
        return new Blob([svg], { type: 'image/svg+xml' });
      },
      undo: () => store.getState().undo(),
      redo: () => store.getState().redo(),
    }),
    [store],
  );

  const handleAssetDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const assetId = e.dataTransfer.getData(ASSET_DRAG_TYPE);
    const { canvas } = canvasValueRef.current;
    const asset = store.getState().document.assets[assetId];
    if (!assetId || !canvas || !asset || (asset.type !== 'image' && asset.type !== 'svg')) return;

    const world = createViewport(canvas, () => store.getState().camera).toWorld({ x: e.clientX, y: e.clientY });
    const node =
      asset.type === 'svg'
        ? defaultSvgNode(assetId, ...toSizeTuple(svgNaturalSize(await decodeSvgText(asset.dataUri))))
        : defaultImageNode(assetId, ...toSizeTuple(await loadImageSize(asset.dataUri)));
    node.transform.x = world.x;
    node.transform.y = world.y;
    store.getState().dispatch({ type: 'AddNode', pageId: store.getState().activePageId, node });
    store.getState().select(node.id);
  };

  return (
    <EditorStoreProvider value={store}>
      <EditorUIProvider devMenu={props.devMenu ?? null} onExport={props.onExport ?? null}>
        <CanvasProvider value={canvasValue}>
          <div
            className={`grid h-screen overflow-hidden ${props.className ?? ''}`}
            style={{ gridTemplateColumns: '44px minmax(0, 1fr) 250px', background: 'var(--app-bg)' }}
          >
            <LeftSidebar />
            <Workspace>
              <div
                className="relative select-none"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => void handleAssetDrop(e)}
              >
                <CanvasHost
                  reconcilerRef={reconcilerRef}
                  onReady={(app: Application, pageContainer: Container) => {
                    const value = { app, pageContainer, canvas: app.canvas as HTMLCanvasElement };
                    canvasValueRef.current = value;
                    setCanvasValue(value);
                  }}
                />
                <SelectionOverlay />
                <FloatingContextToolbar />
              </div>
            </Workspace>
            <InspectorPanel />
          </div>
        </CanvasProvider>
      </EditorUIProvider>
    </EditorStoreProvider>
  );
});
