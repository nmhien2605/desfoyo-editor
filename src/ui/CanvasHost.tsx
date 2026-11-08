import { useEffect, useRef, type MutableRefObject } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { SceneReconciler } from '../render/SceneReconciler';
import { attachDrag } from '../render/interactions/drag';
import { attachViewportControls, attachPan } from '../render/interactions/viewportControls';
import { attachMarquee } from '../render/interactions/marquee';
import { attachDoubleTapReset } from '../render/interactions/stageGestures';
import { backgroundAlpha, backgroundColor } from '../render/backgroundColor';
import { onLoadSettled } from '../render/pendingLoads';
import { onFontLoaded } from '../text/fontService';
import { createStageLayers } from '../render/stageLayers';
import { fitCamera } from '../render/stage';
import { useEditorStore, useEditorStoreApi } from './EditorContext';
import { activePage, type GridSettings } from '../core/store';
import type { Document, Page, Size } from '../schema';

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
  const staged = useEditorStore((s) => s.stage != null);

  useEffect(() => {
    let cancelled = false;
    const app = new Application();
    const pageContainer = new Container();
    // Camera transform lives here; pageContainer stays identity inside it, so
    // getLocalPosition(pageContainer) still yields world (page) units.
    const world = new Container();
    let reconciler: SceneReconciler | null = null;
    let unsubscribe: (() => void) | null = null;
    let unsubscribeCamera: (() => void) | null = null;
    let unsubscribeGrid: (() => void) | null = null;
    let detachViewportControls: (() => void) | null = null;
    let detachPan: (() => void) | null = null;
    let frame = 0;
    let unsubscribeRender: (() => void)[] = [];
    let resizeObserver: ResizeObserver | null = null;
    let stageLayers: ReturnType<typeof createStageLayers> | null = null;

    (async () => {
      const state = store.getState();
      const page = activePage(state) ?? state.document.pages[0];

      // Canvas CSS size = page size × host viewScale (1 when unset); the camera
      // zoom (pinned to viewScale by the store) scales the content to match.
      // In stage mode it is the host element's size instead.
      const scaledSize = (size: Size) => {
        if (store.getState().stage && hostRef.current) {
          return { width: Math.max(1, hostRef.current.clientWidth), height: Math.max(1, hostRef.current.clientHeight) };
        }
        const s = store.getState().viewScale ?? 1;
        return { width: size.width * s, height: size.height * s };
      };
      const initialSize = scaledSize(page.size);
      // Capped at 2: DPR 3 phones would otherwise pay 2.25× the GPU memory per
      // editor for no visible gain. MSAA only below DPR 2 — at ≥ 2 aliasing is
      // invisible and the ×4 framebuffer is the biggest per-context cost.
      const resolution = Math.min(window.devicePixelRatio || 1, 2);

      await app.init({
        width: initialSize.width,
        height: initialSize.height,
        background: backgroundColor(page.background),
        // Always init transparent-capable, then set the real alpha per page —
        // Pixi can't switch an opaque-initialised canvas to transparent later.
        backgroundAlpha: 0,
        antialias: resolution < 2,
        // Thiếu hai dòng này thì backing store chỉ bằng số CSS pixel: trên màn
        // retina (devicePixelRatio = 2) mọi thứ được vẽ ở nửa độ phân giải rồi
        // để trình duyệt phóng to — đó là nguồn gốc chữ bị mờ. autoDensity giữ
        // canvas.style bằng đúng page.size nên toạ độ CSS (viewport.ts,
        // SelectionOverlay, ruler) không phải đổi gì.
        resolution,
        autoDensity: true,
      });
      if (cancelled) {
        // Not destroy(true): that also releases Pixi's global pools and breaks every other live renderer (see headlessRender.ts).
        app.destroy({ removeView: true });
        return;
      }

      hostRef.current?.appendChild(app.canvas);

      // Render on demand: nothing animates, so the scene only changes via the
      // store, an image/SVG load landing, or a font landing. rAF-deferred, so
      // it runs after every synchronous subscriber below has updated the scene
      // and coalesces a burst of changes into one render.
      app.ticker.stop();
      const requestRender = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          app.render();
        });
      };
      unsubscribeRender = [store.subscribe(requestRender), onLoadSettled(requestRender), onFontLoaded(requestRender)];
      app.stage.addChild(world);
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      // refit is a no-op when the new backdrop has the same rect (e.g. another case colour), so draw explicitly.
      stageLayers = createStageLayers(world, pageContainer, () => {
        refit();
        requestRender();
      });

      const applyCamera = () => {
        const { camera } = store.getState();
        world.scale.set(camera.zoom);
        world.position.set(camera.panX, camera.panY);
      };
      const resizeToFit = () => {
        const state = store.getState();
        const { width, height } = scaledSize((activePage(state) ?? state.document.pages[0]).size);
        if (app.renderer.width !== width || app.renderer.height !== height) app.renderer.resize(width, height);
      };
      // Stage mode: the fit target is the backdrop, or the page until the backdrop loads.
      const refit = () => {
        const state = store.getState();
        if (!state.stage) return;
        const page = activePage(state) ?? state.document.pages[0];
        const bounds = {
          canvas: { width: app.screen.width, height: app.screen.height },
          backdrop: stageLayers?.backdropRect() ?? { x: 0, y: 0, ...page.size },
        };
        // Undo/redo and loadDocument also land here; same bounds must keep the user's zoom.
        if (JSON.stringify(bounds) === JSON.stringify(state.stageBounds)) return;
        state.setStageFit(fitCamera(bounds.canvas, bounds.backdrop), bounds);
      };
      // Stage mode keeps the renderer clear so the backdrop shows; the page background is a stage layer instead.
      const syncStage = () => {
        const state = store.getState();
        const page = activePage(state) ?? state.document.pages[0];
        app.renderer.background.alpha = state.stage ? 0 : backgroundAlpha(page.background);
        // Inline canvas would leave a baseline gap under it inside the host box.
        (app.canvas as HTMLCanvasElement).style.display = state.stage ? 'block' : '';
        stageLayers?.sync(state.stage, page);
        resizeToFit();
        refit();
      };
      applyCamera();
      unsubscribeCamera = store.subscribe((state, prevState) => {
        if (state.camera !== prevState.camera) applyCamera();
        if (state.viewScale !== prevState.viewScale) resizeToFit();
        if (state.stage !== prevState.stage) syncStage();
      });
      if (hostRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (!store.getState().stage) return;
          resizeToFit();
          refit();
        });
        resizeObserver.observe(hostRef.current);
      }
      detachViewportControls = attachViewportControls(app.canvas as HTMLCanvasElement, store);
      detachPan = attachPan(app.canvas as HTMLCanvasElement, store);
      attachMarquee(app.stage, pageContainer, store);
      attachDoubleTapReset(app.stage, store);

      const gridGraphics = new Graphics();
      gridGraphics.eventMode = 'none';
      unsubscribeGrid = store.subscribe((state, prevState) => {
        if (state.grid !== prevState.grid) {
          drawGrid(gridGraphics, (activePage(state) ?? state.document.pages[0]).size, state.grid);
        }
      });

      // Shared by the initial mount, "load a whole new document" and "switch
      // active page" below — all need the scene built against a Page that may
      // differ in size/background from what the renderer currently has.
      const remountPage = (newPage: Page, doc: Document) => {
        reconciler?.destroy();
        pageContainer.removeChildren();
        app.renderer.background.color = backgroundColor(newPage.background);
        syncStage();
        pageContainer.addChild(gridGraphics);
        drawGrid(gridGraphics, newPage.size, store.getState().grid);
        reconciler = new SceneReconciler(pageContainer, (obj, node) => {
          attachDrag(obj, node, store, app.stage, pageContainer);
        });
        reconciler.mount(newPage, doc);
        if (reconcilerRef) reconcilerRef.current = reconciler;
      };

      // Re-read after the await: the host may have called loadDocument/addNode
      // while Pixi was initialising, and the pre-init snapshot would drop it.
      const current = store.getState();
      remountPage(activePage(current) ?? current.document.pages[0], current.document);
      requestRender();

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
      resizeObserver?.disconnect();
      stageLayers?.destroy();
      cancelAnimationFrame(frame);
      for (const off of unsubscribeRender) off();
      reconciler?.destroy();
      if (reconcilerRef) reconcilerRef.current = null;
      if (app.renderer) app.destroy({ removeView: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mounts the Pixi app exactly once
  }, []);

  // Stage mode: fills the Editor's box and the canvas follows it (ResizeObserver above).
  return <div ref={hostRef} className={staged ? 'absolute inset-0 overflow-hidden' : 'relative inline-block'} />;
}
