// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { attachShortcuts } from '../shortcuts';
import { createEditorStore } from '../../core/store';
import type { Document } from '../../schema';

function makeDoc(): Document {
  return {
    version: 1,
    id: 'doc-1',
    meta: { title: 'Untitled', createdAt: 0, updatedAt: 0 },
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        size: { width: 100, height: 100 },
        background: { type: 'color', value: '#ffffff' },
        children: [
          {
            id: 'node-1',
            type: 'shape',
            transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
            size: { width: 10, height: 10 },
            opacity: 1,
            visible: true,
            locked: false,
            shape: 'rect',
            fill: { type: 'solid', color: '#000000' },
          },
        ],
      },
    ],
    assets: {},
  };
}

function pressModA() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
}

describe('attachShortcuts', () => {
  it('runs the built-in shortcut by default', () => {
    const store = createEditorStore(makeDoc());
    const detach = attachShortcuts(store);
    pressModA();
    expect(store.getState().selectedNodeIds.size).toBe(1);
    detach();
  });

  it('does nothing when enabled is false', () => {
    const store = createEditorStore(makeDoc());
    const detach = attachShortcuts(store, false);
    pressModA();
    expect(store.getState().selectedNodeIds.size).toBe(0);
    detach();
  });

  it('only runs whitelisted keys', () => {
    const store = createEditorStore(makeDoc());
    const detach = attachShortcuts(store, ['mod+z']); // whitelist excludes mod+a
    pressModA();
    expect(store.getState().selectedNodeIds.size).toBe(0);
    detach();
  });

  it('detaches its window listener', () => {
    const store = createEditorStore(makeDoc());
    const detach = attachShortcuts(store);
    detach();
    pressModA();
    expect(store.getState().selectedNodeIds.size).toBe(0);
  });
});
