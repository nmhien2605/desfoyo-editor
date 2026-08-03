# Slice 3: Text Warp/Transformations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `TextNode` an optional `warp` field driving 8 shape-warp styles (arch, wave, rise, flag, circle, distort, angle, custom-mesh), rendered via true glyph-outline geometry (opentype.js) rather than a rasterized-texture warp, with PropertiesPanel sliders and on-canvas drag handles.

**Architecture:** A node with `warp` set renders as a Pixi `Mesh` (triangulated glyph outlines, custom GLSL fill shader) instead of `PIXI.Text`; a node without `warp` is byte-for-byte unchanged from slices 1-2. `opentype.js` (+ `wawoff2` to decompress Google Fonts' WOFF2) extracts real glyph vector paths; an independent layout pass (not Canvas) places them; `earcut` (already bundled by `pixi.js`) triangulates; warp displacement functions perturb vertices; a hand-written mesh shader renders solid or gradient fills.

**Tech Stack:** opentype.js 2.0.0, wawoff2 2.0.1, earcut (via `pixi.js`'s re-export), Pixi v8 `Mesh`/`MeshGeometry`/`Shader.from({ gl })`, Vitest/jsdom.

## Global Constraints

- `node.warp === undefined` must render identically to slices 1-2 (plain `PIXI.Text`) — zero regression for every already-shipped text node. Verify this explicitly in Task 7's tests.
- Full spec: `docs/superpowers/specs/2026-08-03-text-effects-design.md`, "Slice 3: Transformations / Warp" section (includes the post-write compatibility-review patch adding the `warpEditingNodeId` mutual-exclusion gate — Task 9 depends on it).
- Mesh shader uniform/attribute names (`aPosition`, `aUV`, `uProjectionMatrix`, `uWorldTransformMatrix`, `uWorldColorAlpha`, `uTransformMatrix`, `uColor`, `uRound`, `uResolution`) were verified directly against `node_modules/pixi.js/lib/rendering/high-shader/defaultProgramTemplate.js` and `.../shader-bits/{globalUniformsBit,localUniformBit}.js` — Pixi's `GlMeshAdaptor` (`node_modules/pixi.js/lib/scene/mesh/gl/GlMeshAdaptor.js`) auto-binds groups 100/101 to whatever shader is assigned to `mesh.shader`, by reflected uniform name, regardless of whether that shader was built via Pixi's high-shader compiler or (as here) hand-written raw GLSL. Use these exact names — do not invent new ones.
- `MeshGeometry`'s `uvs` field is repurposed in this slice to carry each vertex's **pre-warp** normalized position (for gradient-space lookup), not real texture coordinates — no texture is sampled by the glyph fill shader.
- `earcut` needs no new dependency: `import { earcut } from 'pixi.js'` (confirmed via `node_modules/pixi.js/lib/index.js:1370`, `exports.earcut = utils.earcut`).
- Bezier flattening uses a fixed 10 segments per curve command (no adaptive subdivision) — this is an intentional v1 scope cut per the spec, not an oversight.
- `opentype.js` cannot parse WOFF2 directly; it must be decompressed with `wawoff2` first (verified against the library's own README, which shows this exact `opentype.parse(Module.decompress(await buffer))` pattern for browser use).

---

### Task 1: Dependencies + font-file fetch/decompress/parse pipeline

**Files:**
- Modify: `package.json` (add `opentype.js@^2.0.0`, `wawoff2@^2.0.1`)
- Create: `src/fonts/googleFontFiles.ts`
- Test: `src/fonts/__tests__/googleFontFiles.test.ts`

**Interfaces:**
- Produces: `getFontForWarp(family: string, weight: number, text: string): Promise<opentype.Font | null>` — the only export later tasks consume. Returns `null` (never throws) if the font file couldn't be fetched/decompressed/parsed for any reason — same "never throw, degrade" convention `googleFonts.ts`'s `loadGoogleFont` already uses. Internally caches per `family:weight` (not per-text — see step 3, the whole font file is fetched once and reused for any text).

- [ ] **Step 1: Add dependencies**

```bash
npm install opentype.js@^2.0.0 wawoff2@^2.0.1
```

- [ ] **Step 2: Write the CSS2-block parser (pure function, test first)**

```ts
// src/fonts/__tests__/googleFontFiles.test.ts
import { describe, it, expect } from 'vitest';
import { parseFontFaceBlocks } from '../googleFontFiles';

const FIXTURE_CSS = `
/* latin-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/roboto/v30/latin-ext.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/roboto/v30/latin.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`;

describe('parseFontFaceBlocks', () => {
  it('extracts every @font-face block with its unicode-range and url', () => {
    const blocks = parseFontFaceBlocks(FIXTURE_CSS);
    expect(blocks).toHaveLength(2);
    expect(blocks[1].url).toBe('https://fonts.gstatic.com/s/roboto/v30/latin.woff2');
    expect(blocks[1].ranges).toContainEqual({ start: 0x0000, end: 0x00ff });
  });

  it('picks the block covering a given Latin codepoint, not the first block in the response', () => {
    const blocks = parseFontFaceBlocks(FIXTURE_CSS);
    const covering = blocks.find((b) => b.ranges.some((r) => 0x41 >= r.start && 0x41 <= r.end)); // 'A' = U+0041
    expect(covering?.url).toBe('https://fonts.gstatic.com/s/roboto/v30/latin.woff2');
  });
});
```

Run: `npx vitest run src/fonts/__tests__/googleFontFiles.test.ts`
Expected: FAIL (`parseFontFaceBlocks` not defined yet).

- [ ] **Step 3: Implement `googleFontFiles.ts`**

```ts
// src/fonts/googleFontFiles.ts
import * as opentype from 'opentype.js';

export interface UnicodeRange {
  start: number;
  end: number;
}

export interface FontFaceBlock {
  url: string;
  ranges: UnicodeRange[];
}

// Parses a Google Fonts CSS2 response into every @font-face block's WOFF2
// url + the codepoint ranges it covers. This is the fix for the exact bug
// class slice 1's final review caught in <link>-based loading (grabbing the
// wrong subset) — here at the parsing layer, since we need the actual font
// bytes rather than letting the browser's CSS engine pick a subset for us.
export function parseFontFaceBlocks(css: string): FontFaceBlock[] {
  const blocks: FontFaceBlock[] = [];
  const blockRe = /@font-face\s*{([^}]*)}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(css))) {
    const body = match[1];
    const urlMatch = /src:\s*url\(([^)]+)\)/.exec(body);
    const rangeMatch = /unicode-range:\s*([^;]+);/.exec(body);
    if (!urlMatch || !rangeMatch) continue;
    const ranges = rangeMatch[1].split(',').map((part) => parseRange(part.trim()));
    blocks.push({ url: urlMatch[1].trim(), ranges });
  }
  return blocks;
}

function parseRange(token: string): UnicodeRange {
  // Tokens look like "U+0000-00FF" (range) or "U+0131" (single codepoint).
  const [startHex, endHex] = token.replace(/^U\+/i, '').split('-');
  const start = parseInt(startHex, 16);
  return { start, end: endHex ? parseInt(endHex, 16) : start };
}

function blockForCodepoint(blocks: FontFaceBlock[], codepoint: number): FontFaceBlock | undefined {
  return blocks.find((b) => b.ranges.some((r) => codepoint >= r.start && codepoint <= r.end));
}

const fontCache = new Map<string, Promise<opentype.Font | null>>();

// Fetches the real WOFF2 font file(s) covering `text`'s codepoints, decompresses
// with wawoff2, and parses with opentype.js. Cached per family:weight — the
// whole parsed Font is reused for any later text on that family/weight, since
// re-fetching per node/per-render would be wasteful and opentype.js's Font
// object works for characters outside the text that first triggered the load
// as long as they're in the same Google-served subset(s).
//
// Multi-subset fonts (a character needing e.g. both 'latin' and 'latin-ext')
// aren't merged — only the FIRST subset covering the FIRST fetch's codepoints
// is parsed. This is a deliberate v1 scope cut: mixed-subset single nodes are
// rare (most real text stays within one subset), and the fallback (an
// unresolved character renders un-warped, see warpMesh.ts) degrades safely
// rather than crashing.
export async function getFontForWarp(family: string, weight: number, text: string): Promise<opentype.Font | null> {
  const key = `${family}:${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
      const cssRes = await fetch(cssUrl);
      const css = await cssRes.text();
      const blocks = parseFontFaceBlocks(css);
      if (blocks.length === 0) return null;

      const firstCodepoint = text.codePointAt(0) ?? 0x41;
      const block = blockForCodepoint(blocks, firstCodepoint) ?? blocks[0];

      const fontRes = await fetch(block.url);
      const compressed = new Uint8Array(await fontRes.arrayBuffer());
      const wawoff2 = await import('wawoff2');
      const decompressed = await wawoff2.decompress(compressed);
      return opentype.parse(decompressed.buffer);
    } catch {
      // Network failure, decompression failure, or a malformed font: warp
      // falls back to un-warped rendering (see warpMesh.ts) rather than
      // crashing the editor — same convention as loadGoogleFont's catch.
      return null;
    }
  })();

  fontCache.set(key, promise);
  return promise;
}
```

- [ ] **Step 4: Run the parser test**

Run: `npx vitest run src/fonts/__tests__/googleFontFiles.test.ts`
Expected: PASS (both `parseFontFaceBlocks` cases).

- [ ] **Step 5: Manual browser validation spike (not a unit test — jsdom can't validate real WASM/network)**

`wawoff2`'s decompression is a WebAssembly (emscripten) module; bundling WASM through Vite has known rough edges. Before continuing to Task 2, in this project's dev server:
```ts
// paste temporarily into any component's useEffect, or a scratch .ts file run via the browser console
import { getFontForWarp } from './src/fonts/googleFontFiles';
getFontForWarp('Roboto', 400, 'Hello').then((font) => console.log('glyphs:', font?.glyphs.length));
```
Expected: logs a glyph count > 0, no console errors about WASM/module resolution. **If this fails** (Vite can't resolve `wawoff2`'s WASM binding), stop and report — this is a load-bearing dependency risk flagged in the spec's compatibility review, not a task to silently work around. The likely fix is a Vite `optimizeDeps.exclude: ['wawoff2']` or `assetsInclude` tweak; diagnose the actual error before choosing one.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/fonts/googleFontFiles.ts src/fonts/__tests__/googleFontFiles.test.ts
git commit -m "feat: add opentype.js/wawoff2 font-file pipeline for glyph-outline warp"
```

---

### Task 2: Warp displacement formulas (pure functions)

**Files:**
- Create: `src/text/warpFormulas.ts`
- Test: `src/text/__tests__/warpFormulas.test.ts`

**Interfaces:**
- Consumes: nothing (pure math).
- Produces: `warpDisplacement(warp: Warp, x: number, y: number, boxWidth: number, boxHeight: number): { dx: number; dy: number }` where `x`/`y` are the vertex's pre-warp position in the text's local box space (same units as `node.size`, NOT normalized 0..1 — normalization happens inside each formula from `boxWidth`/`boxHeight` where needed). This is the function Task 5's mesh builder calls per vertex. `Warp` type comes from Task 4's schema — until Task 4 lands, this task defines its own local type matching the planned shape exactly (see Step 1) so the two tasks can run in either order; Task 4 must not diverge from it.

- [ ] **Step 1: Write the failing tests**

```ts
// src/text/__tests__/warpFormulas.test.ts
import { describe, it, expect } from 'vitest';
import { warpDisplacement } from '../warpFormulas';

describe('warpDisplacement', () => {
  it('arch: bows the vertical center up the most, edges not at all', () => {
    const box = { boxWidth: 100, boxHeight: 20 };
    const center = warpDisplacement({ type: 'arch', curve: 1 }, 50, 0, box.boxWidth, box.boxHeight);
    const edge = warpDisplacement({ type: 'arch', curve: 1 }, 0, 0, box.boxWidth, box.boxHeight);
    expect(Math.abs(center.dy)).toBeGreaterThan(Math.abs(edge.dy));
    expect(edge.dy).toBeCloseTo(0, 5);
  });

  it('wave: oscillates with the given frequency', () => {
    const d1 = warpDisplacement({ type: 'wave', amplitude: 1, frequency: 1 }, 0, 0, 100, 20);
    const d2 = warpDisplacement({ type: 'wave', amplitude: 1, frequency: 1 }, 100, 0, 100, 20);
    expect(d1.dy).toBeCloseTo(d2.dy, 5); // one full period across the box
  });

  it('rise: linear baseline slant proportional to amount', () => {
    const half = warpDisplacement({ type: 'rise', amount: 0.5 }, 100, 0, 100, 20);
    const full = warpDisplacement({ type: 'rise', amount: 1 }, 100, 0, 100, 20);
    expect(full.dy).toBeCloseTo(half.dy * 2, 5);
  });

  it('flag: amplitude tapers to zero at the pinned left edge', () => {
    const left = warpDisplacement({ type: 'flag', amplitude: 1, frequency: 1 }, 0, 0, 100, 20);
    expect(left.dy).toBeCloseTo(0, 5);
  });

  it('circle: curve=0 is a no-op', () => {
    const d = warpDisplacement({ type: 'circle', curve: 0 }, 50, 0, 100, 20);
    expect(d.dx).toBeCloseTo(0, 5);
    expect(d.dy).toBeCloseTo(0, 5);
  });

  it('distort: independent per-axis bulge, zero at box edges', () => {
    const d = warpDisplacement({ type: 'distort', amountX: 10, amountY: 5 }, 0, 0, 100, 20);
    expect(d.dx).toBeCloseTo(0, 5);
    expect(d.dy).toBeCloseTo(0, 5);
  });

  it('angle: pure shear proportional to y', () => {
    const d = warpDisplacement({ type: 'angle', angle: Math.PI / 4 }, 50, 10, 100, 20);
    expect(d.dx).toBeCloseTo(10 * Math.tan(Math.PI / 4), 5);
    expect(d.dy).toBeCloseTo(0, 5);
  });

  it('custom-mesh: bilinear-interpolates a 2x2 control grid', () => {
    // 2x2 grid, all points pushed down by 10 uniformly -> every vertex shifts down by 10
    const warp = { type: 'custom-mesh' as const, gridSize: [2, 2] as [number, number], points: [0, 10, 0, 10, 0, 10, 0, 10] };
    const d = warpDisplacement(warp, 50, 10, 100, 20);
    expect(d.dy).toBeCloseTo(10, 5);
  });
});
```

Run: `npx vitest run src/text/__tests__/warpFormulas.test.ts`
Expected: FAIL (`warpFormulas` module doesn't exist).

- [ ] **Step 2: Implement `warpFormulas.ts`**

```ts
// src/text/warpFormulas.ts

// Kept intentionally decoupled from src/schema/node.ts's WarpSchema (Task 4)
// so this pure-math module has zero dependency on Zod/schema types — Task 4
// must keep TextNode['warp']'s shape identical to this local type.
export type Warp =
  | { type: 'arch'; curve: number }
  | { type: 'wave'; amplitude: number; frequency: number }
  | { type: 'rise'; amount: number }
  | { type: 'flag'; amplitude: number; frequency: number }
  | { type: 'circle'; curve: number }
  | { type: 'distort'; amountX: number; amountY: number }
  | { type: 'angle'; angle: number }
  | { type: 'custom-mesh'; gridSize: [number, number]; points: number[] };

export interface Displacement {
  dx: number;
  dy: number;
}

// x/y are in the text box's local units (same as node.size), not normalized.
// boxWidth/boxHeight give each formula the box to normalize against.
export function warpDisplacement(warp: Warp, x: number, y: number, boxWidth: number, boxHeight: number): Displacement {
  const nx = boxWidth === 0 ? 0 : x / boxWidth; // 0..1 across the box
  switch (warp.type) {
    case 'arch':
      // Parabolic arc: 0 at both edges, peak at center. sin(nx*PI) does this
      // in one term without a separate edge-clamp.
      return { dx: 0, dy: -warp.curve * Math.sin(nx * Math.PI) * boxHeight };
    case 'wave':
      return { dx: 0, dy: warp.amplitude * Math.sin(nx * warp.frequency * 2 * Math.PI) * boxHeight };
    case 'rise':
      return { dx: 0, dy: -warp.amount * nx * boxHeight };
    case 'flag':
      // Same oscillation as 'wave', but amplitude scales by nx so the left
      // edge (the flag's "pinned" side) stays put and displacement grows
      // toward the right — this taper is the one thing distinguishing it
      // from 'wave'.
      return { dx: 0, dy: warp.amplitude * nx * Math.sin(nx * warp.frequency * 2 * Math.PI) * boxHeight };
    case 'circle': {
      if (warp.curve === 0) return { dx: 0, dy: 0 };
      const radius = boxWidth / (2 * Math.abs(warp.curve) * Math.PI);
      const angle = (nx - 0.5) * (boxWidth / radius);
      const sign = Math.sign(warp.curve);
      const cx = 0;
      const cy = sign * radius;
      const px = cx + radius * Math.sin(angle);
      const py = cy - sign * radius * Math.cos(angle);
      return { dx: px - (x - boxWidth / 2), dy: py - y };
    }
    case 'distort': {
      const ny = boxHeight === 0 ? 0 : y / boxHeight;
      return { dx: warp.amountX * nx * (1 - nx), dy: warp.amountY * ny * (1 - ny) };
    }
    case 'angle':
      return { dx: y * Math.tan(warp.angle), dy: 0 };
    case 'custom-mesh':
      return bilinearDisplacement(warp, nx, boxHeight === 0 ? 0 : y / boxHeight);
  }
}

function bilinearDisplacement(warp: Extract<Warp, { type: 'custom-mesh' }>, nx: number, ny: number): Displacement {
  const [cols, rows] = warp.gridSize;
  const gx = nx * (cols - 1);
  const gy = ny * (rows - 1);
  const x0 = Math.min(Math.floor(gx), cols - 2 < 0 ? 0 : cols - 2);
  const y0 = Math.min(Math.floor(gy), rows - 2 < 0 ? 0 : rows - 2);
  const tx = cols > 1 ? gx - x0 : 0;
  const ty = rows > 1 ? gy - y0 : 0;

  const at = (cx: number, cy: number): Displacement => {
    const i = (cy * cols + cx) * 2;
    return { dx: warp.points[i] ?? 0, dy: warp.points[i + 1] ?? 0 };
  };
  const p00 = at(x0, y0);
  const p10 = at(x0 + 1, y0);
  const p01 = at(x0, y0 + 1);
  const p11 = at(x0 + 1, y0 + 1);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return {
    dx: lerp(lerp(p00.dx, p10.dx, tx), lerp(p01.dx, p11.dx, tx), ty),
    dy: lerp(lerp(p00.dy, p10.dy, tx), lerp(p01.dy, p11.dy, tx), ty),
  };
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/text/__tests__/warpFormulas.test.ts`
Expected: PASS (all 8 cases).

- [ ] **Step 4: Commit**

```bash
git add src/text/warpFormulas.ts src/text/__tests__/warpFormulas.test.ts
git commit -m "feat: add warp displacement formulas for the 8 text warp styles"
```

---

### Task 3: Glyph layout engine

**Files:**
- Create: `src/text/layoutGlyphs.ts`
- Test: `src/text/__tests__/layoutGlyphs.test.ts`

**Interfaces:**
- Consumes: an `opentype.Font` (from Task 1's `getFontForWarp`).
- Produces: `layoutGlyphs(font: opentype.Font, content: string, fontSize: number, boxWidth: number, options?: { letterSpacing?: number; lineHeight?: number; align?: 'left' | 'center' | 'right' }): GlyphPlacement[]` where `GlyphPlacement = { char: string; x: number; y: number }`. Task 5 (mesh builder) is the consumer.

- [ ] **Step 1: Write the failing test**

opentype.js can construct an in-memory `Font` directly from a glyph table without needing a real font file — use that to keep this test hermetic (no network, no wawoff2), per this project's existing "no live network calls in tests" convention (`googleFonts.test.ts` doesn't hit the network either).

```ts
// src/text/__tests__/layoutGlyphs.test.ts
import { describe, it, expect } from 'vitest';
import * as opentype from 'opentype.js';
import { layoutGlyphs } from '../layoutGlyphs';

// A minimal 2-glyph font (".notdef" + "A") with known advance widths, built
// the same way opentype.js's own test suite constructs fixture fonts.
function buildFixtureFont(): opentype.Font {
  const notdefGlyph = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 0, path: new opentype.Path() });
  const aGlyph = new opentype.Glyph({ name: 'A', unicode: 65, advanceWidth: 600, path: new opentype.Path() });
  return new opentype.Font({
    familyName: 'Fixture',
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: [notdefGlyph, aGlyph],
  });
}

describe('layoutGlyphs', () => {
  it('places glyphs left-to-right using the font advance width, scaled to fontSize', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'AA', 100, 1000);
    expect(placements).toHaveLength(2);
    expect(placements[0].x).toBe(0);
    // advanceWidth 600 / unitsPerEm 1000 * fontSize 100 = 60
    expect(placements[1].x).toBeCloseTo(60, 5);
  });

  it('wraps to a new line when advance would exceed boxWidth', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'AAA', 100, 100); // each 'A' is 60 wide, box is 100
    expect(placements[0].y).toBe(placements[1].y);
    expect(placements[2].y).toBeGreaterThan(placements[1].y);
  });

  it('applies letterSpacing as extra advance between glyphs', () => {
    const font = buildFixtureFont();
    const withSpacing = layoutGlyphs(font, 'AA', 100, 1000, { letterSpacing: 10 });
    const withoutSpacing = layoutGlyphs(font, 'AA', 100, 1000);
    expect(withSpacing[1].x).toBeCloseTo(withoutSpacing[1].x + 10, 5);
  });
});
```

Run: `npx vitest run src/text/__tests__/layoutGlyphs.test.ts`
Expected: FAIL (`layoutGlyphs` not defined).

- [ ] **Step 2: Implement `layoutGlyphs.ts`**

```ts
// src/text/layoutGlyphs.ts
import type { Font } from 'opentype.js';

export interface GlyphPlacement {
  char: string;
  x: number;
  y: number;
}

export interface LayoutOptions {
  letterSpacing?: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
}

// Independent of PIXI.Text/Canvas layout by design (see
// docs/superpowers/specs/2026-08-03-text-effects-design.md "Layout" — Canvas
// never exposes per-glyph positions, so warp needs its own source of truth
// for both geometry and fill, driven by the same opentype.Font metrics
// getPath() will use later). word-wrap breaks on whitespace only (no
// hyphenation) — same scope as PIXI.Text's own wordWrap.
export function layoutGlyphs(
  font: Font,
  content: string,
  fontSize: number,
  boxWidth: number,
  options: LayoutOptions = {},
): GlyphPlacement[] {
  const letterSpacing = options.letterSpacing ?? 0;
  const lineHeight = options.lineHeight ?? (font.ascender - font.descender) / font.unitsPerEm * fontSize;
  const scale = fontSize / font.unitsPerEm;

  const words = content.split(/(\s+)/); // keep whitespace tokens for advance
  const lines: string[] = [''];
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = measureWidth(font, word, scale, letterSpacing);
    if (lineWidth + wordWidth > boxWidth && lineWidth > 0 && word.trim() !== '') {
      lines.push('');
      lineWidth = 0;
    }
    lines[lines.length - 1] += word;
    lineWidth += wordWidth;
  }

  const placements: GlyphPlacement[] = [];
  lines.forEach((line, lineIndex) => {
    const lineWidthActual = measureWidth(font, line, scale, letterSpacing);
    const xOffset =
      options.align === 'center' ? (boxWidth - lineWidthActual) / 2 : options.align === 'right' ? boxWidth - lineWidthActual : 0;
    let x = xOffset;
    const y = lineIndex * lineHeight;
    for (const char of line) {
      placements.push({ char, x, y });
      const glyph = font.charToGlyph(char);
      x += glyph.advanceWidth * scale + letterSpacing;
    }
  });
  return placements;
}

function measureWidth(font: Font, text: string, scale: number, letterSpacing: number): number {
  let width = 0;
  for (const char of text) {
    width += font.charToGlyph(char).advanceWidth * scale + letterSpacing;
  }
  return width - (text.length > 0 ? letterSpacing : 0); // no trailing spacing after the last glyph
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/text/__tests__/layoutGlyphs.test.ts`
Expected: PASS (all 3 cases).

- [ ] **Step 4: Commit**

```bash
git add src/text/layoutGlyphs.ts src/text/__tests__/layoutGlyphs.test.ts
git commit -m "feat: add independent glyph layout engine for warp (opentype.js-driven)"
```

---

### Task 4: Schema — `TextNode.warp`

**Files:**
- Modify: `src/schema/node.ts`
- Test: extend `src/schema/__tests__/document.test.ts`

**Interfaces:**
- Produces: `WarpSchema`/`Warp` type, `TextNodeSchema.warp: WarpSchema.optional()`. **Must match Task 2's local `Warp` type shape exactly** (both were designed together against the same spec table — this task makes it the real, schema-validated type; Task 2's file keeps its own decoupled type for zero schema/Zod dependency in pure-math code, per that task's Interfaces note).

- [ ] **Step 1: Write the failing test**

This file's existing text-node tests (`document.test.ts:108-142`, added in the TextNode foundation slice) call `NodeSchema.parse(textNode)` directly on a plain object literal — no `document()`/`textNode()` factory function exists in this file. Follow that exact same pattern, not a `DocumentSchema`-wrapping one:

```ts
// append to src/schema/__tests__/document.test.ts
describe('TextNode.warp', () => {
  const baseTextNode = {
    id: 'node_warp',
    type: 'text' as const,
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    size: { width: 200, height: 60 },
    opacity: 1,
    visible: true,
    locked: false,
    content: 'Hello',
    font: { family: 'Roboto', size: 48 },
    align: 'left' as const,
    fill: { type: 'solid' as const, color: '#000000' },
  };

  const warpVariants = [
    { type: 'arch', curve: 0.5 },
    { type: 'wave', amplitude: 0.1, frequency: 2 },
    { type: 'rise', amount: 0.3 },
    { type: 'flag', amplitude: 0.1, frequency: 2 },
    { type: 'circle', curve: -0.4 },
    { type: 'distort', amountX: 5, amountY: 5 },
    { type: 'angle', angle: 0.2 },
    { type: 'custom-mesh', gridSize: [3, 2], points: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ];

  it.each(warpVariants)('accepts a $type TextNode.warp variant', (warp) => {
    const node = { ...baseTextNode, warp };
    expect(() => NodeSchema.parse(node)).not.toThrow();
    expect(NodeSchema.parse(node)).toMatchObject({ warp });
  });

  it('TextNode.warp is optional — an existing warp-less TextNode still parses', () => {
    expect(() => NodeSchema.parse(baseTextNode)).not.toThrow();
  });
});
```

Run: `npx vitest run src/schema/__tests__/document.test.ts`
Expected: FAIL (`warp` not in `TextNodeSchema` yet).

- [ ] **Step 2: Add `WarpSchema` and wire it into `TextNodeSchema`**

```ts
// src/schema/node.ts — add above TextNodeSchema
export const WarpSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('arch'), curve: z.number() }),
  z.object({ type: z.literal('wave'), amplitude: z.number(), frequency: z.number() }),
  z.object({ type: z.literal('rise'), amount: z.number() }),
  z.object({ type: z.literal('flag'), amplitude: z.number(), frequency: z.number() }),
  z.object({ type: z.literal('circle'), curve: z.number() }),
  z.object({ type: z.literal('distort'), amountX: z.number(), amountY: z.number() }),
  z.object({ type: z.literal('angle'), angle: z.number() }),
  z.object({
    type: z.literal('custom-mesh'),
    gridSize: z.tuple([z.number(), z.number()]),
    points: z.array(z.number()),
  }),
]);
export type Warp = z.infer<typeof WarpSchema>;
```

Then add `warp: WarpSchema.optional(),` as a new field on `TextNodeSchema` (after `stroke`).

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/schema/__tests__/document.test.ts`
Expected: PASS (all 9 cases: 8 variants + the warp-less case).

- [ ] **Step 4: Commit**

```bash
git add src/schema/node.ts src/schema/__tests__/document.test.ts
git commit -m "feat: add TextNode.warp schema (8 warp style variants)"
```

---

### Task 5: Glyph mesh builder (triangulation + warp application)

**Files:**
- Create: `src/text/warpMesh.ts`
- Test: `src/text/__tests__/warpMesh.test.ts`

**Interfaces:**
- Consumes: `opentype.Font` (Task 1), `GlyphPlacement[]` (Task 3's `layoutGlyphs`), `Warp` (Task 2/4).
- Produces: `buildWarpedGlyphGeometry(font: Font, placements: GlyphPlacement[], fontSize: number, warp: Warp, boxWidth: number, boxHeight: number): { positions: Float32Array; gradientUvs: Float32Array; indices: Uint32Array }` — consumed directly by Task 7's `textRenderer` to build a `MeshGeometry`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/text/__tests__/warpMesh.test.ts
import { describe, it, expect } from 'vitest';
import * as opentype from 'opentype.js';
import { buildWarpedGlyphGeometry } from '../warpMesh';
import { layoutGlyphs } from '../layoutGlyphs';

// 'o' needs a real hole (outer + inner contour) to exercise earcut's holes
// path; 'l' is a single simple contour (rectangle).
function buildFixtureFont(): opentype.Font {
  const outer = new opentype.Path();
  outer.moveTo(0, 0); outer.lineTo(600, 0); outer.lineTo(600, 700); outer.lineTo(0, 700); outer.close();
  const inner = new opentype.Path();
  inner.moveTo(150, 150); inner.lineTo(150, 550); inner.lineTo(450, 550); inner.lineTo(450, 150); inner.close();
  const oPath = new opentype.Path();
  oPath.commands = [...outer.commands, ...inner.commands];

  const lPath = new opentype.Path();
  lPath.moveTo(0, 0); lPath.lineTo(200, 0); lPath.lineTo(200, 700); lPath.lineTo(0, 700); lPath.close();

  const notdef = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 0, path: new opentype.Path() });
  const oGlyph = new opentype.Glyph({ name: 'o', unicode: 111, advanceWidth: 600, path: oPath });
  const lGlyph = new opentype.Glyph({ name: 'l', unicode: 108, advanceWidth: 200, path: lPath });
  return new opentype.Font({ familyName: 'Fixture', styleName: 'Regular', unitsPerEm: 1000, ascender: 800, descender: -200, glyphs: [notdef, oGlyph, lGlyph] });
}

describe('buildWarpedGlyphGeometry', () => {
  it('produces valid geometry (non-empty, indices in range) for a glyph with a hole', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'o', 100, 1000);
    const noWarp = { type: 'arch' as const, curve: 0 };
    const geom = buildWarpedGlyphGeometry(font, placements, 100, noWarp, 1000, 100);
    expect(geom.positions.length).toBeGreaterThan(0);
    expect(geom.positions.length % 2).toBe(0);
    expect(geom.indices.length % 3).toBe(0);
    const maxIndex = geom.positions.length / 2 - 1;
    for (const idx of geom.indices) expect(idx).toBeLessThanOrEqual(maxIndex);
  });

  it('produces valid geometry for a glyph without a hole', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'l', 100, 1000);
    const noWarp = { type: 'arch' as const, curve: 0 };
    const geom = buildWarpedGlyphGeometry(font, placements, 100, noWarp, 1000, 100);
    expect(geom.positions.length).toBeGreaterThan(0);
    expect(geom.indices.length).toBeGreaterThan(0);
  });

  it('applies the warp displacement to vertex positions (curve=0 is a documented no-op for arch, so use rise instead)', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'l', 100, 1000);
    const flat = buildWarpedGlyphGeometry(font, placements, 100, { type: 'rise', amount: 0 }, 1000, 100);
    const risen = buildWarpedGlyphGeometry(font, placements, 100, { type: 'rise', amount: 1 }, 1000, 100);
    expect(flat.positions).not.toEqual(risen.positions);
  });

  it('gradientUvs carry the pre-warp position, unaffected by the warp applied to positions', () => {
    const font = buildFixtureFont();
    const placements = layoutGlyphs(font, 'l', 100, 1000);
    const flat = buildWarpedGlyphGeometry(font, placements, 100, { type: 'rise', amount: 0 }, 1000, 100);
    const risen = buildWarpedGlyphGeometry(font, placements, 100, { type: 'rise', amount: 1 }, 1000, 100);
    expect(flat.gradientUvs).toEqual(risen.gradientUvs);
  });
});
```

Run: `npx vitest run src/text/__tests__/warpMesh.test.ts`
Expected: FAIL (`warpMesh` module doesn't exist).

- [ ] **Step 2: Implement `warpMesh.ts`**

```ts
// src/text/warpMesh.ts
import { earcut } from 'pixi.js';
import type { Font, PathCommand } from 'opentype.js';
import type { GlyphPlacement } from './layoutGlyphs';
import { warpDisplacement, type Warp } from './warpFormulas';

const BEZIER_SEGMENTS = 10; // fixed sampling — see Global Constraints, no adaptive subdivision in this slice

interface Contour {
  points: number[]; // flat [x0, y0, x1, y1, ...]
}

// Flattens an opentype Path's command list (M/L/C/Q/Z) into polygon contours
// — one per M...Z run. Multiple contours per glyph are normal (e.g. 'i''s
// dot is a second contour; 'o''s inner ring is a second contour used as an
// earcut hole below).
function flattenPath(commands: PathCommand[], offsetX: number, offsetY: number, scale: number): Contour[] {
  const contours: Contour[] = [];
  let current: number[] = [];
  let cursor = { x: 0, y: 0 };
  const toWorld = (x: number, y: number) => [offsetX + x * scale, offsetY - y * scale] as const; // font y-up -> screen y-down

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        if (current.length) contours.push({ points: current });
        current = [];
        cursor = { x: cmd.x, y: cmd.y };
        current.push(...toWorld(cmd.x, cmd.y));
        break;
      case 'L':
        cursor = { x: cmd.x, y: cmd.y };
        current.push(...toWorld(cmd.x, cmd.y));
        break;
      case 'C':
        for (let i = 1; i <= BEZIER_SEGMENTS; i++) {
          const t = i / BEZIER_SEGMENTS;
          const p = cubicPoint(cursor, { x: cmd.x1, y: cmd.y1 }, { x: cmd.x2, y: cmd.y2 }, { x: cmd.x, y: cmd.y }, t);
          current.push(...toWorld(p.x, p.y));
        }
        cursor = { x: cmd.x, y: cmd.y };
        break;
      case 'Q':
        for (let i = 1; i <= BEZIER_SEGMENTS; i++) {
          const t = i / BEZIER_SEGMENTS;
          const p = quadPoint(cursor, { x: cmd.x1, y: cmd.y1 }, { x: cmd.x, y: cmd.y }, t);
          current.push(...toWorld(p.x, p.y));
        }
        cursor = { x: cmd.x, y: cmd.y };
        break;
      case 'Z':
        if (current.length) contours.push({ points: current });
        current = [];
        break;
    }
  }
  if (current.length) contours.push({ points: current });
  return contours;
}

function cubicPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function quadPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  const mt = 1 - t;
  return { x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x, y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y };
}

// Signed area sign gives contour winding direction — opentype/TrueType
// outer contours and counter (hole) contours wind opposite ways, which is
// exactly the "is this a hole" signal earcut needs. No dependency on
// font-format-specific winding conventions beyond "opposite of the first
// (outer) contour".
function signedArea(points: number[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 2) {
    const x1 = points[i], y1 = points[i + 1];
    const j = (i + 2) % points.length;
    const x2 = points[j], y2 = points[j + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

function triangulateGlyph(contours: Contour[]): { positions: number[]; indices: number[] } {
  if (contours.length === 0) return { positions: [], indices: [] };
  const outerSign = Math.sign(signedArea(contours[0].points));
  const flatPositions: number[] = [];
  const holeIndices: number[] = [];
  for (const contour of contours) {
    const sign = Math.sign(signedArea(contour.points));
    if (flatPositions.length > 0 && sign === outerSign) {
      // A second same-winding contour (e.g. 'i''s dot) is a separate glyph
      // shape, not a hole in the first — triangulate it independently and
      // concatenate, since earcut only supports one outer + holes per call.
      continue; // v1 scope cut: multi-outer-contour glyphs (dotted i/j, %) render only their first/largest contour — documented limitation, not a crash.
    }
    if (sign !== outerSign) holeIndices.push(flatPositions.length / 2);
    flatPositions.push(...contour.points);
  }
  const indices = earcut(flatPositions, holeIndices.length ? holeIndices : undefined);
  return { positions: flatPositions, indices };
}

export function buildWarpedGlyphGeometry(
  font: Font,
  placements: GlyphPlacement[],
  fontSize: number,
  warp: Warp,
  boxWidth: number,
  boxHeight: number,
): { positions: Float32Array; gradientUvs: Float32Array; indices: Uint32Array } {
  const scale = fontSize / font.unitsPerEm;
  const positions: number[] = [];
  const gradientUvs: number[] = [];
  const indices: number[] = [];

  for (const placement of placements) {
    const glyph = font.charToGlyph(placement.char);
    const path = glyph.getPath(0, 0, fontSize);
    const contours = flattenPath(path.commands as PathCommand[], placement.x, placement.y, 1); // getPath already applies `scale` via fontSize
    const { positions: glyphPositions, indices: glyphIndices } = triangulateGlyph(contours);
    if (glyphPositions.length === 0) continue;

    const baseIndex = positions.length / 2;
    for (let i = 0; i < glyphPositions.length; i += 2) {
      const x = glyphPositions[i];
      const y = glyphPositions[i + 1];
      gradientUvs.push(boxWidth === 0 ? 0 : x / boxWidth, boxHeight === 0 ? 0 : y / boxHeight);
      const { dx, dy } = warpDisplacement(warp, x, y, boxWidth, boxHeight);
      positions.push(x + dx, y + dy);
    }
    for (const idx of glyphIndices) indices.push(baseIndex + idx);
  }

  return {
    positions: new Float32Array(positions),
    gradientUvs: new Float32Array(gradientUvs),
    indices: new Uint32Array(indices),
  };
}
```

Note on `scale` above: `Glyph.getPath(0, 0, fontSize)` (per opentype.js's README, `Font.getPath`/`Glyph.getPath` take `fontSize` and internally scale by `fontSize / unitsPerEm`) already returns path coordinates in final pixel units — `flattenPath`'s own `scale` parameter is passed `1` here for that reason; keep this comment in the implementation so a future reader doesn't "fix" what looks like a redundant scale.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/text/__tests__/warpMesh.test.ts`
Expected: PASS (all 4 cases).

- [ ] **Step 4: Commit**

```bash
git add src/text/warpMesh.ts src/text/__tests__/warpMesh.test.ts
git commit -m "feat: add glyph triangulation + warp application (opentype path -> earcut -> warped mesh geometry)"
```

---

### Task 6: Glyph fill shader (solid + gradient)

**Files:**
- Create: `src/text/shaders/glyphFill.ts`
- Test: `src/text/shaders/__tests__/glyphFill.test.ts`

**Interfaces:**
- Produces: `buildGlyphFillShader(fill: Fill): Shader` (Pixi `Shader.from({ gl: {...}, resources: {...} })`) — consumed by Task 7's `textRenderer`.
- `MAX_GRADIENT_STOPS = 8` — a v1 scope cut (see Global Constraints' gradient note); documented, not silent.

- [ ] **Step 1: Write the vertex/fragment GLSL, verified against Pixi's own default mesh shader**

```ts
// src/text/shaders/glyphFill.ts
import { Shader, Color } from 'pixi.js';
import type { Fill } from '../../schema';

export const MAX_GRADIENT_STOPS = 8;

// Uniform/attribute names below are not invented — they match exactly what
// Pixi's GlMeshAdaptor auto-binds via groups 100 (global) / 101 (local) to
// ANY shader assigned to Mesh.shader, verified directly against
// node_modules/pixi.js/lib/rendering/high-shader/defaultProgramTemplate.js
// and .../shader-bits/{globalUniformsBit,localUniformBit}.js. This mirrors
// the codebase's existing "hand-written raw GLSL" convention
// (inner-shadow.frag.ts / lineShadow.frag.ts) — those target Filters, this
// targets a Mesh, the first of its kind here, but the same "trust real
// engine source over guessed uniform names" discipline applies.
const vertex = /* glsl */ `
in vec2 aPosition;
in vec2 aUV;

out vec4 vColor;
out vec2 vGradientUv;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform vec4 uWorldColorAlpha;
uniform mat3 uTransformMatrix;
uniform vec4 uColor;
uniform float uRound;

void main(void) {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vColor = uColor * uWorldColorAlpha;
  vGradientUv = aUV;
}
`;

// fillType: 0 = solid (vColor alone, no gradient loop), 1 = linear, 2 = radial.
const fragment = /* glsl */ `
precision highp float;
in vec4 vColor;
in vec2 vGradientUv;
out vec4 finalColor;

uniform float uFillType;
uniform float uStopCount;
uniform float uStopOffsets[${MAX_GRADIENT_STOPS}];
uniform vec4 uStopColors[${MAX_GRADIENT_STOPS}];
uniform float uGradientAngle;

vec4 sampleGradient(float t) {
  t = clamp(t, 0.0, 1.0);
  if (uStopCount < 1.5) return uStopColors[0];
  for (int i = 0; i < ${MAX_GRADIENT_STOPS} - 1; i++) {
    if (float(i) + 1.0 >= uStopCount) break;
    if (t <= uStopOffsets[i + 1] || float(i) + 2.0 >= uStopCount) {
      float span = max(uStopOffsets[i + 1] - uStopOffsets[i], 0.0001);
      float localT = clamp((t - uStopOffsets[i]) / span, 0.0, 1.0);
      return mix(uStopColors[i], uStopColors[i + 1], localT);
    }
  }
  return uStopColors[int(uStopCount) - 1];
}

void main(void) {
  if (uFillType < 0.5) {
    finalColor = vColor;
    return;
  }
  float t;
  if (uFillType < 1.5) {
    // linear: project vGradientUv (0..1 box space) onto the gradient axis
    vec2 dir = vec2(cos(uGradientAngle), sin(uGradientAngle));
    t = dot(vGradientUv - vec2(0.5), dir) + 0.5;
  } else {
    // radial: distance from box center, normalized so the box's inscribed
    // circle (radius 0.5) maps to t=1
    t = length(vGradientUv - vec2(0.5)) / 0.5;
  }
  finalColor = sampleGradient(t) * vColor.a;
}
`;

export function buildGlyphFillShader(fill: Fill): Shader {
  const solidColor = fill.type === 'solid' ? new Color(fill.color) : new Color('#000000');
  const solidAlpha = fill.type === 'solid' ? (fill.alpha ?? 1) : 1;

  const stopOffsets = new Float32Array(MAX_GRADIENT_STOPS);
  const stopColors = new Float32Array(MAX_GRADIENT_STOPS * 4);
  let stopCount = 0;
  let fillType = 0;
  let angle = 0;

  if (fill.type === 'linear-gradient' || fill.type === 'radial-gradient') {
    fillType = fill.type === 'linear-gradient' ? 1 : 2;
    angle = fill.type === 'linear-gradient' ? fill.angle : 0;
    stopCount = Math.min(fill.stops.length, MAX_GRADIENT_STOPS);
    fill.stops.slice(0, MAX_GRADIENT_STOPS).forEach((stop, i) => {
      const c = new Color(stop.color);
      stopOffsets[i] = stop.offset;
      stopColors[i * 4] = c.red;
      stopColors[i * 4 + 1] = c.green;
      stopColors[i * 4 + 2] = c.blue;
      stopColors[i * 4 + 3] = stop.alpha ?? 1;
    });
  }

  return Shader.from({
    gl: { vertex, fragment, name: 'glyph-fill-shader' },
    resources: {
      glyphFillUniforms: {
        uFillType: { value: fillType, type: 'f32' },
        uStopCount: { value: stopCount, type: 'f32' },
        uStopOffsets: { value: stopOffsets, type: 'f32', size: MAX_GRADIENT_STOPS },
        uStopColors: { value: stopColors, type: 'vec4<f32>', size: MAX_GRADIENT_STOPS },
        uGradientAngle: { value: angle, type: 'f32' },
      },
    },
  });
}

// Exposes fillType===0's solid RGBA for callers that need to set it via
// uColor directly rather than the glyphFillUniforms group — Pixi's mesh
// pipeline drives `uColor` itself via the localUniformBit's uColor uniform,
// so textRenderer.ts sets mesh.tint/mesh.alpha for solids the ordinary Pixi
// way instead of duplicating that path here; solidColor/solidAlpha above
// exist only so this function has a single documented meaning for the solid
// case even though the vertex shader's uColor is Pixi-driven, not this
// module's.
export function solidFillTintAlpha(fill: Fill): { tint: number; alpha: number } {
  if (fill.type !== 'solid') return { tint: 0xffffff, alpha: 1 };
  return { tint: new Color(fill.color).toNumber(), alpha: fill.alpha ?? 1 };
}
```

- [ ] **Step 2: Write a lightweight test (uniform values only — no WebGL context in jsdom)**

```ts
// src/text/shaders/__tests__/glyphFill.test.ts
import { describe, it, expect } from 'vitest';
import { buildGlyphFillShader } from '../glyphFill';

describe('buildGlyphFillShader', () => {
  it('sets fillType 0 for solid fills', () => {
    const shader = buildGlyphFillShader({ type: 'solid', color: '#ff0000' });
    expect(shader.resources.glyphFillUniforms.uniforms.uFillType).toBe(0);
  });

  it('sets fillType 1 and stop data for linear-gradient fills', () => {
    const shader = buildGlyphFillShader({
      type: 'linear-gradient',
      angle: Math.PI / 2,
      stops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#ffffff' }],
    });
    expect(shader.resources.glyphFillUniforms.uniforms.uFillType).toBe(1);
    expect(shader.resources.glyphFillUniforms.uniforms.uStopCount).toBe(2);
  });

  it('caps stop count at MAX_GRADIENT_STOPS for an over-long stop list', () => {
    const stops = Array.from({ length: 12 }, (_, i) => ({ offset: i / 11, color: '#000000' }));
    const shader = buildGlyphFillShader({ type: 'radial-gradient', stops });
    expect(shader.resources.glyphFillUniforms.uniforms.uStopCount).toBe(8);
  });
});
```

Run: `npx vitest run src/text/shaders/__tests__/glyphFill.test.ts`
Expected: PASS once Step 1's file exists (this is a thin sanity check, not a render test — matches this codebase's existing convention of not render-testing hand-written shaders, e.g. `innerShadow.frag.ts` has no dedicated test either).

- [ ] **Step 3: Commit**

```bash
git add src/text/shaders/glyphFill.ts src/text/shaders/__tests__/glyphFill.test.ts
git commit -m "feat: add glyph fill mesh shader (solid + linear/radial gradient)"
```

---

### Task 7: `textRenderer` Mesh branch + `SceneReconciler` recreate hook

**Files:**
- Modify: `src/render/renderers/textRenderer.ts`
- Modify: `src/render/SceneReconciler.ts`
- Test: extend `src/render/__tests__/textRenderer.test.ts`, `src/render/__tests__/SceneReconciler.test.ts`

**Interfaces:**
- Consumes: `getFontForWarp` (Task 1), `layoutGlyphs` (Task 3), `buildWarpedGlyphGeometry` (Task 5), `buildGlyphFillShader`/`solidFillTintAlpha` (Task 6), `Warp` (Task 4).
- Produces: `textRenderer.needsRecreate(obj, node)`, consumed by `SceneReconciler.apply()`. This is the one cross-cutting change every other renderer leaves untouched.

- [ ] **Step 1: Add the `needsRecreate` hook to `SceneReconciler`**

```ts
// src/render/SceneReconciler.ts — add near the top, alongside createDisplayObject/updateDisplayObject
function needsRecreateDisplayObject(obj: Container, node: Node): boolean {
  if (node.type === 'text') return textRenderer.needsRecreate(obj, node);
  return false;
}
```

Then in `apply()`'s `UpdateProps`/`UpdateTransform` case, replace the direct `updateDisplayObject` call:

```ts
      case 'UpdateProps':
      case 'UpdateTransform': {
        const obj = this.displayObjects.get(cmd.nodeId);
        const location = findNodeInTree(page.children, cmd.nodeId);
        if (!obj || !location) return;
        if (needsRecreateDisplayObject(obj, location.node)) {
          const parent = obj.parent;
          const index = parent ? parent.getChildIndex(obj) : -1;
          this.destroySubtree(obj);
          const next = createDisplayObject(location.node, doc);
          next.label = location.node.id;
          this.displayObjects.set(location.node.id, next);
          if (parent && index >= 0) parent.addChildAt(next, index);
          this.onNodeMounted?.(next, location.node);
          return;
        }
        updateDisplayObject(obj, location.node, doc);
        break;
      }
```

- [ ] **Step 2: Write the failing `SceneReconciler` test**

This file's existing tests build fixtures via its own `makePage()`/`makeDoc(page)` factories (`SceneReconciler.test.ts:6-70`), which already include a `text-1` node — reuse them directly, mutating a cloned page's `text-1` node rather than inventing new fixture-construction code:

```ts
// append to src/render/__tests__/SceneReconciler.test.ts
it('recreates the display object (Text -> Mesh) when a text node gains a warp field, and back when it loses one', () => {
  const layer = new Container();
  const reconciler = new SceneReconciler(layer);
  const page = makePage();
  const doc = makeDoc(page);
  reconciler.mount(page, doc);

  const before = reconciler.getDisplayObject('text-1');
  expect(before).toBeInstanceOf(Text);

  const warpedPage: Page = {
    ...page,
    children: page.children.map((n) => (n.id === 'text-1' ? { ...n, warp: { type: 'arch', curve: 0.5 } } : n)),
  };
  const warpedDoc = { ...doc, pages: [warpedPage] };
  reconciler.apply({ type: 'UpdateProps', pageId: page.id, nodeId: 'text-1', patch: { warp: { type: 'arch', curve: 0.5 } } }, warpedDoc);
  const afterWarp = reconciler.getDisplayObject('text-1');
  expect(afterWarp).not.toBe(before);
  expect(afterWarp).toBeInstanceOf(Mesh);

  reconciler.apply({ type: 'UpdateProps', pageId: page.id, nodeId: 'text-1', patch: { warp: undefined } }, doc);
  const afterUnwarp = reconciler.getDisplayObject('text-1');
  expect(afterUnwarp).not.toBe(afterWarp);
  expect(afterUnwarp).toBeInstanceOf(Text);
});
```

Add `Mesh` to this file's existing `import { Container, Graphics, Sprite, Text } from 'pixi.js';` line, and add a `warp?` field to the schema-derived `Page`/`Node` types this file already imports (Task 4 already did this at the schema level — no test-file-specific type change needed beyond the import).

Run: `npx vitest run src/render/__tests__/SceneReconciler.test.ts`
Expected: FAIL (`textRenderer.needsRecreate` doesn't exist).

- [ ] **Step 3: Implement the Mesh branch in `textRenderer.ts`**

```ts
// src/render/renderers/textRenderer.ts — full replacement
import { Text, TextStyle, Mesh, MeshGeometry, type Container } from 'pixi.js';
import type { TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill } from '../fillToColor';
import { loadGoogleFont } from '../../fonts/googleFonts';
import { getFontForWarp } from '../../fonts/googleFontFiles';
import { layoutGlyphs } from '../../text/layoutGlyphs';
import { buildWarpedGlyphGeometry } from '../../text/warpMesh';
import { buildGlyphFillShader, solidFillTintAlpha } from '../../text/shaders/glyphFill';

// ... (unchanged: loadedFontKey, latestNode, fontKey, styleSignature, buildStyle, loadFontIfNeeded — keep exactly as they are today)

// Mesh path: keyed the same way loadFontIfNeeded's flat-text path is, but
// tracks the FULL geometry-affecting signature (content/font/fill/warp/size),
// since fill and warp now bake directly into vertex data/shader uniforms
// instead of TextStyle.
const meshSignature = new WeakMap<Mesh, string>();
function warpSignature(node: TextNode): string {
  return JSON.stringify([node.content, node.font, node.fill, node.warp, node.size.width, node.size.height]);
}

async function rebuildWarpMesh(obj: Mesh, node: TextNode): Promise<void> {
  if (!node.warp) return;
  const font = await getFontForWarp(node.font.family, node.font.weight ?? 400, node.content);
  if (!font || obj.destroyed) return; // never-throw degrade — see googleFontFiles.ts's own convention
  const placements = layoutGlyphs(font, node.content, node.font.size, node.size.width, {
    letterSpacing: node.font.letterSpacing,
    lineHeight: node.font.lineHeight,
    align: node.align,
  });
  const geom = buildWarpedGlyphGeometry(font, placements, node.font.size, node.warp, node.size.width, node.size.height);
  obj.geometry = new MeshGeometry({ positions: geom.positions, uvs: geom.gradientUvs, indices: geom.indices });
  obj.shader = buildGlyphFillShader(node.fill);
  const { tint, alpha } = solidFillTintAlpha(node.fill);
  obj.tint = tint;
  obj.alpha = alpha * (obj.alpha || 1); // node opacity is applied separately by applyTransform; this only carries the fill's own alpha into the mesh's base tint-alpha channel the shader's uColor multiplies against
}

export const textRenderer = {
  create(node: TextNode): Text | Mesh {
    if (node.warp) {
      const obj = new Mesh({ geometry: new MeshGeometry({ positions: new Float32Array(), uvs: new Float32Array(), indices: new Uint32Array() }), shader: buildGlyphFillShader(node.fill) });
      this.update(obj, node);
      return obj;
    }
    const obj = new Text({ text: node.content, style: buildStyle(node) });
    this.update(obj, node);
    return obj;
  },
  update(obj: Text | Mesh, node: TextNode): void {
    if (obj instanceof Mesh) {
      const prevSig = meshSignature.get(obj);
      const sig = warpSignature(node);
      if (prevSig !== sig) {
        meshSignature.set(obj, sig);
        void rebuildWarpMesh(obj, node);
      }
      applyTransform(obj, node);
      return;
    }
    obj.text = node.content;
    const prevNode = latestNode.get(obj);
    if (!prevNode || styleSignature(prevNode) !== styleSignature(node)) {
      obj.style = buildStyle(node);
    }
    loadFontIfNeeded(obj, node);
    applyTransform(obj, node);
  },
  // Consumed by SceneReconciler.apply() — see Global Constraints. A node
  // whose `warp` presence disagrees with its current display object's class
  // needs a full create+replace, not an in-place update, since PIXI.Text and
  // PIXI.Mesh are structurally different Pixi objects.
  needsRecreate(obj: Container, node: TextNode): boolean {
    const isMesh = obj instanceof Mesh;
    return isMesh !== !!node.warp;
  },
};
```

(The implementer must keep every unchanged helper — `loadedFontKey`, `latestNode`, `fontKey`, `styleSignature`, `buildStyle`, `loadFontIfNeeded` — exactly as they exist in the current file; only `create`/`update` change shape, and three new imports/functions are added above them.)

- [ ] **Step 4: Write the failing `textRenderer` Mesh tests**

This file's existing `makeTextNode(overrides)` factory (`textRenderer.test.ts:7-20`) takes a `Partial<TextNode>` overrides object — pass `warp` directly through it:

```ts
// append to src/render/__tests__/textRenderer.test.ts
it('create() returns a Mesh (not Text) when node.warp is set', () => {
  const node = makeTextNode({ warp: { type: 'arch', curve: 0.3 } });
  const obj = textRenderer.create(node);
  expect(obj).toBeInstanceOf(Mesh);
});

it('create() still returns a Text when node.warp is undefined (zero regression)', () => {
  const node = makeTextNode();
  const obj = textRenderer.create(node);
  expect(obj).toBeInstanceOf(Text);
});

it('needsRecreate is true only when Mesh-vs-Text disagrees with node.warp presence', () => {
  const warped = makeTextNode({ warp: { type: 'arch', curve: 0.3 } });
  const flat = makeTextNode();
  const meshObj = textRenderer.create(warped);
  const textObj = textRenderer.create(flat);
  expect(textRenderer.needsRecreate(meshObj, flat)).toBe(true);
  expect(textRenderer.needsRecreate(meshObj, warped)).toBe(false);
  expect(textRenderer.needsRecreate(textObj, warped)).toBe(true);
  expect(textRenderer.needsRecreate(textObj, flat)).toBe(false);
});
```

Add `Mesh` to this file's existing `import { Text } from 'pixi.js';` line.

Run: `npx vitest run src/render/__tests__/textRenderer.test.ts src/render/__tests__/SceneReconciler.test.ts`
Expected: PASS (all cases, including Step 2's recreate test).

- [ ] **Step 5: Commit**

```bash
git add src/render/renderers/textRenderer.ts src/render/SceneReconciler.ts src/render/__tests__/textRenderer.test.ts src/render/__tests__/SceneReconciler.test.ts
git commit -m "feat: render warped text as a Mesh, add SceneReconciler recreate hook for the Text<->Mesh swap"
```

---

### Task 8: PropertiesPanel — warp style picker + sliders

**Files:**
- Modify: `src/ui/PropertiesPanel.tsx`

**Interfaces:**
- Consumes: `Warp`/`WarpSchema` (Task 4).
- No new exports consumed elsewhere — this task is UI-only, verified manually in Task 10.

- [ ] **Step 1: Add a warp-style picker + `WarpParams` switch, mirroring `ShadowQuickAdd`/`EffectParams`'s existing pattern**

```ts
// src/ui/PropertiesPanel.tsx — add near ShadowQuickAdd
import type { Warp } from '../schema'; // add to the existing type-only import line

const WARP_STYLES: { type: Warp['type']; label: string }[] = [
  { type: 'arch', label: 'Arch' },
  { type: 'wave', label: 'Wave' },
  { type: 'rise', label: 'Rise' },
  { type: 'flag', label: 'Flag' },
  { type: 'circle', label: 'Circle' },
  { type: 'distort', label: 'Distort' },
  { type: 'angle', label: 'Angle' },
  { type: 'custom-mesh', label: 'Custom' },
];

function defaultWarp(type: Warp['type']): Warp {
  switch (type) {
    case 'arch': return { type: 'arch', curve: 0.3 };
    case 'wave': return { type: 'wave', amplitude: 0.1, frequency: 2 };
    case 'rise': return { type: 'rise', amount: 0.2 };
    case 'flag': return { type: 'flag', amplitude: 0.1, frequency: 2 };
    case 'circle': return { type: 'circle', curve: 0.3 };
    case 'distort': return { type: 'distort', amountX: 10, amountY: 10 };
    case 'angle': return { type: 'angle', angle: 0.2 };
    case 'custom-mesh': return { type: 'custom-mesh', gridSize: [4, 2], points: new Array(4 * 2 * 2).fill(0) };
  }
}

function WarpControls({ node, onChange }: { node: TextNode; onChange: (patch: Partial<TextNode>) => void }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="font-medium">Warp</legend>
      <div className="flex flex-wrap gap-1">
        {WARP_STYLES.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ warp: defaultWarp(type) })}
            className={`rounded px-2 py-1 text-xs ${node.warp?.type === type ? 'bg-blue-200' : 'bg-gray-100'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {node.warp && (
        <>
          <WarpParams warp={node.warp} onChange={(warp) => onChange({ warp })} />
          <button type="button" onClick={() => onChange({ warp: undefined })} className="text-xs text-gray-500">
            Remove warp
          </button>
        </>
      )}
    </fieldset>
  );
}

function WarpParams({ warp, onChange }: { warp: Warp; onChange: (warp: Warp) => void }) {
  const num = (label: string, value: number, set: (v: number) => void, step = 0.01) => (
    <label className="flex flex-col gap-1" key={label}>
      {label}
      <input type="range" min={-1} max={1} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
  switch (warp.type) {
    case 'arch':
      return num('Curve', warp.curve, (v) => onChange({ ...warp, curve: v }));
    case 'wave':
      return (
        <>
          {num('Amplitude', warp.amplitude, (v) => onChange({ ...warp, amplitude: v }))}
          {num('Frequency', warp.frequency, (v) => onChange({ ...warp, frequency: v }), 0.1)}
        </>
      );
    case 'rise':
      return num('Amount', warp.amount, (v) => onChange({ ...warp, amount: v }));
    case 'flag':
      return (
        <>
          {num('Amplitude', warp.amplitude, (v) => onChange({ ...warp, amplitude: v }))}
          {num('Frequency', warp.frequency, (v) => onChange({ ...warp, frequency: v }), 0.1)}
        </>
      );
    case 'circle':
      return num('Curve', warp.curve, (v) => onChange({ ...warp, curve: v }));
    case 'distort':
      return (
        <>
          {num('Amount X', warp.amountX, (v) => onChange({ ...warp, amountX: v }), 1)}
          {num('Amount Y', warp.amountY, (v) => onChange({ ...warp, amountY: v }), 1)}
        </>
      );
    case 'angle':
      return num('Angle', warp.angle, (v) => onChange({ ...warp, angle: v }));
    case 'custom-mesh':
      // Precise editing is via the canvas handles (Task 9) — the panel just
      // confirms custom-mesh is active and offers no sliders of its own,
      // since per-point values don't map to a small fixed slider set.
      return <p className="text-xs text-gray-500">Drag the grid handles on canvas to edit.</p>;
  }
}
```

- [ ] **Step 2: Wire `WarpControls` into the main panel, next to `TextControls`**

```ts
// in PropertiesPanel(), after the existing `{node.type === 'text' && <TextControls .../>}` block:
      {node.type === 'text' && (
        <WarpControls node={node} onChange={(patch) => updateProps(patch as Partial<Node>)} />
      )}
```

- [ ] **Step 3: Typecheck + lint (no dedicated unit test file for this component, matching this file's existing convention — none of `TextControls`/`EffectParams`/`ShadowQuickAdd` have one either; verified manually in Task 10)**

Run: `npx tsc --noEmit && npx eslint src/ui/PropertiesPanel.tsx`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/ui/PropertiesPanel.tsx
git commit -m "feat: add warp style picker and per-style sliders to PropertiesPanel"
```

---

### Task 9: `WarpHandles` on-canvas drag handles (with mutual-exclusion gate)

**Files:**
- Modify: `src/ui/SelectionOverlay.tsx`

**Interfaces:**
- Consumes: `Warp` (Task 4), the existing `viewport`/`worldPoint`/`rotateVector` helpers already in this file.
- No new exports consumed elsewhere — verified manually in Task 10.

- [ ] **Step 1: Add `warpEditingNodeId` state and extend the mutual-exclusion guards**

In `SingleSelectionOverlay`, alongside the existing `croppingNodeId`/`editingNodeId` state:

```ts
  const [warpEditingNodeId, setWarpEditingNodeId] = useState<string | null>(null);
  const isEditingWarp = node.type === 'text' && !!node.warp && warpEditingNodeId === node.id;
```

Update the double-click handler and both existing handle guards (per the spec's compatibility-review patch):

```ts
        onDoubleClick={() => {
          if (node.type === 'image') setCroppingNodeId(isCropping ? null : node.id);
          if (node.type === 'text') setEditingNodeId(node.id);
        }}
```
stays as-is (warp mode is entered via a PropertiesPanel button, not double-click — double-click is already claimed by text-edit mode for text nodes). Add a small "Edit warp" toggle button rendered only when `node.type === 'text' && node.warp` (near the existing handles, `pointer-events-auto`), e.g. immediately before the `{!isCropping && !isEditingText && HANDLES.map(...)}` block:

```ts
      {node.type === 'text' && node.warp && !isCropping && !isEditingText && (
        <button
          type="button"
          onClick={() => setWarpEditingNodeId(isEditingWarp ? null : node.id)}
          className="pointer-events-auto absolute rounded bg-white px-1 text-xs shadow"
          style={{ left: topLeftScreen.x, top: topLeftScreen.y - 20 }}
        >
          {isEditingWarp ? 'Done' : 'Edit warp'}
        </button>
      )}
```

Then extend both existing guards from `!isCropping && !isEditingText` to `!isCropping && !isEditingText && !isEditingWarp` (the two `HANDLES.map` / rotate-handle blocks), and add the render branch:

```ts
      {isEditingWarp && node.type === 'text' && node.warp && (
        <WarpHandles node={node} activePageId={activePageId} viewport={viewport} />
      )}
```

- [ ] **Step 2: Implement `WarpHandles`**

```ts
// src/ui/SelectionOverlay.tsx — new component, alongside ImageCropHandles
function WarpHandles({ node, activePageId, viewport }: { node: TextNode; activePageId: string; viewport: Viewport }) {
  const store = useEditorStoreApi();
  const warp = node.warp!;

  if (warp.type === 'custom-mesh') {
    const [cols, rows] = warp.gridSize;
    const startDrag = (pointIndex: number) => (downEvent: ReactPointerEvent) => {
      downEvent.stopPropagation();
      const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
      store.getState().beginGesture(`warp-point:${node.id}:${pointIndex}`);
      const onMove = (moveEvent: PointerEvent) => {
        const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
        const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
        const local = rotateVector(worldDelta, -node.transform.rotation);
        const points = [...warp.points];
        points[pointIndex * 2] = local.x;
        points[pointIndex * 2 + 1] = local.y;
        store.getState().dispatch({
          type: 'UpdateProps',
          pageId: activePageId,
          nodeId: node.id,
          patch: { warp: { ...warp, points } },
        });
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        store.getState().endGesture();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    return (
      <>
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const idx = row * cols + col;
            const gridLocal = {
              x: (col / (cols - 1 || 1)) * node.size.width + warp.points[idx * 2],
              y: (row / (rows - 1 || 1)) * node.size.height + warp.points[idx * 2 + 1],
            };
            const pos = viewport.toScreen(worldPoint(node, gridLocal));
            return (
              <div
                key={idx}
                onPointerDown={startDrag(idx)}
                className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500 bg-white"
                style={{ left: pos.x, top: pos.y, cursor: 'move' }}
              />
            );
          }),
        )}
      </>
    );
  }

  // 7 formula styles: one quick-adjust handle. Vertical drag maps to the
  // style's primary "intensity" field (curve/amount/amplitude), horizontal
  // drag maps to its secondary field (frequency/angle) where one exists —
  // the PropertiesPanel sliders (Task 8) remain the precise control for
  // both; this handle is a coarse, discoverable on-canvas affordance, same
  // spirit as a single crop corner being "good enough" for quick adjustment.
  const handleLocal = { x: node.size.width / 2, y: node.size.height / 2 };
  const pos = viewport.toScreen(worldPoint(node, handleLocal));

  const startDrag = (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    const startWorld = viewport.toWorld({ x: downEvent.clientX, y: downEvent.clientY });
    store.getState().beginGesture(`warp-handle:${node.id}`);
    const onMove = (moveEvent: PointerEvent) => {
      const currentWorld = viewport.toWorld({ x: moveEvent.clientX, y: moveEvent.clientY });
      const worldDelta = { x: currentWorld.x - startWorld.x, y: currentWorld.y - startWorld.y };
      const local = rotateVector(worldDelta, -node.transform.rotation);
      const dv = -local.y / (node.size.height || 1);
      const dh = local.x / (node.size.width || 1);
      const nextWarp = applyHandleDrag(warp, dv, dh);
      store.getState().dispatch({ type: 'UpdateProps', pageId: activePageId, nodeId: node.id, patch: { warp: nextWarp } });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      store.getState().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      onPointerDown={startDrag}
      className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500 bg-white"
      style={{ left: pos.x, top: pos.y, cursor: 'move' }}
    />
  );
}

function applyHandleDrag(warp: Warp, dv: number, dh: number): Warp {
  switch (warp.type) {
    case 'arch': return { ...warp, curve: clamp(warp.curve + dv, -1, 1) };
    case 'wave': return { ...warp, amplitude: clamp(warp.amplitude + dv, -1, 1), frequency: Math.max(0, warp.frequency + dh) };
    case 'rise': return { ...warp, amount: clamp(warp.amount + dv, -1, 1) };
    case 'flag': return { ...warp, amplitude: clamp(warp.amplitude + dv, -1, 1), frequency: Math.max(0, warp.frequency + dh) };
    case 'circle': return { ...warp, curve: clamp(warp.curve + dv, -1, 1) };
    case 'distort': return { ...warp, amountX: warp.amountX + dh * 20, amountY: warp.amountY + dv * 20 };
    case 'angle': return { ...warp, angle: warp.angle + dh };
    case 'custom-mesh': return warp; // handled by the grid-handle branch above, never reaches here
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
```

Add `import type { Warp } from '../schema';` to this file's existing type-only import line.

- [ ] **Step 2: Typecheck + lint (UI drag-interaction component — no dedicated unit test, matching `ImageCropHandles`'s own precedent, which also has none; verified manually in Task 10)**

Run: `npx tsc --noEmit && npx eslint src/ui/SelectionOverlay.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/SelectionOverlay.tsx
git commit -m "feat: add on-canvas WarpHandles (single handle for formula styles, grid for custom-mesh), gated behind an edit-mode mutual-exclusion toggle"
```

---

### Task 10: End-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite + typecheck + lint**

```bash
npx vitest run
npx tsc --noEmit
npx eslint src
```

Expected: all green.

- [ ] **Step 2: Manual browser verification** (start the dev server, use the app directly)

For a text node on `feat/text`:
1. Add text, apply each of the 8 warp styles one at a time via the PropertiesPanel picker — confirm each renders a visibly warped glyph shape (not a flat rectangle) and the sliders visibly change it live.
2. Toggle a warp on and back off — confirm the node re-renders as flat `PIXI.Text` again with no console errors (validates Task 7's `needsRecreate` swap both directions).
3. With `arch` active, add a `shadow` (drop) effect from Task 2's shadow quick-buttons — confirm the shadow silhouettes the warped shape, not a flat rectangle (validates the slice 2/3 compatibility review's filters-on-Mesh finding).
4. Apply a `linear-gradient` fill to a warped node — confirm the gradient direction looks sensible across the warped shape (validates Task 6's gradient shader).
5. Click "Edit warp" on a `custom-mesh` node — confirm the resize/rotate handles disappear and the grid handles appear instead (validates Task 9's mutual-exclusion gate); drag one grid point and confirm the mesh deforms locally.
6. Double-click a warped text node to edit its content, type a few characters, and watch for excessive lag (validates/documents the per-keystroke re-triangulation perf note from the spec's compatibility review — if lag is bad enough to be unusable, report it, don't silently patch scope into this task).
7. Check the browser console for warnings/errors throughout, particularly around WASM loading (`wawoff2`) and shader compilation.

- [ ] **Step 3: Report results** — summarize pass/fail for each of the 7 checks above; do not mark this task complete if any check fails without an explicit adjudication (fix now vs. park with rationale), per this project's established SDD review-loop convention.
