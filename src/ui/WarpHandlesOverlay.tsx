import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEditorStoreApi } from './EditorContext';
import type { Viewport } from '../render/viewport';
import { rotateVector } from '../render/interactions/resizeMath';
import { startPointerGesture } from '../render/interactions/pointerGesture';
import { getLoadedFont } from '../text/fontService';
import { resolveWarpPath, textGeometry } from '../text/textGeometry';
import { clampPathX, curveHeightOf } from '../text/warp';
import type { Node, TextNode, WarpAnchor, WarpPath } from '../schema';

export type HandleRef = { anchor: number; kind: 'anchor' | 'in' | 'out' };

// Pivot -> scale -> rotate -> translate -> camera, tach rieng khoi component
// de test duoc doc lap (khong can render React/jsdom). Cung mot cong thuc
// worldPoint() trong SelectionOverlay.tsx dung cho handle resize, chi khac
// nguon toa do local (o day la box hinh hoc text, khong phai node.size) nen
// khong gop chung duoc thanh 1 ham dung nguyen — xem toScreen() ben duoi.
export function projectLocalPoint(
  local: { x: number; y: number },
  pivot: { x: number; y: number },
  transform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number },
  viewport: Viewport,
): { x: number; y: number } {
  const offset = rotateVector(
    { x: (local.x - pivot.x) * transform.scaleX, y: (local.y - pivot.y) * transform.scaleY },
    transform.rotation,
  );
  return viewport.toScreen({ x: transform.x + offset.x, y: transform.y + offset.y });
}

export function listHandles(path: WarpPath): HandleRef[] {
  const refs: HandleRef[] = [];
  path.anchors.forEach((anchor, index) => {
    refs.push({ anchor: index, kind: 'anchor' });
    if (anchor.in) refs.push({ anchor: index, kind: 'in' });
    if (anchor.out) refs.push({ anchor: index, kind: 'out' });
  });
  return refs;
}

function shift(point: { x: number; y: number }, delta: { x: number; y: number }) {
  return { x: point.x + delta.x, y: point.y + delta.y };
}

const EPSILON = 1e-9;

// Handle đối diện phải nằm trên đường thẳng qua anchor, hướng ngược lại handle
// vừa kéo — "smooth node" (mirror góc, KHÔNG mirror độ dài) giống các trình
// vector chuẩn (Figma/Illustrator). Nếu handle đối diện trùng anchor (độ dài
// 0) thì không có gì để giữ hướng, và nếu handle vừa kéo trùng anchor thì
// không có hướng nào để mirror theo — cả hai trường hợp giữ nguyên handle đối
// diện thay vì suy ra một hướng tuỳ tiện.
function mirrorOpposite(
  anchor: { x: number; y: number },
  moved: { x: number; y: number },
  opposite: { x: number; y: number } | undefined,
): { x: number; y: number } | undefined {
  if (!opposite) return opposite;
  const dist = Math.hypot(opposite.x - anchor.x, opposite.y - anchor.y);
  const dx = anchor.x - moved.x;
  const dy = anchor.y - moved.y;
  const len = Math.hypot(dx, dy);
  if (dist < EPSILON || len < EPSILON) return opposite;
  return { x: anchor.x + (dx / len) * dist, y: anchor.y + (dy / len) * dist };
}

// Kéo anchor thì hai handle của nó đi theo — nếu không, đoạn cong quanh anchor
// sẽ giật hình dạng ngay khi anchor nhích một chút (tài liệu §8).
export function movePathPoint(
  path: WarpPath,
  ref: HandleRef,
  delta: { x: number; y: number },
): WarpPath {
  const anchors = path.anchors.map((anchor, index): WarpAnchor => {
    if (index !== ref.anchor) return anchor;
    if (ref.kind === 'anchor') {
      return {
        ...shift(anchor, delta),
        in: anchor.in ? shift(anchor.in, delta) : undefined,
        out: anchor.out ? shift(anchor.out, delta) : undefined,
      };
    }
    // Viết tách hai nhánh thay vì dùng computed key `[ref.kind]`: TypeScript
    // nới lỏng kiểu khi key là union, làm mất tính đúng đắn của WarpAnchor.
    // Kéo một handle thì handle đối diện cũng xoay theo (mirrorOpposite) để
    // đường cong luôn mượt qua anchor, không gãy góc.
    if (ref.kind === 'in') {
      if (!anchor.in) return anchor;
      const next = shift(anchor.in, delta);
      return { ...anchor, in: next, out: mirrorOpposite(anchor, next, anchor.out) };
    }
    if (!anchor.out) return anchor;
    const next = shift(anchor.out, delta);
    return { ...anchor, out: next, in: mirrorOpposite(anchor, next, anchor.in) };
  });
  return { ...path, anchors };
}

