import { useEffect, useState } from 'react';
import { useEditorStore, useEditorStoreApi } from './EditorContext';
import { customShaders } from '../effects/shaders/customShaders';
import { decodeSvgText, listFillableIds } from '../render/renderers/svgRenderer';
import type { BlendMode, Effect, Fill, ImageNode, Node, Stroke, SvgNode } from '../schema';

const BLEND_MODES: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'];
const STROKE_ALIGNS: Stroke['align'][] = ['inside', 'center', 'outside'];
// All 7 variants buildFilters.ts now renders (see src/effects/buildFilters.ts)
// — Phase 3 Pass D adds 'inner-shadow' and 'custom' (a GLSL filter and a
// named-shader-registry lookup, respectively).
const EFFECT_TYPES: Effect['type'][] = ['shadow', 'inner-shadow', 'glow', 'outline', 'blur', 'extrude3d', 'custom'];
const CUSTOM_SHADER_IDS = Object.keys(customShaders);

function defaultEffect(type: Effect['type']): Effect {
  switch (type) {
    case 'shadow':
    case 'inner-shadow':
      return { type, color: '#000000', blur: 4, offset: [2, 2], alpha: 0.5 };
    case 'glow':
      return { type: 'glow', color: '#ffffff', strength: 2, outer: true };
    case 'outline':
      return { type: 'outline', color: '#000000', thickness: 2 };
    case 'blur':
      return { type: 'blur', amount: 4 };
    case 'extrude3d':
      return { type: 'extrude3d', depth: 4, angle: Math.PI / 4, color: '#000000' };
    case 'custom':
      return { type: 'custom', shaderId: CUSTOM_SHADER_IDS[0] ?? '', uniforms: { strength: 2 } };
  }
}

function hasFill(node: Node): node is Node & { fill: Fill } {
  return node.type === 'shape';
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

      {node.type === 'image' && (
        <ImageControls node={node} onChange={(patch) => updateProps(patch as Partial<Node>)} />
      )}

      {node.type === 'svg' && (
        <SvgControls node={node} onChange={(patch) => updateProps(patch as Partial<Node>)} />
      )}

      <EffectsControls effects={node.effects} onChange={(effects) => updateProps({ effects })} />
    </div>
  );
}

