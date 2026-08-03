# Slice 2 — Shadow Effects + Effects Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 4 named shadow kinds from `requirement.md`'s FR-04 (drop/line/block/3D) with automatic font-size scaling for text, and a one-click shadow quick-add row in the Effects panel (FR-07) — all through the existing generic `Effect`/`buildFilters` pipeline, with zero new per-node-type renderer code.

**Architecture:** 3 new `Effect` schema variants (`block-shadow`, `line-shadow`, `3d-shadow`); `buildFilters` widens to accept an optional owning `node` and resolves a `basis` multiplier (`node.font.size` for text, `1` otherwise) applied to the 4 shadow-family effects' numeric fields before constructing Pixi filters — a pure storage/resolution convention, no schema shape change, and zero behavior change for shapes (`basis` is always `1` there). `block-shadow`/`3d-shadow` reuse the existing `DropShadowFilter` class (blur forced to 0, `3d-shadow` chains several instances); `line-shadow` is the one new hand-written GLSL filter, following the exact pattern this codebase already uses for `inner-shadow`. UI adds a small shadow quick-button row to `PropertiesPanel.tsx` above the existing generic Effects list, which stays otherwise unchanged.

**Tech Stack:** TypeScript, Zod, Pixi.js v8 (`Filter`, `GlProgram`, `Color`), `pixi-filters`' `DropShadowFilter`, React, Vitest (`@vitest-environment jsdom`), pnpm.

## Global Constraints

- Only 4 effect fields get font-size scaling: `shadow.blur`/`shadow.offset`, `block-shadow.offset`, `line-shadow.offset`/`line-shadow.thickness`, `3d-shadow.depth`. Every other effect (`inner-shadow`, `glow`, `outline`, `extrude3d`, `blur`, `custom`) is unaffected — no basis multiplication for those, ever.
- `basis = node?.type === 'text' ? node.font.size : 1`. For any non-text node (or no node passed at all), `basis` is exactly `1` — existing shape behavior must not change by even one pixel. `buildFilters`'s `node` parameter is optional specifically so every existing call to `buildFilters(effects)` (all 8 cases in the existing test file) keeps compiling and passing unchanged.
- `block-shadow` and `3d-shadow` reuse `DropShadowFilter` (`blur: 0`) — no new shader for either. Only `line-shadow` gets a new hand-written GLSL filter.
- `3d-shadow` always chains a fixed number of steps (`SHADOW_3D_STEPS = 6`, not user-configurable) — `depth` is a magnitude (basis-scaled), not a step count, so there's no risk of an unbounded filter chain regardless of what `depth` is set to.
- The existing generic "+ Add Effect" dropdown in `PropertiesPanel.tsx` (currently 7 entries: shadow/inner-shadow/glow/outline/blur/extrude3d/custom) stays **exactly as-is** — the 3 new effect types are reachable only via the new shadow quick-button row, not added to that dropdown's list. Effects added via the quick-buttons still appear in, and are editable/removable from, the existing generic Effects list below (that list already renders whatever's in `node.effects` regardless of how it got there).
- No new npm dependencies. Every non-trivial function gets a test.

---

### Task 1: Schema — 3 new Effect variants

**Files:**
- Modify: `src/schema/effect.ts`
- Modify: `src/schema/__tests__/document.test.ts`

**Interfaces:**
- Produces: `EffectSchema` union gains `{ type: 'block-shadow', color: string, offset: [number, number], alpha: number }`, `{ type: 'line-shadow', color: string, offset: [number, number], thickness: number, alpha: number }`, `{ type: '3d-shadow', color: string, angle: number, depth: number, alpha: number }`. `Effect` type widens accordingly (10 variants total).

- [ ] **Step 1: Write the failing tests**

Add to `src/schema/__tests__/document.test.ts` (inside the existing `describe('DocumentSchema', ...)` block, after the text-node tests added in the previous slice):

