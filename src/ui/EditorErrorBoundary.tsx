import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
  /** Extra classes for the fallback (e.g. `absolute` when it replaces canvas overlays). */
  className?: string;
}

// A render throw would otherwise unmount the whole editor (and the host page's
// React tree above it). Retry clears the error, which remounts the children.
export class EditorErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Editor error:', error, info.componentStack);
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        className={`pointer-events-auto p-2 text-xs ${this.props.className ?? ''}`}
        style={{ color: 'var(--text-muted)' }}
      >
        Editor error — reload.{' '}
        <button type="button" className="underline" onClick={() => this.setState({ error: null })}>
          Retry
        </button>
      </div>
    );
  }
}
