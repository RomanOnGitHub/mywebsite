/**
 * Фильтрация и поиск узлов графа
 */

import type { GraphData, GraphNode, GraphEdge } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';
import type { GraphNode } from '@/types/graph';
import { GRAPH_CONSTANTS } from './graph-constants';
import { calculateNodeSizes, getDefaultNodeColor } from './graph-utils';

/**
 * Применить фильтры к графу
 */
export function applyFilters(
  allData: GraphData,
  renderGraph: (data: GraphData, autoFit: boolean, useSavedPositions: boolean) => void,
  showNotification: (message: string, type: 'success' | 'warning' | 'error') => void
): void {
  const typeSelect = document.getElementById('filter-type') as HTMLSelectElement;
  const tagSelect = document.getElementById('filter-tags') as HTMLSelectElement;
  const linkTypeSelect = document.getElementById('filter-link-type') as HTMLSelectElement;

  if (!typeSelect || !tagSelect || !linkTypeSelect) return;

  // Получаем множественные значения, исключая пустые строки
  const selectedTypes = Array.from(typeSelect.selectedOptions)
    .map((opt) => opt.value)
    .filter((v) => v !== '');
  const selectedTags = Array.from(tagSelect.selectedOptions)
    .map((opt) => opt.value)
    .filter((v) => v !== '');
  const selectedLinkTypes = Array.from(linkTypeSelect.selectedOptions)
    .map((opt) => opt.value)
    .filter((v) => v !== '');

  // Фильтрация узлов
  const filteredNodes = allData.nodes.filter((n) => {
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(n.type);
    const tagMatch =
      selectedTags.length === 0 ||
      (n.tags && n.tags.some((tag) => selectedTags.includes(tag)));
    return typeMatch && tagMatch;
  });

  const nodeIds = new Set(filteredNodes.map((n) => n.id));

  // Фильтрация рёбер
  let filteredEdges = allData.edges.filter(
    (e) => nodeIds.has(e.from) && nodeIds.has(e.to)
  );

  // Фильтрация по типу связи
  if (selectedLinkTypes.length > 0) {
    filteredEdges = filteredEdges.filter((e) =>
      selectedLinkTypes.includes(e.source)
    );
  }

  // Показать уведомление с количеством отфильтрованных узлов
  const totalNodes = allData.nodes.length;
  const filteredCount = filteredNodes.length;
  if (filteredCount < totalNodes) {
    showNotification(`Показано ${filteredCount} из ${totalNodes} узлов`, 'success');
  }

  // При фильтрации всегда центрировать заново, не использовать сохранённые позиции
  renderGraph({ nodes: filteredNodes, edges: filteredEdges }, true, false);
}

/**
 * Сбросить фильтры
 */
export function resetFilters(
  allData: GraphData | null,
  renderGraph: (data: GraphData, autoFit: boolean, useSavedPositions: boolean) => void
): void {
  const typeSelect = document.getElementById('filter-type') as HTMLSelectElement;
  const tagSelect = document.getElementById('filter-tags') as HTMLSelectElement;
  const linkTypeSelect = document.getElementById('filter-link-type') as HTMLSelectElement;

  if (!typeSelect || !tagSelect || !linkTypeSelect) return;

  // Сбросить множественный выбор
  Array.from(typeSelect.options).forEach((opt) => (opt.selected = false));
  Array.from(tagSelect.options).forEach((opt) => (opt.selected = false));
  Array.from(linkTypeSelect.options).forEach((opt) => (opt.selected = false));

  if (allData) {
    // При сбросе фильтров НЕ использовать сохранённые позиции
    renderGraph(allData, true, false);
  }
}

/**
 * Поиск узлов
 */
export function searchNodes(
  searchText: string,
  allData: GraphData | null,
  graph: ForceGraphInstance | null,
  highlightSearchResults: (nodeIds: string[]) => void,
  clearSearch: () => void,
  showNotification: (message: string, type: 'success' | 'warning' | 'error') => void,
  setFocusNodes?: (nodeIds: string[]) => void,
  focusModeActive?: boolean
): void {
  if (!allData || !graph) return;

  try {
    const query = searchText.toLowerCase().trim();
    if (!query) {
      clearSearch();
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
          highlightSearchResults(foundNodeIds);

          // Если режим фокуса активен, установить найденные узлы в фокус
          if (focusModeActive && setFocusNodes) {
            setFocusNodes(foundNodeIds);
          }
        }
      }
    } else {
      clearSearch();
      showNotification('Узлы не найдены', 'warning');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Search error:', error);
    }
    showNotification('Ошибка поиска', 'error');
  }
}

/**
 * Подсветить результаты поиска
 */
export function highlightSearchResults(
  nodeIds: string[],
  graph: ForceGraphInstance,
  allData: GraphData
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
