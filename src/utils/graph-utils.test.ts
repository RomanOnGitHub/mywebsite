/**
 * Unit тесты для graph-utils.ts
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNodeSizes,
  getDefaultNodeColor,
  addOpacityToColor,
  getContainerDimensions,
} from './graph-utils';
import type { GraphNode, GraphEdge } from '@/types/graph';
import { GRAPH_CONSTANTS } from './graph-constants';

describe('graph-utils', () => {
  describe('calculateNodeSizes', () => {
    it('должен вычислять размеры узлов на основе количества связей', () => {
      const nodes: GraphNode[] = [
        { id: 'node1', title: 'Node 1', type: 'blog', lang: 'ru', slug: 'node1' },
        { id: 'node2', title: 'Node 2', type: 'cases', lang: 'ru', slug: 'node2' },
        { id: 'node3', title: 'Node 3', type: 'services', lang: 'ru', slug: 'node3' },
      ];
      const edges: GraphEdge[] = [
        { from: 'node1', to: 'node2', source: 'explicit' },
        { from: 'node1', to: 'node3', source: 'explicit' },
        { from: 'node2', to: 'node3', source: 'explicit' },
      ];

      const sizes = calculateNodeSizes(nodes, edges);

      expect(sizes.get('node1')).toBe(4); // 2 связи * 2 = 4
      expect(sizes.get('node2')).toBe(4); // 2 связи * 2 = 4
      expect(sizes.get('node3')).toBe(4); // 2 связи * 2 = 4
    });

    it('должен ограничивать размеры узлов минимальным и максимальным значениями', () => {
      const nodes: GraphNode[] = [
        { id: 'node1', title: 'Node 1', type: 'blog', lang: 'ru', slug: 'node1' },
        { id: 'node2', title: 'Node 2', type: 'cases', lang: 'ru', slug: 'node2' },
      ];
      const edges: GraphEdge[] = []; // Нет связей

      const sizes = calculateNodeSizes(nodes, edges);

      expect(sizes.get('node1')).toBe(GRAPH_CONSTANTS.NODE_SIZE_MIN);
      expect(sizes.get('node2')).toBe(GRAPH_CONSTANTS.NODE_SIZE_MIN);
    });
  });

  describe('getDefaultNodeColor', () => {
    it('должен возвращать правильный цвет для каждого типа узла', () => {
      const blogNode: GraphNode = {
        id: 'blog1',
        title: 'Blog',
        type: 'blog',
        lang: 'ru',
        slug: 'blog1',
      };
      const casesNode: GraphNode = {
        id: 'case1',
        title: 'Case',
        type: 'cases',
        lang: 'ru',
        slug: 'case1',
      };

      expect(getDefaultNodeColor(blogNode)).toBe(GRAPH_CONSTANTS.NODE_COLORS.blog);
      expect(getDefaultNodeColor(casesNode)).toBe(GRAPH_CONSTANTS.NODE_COLORS.cases);
    });

    it('должен возвращать цвет по умолчанию для неизвестного типа', () => {
      const unknownNode: GraphNode = {
        id: 'unknown',
        title: 'Unknown',
        type: 'unknown' as any,
        lang: 'ru',
        slug: 'unknown',
      };

      expect(getDefaultNodeColor(unknownNode)).toBe(GRAPH_CONSTANTS.NODE_COLORS.default);
    });
  });

  describe('addOpacityToColor', () => {
    it('должен добавлять прозрачность к hex цвету', () => {
      const color = '#3b82f6';
      const result = addOpacityToColor(color, 0.5);

      expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/);
    });

    it('должен заменять прозрачность в rgba цвете', () => {
      const color = 'rgba(59, 130, 246, 0.8)';
      const result = addOpacityToColor(color, 0.5);

      expect(result).toBe('rgba(59, 130, 246, 0.5)');
    });

    it('должен добавлять alpha к rgb цвету', () => {
      const color = 'rgb(59, 130, 246)';
      const result = addOpacityToColor(color, 0.5);

      expect(result).toBe('rgba(59, 130, 246, 0.5)');
    });
  });

  describe('getContainerDimensions', () => {
    it('должен возвращать правильные размеры контейнера', () => {
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';

      const dimensions = getContainerDimensions(container);

      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
      expect(dimensions.centerX).toBe(400);
      expect(dimensions.centerY).toBe(300);
    });

    it('должен использовать значения по умолчанию, если размеры не заданы', () => {
      const container = document.createElement('div');

      const dimensions = getContainerDimensions(container);

      expect(dimensions.width).toBeGreaterThanOrEqual(GRAPH_CONSTANTS.DEFAULT_WIDTH);
      expect(dimensions.height).toBeGreaterThanOrEqual(GRAPH_CONSTANTS.DEFAULT_HEIGHT);
    });
  });
});
