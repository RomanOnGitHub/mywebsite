/**
 * Unit тесты для graph-state.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphStateManager, getGraphState, resetGraphState } from './graph-state';
import type { GraphNode, GraphData } from '@/types/graph';

describe('graph-state', () => {
  let manager: GraphStateManager;

  beforeEach(() => {
    manager = new GraphStateManager();
  });

  describe('GraphStateManager', () => {
    it('должен инициализироваться с null значениями', () => {
      expect(manager.getGraph()).toBeNull();
      expect(manager.getData()).toBeNull();
      expect(manager.getHighlightedNodeId()).toBeNull();
      expect(manager.getContextMenuNode()).toBeNull();
      expect(manager.isFocusModeActive()).toBe(false);
      expect(manager.getFocusModeNodes().size).toBe(0);
    });

    it('должен устанавливать и получать данные', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', title: 'Node 1', type: 'blog', lang: 'ru', slug: 'node1' },
        ],
        edges: [],
      };

      manager.setData(data);
      expect(manager.getData()).toBe(data);
    });

    it('должен управлять режимом фокуса', () => {
      manager.setFocusModeActive(true);
      expect(manager.isFocusModeActive()).toBe(true);

      manager.setFocusModeActive(false);
      expect(manager.isFocusModeActive()).toBe(false);
    });

    it('должен управлять узлами в режиме фокуса', () => {
      const nodeIds = ['node1', 'node2', 'node3'];
      manager.setFocusNodes(nodeIds);

      const focusNodes = manager.getFocusModeNodes();
      expect(focusNodes.size).toBe(3);
      expect(focusNodes.has('node1')).toBe(true);
      expect(focusNodes.has('node2')).toBe(true);
      expect(focusNodes.has('node3')).toBe(true);
    });

    it('должен очищать состояние при destroy', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', title: 'Node 1', type: 'blog', lang: 'ru', slug: 'node1' },
        ],
        edges: [],
      };

      manager.setData(data);
      manager.setHighlightedNodeId('node1');
      manager.setFocusModeActive(true);
      manager.setFocusNodes(['node1']);

      manager.destroy();

      expect(manager.getData()).toBeNull();
      expect(manager.getHighlightedNodeId()).toBeNull();
      expect(manager.isFocusModeActive()).toBe(false);
      expect(manager.getFocusModeNodes().size).toBe(0);
    });
  });

  describe('getGraphState', () => {
    it('должен возвращать singleton экземпляр', () => {
      const state1 = getGraphState();
      const state2 = getGraphState();

      expect(state1).toBe(state2);
    });
  });

  describe('resetGraphState', () => {
    it('должен сбрасывать состояние singleton', () => {
      const state = getGraphState();
      const data: GraphData = {
        nodes: [
          { id: 'node1', title: 'Node 1', type: 'blog', lang: 'ru', slug: 'node1' },
        ],
        edges: [],
      };

      state.setData(data);
      state.setHighlightedNodeId('node1');

      resetGraphState();

      expect(state.getData()).toBeNull();
      expect(state.getHighlightedNodeId()).toBeNull();
    });
  });
});
