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

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const commit = () => {
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

  const originX = node.transform.originX ?? 0;
  const originY = node.transform.originY ?? 0;
  const topLeft = viewport.toScreen({
    x: node.transform.x - originX * node.size.width,
    y: node.transform.y - originY * node.size.height,
  });
  const zoom = viewport.toScreen({ x: 1, y: 0 }).x - viewport.toScreen({ x: 0, y: 0 }).x;

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
      className="pointer-events-auto absolute resize-none overflow-hidden border-2 border-blue-500 bg-white/90 p-0 outline-none"
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
