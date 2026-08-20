import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEditorStoreApi } from './EditorContext';
import type { Viewport } from '../render/viewport';
import { rotateVector } from '../render/interactions/resizeMath';
import { startPointerGesture } from '../render/interactions/pointerGesture';
import { getLoadedFont } from '../text/fontService';
import { resolveCircleParams, textGeometry } from '../text/textGeometry';
import { projectLocalPoint } from './WarpHandlesOverlay';
import type { CircleParams, Node, TextNode } from '../schema';

export type CircleHandleRef = 'N' | 'S' | 'W' | 'E';

const OPPOSITE: Record<CircleHandleRef, CircleHandleRef> = { N: 'S', S: 'N', W: 'E', E: 'W' };

// Neo la HANDLE DOI DIEN (khong phai tam) — keo E thi W dung yen, tam phai
// dich toi trung diem (W, E-moi). Day la cach duy nhat hop ly ve hinh hoc:
// giu 1 diem tren duong tron co dinh thi tam BAT BUOC di theo, tru khi keo
// dung xuyen tam cu (xem thao luan trong ke hoach — da xac nhan voi user).
// Ham thuan tuy 2 diem: anchor + diem vua keo toi la 2 dau mut duong kinh.
export function circleParamsFromHandleDrag(
  anchorPointPx: { x: number; y: number },
  currentPointPx: { x: number; y: number },
  fontSize: number,
): CircleParams {
  const cx = (anchorPointPx.x + currentPointPx.x) / 2;
  const cy = (anchorPointPx.y + currentPointPx.y) / 2;
  const r = Math.hypot(currentPointPx.x - anchorPointPx.x, currentPointPx.y - anchorPointPx.y) / 2;
  return { centerX: cx / fontSize, centerY: cy / fontSize, radius: r / fontSize };
}

function handlePointsPx(
  params: CircleParams,
  fontSize: number,
): Record<CircleHandleRef, { x: number; y: number }> {
  const cx = params.centerX * fontSize;
  const cy = params.centerY * fontSize;
  const r = params.radius * fontSize;
  return {
    N: { x: cx, y: cy - r },
    S: { x: cx, y: cy + r },
    W: { x: cx - r, y: cy },
    E: { x: cx + r, y: cy },
  };
}

export function CircleHandlesOverlay({
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
  const params = resolveCircleParams(node, geometry);
  if (!params) return null;

  const fontSize = node.font.size;
  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;
  const pivot = { x: originX * node.size.width, y: originY * node.size.height };

  // Nhan point vao la TOA DO PIXEL cuc bo (khong phai normalized) — cxPx/rPx
  // da tinh san bang pixel qua handlePointsPx.
  const toScreen = (point: { x: number; y: number }) =>
    projectLocalPoint(point, pivot, node.transform, viewport);

  const points = handlePointsPx(params, fontSize);

  const startDrag = (ref: CircleHandleRef) => (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    const startPointPx = points[ref];
    // Chot vi tri PIXEL cua handle DOI DIEN mot lan luc bat dau keo — giu co
    // dinh suot gesture, khong tinh lai moi frame (neu tinh lai se dung
    // `params` cu moi frame, van dung vi params khong doi trong React render
    // nay, nhung chot 1 lan ro rang hon ve y dinh va tranh phu thuoc ngam).
    const anchorPointPx = points[OPPOSITE[ref]];

    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      const local = rotateVector(worldDelta, -node.transform.rotation);
      const deltaPx = {
        x: local.x / (node.transform.scaleX || 1),
        y: local.y / (node.transform.scaleY || 1),
      };
      const nextLocalPointPx = { x: startPointPx.x + deltaPx.x, y: startPointPx.y + deltaPx.y };
      const nextParams = circleParamsFromHandleDrag(anchorPointPx, nextLocalPointPx, fontSize);
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: {
          warp: {
            type: node.warp?.type ?? 'circle',
            curveHeight: node.warp?.curveHeight ?? 0,
            directionInverted: node.warp?.directionInverted ?? false,
            circle: nextParams,
          },
        } as Partial<Node>,
      });
    };
    startPointerGesture(store, `circle-handle:${node.id}`, onMove);
  };

  const cx = params.centerX * fontSize;
  const cy = params.centerY * fontSize;
  const r = params.radius * fontSize;
  const circleCenter = toScreen({ x: cx, y: cy });
  const circleEdge = toScreen({ x: cx + r, y: cy });
  const screenRadius = Math.hypot(circleEdge.x - circleCenter.x, circleEdge.y - circleCenter.y);

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <circle
          cx={circleCenter.x}
          cy={circleCenter.y}
          r={screenRadius}
          fill="none"
          stroke="#8ec9f2"
          strokeWidth={1.5}
        />
      </svg>
      {(Object.keys(points) as CircleHandleRef[]).map((ref) => {
        const screen = toScreen(points[ref]);
        return (
          <div
            key={ref}
            onPointerDown={startDrag(ref)}
            className="pointer-events-auto absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 bg-white"
            style={{ left: screen.x, top: screen.y, borderColor: '#78bde8' }}
          />
        );
      })}
    </>
  );
}
