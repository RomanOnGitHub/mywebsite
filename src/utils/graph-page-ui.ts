import type { GraphNode } from '@/types/graph';
import { GRAPH_CONSTANTS } from '@/utils/graph-constants';

export function showNotification(
  message: string,
  type: 'success' | 'warning' | 'error' = 'success'
): void {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'warning' ? 'bg-yellow-500 text-black' :
    'bg-red-500 text-white'
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, GRAPH_CONSTANTS.NOTIFICATION_AUTO_REMOVE_DELAY_MS);
}

export function getDefaultNodeColor(node: GraphNode): string {
  const colors: Record<GraphNode['type'], string> = {
    blog: '#3b82f6',
    cases: '#10b981',
    services: '#f59e0b',
    industries: '#8b5cf6',
  };
  return colors[node.type] || '#6b7280';
}

export function addOpacityToColor(color: string, opacity: number): string {
  if (color.startsWith('rgba(')) {
    return color.replace(/[\d.]+\)$/, `${opacity})`);
  }
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  return color;
}
