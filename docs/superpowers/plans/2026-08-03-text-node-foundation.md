# TextNode Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring text back into the editor as a first-class node type (`TextNode`) with a static Google Fonts list, Pixi rendering, and basic add/edit UI — the foundation slice for `requirement.md`'s Kittl-style text-effects feature set.

**Architecture:** Follows the codebase's existing node-type pattern exactly: a Zod schema (`TextNodeSchema`) extending `BaseNodeShape`, a renderer module exporting `{ create, update }` (`textRenderer.ts`, mirroring `shapeRenderer.ts`), registration in `SceneReconciler`'s two type switches, and UI surfaces (`Toolbar`, `PropertiesPanel`, `SelectionOverlay`) following their current per-type-branch conventions. `effects`/`opacity`/`blendMode` come free from `BaseNodeShape` — `applyTransform.ts` already calls `buildFilters(node.effects)` generically for any node, so shadow/glow/outline/blur effects apply to text with zero new code once it renders as a Pixi object.

**Tech Stack:** TypeScript, Zod, Pixi.js v8 (`Text`, `TextStyle`), React, Vitest (`@vitest-environment jsdom` for renderer tests), pnpm.

## Global Constraints

- Google Fonts list is a static bundled array (no API key, no runtime catalog fetch) — see `docs/superpowers/specs/2026-08-03-text-effects-design.md`.
- No `opentype.js`, no glyph-outline parsing — text renders via Pixi's own `Text`/`TextStyle`, same as every prior phase's convention (see `CONTEXT.md`'s "Warp"/"FontService" entries for why this codebase avoids that dependency).
- `TextNode.stroke` is declared in the schema (reusing `StrokeSchema`) but **not rendered** in this slice — multi-layer stroke rendering for text is the decorations slice's job. Same "declared now, wired later" convention `SvgNode.overrides`'s gradient case already uses.
- Font loading is fire-and-forget: render immediately with whatever font is synchronously available, re-style once the Google Font resolves. No loading spinner, no blocking.
- Every non-trivial function gets a test. No new npm dependencies.

---

### Task 1: Static Google Fonts list + loader

**Files:**
- Create: `src/fonts/googleFonts.ts`
- Test: `src/fonts/__tests__/googleFonts.test.ts`

**Interfaces:**
- Produces: `GoogleFontEntry { family: string; weights: number[] }`, `GOOGLE_FONTS: GoogleFontEntry[]`, `DEFAULT_FONT_FAMILY: string`, `loadGoogleFont(family: string, weight?: number): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/fonts/__tests__/googleFonts.test.ts
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { GOOGLE_FONTS, DEFAULT_FONT_FAMILY, loadGoogleFont } from '../googleFonts';

describe('GOOGLE_FONTS', () => {
  it('has at least one entry, each with a non-empty family and at least one weight', () => {
    expect(GOOGLE_FONTS.length).toBeGreaterThan(0);
    for (const entry of GOOGLE_FONTS) {
      expect(entry.family.length).toBeGreaterThan(0);
      expect(entry.weights.length).toBeGreaterThan(0);
    }
  });

  it('DEFAULT_FONT_FAMILY matches the first entry in the list', () => {
    expect(DEFAULT_FONT_FAMILY).toBe(GOOGLE_FONTS[0].family);
  });
});

describe('loadGoogleFont', () => {
  it('resolves without throwing and without a network call when FontFace is unavailable (jsdom has none)', async () => {
    await expect(loadGoogleFont('Roboto', 400)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/fonts/__tests__/googleFonts.test.ts`
Expected: FAIL with "Cannot find module '../googleFonts'"

- [ ] **Step 3: Write the implementation**

```ts
// src/fonts/googleFonts.ts

export interface GoogleFontEntry {
  family: string;
  weights: number[];
}

// Curated static list (not the full ~1500-font Google catalog — see
// docs/superpowers/specs/2026-08-03-text-effects-design.md for why: no API
// key, no runtime catalog fetch). Extending this is a data change, not a
// code change.
export const GOOGLE_FONTS: GoogleFontEntry[] = [
  { family: 'Roboto', weights: [300, 400, 500, 700, 900] },
  { family: 'Open Sans', weights: [300, 400, 600, 700, 800] },
  { family: 'Montserrat', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Lato', weights: [300, 400, 700, 900] },
  { family: 'Poppins', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Oswald', weights: [300, 400, 500, 600, 700] },
  { family: 'Playfair Display', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Bebas Neue', weights: [400] },
  { family: 'Inter', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Merriweather', weights: [300, 400, 700, 900] },
];

export const DEFAULT_FONT_FAMILY = GOOGLE_FONTS[0].family;

const loaded = new Set<string>();

// Loads a Google Font via its public CSS2 endpoint (the same one <link>
// tags use — no API key needed) + the FontFace API. No-ops outside a
// browser that has FontFace/document.fonts (jsdom in tests has neither) —
// text still renders with the browser's fallback font in that case, same
// "never throw, just degrade" convention loadImageSize/svgNaturalSize
// (Toolbar.tsx) already use.
export async function loadGoogleFont(family: string, weight = 400): Promise<void> {
  const key = `${family}:${weight}`;
  if (loaded.has(key)) return;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return;

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const cssResponse = await fetch(cssUrl);
  const css = await cssResponse.text();
  const match = css.match(/url\((https:\/\/[^)]+)\)/);
  if (!match) return;

  const fontFace = new FontFace(family, `url(${match[1]})`, { weight: String(weight) });
  await fontFace.load();
  document.fonts.add(fontFace);
  loaded.add(key);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/fonts/__tests__/googleFonts.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/fonts/googleFonts.ts src/fonts/__tests__/googleFonts.test.ts
git commit -m "feat: add static Google Fonts list and FontFace loader"
```

---

### Task 2: TextNode schema

**Files:**
- Modify: `src/schema/node.ts`
- Modify: `src/schema/__tests__/document.test.ts`

**Interfaces:**
- Consumes: `BaseNodeShape` (`src/schema/base.ts`), `FillSchema`/`StrokeSchema` (`src/schema/fill-stroke.ts`) — all pre-existing, unchanged.
- Produces: `TextNodeSchema`, `type TextNode = { id, name?, transform, size, opacity, visible, locked, blendMode?, effects?, type: 'text', content: string, font: { family: string; size: number; weight?: number; italic?: boolean; letterSpacing?: number; lineHeight?: number }, align: 'left' | 'center' | 'right', fill: Fill, stroke?: Stroke }`. `Node` union becomes `ShapeNode | ImageNode | SvgNode | GroupNode | TextNode`.

- [ ] **Step 1: Write the failing test**

Add to `src/schema/__tests__/document.test.ts` (inside the existing `describe('DocumentSchema', ...)` block, after the `'NodeSchema accepts svg nodes'` test):

```ts
  it('NodeSchema accepts text nodes (TextNode foundation slice)', () => {
    const textNode = {
      id: 'node_4',
      type: 'text',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 200, height: 60 },
      opacity: 1,
      visible: true,
      locked: false,
      content: 'Hello',
      font: { family: 'Roboto', size: 48 },
      align: 'left',
      fill: { type: 'solid', color: '#000000' },
    };

    expect(() => NodeSchema.parse(textNode)).not.toThrow();
  });

  it('NodeSchema rejects a text node missing required font.size', () => {
    const textNode = {
      id: 'node_5',
      type: 'text',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      size: { width: 200, height: 60 },
      opacity: 1,
      visible: true,
      locked: false,
      content: 'Hello',
      font: { family: 'Roboto' },
      align: 'left',
      fill: { type: 'solid', color: '#000000' },
    };

    expect(() => NodeSchema.parse(textNode)).toThrow();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/schema/__tests__/document.test.ts`
Expected: FAIL — `NodeSchema` rejects `type: 'text'` (not in the discriminated union yet).

- [ ] **Step 3: Add TextNodeSchema to `src/schema/node.ts`**

Insert after `SvgNodeSchema`/`SvgNode` (before the `GroupNode` comment block):

```ts
// TextNode (TextNode foundation slice, see
// docs/superpowers/specs/2026-08-03-text-effects-design.md): plain text,
// no warp/decorations yet (later slices). `stroke` reuses StrokeSchema
// as-is but is schema-only for now — textRenderer.ts doesn't render it,
// same "declared now, wired later" convention SvgNode.overrides' gradient
// case already uses. `size` is the text box's wrap width/height (see
// textRenderer.ts's wordWrap usage), not an auto-fit-to-content box.
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

Then update the union at the bottom of the file:

```ts
export const NodeSchema: z.ZodType<Node> = z.discriminatedUnion('type', [
  ShapeNodeSchema,
  ImageNodeSchema,
  SvgNodeSchema,
  GroupNodeSchema,
  TextNodeSchema,
]);
export type Node = ShapeNode | ImageNode | SvgNode | GroupNode | TextNode;
```

Also update the file's top comment (`// 'shape' | 'image' | 'group' are valid node types. ...`) to mention `'text'` is now valid too.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/schema/__tests__/document.test.ts`
Expected: PASS (all tests, including the 2 new ones)

- [ ] **Step 5: Run full test suite to check for compile breaks**

Run: `npx vitest run`
Expected: `SceneReconciler.ts` and `PropertiesPanel.tsx`'s `switch (node.type)` are exhaustive checks over the old 4-member union — adding `'text'` to `Node` will now make TypeScript flag those switches as non-exhaustive. This is expected and fixed in Tasks 4 and 6. If `npx tsc --noEmit` is part of the test run, note the new errors but do not fix them yet — they're the exact list of remaining tasks.

- [ ] **Step 6: Commit**

```bash
git add src/schema/node.ts src/schema/__tests__/document.test.ts
git commit -m "feat: add TextNode to the document schema"
```

---

### Task 3: Text renderer

**Files:**
- Create: `src/render/renderers/textRenderer.ts`
- Test: `src/render/__tests__/textRenderer.test.ts`

**Interfaces:**
- Consumes: `TextNode` (Task 2), `applyTransform` (`src/render/applyTransform.ts`, unchanged), `resolveFill` (`src/render/fillToColor.ts`, unchanged), `loadGoogleFont` (Task 1).
- Produces: `textRenderer: { create(node: TextNode): Text; update(obj: Text, node: TextNode): void }` — same shape as `shapeRenderer`/`imageRenderer`/`svgRenderer`/`groupRenderer`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/render/__tests__/textRenderer.test.ts
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Text } from 'pixi.js';
import { textRenderer } from '../renderers/textRenderer';
import type { TextNode } from '../../schema';

