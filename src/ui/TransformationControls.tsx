import type { TextNode, Warp, WarpType } from '../schema';
import { useEditorStoreApi } from './EditorContext';

export const DEFAULT_WARP_CURVE_HEIGHT = 0.5;

// Đúng lưới 4 cột x 2 hàng của panel Transformation trong docs/text-effect.md.
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

// wave/arch/rise/flag/angle dùng chung engine (buildWarpMap/warpContours) —
// xem docs/text-future-work.md mục 5. circle/distort/custom cần envelope
// warp riêng, vẫn khoá.
export const ENABLED_WARP_TYPES: WarpType[] = ['wave', 'arch', 'rise', 'flag', 'angle'];

export function setWarpType(warp: Warp | undefined, type: WarpType): Warp {
  // paths bị xoá khi đổi kiểu: một path do user chỉnh cho Wave không còn ý
  // nghĩa gì với Arch hay Circle.
  return { type, curveHeight: warp?.curveHeight ?? DEFAULT_WARP_CURVE_HEIGHT };
}

// Kéo slider = quay về chế độ preset, nên paths bị xoá. Đây là cách slider và
// handle không tranh nhau một nguồn dữ liệu (spec §4.2).
export function setWarpCurveHeight(warp: Warp | undefined, curveHeight: number): Warp {
  return {
    type: warp?.type ?? 'wave',
    curveHeight: Math.min(4, Math.max(-1, curveHeight)),
  };
}

export function resetWarp(warp: Warp | undefined): Warp {
  return { type: warp?.type ?? 'none', curveHeight: DEFAULT_WARP_CURVE_HEIGHT };
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
    store.getState().dispatch({
      type: 'UpdateProps',
      pageId: activePageId,
      nodeId: node.id,
      patch: { warp: next } as Partial<TextNode>,
    });
  };

  return (
    <div className="flex flex-col gap-2 border-t border-gray-200 pt-2">
      <span className="font-medium">Transformation</span>

      <div className="grid grid-cols-4 gap-1">
        {WARP_TYPES.map((type) => {
          const enabled = ENABLED_WARP_TYPES.includes(type);
          return (
            <button
              key={type}
              type="button"
              disabled={!enabled}
              title={enabled ? type : `${type} — chua build`}
              onClick={() => apply(setWarpType(warp, type))}
              className={`rounded px-1 py-1 text-xs capitalize disabled:opacity-40 ${
                active === type ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {active !== 'none' && (
        <>
          <label className="flex flex-col gap-1 capitalize">
            {active} Curve — {Math.round((warp?.curveHeight ?? 0) * 100)}%
            <input
              type="range"
              min={-1}
              max={4}
              step={0.01}
              value={warp?.curveHeight ?? 0}
              onPointerDown={() => store.getState().beginGesture(`warp-curve:${node.id}`)}
              onPointerUp={() => store.getState().endGesture()}
              onChange={(e) => apply(setWarpCurveHeight(warp, Number(e.target.value)))}
            />
          </label>

          <button
            type="button"
            onClick={() => apply(resetWarp(warp))}
            className="rounded bg-gray-100 px-2 py-1 text-xs"
          >
            Reset
          </button>
        </>
      )}
    </div>
  );
}
