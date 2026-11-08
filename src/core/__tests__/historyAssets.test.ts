import { describe, expect, it } from 'vitest';
import { createEditorStore } from '../store';
import type { AssetRef, Document, Node } from '../../schema';

const shape = (id: string, extra: object = {}): Node =>
  ({
    id,
    type: 'shape',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    size: { width: 20, height: 20 },
    opacity: 1,
    visible: true,
    locked: false,
    shape: 'rect',
    fill: { type: 'solid', color: '#000' },
    ...extra,
  }) as unknown as Node;

const makeDoc = (): Document =>
  ({
    version: 1,
    id: 'd',
    meta: { title: 't', createdAt: 0, updatedAt: 0 },
    pages: [{ id: 'p', name: 'p', size: { width: 800, height: 600 }, background: { type: 'color', value: '#fff' }, children: [shape('a')] }],
    assets: {},
  }) as unknown as Document;

const ASSET = { type: 'image', dataUri: 'data:image/png;base64,AAAA' } as unknown as AssetRef;

// Ported from the mobile-crash audit repro (gesture root-replace patch vs addAssetRef outside history).
describe('history keeps assets', () => {
  it('drag → add image → undo ×2 → redo ×2 keeps the image asset', () => {
    const store = createEditorStore(makeDoc());
    const g = store.getState;
    g().beginGesture('drag');
    g().dispatch({ type: 'UpdateTransform', pageId: 'p', nodeId: 'a', patch: { x: 10 } });
    g().endGesture();
    g().addAssetRef('img1', ASSET);
    g().dispatch({ type: 'AddNode', pageId: 'p', node: shape('img', { type: 'image', assetId: 'img1' }) });

    g().undo();
    g().undo();
    expect(g().document.pages[0].children[0].transform.x).toBe(0);
    g().redo();
    g().redo();
    const doc = g().document;
    expect(doc.pages[0].children.some((n) => n.id === 'img')).toBe(true);
    expect(doc.pages[0].children[0].transform.x).toBe(10);
    expect(doc.assets.img1).toEqual(ASSET);
  });

  it('cancelGesture restores the document but keeps assets added mid-gesture', () => {
    const store = createEditorStore(makeDoc());
    const g = store.getState;
    g().beginGesture('drag');
    g().dispatch({ type: 'UpdateTransform', pageId: 'p', nodeId: 'a', patch: { x: 10 } });
    g().addAssetRef('img1', ASSET);
    g().cancelGesture();
    expect(g().document.pages[0].children[0].transform.x).toBe(0);
    expect(g().document.assets.img1).toEqual(ASSET);
  });
});
