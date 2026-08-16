import { useEditorStore, useCanvasContext } from './EditorContext';
import { createViewport } from '../render/viewport';

const RULER_SIZE = 20;
const NICE_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const TARGET_SCREEN_SPACING = 60;

function niceStep(zoom: number): number {
  for (const step of NICE_STEPS) {
    if (step * zoom >= TARGET_SCREEN_SPACING) return step;
  }
  return NICE_STEPS[NICE_STEPS.length - 1];
}

// Two thin DOM bars with tick marks — visual reference only, no
// drag-to-create-guide-from-ruler interaction (not in the Phase 2 DoD).
export function Rulers() {
  const { canvas } = useCanvasContext();
  const camera = useEditorStore((s) => s.camera);
  const activePageId = useEditorStore((s) => s.activePageId);
  const pageSize = useEditorStore((s) => s.document.pages.find((p) => p.id === s.activePageId)?.size);

  if (!canvas || !pageSize) return null;
  const viewport = createViewport(canvas, () => camera);
  const step = niceStep(camera.zoom);

  const xTicks: number[] = [];
  for (let x = 0; x <= pageSize.width; x += step) xTicks.push(x);
  const yTicks: number[] = [];
  for (let y = 0; y <= pageSize.height; y += step) yTicks.push(y);

  return (
    <div className="pointer-events-none absolute inset-0" key={activePageId}>
      <div className="absolute left-0 top-0 h-5 w-full overflow-hidden bg-gray-50" style={{ height: RULER_SIZE }}>
        {xTicks.map((x) => {
          const screen = viewport.toScreen({ x, y: 0 });
          return (
            <div key={x} className="absolute top-0 border-l border-gray-300 text-[9px] text-gray-500" style={{ left: screen.x, height: RULER_SIZE }}>
              <span className="ml-0.5">{x}</span>
            </div>
          );
        })}
      </div>
      <div className="absolute left-0 top-0 h-full w-5 overflow-hidden bg-gray-50" style={{ width: RULER_SIZE }}>
        {yTicks.map((y) => {
          const screen = viewport.toScreen({ x: 0, y });
          return (
            <div key={y} className="absolute left-0 border-t border-gray-300 text-[9px] text-gray-500" style={{ top: screen.y, width: RULER_SIZE }}>
              <span className="ml-0.5">{y}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
