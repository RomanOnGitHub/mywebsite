import type { GraphData } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';
import { handleKeyboardZoom } from '@/utils/graph-zoom';
import { clearSearch } from '@/utils/graph-search';

type EventHandlersLike = {
  addEventListener: (
    element: Document | HTMLElement,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => void;
};

export function setupKeyboardShortcuts(
  eventHandlers: EventHandlersLike,
  params: {
    getGraph: () => ForceGraphInstance | null;
    getAllData: () => GraphData | null;
    resetFilters: () => void;
  }
): void {
  const { getGraph, getAllData, resetFilters } = params;
  
  eventHandlers.addEventListener(document, 'keydown', (e) => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      if (e.key === 'Escape') {
        const input = document.getElementById('search-nodes') as HTMLInputElement;
        if (activeElement === input) {
          input.value = '';
          clearSearch(getGraph(), getAllData());
        }
      }
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      const input = document.getElementById('search-nodes') as HTMLInputElement;
      input?.focus();
      input?.select();
      return;
    }
    
    if (e.key === 'Escape') {
      const input = document.getElementById('search-nodes') as HTMLInputElement;
      if (input && input.value.trim()) {
        input.value = '';
        clearSearch(getGraph(), getAllData());
      } else {
        resetFilters();
      }
      return;
    }
    
    handleKeyboardZoom(e as KeyboardEvent, getGraph());
  });
}
