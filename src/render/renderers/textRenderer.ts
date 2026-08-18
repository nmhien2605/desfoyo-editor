import { Graphics, Rectangle } from 'pixi.js';
import type { Fill, TextNode } from '../../schema';
import { applyTransform } from '../applyTransform';
import { resolveFill } from '../fillToColor';
import { getLoadedFont, loadFont, onFontLoaded } from '../../text/fontService';
import { textGeometry } from '../../text/textGeometry';
import type { GlyphShape } from '../../text/glyphOutlines';

// Đúng phần bề mặt Graphics mà việc vẽ chữ cần — tách ra để test được thứ tự
// lệnh vẽ mà không phải dựng WebGL.
export interface TextDrawTarget {
  moveTo(x: number, y: number): TextDrawTarget;
  bezierCurveTo(
    c1x: number,
    c1y: number,
    c2x: number,
    c2y: number,
    x: number,
    y: number,
  ): TextDrawTarget;
  closePath(): TextDrawTarget;
  fill(style?: unknown): TextDrawTarget;
  cut(): TextDrawTarget;
}

function trace(target: TextDrawTarget, contour: GlyphShape['outer']): void {
  target.moveTo(contour[0], contour[1]);
  for (let i = 2; i + 5 < contour.length; i += 6) {
    target.bezierCurveTo(
      contour[i],
      contour[i + 1],
      contour[i + 2],
      contour[i + 3],
      contour[i + 4],
      contour[i + 5],
    );
  }
  target.closePath();
}

// Lỗ trong chữ ('o', 'a', '8') phải khai báo tường minh: Pixi v8 KHÔNG áp
// dụng winding non-zero cho nhiều path trong cùng một fill() — mỗi path được
// tam giác hoá riêng nên ruột chữ sẽ bị tô đặc. cut() gắn lỗ vào shape cuối
// cùng của lệnh fill ngay trước đó (GraphicsContext.cut() clone _activePath,
// không phụ thuộc path được dựng bằng lệnh gì), nên phải fill *từng* outer
// rồi cut lỗ của chính nó — không gộp nhiều outer vào một fill.
export function drawTextShapes(target: TextDrawTarget, shapes: GlyphShape[], fill: Fill): void {
  const style = resolveFill(fill);
  for (const shape of shapes) {
    trace(target, shape.outer);
    target.fill(style);
    for (const hole of shape.holes) {
      trace(target, hole);
      target.cut();
    }
  }
}

type TextGraphics = Graphics & { textNode?: TextNode; offFontLoaded?: () => void };

function draw(obj: TextGraphics, node: TextNode): void {
  obj.clear();
  const loaded = getLoadedFont(node.font.family);
  if (!loaded) {
    // Font chưa nạp xong: không vẽ gì và kích hoạt nạp. Callback đăng ký ở
    // create() sẽ vẽ lại khi font sẵn sàng.
    obj.hitArea = null;
    void loadFont(node.font.family);
    return;
  }
  const geometry = textGeometry(node, loaded.font);
  drawTextShapes(obj as unknown as TextDrawTarget, geometry.shapes, node.fill);

  // Hit-test mặc định của Graphics là hit-test từng path đã tô, nên chỉ đúng
  // phần MỰC của chữ mới bấm được: bấm vào khoảng trắng giữa hai ký tự (hay
  // vào ruột chữ 'o') rơi thẳng xuống stage và bị marquee.ts hiểu là bấm ra
  // nền — đang chọn thì mất chọn. Đặt hitArea bằng đúng khung mà
  // SelectionOverlay vẽ để cả khung chữ bấm được, như mọi trình thiết kế.
  const { minX, minY, maxX, maxY } = geometry.bounds;
  obj.hitArea = new Rectangle(minX, minY, maxX - minX, maxY - minY);
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
