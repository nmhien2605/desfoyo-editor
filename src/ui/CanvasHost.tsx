import { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { SceneReconciler } from '../render/SceneReconciler';
import { attachDrag } from '../render/interactions/drag';
import { attachViewportControls, attachPan } from '../render/interactions/viewportControls';
import { attachMarquee } from '../render/interactions/marquee';
import { setRenderer } from '../render/rendererContext';
import { fillToColor } from '../render/fillToColor';
import { useEditorStoreApi } from './EditorContext';
import type { GridSettings } from '../core/store';
import type { PageBackground, Size } from '../schema';

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
}

// The only component allowed to touch PIXI.Application directly.
export function CanvasHost({ onReady }: CanvasHostProps) {
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
      const { document, activePageId } = store.getState();
      const page = document.pages.find((p) => p.id === activePageId) ?? document.pages[0];

      await app.init({
        width: page.size.width,
        height: page.size.height,
        background: backgroundColor(page.background),
        antialias: true,
      });
      if (cancelled) {
        app.destroy(true);
        return;
      }

      setRenderer(app.renderer);
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
      reconciler.mount(page, document);

      unsubscribe = store.subscribe((state, prevState) => {
        if (state.document !== prevState.document && state.lastCommand === null) {
          // Wholesale replacement (EditorHandle.loadDocument), not a
          // command-driven change — rebuild the scene from scratch rather
          // than trying to targeted-diff into an unrelated document.
          reconciler?.destroy();
          pageContainer.removeChildren();
          const newPage =
            state.document.pages.find((p) => p.id === state.activePageId) ?? state.document.pages[0];
          pageContainer.addChild(gridGraphics);
          drawGrid(gridGraphics, newPage.size, state.grid);
          reconciler = new SceneReconciler(pageContainer, (obj, node) => {
            attachDrag(obj, node, store, app.stage, pageContainer);
          });
          reconciler.mount(newPage, state.document);
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
      if (app.renderer) app.destroy(true);
      setRenderer(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mounts the Pixi app exactly once
  }, []);

  return <div ref={hostRef} className="relative inline-block" />;
}
