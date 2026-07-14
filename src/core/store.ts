import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Command } from './commands';
import type { Document, Node, Transform } from '../schema';

export interface DragState {
  nodeId: string;
  startPointer: { x: number; y: number };
  startTransform: Transform;
}

export interface EditorStore {
  // documentSlice — mutated only via dispatch(). lastCommand is stamped
  // alongside every mutation in the same set() call; the SceneReconciler
  // subscribes to it to do a single targeted update instead of diffing the
  // whole document. See CONTEXT.md "Command".
  document: Document;
  lastCommand: Command | null;
  dispatch: (cmd: Command) => void;
  // Asset registration isn't node CRUD/transform, so it isn't a Command —
  // Phase 1 has no undo yet, so this doesn't need to be undo-tracked.
  // Revisit if Phase 2 wants asset changes in history too.
  addAsset: (assetId: string, dataUri: string) => void;

  // uiSlice — ephemeral, never persisted as part of the document.
  selectedNodeId: string | null;
  activePageId: string;
  dragState: DragState | null;
  select: (nodeId: string | null) => void;
  setActivePage: (pageId: string) => void;
  setDragState: (state: DragState | null) => void;
}

function findPageIndex(document: Document, pageId: string): number {
  const index = document.pages.findIndex((p) => p.id === pageId);
  if (index === -1) throw new Error(`Unknown pageId: ${pageId}`);
  return index;
}

function findNodeIndex(children: Node[], nodeId: string): number {
  const index = children.findIndex((n) => n.id === nodeId);
  if (index === -1) throw new Error(`Unknown nodeId: ${nodeId}`);
  return index;
}

export function createEditorStore(initialDocument: Document) {
  return create<EditorStore>()(
    immer((set, get) => ({
      document: initialDocument,
      lastCommand: null,
      dispatch: (cmd) =>
        set((state) => {
          const page = state.document.pages[findPageIndex(state.document, cmd.pageId)];

          switch (cmd.type) {
            case 'AddNode': {
              const index = cmd.index ?? page.children.length;
              page.children.splice(index, 0, cmd.node);
              break;
            }
            case 'RemoveNode': {
              const nodeIndex = findNodeIndex(page.children, cmd.nodeId);
              page.children.splice(nodeIndex, 1);
              if (get().selectedNodeId === cmd.nodeId) state.selectedNodeId = null;
              break;
            }
            case 'UpdateProps': {
              const nodeIndex = findNodeIndex(page.children, cmd.nodeId);
              Object.assign(page.children[nodeIndex], cmd.patch);
              break;
            }
            case 'UpdateTransform': {
              const nodeIndex = findNodeIndex(page.children, cmd.nodeId);
              Object.assign(page.children[nodeIndex].transform, cmd.patch);
              break;
            }
            case 'Reorder': {
              const nodeIndex = findNodeIndex(page.children, cmd.nodeId);
              const [node] = page.children.splice(nodeIndex, 1);
              const to =
                cmd.to === 'up'
                  ? Math.min(nodeIndex + 1, page.children.length)
                  : cmd.to === 'down'
                    ? Math.max(nodeIndex - 1, 0)
                    : cmd.to === 'top'
                      ? page.children.length
                      : 0;
              page.children.splice(to, 0, node);
              break;
            }
          }

          state.lastCommand = cmd;
        }),
      addAsset: (assetId, dataUri) =>
        set((state) => {
          state.document.assets[assetId] = { type: 'image', dataUri };
        }),

      selectedNodeId: null,
      activePageId: initialDocument.pages[0]?.id ?? '',
      dragState: null,
      select: (nodeId) =>
        set((state) => {
          state.selectedNodeId = nodeId;
        }),
      setActivePage: (pageId) =>
        set((state) => {
          state.activePageId = pageId;
        }),
      setDragState: (dragState) =>
        set((state) => {
          state.dragState = dragState;
        }),
    })),
  );
}

export type EditorStoreApi = ReturnType<typeof createEditorStore>;
