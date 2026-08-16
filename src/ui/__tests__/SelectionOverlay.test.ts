import { describe, expect, it } from 'vitest';
import { updateCropHandle } from '../SelectionOverlay';

const FULL = { x: 0, y: 0, width: 1, height: 1 };

describe('updateCropHandle', () => {
  it('se handle grows width/height from a drag toward bottom-right', () => {
    const next = updateCropHandle(FULL, 'se', { x: -0.2, y: -0.3 });
    expect(next).toEqual({ x: 0, y: 0, width: 0.8, height: 0.7 });
  });

  it('nw handle moves x/y and shrinks width/height', () => {
    const next = updateCropHandle(FULL, 'nw', { x: 0.2, y: 0.1 });
    expect(next).toEqual({ x: 0.2, y: 0.1, width: 0.8, height: 0.9 });
  });

  it('clamps x/y within 0..1', () => {
    const next = updateCropHandle(FULL, 'nw', { x: -0.5, y: -0.5 });
    expect(next.x).toBe(0);
    expect(next.y).toBe(0);
  });

  it('clamps width/height so the crop rect never exceeds the image bounds', () => {
    const next = updateCropHandle({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, 'se', { x: 1, y: 1 });
    expect(next.width).toBeLessThanOrEqual(0.5);
    expect(next.height).toBeLessThanOrEqual(0.5);
  });
});
