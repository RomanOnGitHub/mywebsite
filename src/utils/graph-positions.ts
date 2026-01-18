/**
 * Управление позициями узлов графа
 * Сохранение и восстановление позиций из localStorage
 */

import type { GraphNode } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';
import { GRAPH_CONSTANTS } from './graph-constants';

/**
 * Сохранить позиции узлов в localStorage
 */
export function saveNodePositions(
  graph: ForceGraphInstance,
  lang: string
): void {
  try {
    const graphData = graph.graphData();
    if (graphData && 'nodes' in graphData) {
      const positions: Record<string, { x: number; y: number }> = {};
      (graphData.nodes as GraphNode[]).forEach((node) => {
        if (
          node.x !== undefined &&
          node.y !== undefined &&
          !isNaN(node.x) &&
          !isNaN(node.y)
        ) {
          positions[node.id] = { x: node.x, y: node.y };
        }
      });
      localStorage.setItem(
        GRAPH_CONSTANTS.STORAGE_KEY_POSITIONS(lang),
        JSON.stringify(positions)
      );
    }
  } catch (e) {
    // Игнорировать ошибки localStorage (например, если переполнен)
    if (import.meta.env.DEV) {
      console.warn('Failed to save node positions:', e);
    }
  }
}

/**
 * Восстановить позиции узлов из localStorage
 */
export function restoreNodePositions(
  width: number,
  height: number,
  lang: string
): Record<string, { x: number; y: number }> | null {
  try {
    const saved = localStorage.getItem(
      GRAPH_CONSTANTS.STORAGE_KEY_POSITIONS(lang)
    );
    if (saved) {
      const positions = JSON.parse(saved);
      // Валидировать позиции - проверять, что они в разумных пределах
      const maxX = width * GRAPH_CONSTANTS.POSITION_VALIDATION_MULTIPLIER;
      const maxY = height * GRAPH_CONSTANTS.POSITION_VALIDATION_MULTIPLIER;
      const minX = -maxX;
      const minY = -maxY;

      const validPositions: Record<string, { x: number; y: number }> = {};
      let hasValidPositions = false;

      for (const [nodeId, pos] of Object.entries(positions)) {
        if (pos && typeof pos === 'object' && 'x' in pos && 'y' in pos) {
          const x = pos.x as number;
          const y = pos.y as number;
          // Проверяем, что позиция в разумных пределах
          if (
            !isNaN(x) &&
            !isNaN(y) &&
            x >= minX &&
            x <= maxX &&
            y >= minY &&
            y <= maxY
          ) {
            validPositions[nodeId] = { x, y };
            hasValidPositions = true;
          }
        }
      }

      // Возвращаем только если есть хотя бы одна валидная позиция
      return hasValidPositions ? validPositions : null;
    }
  } catch (e) {
    // Игнорировать ошибки парсинга
    if (import.meta.env.DEV) {
      console.warn('Failed to restore node positions:', e);
    }
  }
  return null;
}

/**
 * Валидировать позиции узлов
 */
export function validateNodePositions(
  positions: Record<string, { x: number; y: number }>,
  width: number,
  height: number
): Record<string, { x: number; y: number }> {
  const maxX = width * GRAPH_CONSTANTS.POSITION_VALIDATION_MULTIPLIER;
  const maxY = height * GRAPH_CONSTANTS.POSITION_VALIDATION_MULTIPLIER;
  const minX = -maxX;
  const minY = -maxY;

  const validPositions: Record<string, { x: number; y: number }> = {};

  for (const [nodeId, pos] of Object.entries(positions)) {
    if (pos && typeof pos === 'object' && 'x' in pos && 'y' in pos) {
      const x = pos.x as number;
      const y = pos.y as number;
      if (
        !isNaN(x) &&
        !isNaN(y) &&
        x >= minX &&
        x <= maxX &&
        y >= minY &&
        y <= maxY
      ) {
        validPositions[nodeId] = { x, y };
      }
    }
  }

  return validPositions;
}

/**
 * Инициализировать позиции узлов (центрирование по кругу)
 */
export function initializeNodePositions(
  nodes: GraphNode[],
  centerX: number,
  centerY: number,
  width: number,
  height: number
): void {
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2;
    const radius =
      Math.min(width, height) * GRAPH_CONSTANTS.NODE_POSITION_RADIUS_FACTOR;
    node.x = centerX + Math.cos(angle) * radius;
    node.y = centerY + Math.sin(angle) * radius;
    node.vx = 0;
    node.vy = 0;
  });
}

/**
 * Настроить автоматическое сохранение позиций
 */
export function setupPositionSaving(
  graph: ForceGraphInstance,
  lang: string
): () => void {
  let savePositionsTimer: ReturnType<typeof setTimeout> | null = null;

  const checkAndSave = () => {
    const currentData = graph.graphData();
    if (currentData && 'nodes' in currentData) {
      const nodes = currentData.nodes as GraphNode[];
      const hasValidPositions = nodes.some(
        (n) => n.x !== undefined && n.y !== undefined && !isNaN(n.x) && !isNaN(n.y)
      );
      if (hasValidPositions) {
        if (savePositionsTimer) clearTimeout(savePositionsTimer);
        savePositionsTimer = setTimeout(() => {
          saveNodePositions(graph, lang);
        }, GRAPH_CONSTANTS.SAVE_POSITIONS_DELAY_MS);
      }
    }
  };

  // Сохранять позиции при остановке симуляции
  const saveInterval = setInterval(() => {
    const currentData = graph.graphData();
    if (currentData && 'nodes' in currentData) {
      const nodes = currentData.nodes as GraphNode[];
      const hasValidPositions = nodes.some(
        (n) => n.x !== undefined && n.y !== undefined
      );
      if (hasValidPositions) {
        checkAndSave();
      }
    }
  }, GRAPH_CONSTANTS.SAVE_POSITIONS_CHECK_INTERVAL_MS);

  // Очистить интервал при уничтожении графа
  const originalDestructor = graph._destructor;
  graph._destructor = function () {
    clearInterval(saveInterval);
    if (savePositionsTimer) clearTimeout(savePositionsTimer);
    return originalDestructor.call(this);
  };

  // Возвращаем функцию очистки
  return () => {
    clearInterval(saveInterval);
    if (savePositionsTimer) clearTimeout(savePositionsTimer);
  };
}