```ts
  it('EffectSchema accepts the 3 new shadow-family effects (slice 2)', () => {
    const effects = [
      { type: 'block-shadow', color: '#000000', offset: [4, 4], alpha: 0.8 },
      { type: 'line-shadow', color: '#000000', offset: [6, 6], thickness: 1, alpha: 0.9 },
      { type: '3d-shadow', color: '#000000', angle: Math.PI / 4, depth: 10, alpha: 1 },
    ];
    for (const effect of effects) {
      expect(() => EffectSchema.parse(effect)).not.toThrow();
    }
  });

  it('EffectSchema rejects a block-shadow missing required alpha', () => {
    const effect = { type: 'block-shadow', color: '#000000', offset: [4, 4] };
    expect(() => EffectSchema.parse(effect)).toThrow();
  });
```

Add `EffectSchema` to this file's existing imports: `import { DocumentSchema, EffectSchema } from '../document';` — actually `EffectSchema` lives in `../effect`, not `../document` — add a new import line: `import { EffectSchema } from '../effect';` (alongside the existing `import { NodeSchema } from '../node';` line).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/schema/__tests__/document.test.ts`
Expected: FAIL — `EffectSchema` rejects `type: 'block-shadow'`/`'line-shadow'`/`'3d-shadow'` (not in the discriminated union yet).

- [ ] **Step 3: Add the 3 new variants to `src/schema/effect.ts`**

