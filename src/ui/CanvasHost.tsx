import { useEffect, useRef, type MutableRefObject } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { SceneReconciler } from '../render/SceneReconciler';
import { attachDrag } from '../render/interactions/drag';
import { attachViewportControls, attachPan } from '../render/interactions/viewportControls';
import { attachMarquee } from '../render/interactions/marquee';
import { fillToColor } from '../render/fillToColor';
import { useEditorStoreApi } from './EditorContext';
import { activePage, type GridSettings } from '../core/store';
import type { Document, Page, PageBackground, Size } from '../schema';

function backgroundColor(bg: PageBackground) {
  return bg.type === 'color' ? bg.value : fillToColor(bg.value);
}

function drawGrid(graphics: Graphics, pageSize: Size, grid: GridSettings): void {
  graphics.clear();
  if (!grid.enabled || grid.size <= 0) return;
  for (let x = 0; x <= pageSize.width; x += grid.size) {
    graphics.moveTo(x, 0).lineTo(x, pageSize.height);
  }
  for (let y = 0; y <= pageSize.height; y += grid.size) {
    graphics.moveTo(0, y).lineTo(pageSize.width, y);
  }
  graphics.stroke({ width: 1, color: '#000000', alpha: 0.08 });
}

export interface CanvasHostProps {
  onReady?: (app: Application, pageContainer: Container) => void;
  // Kept in sync with the *current* SceneReconciler across page switches
  // and document reloads (both call remountPage, which creates a new
  // instance) — a one-shot onReady callback can't track that, since it
  // only fires once at initial mount. Editor.tsx reads reconcilerRef.current
  // at export time (exportSvg needs the live per-node display objects).
  reconcilerRef?: MutableRefObject<SceneReconciler | null>;
}

// The only component allowed to touch PIXI.Application directly.
export function CanvasHost({ onReady, reconcilerRef }: CanvasHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const store = useEditorStoreApi();

  useEffect(() => {
    let cancelled = false;
    const app = new Application();
    const pageContainer = new Container();
    let reconciler: SceneReconciler | null = null;
    let unsubscribe: (() => void) | null = null;
    let unsubscribeCamera: (() => void) | null = null;
    let unsubscribeGrid: (() => void) | null = null;
    let detachViewportControls: (() => void) | null = null;
    let detachPan: (() => void) | null = null;

    (async () => {
      const state = store.getState();
      const page = activePage(state) ?? state.document.pages[0];

      await app.init({
        width: page.size.width,
        height: page.size.height,
        background: backgroundColor(page.background),
        antialias: true,
        // Thiếu hai dòng này thì backing store chỉ bằng số CSS pixel: trên màn
        // retina (devicePixelRatio = 2) mọi thứ được vẽ ở nửa độ phân giải rồi
        // để trình duyệt phóng to — đó là nguồn gốc chữ bị mờ. autoDensity giữ
        // canvas.style bằng đúng page.size nên toạ độ CSS (viewport.ts,
        // SelectionOverlay, ruler) không phải đổi gì.
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      if (cancelled) {
        app.destroy(true);
        return;
      }

      hostRef.current?.appendChild(app.canvas);
      app.stage.addChild(pageContainer);
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      const applyCamera = () => {
        const { camera } = store.getState();
        pageContainer.scale.set(camera.zoom);
        pageContainer.position.set(camera.panX, camera.panY);
      };
      applyCamera();
      unsubscribeCamera = store.subscribe((state, prevState) => {
        if (state.camera !== prevState.camera) applyCamera();
      });
      detachViewportControls = attachViewportControls(app.canvas as HTMLCanvasElement, store);
      detachPan = attachPan(app.canvas as HTMLCanvasElement, store);
      attachMarquee(app.stage, pageContainer, store);

      const gridGraphics = new Graphics();
      gridGraphics.eventMode = 'none';
      pageContainer.addChild(gridGraphics);
      drawGrid(gridGraphics, page.size, store.getState().grid);
      unsubscribeGrid = store.subscribe((state, prevState) => {
        if (state.grid !== prevState.grid) drawGrid(gridGraphics, page.size, state.grid);
      });

      reconciler = new SceneReconciler(pageContainer, (obj, node) => {
        attachDrag(obj, node, store, app.stage, pageContainer);
      });
      reconciler.mount(page, state.document);
      if (reconcilerRef) reconcilerRef.current = reconciler;

      // Shared by both "load a whole new document" and "switch active
      // page" below — both need the scene rebuilt against a different
      // Page, and (unlike a same-size document reload) a page switch can
      // also change canvas size/background, which the renderer doesn't
      // pick up on its own.
      const remountPage = (newPage: Page, doc: Document) => {
        reconciler?.destroy();
        pageContainer.removeChildren();
        if (app.renderer.width !== newPage.size.width || app.renderer.height !== newPage.size.height) {
          app.renderer.resize(newPage.size.width, newPage.size.height);
        }
        app.renderer.background.color = backgroundColor(newPage.background);
        pageContainer.addChild(gridGraphics);
        drawGrid(gridGraphics, newPage.size, store.getState().grid);
        reconciler = new SceneReconciler(pageContainer, (obj, node) => {
          attachDrag(obj, node, store, app.stage, pageContainer);
        });
        reconciler.mount(newPage, doc);
        if (reconcilerRef) reconcilerRef.current = reconciler;
      };

      unsubscribe = store.subscribe((state, prevState) => {
        if (state.document !== prevState.document && state.lastCommand === null) {
          // Wholesale replacement (EditorHandle.loadDocument), not a
          // command-driven change — rebuild the scene from scratch rather
          // than trying to targeted-diff into an unrelated document.
          const newPage = activePage(state) ?? state.document.pages[0];
          remountPage(newPage, state.document);
          return;
        }
        if (state.activePageId !== prevState.activePageId) {
          // Switching pages (or RemovePage reassigning activePageId away
          // from a page that no longer exists) changes what should be on
          // screen without necessarily touching `document`/`lastCommand`
          // in a way the branches below react to — remount explicitly.
          const newPage = activePage(state) ?? state.document.pages[0];
          remountPage(newPage, state.document);
          return;
        }
        if (state.lastCommand && state.lastCommand !== prevState.lastCommand) {
          reconciler?.apply(state.lastCommand, state.document);
        }
      });

      onReady?.(app, pageContainer);
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
      unsubscribeCamera?.();
      unsubscribeGrid?.();
      detachViewportControls?.();
      detachPan?.();
      reconciler?.destroy();
      if (reconcilerRef) reconcilerRef.current = null;
      if (app.renderer) app.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mounts the Pixi app exactly once
  }, []);

  return <div ref={hostRef} className="relative inline-block" />;
}
