import { describe, expect, it } from 'vitest';
import { findNodeInTree, requireNodeInPage, deepCloneNode } from '../tree';
import type { Node, Page, ShapeNode } from '../../schema';

function shape(id: string): ShapeNode {
  return {
    id,
    type: 'shape',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    size: { width: 10, height: 10 },
    opacity: 1,
    visible: true,
    locked: false,
    shape: 'rect',
    fill: { type: 'solid', color: '#000000' },
  };
}

function makePage(): Page {
  const depth2 = shape('depth2');
  const depth1Group: Node = {
    id: 'group-1',
    type: 'group',
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    size: { width: 10, height: 10 },
    opacity: 1,
    visible: true,
    locked: false,
    children: [depth2],
  };
  return {
    id: 'page-1',
    name: 'Page 1',
    size: { width: 400, height: 400 },
    background: { type: 'color', value: '#ffffff' },
    children: [shape('depth0'), depth1Group],
  };
}

describe('findNodeInTree / requireNodeInPage', () => {
  it('finds a node at depth 0 (page.children directly)', () => {
    const page = makePage();
    const location = findNodeInTree(page.children, 'depth0');
    expect(location?.node.id).toBe('depth0');
    expect(location?.parent).toBe(page.children);
    expect(location?.ownerGroupId).toBeNull();
  });

  it('finds a node at depth 1 (inside a group)', () => {
    const page = makePage();
    const location = findNodeInTree(page.children, 'group-1');
    expect(location?.node.id).toBe('group-1');
    expect(location?.ownerGroupId).toBeNull();
  });

  it('finds a node at depth 2 (inside a group inside page)', () => {
    const page = makePage();
    const location = findNodeInTree(page.children, 'depth2');
    expect(location?.node.id).toBe('depth2');
    expect(location?.ownerGroupId).toBe('group-1');
    expect(location?.index).toBe(0);
  });

  it('returns undefined for a missing id', () => {
    const page = makePage();
    expect(findNodeInTree(page.children, 'nope')).toBeUndefined();
  });

  it('requireNodeInPage throws for a missing id', () => {
    const page = makePage();
    expect(() => requireNodeInPage(page, 'nope')).toThrow();
  });
});

describe('deepCloneNode', () => {
  it('assigns a new id to the top-level clone', () => {
    const original = shape('original');
    const clone = deepCloneNode(original);
    expect(clone.id).not.toBe(original.id);
  });

  it('assigns new ids to every nested descendant of a group, not just the top', () => {
    const page = makePage();
    const group = page.children[1];
    const clone = deepCloneNode(group);
    expect(clone.type).toBe('group');
    if (clone.type !== 'group') throw new Error('expected group');
    expect(clone.id).not.toBe(group.id);
    expect(clone.children[0].id).not.toBe('depth2');
  });
});
