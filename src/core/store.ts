import { create } from 'zustand';
import { applyPatches, enablePatches, produceWithPatches, type Patch } from 'immer';
import type { Command } from './commands';
import { requireNodeInPage, findNodeInTree } from './tree';
import type { Document, GroupNode, Node, Page, Transform } from '../schema';
import { composeTransform, decomposeTransform } from '../render/applyTransform';
import { computeSelectionBounds } from '../render/interactions/groupTransformMath';
import type { Camera } from '../render/viewport';
import type { Rect } from '../render/interactions/marquee';
import type { SnapGuide } from '../render/interactions/snapping';

enablePatches();

export interface DragState {
  nodeId: string;
  startPointer: { x: number; y: number };
  startTransform: Transform;
}

export interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
}

const MAX_HISTORY = 100;
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;

export interface EditorStore {
  // documentSlice — mutated only via dispatch(). lastCommand is stamped
  // alongside every mutation so the SceneReconciler can do a single
  // targeted update instead of diffing the whole document. See CONTEXT.md
  // "Command". Setting lastCommand to null (undo/redo) signals CanvasHost
  // to do a full rebuild instead of a targeted apply().
  document: Document;
  lastCommand: Command | null;
  dispatch: (cmd: Command) => void;
  addAsset: (assetId: string, dataUri: string) => void;

  // History — patch-based via Immer, not command apply/invert (the store
  // already runs every mutation through Immer, so this reuses that instead
  // of retrofitting inverses onto every Command variant).
  past: HistoryEntry[];
  future: HistoryEntry[];
  undo: () => void;
  redo: () => void;

  // Gesture coalescing: a continuous drag/resize/rotate calls
  // beginGesture() once, dispatch() repeatedly (live document updates, no
  // history entries pushed), then endGesture() once to commit exactly one
  // history entry for the whole gesture.
  activeGestureId: string | null;
  gestureStartDocument: Document | null;
  beginGesture: (gestureId: string) => void;
  endGesture: () => void;

  // uiSlice — ephemeral, never persisted as part of the document.
  selectedNodeIds: Set<string>;
  activePageId: string;
  dragState: DragState | null;
  camera: Camera;
  // World-space marquee (rubber-band select) rect, live while dragging on
  // empty canvas; null otherwise. See src/render/interactions/marquee.ts.
  marqueeRect: Rect | null;
  // World-space snap guide lines, live only during a drag gesture. See
  // src/render/interactions/snapping.ts.
  activeGuides: SnapGuide[];
  // Visual grid + snap-to-grid toggle — ephemeral view state, never part of
  // the document (like camera). Bounded to the page's own size, not an
  // infinite viewport-relative grid — this is a bounded design canvas.
  grid: GridSettings;
  select: (nodeId: string | null, mode?: 'replace' | 'toggle') => void;
  setActivePage: (pageId: string) => void;
  setDragState: (state: DragState | null) => void;
  setCamera: (partial: Partial<Camera>) => void;
  setMarqueeRect: (rect: Rect | null) => void;
  setActiveGuides: (guides: SnapGuide[]) => void;
  setGrid: (partial: Partial<GridSettings>) => void;
}

export interface GridSettings {
  enabled: boolean;
  size: number;
  snap: boolean;
}

function findPageIndex(document: Document, pageId: string): number {
  const index = document.pages.findIndex((p) => p.id === pageId);
  if (index === -1) throw new Error(`Unknown pageId: ${pageId}`);
  return index;
}

// Which array a node lives in: page.children, or (if parentId names a
// GroupNode) that group's children. Only needed for AddNode, since the
// node doesn't exist yet for a tree lookup to find.
function containerFor(page: Page, parentId: string | null | undefined): Node[] {
  if (!parentId) return page.children;
  const location = findNodeInTree(page.children, parentId);
  if (!location || location.node.type !== 'group') {
    throw new Error(`Unknown group parentId: ${parentId}`);
  }
  return (location.node as GroupNode).children;
}

function reorderIndex(children: Node[], index: number, to: 'up' | 'down' | 'top' | 'bottom'): number {
  switch (to) {
    case 'up':
      return Math.min(index + 1, children.length);
    case 'down':
      return Math.max(index - 1, 0);
    case 'top':
      return children.length;
    case 'bottom':
      return 0;
  }
}

