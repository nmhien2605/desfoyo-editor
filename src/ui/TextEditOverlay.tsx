import { useEffect, useRef, useState } from 'react';
import type { Font } from 'opentype.js';
import { useEditorStoreApi } from './EditorContext';
import type { Viewport } from '../render/viewport';
import { getLoadedFont } from '../text/fontService';
import { measureText } from '../text/textGeometry';
import type { Node, TextNode } from '../schema';

// node.size là kết quả của layout, nên mỗi lần nội dung đổi thì size phải đo
// lại cùng lúc — applyTransform.ts (pivot) và SelectionOverlay.tsx (khung
// chọn) đều đọc node.size, để lệch là khung chọn sai ngay.
export function textEditPatch(node: TextNode, text: string, font: Font | null): Partial<TextNode> {
  if (!font) return { text };
  return { text, size: measureText({ ...node, text }, font) };
}

// Pure predicate behind the capture-phase "click away commits" handler below
// — pulled out so the branch (inside vs. outside the textarea) has its own
// test instead of only being covered indirectly through DOM event wiring.
export function isOutsideTextarea(
  target: EventTarget | null,
  textarea: HTMLTextAreaElement | null,
): boolean {
  return !(target instanceof Node && textarea?.contains(target));
}

// Dùng <textarea> DOM thật thay vì tự vẽ caret trên canvas: trình duyệt lo
// caret, bôi đen và IME tiếng Việt. Đánh đổi đã biết: khi node đang warp,
// textarea vẫn hiện chữ thẳng — xem docs/text-future-work.md mục 10.
export function TextEditOverlay({
  node,
  viewport,
  activePageId,
  onClose,
}: {
  node: TextNode;
  viewport: Viewport;
  activePageId: string;
  onClose: () => void;
}) {
  const store = useEditorStoreApi();
  const [value, setValue] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Guards against dispatching the same commit twice — the capture-phase
  // pointerdown handler below and the textarea's own onBlur can both fire
  // for the same "click away" gesture (see that handler's comment).
  const committedRef = useRef(false);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    if (value !== node.text) {
      const font = getLoadedFont(node.font.family)?.font ?? null;
      store.getState().dispatch({
        type: 'UpdateProps',
        pageId: activePageId,
        nodeId: node.id,
        patch: textEditPatch(node, value, font) as Partial<Node>,
      });
    }
    onClose();
  };

  // Kept fresh every render (in an effect, not during render — mutating a
  // ref while rendering is a lint error) so the capture-phase listener
  // (registered once, below) always commits the latest typed value instead
  // of closing over a stale one from mount time.
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  // Canvas has its own native `pointerdown` listener (Pixi's stage handler
  // in marquee.ts) that, for an empty-canvas click, synchronously deselects
  // the node and unmounts this overlay — which happens before the browser's
  // native `blur` event would otherwise reach onBlur below, silently
  // discarding whatever was typed. A capture-phase listener on `document`
  // always runs before any listener on a descendant (the canvas), regardless
  // of that descendant's own phase, so committing here wins the race and the
  // edit is saved before the canvas gets a chance to unmount us.
  useEffect(() => {
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (isOutsideTextarea(e.target, textareaRef.current)) commitRef.current();
    };
    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside, true);
  }, []);

  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;
  const topLeft = viewport.toScreen({
    x: node.transform.x - originX * node.size.width,
    y: node.transform.y - originY * node.size.height,
  });
  const zoom = viewport.toScreen({ x: 1, y: 0 }).x - viewport.toScreen({ x: 0, y: 0 }).x;

  // select-text: khung bọc canvas là vùng select-none (xem Editor.tsx) nên
  // phải bật lại ở đây, nếu không bôi đen/kéo chọn chữ trong ô sửa mất tác dụng.
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          setValue(node.text);
          onClose();
        }
      }}
      className="pointer-events-auto absolute resize-none select-text overflow-hidden border-2 border-blue-500 bg-white/90 p-0 outline-none"
      style={{
        left: topLeft.x,
        top: topLeft.y,
        width: node.size.width * zoom,
        height: node.size.height * zoom,
        // Cùng family mà fontService đã đăng ký qua FontFace, nên chữ trong
        // textarea trông sát với chữ trên canvas.
        fontFamily: `"${node.font.family}", sans-serif`,
        fontSize: node.font.size * zoom,
        lineHeight: node.lineHeight,
        letterSpacing: node.letterSpacing * zoom,
        textAlign: node.align,
        color: node.fill.type === 'solid' ? node.fill.color : '#000000',
        transformOrigin: `${originX * 100}% ${originY * 100}%`,
        transform: `rotate(${(node.transform.rotation * 180) / Math.PI}deg)`,
      }}
    />
  );
}
