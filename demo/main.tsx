import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Placeholder demo root. No canvas/editor yet — this pass is tooling
// and folder skeleton only; the <Editor> component lands next.
function App() {
  return <div>desfoyo-editor demo — scaffold only, no editor yet</div>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