function EffectsControls({
  effects,
  onChange,
}: {
  effects: Effect[] | undefined;
  onChange: (effects: Effect[]) => void;
}) {
  const list = effects ?? [];

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-medium">Effects</legend>
      {list.map((effect, i) => (
        <div key={i} className="flex flex-col gap-1 border-t border-gray-200 pt-1">
          <div className="flex items-center justify-between">
            <span>{effect.type}</span>
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-xs text-gray-500">
              Remove
            </button>
          </div>
          <EffectParams effect={effect} onChange={(next) => onChange(list.map((e, j) => (j === i ? next : e)))} />
        </div>
      ))}
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onChange([...list, defaultEffect(e.target.value as Effect['type'])]);
        }}
        className="rounded border border-gray-300 px-1 py-0.5"
      >
        <option value="">+ Add Effect</option>
        {EFFECT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

function EffectParams({ effect, onChange }: { effect: Effect; onChange: (effect: Effect) => void }) {
  switch (effect.type) {
    case 'shadow':
    case 'inner-shadow':
      return (
        <>
          <input type="color" value={effect.color} onChange={(e) => onChange({ ...effect, color: e.target.value })} />
          <input type="number" min={0} value={effect.blur} onChange={(e) => onChange({ ...effect, blur: Number(e.target.value) })} placeholder="blur" className="rounded border border-gray-300 px-1 py-0.5" />
        </>
      );
    case 'glow':
      return (
        <>
          <input type="color" value={effect.color} onChange={(e) => onChange({ ...effect, color: e.target.value })} />
          <input type="number" min={0} value={effect.strength} onChange={(e) => onChange({ ...effect, strength: Number(e.target.value) })} placeholder="strength" className="rounded border border-gray-300 px-1 py-0.5" />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={effect.outer} onChange={(e) => onChange({ ...effect, outer: e.target.checked })} />
            Outer
          </label>
        </>
      );
    case 'outline':
      return (
        <>
          <input type="color" value={effect.color} onChange={(e) => onChange({ ...effect, color: e.target.value })} />
          <input type="number" min={0} value={effect.thickness} onChange={(e) => onChange({ ...effect, thickness: Number(e.target.value) })} placeholder="thickness" className="rounded border border-gray-300 px-1 py-0.5" />
        </>
      );
    case 'blur':
      return (
        <input type="number" min={0} value={effect.amount} onChange={(e) => onChange({ ...effect, amount: Number(e.target.value) })} placeholder="amount" className="rounded border border-gray-300 px-1 py-0.5" />
      );
    case 'extrude3d':
      return (
        <>
          <input type="color" value={effect.color} onChange={(e) => onChange({ ...effect, color: e.target.value })} />
          <input type="number" min={0} value={effect.depth} onChange={(e) => onChange({ ...effect, depth: Number(e.target.value) })} placeholder="depth" className="rounded border border-gray-300 px-1 py-0.5" />
        </>
      );
    case 'custom':
      return (
        <>
          <select
            value={effect.shaderId}
            onChange={(e) => onChange({ ...effect, shaderId: e.target.value })}
            className="rounded border border-gray-300 px-1 py-0.5"
          >
            {CUSTOM_SHADER_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          {/* Flat key/value uniform editor — no per-shader bespoke UI, uniforms are whatever the shader's registry entry declares. */}
          {Object.entries(effect.uniforms).map(([key, value]) => (
            <input
              key={key}
              type="number"
              value={Array.isArray(value) ? value[0] : value}
              onChange={(e) => onChange({ ...effect, uniforms: { ...effect.uniforms, [key]: Number(e.target.value) } })}
              placeholder={key}
              className="rounded border border-gray-300 px-1 py-0.5"
            />
          ))}
        </>
      );
  }
}

// Crop itself is edited via SelectionOverlay.tsx's drag handles (double-
// click the image on canvas), not here — this section is filters + mask,
// the two ImageNode props with no on-canvas editing surface. Filters are a
// flat brightness/contrast/saturation/blur knob object (see
// imageRenderer.ts's buildImageFilters), not the Effect[] union
// EffectsControls below edits — deliberately different shapes.
function ImageControls({ node, onChange }: { node: ImageNode; onChange: (patch: Partial<ImageNode>) => void }) {
  const filters = node.filters ?? {};
  const setFilter = (key: keyof NonNullable<ImageNode['filters']>, value: number) => {
    onChange({ filters: { ...filters, [key]: value } });
  };

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-medium">Image</legend>
      <label className="flex flex-col gap-1">
        Brightness
        <input type="range" min={0} max={2} step={0.01} value={filters.brightness ?? 1} onChange={(e) => setFilter('brightness', Number(e.target.value))} />
      </label>
      <label className="flex flex-col gap-1">
        Contrast
        <input type="range" min={0} max={2} step={0.01} value={filters.contrast ?? 1} onChange={(e) => setFilter('contrast', Number(e.target.value))} />
      </label>
      <label className="flex flex-col gap-1">
        Saturation
        <input type="range" min={0} max={2} step={0.01} value={filters.saturation ?? 1} onChange={(e) => setFilter('saturation', Number(e.target.value))} />
      </label>
      <label className="flex flex-col gap-1">
        Blur
        <input type="range" min={0} max={20} step={0.5} value={filters.blur ?? 0} onChange={(e) => setFilter('blur', Number(e.target.value))} />
      </label>

      {node.mask ? (
        <div className="flex flex-col gap-1 border-t border-gray-200 pt-1">
          <div className="flex items-center justify-between">
            <span>Mask</span>
            <button type="button" onClick={() => onChange({ mask: undefined })} className="text-xs text-gray-500">
              Remove
            </button>
          </div>
          {/* No node-picker widget exists yet — paste the id of an existing shape node on this page (visible via LayersPanel). */}
          <input
            type="text"
            placeholder="node id"
            value={node.mask.ref}
            onChange={(e) => onChange({ mask: { ...node.mask!, ref: e.target.value } })}
            className="rounded border border-gray-300 px-1 py-0.5"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onChange({ mask: { type: 'shape', ref: '' } })}
          className="rounded bg-gray-100 px-2 py-1"
        >
          Add Mask
        </button>
      )}
    </fieldset>
  );
}

