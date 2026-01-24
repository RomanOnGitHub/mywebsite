import type { GraphNode, GraphData } from '@/types/graph';
import type { 
  ForceGraphInstance, 
  ForceLink, 
  ForceManyBody, 
  ForceCenter,
  ForceGraphLink 
} from '@/types/force-graph';
import { GRAPH_CONSTANTS } from '@/utils/graph-constants';
import { getGraphState, resetGraphState } from '@/utils/graph-state';
import { showContextMenu as showContextMenuUtil, hideContextMenu as hideContextMenuUtil } from '@/utils/graph-context-menu';
import { setupZoomControls as setupZoomControlsUtil } from '@/utils/graph-zoom';
import { GraphEventHandlers } from '@/utils/graph-event-handlers';
import { applyFilters as applyFiltersUtil, resetFilters as resetFiltersUtil } from '@/utils/graph-filters';
import { exportGraphAsImage as exportGraphAsImageUtil, showExportModal as showExportModalUtil } from '@/utils/graph-export';
import { renderGraph } from '@/utils/graph-page-render';
import { registerGraphPageEvents } from '@/utils/graph-page-events';
import { showNotification } from '@/utils/graph-page-ui';
import { highlightConnections as highlightConnectionsAction, clearHighlight as clearHighlightAction, selectEdgesByDirection as selectEdgesByDirectionAction } from '@/utils/graph-page-highlight';
import { applyFocusMode as applyFocusModeAction, setFocusNodes as setFocusNodesAction, toggleFocusMode as toggleFocusModeAction } from '@/utils/graph-page-focus';

