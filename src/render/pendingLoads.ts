// Async asset loads (image textures, SVG builds) the renderers start but
// SceneReconciler can't await (create/update are synchronous). Export awaits
// settled() so it never extracts a half-loaded scene.
// ponytail: one global set shared by every editor instance — an export may
// also wait for another editor's loads; scope per reconciler if that matters.
const pending = new Set<Promise<unknown>>();
const listeners = new Set<() => void>();

export function trackLoad(p: Promise<unknown>): void {
  pending.add(p);
  void p
    .finally(() => {
      pending.delete(p);
      for (const cb of [...listeners]) cb();
    })
    .catch(() => {});
}

// CanvasHost renders on demand (no ticker), so it needs to know when a load
// has changed the scene outside the store.
export function onLoadSettled(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Loops so loads started while waiting (e.g. a remount mid-export) count too.
export async function loadsSettled(): Promise<void> {
  while (pending.size > 0) await Promise.allSettled([...pending]);
}
