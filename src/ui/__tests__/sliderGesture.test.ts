// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { createEditorStore } from '../../core/store';
import { EditorStoreProvider } from '../EditorContext';
import { PropertiesPanel } from '../PropertiesPanel';
import { TransformationControls } from '../TransformationControls';
import type { Document, Node, TextNode } from '../../schema';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TEXT: TextNode = {
  id: 't',
  type: 'text',
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 100, height: 20 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'abc',
  font: { family: 'Poppins', weight: 400, style: 'normal', size: 16 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#000000' },
  warp: { type: 'arch', curveHeight: 0.5, directionInverted: false },
} as TextNode;

const makeDoc = (): Document =>
  ({
    version: 1,
    id: 'd',
    meta: { title: 't', createdAt: 0, updatedAt: 0 },
    pages: [{ id: 'p', name: 'p', size: { width: 800, height: 600 }, background: { type: 'color', value: '#fff' }, children: [TEXT] }],
    assets: {},
  }) as unknown as Document;

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
});

function mount(which: 'opacity' | 'warp') {
  const store = createEditorStore(makeDoc());
  store.getState().setActivePage('p');
  store.getState().select('t');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const render = () =>
    root.render(
      createElement(
        EditorStoreProvider,
        { value: store },
        which === 'opacity'
          ? createElement(PropertiesPanel)
          : createElement(TransformationControls, {
              node: store.getState().document.pages[0].children[0] as TextNode,
              activePageId: 'p',
            }),
      ),
    );
  act(render);
  const unsubscribe = store.subscribe(() => act(render));
  cleanup = () => {
    unsubscribe();
    act(() => root.unmount());
    container.remove();
  };
  const slider = container.querySelector<HTMLInputElement>(
    which === 'opacity' ? 'input[type=range][max="1"]' : 'input[type=range][max="4"]',
  )!;
  return { store, slider };
}

// React tracks the input's value; set it through the native setter so onChange fires.
function drag(slider: HTMLInputElement, value: number) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(slider, String(value));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const value = (store: ReturnType<typeof createEditorStore>, which: 'opacity' | 'warp') => {
  const node = store.getState().document.pages[0].children[0] as Node & TextNode;
  return which === 'opacity' ? node.opacity : node.warp!.curveHeight;
};

describe.each(['opacity', 'warp'] as const)('%s slider gesture', (which) => {
  it.each(['pointercancel', 'pointerup'] as const)(
    'a %s outside the slider ends it with one history entry',
    (endType) => {
      const { store, slider } = mount(which);
      act(() => {
        slider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 5 }));
      });
      expect(store.getState().activeGestureId).not.toBeNull();
      drag(slider, 0.3);
      drag(slider, 0.2);
      // Lands on the window, not the slider (finger slid off, or the browser
      // took the touch over for a scroll).
      act(() => {
        document.body.dispatchEvent(new PointerEvent(endType, { bubbles: true, pointerId: 5 }));
      });
      expect(store.getState().activeGestureId).toBeNull();
      expect(value(store, which)).toBeCloseTo(0.2);
      expect(store.getState().past).toHaveLength(1);
      // Later events don't reopen or extend it.
      drag(slider, 0.1);
      expect(store.getState().past).toHaveLength(2);
    },
  );
});