// Path và point vẽ bằng DOM overlay ở toạ độ màn hình, không vẽ vào Pixi —
// cùng cách SelectionOverlay.tsx đang làm với handle resize/crop, nên dùng
// lại được toàn bộ toWorld/toScreen và beginGesture/endGesture.
export function WarpHandlesOverlay({
  node,
  activePageId,
  viewport,
}: {
  node: TextNode;
  activePageId: string;
  viewport: Viewport;
}) {
  const store = useEditorStoreApi();
  const font = getLoadedFont(node.font.family)?.font;
  if (!font) return null;

  const geometry = textGeometry(node, font);
  if (geometry.height <= 0) return null;
  // Cung nguon voi textGeometry: path o day chinh la path dang dung de warp,
  // nen handle nam dung tren duong ma chu dang chay.
  const path = resolveWarpPath(
    node,
    geometry.baselineY / geometry.height,
    geometry.height,
    geometry.centerY / geometry.height,
  );
  if (!path) return null;

  // advanceWidth (khong tinh letterSpacing) — dong bo voi textGeometry.ts's
  // warpShapesFromPath, de handle keo tay khong lech khoi hinh warp thuc te.
  const box = { width: geometry.advanceWidth, height: geometry.height };
  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;

  // Point của path nằm trong local space chưa xoay/chưa scale của node; đưa
  // về world rồi về screen theo đúng phép biến đổi worldPoint() trong
  // SelectionOverlay.tsx dùng cho handle resize.
  const toScreen = (point: { x: number; y: number }) => {
    const local = { x: point.x * box.width, y: point.y * box.height };
    const pivot = { x: originX * node.size.width, y: originY * node.size.height };
    return projectLocalPoint(local, pivot, node.transform, viewport);
  };

  const startDrag = (ref: HandleRef) => (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    // Chốt path tại thời điểm bắt đầu kéo. Path hiển thị chính là path được
    // lưu — không còn khái niệm bake/fit, nên khi ghi vào warp.paths, hình
    // hiển thị không đổi — điều user thấy lúc thả tay chính là điều được lưu.
    const startPath = path;

    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      const local = rotateVector(worldDelta, -node.transform.rotation);
      const delta = {
        x: local.x / (node.transform.scaleX || 1) / box.width,
        y: local.y / (node.transform.scaleY || 1) / box.height,
      };
      const nextPath = clampPathX(movePathPoint(startPath, ref, delta));
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: {
          warp: {
            type: node.warp?.type ?? 'wave',
            // Slider phai theo kip path vua keo, neu khong lan keo slider ke
            // tiep se sinh lai preset tu con so cu va hinh nhay.
            curveHeight: curveHeightOf(nextPath, box.height, node.font.size),
            paths: [nextPath],
          },
        } as Partial<Node>,
      });
    };
    startPointerGesture(store, `warp-handle:${node.id}`, onMove);
  };

  const polyline = path.anchors
    .flatMap((anchor, index) => {
      const next = path.anchors[index + 1];
      if (!next) return [];
      const p0 = toScreen(anchor);
      const p1 = toScreen(anchor.out ?? anchor);
      const p2 = toScreen(next.in ?? next);
      const p3 = toScreen(next);
      return [`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`];
    })
    .join(' ');

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <path d={polyline} fill="none" stroke="#2563eb" strokeWidth={1.5} />
        {path.anchors.map((anchor, index) => {
          const a = toScreen(anchor);
          return (
            <g key={index}>
              {anchor.in && (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={toScreen(anchor.in).x}
                  y2={toScreen(anchor.in).y}
                  stroke="#2563eb"
                  strokeWidth={1}
                />
              )}
              {anchor.out && (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={toScreen(anchor.out).x}
                  y2={toScreen(anchor.out).y}
                  stroke="#2563eb"
                  strokeWidth={1}
                />
              )}
            </g>
          );
        })}
      </svg>
      {listHandles(path).map((ref) => {
        const anchor = path.anchors[ref.anchor];
        const point = ref.kind === 'anchor' ? anchor : ref.kind === 'in' ? anchor.in! : anchor.out!;
        const screen = toScreen(point);
        return (
          <div
            key={`${ref.anchor}-${ref.kind}`}
            onPointerDown={startDrag(ref)}
            className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-blue-600 bg-white ${
              ref.kind === 'anchor' ? 'h-3 w-3' : 'h-2.5 w-2.5'
            }`}
            style={{ left: screen.x, top: screen.y }}
          />
        );
      })}
    </>
  );
}
