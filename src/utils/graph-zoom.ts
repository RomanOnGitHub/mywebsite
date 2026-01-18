/**
 * Управление zoom и навигацией графа
 */

import type { ForceGraphInstance } from '@/types/force-graph';
import { GRAPH_CONSTANTS } from './graph-constants';

/**
 * Настроить zoom контролы
 */
export function setupZoomControls(
  graph: ForceGraphInstance | null,
  eventHandlers: { addEventListener: (element: HTMLElement | Document, event: string, handler: EventListener) => void }
): void {
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomFitBtn = document.getElementById('zoom-fit');
  const zoomResetBtn = document.getElementById('zoom-reset');

  if (!zoomInBtn || !zoomOutBtn || !zoomFitBtn || !zoomResetBtn) return;

  const zoomIn = () => {
    if (graph) {
      const currentZoom = graph.zoom() || 1;
      graph.zoom(currentZoom * GRAPH_CONSTANTS.KEYBOARD_ZOOM_FACTOR);
    }
  };

  const zoomOut = () => {
    if (graph) {
      const currentZoom = graph.zoom() || 1;
      graph.zoom(currentZoom / GRAPH_CONSTANTS.KEYBOARD_ZOOM_FACTOR);
    }
  };

  const zoomFit = () => {
    if (graph) {
      graph.zoomToFit(GRAPH_CONSTANTS.ZOOM_FIT_DURATION_MS);
    }
  };

  const zoomReset = () => {
    if (graph) {
      graph.zoom(1);
      graph.centerAt(0, 0);
    }
  };

  eventHandlers.addEventListener(zoomInBtn, 'click', zoomIn);
  eventHandlers.addEventListener(zoomOutBtn, 'click', zoomOut);
  eventHandlers.addEventListener(zoomFitBtn, 'click', zoomFit);
  eventHandlers.addEventListener(zoomResetBtn, 'click', zoomReset);
}

/**
 * Обработка клавиатурных сокращений для zoom
 */
export function handleKeyboardZoom(
  e: KeyboardEvent,
  graph: ForceGraphInstance | null
): boolean {
  // Игнорировать, если пользователь вводит текст
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    return false;
  }

  if (!graph) return false;

  // + или = - zoom in
  if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    const currentZoom = graph.zoom() || 1;
    graph.zoom(currentZoom * GRAPH_CONSTANTS.KEYBOARD_ZOOM_FACTOR);
    return true;
  }

  // - - zoom out
  if (e.key === '-') {
    e.preventDefault();
    const currentZoom = graph.zoom() || 1;
    graph.zoom(currentZoom / GRAPH_CONSTANTS.KEYBOARD_ZOOM_FACTOR);
    return true;
  }

  // 0 - reset zoom
  if (e.key === '0') {
    e.preventDefault();
    graph.zoom(1);
    graph.zoomToFit(GRAPH_CONSTANTS.ZOOM_FIT_DURATION_MS);
    return true;
  }

  return false;
}
