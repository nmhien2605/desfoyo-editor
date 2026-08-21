import type { Effect, TextNode } from '../schema';
import { findTextShadow } from '../text/textShadow';

export type TextShadowEffect = Extract<Effect, { type: 'text-shadow' }>;

export const DEFAULT_TEXT_SHADOW: TextShadowEffect = {
  type: 'text-shadow',
  style: 'drop',
  color: '#000000',
  angle: Math.PI / 4,
  distance: 0.06,
  blur: 4,
};

export { findTextShadow };

// Quy tac "apply 1": entry 'text-shadow' luon THAY THE, khong bao gio push
// them ban thu 2 — cac effect khac (glow/outline/blur/...) trong cung mang
// khong dung toi, mang van la Effect[] binh thuong. ponytail: khi can nhieu
// shadow chong len nhau, doi ham nay tu "thay the" sang "push" la du, khong
// can doi kien truc mang.
export function setTextShadow(effects: Effect[] | undefined, shadow: TextShadowEffect | null): Effect[] {
  const rest = (effects ?? []).filter((e) => e.type !== 'text-shadow');
  return shadow ? [...rest, shadow] : rest;
}

const STYLES: TextShadowEffect['style'][] = ['drop', 'line', 'block', '3d'];

export function TextShadowControls({
  node,
  onChange,
}: {
  node: TextNode;
  onChange: (effects: Effect[]) => void;
}) {
  const shadow = findTextShadow(node.effects);

  const update = (patch: Partial<TextShadowEffect>) => {
    const next: TextShadowEffect = { ...(shadow ?? DEFAULT_TEXT_SHADOW), ...patch };
    onChange(setTextShadow(node.effects, next));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <input
          type="checkbox"
          checked={!!shadow}
          onChange={(e) => onChange(setTextShadow(node.effects, e.target.checked ? DEFAULT_TEXT_SHADOW : null))}
        />
        Enable Shadow
      </label>

      {shadow && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => update({ style })}
                className="rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase"
                style={{
                  background: shadow.style === style ? '#263442' : '#252c37',
                  border: shadow.style === style ? '2px solid #58a8de' : '1px solid #303846',
                  color: 'var(--text-muted)',
                }}
              >
                {style}
              </button>
            ))}
          </div>

          <input type="color" value={shadow.color} onChange={(e) => update({ color: e.target.value })} />

          <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Angle — {Math.round((shadow.angle * 180) / Math.PI)}°
            <input
              type="range"
              min={0}
              max={2 * Math.PI}
              step={0.01}
              value={shadow.angle}
              className="kittl-range"
              onChange={(e) => update({ angle: Number(e.target.value) })}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Distance — {Math.round(shadow.distance * 100)}%
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.005}
              value={shadow.distance}
              className="kittl-range"
              onChange={(e) => update({ distance: Number(e.target.value) })}
            />
          </label>

          {shadow.style === 'drop' && (
            <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Blur
              <input
                type="number"
                min={0}
                value={shadow.blur ?? 4}
                onChange={(e) => update({ blur: Number(e.target.value) })}
                className="kittl-input"
              />
            </label>
          )}

          {shadow.style === 'line' && (
            <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Thickness
              <input
                type="number"
                min={0}
                value={shadow.thickness ?? 2}
                onChange={(e) => update({ thickness: Number(e.target.value) })}
                className="kittl-input"
              />
            </label>
          )}
        </>
      )}
    </div>
  );
}
