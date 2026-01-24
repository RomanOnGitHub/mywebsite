import type { GraphData } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';

type GetGraph = () => ForceGraphInstance | null;
type GetData = () => GraphData | null;
type Notifications = (message: string, type?: 'success' | 'warning' | 'error') => void;

type EventHandlersLike = {
  addEventListener: (
    element: Document | HTMLElement,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => void;
};

export function setupExportHandlers(
  eventHandlers: EventHandlersLike,
  getGraph: GetGraph,
  getAllData: GetData,
  lang: string,
  showExportModal: () => void,
  showNotification: Notifications
): void {
  const exportImageBtn = document.getElementById('export-image');
  if (exportImageBtn) {
    eventHandlers.addEventListener(exportImageBtn, 'click', showExportModal);
  }
  
  const exportJsonBtn = document.getElementById('export-json');
  if (!exportJsonBtn) return;
  
  eventHandlers.addEventListener(exportJsonBtn, 'click', () => {
    const graph = getGraph();
    const allData = getAllData();
    if (!graph || !allData) {
      showNotification('Нет данных для экспорта', 'warning');
      return;
    }
    
    try {
      const exportData = {
        nodes: allData.nodes,
        edges: allData.edges,
        metadata: {
          exportedAt: new Date().toISOString(),
          language: lang,
          nodeCount: allData.nodes.length,
          edgeCount: allData.edges.length,
        },
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `graph-knowledge-${lang}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification('Граф экспортирован в JSON!', 'success');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Export JSON error:', error);
      }
      showNotification('Ошибка экспорта JSON', 'error');
    }
  });
}