function makeTextNode(overrides: Partial<TextNode> = {}): TextNode {
  return {
    id: 'text-1',
    transform: { x: 10, y: 20, scaleX: 1, scaleY: 1, rotation: 0 },
    size: { width: 200, height: 60 },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'text',
    content: 'Hello world',
    font: { family: 'Roboto', size: 32 },
    align: 'left',
    fill: { type: 'solid', color: '#111111' },
    ...overrides,
  };
}

describe('textRenderer', () => {
  it('create() returns a PIXI.Text with the node content and position', () => {
    const node = makeTextNode();
    const obj = textRenderer.create(node);
    expect(obj).toBeInstanceOf(Text);
    expect(obj.text).toBe('Hello world');
    expect(obj.position.x).toBe(10);
    expect(obj.position.y).toBe(20);
  });

  it('update() changes the text content in place without recreating the object', () => {
    const node = makeTextNode();
    const obj = textRenderer.create(node);
    const updated = { ...node, content: 'Changed' };
    textRenderer.update(obj, updated);
    expect(obj.text).toBe('Changed');
  });

  it('update() applies fontSize/fontFamily/align from the node', () => {
    const node = makeTextNode({ font: { family: 'Montserrat', size: 64 }, align: 'center' });
    const obj = textRenderer.create(node);
    expect(obj.style.fontFamily).toBe('Montserrat');
    expect(obj.style.fontSize).toBe(64);
    expect(obj.style.align).toBe('center');
  });

  it('wraps text at the node size width', () => {
    const node = makeTextNode({ size: { width: 300, height: 100 } });
    const obj = textRenderer.create(node);
    expect(obj.style.wordWrap).toBe(true);
    expect(obj.style.wordWrapWidth).toBe(300);
  });

  it('does not throw when a font is not yet loaded (no live Pixi renderer in jsdom)', () => {
    const node = makeTextNode({ font: { family: 'Nonexistent Font', size: 32 } });
    expect(() => textRenderer.create(node)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/render/__tests__/textRenderer.test.ts`
Expected: FAIL with "Cannot find module '../renderers/textRenderer'"

- [ ] **Step 3: Write the implementation**

```ts
// src/render/renderers/textRenderer.ts
import { Text, TextStyle } from 'pixi.js';
import type { TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill } from '../fillToColor';
import { loadGoogleFont } from '../../fonts/googleFonts';

// TextNode.stroke is schema-only in this slice — rendering multi-layer
// text stroke is the decorations slice's job (see
// docs/superpowers/specs/2026-08-03-text-effects-design.md).
const loadedFontKey = new WeakMap<Text, string>();

function fontKey(node: TextNode): string {
  return `${node.font.family}:${node.font.weight ?? 400}:${node.font.italic ? 'italic' : 'normal'}`;
}

// node.size is the text box's wrap width/height, not an auto-fit-to-content
// box — wordWrap always on, matching how a resizable text box behaves in
// Canva/Kittl-style editors. Height isn't clipped (Pixi doesn't do this for
// Text out of the box); overflow handling isn't in scope for this slice.
function buildStyle(node: TextNode): TextStyle {
  const options: ConstructorParameters<typeof TextStyle>[0] = {
    fontFamily: node.font.family,
    fontSize: node.font.size,
    fontStyle: node.font.italic ? 'italic' : 'normal',
    letterSpacing: node.font.letterSpacing ?? 0,
    align: node.align,
    fill: resolveFill(node.fill),
    wordWrap: true,
    wordWrapWidth: node.size.width,
  };
  if (node.font.weight !== undefined) options.fontWeight = String(node.font.weight) as TextStyle['fontWeight'];
  if (node.font.lineHeight !== undefined) options.lineHeight = node.font.lineHeight;
  return new TextStyle(options);
}

// Renders immediately with whatever font is synchronously available (the
// browser's fallback font if the Google Font hasn't loaded yet), then
// re-applies the style once loadGoogleFont resolves. No loading state, no
// blocking — same convention imageRenderer.ts's loadTexture uses for
// async asset loading.
function loadFontIfNeeded(obj: Text, node: TextNode): void {
  const key = fontKey(node);
  if (loadedFontKey.get(obj) === key) return;
  loadedFontKey.set(obj, key);
  loadGoogleFont(node.font.family, node.font.weight ?? 400)
    .then(() => {
      if (!obj.destroyed) obj.style = buildStyle(node);
    })
    .catch(() => {
      // A font that fails to load shouldn't crash the editor — text stays
      // on the fallback font, same "never throw" convention
      // imageRenderer.ts's loadTexture uses for a broken image asset.
    });
}

export const textRenderer = {
  create(node: TextNode): Text {
    const obj = new Text({ text: node.content, style: buildStyle(node) });
    this.update(obj, node);
    return obj;
  },
  update(obj: Text, node: TextNode): void {
    obj.text = node.content;
    obj.style = buildStyle(node);
    loadFontIfNeeded(obj, node);
    applyTransform(obj, node);
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/render/__tests__/textRenderer.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/render/renderers/textRenderer.ts src/render/__tests__/textRenderer.test.ts
git commit -m "feat: add textRenderer for TextNode"
```

---

### Task 4: Wire TextNode into SceneReconciler

**Files:**
- Modify: `src/render/SceneReconciler.ts`
- Modify: `src/render/__tests__/SceneReconciler.test.ts`

**Interfaces:**
- Consumes: `textRenderer` (Task 3).
- Produces: nothing new exported — `SceneReconciler`'s public API (`mount`/`apply`/`getDisplayObject`/`destroy`) is unchanged; this task just makes its two internal switches exhaustive again.

- [ ] **Step 1: Write the failing test**

Add to `src/render/__tests__/SceneReconciler.test.ts`, inside `makePage()`'s `children` array (after the `image-1` entry), and a new `it` block:

```ts
      {
        id: 'text-1',
        type: 'text',
        transform: { x: 20, y: 20, scaleX: 1, scaleY: 1, rotation: 0 },
        size: { width: 150, height: 40 },
        opacity: 1,
        visible: true,
        locked: false,
        content: 'Title',
        font: { family: 'Roboto', size: 24 },
        align: 'left',
        fill: { type: 'solid', color: '#000000' },
      },
```

Adding a 4th child to `makePage()` raises every `layer.children` count in this file by exactly 1. Update these 4 existing assertions:

- `'mount() builds exactly one DisplayObject...'`: `expect(layer.children).toHaveLength(3);` → `expect(layer.children).toHaveLength(4);`
- `'AddNode adds one object...'`: `expect(layer.children).toHaveLength(4);` → `expect(layer.children).toHaveLength(5);`
- `'RemoveNode destroys and removes the object'`: `expect(layer.children).toHaveLength(2);` → `expect(layer.children).toHaveLength(3);`
- `'mounts a nested group recursively...'`: `expect(layer.children).toHaveLength(4); // 3 leaf nodes + 1 group container at the top level` → `expect(layer.children).toHaveLength(5); // 4 leaf nodes + 1 group container at the top level`

(`'Reorder changes sibling index...'` and `'RemoveNode on a group destroys its nested descendants too'` don't assert `layer.children`'s length, so they're unaffected.)

Add this new test at the end of the `describe('SceneReconciler', ...)` block:

```ts
  it('mounts a text node as a PIXI.Text', () => {
    const layer = new Container();
    const reconciler = new SceneReconciler(layer);
    const page = makePage();
    reconciler.mount(page, makeDoc(page));

    expect(reconciler.getDisplayObject('text-1')).toBeInstanceOf(Text);
  });
```

Add `Text` to the `pixi.js` import at the top of the file: `import { Container, Graphics, Sprite, Text } from 'pixi.js';`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/render/__tests__/SceneReconciler.test.ts`
Expected: FAIL — `createDisplayObject`/`updateDisplayObject` switches don't have a `'text'` case (TypeScript non-exhaustive-switch error, or a runtime `undefined` return depending on `strict` settings).

- [ ] **Step 3: Add the `'text'` case to both switches in `src/render/SceneReconciler.ts`**

```ts
import { textRenderer } from './renderers/textRenderer';
```

```ts
function createDisplayObject(node: Node, doc: Document): Container {
  switch (node.type) {
    case 'shape':
      return shapeRenderer.create(node);
    case 'image':
      return imageRenderer.create(node, doc);
    case 'svg':
      return svgRenderer.create(node, doc);
    case 'group':
      return groupRenderer.create(node);
    case 'text':
      return textRenderer.create(node);
  }
}

function updateDisplayObject(obj: Container, node: Node, doc: Document): void {
  switch (node.type) {
    case 'shape':
      shapeRenderer.update(obj as never, node);
      break;
    case 'image':
      imageRenderer.update(obj as never, node, doc);
      break;
    case 'svg':
      svgRenderer.update(obj as never, node, doc);
      break;
    case 'group':
      groupRenderer.update(obj as never, node);
      break;
    case 'text':
      textRenderer.update(obj as never, node);
      break;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/render/__tests__/SceneReconciler.test.ts`
Expected: PASS (all tests, including the new one)

- [ ] **Step 5: Commit**

```bash
git add src/render/SceneReconciler.ts src/render/__tests__/SceneReconciler.test.ts
git commit -m "feat: wire TextNode into SceneReconciler"
```

---

### Task 5: Toolbar "Add Text" button

**Files:**
- Modify: `src/ui/Toolbar.tsx`

**Interfaces:**
- Consumes: `TextNode` (Task 2), `DEFAULT_FONT_FAMILY` (Task 1).
- Produces: `defaultTextNode(): TextNode` (exported, mirroring the existing `defaultImageNode`/`defaultSvgNode` exports so `PropertiesPanel`/tests can reuse it later if needed).

No test file for this task — `Toolbar.tsx` has no existing test file (it's a thin wiring component; verified manually in Task 8), matching this codebase's existing convention (`defaultShapeNode`/`defaultImageNode` also have no dedicated unit test).

- [ ] **Step 1: Add the import and `defaultTextNode` function**

In `src/ui/Toolbar.tsx`, update the type import:

```ts
import type { ImageNode, ShapeNode, SvgNode, TextNode, Transform } from '../schema';
import { DEFAULT_FONT_FAMILY } from '../fonts/googleFonts';
```

Add after `defaultShapeNode()`:

```ts
export function defaultTextNode(): TextNode {
  return {
    id: nanoid(),
    transform: { ...DEFAULT_TRANSFORM },
    size: { width: 200, height: 60 },
    opacity: 1,
    visible: true,
    locked: false,
    type: 'text',
    content: 'Text',
    font: { family: DEFAULT_FONT_FAMILY, size: 48 },
    align: 'left',
    fill: { type: 'solid', color: '#000000' },
  };
}
```

- [ ] **Step 2: Widen `addNode`'s parameter type and add the button**

Change:

```ts
const addNode = (node: ShapeNode | ImageNode | SvgNode) => {
```

to:

```ts
const addNode = (node: ShapeNode | ImageNode | SvgNode | TextNode) => {
```

Add a button next to "Add Shape" (after the `Add Shape` `<button>` block):

```tsx
<button type="button" onClick={() => addNode(defaultTextNode())} className="rounded bg-gray-100 px-3 py-1">
  Add Text
</button>
```

- [ ] **Step 3: Run the full test suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, no new type errors from this file.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Toolbar.tsx
git commit -m "feat: add \"Add Text\" toolbar button"
```

---

### Task 6: PropertiesPanel font/align controls

**Files:**
- Modify: `src/ui/PropertiesPanel.tsx`

**Interfaces:**
- Consumes: `TextNode` (Task 2), `GOOGLE_FONTS` (Task 1).
- Produces: nothing new exported — internal `TextControls` component, following the file's existing internal-component convention (`ImageControls`, `SvgControls`, `StrokeControls` are all unexported).

No test file for this task — `PropertiesPanel.tsx` has no existing test file (matches this file's current state; verified manually in Task 8).

- [ ] **Step 1: Widen `hasFill` and add the `TextNode`/`GOOGLE_FONTS` imports**

```ts
import type { BlendMode, Effect, Fill, ImageNode, Node, Stroke, SvgNode, TextNode } from '../schema';
import { GOOGLE_FONTS } from '../fonts/googleFonts';
```

```ts
function hasFill(node: Node): node is Node & { fill: Fill } {
  return node.type === 'shape' || node.type === 'text';
}
```

- [ ] **Step 2: Render `TextControls` for text nodes**

In the `PropertiesPanel` component body, after the `node.type === 'svg'` block:

```tsx
      {node.type === 'text' && (
        <TextControls node={node} onChange={(patch) => updateProps(patch as Partial<Node>)} />
      )}
```

- [ ] **Step 3: Add the `TextControls` component**

Add near the other `*Controls` components (e.g. after `SvgControls`):

```tsx
// Font/size/weight/italic/align controls for a TextNode. Fill/opacity/
// blend-mode/effects are already handled by the shared controls above
// (hasFill() now includes 'text'). Stroke controls are deliberately not
// shown here yet — TextNode.stroke isn't rendered until the decorations
// slice (see textRenderer.ts).
function TextControls({ node, onChange }: { node: TextNode; onChange: (patch: Partial<TextNode>) => void }) {
  const fontEntry = GOOGLE_FONTS.find((f) => f.family === node.font.family) ?? GOOGLE_FONTS[0];

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-medium">Text</legend>
      <label className="flex flex-col gap-1">
        Font
        <select
          value={node.font.family}
          onChange={(e) => onChange({ font: { ...node.font, family: e.target.value } })}
          className="rounded border border-gray-300 px-1 py-0.5"
        >
          {GOOGLE_FONTS.map((f) => (
            <option key={f.family} value={f.family}>
              {f.family}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Weight
        <select
          value={node.font.weight ?? 400}
          onChange={(e) => onChange({ font: { ...node.font, weight: Number(e.target.value) } })}
          className="rounded border border-gray-300 px-1 py-0.5"
        >
          {fontEntry.weights.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Size
        <input
          type="number"
          min={1}
          value={node.font.size}
          onChange={(e) => onChange({ font: { ...node.font, size: Number(e.target.value) } })}
          className="rounded border border-gray-300 px-1 py-0.5"
        />
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={node.font.italic ?? false}
          onChange={(e) => onChange({ font: { ...node.font, italic: e.target.checked } })}
        />
        Italic
      </label>
      <label className="flex flex-col gap-1">
        Align
        <select
          value={node.align}
          onChange={(e) => onChange({ align: e.target.value as TextNode['align'] })}
          className="rounded border border-gray-300 px-1 py-0.5"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
    </fieldset>
  );
}
```

- [ ] **Step 4: Run the full test suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, no new type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/PropertiesPanel.tsx
git commit -m "feat: add font/align controls for text nodes in PropertiesPanel"
```

---

### Task 7: Inline text editing (double-click to edit)

**Files:**
- Modify: `src/ui/SelectionOverlay.tsx`

**Interfaces:**
- Consumes: `TextNode` (Task 2), existing `viewport.toScreen`/`toWorld` (unchanged), `useEditorStoreApi` (unchanged).
- Produces: nothing new exported — internal `TextEditOverlay` component, mirroring the file's existing internal `ImageCropHandles`/`Marquee`/`SnapGuides` convention.

No test file for this task — `SelectionOverlay.tsx`'s existing test file (`src/ui/__tests__/SelectionOverlay.test.ts`) only covers pure math helpers (`updateCropHandle` etc.), not component rendering; this task adds no new pure-function logic to test (verified manually in Task 8).

- [ ] **Step 1: Add editing state and wire the double-click handler**

In `SingleSelectionOverlay`, add local state alongside `croppingNodeId`:

```ts
const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
const isEditingText = node.type === 'text' && editingNodeId === node.id;
```

Update the bounding-box `<div>`'s `onDoubleClick` and `className`:

```tsx
onDoubleClick={() => {
  if (node.type === 'image') setCroppingNodeId(isCropping ? null : node.id);
  if (node.type === 'text') setEditingNodeId(node.id);
}}
```

```tsx
className={`absolute border-2 border-blue-500 ${
  node.type === 'image' || node.type === 'text' ? 'pointer-events-auto' : ''
}`}
```

Hide resize/rotate handles while editing (change the two `{!isCropping && ...}` guards to `{!isCropping && !isEditingText && ...}`):

```tsx
{!isCropping && !isEditingText &&
  HANDLES.map((handle) => {
```

```tsx
{!isCropping && !isEditingText && (
  <div
    onPointerDown={startRotate}
    ...
```

- [ ] **Step 2: Render `TextEditOverlay` when editing**

After the `isCropping && node.type === 'image'` block:

```tsx
{isEditingText && node.type === 'text' && (
  <TextEditOverlay
    node={node}
    activePageId={activePageId}
    topLeftScreen={topLeftScreen}
    rotationDeg={rotationDeg}
    zoom={camera.zoom}
    onDone={() => setEditingNodeId(null)}
  />
)}
```

- [ ] **Step 3: Add the `TextEditOverlay` component**

Add near `ImageCropHandles`:

```tsx
// Inline text editing: an absolutely-positioned <textarea> over the node's
// screen-space rect (double-click to enter, mirroring ImageCropHandles'
// double-click-to-crop toggle above). Enter (without Shift) or blur commits
// via UpdateProps; Escape cancels without dispatching. Local `value` state
// so keystrokes don't round-trip through the store/history on every
// character — only the committed content becomes a history entry.
function TextEditOverlay({
  node,
  activePageId,
  topLeftScreen,
  rotationDeg,
  zoom,
  onDone,
}: {
  node: TextNode;
  activePageId: string;
  topLeftScreen: Point;
  rotationDeg: number;
  zoom: number;
  onDone: () => void;
}) {
  const store = useEditorStoreApi();
  const [value, setValue] = useState(node.content);

  const commit = () => {
    if (value !== node.content) {
      store.getState().dispatch({ type: 'UpdateProps', pageId: activePageId, nodeId: node.id, patch: { content: value } });
    }
    onDone();
  };

  return (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onDone();
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          commit();
        }
      }}
      className="pointer-events-auto absolute resize-none border-2 border-blue-500 bg-white/90 p-0 outline-none"
      style={{
        left: topLeftScreen.x,
        top: topLeftScreen.y,
        width: node.size.width * zoom,
        height: node.size.height * zoom,
        fontSize: node.font.size * zoom,
        transformOrigin: '0 0',
        transform: `rotate(${rotationDeg}deg)`,
      }}
    />
  );
}
```

Add `TextNode` to the file's type import:

```ts
import type { ImageNode, Node, TextNode, Transform } from '../schema';
```

- [ ] **Step 4: Run the full test suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, no new type errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/SelectionOverlay.tsx
git commit -m "feat: add double-click inline text editing"
```

---

### Task 8: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite one more time**

Run: `npx vitest run && npx tsc --noEmit && npx eslint .`
Expected: All PASS.

- [ ] **Step 2: Start the dev server and smoke-test in a browser**

Run: `npm run dev` (or use the project's preview tooling), then in the running app:
1. Click "Add Text" — a "Text" node appears on the canvas.
2. Select it — the PropertiesPanel shows Font/Weight/Size/Italic/Align/Fill/Opacity/Blend Mode/Effects controls.
3. Change the font family in the dropdown — the on-canvas text visually re-renders (after the Google Font network request resolves).
4. Double-click the text node — an editable textarea overlay appears at the right position/size; type new content, press Enter — the canvas text updates and the overlay closes.
5. Add a `shadow` effect via the existing Effects control — it visually applies to the text (confirms `buildFilters` genuinely works on `text` nodes with zero new code, per this plan's Architecture section).
6. Undo/redo — text add/edit are both undoable (confirms `AddNode`/`UpdateProps` dispatch, not a bespoke command, actually wired through the existing history mechanism).

- [ ] **Step 3: Report results**

Note any visual bugs found. If everything above works, this slice is complete and ready for the next slice (Effects panel + shadows, per `docs/superpowers/specs/2026-08-03-text-effects-design.md`).
