import type { Node, Page } from '../schema';
import type { Transform } from '../schema';

// Every document mutation goes through one of these. No direct model
// mutation path exists — the SceneReconciler relies on each command already
// knowing the exact nodeId(s) it affects to do targeted updates instead of
// diffing the whole tree. See CONTEXT.md "Command".
//
// parentId on AddNode/RemoveNode/Reorder: which container the node lives in
// — undefined/null means page.children directly, otherwise the id of the
// GroupNode whose `children` array owns it. Needed once nodes can nest
// (Phase 2's GroupNode) so the SceneReconciler knows which Pixi Container to
// mutate. UpdateProps/UpdateTransform don't need it — the reconciler's
// nodeId -> Container map is flat regardless of nesting depth.
export type Command =
  | { type: 'AddNode'; pageId: string; node: Node; parentId?: string | null; index?: number }
  | { type: 'RemoveNode'; pageId: string; nodeId: string; parentId?: string | null }
  | { type: 'UpdateProps'; pageId: string; nodeId: string; patch: Partial<Node> }
  | { type: 'UpdateTransform'; pageId: string; nodeId: string; patch: Partial<Transform> }
  | { type: 'Reorder'; pageId: string; nodeId: string; to: 'up' | 'down' | 'top' | 'bottom'; parentId?: string | null }
  | { type: 'GroupNodes'; pageId: string; nodeIds: string[]; groupId: string }
  | { type: 'UngroupNode'; pageId: string; groupId: string }
  // Document-level (paths aren't node props) — carries nodeId anyway, per
  // the convention above, so SceneReconciler knows which text node's mesh
  // to refresh (a document.paths change alone doesn't touch any node).
  | { type: 'UpdatePath'; pageId: string; nodeId: string; pathId: string; points: [number, number, number, number, number, number] }
  // Page-level (Phase 4 Pass A) — flat, no parentId concept at this level.
  // None of these need a SceneReconciler.apply() case: CanvasHost.tsx
  // remounts the whole scene whenever activePageId changes (see
  // remountPage there), which is the only visual consequence any of these
  // can have — adding/reordering/duplicating a page the user isn't looking
  // at, or removing a page other than the active one, needs no Pixi update.
  | { type: 'AddPage'; page: Page; index?: number }
  | { type: 'RemovePage'; pageId: string }
  | { type: 'ReorderPage'; pageId: string; to: 'up' | 'down' }
  | { type: 'DuplicatePage'; pageId: string; newPageId: string };

export type PageLevelCommand = Extract<Command, { type: 'AddPage' | 'RemovePage' | 'ReorderPage' | 'DuplicatePage' }>;

export function isPageLevelCommand(cmd: Command): cmd is PageLevelCommand {
  return cmd.type === 'AddPage' || cmd.type === 'RemovePage' || cmd.type === 'ReorderPage' || cmd.type === 'DuplicatePage';
}
