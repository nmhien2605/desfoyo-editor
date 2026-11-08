Status: in progress · Updated: 2026-11-08 · ID: mcrash

# Editor crash on mobile

Investigation: `desfoyo-web/docs/editor-mobile-crash.md` (ids A1–A4, B1–B7, C1–C4 below refer to it).

## Goal
The v2 editor on a phone stays within a sane memory budget (no tab kill on iPhone with 3–4 GB RAM) and no longer gets stuck/blank from cancelled touches, undo across an image, or GPU context loss.

## Out of scope
- Pasteboard, editor redesign, single shared WebGL context for all sides.
- Unmounting hidden sides in the web (keeps per-side undo; not needed once per-context memory is small).
- Testing on a real iPhone (no device here) — measured in Chrome mobile emulation; numbers for DPR 3 computed.

## Acceptance criteria
1. Renderer resolution ≤ 2 and no MSAA on the main canvas when DPR ≥ 2 (A1).
2. Stage backdrop rasterised so its longest side ≤ 2048 px; one decode shared by editors with the same URL (A2).
3. Image textures over 2048 px are downscaled for rendering (export at the web's scales unchanged in look); the texture cache frees sources nobody uses (B1).
4. Drop-shadow/glow filters: resolution ≤ 2, antialias off, quality ≤ 6; old gradients destroyed / cached (B2, B3).
5. Gestures and sliders end cleanly on `pointercancel`/`lostpointercapture` (C1).
6. Undo/redo across an image add never leaves a node without its asset; a missing asset renders a placeholder, never throws (C2).
7. Editor has an error boundary; after `webglcontextrestored` the scene redraws (C3, C4).
8. Drag of a node only updates its transform (no geometry/filter rebuild) (B4); selection identity stable across dispatches (B5).
9. Web: atlas canvas ≤ 2048 on touch devices; Model3D not mounted on mobile until the preview view is opened (A3, A4).
10. QA on `/editor/t-shirt-oversized` at 375×812: canvas/texture budget measured before/after; add text (shadow, gradient), image, drag, undo/redo, side switch, pinch all work; console clean.
11. Lib tests, lint, tsc, build pass; web lint + tsc pass.

## Tasks
| # | ID | Repo | Type | Model | Scope | Status |
|---|---|---|---|---|---|---|
| 1 | mcrash-1 | lib | code | Opus (user: Opus for all) | memory: CanvasHost resolution/antialias, stageLayers backdrop, imageRenderer cap + cache release, buildFilters, fillToColor | done |
| 2 | mcrash-2 | lib | code | Opus | correctness: pointerGesture + sliders cancel, undo/asset, error boundary, context restored | done |
| 3 | mcrash-3 | lib | code | Opus | perf: transform-only drag path, stable selection | todo |
| 4 | mcrash-4 | web | code | Opus | atlas cap, lazy Model3D on mobile | todo |
| 5 | mcrash-5 | both | qa | Opus | measure + functional check in browser | todo |

Local testing: lead builds the lib, copies `dist/` into `desfoyo-web/node_modules/@desfoyo/editor/dist`, clears `.next/cache`, restarts the dev server. Pushing the lib and bumping the web's `yarn.lock` needs the user's OK.
