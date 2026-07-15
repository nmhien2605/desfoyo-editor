import { Text, type Container } from 'pixi.js';
import type { Command } from '../core/commands';
import { findNodeInTree } from '../core/tree';
import type { Document, Node, Page } from '../schema';
import { textRenderer } from './renderers/textRenderer';
import { shapeRenderer } from './renderers/shapeRenderer';
import { imageRenderer } from './renderers/imageRenderer';
import { groupRenderer } from './renderers/groupRenderer';

function createDisplayObject(node: Node, doc: Document): Container {
  switch (node.type) {
    case 'text':
      return textRenderer.create(node);
    case 'shape':
      return shapeRenderer.create(node);
    case 'image':
      return imageRenderer.create(node, doc);
    case 'group':
      return groupRenderer.create(node);
  }
}

function updateDisplayObject(obj: Container, node: Node, doc: Document): void {
  switch (node.type) {
    case 'text':
      textRenderer.update(obj as never, node);
      break;
    case 'shape':
      shapeRenderer.update(obj as never, node);
      break;
    case 'image':
      imageRenderer.update(obj as never, node, doc);
      break;
    case 'group':
      groupRenderer.update(obj as never, node);
      break;
  }
}

// textRenderer.create() returns a bare Text for a strokeless text node and
// a Container (of layered Text clones) once it has a stroke — update() can
// mutate either in place, but can't swap one for the other. Crossing that
// boundary (stroke added to/removed from a previously-strokeless node)
// needs the object recreated, same as SceneReconciler already does for
// AddNode/RemoveNode.
function needsRecreate(obj: Container, node: Node): boolean {
  return node.type === 'text' && obj instanceof Text === !!node.stroke;
}

function findPage(doc: Document, pageId: string): Page | undefined {
  return doc.pages.find((p) => p.id === pageId);
}

// Maps Node -> Pixi Container, keyed by nodeId, flat regardless of nesting
// depth. mount() does the one full recursive build (initial paint). apply()
// does a single targeted create/update/destroy/reorder per command — it
// never diffs the whole tree, because every Command already names the
// exact nodeId(s) it affects. GroupNodes/UngroupNode are the one exception:
// they restructure multiple nodes across containers atomically, so those
// two rebuild the scene from the page rather than doing surgical Pixi
// container moves — group/ungroup are one-shot structural actions, not a
// per-frame gesture, so this isn't a perf concern. See CONTEXT.md
// "Command" and "Node".
export class SceneReconciler {
  private displayObjects = new Map<string, Container>();
  private layer: Container;
  private onNodeMounted?: (obj: Container, node: Node) => void;

  constructor(layer: Container, onNodeMounted?: (obj: Container, node: Node) => void) {
    this.layer = layer;
    this.onNodeMounted = onNodeMounted;
  }

  mount(page: Page, doc: Document): void {
    this.mountChildren(page.children, this.layer, doc);
  }

  private mountChildren(children: Node[], parentContainer: Container, doc: Document): void {
    for (const node of children) {
      const obj = createDisplayObject(node, doc);
      obj.label = node.id;
      this.displayObjects.set(node.id, obj);
      parentContainer.addChild(obj);
      this.onNodeMounted?.(obj, node);
      if (node.type === 'group') this.mountChildren(node.children, obj, doc);
    }
  }

  private rebuildFromPage(page: Page, doc: Document): void {
    for (const obj of this.displayObjects.values()) obj.destroy();
    this.displayObjects.clear();
    this.layer.removeChildren();
    this.mountChildren(page.children, this.layer, doc);
  }

  private destroySubtree(obj: Container): void {
    for (const child of [...obj.children]) this.destroySubtree(child as Container);
    if (obj.label) this.displayObjects.delete(obj.label);
    obj.destroy();
  }

  apply(cmd: Command, doc: Document): void {
    const page = findPage(doc, cmd.pageId);
    if (!page) return;

    switch (cmd.type) {
      case 'AddNode': {
        const location = findNodeInTree(page.children, cmd.node.id);
        if (!location) return;
        const parentContainer = cmd.parentId ? this.displayObjects.get(cmd.parentId) : this.layer;
        if (!parentContainer) return;
        const obj = createDisplayObject(location.node, doc);
        obj.label = location.node.id;
        this.displayObjects.set(location.node.id, obj);
        parentContainer.addChildAt(obj, location.index);
        this.onNodeMounted?.(obj, location.node);
        if (location.node.type === 'group') this.mountChildren(location.node.children, obj, doc);
        break;
      }
      case 'RemoveNode': {
        const obj = this.displayObjects.get(cmd.nodeId);
        if (!obj) return;
        obj.parent?.removeChild(obj);
        this.destroySubtree(obj);
        break;
      }
      case 'UpdateProps':
      case 'UpdateTransform': {
        const obj = this.displayObjects.get(cmd.nodeId);
        const location = findNodeInTree(page.children, cmd.nodeId);
        if (!obj || !location) return;
        if (needsRecreate(obj, location.node)) {
          const parent = obj.parent;
          if (!parent) return;
          const index = parent.getChildIndex(obj);
          parent.removeChild(obj);
          obj.destroy();
          const newObj = createDisplayObject(location.node, doc);
          newObj.label = location.node.id;
          this.displayObjects.set(location.node.id, newObj);
          parent.addChildAt(newObj, index);
          this.onNodeMounted?.(newObj, location.node);
          break;
        }
        updateDisplayObject(obj, location.node, doc);
        break;
      }
      case 'Reorder': {
        const obj = this.displayObjects.get(cmd.nodeId);
        const location = findNodeInTree(page.children, cmd.nodeId);
        if (!obj || !location || !obj.parent) return;
        obj.parent.setChildIndex(obj, location.index);
        break;
      }
      case 'GroupNodes':
      case 'UngroupNode': {
        this.rebuildFromPage(page, doc);
        break;
      }
    }
  }

  getDisplayObject(nodeId: string): Container | undefined {
    return this.displayObjects.get(nodeId);
  }

  destroy(): void {
    for (const obj of this.displayObjects.values()) obj.destroy();
    this.displayObjects.clear();
  }
}
