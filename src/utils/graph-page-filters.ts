type EventHandlersLike = {
  addEventListener: (
    element: Document | HTMLElement,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => void;
};

export function setupFilterEventHandlers(
  eventHandlers: EventHandlersLike,
  applyFilters: () => void,
  resetFilters: () => void
): void {
  const typeSelect = document.getElementById('filter-type');
  const tagSelect = document.getElementById('filter-tags');
  const linkTypeSelect = document.getElementById('filter-link-type');
  const resetBtn = document.getElementById('reset-filters');
  
  const filterHandler = () => applyFilters();
  
  if (typeSelect) {
    eventHandlers.addEventListener(typeSelect, 'change', filterHandler);
    eventHandlers.addEventListener(typeSelect, 'click', filterHandler);
  }
  if (tagSelect) {
    eventHandlers.addEventListener(tagSelect, 'change', filterHandler);
    eventHandlers.addEventListener(tagSelect, 'click', filterHandler);
  }
  if (linkTypeSelect) {
    eventHandlers.addEventListener(linkTypeSelect, 'change', filterHandler);
    eventHandlers.addEventListener(linkTypeSelect, 'click', filterHandler);
  }
  if (resetBtn) {
    eventHandlers.addEventListener(resetBtn, 'click', resetFilters);
  }
}