export function initGraphPage(): () => void {
  // Проверка доступности DOM API
  if (typeof window === 'undefined') {
    throw new Error('This script must run in browser environment');
  }
  
  // Динамические импорты для клиентских библиотек
  let ForceGraph: ((container: HTMLElement) => ForceGraphInstance) | null = null;
  let forceCenter: ForceCenter | null = null;
  let forceManyBody: (() => ForceManyBody) | null = null;
  let forceLink: ((links: ForceGraphLink[]) => ForceLink) | null = null;
  
  // История навигации
  class NavigationHistory {
    private history: string[] = [];
    private currentPosition: number = -1;
    
    addToHistory(nodeId: string) {
      // Проверяем, не является ли это текущим узлом
      if (this.history[this.currentPosition] === nodeId) {
        return;
      }
      
      // Удаляем узел из истории, если он уже есть
      const index = this.history.indexOf(nodeId);
      if (index > -1) {
        this.history.splice(index, 1);
      }
      
      // Удаляем все узлы после текущей позиции (если мы не в конце)
      if (this.currentPosition < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentPosition + 1);
      }
      
      // Добавляем новый узел
      this.history.push(nodeId);
      
      // Ограничиваем историю максимальным количеством записей
      if (this.history.length > GRAPH_CONSTANTS.NAVIGATION_HISTORY_MAX) {
        this.history.shift();
      }
      
      // Обновляем позицию
      this.currentPosition = this.history.length - 1;
      
      // Обновляем кнопки навигации
      this.updateNavigationButtons();
    }
    
    getPrevious(): string | null {
      if (this.currentPosition > 0) {
        this.currentPosition--;
        this.updateNavigationButtons();
        return this.history[this.currentPosition];
      }
      return null;
    }
    
    getNext(): string | null {
      if (this.currentPosition < this.history.length - 1) {
        this.currentPosition++;
        this.updateNavigationButtons();
        return this.history[this.currentPosition];
      }
      return null;
    }
    
    hasPrevious(): boolean {
      return this.currentPosition > 0;
    }
    
    hasNext(): boolean {
      return this.currentPosition < this.history.length - 1;
    }
    
    updateNavigationButtons() {
      const backBtn = document.getElementById('nav-back') as HTMLButtonElement;
      const forwardBtn = document.getElementById('nav-forward') as HTMLButtonElement;
      
      if (backBtn) {
        backBtn.disabled = !this.hasPrevious();
      }
      if (forwardBtn) {
        forwardBtn.disabled = !this.hasNext();
      }
    }
  }
  
  // Используем менеджер состояния вместо глобальных переменных
  const state = getGraphState();
  const navigationHistory = new NavigationHistory();
  const lang = document.documentElement.lang || 'ru';
  
  // Локальные ссылки для удобства (используют state внутри)
  let graph: ForceGraphInstance | null = null;
  let allData: GraphData | null = null;
  
  // Геттеры для состояния через state manager
  const getHighlightedNodeId = () => state.getHighlightedNodeId();
  const getContextMenuNode = () => state.getContextMenuNode();
  const isFocusModeActive = () => state.isFocusModeActive();
  const getFocusModeNodes = () => state.getFocusModeNodes();
  
  // Event handlers manager для централизованного управления обработчиками
  const eventHandlers = new GraphEventHandlers();
  
  // Сеттеры для состояния через state manager
  const setGraph = (g: ForceGraphInstance | null) => {
    graph = g;
    state.setGraph(g);
  };
  const setAllData = (data: GraphData | null) => {
    allData = data;
    state.setData(data);
  };
  const setHighlightedNodeId = (id: string | null) => state.setHighlightedNodeId(id);
  const setContextMenuNode = (node: GraphNode | null) => state.setContextMenuNode(node);
  const setFocusMode = (active: boolean) => state.setFocusMode(active);
  const setFocusModeNodes = (nodeIds: string[]) => state.setFocusModeNodes(nodeIds);
  
  // Debounce timer для фильтров
  let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lazyInitTimer: ReturnType<typeof setTimeout> | null = null;
  let positionSavingCleanup: (() => void) | null = null;
  let eventsCleanup: (() => void) | null = null;
  
  // Zoom контролы - обработчики добавляются один раз при инициализации
  let zoomControlsInitialized = false;
  
  // Флаг для предотвращения повторного вызова init
  let initInProgress = false;
  
  
  // Загрузить библиотеки асинхронно
  async function loadGraphLibraries() {
    if (!ForceGraph) {
      const forceGraphModule = await import('force-graph');
      ForceGraph = forceGraphModule.default as (container: HTMLElement) => ForceGraphInstance;
    }
    if (!forceCenter) {
      const d3ForceModule = await import('d3-force');
      forceCenter = d3ForceModule.forceCenter as ForceCenter;
      forceManyBody = (() => d3ForceModule.forceManyBody()) as () => ForceManyBody;
      forceLink = ((links: ForceGraphLink[]) => d3ForceModule.forceLink(links)) as (links: ForceGraphLink[]) => ForceLink;
    }
  }
  
  async function init() {
    // Защита от повторного вызова
    if (initInProgress) {
      if (import.meta.env.DEV) {
        console.log('[Graph] Init already in progress, skipping...');
      }
      return;
    }
    initInProgress = true;
    
    if (import.meta.env.DEV) {
      console.log('[Graph] Initializing graph...');
    }
    
    try {
      // Загрузить библиотеки перед использованием
      if (import.meta.env.DEV) {
        console.log('[Graph] Loading libraries...');
      }
      await loadGraphLibraries();
      
      if (import.meta.env.DEV) {
        console.log('[Graph] Loading graph data for lang:', lang);
      }
      const { getGraphData } = await import('@/utils/graph-cache');
      allData = await getGraphData(lang);
      
      // Проверяем пустое состояние
      if (!allData || allData.nodes.length === 0) {
        showEmptyState();
        return;
      }
      
      // Заполнить select с тегами (убираем дубликаты через Set)
      const allTags = [...new Set(allData.nodes.flatMap((n) => n.tags || []))].sort();
      const tagsSelect = document.getElementById('filter-tags') as HTMLSelectElement;
      
      if (tagsSelect) {
        // Очистить существующие опции (кроме "Все теги" - первая опция с index 0)
        while (tagsSelect.options.length > 1) {
          tagsSelect.remove(1);
        }
        
        // Добавляем теги, проверяя на дубликаты по value
        const existingValues = new Set<string>();
        allTags.forEach(tag => {
          // Фильтруем пустые строки и null/undefined
          if (!tag || typeof tag !== 'string' || tag.trim() === '') return;
          
          // Проверяем, что тег ещё не добавлен
          if (!existingValues.has(tag)) {
            existingValues.add(tag);
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagsSelect.appendChild(option);
          }
        });
        
        if (import.meta.env.DEV) {
          console.log(`[Graph] Populated ${existingValues.size} tags in filter`);
        }
      }
      
      if (import.meta.env.DEV) {
        console.log(`[Graph] Loaded ${allData.nodes.length} nodes, ${allData.edges.length} edges`);
      }
      
      renderGraphPage(allData, true);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Graph] Error loading graph data:', error);
      }
      showEmptyState();
    } finally {
      initInProgress = false;
    }
  }
  
  function showEmptyState() {
    const graphContainer = document.getElementById('graph-container');
    if (graphContainer) {
      // ⚠️ БЕЗОПАСНОСТЬ: innerHTML используется только со статическими строками (без пользовательского ввода)
      // escapeHtml() не требуется, так как контент полностью статичен и контролируется разработчиком
      // Если в будущем потребуется динамический контент, обязательно использовать escapeHtml()
      graphContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-96 text-center p-8">
          <svg class="w-24 h-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Граф знаний пуст
          </h3>
          <p class="text-gray-600 dark:text-gray-400 max-w-md">
            Данные для визуализации графа знаний пока не загружены или отсутствуют для выбранного языка.
          </p>
        </div>
      `;
    }
  }
  
  function applyFilters() {
    if (!allData) {
      if (import.meta.env.DEV) {
        console.warn('[Graph] Cannot apply filters: allData is not loaded');
      }
      return;
    }
    
    // Очистить предыдущий таймер
    if (filterDebounceTimer) {
      clearTimeout(filterDebounceTimer);
    }
    
    // Установить новый таймер для debounce
    filterDebounceTimer = setTimeout(() => {
      if (!allData) return;
      
      if (import.meta.env.DEV) {
        console.log('[Graph] Applying filters...');
      }
      
      // Используем функцию из модуля
      applyFiltersUtil(allData, renderGraphPage, showNotification);
    }, GRAPH_CONSTANTS.DEBOUNCE_FILTER_MS);
  }
  
  function renderGraphPage(data: GraphData, autoFit: boolean = true, useSavedPositions: boolean = true) {
    if (!ForceGraph || !forceCenter || !forceManyBody || !forceLink) {
      if (import.meta.env.DEV) {
        console.warn('[Graph] ForceGraph libraries not loaded');
      }
      return;
    }
    
    renderGraph({
      data,
      autoFit,
      useSavedPositions,
      graph,
      setGraph,
      setAllData,
      navigationHistory,
      lang,
      forceGraph: {
        createGraph: ForceGraph,
        forceCenter,
        forceManyBody,
        forceLink,
      },
      callbacks: {
        highlightConnections,
        clearHighlight,
        showContextMenu,
        setContextMenuNode,
        setupZoomControls,
        setPositionSavingCleanup: (cleanup) => {
          positionSavingCleanup = cleanup;
        },
      },
    });
  }
  
  function resetFilters() {
    if (filterDebounceTimer) {
      clearTimeout(filterDebounceTimer);
      filterDebounceTimer = null;
    }
    
    if (allData) {
      resetFiltersUtil(allData, renderGraphPage);
      renderGraphPage(allData, true, false);
    }
  }
  
  const getFocusDeps = () => ({
    graph,
    allData,
    focusState: {
      isFocusModeActive,
      setFocusMode,
      getFocusModeNodes,
      setFocusModeNodes,
    },
  });
  
  const applyFocusMode = () => applyFocusModeAction(getFocusDeps());
  const toggleFocusMode = () => toggleFocusModeAction(getFocusDeps());
  const setFocusNodes = (nodeIds: string[]) => setFocusNodesAction(nodeIds, getFocusDeps());
  
  const getHighlightDeps = () => ({
    graph,
    allData,
    getHighlightedNodeId,
    setHighlightedNodeId,
    isFocusModeActive,
    getFocusModeNodes,
    applyFocusMode,
    showNotification,
  });
  
  const highlightConnections = (nodeId: string) => highlightConnectionsAction(nodeId, getHighlightDeps());
  const clearHighlight = () => clearHighlightAction(getHighlightDeps());
  const selectEdgesByDirection = (nodeId: string, direction: 'incoming' | 'outgoing' | 'connected') =>
    selectEdgesByDirectionAction(nodeId, direction, getHighlightDeps());
  
  
  function showContextMenu(x: number, y: number) {
    showContextMenuUtil(x, y, getContextMenuNode());
  }
  
  function hideContextMenu() {
    hideContextMenuUtil();
  }
  
  function showExportModal() {
    const container = document.getElementById('graph-container');
    if (!graph || !container) return;
    showExportModalUtil(graph, container, lang, exportGraphAsImage);
  }
  
  async function exportGraphAsImage(
    format: 'png' | 'svg' = 'png',
    pixelRatio: number = 2,
    theme: 'light' | 'dark' = 'light',
    watermark: boolean = false,
    privacyMode: boolean = false,
    transparentBg: boolean = false
  ) {
    const container = document.getElementById('graph-container');
    if (!graph || !container) return;
    await exportGraphAsImageUtil(
      graph,
      container,
      lang,
      format,
      pixelRatio,
      theme,
      watermark,
      privacyMode,
      transparentBg,
      showNotification
    );
  }
  
  function setupZoomControls() {
    if (zoomControlsInitialized) {
      return;
    }
    zoomControlsInitialized = true;
    setupZoomControlsUtil(graph, eventHandlers);
  }

  if (!eventsCleanup) {
    eventsCleanup = registerGraphPageEvents({
      eventHandlers,
      getGraph: () => graph,
      getAllData: () => allData,
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
    });
  }
  
  function setupLazyLoading() {
    const container = document.getElementById('graph-container');
    if (!container) {
      if (import.meta.env.DEV) {
        console.warn('[Graph] Container not found, initializing immediately');
      }
      init();
      return;
    }
    
    if (import.meta.env.DEV) {
      console.log('[Graph] Container found, initializing with delay');
    }
    
    lazyInitTimer = setTimeout(() => {
      if (import.meta.env.DEV) {
        console.log('[Graph] Calling init() after timeout');
      }
      init();
    }, 200);
  }
  
  function startInitialization() {
    if (import.meta.env.DEV) {
      console.log('[Graph] Starting initialization...');
    }
    setupLazyLoading();
  }
  
  function cleanup() {
    eventHandlers.removeAll();
    if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
    if (lazyInitTimer) clearTimeout(lazyInitTimer);
    if (eventsCleanup) {
      eventsCleanup();
      eventsCleanup = null;
    }
    if (positionSavingCleanup) {
      positionSavingCleanup();
      positionSavingCleanup = null;
    }
    if (graph) {
      graph._destructor();
    }
    resetGraphState();
  }
  
  // Initial load
  if (document.readyState === 'loading') {
    const onReady = () => startInitialization();
    eventHandlers.addEventListener(document, 'DOMContentLoaded', onReady);
  } else {
    startInitialization();
  }
  
  // View Transitions: пересобираем состояние после навигации
  eventHandlers.addEventListener(document, 'astro:page-load', async () => {
    resetGraphState();
    zoomControlsInitialized = false;
    initInProgress = false;
    startInitialization();
  });
  
  return cleanup;
}
