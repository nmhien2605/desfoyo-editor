import type { Container } from 'pixi.js';
import type { Command } from '../core/commands';
import type { Document, Node, Page } from '../schema';
import { textRenderer } from './renderers/textRenderer';
import { shapeRenderer } from './renderers/shapeRenderer';
import { imageRenderer } from './renderers/imageRenderer';

function createDisplayObject(node: Node, doc: Document): Container {
  switch (node.type) {
    case 'text':
      return textRenderer.create(node);
    case 'shape':
      return shapeRenderer.create(node);
    case 'image':
      return imageRenderer.create(node, doc);
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
  }
}

function findPage(doc: Document, pageId: string): Page | undefined {
  return doc.pages.find((p) => p.id === pageId);
}

// Maps Node -> Pixi Container, keyed by nodeId. mount() does the one full
// build (initial paint). apply() does a single targeted create/update/
// destroy/reorder per command — it never diffs the whole tree, because
// every Command already names the exact nodeId(s) it affects.
// See CONTEXT.md "Command" and "Node".
export class SceneReconciler {
  private displayObjects = new Map<string, Container>();
  private layer: Container;
  private onNodeMounted?: (obj: Container, node: Node) => void;

  constructor(layer: Container, onNodeMounted?: (obj: Container, node: Node) => void) {
    this.layer = layer;
    this.onNodeMounted = onNodeMounted;
  }

  mount(page: Page, doc: Document): void {
    for (const node of page.children) {
      const obj = createDisplayObject(node, doc);
      this.displayObjects.set(node.id, obj);
      this.layer.addChild(obj);
      this.onNodeMounted?.(obj, node);
    }
  }

  apply(cmd: Command, doc: Document): void {
    const page = findPage(doc, cmd.pageId);
    if (!page) return;

    switch (cmd.type) {
      case 'AddNode': {
        const node = page.children.find((n) => n.id === cmd.node.id);
        if (!node) return;
        const obj = createDisplayObject(node, doc);
        const index = page.children.findIndex((n) => n.id === node.id);
        this.displayObjects.set(node.id, obj);
        this.layer.addChildAt(obj, index);
        this.onNodeMounted?.(obj, node);
        break;
      }
      case 'RemoveNode': {
        const obj = this.displayObjects.get(cmd.nodeId);
        if (!obj) return;
        this.layer.removeChild(obj);
        obj.destroy();
        this.displayObjects.delete(cmd.nodeId);
        break;
      }
      case 'UpdateProps':
      case 'UpdateTransform': {
        const obj = this.displayObjects.get(cmd.nodeId);
        const node = page.children.find((n) => n.id === cmd.nodeId);
        if (!obj || !node) return;
        updateDisplayObject(obj, node, doc);
        break;
      }
      case 'Reorder': {
        const obj = this.displayObjects.get(cmd.nodeId);
        if (!obj) return;
        const index = page.children.findIndex((n) => n.id === cmd.nodeId);
        if (index === -1) return;
        this.layer.setChildIndex(obj, index);
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
