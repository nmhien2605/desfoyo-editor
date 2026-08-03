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
- **As-built note:** the shipped implementation actually injects a `<link rel="stylesheet">` pointing at the CSS2 endpoint and calls `document.fonts.load(...)` (awaiting the link's own `load` event first) rather than manually `fetch`+regex-parsing the CSS and constructing a `FontFace` by hand — a manual regex match of the CSS response's first `url()` turned out to always grab the cyrillic-ext subset (not Latin), a real bug caught in final review. Letting the browser's own CSS engine resolve the correct subset per-codepoint is both simpler and correct. See `git log` on `src/fonts/googleFonts.ts` for the full history if needed — this doc isn't updated line-by-line per fix, this note just flags the mechanism changed from the original plan.

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

## Slice 2: Shadow Effects + Effects Panel (FR-04, FR-07)

### Goal
Add the 4 named shadow kinds requirement.md's FR-04 lists (drop/line/block/3D), make them auto-scale with text size, and give the Effects panel a one-click quick-apply row for them — all via the existing generic `Effect`/`buildFilters` pipeline, with zero new renderer code (no per-node-type special-casing).

### Existing coverage (no change needed)
- **Drop shadow** = the existing `shadow` Effect type (`DropShadowFilter`) — already implemented, already applies to text nodes for free since slice 1 (`applyTransform.ts` calls `buildFilters(node.effects)` generically).
- `extrude3d` (existing, `BevelFilter`) is a *different*, already-existing effect — not reused for FR-04's "3D shadow" (see below).

### Schema — 3 new Effect variants (`src/schema/effect.ts`)

```ts
{ type: 'block-shadow', color: string, offset: [number, number], alpha: number }
{ type: 'line-shadow',  color: string, offset: [number, number], thickness: number, alpha: number }
{ type: '3d-shadow',    color: string, angle: number, depth: number, alpha: number }
```
Added to the `EffectSchema` discriminated union alongside the existing 7 variants (10 total). No changes to `shadow`, `inner-shadow`, `glow`, `outline`, `extrude3d`, `blur`, `custom`.

### Rendering (`src/effects/buildFilters.ts`) — filter-based, no new renderer code

- **`block-shadow`** → `new DropShadowFilter({ blur: 0, color, offset, alpha })`. A hard-edged solid offset silhouette is exactly what `DropShadowFilter` gives you with `blur: 0` — derived from the real rendered alpha, so edge quality matches whatever's actually on screen (text glyphs, shape paths, images) with no geometry reconstruction. No new shader.
- **`3d-shadow`** → `depth` chained `DropShadowFilter({ blur: 0 })` instances, each stepped further along `(cos(angle), sin(angle))` and progressively darkened (reuse `pixi-filters`' existing class `depth` times — no new shader, `depth` is capped at a small sane max, e.g. 12, to bound filter-chain cost).
- **`line-shadow`** → the one new shader needed: a small custom GLSL filter (same hand-written-filter pattern this codebase already uses for `inner-shadow`'s `innerShadowFrag`) that samples the alpha at the offset position and its immediate neighborhood, and paints only the *boundary* of that offset silhouette (an edge-detection pass on the shifted alpha) in `color` at `thickness` — giving a thin outline-only shadow rather than a filled one.

### Auto-scale with text size (FR-04's "bóng đổ tự động scale theo kích thước chữ")

`buildFilters`'s signature widens from `buildFilters(effects)` to `buildFilters(effects, node)`. Internally it resolves `basis = node.type === 'text' ? node.font.size : 1` and multiplies the 4 shadow-family effects' numeric fields (`shadow.blur`/`.offset`, `block-shadow.offset`, `line-shadow.offset`/`.thickness`, `3d-shadow.depth`) by `basis` before constructing the Pixi filter.

- **Shapes: zero regression.** `basis` is always `1` for non-text nodes, so stored numbers resolve to themselves exactly as today — existing shape presets/tests are unaffected.
- **Text: numbers become a fraction of font size.** The same stored value (e.g. `0.08`) now means "8% of this text's font size," so changing font size via the existing Size control automatically rescales every shadow effect on that node with no extra plumbing, dispatch, or recompute step anywhere else.
- This is a *storage convention*, not a schema change — the field types stay plain numbers either way. The only code change is `buildFilters`'s internal basis multiplication and its one call site in `applyTransform.ts` (`buildFilters(node.effects)` → `buildFilters(node.effects, node)`).
- `PropertiesPanel.tsx`'s `defaultEffect()` becomes node-type-aware: shape defaults stay familiar absolute-px-shaped numbers (e.g. `blur: 4`); text defaults use small fractional numbers appropriate to a 0..1-ish ratio (e.g. `blur: 0.08`). This is the only place the "two different number ranges for the same field" distinction is visible — the schema itself doesn't encode it.

### UI (`src/ui/PropertiesPanel.tsx`) — dedicated shadow quick-buttons

A small "Shadow" button row — Drop / Line / Block / 3D — rendered above the existing generic Effects list (the "+ Add Effect" dropdown covering glow/outline/blur/extrude3d/custom stays as-is, unchanged). Each button one-click-adds its effect via the same `UpdateProps({ effects: [...] })` dispatch pattern every other effect-adding control in this file already uses, with node-type-aware defaults from `defaultEffect()`. Clicking a shadow button never replaces an existing one of the same kind — it just appends another (same "no dedup" behavior the existing generic dropdown already has; removing/editing individual effects is already handled by the existing generic Effects list below, which every new effect type also appears in and is editable/removable from — no separate editing UI for shadows). `EffectParams`'s switch gains 3 new cases (`block-shadow`/`line-shadow`/`3d-shadow`) following the exact pattern its existing 7 cases use (colored input, numeric inputs per field).

### Non-goals for this slice

Decorations (strokes/cuts/lines/textures, FR-05) and combining/toggling multiple effects independently (FR-06 — already fully satisfied today, since every effect is just an entry in `Effect[]`; nothing new needed) and export preservation (FR-08) are deferred to their own slices per the "Overall shape" list above.

### Testing

- `buildFilters.ts` tests for each of the 3 new effect types: correct Pixi filter class constructed with the right resolved params, for both `basis = 1` (shape) and `basis = fontSize` (text) — the ratio-scaling math is the one place in this slice with real logic worth locking down with a test, not just wiring.
- `EffectParams`/quick-button wiring: no dedicated test file needed, matching this file's existing convention (none of the 7 existing effect-param branches have one) — verified manually per this project's existing verification pattern.

---

## Self-review notes

- No placeholders/TBDs remain in slice 1 or slice 2 — both are fully specified down to file names and function signatures.
- Internal consistency checked against current codebase state, including what actually shipped in slice 1 (the `googleFonts.ts` as-built note above; `buildFilters`'s current signature and the 7 existing `Effect` variants, re-read directly before writing slice 2).
- Scope: slice 2 alone is right-sized for one implementation plan. Slices 3-5 remain one-paragraph placeholders in "Overall shape" above — they get their own detailed spec when reached.
- Ambiguity resolved explicitly (all user decisions from this slice's brainstorm): "3D shadow" is a new effect distinct from the existing `extrude3d`, not a reuse of it; block/3D shadow are filter-based (not stacked-clone geometry) for quality-neutral simplicity and to preserve the "effects are renderer-agnostic" property; shadow auto-scale is resolved dynamically at render time via a ratio+basis convention, not a one-time apply-time conversion; the Effects panel gets a dedicated shadow quick-button row, not just 3 more dropdown entries.
