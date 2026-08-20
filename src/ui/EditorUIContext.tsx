import { createContext, useContext, useState, type ReactNode } from 'react';

export type DrawerPanel = 'layers' | 'assets' | 'dev' | null;
export type ActiveTool = 'select' | 'grid' | 'shape' | 'text' | 'image';

export type DevMenuConfig = {
  sampleNames: string[];
  activeSample: string;
  onSampleChange: (name: string) => void;
};

type EditorUIContextValue = {
  drawer: DrawerPanel;
  setDrawer: (drawer: DrawerPanel) => void;
  toggleDrawer: (panel: Exclude<DrawerPanel, null>) => void;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  devMenu: DevMenuConfig | null;
  onExport: ((format: 'png' | 'svg') => void) | null;
};

const EditorUIContext = createContext<EditorUIContextValue | null>(null);

export function EditorUIProvider({
  children,
  devMenu = null,
  onExport = null,
}: {
  children: ReactNode;
  devMenu?: DevMenuConfig | null;
  onExport?: ((format: 'png' | 'svg') => void) | null;
}) {
  const [drawer, setDrawer] = useState<DrawerPanel>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');

  const toggleDrawer = (panel: Exclude<DrawerPanel, null>) => {
    setDrawer((current) => (current === panel ? null : panel));
  };

  return (
    <EditorUIContext.Provider value={{ drawer, setDrawer, toggleDrawer, activeTool, setActiveTool, devMenu, onExport: onExport ?? null }}>
      {children}
    </EditorUIContext.Provider>
  );
}

export function useEditorUI() {
  const ctx = useContext(EditorUIContext);
  if (!ctx) throw new Error('useEditorUI must be used within EditorUIProvider');
  return ctx;
}
