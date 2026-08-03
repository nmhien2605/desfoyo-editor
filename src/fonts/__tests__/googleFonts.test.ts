// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GOOGLE_FONTS, DEFAULT_FONT_FAMILY, loadGoogleFont } from '../googleFonts';

describe('GOOGLE_FONTS', () => {
  it('has at least one entry, each with a non-empty family and at least one weight', () => {
    expect(GOOGLE_FONTS.length).toBeGreaterThan(0);
    for (const entry of GOOGLE_FONTS) {
      expect(entry.family.length).toBeGreaterThan(0);
      expect(entry.weights.length).toBeGreaterThan(0);
    }
  });

  it('DEFAULT_FONT_FAMILY matches the first entry in the list', () => {
    expect(DEFAULT_FONT_FAMILY).toBe(GOOGLE_FONTS[0].family);
  });
});

describe('loadGoogleFont', () => {
  // jsdom never actually fetches the stylesheet, so the <link>'s load event
  // never fires on its own. Simulate the browser firing it right after the
  // link is appended, so loadGoogleFont's await doesn't hang.
  const originalAppendChild = HTMLHeadElement.prototype.appendChild;
  beforeEach(() => {
    HTMLHeadElement.prototype.appendChild = function <T extends Node>(node: T): T {
      const result = originalAppendChild.call(this, node) as T;
      if (node instanceof HTMLLinkElement) {
        queueMicrotask(() => node.dispatchEvent(new Event('load')));
      }
      return result;
    };
  });

  afterEach(() => {
    HTMLHeadElement.prototype.appendChild = originalAppendChild;
    // @ts-expect-error - test-only stub cleanup
    delete document.fonts;
    document.head.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove());
  });

  it('resolves without throwing and without a network call when document.fonts is unavailable (jsdom has none)', async () => {
    await expect(loadGoogleFont('Roboto', 400)).resolves.toBeUndefined();
  });

  it('calls document.fonts.load with the requested family/weight and appends a stylesheet <link>', async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    // @ts-expect-error - jsdom doesn't implement document.fonts; stub it for this test
    document.fonts = { load };

    await loadGoogleFont('Merriweather', 700);

    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls[0][0]).toContain('Merriweather');
    expect(load.mock.calls[0][0]).toContain('700');

    const links = document.head.querySelectorAll('link[rel="stylesheet"]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toContain('Merriweather');
  });

  it('only appends one <link> when called twice with the same family/weight (dedup via loaded set)', async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    // @ts-expect-error - jsdom doesn't implement document.fonts; stub it for this test
    document.fonts = { load };

    await loadGoogleFont('Inter', 500);
    await loadGoogleFont('Inter', 500);

    expect(load).toHaveBeenCalledTimes(1);
    const links = document.head.querySelectorAll('link[href*="Inter"]');
    expect(links.length).toBe(1);
  });
});
