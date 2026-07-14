import type { Application, Container } from 'pixi.js';

// Extracts the page container specifically (not app.stage), so any future
// selection/UI chrome doesn't leak into the exported image.
export function exportPng(app: Application, pageContainer: Container): Promise<Blob> {
  const canvas = app.renderer.extract.canvas({ target: pageContainer }) as HTMLCanvasElement;
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export PNG'));
    }, 'image/png');
  });
}