function mutateDocument(draft: Document, cmd: Command): void {
  const page = draft.pages[findPageIndex(draft, cmd.pageId)];

  switch (cmd.type) {
    case 'AddNode': {
      const container = containerFor(page, cmd.parentId);
      const index = cmd.index ?? container.length;
      container.splice(index, 0, cmd.node);
      break;
    }
    case 'RemoveNode': {
      const location = requireNodeInPage(page, cmd.nodeId);
      location.parent.splice(location.index, 1);
      break;
    }
    case 'UpdateProps': {
      const location = requireNodeInPage(page, cmd.nodeId);
      Object.assign(location.node, cmd.patch);
      break;
    }
    case 'UpdateTransform': {
      const location = requireNodeInPage(page, cmd.nodeId);
      Object.assign(location.node.transform, cmd.patch);
      break;
    }
    case 'Reorder': {
      const location = requireNodeInPage(page, cmd.nodeId);
      const [node] = location.parent.splice(location.index, 1);
      const to = reorderIndex(location.parent, location.index, cmd.to);
      location.parent.splice(to, 0, node);
      break;
    }
    case 'GroupNodes': {
      const locations = cmd.nodeIds.map((id) => requireNodeInPage(page, id));
      const parent = locations[0].parent;
      if (!locations.every((l) => l.parent === parent)) break; // cross-container grouping unsupported, no-op

      const bounds = computeSelectionBounds(locations.map((l) => l.node));
      const groupTransform: Transform = {
        x: bounds.pivot.x,
        y: bounds.pivot.y,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        originX: 0.5,
        originY: 0.5,
      };
      const groupSize = { width: bounds.max.x - bounds.min.x, height: bounds.max.y - bounds.min.y };

      const sorted = [...locations].sort((a, b) => a.index - b.index);
      const children: Node[] = sorted.map((loc) => ({
        ...loc.node,
        transform: decomposeTransform(groupTransform, groupSize, loc.node.transform, loc.node.size),
      }));

      const topmostIndex = sorted[sorted.length - 1].index;
      const indicesDesc = sorted.map((l) => l.index).sort((a, b) => b - a);
      for (const idx of indicesDesc) parent.splice(idx, 1);
      const removedBeforeTopmost = indicesDesc.filter((idx) => idx < topmostIndex).length;
      const insertIndex = topmostIndex - removedBeforeTopmost;

      const groupNode: GroupNode = {
        id: cmd.groupId,
        type: 'group',
        transform: groupTransform,
        size: groupSize,
        opacity: 1,
        visible: true,
        locked: false,
        children,
      };
      parent.splice(insertIndex, 0, groupNode);
      break;
    }
    case 'UngroupNode': {
      const location = requireNodeInPage(page, cmd.groupId);
      if (location.node.type !== 'group') break;
      const group = location.node;
      const worldChildren: Node[] = group.children.map((child) => ({
        ...child,
        transform: composeTransform(group.transform, group.size, child.transform, child.size),
      }));
      location.parent.splice(location.index, 1, ...worldChildren);
      break;
    }
  }
}

function pushHistory(past: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const next = [...past, entry];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function createEditorStore(initialDocument: Document) {
  return create<EditorStore>()((set, get) => ({
    document: initialDocument,
    lastCommand: null,
    dispatch: (cmd) => {
      const state = get();
      const [nextDocument, patches, inversePatches] = produceWithPatches(state.document, (draft) => {
        mutateDocument(draft, cmd);
      });

      set((s) => {
        const selectedNodeIds = new Set(s.selectedNodeIds);
        if (cmd.type === 'RemoveNode') selectedNodeIds.delete(cmd.nodeId);
        if (cmd.type === 'UngroupNode') selectedNodeIds.delete(cmd.groupId);

        if (s.activeGestureId) {
          return { document: nextDocument, lastCommand: cmd, selectedNodeIds };
        }
        return {
          document: nextDocument,
          lastCommand: cmd,
          selectedNodeIds,
          past: pushHistory(s.past, { patches, inversePatches }),
          future: [],
        };
      });
    },
    addAsset: (assetId, dataUri) =>
      set((s) => ({
        document: { ...s.document, assets: { ...s.document.assets, [assetId]: { type: 'image', dataUri } } },
      })),

    past: [],
    future: [],
    undo: () =>
      set((s) => {
        if (s.past.length === 0) return {};
        const entry = s.past[s.past.length - 1];
        return {
          document: applyPatches(s.document, entry.inversePatches),
          lastCommand: null,
          past: s.past.slice(0, -1),
          future: [...s.future, entry],
        };
      }),
    redo: () =>
      set((s) => {
        if (s.future.length === 0) return {};
        const entry = s.future[s.future.length - 1];
        return {
          document: applyPatches(s.document, entry.patches),
          lastCommand: null,
          past: [...s.past, entry],
          future: s.future.slice(0, -1),
        };
      }),

    activeGestureId: null,
    gestureStartDocument: null,
    beginGesture: (gestureId) =>
      set((s) => (s.activeGestureId ? {} : { activeGestureId: gestureId, gestureStartDocument: s.document })),
    endGesture: () =>
      set((s) => {
        if (!s.activeGestureId || !s.gestureStartDocument) return {};
        if (s.gestureStartDocument === s.document) {
          return { activeGestureId: null, gestureStartDocument: null };
        }
        const startDocument = s.gestureStartDocument;
        const endDocument = s.document;
        const [, patches, inversePatches] = produceWithPatches(startDocument, () => endDocument);
        return {
          activeGestureId: null,
          gestureStartDocument: null,
          past: pushHistory(s.past, { patches, inversePatches }),
          future: [],
        };
      }),

    selectedNodeIds: new Set(),
    activePageId: initialDocument.pages[0]?.id ?? '',
    dragState: null,
    camera: { zoom: 1, panX: 0, panY: 0 },
    marqueeRect: null,
    activeGuides: [],
    grid: { enabled: false, size: 20, snap: false },
    setMarqueeRect: (marqueeRect) => set({ marqueeRect }),
    setActiveGuides: (activeGuides) => set({ activeGuides }),
    setGrid: (partial) => set((s) => ({ grid: { ...s.grid, ...partial } })),
    select: (nodeId, mode = 'replace') =>
      set((s) => {
        if (nodeId === null) return { selectedNodeIds: new Set<string>() };
        const next = new Set(s.selectedNodeIds);
        if (mode === 'toggle') {
          if (next.has(nodeId)) next.delete(nodeId);
          else next.add(nodeId);
        } else {
          next.clear();
          next.add(nodeId);
        }
        return { selectedNodeIds: next };
      }),
    setActivePage: (pageId) => set({ activePageId: pageId }),
    setDragState: (dragState) => set({ dragState }),
    setCamera: (partial) =>
      set((s) => ({
        camera: {
          ...s.camera,
          ...partial,
          ...(partial.zoom !== undefined ? { zoom: clampZoom(partial.zoom) } : {}),
        },
      })),
  }));
}

export type EditorStoreApi = ReturnType<typeof createEditorStore>;