Insert after the existing `'extrude3d'` variant and before `'blur'` (or anywhere in the union — order doesn't matter for a `z.discriminatedUnion`, but grouping the 4 shadow-family effects together aids readability):

```ts
  z.object({
    type: z.literal('block-shadow'),
    color: z.string(),
    offset: z.tuple([z.number(), z.number()]),
    alpha: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('line-shadow'),
    color: z.string(),
    offset: z.tuple([z.number(), z.number()]),
    thickness: z.number(),
    alpha: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('3d-shadow'),
    color: z.string(),
    angle: z.number(),
    depth: z.number(),
    alpha: z.number().min(0).max(1),
  }),
```

Update the file's top comment (currently describes the union as a "Phase 1 wires up just one demo filter" note) to mention these 3 are the FR-04 shadow-kind additions from slice 2, resolved via `buildFilters`'s font-size basis scaling (Task 2).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/schema/__tests__/document.test.ts`
Expected: PASS (all tests, including the 2 new ones)

- [ ] **Step 5: Commit**

```bash
git add src/schema/effect.ts src/schema/__tests__/document.test.ts
git commit -m "feat: add block-shadow, line-shadow, and 3d-shadow to the Effect schema"
```

---

### Task 2: `buildFilters` — basis scaling, block-shadow, 3d-shadow

**Files:**
- Modify: `src/effects/buildFilters.ts`
- Modify: `src/effects/__tests__/buildFilters.test.ts`

**Interfaces:**
- Consumes: `Effect` (Task 1), `Node` (from `../schema`).
- Produces: `buildFilters(effects: Effect[] | undefined, node?: Node): Filter[]` (signature widens — `node` is optional, so every existing call site and every existing test that calls `buildFilters(effects)` with one argument keeps compiling and passing unchanged, with `basis` defaulting to `1`). Also exports `darkenColor(color: string, amount: number): string` (a small pure helper, used by the `3d-shadow` case, exported for its own focused unit test).

- [ ] **Step 1: Write the failing tests**

Add to `src/effects/__tests__/buildFilters.test.ts` (inside the existing `describe('buildFilters', ...)` block), and add `import type { TextNode } from '../../schema';` to the top imports alongside the existing `import type { Effect } from '../../schema';`:

```ts
  it('scales shadow blur/offset by font size when applied to a text node', () => {
    const node: TextNode = {
      id: 'text-1',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 200, height: 60 },
      opacity: 1,
      visible: true,
      locked: false,
      type: 'text',
      content: 'Hi',
      font: { family: 'Roboto', size: 50 },
      align: 'left',
      fill: { type: 'solid', color: '#000000' },
    };
    const effects: Effect[] = [{ type: 'shadow', color: '#ff0000', blur: 0.1, offset: [0.02, 0.04], alpha: 0.5 }];
    const [filter] = buildFilters(effects, node) as [DropShadowFilter];
    expect(filter.blur).toBeCloseTo(5); // 0.1 * 50
    expect(filter.offset.x).toBeCloseTo(1); // 0.02 * 50
    expect(filter.offset.y).toBeCloseTo(2); // 0.04 * 50
  });

  it('does not scale shadow blur/offset for a shape node (basis stays 1)', () => {
    const effects: Effect[] = [{ type: 'shadow', color: '#ff0000', blur: 4, offset: [2, 3], alpha: 0.5 }];
    const [filter] = buildFilters(effects) as [DropShadowFilter]; // no node argument at all — matches every pre-existing call in this file
    expect(filter.blur).toBe(4);
    expect(filter.offset.x).toBe(2);
    expect(filter.offset.y).toBe(3);
  });

  it('builds a hard-edged DropShadowFilter (blur 0) for block-shadow', () => {
    const effects: Effect[] = [{ type: 'block-shadow', color: '#000000', offset: [4, 5], alpha: 0.8 }];
    const [filter] = buildFilters(effects) as [DropShadowFilter];
    expect(filter).toBeInstanceOf(DropShadowFilter);
    expect(filter.blur).toBe(0);
    expect(filter.offset.x).toBe(4);
    expect(filter.offset.y).toBe(5);
  });

  it('scales block-shadow offset by font size for a text node', () => {
    const node: TextNode = {
      id: 'text-1',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 200, height: 60 },
      opacity: 1,
      visible: true,
      locked: false,
      type: 'text',
      content: 'Hi',
      font: { family: 'Roboto', size: 40 },
      align: 'left',
      fill: { type: 'solid', color: '#000000' },
    };
    const effects: Effect[] = [{ type: 'block-shadow', color: '#000000', offset: [0.1, 0.1], alpha: 0.8 }];
    const [filter] = buildFilters(effects, node) as [DropShadowFilter];
    expect(filter.offset.x).toBeCloseTo(4); // 0.1 * 40
  });

  it('builds a chain of SHADOW_3D_STEPS DropShadowFilters for 3d-shadow, each darker than the last', () => {
    const effects: Effect[] = [{ type: '3d-shadow', color: '#ffffff', angle: 0, depth: 12, alpha: 1 }];
    const filters = buildFilters(effects) as DropShadowFilter[];
    expect(filters).toHaveLength(6);
    for (const filter of filters) expect(filter).toBeInstanceOf(DropShadowFilter);
    // angle 0 -> offset is purely along x, increasing with each step
    expect(filters[0].offset.x).toBeLessThan(filters[5].offset.x);
    expect(filters[5].offset.x).toBeCloseTo(12); // last step reaches full depth
    // each step's color should darken monotonically toward black
    const toRed = (f: DropShadowFilter) => new Color(f.color).toArray()[0];
    expect(toRed(filters[0])).toBeGreaterThan(toRed(filters[5]));
  });

  it('darkenColor scales rgb channels toward black without throwing on white or black input', () => {
    const half = darkenColor('#ffffff', 0.5);
    const value = parseInt(half.replace('#', ''), 16);
    const r = (value >> 16) & 0xff;
    expect(r).toBeGreaterThan(100);
    expect(r).toBeLessThan(150);
    expect(darkenColor('#000000', 0.5)).toBe('#000000');
  });
```

Update this test file's existing import lines (currently `import { BlurFilter, Filter } from 'pixi.js';` and `import { buildFilters } from '../buildFilters';`) to:
```ts
import { BlurFilter, Color, Filter } from 'pixi.js';
```
```ts
import { buildFilters, darkenColor } from '../buildFilters';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/effects/__tests__/buildFilters.test.ts`
Expected: FAIL — `buildFilters` doesn't accept a second argument yet, `'block-shadow'`/`'3d-shadow'` aren't handled, `darkenColor` doesn't exist.

- [ ] **Step 3: Update `src/effects/buildFilters.ts`**

Change the import line to include `Node`:

```ts
import type { Effect, Node } from '../schema';
```

Add the darken helper and the steps constant near the top (after `customUniforms`):

```ts
const SHADOW_3D_STEPS = 6;

