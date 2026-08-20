import type { ReactNode } from 'react';
import { FloatingBottomBar } from './FloatingBottomBar';
import { WorkspacePageLabel } from './WorkspacePageLabel';
import { DrawerPanel } from './DrawerPanel';

export function Workspace({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-w-0 flex-col overflow-hidden" style={{ background: 'var(--workspace-bg)' }}>
      <WorkspacePageLabel />
      <div className="relative flex min-h-0 flex-1 items-start justify-center overflow-auto pt-6">
        <div
          className="relative shrink-0"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,.08)' }}
        >
          {children}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-3">
        <div className="pointer-events-auto">
          <FloatingBottomBar />
        </div>
      </div>
      <DrawerPanel />
    </main>
  );
}
