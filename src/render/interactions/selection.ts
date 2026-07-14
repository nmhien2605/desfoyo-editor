import type { EditorStoreApi } from '../../core/store';

export function selectNode(store: EditorStoreApi, nodeId: string | null): void {
  store.getState().select(nodeId);
}
