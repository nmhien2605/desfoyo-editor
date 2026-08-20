import { nanoid } from 'nanoid';
import type { Application } from 'pixi.js';
import type { EditorStoreApi } from '../core/store';
import { activePage } from '../core/store';
import {
  deleteSelection,
  groupSelection,
  ungroupSelection,
  isSingleGroupSelected,
  alignSelection,
  distributeSelection,
} from '../core/actions';
import { fitToScreen } from '../render/interactions/viewportControls';
import { decodeSvgText } from '../render/renderers/svgRenderer';
import { getLoadedFont, loadFont, registeredFamilies } from '../text/fontService';
import { measureText } from '../text/textGeometry';
import type { ImageNode, ShapeNode, SvgNode, TextNode, Transform } from '../schema';

const DEFAULT_TRANSFORM: Transform = { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 };

export function defaultShapeNode(): ShapeNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width: 150, height: 150 },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'shape',
    shape: 'rect',
    fill: { type: 'solid', color: '#3b82f6' },
  };
}

export function defaultImageNode(assetId: string, width: number, height: number): ImageNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width, height },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'image',
    assetId,
  };
}

export function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function loadImageSize(dataUri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 200, height: 200 });
    img.src = dataUri;
  });
}

export function defaultSvgNode(assetId: string, width: number, height: number): SvgNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width, height },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'svg',
    assetId,
  };
}

export function svgNaturalSize(svgText: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const root = doc.documentElement;
  const viewBox = root.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) return { width: parts[2], height: parts[3] };
  }
  const width = parseFloat(root.getAttribute('width') ?? '');
  const height = parseFloat(root.getAttribute('height') ?? '');
  if (width > 0 && height > 0) return { width, height };
  return { width: 200, height: 200 };
}

export function defaultTextNode(family: string, size: { width: number; height: number }): TextNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size,
    opacity: 1,
    visible: true,
    locked: false,
    type: 'text',
    text: 'Your text',
    font: { family, weight: 400, style: 'normal', size: 96 },
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    fill: { type: 'solid', color: '#111827' },
  };
}

export function createToolActions(store: EditorStoreApi, app: Application | null) {
  const addNode = (node: ShapeNode | ImageNode | SvgNode | TextNode) => {
    const activePageId = store.getState().activePageId;
    store.getState().dispatch({ type: 'AddNode', pageId: activePageId, node });
    store.getState().select(node.id);
  };

  const handleAddText = async () => {
    const family = registeredFamilies()[0];
    if (!family) return;
    const loaded = getLoadedFont(family) ?? (await loadFont(family));
    if (!loaded) return;
    const draft = defaultTextNode(family, { width: 1, height: 1 });
    addNode({ ...draft, size: measureText(draft, loaded.font) });
  };

  const handleImageFile = async (file: File) => {
    const dataUri = await readAsDataUri(file);
    const { width, height } = await loadImageSize(dataUri);
    const assetId = nanoid();
    store.getState().addAsset(assetId, dataUri);
    addNode(defaultImageNode(assetId, width, height));
  };

  const handleSvgFile = async (file: File) => {
    const dataUri = await readAsDataUri(file);
    const { width, height } = svgNaturalSize(await decodeSvgText(dataUri));
    const assetId = nanoid();
    store.getState().addSvgAsset(assetId, dataUri);
    addNode(defaultSvgNode(assetId, width, height));
  };

  const handleFitToScreen = () => {
    if (!app) return;
    const page = activePage(store.getState());
    if (!page) return;
    fitToScreen(store, { width: app.screen.width, height: app.screen.height }, page.size);
  };

  const zoomBy = (factor: number) => {
    const { camera } = store.getState();
    store.getState().setCamera({ zoom: camera.zoom * factor });
  };

  return {
    addNode,
    addShape: () => addNode(defaultShapeNode()),
    handleAddText,
    handleImageFile,
    handleSvgFile,
    handleFitToScreen,
    zoomBy,
    undo: () => store.getState().undo(),
    redo: () => store.getState().redo(),
    deleteSelection: () => deleteSelection(store),
    groupSelection: () => groupSelection(store),
    ungroupSelection: () => ungroupSelection(store),
    isSingleGroup: () => isSingleGroupSelected(store) !== null,
    alignSelection: (edge: Parameters<typeof alignSelection>[1]) => alignSelection(store, edge),
    distributeSelection: (axis: Parameters<typeof distributeSelection>[1]) => distributeSelection(store, axis),
    toggleGrid: () => {
      const grid = store.getState().grid;
      store.getState().setGrid({ enabled: !grid.enabled });
    },
    toggleSnap: () => {
      const grid = store.getState().grid;
      store.getState().setGrid({ snap: !grid.snap });
    },
  };
}

export type ToolActions = ReturnType<typeof createToolActions>;
