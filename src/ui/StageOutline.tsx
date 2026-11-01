import { activePage } from '../core/store';
import { useEditorStore } from './EditorContext';

const CORNER = 12;

// EditorStage.outline: a DOM overlay rather than a Pixi layer so the dash and
// 2px width stay in screen pixels at any zoom, and it can never reach exports.
export function StageOutline() {
  const outline = useEditorStore((s) => s.stage?.outline);
  const camera = useEditorStore((s) => s.camera);
  const size = useEditorStore((s) => (activePage(s) ?? s.document.pages[0]).size);
  if (!outline) return null;

  const corners = outline.corners ? ['0 auto auto 0', '0 0 auto auto', 'auto 0 0 auto', 'auto auto 0 0'] : [];
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: camera.panX,
        top: camera.panY,
        width: size.width * camera.zoom,
        height: size.height * camera.zoom,
        boxSizing: 'border-box',
        border: `2px dashed ${outline.color}`,
      }}
    >
      {corners.map((inset) => (
        <div
          key={inset}
          className="absolute"
          style={{
            inset,
            // Centred on the border's outer corner.
            margin: -CORNER / 2 - 2,
            width: CORNER,
            height: CORNER,
            boxSizing: 'border-box',
            background: '#fff',
            border: `1px solid ${outline.color}`,
          }}
        />
      ))}
    </div>
  );
}
