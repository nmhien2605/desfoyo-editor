// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { isOutsideTextarea } from '../TextEditOverlay';

// Pure predicate behind TextEditOverlay's capture-phase "click away commits"
// handler — split into its own jsdom-environment file so the font-loading
// textEditPatch tests (in textEditOverlay.test.ts) can stay on the default
// node environment, whose native URL/fileURLToPath jsdom's URL polyfill
// doesn't play nicely with.
describe('isOutsideTextarea', () => {
  const textarea = document.createElement('textarea');
  const caretSpan = document.createElement('span');
  textarea.appendChild(caretSpan);
  const outsideDiv = document.createElement('div');

  it('click ngoai textarea la true', () => {
    expect(isOutsideTextarea(outsideDiv, textarea)).toBe(true);
  });

  it('click ngay tren textarea la false', () => {
    expect(isOutsideTextarea(textarea, textarea)).toBe(false);
  });

  it('click vao con cua textarea (vd caret) cung la false', () => {
    expect(isOutsideTextarea(caretSpan, textarea)).toBe(false);
  });

  it('textarea da unmount (ref null) thi luon la true', () => {
    expect(isOutsideTextarea(outsideDiv, null)).toBe(true);
  });
});
