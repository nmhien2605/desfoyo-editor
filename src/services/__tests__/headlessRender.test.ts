// @vitest-environment jsdom
//
// A real Application.init() needs a working 2D/WebGL canvas context, which
// jsdom doesn't provide without the `canvas` npm package (not installed in
// this repo — see SceneReconciler.test.ts's same jsdom limitation). Mocking
// Application here keeps this a real check of headlessRender's own
// orchestration (mount → export → cleanup, even on failure) without needing
// a full renderer; renderPageToPng/Svg's actual pixel output is exercised
// manually in a real browser per docs/guide, not by this suite.
import { describe, expect, it, vi } from 'vitest';
import type { Document, Page } from '../../schema';

const initMock = vi.fn().mockResolvedValue(undefined);
const destroyMock = vi.fn();
const addChildMock = vi.fn();

vi.mock('pixi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pixi.js')>();
  return {
    ...actual,
    // A regular (non-arrow) function so `new Application()` can construct it.
    Application: vi.fn().mockImplementation(function MockApplication(this: unknown) {
      Object.assign(this as object, {
        init: initMock,
        destroy: destroyMock,
        stage: { addChild: addChildMock },
      });
    }),
  };
});

const mountMock = vi.fn();
const reconcilerDestroyMock = vi.fn();
vi.mock('../../render/SceneReconciler', () => ({
  SceneReconciler: vi.fn().mockImplementation(function MockSceneReconciler(this: unknown) {
    Object.assign(this as object, { mount: mountMock, destroy: reconcilerDestroyMock });
  }),
}));

const exportPngMock = vi.fn().mockResolvedValue(new Blob(['png']));
const exportSvgMock = vi.fn().mockResolvedValue('<svg></svg>');
vi.mock('../exportService', () => ({
  exportPng: exportPngMock,
  exportSvg: exportSvgMock,
}));

const { renderPageToPng, renderPageToSvg } = await import('../headlessRender');

function makePage(): Page {
  return {
    id: 'page-1',
    name: 'Page 1',
    size: { width: 200, height: 100 },
    background: { type: 'color', value: '#ffffff' },
    children: [],
  };
}

function makeDoc(page: Page): Document {
  return {
    version: 1,
    id: 'doc-1',
    meta: { title: 'Untitled', createdAt: 0, updatedAt: 0 },
    pages: [page],
    assets: {},
  };
}

describe('renderPageToPng', () => {
  it('inits an off-screen Application, mounts the page, exports, and cleans up', async () => {
    const page = makePage();
    const doc = makeDoc(page);
    const blob = await renderPageToPng(page, doc, 2);

    expect(initMock).toHaveBeenCalledWith(expect.objectContaining({ width: 200, height: 100, background: '#ffffff' }));
    expect(mountMock).toHaveBeenCalledWith(page, doc);
    expect(exportPngMock).toHaveBeenCalledWith(expect.anything(), expect.anything(), page.size, 2);
    expect(destroyMock).toHaveBeenCalledWith(true);
    expect(reconcilerDestroyMock).toHaveBeenCalled();
    expect(blob).toBeInstanceOf(Blob);
  });

  it('still destroys the Application if export rejects', async () => {
    exportPngMock.mockRejectedValueOnce(new Error('boom'));
    const page = makePage();
    await expect(renderPageToPng(page, makeDoc(page))).rejects.toThrow('boom');
    expect(destroyMock).toHaveBeenCalledWith(true);
  });
});

describe('renderPageToSvg', () => {
  it('exports svg via the same off-screen Application', async () => {
    const page = makePage();
    const doc = makeDoc(page);
    const svg = await renderPageToSvg(page, doc);
    expect(exportSvgMock).toHaveBeenCalledWith(expect.anything(), page, doc, expect.anything());
    expect(svg).toBe('<svg></svg>');
  });
});
