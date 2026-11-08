// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { EditorErrorBoundary } from '../EditorErrorBoundary';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('EditorErrorBoundary', () => {
  it('renders the fallback, reports via onError, and Retry remounts the children', () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    let fail = true;
    const Child = () => {
      if (fail) throw new Error('boom');
      return createElement('span', null, 'ok');
    };
    const onError = vi.fn();
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(createElement(EditorErrorBoundary, { onError, children: createElement(Child) })));

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Editor error');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
    expect(errorLog).toHaveBeenCalled();

    fail = false;
    act(() => container.querySelector('button')!.click());
    expect(container.textContent).toBe('ok');
    act(() => root.unmount());
    errorLog.mockRestore();
  });
});
