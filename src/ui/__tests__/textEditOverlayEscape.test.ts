// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { createEditorStore } from '../../core/store';
import { EditorStoreProvider } from '../EditorContext';
import { createViewport } from '../../render/viewport';
import { TextEditOverlay } from '../TextEditOverlay';
import type { Document, TextNode } from '../../schema';

// Render-based (tach rieng khoi textEditOverlay.test.ts o moi truong node
// giong isOutsideTextarea.test.ts) — day la cach duy nhat kiem tra dung
// wiring cua onKeyDown, vi commit() dispatch qua context store, khong phai
// pure function co the goi truc tiep.
const NODE: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 100, height: 20 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'ban dau',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 16 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
};

function makeDocument(): Document {
  return {
    version: 1,
    id: 'doc-1',
    meta: { title: 'Test', createdAt: 0, updatedAt: 0 },
    pages: [{ id: 'page-1', name: 'Page 1', size: { width: 800, height: 600 }, background: { type: 'color', value: '#fff' }, children: [NODE] }],
    assets: {},
  };
}

describe('TextEditOverlay — Escape', () => {
  it('Escape commit gia tri moi (khong huy ve gia tri cu)', () => {
    const store = createEditorStore(makeDocument());
    const container = document.createElement('div');
    document.body.appendChild(container);
    const canvas = document.createElement('canvas');
    const viewport = createViewport(canvas, () => ({ zoom: 1, panX: 0, panY: 0 }));
    let closed = false;

    const root = createRoot(container);
    act(() => {
      root.render(
        createElement(
          EditorStoreProvider,
          { value: store },
          createElement(TextEditOverlay, {
            node: NODE,
            viewport,
            activePageId: 'page-1',
            onClose: () => {
              closed = true;
            },
          }),
        ),
      );
    });

    const textarea = container.querySelector('textarea')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      setter.call(textarea, 'noi dung moi');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    });

    const node = store.getState().document.pages[0].children[0] as TextNode;
    expect(node.text).toBe('noi dung moi');
    expect(closed).toBe(true);

    act(() => root.unmount());
    container.remove();
  });
});
