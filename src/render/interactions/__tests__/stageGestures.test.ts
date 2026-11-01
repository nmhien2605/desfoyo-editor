// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createEditorStore } from '../../../core/store';
import { DocumentSchema } from '../../../schema';
import { anchoredCamera, clampStagePan, clampStageZoom } from '../../stage';
import { attachStageGestures } from '../stageGestures';

const doc = DocumentSchema.parse({
  version: 1,
  id: 'd',
  meta: { title: 't', createdAt: 0, updatedAt: 0 },
  pages: [
    {
      id: 'p',
      name: 'p',
      size: { width: 100, height: 100 },
      background: { type: 'color', value: '#fff' },
      children: [
        {
          id: 'a',
          type: 'shape',
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          size: { width: 10, height: 10 },
          opacity: 1,
          visible: true,
          locked: false,
          shape: 'rect',
          fill: { type: 'solid', color: '#000' },
        },
      ],
    },
  ],
  assets: {},
});

describe('cancelGesture', () => {
  it('restores gestureStartDocument without a history entry and clears live drag state', () => {
    const store = createEditorStore(doc);
    const before = store.getState().document;
    store.getState().beginGesture('drag:a');
    store.getState().dispatch({ type: 'UpdateTransform', pageId: 'p', nodeId: 'a', patch: { x: 40 } });
    store.getState().setActiveGuides([{ axis: 'x', value: 1 }]);
    store.getState().setMarqueeRect({ x: 0, y: 0, width: 1, height: 1 });

    store.getState().cancelGesture();
    const s = store.getState();
    expect(s.document).toBe(before);
    expect(s.past).toEqual([]);
    expect(s.activeGestureId).toBeNull();
    expect(s.gestureStartDocument).toBeNull();
    expect(s.activeGuides).toEqual([]);
    expect(s.marqueeRect).toBeNull();
    // A later endGesture (the cancelled drag's pointerup) commits nothing.
    s.endGesture();
    expect(store.getState().past).toEqual([]);
  });
});

describe('stage camera clamps', () => {
  it('clampStageZoom keeps zoom in [fit, fit × maxZoom]', () => {
    expect(clampStageZoom(0.1, 0.5)).toBe(0.5);
    expect(clampStageZoom(9, 0.5)).toBe(2);
    expect(clampStageZoom(9, 0.5, 3)).toBe(1.5);
    expect(clampStageZoom(1, 0.5)).toBe(1);
  });

  // Backdrop 200×100 world units at (−50,−20) in a 400×400 canvas.
  const bounds = { canvas: { width: 400, height: 400 }, backdrop: { x: -50, y: -20, width: 200, height: 100 } };

  it('keeps a backdrop larger than the canvas covering it', () => {
    // zoom 4: backdrop is 800×400 on screen, so both axes fill the canvas.
    const left = clampStagePan({ zoom: 4, panX: 1000, panY: 1000 }, bounds);
    expect(-50 * 4 + left.panX).toBe(0); // left edge pinned to the canvas left
    expect(-20 * 4 + left.panY).toBe(0);
    const right = clampStagePan({ zoom: 4, panX: -1000, panY: -1000 }, bounds);
    expect(150 * 4 + right.panX).toBe(400); // right edge pinned to the canvas right
    expect(80 * 4 + right.panY).toBe(400);
    const inside = clampStagePan({ zoom: 4, panX: 0, panY: 0 }, bounds);
    expect(inside.panX).toBe(0);
  });

  it('centres a backdrop smaller than the canvas on that axis', () => {
    // zoom 2: 400×200 on screen — fills x, centred on y whatever the pan.
    const cam = clampStagePan({ zoom: 2, panX: 77, panY: -500 }, bounds);
    expect(-50 * 2 + cam.panX).toBe(0);
    expect(-20 * 2 + cam.panY).toBe(100);
  });
});

describe('anchoredCamera (pinch / wheel zoom)', () => {
  it('keeps the world point under the start midpoint under the current midpoint', () => {
    const start = { zoom: 2, panX: 30, panY: -10 };
    const from = { x: 100, y: 120 };
    const to = { x: 140, y: 90 };
    const world = { x: (from.x - start.panX) / start.zoom, y: (from.y - start.panY) / start.zoom };
    const cam = anchoredCamera(start, from, to, 3);
    expect(cam.zoom).toBe(3);
    expect(world.x * cam.zoom + cam.panX).toBeCloseTo(to.x);
    expect(world.y * cam.zoom + cam.panY).toBeCloseTo(to.y);
  });
});

describe('attachStageGestures', () => {
  const touch = (type: string, id: number, x: number, y: number, target: EventTarget) =>
    target.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));

  it('a second finger cancels the one-finger drag, then pinches the camera', () => {
    const store = createEditorStore(doc);
    store.getState().setStage({ backdropUrl: 'x', pageCenter: { x: 0.5, y: 0.5 }, pageBox: { width: 1, height: 1 } });
    store.getState().setStageFit({ zoom: 1, panX: 0, panY: 0 });
    const area = document.createElement('div');
    const child = document.createElement('div');
    area.appendChild(child);
    document.body.appendChild(area);
    const detach = attachStageGestures(area, store);
    const editorMoves: number[] = [];
    const editorDowns: number[] = [];
    // Stand-ins for Pixi / startPointerGesture listeners.
    window.addEventListener('pointermove', (e) => editorMoves.push(e.pointerId));
    child.addEventListener('pointerdown', (e) => editorDowns.push(e.pointerId));

    const before = store.getState().document;
    touch('pointerdown', 1, 10, 10, child);
    store.getState().beginGesture('drag:a');
    store.getState().dispatch({ type: 'UpdateTransform', pageId: 'p', nodeId: 'a', patch: { x: 40 } });
    touch('pointerdown', 2, 30, 10, child);
    expect(editorDowns).toEqual([1]);
    expect(store.getState().document).toBe(before);
    expect(store.getState().past).toEqual([]);

    // Fingers spread from 20px to 40px apart around midpoint (20,10): zoom ×2 about it.
    touch('pointermove', 2, 50, 10, child);
    expect(editorMoves).toEqual([]);
    const cam = store.getState().camera;
    expect(cam.zoom).toBeCloseTo(2);
    // World point (20,10) was under the start midpoint; it is now under the new one (30,10).
    expect(20 * cam.zoom + cam.panX).toBeCloseTo(30);

    touch('pointerup', 1, 10, 10, child);
    touch('pointerup', 2, 50, 10, child);
    touch('pointermove', 3, 0, 0, child);
    expect(editorMoves).toEqual([3]);
    detach();
    area.remove();
  });

  it('swallows Space only while the pointer is over the editor, but always arms Space-pan', () => {
    const store = createEditorStore(doc);
    const area = document.createElement('div');
    document.body.appendChild(area);
    const detach = attachStageGestures(area, store);
    const space = (type: string) => {
      const e = new KeyboardEvent(type, { code: 'Space', bubbles: true, cancelable: true });
      document.body.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(space('keydown')).toBe(false);
    expect(area.dataset.dfPan).toBe('grab');
    space('keyup');
    area.dispatchEvent(new PointerEvent('pointerenter'));
    expect(space('keydown')).toBe(true);
    space('keyup');
    area.dispatchEvent(new PointerEvent('pointerleave'));
    expect(space('keydown')).toBe(false);
    detach();
    area.remove();
  });
});
