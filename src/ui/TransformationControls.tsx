import type { TextNode, Warp, WarpType } from '../schema';
import { useEditorStoreApi } from './EditorContext';

export const DEFAULT_WARP_INTENSITY = 0.5;

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

// v1 chỉ build Wave. 7 kiểu còn lại hiện nhưng bị khoá — xem
// docs/text-future-work.md mục 5.
export const ENABLED_WARP_TYPES: WarpType[] = ['wave'];

export function setWarpType(warp: Warp | undefined, type: WarpType): Warp {
  // paths bị xoá khi đổi kiểu: một path do user chỉnh cho Wave không còn ý
  // nghĩa gì với Arch hay Circle.
  return { type, intensity: warp?.intensity ?? DEFAULT_WARP_INTENSITY };
}

// Kéo slider = quay về chế độ preset, nên paths bị xoá. Đây là cách slider và
// handle không tranh nhau một nguồn dữ liệu (spec §4.2).
export function setWarpIntensity(warp: Warp | undefined, intensity: number): Warp {
  return {
    type: warp?.type ?? 'wave',
    intensity: Math.min(1, Math.max(0, intensity)),
  };
}

export function resetWarp(warp: Warp | undefined): Warp {
  return { type: warp?.type ?? 'none', intensity: DEFAULT_WARP_INTENSITY };
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
            {active} Curve — {Math.round((warp?.intensity ?? 0) * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={warp?.intensity ?? 0}
              onPointerDown={() => store.getState().beginGesture(`warp-intensity:${node.id}`)}
              onPointerUp={() => store.getState().endGesture()}
              onChange={(e) => apply(setWarpIntensity(warp, Number(e.target.value)))}
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
