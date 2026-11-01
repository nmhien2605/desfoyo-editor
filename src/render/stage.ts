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
  /** Display-only 2px dashed border around the page, plus 4 corner squares when `corners`. */
  outline?: { color: string; corners?: boolean };
  /** Max zoom as a multiple of the fit zoom. Default 4. */
  maxZoom?: number;
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

// Camera that shows `rect` whole (contain) and centred in a canvas of `canvas` CSS px.
export function fitCamera(canvas: Size, rect: WorldRect): Camera {
  const zoom = Math.min(canvas.width / rect.width, canvas.height / rect.height);
  return {
    zoom,
    panX: (canvas.width - rect.width * zoom) / 2 - rect.x * zoom,
    panY: (canvas.height - rect.height * zoom) / 2 - rect.y * zoom,
  };
}

export function clampStageZoom(zoom: number, fitZoom: number, maxZoom = DEFAULT_STAGE_MAX_ZOOM): number {
  return Math.min(fitZoom * maxZoom, Math.max(fitZoom, zoom));
}

// What the pan clamp needs: canvas CSS size and the backdrop in world units.
export interface StageBounds {
  canvas: Size;
  backdrop: WorldRect;
}

// Per axis: a backdrop wider than the canvas must keep covering it, a narrower one stays centred.
export function clampStagePan(camera: Camera, { canvas, backdrop }: StageBounds): Camera {
  const axis = (pan: number, view: number, start: number, length: number) => {
    const size = length * camera.zoom;
    const offset = start * camera.zoom;
    if (size <= view) return (view - size) / 2 - offset;
    return Math.min(-offset, Math.max(view - size - offset, pan));
  };
  return {
    zoom: camera.zoom,
    panX: axis(camera.panX, canvas.width, backdrop.x, backdrop.width),
    panY: axis(camera.panY, canvas.height, backdrop.y, backdrop.height),
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
