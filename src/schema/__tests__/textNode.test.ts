import { describe, expect, it } from 'vitest';
import { NodeSchema, TextNodeSchema, WarpSchema, type TextNode } from '../index';

const validText: TextNode = {
  id: 'text-1',
  type: 'text',
  transform: { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0, originX: 0.5, originY: 0.5 },
  size: { width: 300, height: 120 },
  opacity: 1,
  visible: true,
  locked: false,
  text: 'Wave',
  font: { family: 'Anton', weight: 400, style: 'normal', size: 96 },
  align: 'left',
  letterSpacing: 0,
  lineHeight: 1.2,
  fill: { type: 'solid', color: '#111827' },
};

describe('TextNodeSchema', () => {
  it('nhan text node hop le', () => {
    expect(TextNodeSchema.parse(validText)).toEqual(validText);
  });

  it('NodeSchema nhan type "text"', () => {
    expect(NodeSchema.parse(validText)).toEqual(validText);
  });

  it('nhan warp co paths', () => {
    const withWarp: TextNode = {
      ...validText,
      warp: {
        type: 'wave',
        intensity: 0.5,
        paths: [
          {
            role: 'baseline',
            closed: false,
            anchors: [
              { x: 0, y: 0.9, out: { x: 0.2, y: 0.9 } },
              { x: 1, y: 0.7, in: { x: 0.75, y: 0.6 } },
            ],
          },
        ],
      },
    };
    expect(TextNodeSchema.parse(withWarp)).toEqual(withWarp);
  });

  it('tu choi intensity ngoai khoang 0..1', () => {
    expect(WarpSchema.safeParse({ type: 'wave', intensity: 1.5 }).success).toBe(false);
    expect(WarpSchema.safeParse({ type: 'wave', intensity: -0.1 }).success).toBe(false);
  });

  it('tu choi fontSize <= 0', () => {
    const bad = { ...validText, font: { ...validText.font, size: 0 } };
    expect(TextNodeSchema.safeParse(bad).success).toBe(false);
  });

  it('tu choi align "justify" (chua ho tro)', () => {
    expect(TextNodeSchema.safeParse({ ...validText, align: 'justify' }).success).toBe(false);
  });
});
