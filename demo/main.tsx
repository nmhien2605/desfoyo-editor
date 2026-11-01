import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, type EditorHandle } from '../src/index';
import { samples } from './samples';
import '../src/ui/styles.css';
import { registerFont } from '../src/text/fontService';
import poppinsUrl from '../src/text/fonts/Poppins-Regular.ttf?url';
import antonUrl from '../src/text/fonts/Anton-Regular.ttf?url';
import lobsterUrl from '../src/text/fonts/Lobster-Regular.ttf?url';

registerFont('Poppins', poppinsUrl);
registerFont('Anton', antonUrl);
registerFont('Lobster', lobsterUrl);

// ?stage=1: chrome-less editor with a mockup backdrop (EditorProps.stage).
const shirt = (fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1200"><rect width="1000" height="1200" fill="#eee"/><path d="M300 100 L700 100 L950 300 L850 450 L780 400 L780 1100 L220 1100 L220 400 L150 450 L50 300 Z" fill="${fill}" stroke="#999" stroke-width="4"/></svg>`,
  )}`;

function StageDemo() {
  const [dark, setDark] = useState(false);
  const editorRef = useRef<EditorHandle>(null);
  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => setDark((d) => !d)}>Toggle shirt colour</button>{' '}
      <button onClick={() => editorRef.current?.resetView()}>Reset view</button>{' '}
      <button
        onClick={async () => {
          const canvas = await editorRef.current?.exportCanvas();
          if (canvas) window.open(canvas.toDataURL());
        }}
      >
        Export
      </button>
      <div style={{ width: '70vw', height: '75vh', resize: 'both', overflow: 'hidden', border: '1px solid #ccc', marginTop: 8 }}>
        <Editor
          ref={editorRef}
          document={samples['Kittl showcase']}
          chrome={false}
          stage={{
            backdropUrl: shirt(dark ? '#333' : '#fafafa'),
            pageCenter: { x: 0.5, y: 0.45 },
            pageBox: { width: 0.4, height: 0.5 },
            pageColor: '#ffffff',
            outline: { color: '#e11d48', corners: true },
          }}
        />
      </div>
    </div>
  );
}

function App() {
  const [sampleName, setSampleName] = useState<keyof typeof samples>('Kittl showcase');
  const editorRef = useRef<EditorHandle>(null);

  const handleExport = async (format: 'png' | 'svg', scale?: number) => {
    const blob = await editorRef.current?.export(format, scale);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'png' ? 'desfoyo-export.png' : 'desfoyo-export.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Editor
      ref={editorRef}
      key={sampleName}
      document={samples[sampleName]}
      initialSelectedNodeIds={sampleName === 'Kittl showcase' ? ['text-play'] : undefined}
      devMenu={{
        sampleNames: Object.keys(samples),
        activeSample: sampleName,
        onSampleChange: (name) => setSampleName(name as keyof typeof samples),
      }}
      onExport={handleExport}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {new URLSearchParams(location.search).has('stage') ? <StageDemo /> : <App />}
  </StrictMode>,
);
