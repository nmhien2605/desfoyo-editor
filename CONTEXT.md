# Desfoyo Editor

A React component library for a graphic-design canvas editor (Canva-like) with a PixiJS/WebGL text-effects engine (Kittl-like) as its core differentiator.

## Language

**Node**:
A serializable element in the document's scene graph (`text`, `shape`, `image`, `svg`, `group`), discriminated by `type`. The valid set of node types is phase-scoped — Phase 1 accepts only `text | shape | image`; `group` arrives with Phase 2, `svg` with Phase 4. A document containing an out-of-phase node type is invalid, not silently ignored.

**Asset**:
A reference (`assetId`) to binary content (image, font) used by a node, kept out of node props to avoid duplication. What an `assetId` *resolves to* is phase-scoped and swappable behind a resolver: Phase 1 resolves it to an embedded base64 data URI stored directly in the document JSON (no backend exists yet); Phase 5's backend resolves the same field to an S3/R2-hosted URL. The document schema field never changes — only the resolution behind it.
_Avoid_: File, upload (those are the input side; "Asset" is the referenced, resolved form)

**Command**:
A named, typed request to mutate the document (e.g. `AddNode`, `RemoveNode`, `UpdateProps`, `UpdateTransform`, `Reorder`). Every document mutation goes through a Command — there is no direct model mutation path. A Command carries the `nodeId`(s) it affects, which the SceneReconciler uses for targeted invalidation instead of diffing the whole tree.
_Avoid_: Action, mutation, event (Command is the specific term for this project's mutation-request objects)

**FontService**:
Phase-scoped: in Phase 1, not a real service — just a fixed short list of Google Fonts loaded via the `FontFace` API at startup, since Phase 1 only renders flat `PIXI.Text`. Becomes a real module (upload, caching, feeding `opentype.js`) starting Phase 4, once a font library and text-on-path/warp exist.
