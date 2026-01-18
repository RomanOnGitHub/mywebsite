/**
 * Подсветка узлов и рёбер графа
 */

import type { GraphNode, GraphData } from '@/types/graph';
import type { ForceGraphInstance, ForceGraphLink } from '@/types/force-graph';
import { GRAPH_CONSTANTS } from './graph-constants';
import { getDefaultNodeColor, addOpacityToColor } from './graph-utils';

/**
 * Подсветить связанные узлы
 */
export function highlightConnections(
  nodeId: string,
  graph: ForceGraphInstance,
  allData: GraphData,
  highlightedNodeId: string | null,
  setHighlightedNodeId: (id: string | null) => void
): void {
  if (!graph || !allData || highlightedNodeId === nodeId) return;

  setHighlightedNodeId(nodeId);
  const connectedNodeIds = new Set<string>([nodeId]);

  // Найти все связанные узлы
  allData.edges.forEach((edge) => {
    if (edge.from === nodeId) connectedNodeIds.add(edge.to);
    if (edge.to === nodeId) connectedNodeIds.add(edge.from);
  });

  // Сохранить оригинальные цвета
  const originalNodeColor = graph.nodeColor();
  const originalLinkColor = graph.linkColor();

  // Изменить цвет несвязанных узлов (затемнить)
  graph.nodeColor((node: GraphNode) => {
    const baseColor =
      typeof originalNodeColor === 'function'
        ? originalNodeColor(node)
        : getDefaultNodeColor(node);
    if (connectedNodeIds.has(node.id)) {
      return baseColor; // Оставить ярким
    }
    // Затемнить несвязанные узлы (добавить прозрачность через rgba)
    return addOpacityToColor(baseColor, GRAPH_CONSTANTS.NODE_OPACITY_DIM);
  });

  // Изменить цвет рёбер
  graph.linkColor((link: ForceGraphLink) => {
    const sourceId =
      typeof link.source === 'string' ? link.source : link.source?.id;
    const targetId =
      typeof link.target === 'string' ? link.target : link.target?.id;
    const isConnected = sourceId === nodeId || targetId === nodeId;

    if (isConnected) {
      const baseColor =
        typeof originalLinkColor === 'function'
          ? originalLinkColor(link)
          : GRAPH_CONSTANTS.LINK_COLORS.explicit;
      return baseColor.replace('0.8', '1'); // Убрать прозрачность для связанных
    }
    // Затемнить несвязанные рёбра
    return 'rgba(148, 163, 184, 0.2)';
  });
}

/**
 * Очистить подсветку
 */
export function clearHighlight(
  graph: ForceGraphInstance | null,
  highlightedNodeId: string | null,
  setHighlightedNodeId: (id: string | null) => void,
  focusModeActive: boolean,
  focusModeNodes: Set<string>,
  applyFocusMode: () => void
): void {
  if (!graph || highlightedNodeId === null) return;

  setHighlightedNodeId(null);

  // Восстановить обычные цвета узлов
  if (focusModeActive && focusModeNodes.size > 0) {
    // Если режим фокуса активен, применить его
    applyFocusMode();
  } else {
    graph.nodeColor((n: GraphNode) => getDefaultNodeColor(n));
  }

  // Восстановить обычные цвета рёбер
  graph.linkColor((link: ForceGraphLink) => {
    if (link.sourceType === 'explicit') {
      return GRAPH_CONSTANTS.LINK_COLORS.explicit;
    } else {
      return GRAPH_CONSTANTS.LINK_COLORS.outbound;
    }
  });
}

/**
 * Применить режим фокуса
 */
export function applyFocusMode(
  graph: ForceGraphInstance,
  allData: GraphData,
  focusModeNodes: Set<string>
): void {
  if (!graph || !allData || focusModeNodes.size === 0) return;

  const originalNodeColor = graph.nodeColor();
  graph.nodeColor((node: GraphNode) => {
    const baseColor =
      typeof originalNodeColor === 'function'
        ? originalNodeColor(node)
        : getDefaultNodeColor(node);
    if (focusModeNodes.has(node.id)) {
      return baseColor; // Оставить ярким
    }
    // Затемнить узлы не в фокусе
    return addOpacityToColor(baseColor, GRAPH_CONSTANTS.NODE_OPACITY_FOCUS);
  });
}

/**
 * Выделить рёбра по направлению
 */
export function selectEdgesByDirection(
  nodeId: string,
  direction: 'incoming' | 'outgoing' | 'connected',
  graph: ForceGraphInstance,
  allData: GraphData,
  showNotification: (message: string, type: 'success' | 'warning' | 'error') => void
): void {
  if (!graph || !allData) return;

  const edgesToHighlight = allData.edges.filter((edge) => {
    if (direction === 'incoming') {
      return edge.to === nodeId;
    } else if (direction === 'outgoing') {
      return edge.from === nodeId;
    } else {
      // connected - все связи узла
      return edge.from === nodeId || edge.to === nodeId;
    }
  });

  const connectedNodeIds = new Set<string>([nodeId]);
  edgesToHighlight.forEach((edge) => {
    connectedNodeIds.add(edge.from);
    connectedNodeIds.add(edge.to);
  });

  // Подсветить связанные узлы
  const originalNodeColor = graph.nodeColor();
  graph.nodeColor((node: GraphNode) => {
    const baseColor =
      typeof originalNodeColor === 'function'
        ? originalNodeColor(node)
        : getDefaultNodeColor(node);
    if (connectedNodeIds.has(node.id)) {
      return baseColor;
    }
    return addOpacityToColor(baseColor, 0.2);
  });

  // Подсветить выбранные рёбра
  const originalLinkColor = graph.linkColor();
  graph.linkColor((link: ForceGraphLink) => {
    const sourceId =
      typeof link.source === 'string' ? link.source : link.source?.id;
    const targetId =
      typeof link.target === 'string' ? link.target : link.target?.id;
    const isSelected = edgesToHighlight.some(
      (e) =>
        (e.from === sourceId && e.to === targetId) ||
        (e.from === targetId && e.to === sourceId)
    );

    if (isSelected) {
      return GRAPH_CONSTANTS.NODE_COLOR_HIGHLIGHT; // Яркий жёлтый для выбранных рёбер
    }
    return typeof originalLinkColor === 'function'
      ? originalLinkColor(link)
      : 'rgba(148, 163, 184, 0.2)';
  });

  showNotification(`Выделено ${edgesToHighlight.length} связей`, 'success');
}
