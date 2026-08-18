// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { startPointerGesture } from '../pointerGesture';
import type { EditorStoreApi } from '../../../core/store';

// Store gia: chi can beginGesture/endGesture (startPointerGesture khong dung
// gi khac cua store).
function fakeStore() {
  const calls: string[] = [];
  const store = {
    getState: () => ({
      beginGesture: (id: string) => calls.push(`begin:${id}`),
      endGesture: () => calls.push('end'),
    }),
  } as unknown as EditorStoreApi;
  return { store, calls };
}

describe('startPointerGesture', () => {
  it('beginGesture ngay, onMove goi moi lan pointermove, endGesture + go listener khi pointerup', () => {
    const { store, calls } = fakeStore();
    const moves: number[] = [];
    startPointerGesture(store, 'test-gesture', (e) => moves.push(e.clientX));

    expect(calls).toEqual(['begin:test-gesture']);

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10 }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 20 }));
    expect(moves).toEqual([10, 20]);

    window.dispatchEvent(new PointerEvent('pointerup'));
    expect(calls).toEqual(['begin:test-gesture', 'end']);

    // Listener da go: pointermove sau pointerup khong con goi onMove nua.
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30 }));
    expect(moves).toEqual([10, 20]);
  });

  it('pointerup goi dung 1 lan du bi dispatch nhieu lan', () => {
    const { store, calls } = fakeStore();
    startPointerGesture(store, 'g', () => {});
    window.dispatchEvent(new PointerEvent('pointerup'));
    window.dispatchEvent(new PointerEvent('pointerup'));
    expect(calls.filter((c) => c === 'end')).toHaveLength(1);
  });
});
