import { nanoid } from 'nanoid';
import { useEditorStore, useEditorStoreApi } from './EditorContext';
import type { Page, Size } from '../schema';

const PAGE_SIZE_PRESETS: Record<string, Size> = {
  Standard: { width: 940, height: 960 },
  'Social Post': { width: 1080, height: 1080 },
  Story: { width: 1080, height: 1920 },
  A4: { width: 2480, height: 3508 },
  Poster: { width: 3000, height: 4500 },
};

function defaultPage(name: string, size: Size): Page {
  return { id: nanoid(), name, size, background: { type: 'color', value: '#f8f8f7' }, children: [] };
}

export function WorkspacePageLabel() {
  const store = useEditorStoreApi();
  const pages = useEditorStore((s) => s.document.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const active = pages.find((p) => p.id === activePageId);

  const addPage = (presetName: string) => {
    const page = defaultPage(`Page ${pages.length + 1}`, PAGE_SIZE_PRESETS[presetName] ?? PAGE_SIZE_PRESETS.Standard);
    store.getState().dispatch({ type: 'AddPage', page });
    store.getState().setActivePage(page.id);
  };

  return (
    <div className="absolute left-4 top-1.5 z-10 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
      <span>▣ {active?.name ?? 'Standard'}</span>
      <select
        value={activePageId}
        onChange={(e) => store.getState().setActivePage(e.target.value)}
        className="rounded border px-1 py-0.5 text-xs"
        style={{ background: '#151b25', borderColor: 'var(--panel-border)', color: 'var(--text-muted)' }}
      >
        {pages.map((page) => (
          <option key={page.id} value={page.id}>
            {page.name}
          </option>
        ))}
      </select>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) addPage(e.target.value);
          e.target.value = '';
        }}
        className="rounded border px-1 py-0.5 text-xs"
        style={{ background: '#151b25', borderColor: 'var(--panel-border)', color: 'var(--text-muted)' }}
      >
        <option value="">+ Page</option>
        {Object.keys(PAGE_SIZE_PRESETS).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
