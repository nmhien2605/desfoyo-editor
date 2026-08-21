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
    <App />
  </StrictMode>,
);
