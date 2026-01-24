/**
 * Функции поиска узлов в графе знаний
 */

import type { GraphNode, GraphData } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';
import { GRAPH_CONSTANTS } from './graph-constants';
import { getDefaultNodeColor, calculateNodeSizes } from './graph-utils';

/**
 * Поиск узлов по тексту
 */
export function searchNodes(
  searchText: string,
  graph: ForceGraphInstance | null,
  allData: GraphData | null,
  options: {
    isFocusModeActive: () => boolean;
    setFocusNodes: (nodeIds: string[]) => void;
    showNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  }
): void {
  if (!allData || !graph) return;

  const query = searchText.toLowerCase().trim();
  if (!query) {
    clearSearch(graph, allData);
    return;
  }

  // Найти узлы, содержащие поисковый запрос
  const matchingNodes = allData.nodes.filter(
    (node) =>
      node.title.toLowerCase().includes(query) ||
      node.id.toLowerCase().includes(query) ||
      (node.tags && node.tags.some((tag) => tag.toLowerCase().includes(query)))
  );

  if (matchingNodes.length > 0) {
    // Центрировать на первом найденном узле
    const firstNode = matchingNodes[0];
    const graphData = graph.graphData();
    if (graphData && 'nodes' in graphData && Array.isArray(graphData.nodes)) {
      const nodeObj = (graphData.nodes as GraphNode[]).find(
        (n: GraphNode) => n.id === firstNode.id
      );

      if (
        nodeObj &&
        'x' in nodeObj &&
        'y' in nodeObj &&
        nodeObj.x !== undefined &&
        nodeObj.y !== undefined
      ) {
        graph.centerAt(nodeObj.x, nodeObj.y, 1000);
        graph.zoomToFit(GRAPH_CONSTANTS.ZOOM_FIT_DURATION_MS, 20);

        // Подсветить найденные узлы
        const foundNodeIds = matchingNodes.map((n) => n.id);
        highlightSearchResults(foundNodeIds, graph);

        // Если режим фокуса активен, установить найденные узлы в фокус
        if (options.isFocusModeActive()) {
          options.setFocusNodes(foundNodeIds);
        }
      }
    }
  } else {
    clearSearch(graph, allData);
    options.showNotification('Узлы не найдены', 'warning');
  }
}

/**
 * Подсветить результаты поиска
 */
export function highlightSearchResults(
  nodeIds: string[],
  graph: ForceGraphInstance | null
): void {
  if (!graph) return;

  // Увеличить размер найденных узлов через nodeVal
  const originalNodeVal = graph.nodeVal();
  graph.nodeVal((node: GraphNode) => {
    const baseSize =
      typeof originalNodeVal === 'function' ? originalNodeVal(node) : 10;
    return nodeIds.includes(node.id)
      ? baseSize * GRAPH_CONSTANTS.SEARCH_HIGHLIGHT_SIZE_MULTIPLIER
      : baseSize;
  });

  // Изменить цвет найденных узлов
  const originalNodeColor = graph.nodeColor();
  graph.nodeColor((node: GraphNode) => {
    if (nodeIds.includes(node.id)) {
      return GRAPH_CONSTANTS.NODE_COLOR_HIGHLIGHT; // Жёлтый для найденных узлов
    }
    // Использовать оригинальную функцию цвета
    if (typeof originalNodeColor === 'function') {
      return originalNodeColor(node);
    }
    // Вернуть обычные цвета
    return getDefaultNodeColor(node);
  });
}

/**
 * Очистить результаты поиска
 */
export function clearSearch(
  graph: ForceGraphInstance | null,
  allData: GraphData | null
): void {
  if (!graph || !allData) return;

  // Восстановить обычные размеры узлов
  const nodeSizes = calculateNodeSizes(allData.nodes, allData.edges);
  graph.nodeVal((n: GraphNode) => nodeSizes.get(n.id) || 10);

  // Восстановить обычные цвета
  graph.nodeColor((n: GraphNode) => getDefaultNodeColor(n));
}
