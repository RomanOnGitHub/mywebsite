import type { GraphData } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';
import { GRAPH_CONSTANTS } from '@/utils/graph-constants';
import {
  searchNodes as searchNodesUtil,
  clearSearch,
} from '@/utils/graph-search';

type Notifications = (message: string, type?: 'success' | 'warning' | 'error') => void;

type EventHandlersLike = {
  addEventListener: (
    element: Document | HTMLElement,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => void;
};

export function setupSearchHandlers(params: {
  eventHandlers: EventHandlersLike;
  getGraph: () => ForceGraphInstance | null;
  getAllData: () => GraphData | null;
  isFocusModeActive: () => boolean;
  setFocusNodes: (nodeIds: string[]) => void;
  showNotification: Notifications;
  searchTimeoutRef: () => ReturnType<typeof setTimeout> | null;
  setSearchTimeout: (timer: ReturnType<typeof setTimeout> | null) => void;
}): void {
  const {
    eventHandlers,
    getGraph,
    getAllData,
    isFocusModeActive,
    setFocusNodes,
    showNotification,
    searchTimeoutRef,
    setSearchTimeout,
  } = params;
  
  const searchInput = document.getElementById('search-nodes') as HTMLInputElement | null;
  const clearSearchBtn = document.getElementById('clear-search') as HTMLButtonElement | null;
  if (!searchInput || !clearSearchBtn) return;
  
  eventHandlers.addEventListener(searchInput, 'input', (e) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    
    if (value.trim()) {
      clearSearchBtn.style.display = 'block';
    } else {
      clearSearchBtn.style.display = 'none';
      clearSearch(getGraph(), getAllData());
    }
    
    const currentTimeout = searchTimeoutRef();
    if (currentTimeout) clearTimeout(currentTimeout);
    
    setSearchTimeout(setTimeout(() => {
      if (!value.trim()) return;
      const graph = getGraph();
      const allData = getAllData();
      if (!graph || !allData) return;
      searchNodesUtil(value, graph, allData, {
        isFocusModeActive,
        setFocusNodes,
        showNotification,
      });
    }, GRAPH_CONSTANTS.DEBOUNCE_SEARCH_MS));
  });
  
  eventHandlers.addEventListener(clearSearchBtn, 'click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    clearSearch(getGraph(), getAllData());
  });
}
