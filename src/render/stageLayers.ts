import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { DropShadowFilter } from 'pixi-filters';
import type { Page } from '../schema';
import { backgroundAlpha, backgroundColor } from './backgroundColor';
import { acquireImage, releaseImage } from './renderers/imageRenderer';
import { backdropRect, type EditorStage, type WorldRect } from './stage';

// Display-only layers around pageContainer for EditorProps.stage, in world
// order: backdrop → page fill (pageColor + document background, shadow) →
// clip (pageContainer, masked to the page rect). Siblings of pageContainer,
// not children, so exportCanvas (which extracts pageContainer) never sees them.
// The dashed outline is a DOM overlay (StageOutline in Editor.tsx).
export function createStageLayers(world: Container, pageContainer: Container, onBackdropLoad: () => void) {
  const backdrop = new Sprite(Texture.EMPTY);
  const pageFill = new Graphics();
  const clip = new Container();
  const mask = new Graphics();
  backdrop.eventMode = 'none';
  pageFill.eventMode = 'none';
  mask.eventMode = 'none';
  clip.addChild(pageContainer);
  world.addChild(backdrop, pageFill, clip, mask);
  const shadow = new DropShadowFilter({ offset: { x: 0, y: 4 }, blur: 8, alpha: 0.3, color: 0x000000 });

  let url: string | null = null;
  let rect: WorldRect | null = null;
  let current: { stage: EditorStage; page: Page } | null = null;

  const place = () => {
    rect = null;
    if (!current || backdrop.texture === Texture.EMPTY) return;
    rect = backdropRect(current.page.size, backdrop.texture, current.stage);
    backdrop.position.set(rect.x, rect.y);
    backdrop.setSize(rect.width, rect.height);
  };

  // Decoded backdrops are shared (refcounted) with every editor showing the
  // same URL. The shown one is released only when replaced, so a case-colour
  // switch keeps the old backdrop on screen until the new one has decoded.
  let shownUrl: string | null = null;
  const setTexture = (texture: Texture, src: string | null) => {
    backdrop.texture = texture;
    if (shownUrl !== null) releaseImage(shownUrl);
    shownUrl = src;
  };

  return {
    sync(stage: EditorStage | null, page: Page) {
      current = stage ? { stage, page } : null;
      backdrop.visible = pageFill.visible = mask.visible = !!stage;
      clip.mask = stage ? mask : null;
      pageFill.clear();
      mask.clear();
      if (!stage) {
        url = null;
        setTexture(Texture.EMPTY, null);
        rect = null;
        return;
      }
      const { width, height } = page.size;
      if (stage.pageColor) pageFill.rect(0, 0, width, height).fill(stage.pageColor);
      // The renderer background is transparent in stage mode, so the page background is drawn here, inside the page rect.
      pageFill.rect(0, 0, width, height).fill({ color: backgroundColor(page.background), alpha: backgroundAlpha(page.background) });
      pageFill.filters = stage.pageShadow ? [shadow] : [];
      mask.rect(0, 0, width, height).fill(0xffffff);

      if (stage.backdropUrl !== url) {
        url = stage.backdropUrl;
        const requested = url;
        acquireImage(requested)
          .then((texture) => {
            if (url !== requested) return releaseImage(requested);
            setTexture(texture, requested);
            place();
            onBackdropLoad();
          })
          .catch((err: unknown) => console.warn('[desfoyo/editor] stage backdrop failed to load', err));
      }
      place();
    },
    /** Backdrop rect in world units, or null until it has loaded. */
    backdropRect: () => rect,
    destroy() {
      url = null;
      setTexture(Texture.EMPTY, null);
      shadow.destroy();
    },
  };
}
