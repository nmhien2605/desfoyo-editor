import { builtinPresets } from '../presets/builtins';
import type { Preset } from '../schema';

// 1-click apply only — no dedicated Command, a preset is just a canned
// UpdateProps patch (same pattern FillControls/EffectsControls already use).
// "Save custom preset from selection" is deferred: it needs a name-input UI
// and a persistence layer (document-scoped vs. localStorage) neither of
// which exist yet.
export function PresetGallery({ onApply }: { onApply: (patch: Preset['apply']) => void }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-medium">Presets</legend>
      <div className="grid grid-cols-2 gap-1">
        {builtinPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApply(preset.apply)}
            className="rounded bg-gray-100 px-2 py-1 text-xs"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