// Recolor individual elements of an imported SVG by their `id` attribute
// (SvgNode.overrides — v1 solid-color only, see svgRenderer.ts's
// applyOverrides). Fillable ids are discovered by decoding+parsing the
// asset's SVG text client-side — async (decodeSvgText fetches the data
// URI), so this loads once per assetId via useEffect rather than
// synchronously like every other properties-panel control.
function SvgControls({ node, onChange }: { node: SvgNode; onChange: (patch: Partial<SvgNode>) => void }) {
  const dataUri = useEditorStore((s) => {
    const asset = s.document.assets[node.assetId];
    return asset?.type === 'svg' ? asset.dataUri : undefined;
  });
  const [fillableIds, setFillableIds] = useState<string[]>([]);

  useEffect(() => {
    if (!dataUri) return;
    let cancelled = false;
    void decodeSvgText(dataUri).then((text) => {
      if (!cancelled) setFillableIds(listFillableIds(text));
    });
    return () => {
      cancelled = true;
    };
  }, [dataUri]);

  const setOverride = (id: string, color: string) => {
    onChange({ overrides: { ...node.overrides, [id]: { type: 'solid', color } } });
  };

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-medium">Recolor</legend>
      {fillableIds.length === 0 && <span className="text-xs text-gray-400">No labeled (id) elements found</span>}
      {fillableIds.map((id) => {
        const override = node.overrides?.[id];
        const color = override?.type === 'solid' ? override.color : '#000000';
        return (
          <label key={id} className="flex items-center justify-between gap-1">
            <span className="truncate text-xs" title={id}>{id}</span>
            <input type="color" value={color} onChange={(e) => setOverride(id, e.target.value)} />
          </label>
        );
      })}
    </fieldset>
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

      {(stroke.layers ?? []).map((layer, i) => (
        <div key={i} className="flex flex-col gap-1 border-t border-gray-200 pt-1">
          <div className="flex items-center justify-between">
            <span>Layer {i + 2}</span>
            <button
              type="button"
              onClick={() => onChange({ ...stroke, layers: stroke.layers?.filter((_, j) => j !== i) })}
              className="text-xs text-gray-500"
            >
              Remove
            </button>
          </div>
          <input
            type="number"
            min={0}
            value={layer.width}
            onChange={(e) =>
              onChange({
                ...stroke,
                layers: stroke.layers?.map((l, j) => (j === i ? { ...l, width: Number(e.target.value) } : l)),
              })
            }
            className="rounded border border-gray-300 px-1 py-0.5"
          />
          <input
            type="color"
            value={layer.fill.type === 'solid' ? layer.fill.color : '#000000'}
            onChange={(e) =>
              onChange({
                ...stroke,
                layers: stroke.layers?.map((l, j) => (j === i ? { ...l, fill: { type: 'solid', color: e.target.value } } : l)),
              })
            }
          />
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="offset x"
              value={layer.offset?.[0] ?? 0}
              onChange={(e) =>
                onChange({
                  ...stroke,
                  layers: stroke.layers?.map((l, j) =>
                    j === i ? { ...l, offset: [Number(e.target.value), l.offset?.[1] ?? 0] } : l,
                  ),
                })
              }
              className="w-1/2 rounded border border-gray-300 px-1 py-0.5"
            />
            <input
              type="number"
              placeholder="offset y"
              value={layer.offset?.[1] ?? 0}
              onChange={(e) =>
                onChange({
                  ...stroke,
                  layers: stroke.layers?.map((l, j) =>
                    j === i ? { ...l, offset: [l.offset?.[0] ?? 0, Number(e.target.value)] } : l,
                  ),
                })
              }
              className="w-1/2 rounded border border-gray-300 px-1 py-0.5"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...stroke,
            layers: [...(stroke.layers ?? []), { width: stroke.width, fill: { type: 'solid', color: '#000000' }, offset: [0, 0] }],
          })
        }
        className="rounded bg-gray-100 px-2 py-1 text-xs"
      >
        + Layer
      </button>
    </fieldset>
  );
}
