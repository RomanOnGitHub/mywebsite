import type { GraphNode } from '@/types/graph';

type Notifications = (message: string, type?: 'success' | 'warning' | 'error') => void;

type EventHandlersLike = {
  addEventListener: (
    element: Document | HTMLElement,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => void;
};

export function setupContextMenuHandlers(
  eventHandlers: EventHandlersLike,
  params: {
    getContextMenuNode: () => GraphNode | null;
    hideContextMenu: () => void;
    highlightConnections: (nodeId: string) => void;
    selectEdgesByDirection: (nodeId: string, direction: 'incoming' | 'outgoing' | 'connected') => void;
    lang: string;
    showNotification: Notifications;
  }
): void {
  const {
    getContextMenuNode,
    hideContextMenu,
    highlightConnections,
    selectEdgesByDirection,
    lang,
    showNotification,
  } = params;
  
  const copyNodeBtn = document.getElementById('context-copy-node');
  if (copyNodeBtn) {
    eventHandlers.addEventListener(copyNodeBtn, 'click', async () => {
      const node = getContextMenuNode();
      if (node) {
        try {
          await navigator.clipboard.writeText(JSON.stringify(node, null, 2));
          showNotification('Данные узла скопированы!', 'success');
        } catch {
          showNotification('Ошибка копирования', 'error');
        }
      }
      hideContextMenu();
    });
  }
  
  const openNewBtn = document.getElementById('context-open-new');
  if (openNewBtn) {
    eventHandlers.addEventListener(openNewBtn, 'click', () => {
      const node = getContextMenuNode();
      if (node) {
        window.open(`/${lang}/${node.id}/`, '_blank');
      }
      hideContextMenu();
    });
  }
  
  const highlightConnectionsBtn = document.getElementById('context-highlight-connections');
  if (highlightConnectionsBtn) {
    eventHandlers.addEventListener(highlightConnectionsBtn, 'click', () => {
      const node = getContextMenuNode();
      if (node) {
        highlightConnections(node.id);
      }
      hideContextMenu();
    });
  }
  
  const selectIncomingBtn = document.getElementById('context-select-incoming');
  if (selectIncomingBtn) {
    eventHandlers.addEventListener(selectIncomingBtn, 'click', () => {
      const node = getContextMenuNode();
      if (node) {
        selectEdgesByDirection(node.id, 'incoming');
      }
      hideContextMenu();
    });
  }
  
  const selectOutgoingBtn = document.getElementById('context-select-outgoing');
  if (selectOutgoingBtn) {
    eventHandlers.addEventListener(selectOutgoingBtn, 'click', () => {
      const node = getContextMenuNode();
      if (node) {
        selectEdgesByDirection(node.id, 'outgoing');
      }
      hideContextMenu();
    });
  }
  
  const selectAllEdgesBtn = document.getElementById('context-select-all-edges');
  if (selectAllEdgesBtn) {
    eventHandlers.addEventListener(selectAllEdgesBtn, 'click', () => {
      const node = getContextMenuNode();
      if (node) {
        selectEdgesByDirection(node.id, 'connected');
      }
      hideContextMenu();
    });
  }
  
  eventHandlers.addEventListener(document, 'click', (e) => {
    const menu = document.getElementById('context-menu');
    if (menu && !menu.contains(e.target as Node)) {
      hideContextMenu();
    }
  });
  
  eventHandlers.addEventListener(document, 'contextmenu', (e) => {
    const menu = document.getElementById('context-menu');
    if (menu && !menu.contains(e.target as Node)) {
      hideContextMenu();
    }
  });
}
