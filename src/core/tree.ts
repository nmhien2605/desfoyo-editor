import { nanoid } from 'nanoid';
import type { Node, Page } from '../schema';

export interface TreeLocation {
  node: Node;
  parent: Node[];
  index: number;
  // id of the GroupNode that owns `parent`, or null if `parent` is page.children directly.
  ownerGroupId: string | null;
}

// The single place recursive node lookup happens — every call site (store
// dispatch, SceneReconciler, LayersPanel) routes through this instead of
// duplicating tree-walk logic.
export function findNodeInTree(
  children: Node[],
  nodeId: string,
  ownerGroupId: string | null = null,
): TreeLocation | undefined {
  const index = children.findIndex((n) => n.id === nodeId);
  if (index !== -1) {
    return { node: children[index], parent: children, index, ownerGroupId };
  }
  for (const child of children) {
    if (child.type === 'group') {
      const found = findNodeInTree(child.children, nodeId, child.id);
      if (found) return found;
    }
  }
  return undefined;
}

export function findNodeInPage(page: Page, nodeId: string): TreeLocation | undefined {
  return findNodeInTree(page.children, nodeId);
}

export function requireNodeInPage(page: Page, nodeId: string): TreeLocation {
  const location = findNodeInPage(page, nodeId);
  if (!location) throw new Error(`Unknown nodeId: ${nodeId}`);
  return location;
}

export function walkTree(children: Node[], visit: (node: Node, parent: Node[], index: number) => void): void {
  children.forEach((node, index) => {
    visit(node, children, index);
    if (node.type === 'group') walkTree(node.children, visit);
  });
}

// Reassigns a fresh id to the node and every nested descendant (a group's
// children must all get new ids too, not just the top-level clone, or
// duplicating a group would produce id collisions). Used by
// duplicate/copy-paste — see src/services/clipboard.ts.
export function deepCloneNode(node: Node): Node {
  if (node.type === 'group') {
    return { ...node, id: nanoid(), children: node.children.map(deepCloneNode) };
  }
  return { ...node, id: nanoid() };
}
