import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type DragEvent } from 'react';
import type { Application, Container } from 'pixi.js';
import { activePage, createEditorStore, setsEqual, type EditorStoreApi, type HistoryAction } from '../core/store';
import { AssetRefSchema, DocumentSchema, type AssetRef, type Document, type Node, type Transform } from '../schema';
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
import { deleteSelection, groupSelection, ungroupSelection, replaceSelection } from '../core/actions';
import { duplicateSelection, copySelection, cutSelection, pasteClipboard } from '../services/clipboard';

function toSizeTuple(size: { width: number; height: number }): [number, number] {
  return [size.width, size.height];
}

export interface EditorHandle {
  getDocument(): Document;
  loadDocument(doc: Document): void;
  export(format: 'png' | 'svg', scale?: number): Promise<Blob>;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  /** Adds or overwrites an asset. Not undoable (undoing the AddNode that uses it keeps the asset, so redo works). */
  addAsset(assetId: string, asset: AssetRef): void;
  addNode(node: Node, opts?: { pageId?: string; parentId?: string | null; index?: number }): void;
  removeNode(nodeId: string, opts?: { pageId?: string; parentId?: string | null }): void;
  updateNodeProps(nodeId: string, patch: Partial<Node>, opts?: { pageId?: string }): void;
  updateNodeTransform(nodeId: string, patch: Partial<Transform>, opts?: { pageId?: string }): void;
  reorderNode(nodeId: string, to: 'up' | 'down' | 'top' | 'bottom', opts?: { pageId?: string; parentId?: string | null }): void;
  /** Replaces the current selection; an empty array clears it. */
  selectNode(nodeIds: string[]): void;
  groupSelection(): void;
  ungroupSelection(): void;
  deleteSelection(): void;
  duplicateSelection(): void;
  copySelection(): void;
  cutSelection(): void;
  pasteClipboard(): void;
}

export interface EditorProps {
  document: Document;
  onChange?: (doc: Document) => void;
  onSelectionChange?: (nodeIds: string[]) => void;
  className?: string;
  devMenu?: DevMenuConfig;
  onExport?: (format: 'png' | 'svg') => void;
  initialSelectedNodeIds?: string[];
  /** undefined keeps every built-in keyboard shortcut, false disables them all, a string[] whitelists which stay active. */
  shortcuts?: false | string[];
  /** Default true. false renders only the canvas + selection overlay (no sidebar, inspector, toolbars). */
  chrome?: boolean;
  /** When set, the canvas is page.size × viewScale CSS px and wheel zoom / pan / zoom shortcuts are disabled. Live-updatable. */
  viewScale?: number;
  /** Called on double-click of a selected node. When provided, the built-in behaviour (inline text edit, image crop) runs only if it returns true. */
  onNodeDoubleClick?: (nodeId: string, nodeType: Node['type']) => boolean | void;
  /** Fires after every history change: a new edit ('push'), undo, redo, or loadDocument ('reset'). */
  onHistoryChange?: (history: HistoryState) => void;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  pastLength: number;
  reason: HistoryAction;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(props, ref) {
  const [store] = useState<EditorStoreApi>(() => {
    const parsed = DocumentSchema.parse(props.document);
    const api = createEditorStore(parsed);
    // Seeded here, not only in the effect below: CanvasHost sizes its canvas
    // in its own (earlier-running) mount effect.
    if (props.viewScale != null) api.getState().setViewScale(props.viewScale);
    if (props.initialSelectedNodeIds?.length) {
      replaceSelection(api, props.initialSelectedNodeIds);
    }
    return api;
  });
  const canvasValueRef = useRef<CanvasContextValue>({ app: null, pageContainer: null, canvas: null });
  const [canvasValue, setCanvasValue] = useState<CanvasContextValue>(canvasValueRef.current);
  const reconcilerRef = useRef<SceneReconciler | null>(null);

  // Callbacks are read from this ref at call time, so the host always gets its
  // latest closure, including callbacks first passed on a later render.
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => attachShortcuts(store, props.shortcuts), [store, props.shortcuts]);

  useEffect(() => {
    store.getState().setViewScale(props.viewScale ?? null);
  }, [store, props.viewScale]);

