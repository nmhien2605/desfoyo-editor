import { Container } from 'pixi.js';
import type { GroupNode } from '../../schema';
import { applyTransform } from '../applyTransform';

// A GroupNode's Container has no visual content of its own — it only
// carries the group's transform; children mount into it directly (handled
// by SceneReconciler's recursion, not here).
export const groupRenderer = {
  create(node: GroupNode): Container {
    const obj = new Container();
    this.update(obj, node);
    return obj;
  },
  update(obj: Container, node: GroupNode): void {
    applyTransform(obj, node);
  },
};
