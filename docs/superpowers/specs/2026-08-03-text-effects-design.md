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

## Slice 3: Transformations / Warp (FR-03)

### Goal
Give text nodes 8 shape-warp styles — arch, wave, rise, flag, circle, distort, angle, custom mesh — driven by true glyph-outline geometry (not a rasterized-texture warp), with slider controls and on-canvas drag handles.

### Why glyph-outline warp, not texture warp
The simpler alternative (render `PIXI.Text` to a texture, deform it via a `MeshPlane`-style grid) was considered and rejected in favor of true vector warp: crisper at any zoom/curve extremity, no font/script limitation beyond what opentype.js itself resolves. The cost is real — a new glyph-extraction and layout pipeline — accepted deliberately for quality.

### New dependencies
- `opentype.js` — parses TTF/OTF font binaries into glyph vector outlines (`font.getPath(char, x, y, fontSize)`).
- `wawoff2` — decompresses WOFF2 to TTF in-browser (opentype.js cannot parse WOFF2 directly; verified via the library's own docs/discussions).
- **No new triangulation dependency**: `earcut` is already bundled and re-exported by `pixi.js` (`node_modules/pixi.js/lib/index.js:1370`, `exports.earcut = utils.earcut`) — import `{ earcut }` from `'pixi.js'` directly.

### Font-file access (`src/fonts/googleFontFiles.ts`, new)
Google Fonts' CSS2 endpoint (already used by `loadGoogleFont` for on-screen `<link>` loading) returns multiple `@font-face` blocks, one per Unicode-range subset, each pointing at its own WOFF2 URL. To get real glyph outlines:
1. Fetch the CSS2 response text for the family/weight.
2. Parse every `@font-face` block into `{ unicodeRange: string, url: string }[]` (a real parse this time — slice 1's final review caught a regex-first-match bug that grabbed the wrong subset; this pipeline must not repeat it).
3. For each character actually present in `node.content`, pick the block whose `unicode-range` covers that codepoint. Characters with no matching subset render un-warped as a same-position rasterized fallback quad — documented limitation, not a crash.
4. Fetch the needed WOFF2 blob(s), decompress with `wawoff2`, parse with `opentype.parse()`.
5. Cache the resulting `opentype.Font` per `family:weight`, module-level `Map`, mirroring `googleFonts.ts`'s existing `loaded` cache pattern.

### Layout (`src/text/layoutGlyphs.ts`, new)
Since `PIXI.Text` renders via Canvas and never exposes per-glyph positions, warp needs an independent layout pass — the single source of truth for both geometry and fill, so nothing has to agree pixel-for-pixel with Canvas's own text shaping:
- Walks `node.content`, using the cached `opentype.Font`'s advance widths and kerning tables plus `node.font.letterSpacing`/`lineHeight`/`align` (same fields slice 1 already added) to compute each glyph's `(char, x, y)` placement, matching `node.size.width` word-wrap behavior.
- Output: `GlyphPlacement[] = { char, x, y }[]`.

### Geometry (`src/text/warpMesh.ts`, new)
For each `GlyphPlacement`:
1. `font.getPath(char, x, y, node.font.size)` → opentype `Path` (command list: M/L/C/Q/Z).
2. Flatten Bezier commands to line segments (fixed 10-segment sampling per curve — adequate at typical export resolutions, no adaptive subdivision needed for v1).
3. Triangulate the flattened contour(s) via `earcut`, passing hole indices for counters (letters like `o`/`a`/`e`/`g`) derived from opentype's contour winding direction.
4. Apply the warp displacement function (table below) to every vertex's `(x, y)`, producing warped positions; retain each vertex's **pre-warp** `(x, y)` as a second attribute (`aGradientUv`) for gradient fills.
5. Concatenate all glyphs' triangles into one `MeshGeometry(positions, gradientUvs, indices)`.

### Warp displacement formulas (`src/text/warpFormulas.ts`, new)
Each takes a vertex's un-warped `(x, y)` (relative to the text's local bounding box, normalized 0..1) plus the style's params, returns a `(dx, dy)` offset:

| Style | Params | Formula sketch |
|---|---|---|
| `arch` | `curve: number` (-1..1) | `dy -= curve * sin(x * π) * boxHeight` — parabolic arc across the line |
| `wave` | `amplitude, frequency: number` | `dy += amplitude * sin(x * frequency * 2π) * boxHeight` |
| `rise` | `amount: number` (-1..1) | `dy -= amount * x * boxHeight` — linear baseline slant |
| `flag` | `amplitude, frequency: number` | Same as `wave`, but amplitude scales by `x` (0 at the pinned left edge, full at the right) — a waving-flag taper `wave` doesn't have |
| `circle` | `curve: number` (-1..1) | Remaps `x` to an angle around a circle of radius `1/abs(curve)`, remaps `y` radially — text follows the circle's circumference |
| `distort` | `amountX, amountY: number` | `dx += amountX * x * (1-x)`, `dy += amountY * y * (1-y)` — independent per-axis perspective-like bulge |
| `angle` | `angle: number` (radians) | Pure shear: `dx += y * tan(angle)` — cheapest style, still routed through the same mesh pipeline for one uniform code path |
| `custom-mesh` | `gridSize: [cols, rows]`, `points: number[]` | Bilinear-interpolates the vertex's `(x, y)` against the user-authored control-point grid |

### Fill rendering (`src/text/shaders/glyphFill.ts`, new)
A hand-written `Mesh`-targeting shader (Pixi v8 `Shader`, not a post-process `Filter` — the first mesh shader in this codebase, same "write raw GLSL" convention `inner-shadow.frag.ts`/`lineShadow.frag.ts` already established for filters):
- `fill.type === 'solid'` → vertex-colored directly from `fill.color`/`alpha`, no fragment-shader gradient math needed.
- `fill.type === 'linear-gradient' | 'radial-gradient'` → fragment shader evaluates the gradient stops using each fragment's interpolated `aGradientUv` (the *pre-warp* position), so the gradient direction reads the same as it would on unwarped text — warping the shape doesn't warp the gradient's own axis.

### Schema (`src/schema/node.ts` — `TextNode.warp`, new optional field)
```ts
export const WarpSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('arch'), curve: z.number() }),
  z.object({ type: z.literal('wave'), amplitude: z.number(), frequency: z.number() }),
  z.object({ type: z.literal('rise'), amount: z.number() }),
  z.object({ type: z.literal('flag'), amplitude: z.number(), frequency: z.number() }),
  z.object({ type: z.literal('circle'), curve: z.number() }),
  z.object({ type: z.literal('distort'), amountX: z.number(), amountY: z.number() }),
  z.object({ type: z.literal('angle'), angle: z.number() }),
  z.object({ type: z.literal('custom-mesh'), gridSize: z.tuple([z.number(), z.number()]), points: z.array(z.number()) }),
]);
export type Warp = z.infer<typeof WarpSchema>;
// TextNodeSchema gains: warp: WarpSchema.optional()
```
`warp` absent (the default) means `textRenderer` renders plain `PIXI.Text`, byte-for-byte unchanged from slices 1-2 — this slice is purely additive for every already-shipped text node.

### Rendering integration
- **`textRenderer.create`/`update`**: branch on `node.warp` — undefined returns/updates a `PIXI.Text` exactly as today; defined builds/updates a `Mesh` via the geometry+fill pipeline above.
- **`SceneReconciler` gains a recreate hook**: today `apply()`'s `UpdateProps`/`UpdateTransform` case always calls `update()` on the existing display object (`SceneReconciler.ts:129-136`) — there's no path to swap a node's underlying Pixi object class. Renderers gain an optional `needsRecreate?(obj, node): boolean` method; `textRenderer` implements it (`true` when `obj instanceof Text` but `node.warp` is now set, or vice versa). `SceneReconciler.apply()` checks this before calling `update()`: if true, destroy the old object, `createDisplayObject`, replace it in `displayObjects` and at the same child index, call `onNodeMounted` again. Every other renderer leaves the hook unimplemented (default: never recreate) — zero behavior change for shape/image/svg/group.
- **`applyTransform`/`buildFilters`**: unaffected — `Container.filters` (and thus all of slice 2's shadow effects) works identically on a `Mesh` as on a `Text`, applied after `applyTransform` sets pivot/position/scale/rotation as today.

### UI (`src/ui/PropertiesPanel.tsx`, `src/ui/SelectionOverlay.tsx`)
- **PropertiesPanel**: a warp-style picker row (mirrors slice 2's shadow quick-buttons — one-click apply with type-aware defaults), plus a `WarpParams` switch (same pattern as `EffectParams`) rendering the right sliders per style from the table above. A "Remove warp" control clears `node.warp` (`UpdateProps({ warp: undefined })`), reverting to plain `Text`.
- **SelectionOverlay**: a `WarpHandles` component, precedented by `ImageCropHandles` (`SelectionOverlay.tsx:292`) — same `viewport.toScreen`/`toWorld` conversion, same `UpdateProps`-on-drag dispatch pattern.
  - 7 formula styles: **one** draggable handle whose screen position maps to `(intensity, direction)` for that style (e.g. vertical drag → `arch.curve`, horizontal drag → `wave.frequency`) — a quick-adjust affordance; the PropertiesPanel sliders remain the precise control for the same fields.
  - `custom-mesh`: a full `gridSize[0] × gridSize[1]` grid of independently-draggable handles, each editing one `points[i]` pair.
  - **Mutual exclusion with standard handles (compatibility fix, resolved during slice 2/3 compatibility review):** `WarpHandles` must gate behind an explicit edit mode, exactly mirroring `isCropping`'s pattern (`SelectionOverlay.tsx:95,217,229` — crop handles only render when `croppingNodeId === node.id`, and the standard resize/rotate handles explicitly hide during it via `!isCropping && !isEditingText`). Slice 3 adds a `warpEditingNodeId` state the same shape as `croppingNodeId`, toggled by a button next to the warp style picker in PropertiesPanel (mirroring the crop-mode toggle at `SelectionOverlay.tsx:173`). Standard resize/rotate handles extend their existing guard to `!isCropping && !isEditingText && !isEditingWarp`. Without this gate, a warp handle and a resize handle would coexist on screen and their hit-test regions could visually overlap — this was not specified in the original slice 3 draft and needed patching before implementation.

### Non-goals for this slice
Non-Latin/complex-script shaping beyond what opentype.js resolves natively (no bidi/complex-script reordering), variable-font axis warping, adaptive Bezier-flattening (fixed 10-segment sampling is enough for this slice), decorations (FR-05) and export preservation (FR-08) — deferred to their own slices per "Overall shape" above.

### Testing
- `warpFormulas.ts`: one test per style — a known input vertex + params produces the expected `(dx, dy)` (pure functions, no Pixi/opentype needed).
- `layoutGlyphs.ts`: a short string's glyph placements match expected advance-width sums for a fixed test font fixture.
- `warpMesh.ts`: triangulation produces a valid `MeshGeometry` (non-empty positions/indices, index values in range) for a glyph with a hole (e.g. `"o"`) and one without (e.g. `"l"`).
- Schema: a `TextNode` with each of the 8 `warp` variants round-trips through `DocumentSchema.parse`.
- `SceneReconciler`: toggling `node.warp` on an existing text node triggers a `needsRecreate` swap (object identity changes, class changes from `Text` to `Mesh` and back).
- `googleFontFiles.ts`: CSS2-block parsing test — given a fixture CSS response with multiple `@font-face`/`unicode-range` blocks, resolves the correct URL for a given codepoint (regression test for the exact "wrong subset" bug class slice 1 hit in final review, this time at the parsing layer rather than the `<link>` layer).

---

## Self-review notes

- No placeholders/TBDs remain in slice 1, 2, or 3 — all three are fully specified down to file names and function signatures.
- Internal consistency checked against current codebase state: `SceneReconciler.ts`'s exact `apply()` switch (re-read directly before writing slice 3, confirming the `needsRecreate` gap), `buildFilters`'s current signature, `ImageCropHandles`'s drag-handle precedent, and that `earcut` is already bundled via `pixi.js` (checked `node_modules/pixi.js/lib/index.js` directly rather than assuming).
- Scope: slice 3 alone is right-sized for one implementation plan — it's the largest slice so far (2 new dependencies, 5 new files, 1 new cross-cutting `SceneReconciler` hook), but every piece serves the single "true glyph-outline warp" goal; splitting further would fragment a pipeline whose stages depend on each other in sequence.
- Ambiguity resolved explicitly (all user decisions from this slice's brainstorm): true glyph-outline warp via opentype.js chosen over texture/mesh-grid warp, despite the added dependency and layout-engine cost, for quality; all 8 styles (7 formula + custom mesh) built together in one slice rather than splitting custom-mesh out, since they share nearly all plumbing; gradient fills on warped text get full shader support in this slice rather than a solid-only v1 fallback; the 3D-shadow discrete-step banding tradeoff from slice 2 (raised during this slice's brainstorm) is being left as-is, not revisited.
- Slice 2/3 compatibility review (post-write, before planning): confirmed slice 2's filter pipeline (`buildFilters`, `basis` scaling) needs zero changes — filters read the container's actual rendered bounds/alpha regardless of `Text` vs `Mesh`, so shadows on warped text silhouette the true warped glyph shape for free. Found and patched one real gap: `WarpHandles` needed an explicit mutual-exclusion edit-mode gate (`warpEditingNodeId`, mirroring `isCropping`) to avoid overlapping the standard resize/rotate handles — added to the UI section above.
- Slices 4-5 (Decorations, Combined-effects polish + export) remain one-paragraph placeholders in "Overall shape" — they get their own detailed spec when reached.
