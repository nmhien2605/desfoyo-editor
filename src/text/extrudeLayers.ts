const MAX_EXTRUDE_STEPS = 40;

// depth (px) -> how many stacked clones to render — capped so a large depth
// doesn't turn into hundreds of draw calls; deep values just reuse coarser
// steps instead of finer ones.
export function extrudeSteps(depth: number): number {
  return Math.max(1, Math.min(MAX_EXTRUDE_STEPS, Math.ceil(depth)));
}

// World-space offset for the layer `steps - i` deep (1 = shallowest, nearest
// the front face; `steps` = deepest, drawn first/furthest back).
export function extrudeLayerOffset(layerDepth: number, steps: number, depth: number, angle: number): { x: number; y: number } {
  const stepSize = depth / steps;
  return { x: layerDepth * stepSize * Math.cos(angle), y: layerDepth * stepSize * Math.sin(angle) };
}

// 1 at the front face, darkening toward (but never reaching) black at the
// deepest layer — fakes a lit extrusion side without real shading.
export function extrudeLayerShade(layerDepth: number, steps: number): number {
  return 1 - (0.6 * layerDepth) / steps;
}
