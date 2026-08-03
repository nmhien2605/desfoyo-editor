# Text Effects — Design

**Source:** `requirement.md` (Kittl Text Effects feature list, FR-01, FR-03 through FR-08 — FR-02 does not exist in the source doc).
**Status of prior work:** Commit `0e83187` deliberately removed a previously-built text engine (opentype.js glyph parsing, font upload, warp geometry, layered stroke, shadow/glow/extrude effects) — that removal was intentional and the old code is **not** used as a reference here. This design starts fresh from `requirement.md` alone, reusing only the *generic* infra that survived the revert (Effect schema, `buildFilters`, Fill/Stroke schemas, the node-renderer/SceneReconciler pattern).

## Overall shape

`requirement.md`'s 6 feature areas are too much for one implementation pass. They're sequenced foundation-first, each a separate spec/plan:

1. **TextNode foundation** (FR-01 groundwork) — schema, Google Fonts list, basic render, add/edit UI. *This document covers this slice in full detail.*
2. **Effects panel + shadows** (FR-04, FR-07) — reuse existing generic `Effect`/`buildFilters` infra, add the 4 named shadow presets and the Effects panel UI, extend to `text` nodes.
3. **Transformations/warp** (FR-03) — 8 shape transforms (arch/wave/rise/flag/circle/distort/angle/custom mesh), sliders + draggable handles.
4. **Decorations** (FR-05) — strokes/cuts/lines/textures, toggleable layers, vintage/editorial/poster style presets.
5. **Combined-effects polish + export** (FR-06, FR-08) — verify layering/independent-edit guarantees, extend PNG/JPG/SVG/PDF export to preserve text effects.

Each slice gets its own spec written when reached, informed by what actually landed in the slice before it — later slices are not designed in detail yet.

---

## Slice 1: TextNode Foundation

### Goal
Bring text back as a first-class node type: schema, a static Google Fonts list, Pixi rendering, and enough UI (add/edit/basic properties) to exercise it end-to-end. Every later slice builds on this.

### Schema (`src/schema/node.ts`)

```ts
export const TextNodeSchema = z.object({
  ...BaseNodeShape,
  type: z.literal('text'),
  content: z.string(),
  font: z.object({
    family: z.string(),
    size: z.number(),
    weight: z.number().optional(),
    italic: z.boolean().optional(),
    letterSpacing: z.number().optional(),
    lineHeight: z.number().optional(),
  }),
  align: z.enum(['left', 'center', 'right']),
  fill: FillSchema,
  stroke: StrokeSchema.optional(),
});
export type TextNode = z.infer<typeof TextNodeSchema>;
```

- Added to the `Node` discriminated union alongside `shape | image | svg | group`.
- `effects`, `opacity`, `visible`, `locked`, `blendMode`, `transform`, `size` all come from `BaseNodeShape` — no new fields needed there. This is why shadow/glow/outline/blur effects (slice 2) cost nothing extra at the schema level: `applyTransform.ts` already calls `buildFilters(node.effects)` generically for any node.
- `fill`/`stroke` reuse `FillSchema`/`StrokeSchema` as-is (including `Stroke.layers`, unused until the decorations slice but free to have now).

### Font list (`src/fonts/googleFonts.ts`)

- A static bundled list (curated, ~50-100 popular families with their available weights) — no API key, no runtime catalog fetch. `requirement.md`'s "1400+ fonts" claim is a marketing number for the source product; this codebase only needs *a* Google Fonts list per the note in FR-01, and static data can grow without a code change.
- `loadGoogleFont(family, weight)`: builds a `fonts.googleapis.com/css2?family=...` URL, loads it with the `FontFace` API, registers via `document.fonts.add()`. This endpoint needs no API key (it's the same one `<link>` tags use).
- A module-level `Set<string>` cache keyed by `family:weight` avoids redundant loads.
- Failure mode: if the network font fails to load, text still renders (browser's fallback font) — no error surfaced, no crash. Not distinguishable from "still loading" in v1; acceptable since nothing blocks on it.

### Renderer (`src/render/renderers/textRenderer.ts`)

- `create(node)` / `update(obj, node)` exported the same shape as `shapeRenderer`/`imageRenderer`/`svgRenderer`, returning a `PIXI.Text`.
- Renders immediately using whatever font is available synchronously (system fallback if the Google Font hasn't loaded yet), then calls `loadGoogleFont` and re-applies the `PIXI.TextStyle` once it resolves — no loading state, no blocking.
- Registered in `SceneReconciler.ts`'s `createDisplayObject`/`updateDisplayObject` switches, and in `needsTextRecreate`-style logic only if a future slice needs an object-shape swap (not needed for plain text — a bare `PIXI.Text` covers this whole slice, mirroring the old code's "flat text stays `PIXI.Text`" convention).

### UI

- **`Toolbar.tsx`**: new "Add Text" button, `defaultTextNode()` (mirrors `defaultShapeNode()`), default content `"Text"`, default font a safe built-in (e.g. `Inter`/`Roboto`, whichever is first in the static list), default fill solid black.
- **`SelectionOverlay.tsx`**: double-click a selected text node opens an absolutely-positioned `<textarea>` overlaid at the node's screen-space rect (via `viewport.ts`'s existing world↔screen conversion). Enter/blur commits `UpdateProps({ content })`; Escape cancels without dispatching.
- **`PropertiesPanel.tsx`**: font-family `<select>` (from the static list, filtered to that family's available weights), size input, weight/italic toggles, align buttons, fill color control (reusing the existing solid-fill control). `hasFill()`'s type guard gains `'text'` alongside `'shape'`.

### Non-goals for this slice

Warp/transform (FR-03), decorations (FR-05), shadow presets and the dedicated Effects panel (FR-04/FR-07 — the underlying generic effect controls already exist in `PropertiesPanel` and will need `'text'` added to their type-guards in slice 2, not this one), and export changes (FR-08) are explicitly deferred to their own slices above.

### Testing

One runnable check per non-trivial piece, no framework beyond the existing vitest setup:
- Schema conformance: a `TextNode` round-trips through `DocumentSchema.parse` (extends `src/schema/__tests__/document.test.ts`).
- `textRenderer`: create/update run without a live Pixi renderer (jsdom has no `app.init()`) and don't throw; asserts the fallback-styling path.
- `googleFonts.ts`: static-data shape test — every entry has a non-empty `family` and at least one weight.

---

## Self-review notes

- No placeholders/TBDs remain in slice 1 — it's fully specified down to file names and function signatures.
- Internal consistency checked against current codebase state (read `src/schema/base.ts`, `node.ts`, `fill-stroke.ts`, `SceneReconciler.ts`, `applyTransform.ts`, `buildFilters.ts`, `Toolbar.tsx`, `PropertiesPanel.tsx` directly before writing this).
- Scope: slice 1 alone is right-sized for one implementation plan. Slices 2-5 are intentionally left as one-paragraph placeholders — they get their own detailed spec when reached, since their design depends on what actually lands in slice 1 (e.g. how `PropertiesPanel` ends up structured for text).
- Ambiguity resolved explicitly: Google Fonts list is static or bundled data, not the live Developer API (user chose this); text-editing UX is in-scope for slice 1 (user chose this); old pre-revert code is not a reference (user chose this).
