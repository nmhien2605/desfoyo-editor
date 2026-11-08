import { describe, expect, it } from 'vitest';
import { BindGroup, TextureSource, type Application } from 'pixi.js';
import { releaseFilterBindGroup } from '../headlessRender';

// The FilterSystem's global BindGroup stays subscribed to the last filter
// pass's pooled texture; app.destroy() then prunes that texture and pixi
// >= 8.21 warns "[BindGroup] ... destroyed while still bound".
describe('releaseFilterBindGroup', () => {
  it('unsubscribes the filter bind group from the pooled texture before teardown', () => {
    const source = new TextureSource();
    const group = new BindGroup({ 1: source, 2: source.style });
    expect(source.listenerCount('change')).toBe(1);
    const app = { renderer: { filter: { _globalFilterBindGroup: group } } } as unknown as Application;
    releaseFilterBindGroup(app);
    expect(source.listenerCount('change')).toBe(0);
    expect(source.style.listenerCount('change')).toBe(1); // only the source's own style listener
  });

  it('is a no-op when the renderer has no such group', () => {
    expect(() => releaseFilterBindGroup({ renderer: { filter: {} } } as unknown as Application)).not.toThrow();
  });
});