  useEffect(
    () =>
      store.subscribe((state, prev) => {
        const { onChange, onSelectionChange, onHistoryChange } = propsRef.current;
        if (state.document !== prev.document) onChange?.(state.document);
        // store.dispatch() always rebuilds `selectedNodeIds` as a fresh Set
        // (see core/store.ts) even when it's unmodified — so reference
        // inequality alone would fire on every document edit, not just real
        // selection changes. Content comparison is required.
        if (!setsEqual(state.selectedNodeIds, prev.selectedNodeIds)) {
          onSelectionChange?.(Array.from(state.selectedNodeIds));
        }
        if ((state.past !== prev.past || state.future !== prev.future) && state.lastHistoryAction) {
          onHistoryChange?.({
            canUndo: state.past.length > 0,
            canRedo: state.future.length > 0,
            pastLength: state.past.length,
            reason: state.lastHistoryAction,
          });
        }
      }),
    [store],
  );

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
          lastHistoryAction: 'reset',
        });
      },
      export: async (format, scale = 1) => {
        const { app, pageContainer } = canvasValueRef.current;
        if (!app || !pageContainer) throw new Error('Editor is not mounted yet');
        const state = store.getState();
        const doc = state.document;
        const page = activePage(state) ?? doc.pages[0];
        if (format === 'png') return exportPng(app, pageContainer, page.size, scale);

        const reconciler = reconcilerRef.current;
        if (!reconciler) throw new Error('Editor is not mounted yet');
        const svg = await exportSvg(app, page, doc, reconciler);
        return new Blob([svg], { type: 'image/svg+xml' });
      },
      undo: () => store.getState().undo(),
      redo: () => store.getState().redo(),
      canUndo: () => store.getState().past.length > 0,
      canRedo: () => store.getState().future.length > 0,
      addAsset: (assetId, asset) => store.getState().addAssetRef(assetId, AssetRefSchema.parse(asset)),
      addNode: (node, opts) =>
        store.getState().dispatch({
          type: 'AddNode',
          pageId: opts?.pageId ?? store.getState().activePageId,
          node,
          parentId: opts?.parentId,
          index: opts?.index,
        }),
      removeNode: (nodeId, opts) =>
        store.getState().dispatch({
          type: 'RemoveNode',
          pageId: opts?.pageId ?? store.getState().activePageId,
          nodeId,
          parentId: opts?.parentId,
        }),
      updateNodeProps: (nodeId, patch, opts) =>
        store.getState().dispatch({
          type: 'UpdateProps',
          pageId: opts?.pageId ?? store.getState().activePageId,
          nodeId,
          patch,
        }),
      updateNodeTransform: (nodeId, patch, opts) =>
        store.getState().dispatch({
          type: 'UpdateTransform',
          pageId: opts?.pageId ?? store.getState().activePageId,
          nodeId,
          patch,
        }),
      reorderNode: (nodeId, to, opts) =>
        store.getState().dispatch({
          type: 'Reorder',
          pageId: opts?.pageId ?? store.getState().activePageId,
          nodeId,
          to,
          parentId: opts?.parentId,
        }),
      selectNode: (nodeIds) => replaceSelection(store, nodeIds),
      groupSelection: () => groupSelection(store),
      ungroupSelection: () => ungroupSelection(store),
      deleteSelection: () => deleteSelection(store),
      duplicateSelection: () => duplicateSelection(store),
      copySelection: () => copySelection(store),
      cutSelection: () => cutSelection(store),
      pasteClipboard: () => pasteClipboard(store),
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

  const chrome = props.chrome !== false;
  const canvasArea = (
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
      {chrome && <FloatingContextToolbar />}
    </div>
  );

  return (
    <EditorStoreProvider value={store}>
      <EditorUIProvider
        devMenu={props.devMenu ?? null}
        onExport={props.onExport ?? null}
        onNodeDoubleClick={props.onNodeDoubleClick ?? null}
      >
        <CanvasProvider value={canvasValue}>
          {chrome ? (
            <div
              className={`df-editor grid h-full w-full overflow-hidden ${props.className ?? ''}`}
              style={{ gridTemplateColumns: '44px minmax(0, 1fr) 250px', background: 'var(--app-bg)' }}
            >
              <LeftSidebar />
              <Workspace>{canvasArea}</Workspace>
              <InspectorPanel />
            </div>
          ) : (
            <div className={`df-editor relative inline-block align-top ${props.className ?? ''}`}>{canvasArea}</div>
          )}
        </CanvasProvider>
      </EditorUIProvider>
    </EditorStoreProvider>
  );
});
