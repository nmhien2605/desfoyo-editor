import type { SelectionBounds } from './groupTransformMath';

// A guide line: 'x' means a vertical line at world x = value (a snapped
// x-position match); 'y' means a horizontal line at world y = value.
export interface SnapGuide {
  axis: 'x' | 'y';
  value: number;
}

export interface SnapResult {
  delta: { x: number; y: number };
  guides: SnapGuide[];
}

function linesX(b: SelectionBounds): number[] {
  return [b.min.x, b.pivot.x, b.max.x];
}
function linesY(b: SelectionBounds): number[] {
  return [b.min.y, b.pivot.y, b.max.y];
}

// Snaps the moving selection's own three lines per axis (min/center/max) to
// the nearest candidate line within `threshold`, independently per axis.
// Candidates are typically sibling nodes' bboxes plus the page bounds.
export function computeSnap(movingBounds: SelectionBounds, candidateBounds: SelectionBounds[], threshold: number): SnapResult {
  const candidateLinesX = candidateBounds.flatMap(linesX);
  const candidateLinesY = candidateBounds.flatMap(linesY);

  const snapAxis = (movingLines: number[], candidates: number[]): { offset: number; guide: number } | null => {
    let best: { offset: number; guide: number; dist: number } | null = null;
    for (const moving of movingLines) {
      for (const candidate of candidates) {
        const dist = Math.abs(candidate - moving);
        if (dist <= threshold && (!best || dist < best.dist)) {
          best = { offset: candidate - moving, guide: candidate, dist };
        }
      }
    }
    return best ? { offset: best.offset, guide: best.guide } : null;
  };

  const guides: SnapGuide[] = [];
  const snapX = snapAxis(linesX(movingBounds), candidateLinesX);
  const snapY = snapAxis(linesY(movingBounds), candidateLinesY);
  if (snapX) guides.push({ axis: 'x', value: snapX.guide });
  if (snapY) guides.push({ axis: 'y', value: snapY.guide });

  return { delta: { x: snapX?.offset ?? 0, y: snapY?.offset ?? 0 }, guides };
}
