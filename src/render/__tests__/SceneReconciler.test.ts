// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Container, Text, Graphics, Sprite } from 'pixi.js';
import { SceneReconciler } from '../SceneReconciler';
import type { Document, Page } from '../../schema';

function makePage(): Page {
  return {
    id: 'page-1',
    name: 'Page 1',
    size: { width: 400, height: 400 },
    background: { type: 'color', value: '#ffffff' },
    children: [
      {
        id: 'text-1',
        type: 'text',
        transform: { x: 10, y: 10, scaleX: 1, scaleY: 1, rotation: 0 },
        size: { width: 100, height: 30 },
        opacity: 1,
        visible: true,
        locked: false,
        text: 'Hello',
        font: { family: 'Inter', weight: 400, style: 'normal', size: 16 },
        align: 'left',
        letterSpacing: 0,
        lineHeight: 1.2,
        fill: { type: 'solid', color: '#000000' },
      },
      {
        id: 'shape-1',
        type: 'shape',
        transform: { x: 50, y: 50, scaleX: 1, scaleY: 1, rotation: 0 },
        size: { width: 80, height: 80 },
        opacity: 1,
        visible: true,
        locked: false,
        shape: 'rect',
        fill: { type: 'solid', color: '#ff0000' },
      },
      {
        id: 'image-1',
        type: 'image',
        transform: { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0 },
        size: { width: 60, height: 60 },
        opacity: 1,
        visible: true,
        locked: false,
        assetId: 'asset-1',
      },
    ],
  };
}

function makeDoc(page: Page): Document {
  return {
    version: 1,
    id: 'doc-1',
    meta: { title: 'Test', createdAt: 0, updatedAt: 0 },
    pages: [page],
    assets: { 'asset-1': { type: 'image', dataUri: 'data:image/svg+xml;base64,PHN2Zy8+' } },
    fonts: [],
  };
}

describe('SceneReconciler', () => {
  it('mount() builds exactly one DisplayObject of the right class per node', () => {
    const layer = new Container();
    const reconciler = new SceneReconciler(layer);
    const page = makePage();
    reconciler.mount(page, makeDoc(page));

    expect(layer.children).toHaveLength(3);
    expect(reconciler.getDisplayObject('text-1')).toBeInstanceOf(Text);
    expect(reconciler.getDisplayObject('shape-1')).toBeInstanceOf(Graphics);
    expect(reconciler.getDisplayObject('image-1')).toBeInstanceOf(Sprite);
  });

  it('AddNode adds one object without touching existing ones', () => {
    const layer = new Container();
    const reconciler = new SceneReconciler(layer);
    const page = makePage();
    let doc = makeDoc(page);
    reconciler.mount(page, doc);

    const existingText = reconciler.getDisplayObject('text-1');
    const existingShape = reconciler.getDisplayObject('shape-1');

    const newNode: Page['children'][number] = {
      id: 'shape-2',
      type: 'shape',
      transform: { x: 200, y: 200, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 40, height: 40 },
      opacity: 1,
      visible: true,
      locked: false,
      shape: 'ellipse',
      fill: { type: 'solid', color: '#00ff00' },
    };
    page.children.push(newNode);
    doc = { ...doc, pages: [page] };

    reconciler.apply({ type: 'AddNode', pageId: 'page-1', node: newNode }, doc);

    expect(layer.children).toHaveLength(4);
    expect(reconciler.getDisplayObject('shape-2')).toBeInstanceOf(Graphics);
    expect(reconciler.getDisplayObject('text-1')).toBe(existingText);
    expect(reconciler.getDisplayObject('shape-1')).toBe(existingShape);
  });

  it('RemoveNode destroys and removes the object', () => {
    const layer = new Container();
    const reconciler = new SceneReconciler(layer);
    const page = makePage();
    const doc = makeDoc(page);
    reconciler.mount(page, doc);

    const obj = reconciler.getDisplayObject('shape-1')!;
    page.children = page.children.filter((n) => n.id !== 'shape-1');
    const newDoc = { ...doc, pages: [page] };

    reconciler.apply({ type: 'RemoveNode', pageId: 'page-1', nodeId: 'shape-1' }, newDoc);

    expect(layer.children).toHaveLength(2);
    expect(reconciler.getDisplayObject('shape-1')).toBeUndefined();
    expect(obj.destroyed).toBe(true);
  });

  it('UpdateTransform mutates the same object reference in place', () => {
    const layer = new Container();
    const reconciler = new SceneReconciler(layer);
    const page = makePage();
    const doc = makeDoc(page);
    reconciler.mount(page, doc);

    const obj = reconciler.getDisplayObject('shape-1')!;
    const node = page.children.find((n) => n.id === 'shape-1')!;
    node.transform = { ...node.transform, x: 300, y: 300, rotation: 1 };
    const newDoc = { ...doc, pages: [page] };

    reconciler.apply(
      { type: 'UpdateTransform', pageId: 'page-1', nodeId: 'shape-1', patch: { x: 300, y: 300, rotation: 1 } },
      newDoc,
    );

    expect(reconciler.getDisplayObject('shape-1')).toBe(obj);
    expect(obj.position.x).toBe(300);
    expect(obj.position.y).toBe(300);
    expect(obj.rotation).toBe(1);
  });

  it('Reorder changes sibling index without changing identity', () => {
    const layer = new Container();
    const reconciler = new SceneReconciler(layer);
    const page = makePage();
    const doc = makeDoc(page);
    reconciler.mount(page, doc);

    const obj = reconciler.getDisplayObject('text-1')!;
    expect(layer.getChildIndex(obj)).toBe(0);

    const [node] = page.children.splice(0, 1);
    page.children.splice(1, 0, node);
    const newDoc = { ...doc, pages: [page] };

    reconciler.apply({ type: 'Reorder', pageId: 'page-1', nodeId: 'text-1', to: 'up' }, newDoc);

    expect(layer.getChildIndex(obj)).toBe(1);
    expect(reconciler.getDisplayObject('text-1')).toBe(obj);
  });
});
