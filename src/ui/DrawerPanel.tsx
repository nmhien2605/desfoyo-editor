import { LayersPanel } from './LayersPanel';
import { AssetPanel } from './AssetPanel';
import { DevMenuPanel } from './DevMenuPanel';
import { useEditorUI } from './EditorUIContext';

export function DrawerPanel() {
  const { drawer, setDrawer, devMenu, onExport } = useEditorUI();
  if (!drawer) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 z-20 bg-black/30"
        onClick={() => setDrawer(null)}
      />
      <div className="kittl-drawer">
        {drawer === 'layers' && <LayersPanel onClose={() => setDrawer(null)} />}
        {drawer === 'assets' && <AssetPanel onClose={() => setDrawer(null)} />}
        {drawer === 'dev' && devMenu && onExport && (
          <DevMenuPanel
            onClose={() => setDrawer(null)}
            sampleNames={devMenu.sampleNames}
            activeSample={devMenu.activeSample}
            onSampleChange={devMenu.onSampleChange}
            onExport={onExport}
          />
        )}
      </div>
    </>
  );
}
