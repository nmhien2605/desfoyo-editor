import { Application, Container } from 'pixi.js';
import type { Document, Page } from '../schema';
import { SceneReconciler } from '../render/SceneReconciler';
import { backgroundColor } from '../render/backgroundColor';
import { exportPng, exportSvg } from './exportService';

// Renders a Page to an image without mounting <Editor> — for generating
// thumbnails/previews from a saved Document (e.g. a product list or 3D
// texture) without a live, interactive editor instance. Browser-only: Pixi's
// Application still needs a browser canvas/WebGL context, so this must run
// in a real tab (a hidden one is fine), not Node.
//
// Builds the same Application + SceneReconciler pair CanvasHost.tsx mounts
// for the interactive editor, minus everything interaction-only (drag,
// pan/zoom, marquee, the grid overlay) — this is a one-shot static render,
// nothing here needs to respond to input. Callers must have already
// registered/loaded any fonts the page's text nodes use (registerFont/
// loadFont from '../text/fontService') — mount() below is synchronous and
// won't wait for a font that isn't ready yet.
// Application resolution stays at 1 — exportPng/exportSvg take `scale` as an
// explicit, separate parameter (see exportService.ts), so the app's own
// backing-store resolution shouldn't also scale the result.
async function withRenderedPage<T>(page: Page, doc: Document, render: (app: Application, pageContainer: Container, reconciler: SceneReconciler) => Promise<T>): Promise<T> {
  const app = new Application();
  await app.init({
    width: page.size.width,
    height: page.size.height,
    background: backgroundColor(page.background),
    antialias: true,
  });
  const pageContainer = new Container();
  app.stage.addChild(pageContainer);
  const reconciler = new SceneReconciler(pageContainer);
  reconciler.mount(page, doc);
  try {
    return await render(app, pageContainer, reconciler);
  } finally {
    reconciler.destroy();
    app.destroy(true);
  }
}

export function renderPageToPng(page: Page, doc: Document, scale = 1): Promise<Blob> {
  return withRenderedPage(page, doc, (app, pageContainer) => exportPng(app, pageContainer, scale));
}

export function renderPageToSvg(page: Page, doc: Document): Promise<string> {
  return withRenderedPage(page, doc, (app, _pageContainer, reconciler) => exportSvg(app, page, doc, reconciler));
}
