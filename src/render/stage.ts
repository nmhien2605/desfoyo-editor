import type { Size } from '../schema';
import type { Camera, Point } from './viewport';

// EditorProps.stage: the editor also shows a mockup image (shirt, frame, case)
// around the page. Display only — none of it is in the document or exports.
export interface EditorStage {
  /** Mockup image drawn under the page. */
  backdropUrl: string;
  /** Page centre, as a 0..1 fraction of the image. */
  pageCenter: { x: number; y: number };
  /** Largest box the page may take, as a 0..1 fraction of the image; the page fits it uniformly (contain). */
  pageBox: { width: number; height: number };
  /** Display-only fill under the page (not exported), e.g. "#fff". */
  pageColor?: string;
  /** Drop shadow around the page. */
  pageShadow?: boolean;
  /** Display-only 2px border around the page (dashed unless `dashed: false`), plus 4 corner squares when `corners`. */
  outline?: { color: string; corners?: boolean; dashed?: boolean };
  /** Max zoom as a multiple of the fit zoom. Default 4. */
  maxZoom?: number;
  /**
   * CSS px kept free around the backdrop at the fit view (and kept covered/centred by the pan clamp);
   * the canvas itself still fills its box, so zoomed content draws up to its edges. Default 0.
   */
  fitInset?: number | Inset;
}

export interface Inset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function toInset(inset: EditorStage['fitInset'] = 0): Inset {
  return typeof inset === 'number' ? { top: inset, right: inset, bottom: inset, left: inset } : inset;
}

export const DEFAULT_STAGE_MAX_ZOOM = 4;

export interface WorldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Where the backdrop sits in world (page) units, with the page kept at
// (0,0)–(page.size). k = image pixels per page unit, picked so the page fits
// pageBox — same formula the web's TextureEditor used for its `scale`.
// Only the image's aspect matters: scaling it scales k by the same factor.
export function backdropRect(page: Size, image: Size, stage: Pick<EditorStage, 'pageCenter' | 'pageBox'>): WorldRect {
  const k = Math.min(
    (image.width * stage.pageBox.width) / page.width,
    (image.height * stage.pageBox.height) / page.height,
  );
  const width = image.width / k;
  const height = image.height / k;
  // pageCenter × size is the page centre in backdrop-local units; shift the
  // backdrop so that point lands on the page centre.
  return {
    x: page.width / 2 - stage.pageCenter.x * width,
    y: page.height / 2 - stage.pageCenter.y * height,
    width,
    height,
  };
}

// Camera that shows `rect` whole (contain) and centred in a canvas of `canvas` CSS px, minus `inset`.
export function fitCamera(canvas: Size, rect: WorldRect, inset: Inset = toInset()): Camera {
  const width = Math.max(1, canvas.width - inset.left - inset.right);
  const height = Math.max(1, canvas.height - inset.top - inset.bottom);
  const zoom = Math.min(width / rect.width, height / rect.height);
  return {
    zoom,
    panX: inset.left + (width - rect.width * zoom) / 2 - rect.x * zoom,
    panY: inset.top + (height - rect.height * zoom) / 2 - rect.y * zoom,
  };
}

export function clampStageZoom(zoom: number, fitZoom: number, maxZoom = DEFAULT_STAGE_MAX_ZOOM): number {
  return Math.min(fitZoom * maxZoom, Math.max(fitZoom, zoom));
}

// What the pan clamp needs: canvas CSS size, the backdrop in world units and the fit inset.
export interface StageBounds {
  canvas: Size;
  backdrop: WorldRect;
  inset?: Inset;
}

// Per axis, against the canvas minus the inset: a larger backdrop must keep covering it, a smaller one stays centred.
export function clampStagePan(camera: Camera, { canvas, backdrop, inset = toInset() }: StageBounds): Camera {
  const axis = (pan: number, from: number, to: number, start: number, length: number) => {
    const view = Math.max(1, to - from);
    const size = length * camera.zoom;
    const offset = start * camera.zoom;
    if (size <= view) return from + (view - size) / 2 - offset;
    return Math.min(from - offset, Math.max(from + view - size - offset, pan));
  };
  return {
    zoom: camera.zoom,
    panX: axis(camera.panX, inset.left, canvas.width - inset.right, backdrop.x, backdrop.width),
    panY: axis(camera.panY, inset.top, canvas.height - inset.bottom, backdrop.y, backdrop.height),
  };
}

// Camera at `zoom` that puts the world point that was under `from` (in
// `start`) under `to` — wheel zoom (from = to = cursor) and pinch (midpoints).
export function anchoredCamera(start: Camera, from: Point, to: Point, zoom: number): Camera {
  return {
    zoom,
    panX: to.x - ((from.x - start.panX) / start.zoom) * zoom,
    panY: to.y - ((from.y - start.panY) / start.zoom) * zoom,
  };
}
