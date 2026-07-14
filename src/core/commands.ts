import type { Node } from '../schema';
import type { Transform } from '../schema';

// Every document mutation goes through one of these. No direct model
// mutation path exists — the SceneReconciler relies on each command already
// knowing the exact nodeId(s) it affects to do targeted updates instead of
// diffing the whole tree. See CONTEXT.md "Command".
export type Command =
  | { type: 'AddNode'; pageId: string; node: Node; index?: number }
  | { type: 'RemoveNode'; pageId: string; nodeId: string }
  | { type: 'UpdateProps'; pageId: string; nodeId: string; patch: Partial<Node> }
  | { type: 'UpdateTransform'; pageId: string; nodeId: string; patch: Partial<Transform> }
  | { type: 'Reorder'; pageId: string; nodeId: string; to: 'up' | 'down' | 'top' | 'bottom' };
