import { describe, expect, it } from 'vitest';
import { circleParamsFromHandleDrag } from '../CircleHandlesOverlay';

const fontSize = 100;

describe('circleParamsFromHandleDrag', () => {
  it('keo E giu W co dinh (anchor): center la trung diem, radius la nua khoang cach', () => {
    const anchor = { x: 0, y: 0 }; // W dung yen
    const dragged = { x: 200, y: 0 }; // E vua keo toi
    const next = circleParamsFromHandleDrag(anchor, dragged, fontSize);
    expect(next.centerX).toBeCloseTo(100 / fontSize, 10);
    expect(next.centerY).toBeCloseTo(0, 10);
    expect(next.radius).toBeCloseTo(100 / fontSize, 10);
  });

  it('keo theo phuong doc (N/S): tinh dung tren truc y', () => {
    const anchor = { x: 0, y: 0 }; // N dung yen
    const dragged = { x: 0, y: 160 }; // S vua keo toi
    const next = circleParamsFromHandleDrag(anchor, dragged, fontSize);
    expect(next.centerX).toBeCloseTo(0, 10);
    expect(next.centerY).toBeCloseTo(80 / fontSize, 10);
    expect(next.radius).toBeCloseTo(80 / fontSize, 10);
  });

  it('tam THUC SU dich chuyen theo diem keo (khac hanh vi neo-o-tam cu)', () => {
    const anchor = { x: 0, y: 0 };
    const a = circleParamsFromHandleDrag(anchor, { x: 100, y: 0 }, fontSize);
    const b = circleParamsFromHandleDrag(anchor, { x: 300, y: 0 }, fontSize);
    expect(a.centerX).not.toBeCloseTo(b.centerX, 6);
  });

  it('anchor va diem keo khong nam tren 1 truc (keo cheo) van dung: 2 diem la 2 dau duong kinh', () => {
    const anchor = { x: 10, y: 20 };
    const dragged = { x: 50, y: 80 };
    const next = circleParamsFromHandleDrag(anchor, dragged, fontSize);
    const cx = next.centerX * fontSize;
    const cy = next.centerY * fontSize;
    const r = next.radius * fontSize;
    expect(Math.hypot(anchor.x - cx, anchor.y - cy)).toBeCloseTo(r, 8);
    expect(Math.hypot(dragged.x - cx, dragged.y - cy)).toBeCloseTo(r, 8);
  });

  it('chuan hoa theo fontSize truyen vao, khong con phu thuoc box.width/height', () => {
    const anchor = { x: 0, y: 0 };
    const dragged = { x: 100, y: 0 };
    const at100 = circleParamsFromHandleDrag(anchor, dragged, 100);
    const at50 = circleParamsFromHandleDrag(anchor, dragged, 50);
    expect(at50.radius).toBeCloseTo(at100.radius * 2, 10);
  });
});
