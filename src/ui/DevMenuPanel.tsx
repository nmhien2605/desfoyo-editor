import type { ReactNode } from 'react';

export type DevMenuProps = {
  onClose: () => void;
  sampleNames: string[];
  activeSample: string;
  onSampleChange: (name: string) => void;
  onExport: (format: 'png' | 'svg') => void;
};

export function DevMenuPanel({ onClose, sampleNames, activeSample, onSampleChange, onExport }: DevMenuProps) {
  return (
    <div className="flex h-full flex-col p-3 text-sm" style={{ color: 'var(--text-primary)' }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium">Dev menu</span>
        <button type="button" onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Close
        </button>
      </div>
      <Section title="Samples">
        <div className="flex flex-col gap-1">
          {sampleNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSampleChange(name)}
              className="rounded px-2 py-1 text-left text-xs"
              style={{
                background: name === activeSample ? '#29313f' : 'transparent',
                color: name === activeSample ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Export">
        <div className="flex gap-2">
          <button type="button" className="kittl-input px-2 text-xs" onClick={() => onExport('png')}>
            PNG
          </button>
          <button type="button" className="kittl-input px-2 text-xs" onClick={() => onExport('svg')}>
            SVG
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}
