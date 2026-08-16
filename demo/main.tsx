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
  const [sampleName, setSampleName] = useState<keyof typeof samples>('Basic shapes');
  const editorRef = useRef<EditorHandle>(null);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 p-2">
        <span className="text-sm font-medium">Sample:</span>
        {Object.keys(samples).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSampleName(name)}
            className={`rounded px-3 py-1 text-sm ${name === sampleName ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto rounded bg-gray-100 px-3 py-1 text-sm"
          onClick={async () => {
            const blob = await editorRef.current?.export('png');
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'desfoyo-export.png';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export PNG
        </button>
        <button
          type="button"
          className="rounded bg-gray-100 px-3 py-1 text-sm"
          onClick={async () => {
            const blob = await editorRef.current?.export('svg');
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'desfoyo-export.svg';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export SVG
        </button>
      </div>
      <Editor ref={editorRef} key={sampleName} document={samples[sampleName]} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
