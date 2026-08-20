import { useShallow } from 'zustand/react/shallow';
import { useEditorStore, useCanvasContext } from './EditorContext';
import { createViewport } from '../render/viewport';
import { selectedNodesOf, selectionBox } from './SelectionOverlay';
import type { Node } from '../schema';

export function useSelectionScreenBounds(): { left: number; top: number; width: number; height: number } | null {
  const { canvas } = useCanvasContext();
  const camera = useEditorStore((s) => s.camera);
  const selectedNodes = useEditorStore(useShallow(selectedNodesOf));

  if (!canvas || selectedNodes.length !== 1) return null;

  const node = selectedNodes[0];
  const viewport = createViewport(canvas, () => camera);
  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;
  const box = selectionBox(node);
  const topLeft = viewport.toScreen({
    x: node.transform.x - originX * node.size.width + box.x,
    y: node.transform.y - originY * node.size.height + box.y,
  });

  return {
    left: topLeft.x,
    top: topLeft.y,
    width: box.width * camera.zoom,
    height: box.height * camera.zoom,
  };
}

export function selectionCenterScreen(node: Node, canvas: HTMLCanvasElement, camera: { zoom: number; panX: number; panY: number }) {
  const viewport = createViewport(canvas, () => camera);
  const box = selectionBox(node);
  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;
  const centerWorld = {
    x: node.transform.x - originX * node.size.width + box.x + box.width / 2,
    y: node.transform.y - originY * node.size.height + box.y + box.height / 2,
  };
  return viewport.toScreen(centerWorld);
}
