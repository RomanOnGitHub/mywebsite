/**
 * Управление контекстным меню графа
 */

import type { GraphNode } from '@/types/graph';

/**
 * Показать контекстное меню
 */
export function showContextMenu(x: number, y: number, contextMenuNode: GraphNode | null): void {
  const menu = document.getElementById('context-menu');
  if (!menu || !contextMenuNode) return;

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.classList.remove('hidden');
}

/**
 * Скрыть контекстное меню
 */
export function hideContextMenu(): void {
  const menu = document.getElementById('context-menu');
  if (menu) {
    menu.classList.add('hidden');
  }
}

/**
 * Настроить обработчики контекстного меню
 */
export function setupContextMenuHandlers(
  contextMenuNode: GraphNode | null,
  setContextMenuNode: (node: GraphNode | null) => void,
  highlightConnections: (nodeId: string) => void,
  selectEdgesByDirection: (nodeId: string, direction: 'incoming' | 'outgoing' | 'connected') => void,
  lang: string,
  showNotification: (message: string, type: 'success' | 'warning' | 'error') => void,
  eventHandlers: { addEventListener: (element: HTMLElement | Document, event: string, handler: EventListener) => void }
): void {
  // Копировать данные узла
  const copyBtn = document.getElementById('context-copy-node');
  if (copyBtn) {
    eventHandlers.addEventListener(copyBtn, 'click', async () => {
      if (contextMenuNode) {
        try {
          await navigator.clipboard.writeText(JSON.stringify(contextMenuNode, null, 2));
          showNotification('Данные узла скопированы!', 'success');
        } catch (error) {
          showNotification('Ошибка копирования', 'error');
        }
      }
      hideContextMenu();
    });
  }

  // Открыть в новой вкладке
  const openBtn = document.getElementById('context-open-new');
  if (openBtn) {
    eventHandlers.addEventListener(openBtn, 'click', () => {
      if (contextMenuNode) {
        window.open(`/${lang}/${contextMenuNode.id}/`, '_blank');
      }
      hideContextMenu();
    });
  }

  // Выделить связи
  const highlightBtn = document.getElementById('context-highlight-connections');
  if (highlightBtn) {
    eventHandlers.addEventListener(highlightBtn, 'click', () => {
      if (contextMenuNode) {
        highlightConnections(contextMenuNode.id);
      }
      hideContextMenu();
    });
  }

  // Выделить входящие связи
  const incomingBtn = document.getElementById('context-select-incoming');
  if (incomingBtn) {
    eventHandlers.addEventListener(incomingBtn, 'click', () => {
      if (contextMenuNode) {
        selectEdgesByDirection(contextMenuNode.id, 'incoming');
      }
      hideContextMenu();
    });
  }

  // Выделить исходящие связи
  const outgoingBtn = document.getElementById('context-select-outgoing');
  if (outgoingBtn) {
    eventHandlers.addEventListener(outgoingBtn, 'click', () => {
      if (contextMenuNode) {
        selectEdgesByDirection(contextMenuNode.id, 'outgoing');
      }
      hideContextMenu();
    });
  }

  // Выделить все связи
  const allEdgesBtn = document.getElementById('context-select-all-edges');
  if (allEdgesBtn) {
    eventHandlers.addEventListener(allEdgesBtn, 'click', () => {
      if (contextMenuNode) {
        selectEdgesByDirection(contextMenuNode.id, 'connected');
      }
      hideContextMenu();
    });
  }

  // Закрыть при клике вне меню
  const clickHandler = (e: MouseEvent) => {
    const menu = document.getElementById('context-menu');
    if (menu && !menu.contains(e.target as Node)) {
      hideContextMenu();
    }
  };

  const contextMenuHandler = (e: MouseEvent) => {
    const menu = document.getElementById('context-menu');
    if (menu && !menu.contains(e.target as Node)) {
      hideContextMenu();
    }
  };

  eventHandlers.addEventListener(document, 'click', clickHandler);
  eventHandlers.addEventListener(document, 'contextmenu', contextMenuHandler);
}
