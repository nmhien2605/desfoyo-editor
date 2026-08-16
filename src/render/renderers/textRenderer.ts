import { Graphics } from 'pixi.js';
import type { Fill, TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill } from '../fillToColor';
import { getLoadedFont, loadFont, onFontLoaded } from '../../text/fontService';
import { textGeometry } from '../../text/textGeometry';
import type { GlyphShape } from '../../text/glyphOutlines';

// Đúng phần bề mặt Graphics mà việc vẽ chữ cần — tách ra để test được thứ tự
// lệnh vẽ mà không phải dựng WebGL.
export interface TextDrawTarget {
  poly(points: number[], close?: boolean): TextDrawTarget;
  fill(style?: unknown): TextDrawTarget;
  cut(): TextDrawTarget;
}

// Lỗ trong chữ ('o', 'a', '8') phải khai báo tường minh: Pixi v8 KHÔNG áp
// dụng winding non-zero cho nhiều poly() trong cùng một fill() — mỗi polygon
// được tam giác hoá riêng nên ruột chữ sẽ bị tô đặc. cut() gắn lỗ vào shape
// cuối cùng của lệnh fill ngay trước đó (xem GraphicsContext.cut() trong
// pixi.js), nên phải fill *từng* outer rồi cut lỗ của chính nó — không gộp
// nhiều outer vào một fill.
export function drawTextShapes(target: TextDrawTarget, shapes: GlyphShape[], fill: Fill): void {
  const style = resolveFill(fill);
  for (const shape of shapes) {
    target.poly(shape.outer, true).fill(style);
    for (const hole of shape.holes) target.poly(hole, true).cut();
  }
}

type TextGraphics = Graphics & { textNode?: TextNode; offFontLoaded?: () => void };

function draw(obj: TextGraphics, node: TextNode): void {
  obj.clear();
  const loaded = getLoadedFont(node.font.family);
  if (!loaded) {
    // Font chưa nạp xong: không vẽ gì và kích hoạt nạp. Callback đăng ký ở
    // create() sẽ vẽ lại khi font sẵn sàng.
    void loadFont(node.font.family);
    return;
  }
  drawTextShapes(
    obj as unknown as TextDrawTarget,
    textGeometry(node, loaded.font).shapes,
    node.fill,
  );
}

export const textRenderer = {
  create(node: TextNode): Graphics {
    const obj: TextGraphics = new Graphics();
    // textNode được làm mới ở mỗi update() nên callback không bao giờ vẽ lại
    // một node đã cũ.
    obj.offFontLoaded = onFontLoaded((family) => {
      if (!obj.destroyed && obj.textNode && family === obj.textNode.font.family)
        draw(obj, obj.textNode);
    });
    obj.once('destroyed', () => obj.offFontLoaded?.());
    this.update(obj, node);
    return obj;
  },
  update(obj: Graphics, node: TextNode): void {
    const target = obj as TextGraphics;
    target.textNode = node;
    draw(target, node);
    applyTransform(obj, node);
  },
};
