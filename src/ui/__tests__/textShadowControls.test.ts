import { describe, expect, it } from 'vitest';
import type { Effect } from '../../schema';
import { findTextShadow, setTextShadow, type TextShadowEffect } from '../TextShadowControls';
import { effectsPanelList } from '../PropertiesPanel';

describe('findTextShadow', () => {
  it('tra ve undefined khi khong co', () => {
    expect(findTextShadow(undefined)).toBeUndefined();
    expect(findTextShadow([{ type: 'glow', color: '#fff', strength: 1, outer: true }])).toBeUndefined();
  });

  it('tim dung entry text-shadow giua cac effect khac', () => {
    const shadow: TextShadowEffect = { type: 'text-shadow', style: 'drop', color: '#000', angle: 0, distance: 0.1 };
    const effects: Effect[] = [{ type: 'glow', color: '#fff', strength: 1, outer: true }, shadow];
    expect(findTextShadow(effects)).toEqual(shadow);
  });
});

describe('setTextShadow — quy tac "apply 1"', () => {
  it('them moi vao mang rong', () => {
    const shadow: TextShadowEffect = { type: 'text-shadow', style: 'drop', color: '#000', angle: 0, distance: 0.1 };
    expect(setTextShadow(undefined, shadow)).toEqual([shadow]);
  });

  it('THAY THE entry text-shadow cu, khong push them ban thu 2', () => {
    const first: TextShadowEffect = { type: 'text-shadow', style: 'drop', color: '#000', angle: 0, distance: 0.1 };
    const second: TextShadowEffect = { type: 'text-shadow', style: 'block', color: '#111', angle: 1, distance: 0.2 };
    const result = setTextShadow([first], second);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(second);
  });

  it('khong dung toi cac effect khac (glow/outline/...) dang co san', () => {
    const glow: Effect = { type: 'glow', color: '#fff', strength: 1, outer: true };
    const shadow: TextShadowEffect = { type: 'text-shadow', style: 'drop', color: '#000', angle: 0, distance: 0.1 };
    const result = setTextShadow([glow], shadow);
    expect(result).toContainEqual(glow);
    expect(result).toContainEqual(shadow);
  });

  it('shadow=null: xoa text-shadow, giu nguyen effect khac', () => {
    const glow: Effect = { type: 'glow', color: '#fff', strength: 1, outer: true };
    const shadow: TextShadowEffect = { type: 'text-shadow', style: 'drop', color: '#000', angle: 0, distance: 0.1 };
    expect(setTextShadow([glow, shadow], null)).toEqual([glow]);
  });
});

describe('effectsPanelList — EffectsControls khong duoc render text-shadow', () => {
  it('loc bo text-shadow, giu nguyen cac effect khac', () => {
    const glow: Effect = { type: 'glow', color: '#fff', strength: 1, outer: true };
    const shadow: TextShadowEffect = { type: 'text-shadow', style: 'drop', color: '#000', angle: 0, distance: 0.1 };
    expect(effectsPanelList([glow, shadow])).toEqual([glow]);
  });

  it('undefined -> mang rong', () => {
    expect(effectsPanelList(undefined)).toEqual([]);
  });

  it('khong co text-shadow thi giu nguyen toan bo', () => {
    const glow: Effect = { type: 'glow', color: '#fff', strength: 1, outer: true };
    const outline: Effect = { type: 'outline', color: '#000', thickness: 1 };
    expect(effectsPanelList([glow, outline])).toEqual([glow, outline]);
  });
});
