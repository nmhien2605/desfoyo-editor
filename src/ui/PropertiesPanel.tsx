import { useEditorStore, useEditorStoreApi } from './EditorContext';
import type { BlendMode, Fill, Node, Stroke } from '../schema';

const BLEND_MODES: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'];
const STROKE_ALIGNS: Stroke['align'][] = ['inside', 'center', 'outside'];

function hasFill(node: Node): node is Node & { fill: Fill } {
  return node.type === 'text' || node.type === 'shape';
}

function stopColor(fill: Fill, index: number): string {
  if (fill.type === 'solid') return fill.color;
  if (fill.type === 'texture') return '#000000';
  return fill.stops[index]?.color ?? '#000000';
}

function withStopColor(fill: Fill, index: number, color: string): Fill {
  if (fill.type !== 'linear-gradient' && fill.type !== 'radial-gradient') return fill;
  const stops = [...fill.stops];
  stops[index] = { ...(stops[index] ?? { offset: index }), color };
  return { ...fill, stops };
}

// Minimal single-selection properties panel: fill (solid/gradient), opacity,
// blend mode, and (shapes only) stroke. Schema already supports all of this
// (src/schema/fill-stroke.ts) — this is the first UI surface for it.
export function PropertiesPanel() {
  const store = useEditorStoreApi();
  const activePageId = useEditorStore((s) => s.activePageId);
  const selectedNodeIds = useEditorStore((s) => s.selectedNodeIds);
  const node = useEditorStore((s) => {
    if (s.selectedNodeIds.size !== 1) return null;
    const [id] = s.selectedNodeIds;
    return s.document.pages.find((p) => p.id === s.activePageId)?.children.find((n) => n.id === id) ?? null;
  });

  if (selectedNodeIds.size !== 1 || !node) return <div className="w-64 border-l border-gray-200 p-2 text-sm text-gray-400">No selection</div>;

  const updateProps = (patch: Partial<Node>) => {
    store.getState().dispatch({ type: 'UpdateProps', pageId: activePageId, nodeId: node.id, patch });
  };

  return (
    <div className="flex w-64 flex-col gap-3 border-l border-gray-200 p-2 text-sm">
      {hasFill(node) && <FillControls fill={node.fill} onChange={(fill) => updateProps({ fill })} />}

      <label className="flex flex-col gap-1">
        Opacity
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={node.opacity}
          onPointerDown={() => store.getState().beginGesture('opacity')}
          onPointerUp={() => store.getState().endGesture()}
          onChange={(e) => updateProps({ opacity: Number(e.target.value) })}
        />
      </label>

      <label className="flex flex-col gap-1">
        Blend Mode
        <select
          value={node.blendMode ?? 'normal'}
          onChange={(e) => updateProps({ blendMode: e.target.value as BlendMode })}
          className="rounded border border-gray-300 px-1 py-0.5"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>

      {node.type === 'shape' && (
        <StrokeControls
          stroke={node.stroke}
          onChange={(stroke) => updateProps({ stroke } as Partial<Node>)}
        />
      )}
    </div>
  );
}

function FillControls({ fill, onChange }: { fill: Fill; onChange: (fill: Fill) => void }) {
  const setType = (type: Fill['type']) => {
    if (type === 'solid') onChange({ type: 'solid', color: stopColor(fill, 0) });
    else if (type === 'linear-gradient') {
      onChange({
        type: 'linear-gradient',
        angle: 0,
        stops: [
          { offset: 0, color: stopColor(fill, 0) },
          { offset: 1, color: stopColor(fill, 1) },
        ],
      });
    } else if (type === 'radial-gradient') {
      onChange({
        type: 'radial-gradient',
        stops: [
          { offset: 0, color: stopColor(fill, 0) },
          { offset: 1, color: stopColor(fill, 1) },
        ],
      });
    }
  };

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-medium">Fill</legend>
      <select
        value={fill.type}
        onChange={(e) => setType(e.target.value as Fill['type'])}
        className="rounded border border-gray-300 px-1 py-0.5"
      >
        <option value="solid">Solid</option>
        <option value="linear-gradient">Linear Gradient</option>
        <option value="radial-gradient">Radial Gradient</option>
      </select>

      {fill.type === 'solid' && (
        <input type="color" value={fill.color} onChange={(e) => onChange({ ...fill, color: e.target.value })} />
      )}

      {(fill.type === 'linear-gradient' || fill.type === 'radial-gradient') && (
        <>
          <div className="flex gap-1">
            <input type="color" value={stopColor(fill, 0)} onChange={(e) => onChange(withStopColor(fill, 0, e.target.value))} />
            <input type="color" value={stopColor(fill, 1)} onChange={(e) => onChange(withStopColor(fill, 1, e.target.value))} />
          </div>
          {fill.type === 'linear-gradient' && (
            <label className="flex flex-col gap-1">
              Angle
              <input
                type="number"
                value={Math.round((fill.angle * 180) / Math.PI)}
                onChange={(e) => onChange({ ...fill, angle: (Number(e.target.value) * Math.PI) / 180 })}
                className="rounded border border-gray-300 px-1 py-0.5"
              />
            </label>
          )}
        </>
      )}
    </fieldset>
  );
}

function StrokeControls({ stroke, onChange }: { stroke: Stroke | undefined; onChange: (stroke: Stroke | undefined) => void }) {
  if (!stroke) {
    return (
      <button
        type="button"
        onClick={() => onChange({ fill: { type: 'solid', color: '#000000' }, width: 1, align: 'center' })}
        className="rounded bg-gray-100 px-2 py-1"
      >
        Add Stroke
      </button>
    );
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="flex items-center justify-between font-medium">
        Stroke
        <button type="button" onClick={() => onChange(undefined)} className="text-xs text-gray-500">
          Remove
        </button>
      </legend>
      <label className="flex flex-col gap-1">
        Width
        <input
          type="number"
          min={0}
          value={stroke.width}
          onChange={(e) => onChange({ ...stroke, width: Number(e.target.value) })}
          className="rounded border border-gray-300 px-1 py-0.5"
        />
      </label>
      <input
        type="color"
        value={stroke.fill.type === 'solid' ? stroke.fill.color : '#000000'}
        onChange={(e) => onChange({ ...stroke, fill: { type: 'solid', color: e.target.value } })}
      />
      <label className="flex flex-col gap-1">
        Align
        <select
          value={stroke.align}
          onChange={(e) => onChange({ ...stroke, align: e.target.value as Stroke['align'] })}
          className="rounded border border-gray-300 px-1 py-0.5"
        >
          {STROKE_ALIGNS.map((align) => (
            <option key={align} value={align}>
              {align}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
