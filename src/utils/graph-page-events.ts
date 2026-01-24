import type { GraphNode, GraphData } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';
import { setupExportHandlers } from '@/utils/graph-page-export';
import { setupContextMenuHandlers } from '@/utils/graph-page-context-menu';
import { setupSearchHandlers } from '@/utils/graph-page-search';
import { setupFilterEventHandlers } from '@/utils/graph-page-filters';
import { setupKeyboardShortcuts } from '@/utils/graph-page-shortcuts';

type EventHandlersLike = {
  addEventListener: (
    element: Document | HTMLElement,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => void;
};

type GetGraph = () => ForceGraphInstance | null;
type GetData = () => GraphData | null;

type Notifications = (message: string, type?: 'success' | 'warning' | 'error') => void;

type GraphPageEventParams = {
  eventHandlers: EventHandlersLike;
  getGraph: GetGraph;
  getAllData: GetData;
  lang: string;
  applyFilters: () => void;
  resetFilters: () => void;
  showNotification: Notifications;
  isFocusModeActive: () => boolean;
  setFocusNodes: (nodeIds: string[]) => void;
  toggleFocusMode: () => void;
  showExportModal: () => void;
  highlightConnections: (nodeId: string) => void;
  selectEdgesByDirection: (nodeId: string, direction: 'incoming' | 'outgoing' | 'connected') => void;
  getContextMenuNode: () => GraphNode | null;
  hideContextMenu: () => void;
};

export function registerGraphPageEvents(params: GraphPageEventParams): () => void {
  const {
    eventHandlers,
    getGraph,
    getAllData,
    lang,
    applyFilters,
    resetFilters,
    showNotification,
    isFocusModeActive,
    setFocusNodes,
    toggleFocusMode,
    showExportModal,
    highlightConnections,
    selectEdgesByDirection,
    getContextMenuNode,
    hideContextMenu,
  } = params;
  
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  
  setupFilterEventHandlers(eventHandlers, applyFilters, resetFilters);
  setupSearchHandlers({
    eventHandlers,
    getGraph,
    getAllData,
    isFocusModeActive,
    setFocusNodes,
    showNotification,
    searchTimeoutRef: () => searchTimeout,
    setSearchTimeout: (timer) => {
      searchTimeout = timer;
    },
  });
  setupFocusModeHandler(eventHandlers, toggleFocusMode);
  setupExportHandlers(eventHandlers, getGraph, getAllData, lang, showExportModal, showNotification);
  setupContextMenuHandlers(eventHandlers, {
    getContextMenuNode,
    hideContextMenu,
    highlightConnections,
    selectEdgesByDirection,
    lang,
    showNotification,
  });
  setupKeyboardShortcuts(eventHandlers, {
    getGraph,
    getAllData,
    resetFilters,
  });
  
  return () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
  };
}

function setupFocusModeHandler(
  eventHandlers: EventHandlersLike,
  toggleFocusMode: () => void
): void {
  const focusModeBtn = document.getElementById('focus-mode');
  if (!focusModeBtn) return;
  eventHandlers.addEventListener(focusModeBtn, 'click', toggleFocusMode);
}