// Darkens a color toward black by `amount` (0..1) — used by the '3d-shadow'
// case to progressively shade each chained layer, giving a receding-depth
// look. Exported for its own focused unit test (no Pixi renderer needed).
export function darkenColor(color: string, amount: number): string {
  const [r, g, b] = new Color(color).toArray();
  return new Color([r * (1 - amount), g * (1 - amount), b * (1 - amount)]).toHex();
}
```

Change the function signature and add the basis resolution:

```ts
// basis: text nodes scale the 4 shadow-family effects (shadow/block-shadow/
// line-shadow/3d-shadow) by font size, so the same stored Effect looks
// proportional at any text size — see docs/superpowers/specs/2026-08-03-text-effects-design.md
// "Auto-scale with text size". basis is always 1 for non-text nodes (or
// when no node is passed at all), so shape rendering is byte-for-byte
// unchanged from before this parameter existed.
export function buildFilters(effects: Effect[] | undefined, node?: Node): Filter[] {
  if (!effects) return [];
  const basis = node?.type === 'text' ? node.font.size : 1;

  const filters: Filter[] = [];
  for (const effect of effects) {
    switch (effect.type) {
      case 'shadow':
        filters.push(
          new DropShadowFilter({
            color: effect.color,
            blur: effect.blur * basis,
            offset: { x: effect.offset[0] * basis, y: effect.offset[1] * basis },
            alpha: effect.alpha,
          }),
        );
        break;
```

(The rest of the `'shadow'` case's old body is replaced by the block above — `blur`/`offset` now multiply by `basis`. Every other existing case — `glow`, `outline`, `blur`, `extrude3d`, `inner-shadow`, `custom` — is completely unchanged, copy them through exactly as they are today.)

Add the 2 new reused-filter cases (insert anywhere in the switch, e.g. right after the `'shadow'` case):

```ts
      case 'block-shadow':
        filters.push(
          new DropShadowFilter({
            color: effect.color,
            blur: 0,
            offset: { x: effect.offset[0] * basis, y: effect.offset[1] * basis },
            alpha: effect.alpha,
          }),
        );
        break;
      case '3d-shadow': {
        const depth = effect.depth * basis;
        for (let i = 1; i <= SHADOW_3D_STEPS; i++) {
          const t = i / SHADOW_3D_STEPS;
          filters.push(
            new DropShadowFilter({
              color: darkenColor(effect.color, t * 0.6),
              blur: 0,
              offset: { x: Math.cos(effect.angle) * depth * t, y: Math.sin(effect.angle) * depth * t },
              alpha: effect.alpha,
            }),
          );
        }
        break;
      }
```

`line-shadow` is deliberately NOT added in this task — its case is added in Task 3 alongside its new shader file, so this task's diff stays focused on the "reuse existing DropShadowFilter" work.

Update the file's top comment block to mention slice 2 adds `block-shadow`/`3d-shadow` (reusing `DropShadowFilter`) and the `basis` scaling parameter.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/effects/__tests__/buildFilters.test.ts`
Expected: PASS (all tests, including the 6 new ones) — except any test referencing `'line-shadow'`, which doesn't exist yet; there are none in this task's test additions, so this should be fully green.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: All PASS — `buildFilters`'s call sites (`applyTransform.ts`, `imageRenderer.ts`) still call it with one argument (`buildFilters(node.effects)`), which now defaults `node` to `undefined` and `basis` to `1` — identical behavior to before this task, so nothing else should break. (`node.effects` will get properly threaded through as a second argument in Task 4 — that's fine to defer, since omitting it is currently 100% backward-compatible, not a bug.)

- [ ] **Step 6: Commit**

```bash
git add src/effects/buildFilters.ts src/effects/__tests__/buildFilters.test.ts
git commit -m "feat: add font-size basis scaling and block-shadow/3d-shadow to buildFilters"
```

---

### Task 3: `line-shadow` — new GLSL filter

**Files:**
- Create: `src/effects/shaders/lineShadow.frag.ts`
- Modify: `src/effects/buildFilters.ts`
- Modify: `src/effects/__tests__/buildFilters.test.ts`

**Interfaces:**
- Consumes: `defaultFilterVert`, `GlProgram`, `Filter`, `Color` (all already imported in `buildFilters.ts`).
- Produces: `lineShadowFrag: string` (exported GLSL source, mirroring `innerShadowFrag`'s export shape). `buildFilters` gains the `'line-shadow'` case.

- [ ] **Step 1: Write the failing tests**

Add to `src/effects/__tests__/buildFilters.test.ts`:

```ts
  it('builds a custom Filter for line-shadow', () => {
    const effects: Effect[] = [{ type: 'line-shadow', color: '#000000', offset: [6, 6], thickness: 1, alpha: 0.9 }];
    const [filter] = buildFilters(effects);
    expect(filter).toBeInstanceOf(Filter);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/effects/__tests__/buildFilters.test.ts`
Expected: FAIL — `'line-shadow'` isn't handled by the switch yet (produces no filter, or a type error depending on exhaustiveness).

- [ ] **Step 3: Write the shader file**

```ts
// src/effects/shaders/lineShadow.frag.ts

// GLSL fragment source for "line shadow" (FR-04's 4th shadow kind): a thin
// outline-only shadow tracing the boundary of an *offset* copy of the
// node's own alpha, rather than a filled silhouette (that's block-shadow)
// or a blurred one (that's shadow/drop-shadow). Same hand-written-filter
// approach this codebase already uses for inner-shadow (innerShadow.frag.ts)
// — a fixed cross-sample (here checking 4 neighbors at uThickness texels
// away from the offset position) rather than a real, more expensive
// multi-tap edge/Sobel filter.
// ponytail: 4-tap cross edge test, not a proper Sobel/gradient edge
// detector — upgrade if visual quality falls short at large uThickness.
export const lineShadowFrag = `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec3 uColor;
uniform float uAlpha;
uniform vec2 uOffset;
uniform float uThickness;

void main(void) {
  vec4 base = texture(uTexture, vTextureCoord);
  vec2 texel = uInputSize.zw;
  vec2 shadowUv = vTextureCoord - uOffset * texel;

  float here = texture(uTexture, shadowUv).a;
  float n = texture(uTexture, shadowUv + vec2(0.0, uThickness) * texel).a;
  float s = texture(uTexture, shadowUv - vec2(0.0, uThickness) * texel).a;
  float e = texture(uTexture, shadowUv + vec2(uThickness, 0.0) * texel).a;
  float w = texture(uTexture, shadowUv - vec2(uThickness, 0.0) * texel).a;
  float minNeighbor = min(min(n, s), min(e, w));

  // "here" is inside the offset silhouette but at least one neighbor
  // uThickness texels away falls outside it — a boundary ring around the
  // offset copy, not a filled shape.
  float edge = here * (1.0 - minNeighbor) * uAlpha;
  finalColor = vec4(mix(base.rgb, uColor, edge), max(base.a, edge));
}
`;
```

- [ ] **Step 4: Add the `'line-shadow'` case to `buildFilters.ts`**

Add the import: `import { lineShadowFrag } from './shaders/lineShadow.frag';`

Add the case (mirroring the existing `'inner-shadow'` case's structure exactly):

```ts
      case 'line-shadow': {
        const [r, g, b] = new Color(effect.color).toArray();
        filters.push(
          new Filter({
            glProgram: new GlProgram({ vertex: defaultFilterVert, fragment: lineShadowFrag, name: 'line-shadow-filter' }),
            resources: {
              lineShadowUniforms: {
                uColor: { value: new Float32Array([r, g, b]), type: 'vec3<f32>' },
                uAlpha: { value: effect.alpha, type: 'f32' },
                uOffset: { value: [effect.offset[0] * basis, effect.offset[1] * basis], type: 'vec2<f32>' },
                uThickness: { value: effect.thickness * basis, type: 'f32' },
              },
            },
          }),
        );
        break;
      }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/effects/__tests__/buildFilters.test.ts`
Expected: PASS (all tests including the new one)

- [ ] **Step 6: Run the full suite**

Run: `npx vitest run`
Expected: All PASS.

- [ ] **Step 7: Commit**

```bash
git add src/effects/shaders/lineShadow.frag.ts src/effects/buildFilters.ts src/effects/__tests__/buildFilters.test.ts
git commit -m "feat: add line-shadow effect (new GLSL edge-of-offset-silhouette filter)"
```

---

### Task 4: Thread `node` through `buildFilters`'s call sites

**Files:**
- Modify: `src/render/applyTransform.ts`
- Modify: `src/render/renderers/imageRenderer.ts`

**Interfaces:**
- Consumes: `buildFilters(effects, node?)` (Tasks 2-3).
- Produces: no new exports — both call sites already have `node` in scope; this task just passes it through so text nodes actually get font-size scaling instead of falling back to `basis = 1` forever.

No new test file — this is a 2-line change to two existing call sites, covered by the existing `applyTransform`/`imageRenderer` test suites (which continue to pass unchanged) plus Task 6's manual verification (which is the only way to see the actual scaling behavior on a live text node, since `applyTransform.test.ts`/`imageRenderer.test.ts` don't currently assert on `buildFilters`'s internals).

- [ ] **Step 1: Update `src/render/applyTransform.ts`**

Change:
```ts
  obj.filters = buildFilters(node.effects);
```
to:
```ts
  obj.filters = buildFilters(node.effects, node);
```

- [ ] **Step 2: Update `src/render/renderers/imageRenderer.ts`**

Change (around line 201):
```ts
    wrapper.filters = [...buildFilters(node.effects), ...buildImageFilters(node.filters)];
```
to:
```ts
    wrapper.filters = [...buildFilters(node.effects, node), ...buildImageFilters(node.filters)];
```

- [ ] **Step 3: Run the full suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All PASS, no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/render/applyTransform.ts src/render/renderers/imageRenderer.ts
git commit -m "feat: thread node through buildFilters call sites for font-size shadow scaling"
```

---

### Task 5: PropertiesPanel — shadow quick-buttons + node-aware defaults

**Files:**
- Modify: `src/ui/PropertiesPanel.tsx`

**Interfaces:**
- Consumes: `Effect` (Tasks 1-3), `Node` (existing).
- Produces: no new exports — internal `ShadowQuickAdd` component (new) and a widened, node-aware `defaultEffect(type, node)` (existing function, signature changes from `defaultEffect(type)`).

No new test file for this task — `PropertiesPanel.tsx` has no existing test file (matches this file's established convention from slice 1); verified manually in Task 6.

- [ ] **Step 1: Widen `defaultEffect` to take the node and split the `'shadow'`/`'inner-shadow'` cases**

Change:

```ts
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
```

to:

```ts
// blur/offset/thickness/depth defaults differ for text vs. shape/image/svg
// nodes because buildFilters.ts's basis scaling interprets these same
// fields as "fraction of font size" for text but "raw px" for shapes (see
// docs/superpowers/specs/2026-08-03-text-effects-design.md "Auto-scale
// with text size") — a 4px-shaped default would resolve to an enormous
// blur once multiplied by a 48+ px font size, so text gets small
// fractional defaults instead. inner-shadow is deliberately NOT part of
// this scaling convention (only the 4 FR-04 shadow kinds are), so it keeps
// its original fixed defaults regardless of node type.
function defaultEffect(type: Effect['type'], node: Node): Effect {
  const isText = node.type === 'text';
  switch (type) {
    case 'shadow':
      return { type: 'shadow', color: '#000000', blur: isText ? 0.08 : 4, offset: isText ? [0.04, 0.04] : [2, 2], alpha: 0.5 };
    case 'inner-shadow':
      return { type: 'inner-shadow', color: '#000000', blur: 4, offset: [2, 2], alpha: 0.5 };
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
    case 'block-shadow':
      return { type: 'block-shadow', color: '#000000', offset: isText ? [0.04, 0.04] : [4, 4], alpha: 0.8 };
    case 'line-shadow':
      return { type: 'line-shadow', color: '#000000', offset: isText ? [0.06, 0.06] : [6, 6], thickness: isText ? 0.01 : 1, alpha: 0.9 };
    case '3d-shadow':
      return { type: '3d-shadow', color: '#000000', angle: Math.PI / 4, depth: isText ? 0.1 : 10, alpha: 1 };
  }
}
```

- [ ] **Step 2: Update `EffectsControls` to take `node` and pass it to `defaultEffect`**

Change the component's props and the one call site inside it:

```ts
function EffectsControls({
  node,
  effects,
  onChange,
}: {
  node: Node;
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
          if (e.target.value) onChange([...list, defaultEffect(e.target.value as Effect['type'], node)]);
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
```

(Only the function signature and the one `defaultEffect(...)` call inside the `<select>`'s `onChange` changed — everything else in this component is identical to before. `EFFECT_TYPES` itself is NOT modified — it stays the same 7 entries; the 3 new types are deliberately not added to this dropdown, per this plan's Global Constraints.)

- [ ] **Step 3: Add the `ShadowQuickAdd` component**

Add near `EffectsControls` (e.g. right before it):

```tsx
const SHADOW_KINDS: { type: Effect['type']; label: string }[] = [
  { type: 'shadow', label: 'Drop' },
  { type: 'line-shadow', label: 'Line' },
  { type: 'block-shadow', label: 'Block' },
  { type: '3d-shadow', label: '3D' },
];

// One-click quick-add for FR-04's 4 named shadow kinds, separate from the
// generic "+ Add Effect" dropdown below (which still lists all 7 other
// effect types unchanged). Clicking a button always appends another
// instance of that shadow kind — no dedup/replace — matching the existing
// dropdown's own "just append" behavior; editing/removing an already-added
// shadow happens in the generic Effects list below, which renders whatever
// is in node.effects regardless of how it got there.
function ShadowQuickAdd({
  node,
  effects,
  onChange,
}: {
  node: Node;
  effects: Effect[] | undefined;
  onChange: (effects: Effect[]) => void;
}) {
  const list = effects ?? [];
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-medium">Shadow</legend>
      <div className="flex gap-1">
        {SHADOW_KINDS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange([...list, defaultEffect(type, node)])}
            className="rounded bg-gray-100 px-2 py-1 text-xs"
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 4: Add the 3 new cases to `EffectParams`**

Add to the `switch (effect.type)` in `EffectParams` (e.g. right after the existing `'extrude3d'` case):

```tsx
    case 'block-shadow':
      return (
        <>
          <input type="color" value={effect.color} onChange={(e) => onChange({ ...effect, color: e.target.value })} />
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="offset x"
              value={effect.offset[0]}
              onChange={(e) => onChange({ ...effect, offset: [Number(e.target.value), effect.offset[1]] })}
              className="w-1/2 rounded border border-gray-300 px-1 py-0.5"
            />
            <input
              type="number"
              placeholder="offset y"
              value={effect.offset[1]}
              onChange={(e) => onChange({ ...effect, offset: [effect.offset[0], Number(e.target.value)] })}
              className="w-1/2 rounded border border-gray-300 px-1 py-0.5"
            />
          </div>
        </>
      );
    case 'line-shadow':
      return (
        <>
          <input type="color" value={effect.color} onChange={(e) => onChange({ ...effect, color: e.target.value })} />
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="offset x"
              value={effect.offset[0]}
              onChange={(e) => onChange({ ...effect, offset: [Number(e.target.value), effect.offset[1]] })}
              className="w-1/2 rounded border border-gray-300 px-1 py-0.5"
            />
            <input
              type="number"
              placeholder="offset y"
              value={effect.offset[1]}
              onChange={(e) => onChange({ ...effect, offset: [effect.offset[0], Number(e.target.value)] })}
              className="w-1/2 rounded border border-gray-300 px-1 py-0.5"
            />
          </div>
          <input
            type="number"
            min={0}
            value={effect.thickness}
            onChange={(e) => onChange({ ...effect, thickness: Number(e.target.value) })}
            placeholder="thickness"
            className="rounded border border-gray-300 px-1 py-0.5"
          />
        </>
      );
    case '3d-shadow':
      return (
        <>
          <input type="color" value={effect.color} onChange={(e) => onChange({ ...effect, color: e.target.value })} />
          <input
            type="number"
            value={Math.round((effect.angle * 180) / Math.PI)}
            onChange={(e) => onChange({ ...effect, angle: (Number(e.target.value) * Math.PI) / 180 })}
            placeholder="angle"
            className="rounded border border-gray-300 px-1 py-0.5"
          />
          <input
            type="number"
            min={0}
            value={effect.depth}
            onChange={(e) => onChange({ ...effect, depth: Number(e.target.value) })}
            placeholder="depth"
            className="rounded border border-gray-300 px-1 py-0.5"
          />
        </>
      );
```

- [ ] **Step 5: Render `ShadowQuickAdd` in the main `PropertiesPanel` component, and update the `EffectsControls` call site**

Change:

```tsx
      <EffectsControls effects={node.effects} onChange={(effects) => updateProps({ effects })} />
```

to:

```tsx
      <ShadowQuickAdd node={node} effects={node.effects} onChange={(effects) => updateProps({ effects })} />

      <EffectsControls node={node} effects={node.effects} onChange={(effects) => updateProps({ effects })} />
```

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All PASS, no new type errors.

- [ ] **Step 7: Commit**

```bash
git add src/ui/PropertiesPanel.tsx
git commit -m "feat: add shadow quick-add buttons and node-aware effect defaults"
```

---

### Task 6: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite one more time**

Run: `npx vitest run && npx tsc --noEmit && npx eslint .`
Expected: All PASS.

- [ ] **Step 2: Start the dev server and smoke-test in a browser**

Run: `npm run dev` (or use the project's preview tooling), then in the running app:
1. Add a text node (from slice 1's "Add Text" button), select it.
2. In the PropertiesPanel, confirm a new "Shadow" section appears above "Effects", with 4 buttons: Drop, Line, Block, 3D.
3. Click "Drop" — a soft blurred shadow appears behind the text, offset down-right.
4. Remove it (via the generic Effects list's "Remove" button below), click "Block" — a solid, hard-edged offset silhouette appears (no blur).
5. Remove it, click "Line" — a thin outline-only shadow traces the offset silhouette's boundary (not filled).
6. Remove it, click "3D" — a layered, progressively-darkening stack of offset copies appears, giving a depth/extrusion look.
7. With one of the shadow effects still applied, change the text's font Size control (from slice 1) to a much larger or smaller value — confirm the shadow visibly scales proportionally (bigger text → bigger shadow), with no extra action needed.
8. Add a shape node (from the existing "Add Shape" button), apply a "shadow" effect to it via the generic Effects dropdown (not the quick-buttons, which are effectively the same underlying effect) — confirm it still looks and behaves exactly as it did before this slice (same default blur/offset values, no unexpected scaling — shapes have no font size, so `basis` is always `1`).
9. Undo/redo through several of the above steps — confirm shadow add/remove/param changes are all undoable via the existing history mechanism (no new Command was introduced, so this should already work for free).
10. Check the browser console and dev server logs for errors throughout.

- [ ] **Step 3: Report results**

Note any visual bugs found, especially around the `line-shadow` GLSL filter's visual quality (the plan's shader is a first-pass approximation, flagged as such in its own code comment — if it looks wrong, that's expected to potentially need a follow-up pass, not a sign this task's plan was followed incorrectly). If everything above works, this slice is complete and ready for the next slice (Transformations/warp, per `docs/superpowers/specs/2026-08-03-text-effects-design.md`).
