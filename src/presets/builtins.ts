import type { Preset } from '../schema';

// 5 of the phase doc's planned 15+ built-in presets — one per named
// category (neon, chrome, sticker, retro, 3d), enough to prove the apply
// mechanism end to end without hand-tuning a large visual library blind.
// ponytail: extend this array as design time allows; PresetGallery.tsx and
// the apply mechanism don't change, only the count.
export const builtinPresets: Preset[] = [
  {
    id: 'neon-blue',
    name: 'Neon Blue',
    target: 'text',
    apply: {
      fill: { type: 'solid', color: '#00eaff' },
      effects: [
        { type: 'glow', color: '#00eaff', strength: 3, outer: true },
        { type: 'outline', color: '#0066ff', thickness: 2 },
      ],
    },
  },
  {
    id: 'chrome',
    name: 'Chrome',
    target: 'text',
    apply: {
      fill: {
        type: 'linear-gradient',
        angle: Math.PI / 2,
        stops: [
          { offset: 0, color: '#f4f4f4' },
          { offset: 0.5, color: '#8a8a8a' },
          { offset: 1, color: '#e0e0e0' },
        ],
      },
      effects: [{ type: 'outline', color: '#4a4a4a', thickness: 1 }],
    },
  },
  {
    id: 'sticker',
    name: 'Sticker',
    target: 'text',
    apply: {
      fill: { type: 'solid', color: '#ffffff' },
      effects: [
        { type: 'outline', color: '#ffffff', thickness: 8 },
        { type: 'shadow', color: '#000000', blur: 0, offset: [3, 3], alpha: 0.4 },
      ],
    },
  },
  {
    id: 'retro',
    name: 'Retro',
    target: 'text',
    apply: {
      fill: { type: 'solid', color: '#f4a300' },
      effects: [{ type: 'inner-shadow', color: '#8b3a00', blur: 4, offset: [2, 2], alpha: 0.7 }],
    },
  },
  {
    id: '3d-pop',
    name: '3D Pop',
    target: 'text',
    apply: {
      fill: { type: 'solid', color: '#ff3b30' },
      effects: [{ type: 'extrude3d', depth: 10, angle: Math.PI / 4, color: '#7a0000' }],
    },
  },
];
