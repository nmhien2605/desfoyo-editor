// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { applyOverrides, listFillableIds } from '../renderers/svgRenderer';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path id="body" d="M0 0h100v100H0z" fill="#ff0000"/>
  <circle id="dot" cx="50" cy="50" r="10"/>
  <g id="wrapper"><rect id="inner" width="10" height="10"/></g>
</svg>`;

describe('listFillableIds', () => {
  it('lists ids of fillable elements, excluding non-fillable containers', () => {
    expect(listFillableIds(SVG)).toEqual(['body', 'dot', 'inner']);
  });

  it('returns an empty array when no ids are present', () => {
    expect(listFillableIds('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>')).toEqual([]);
  });
});

describe('applyOverrides', () => {
  it('returns the input unchanged when no overrides given', () => {
    expect(applyOverrides(SVG, undefined)).toBe(SVG);
    expect(applyOverrides(SVG, {})).toBe(SVG);
  });

  it('applies a solid-color override to the matching element by id', () => {
    const result = applyOverrides(SVG, { body: { type: 'solid', color: '#00ff00' } });
    expect(result).toContain('fill="#00ff00"');
    expect(result).not.toContain('fill="#ff0000"');
  });

  it('silently ignores a gradient override (v1 solid-only)', () => {
    const result = applyOverrides(SVG, {
      body: { type: 'linear-gradient', stops: [{ offset: 0, color: '#000' }], angle: 0 },
    });
    expect(result).toContain('fill="#ff0000"');
  });

  it('silently no-ops for an unknown id', () => {
    const result = applyOverrides(SVG, { 'does-not-exist': { type: 'solid', color: '#00ff00' } });
    expect(result).not.toContain('#00ff00');
  });
});
