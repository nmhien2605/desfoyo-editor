import { nanoid } from 'nanoid';
import { useEditorStore, useEditorStoreApi } from './EditorContext';
import type { Page, Size } from '../schema';

// ponytail: a flat const, not a registry/service — extend this object if a
// real custom-preset-saving need shows up later.
const PAGE_SIZE_PRESETS: Record<string, Size> = {
  'Social Post': { width: 1080, height: 1080 },
  Story: { width: 1080, height: 1920 },
  A4: { width: 2480, height: 3508 },
  Poster: { width: 3000, height: 4500 },
};

function defaultPage(name: string, size: Size): Page {
  return { id: nanoid(), name, size, background: { type: 'color', value: '#ffffff' }, children: [] };
}

export function PageTabs() {
  const store = useEditorStoreApi();
  const pages = useEditorStore((s) => s.document.pages);
  const activePageId = useEditorStore((s) => s.activePageId);

  const addPage = (presetName: string) => {
    const page = defaultPage(`Page ${pages.length + 1}`, PAGE_SIZE_PRESETS[presetName]);
    store.getState().dispatch({ type: 'AddPage', page });
    store.getState().setActivePage(page.id);
  };

  const duplicatePage = (pageId: string) => {
    const newPageId = nanoid();
    store.getState().dispatch({ type: 'DuplicatePage', pageId, newPageId });
    store.getState().setActivePage(newPageId);
  };

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 p-2 text-sm">
      {pages.map((page, i) => (
        <div
          key={page.id}
          className={`flex items-center gap-1 rounded px-2 py-1 ${page.id === activePageId ? 'bg-blue-200' : 'bg-gray-100'}`}
        >
          <button type="button" onClick={() => store.getState().setActivePage(page.id)}>
            {page.name}
          </button>
          <button type="button" title="Duplicate page" onClick={() => duplicatePage(page.id)} className="text-xs text-gray-500">
            ⧉
          </button>
          <button
            type="button"
            title="Move left"
            disabled={i === 0}
            onClick={() => store.getState().dispatch({ type: 'ReorderPage', pageId: page.id, to: 'down' })}
            className="text-xs text-gray-500 disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            title="Move right"
            disabled={i === pages.length - 1}
            onClick={() => store.getState().dispatch({ type: 'ReorderPage', pageId: page.id, to: 'up' })}
            className="text-xs text-gray-500 disabled:opacity-30"
          >
            →
          </button>
          <button
            type="button"
            title="Remove page"
            disabled={pages.length <= 1}
            onClick={() => store.getState().dispatch({ type: 'RemovePage', pageId: page.id })}
            className="text-xs text-gray-500 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) addPage(e.target.value);
        }}
        className="rounded border border-gray-300 px-1 py-0.5"
      >
        <option value="">+ Add Page</option>
        {Object.keys(PAGE_SIZE_PRESETS).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
