import type { TextNode, Warp, WarpType } from '../schema';
import { useEditorStoreApi } from './EditorContext';
import { getLoadedFont } from '../text/fontService';
import { measureText } from '../text/textGeometry';

export const DEFAULT_WARP_CURVE_HEIGHT = 0.5;

export const WARP_TYPES: WarpType[] = [
  'custom',
  'distort',
  'circle',
  'angle',
  'arch',
  'rise',
  'wave',
  'flag',
];

export const ENABLED_WARP_TYPES: WarpType[] = [
  'wave',
  'arch',
  'rise',
  'flag',
  'angle',
  'circle',
  'distort',
  'custom',
];

export function setWarpType(warp: Warp | undefined, type: WarpType): Warp {
  return {
    type,
    curveHeight: warp?.curveHeight ?? DEFAULT_WARP_CURVE_HEIGHT,
    directionInverted: warp?.directionInverted ?? false,
  };
}

export function setWarpCurveHeight(warp: Warp | undefined, curveHeight: number): Warp {
  return {
    type: warp?.type ?? 'wave',
    curveHeight: Math.min(4, Math.max(-1, curveHeight)),
    directionInverted: warp?.directionInverted ?? false,
  };
}

export function resetWarp(warp: Warp | undefined): Warp {
  return { type: warp?.type ?? 'none', curveHeight: DEFAULT_WARP_CURVE_HEIGHT, directionInverted: false };
}

export function toggleCircleDirectionInverted(warp: Warp | undefined): Warp {
  return {
    type: warp?.type ?? 'circle',
    curveHeight: warp?.curveHeight ?? DEFAULT_WARP_CURVE_HEIGHT,
    paths: warp?.paths,
    circle: warp?.circle,
    directionInverted: !(warp?.directionInverted ?? false),
  };
}

// Doi warp.type dong nghia doi warped (true/false) trong textGeometry.ts, ma
// warped quyet dinh pivotWidth = advanceWidth (co warp) hay width (khong
// warp, tinh ca letterSpacing) — hai cong thuc khac nhau. Neu patch chi co
// warp (khong do lai size), node.size giu gia tri CU (theo cong thuc TRUOC
// khi doi type) cho toi khi component khac (PropertiesPanel.tsx's
// reconcileStaleSize, chay khi CHON LAI node) phat hien lech va tu sua — luc
// do pivot doi dot ngot, nhin nhu node "nhay" vi tri ngay luc click chon.
// Do lai va ghi thang size cung patch (giong applyWithMeasure trong
// PropertiesPanel.tsx) de node.size khong bao gio bi stale. Tach rieng khoi
// component de test duoc doc lap (khong can render React).
export function warpUpdatePatch(
  node: TextNode,
  font: Parameters<typeof measureText>[1] | null,
  next: Warp,
): Partial<TextNode> {
  const size = font ? measureText({ ...node, warp: next }, font) : undefined;
  return (size ? { warp: next, size } : { warp: next }) as Partial<TextNode>;
}

export function TransformationControls({
  node,
  activePageId,
}: {
  node: TextNode;
  activePageId: string;
}) {
  const store = useEditorStoreApi();
  const warp = node.warp;
  const active = warp?.type ?? 'none';

  const apply = (next: Warp) => {
    const font = getLoadedFont(node.font.family)?.font ?? null;
    store.getState().dispatch({
      type: 'UpdateProps',
      pageId: activePageId,
      nodeId: node.id,
      patch: warpUpdatePatch(node, font, next),
    });
  };

  return (
    <section className="kittl-section">
      <div className="kittl-section-title">Transformation</div>

      <div className="grid grid-cols-4 gap-1.5">
        {ENABLED_WARP_TYPES.map((type) => {
          const isActive = active === type;
          return (
            <button
              key={type}
              type="button"
              title={type}
              onClick={() => apply(setWarpType(warp, type))}
              className="flex flex-col items-center justify-center rounded-lg text-[11px] font-semibold uppercase"
              style={{
                width: 50,
                height: 52,
                background: isActive ? '#263442' : '#252c37',
                border: isActive ? '2px solid #58a8de' : '1px solid #303846',
                color: 'var(--text-muted)',
              }}
            >
              {type}
            </button>
          );
        })}
      </div>

      {active !== 'none' && active !== 'circle' && active !== 'custom' && active !== 'distort' && (
        <>
          <label className="mt-3 flex flex-col gap-1 capitalize text-xs" style={{ color: 'var(--text-muted)' }}>
            {active} Curve — {Math.round((warp?.curveHeight ?? 0) * 100)}%
            <input
              type="range"
              min={-1}
              max={4}
              step={0.01}
              value={warp?.curveHeight ?? 0}
              className="kittl-range"
              onPointerDown={() => store.getState().beginGesture(`warp-curve:${node.id}`)}
              onPointerUp={() => store.getState().endGesture()}
              onChange={(e) => apply(setWarpCurveHeight(warp, Number(e.target.value)))}
            />
          </label>
        </>
      )}

      {active === 'circle' && (
        <label className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <input
            type="checkbox"
            checked={warp?.directionInverted ?? false}
            onChange={() => apply(toggleCircleDirectionInverted(warp))}
          />
          Direction Inverted
        </label>
      )}

      {(active !== 'none' || warp) && (
        <button
          type="button"
          onClick={() => apply(resetWarp(warp))}
          className="mt-3 w-full rounded-lg px-3 py-2 text-xs"
          style={{ background: '#252c37', border: '1px solid #303846', color: 'var(--text-muted)' }}
        >
          Reset
        </button>
      )}
    </section>
  );
}
