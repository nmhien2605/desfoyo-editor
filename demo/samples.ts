import type { Document } from '../src/schema';

const SWATCH_SVG =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f59e0b"/><circle cx="100" cy="100" r="60" fill="#fff"/></svg>',
  );

function baseDoc(partial: Pick<Document, 'id' | 'pages' | 'assets'>): Document {
  return {
    version: 1,
    meta: { title: partial.id, createdAt: Date.now(), updatedAt: Date.now() },
    ...partial,
  };
}

export const basicShapesSample: Document = baseDoc({
  id: 'sample-basic-shapes',
  assets: {},
  pages: [
    {
      id: 'page-1',
      name: 'Page 1',
      size: { width: 800, height: 600 },
      background: { type: 'color', value: '#ffffff' },
      children: [
        {
          id: 'shape-1',
          type: 'shape',
          transform: {
            x: 200,
            y: 200,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            originX: 0.5,
            originY: 0.5,
          },
          size: { width: 200, height: 150 },
          opacity: 1,
          visible: true,
          locked: false,
          shape: 'rect',
          cornerRadius: 12,
          fill: { type: 'solid', color: '#3b82f6' },
        },
        {
          id: 'shape-2',
          type: 'shape',
          transform: {
            x: 550,
            y: 200,
            scaleX: 1,
            scaleY: 1,
            rotation: 0.2,
            originX: 0.5,
            originY: 0.5,
          },
          size: { width: 160, height: 160 },
          opacity: 1,
          visible: true,
          locked: false,
          shape: 'ellipse',
          fill: { type: 'solid', color: '#ef4444' },
        },
      ],
    },
  ],
});

export const shadowEffectSample: Document = baseDoc({
  id: 'sample-shadow-effect',
  assets: { 'asset-swatch': { type: 'image', dataUri: SWATCH_SVG } },
  pages: [
    {
      id: 'page-1',
      name: 'Page 1',
      size: { width: 800, height: 600 },
      background: { type: 'color', value: '#111827' },
      children: [
        {
          id: 'shape-shadow',
          type: 'shape',
          transform: {
            x: 400,
            y: 380,
            scaleX: 1,
            scaleY: 1,
            rotation: -0.1,
            originX: 0.5,
            originY: 0.5,
          },
          size: { width: 220, height: 140 },
          opacity: 1,
          visible: true,
          locked: false,
          shape: 'rect',
          cornerRadius: 16,
          fill: { type: 'solid', color: '#22c55e' },
          effects: [{ type: 'shadow', color: '#000000', blur: 12, offset: [10, 10], alpha: 0.6 }],
        },
        {
          id: 'image-1',
          type: 'image',
          transform: {
            x: 680,
            y: 480,
            scaleX: 1,
            scaleY: 1,
            rotation: 0.15,
            originX: 0.5,
            originY: 0.5,
          },
          size: { width: 120, height: 120 },
          opacity: 1,
          visible: true,
          locked: false,
          assetId: 'asset-swatch',
        },
      ],
    },
  ],
});

export const textWaveSample: Document = baseDoc({
  id: 'sample-text-wave',
  assets: {},
  pages: [
    {
      id: 'page-1',
      name: 'Page 1',
      size: { width: 900, height: 500 },
      background: { type: 'color', value: '#ffffff' },
      children: [
        {
          id: 'text-plain',
          type: 'text',
          transform: {
            x: 450,
            y: 140,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            originX: 0.5,
            originY: 0.5,
          },
          // measureText(node, Anton@110) cho "Desfoyo" align=center — xem
          // finding #4 cua final-review-fix-report.md, khong doan tay.
          size: { width: 350.947265625, height: 165.5908203125 },
          opacity: 1,
          visible: true,
          locked: false,
          text: 'Desfoyo',
          font: { family: 'Anton', weight: 400, style: 'normal', size: 110 },
          align: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          fill: { type: 'solid', color: '#111827' },
        },
        {
          id: 'text-waved',
          type: 'text',
          transform: {
            x: 450,
            y: 340,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            originX: 0.5,
            originY: 0.5,
          },
          // measureText(node, Anton@110) cho "Desfoyo" align=center — xem
          // finding #4 cua final-review-fix-report.md, khong doan tay.
          size: { width: 350.947265625, height: 165.5908203125 },
          opacity: 1,
          visible: true,
          locked: false,
          text: 'Desfoyo',
          font: { family: 'Anton', weight: 400, style: 'normal', size: 110 },
          align: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          fill: { type: 'solid', color: '#2563eb' },
          warp: { type: 'wave', intensity: 0.5 },
        },
      ],
    },
  ],
});

export const samples: Record<string, Document> = {
  'Basic shapes': basicShapesSample,
  'Shadow effect': shadowEffectSample,
  'Text + wave': textWaveSample,
};
