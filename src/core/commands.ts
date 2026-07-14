import type { Node } from '../schema';
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
  | { type: 'UngroupNode'; pageId: string; groupId: string };
