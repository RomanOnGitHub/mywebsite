/**
 * Утилиты для работы с графом знаний
 */

import type { GraphNode, GraphEdge } from '@/types/graph';
import { GRAPH_CONSTANTS } from './graph-constants';

/**
 * Вычислить размеры узлов на основе количества связей
 */
export function calculateNodeSizes(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, number> {
  const nodeSizes = new Map<string, number>();
  nodes.forEach((node) => {
    const connections = edges.filter(
      (e) => e.from === node.id || e.to === node.id
    ).length;
    const size = Math.max(
      GRAPH_CONSTANTS.NODE_SIZE_MIN,
      Math.min(
        GRAPH_CONSTANTS.NODE_SIZE_MAX,
        connections * GRAPH_CONSTANTS.NODE_SIZE_CONNECTION_FACTOR
      )
    );
    nodeSizes.set(node.id, size);
  });
  return nodeSizes;
}

/**
 * Получить цвет узла по умолчанию
 */
export function getDefaultNodeColor(node: GraphNode): string {
  return GRAPH_CONSTANTS.NODE_COLORS[node.type] || GRAPH_CONSTANTS.NODE_COLORS.default;
}

/**
 * Добавить прозрачность к цвету
 */
export function addOpacityToColor(color: string, opacity: number): string {
  // Если цвет уже в формате rgba, заменить opacity
  if (color.startsWith('rgba(')) {
    return color.replace(/[\d.]+\)$/, `${opacity})`);
  }
  // Если цвет в формате hex, преобразовать в rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // Если цвет в формате rgb, добавить alpha
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  // Fallback: вернуть цвет как есть
  return color;
}

/**
 * Получить размеры контейнера графа
 */
export function getContainerDimensions(container: HTMLElement): {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  const width =
    container.offsetWidth ||
    container.clientWidth ||
    GRAPH_CONSTANTS.DEFAULT_WIDTH;
  const height =
    container.offsetHeight ||
    container.clientHeight ||
    GRAPH_CONSTANTS.DEFAULT_HEIGHT;
  const centerX = width / 2;
  const centerY = height / 2;

  return { width, height, centerX, centerY };
}
