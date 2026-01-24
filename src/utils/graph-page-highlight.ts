import type { GraphNode, GraphData } from '@/types/graph';
import type { ForceGraphInstance, ForceGraphLink } from '@/types/force-graph';
import { clearHighlight as clearHighlightUtil } from '@/utils/graph-highlight';
import { addOpacityToColor, getDefaultNodeColor } from '@/utils/graph-page-ui';

type Notifications = (message: string, type?: 'success' | 'warning' | 'error') => void;

type HighlightDeps = {
  graph: ForceGraphInstance | null;
  allData: GraphData | null;
  getHighlightedNodeId: () => string | null;
  setHighlightedNodeId: (id: string | null) => void;
  isFocusModeActive: () => boolean;
  getFocusModeNodes: () => Set<string>;
  applyFocusMode: () => void;
  showNotification: Notifications;
};

export function highlightConnections(nodeId: string, deps: HighlightDeps): void {
  const { graph, allData, getHighlightedNodeId, setHighlightedNodeId } = deps;
  if (!graph || !allData || getHighlightedNodeId() === nodeId) return;
  
  setHighlightedNodeId(nodeId);
  const connectedNodeIds = new Set<string>([nodeId]);
  
  allData.edges.forEach((edge) => {
    if (edge.from === nodeId) connectedNodeIds.add(edge.to);
    if (edge.to === nodeId) connectedNodeIds.add(edge.from);
  });
  
  const originalNodeColor = graph.nodeColor();
  const originalLinkColor = graph.linkColor();
  
  graph.nodeColor((node: GraphNode) => {
    const baseColor = typeof originalNodeColor === 'function' ? originalNodeColor(node) : getDefaultNodeColor(node);
    if (connectedNodeIds.has(node.id)) {
      return baseColor;
    }
    return addOpacityToColor(baseColor, 0.3);
  });
  
  graph.linkColor((link: ForceGraphLink) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
    const isConnected = sourceId === nodeId || targetId === nodeId;
    
    if (isConnected) {
      const baseColor = typeof originalLinkColor === 'function' ? originalLinkColor(link) : 'rgba(96, 165, 250, 0.8)';
      return baseColor.replace('0.8', '1');
    }
    return 'rgba(148, 163, 184, 0.2)';
  });
}

export function clearHighlight(deps: HighlightDeps): void {
  const { graph, getHighlightedNodeId, setHighlightedNodeId, isFocusModeActive, getFocusModeNodes, applyFocusMode } = deps;
  if (!graph) return;
  clearHighlightUtil(
    graph,
    getHighlightedNodeId(),
    setHighlightedNodeId,
    isFocusModeActive(),
    getFocusModeNodes(),
    applyFocusMode
  );
}

export function selectEdgesByDirection(
  nodeId: string,
  direction: 'incoming' | 'outgoing' | 'connected',
  deps: HighlightDeps
): void {
  const { graph, allData, showNotification } = deps;
  if (!graph || !allData) return;
  
  const edgesToHighlight = allData.edges.filter((edge) => {
    if (direction === 'incoming') return edge.to === nodeId;
    if (direction === 'outgoing') return edge.from === nodeId;
    return edge.from === nodeId || edge.to === nodeId;
  });
  
  const connectedNodeIds = new Set<string>([nodeId]);
  edgesToHighlight.forEach((edge) => {
    connectedNodeIds.add(edge.from);
    connectedNodeIds.add(edge.to);
  });
  
  const originalNodeColor = graph.nodeColor();
  graph.nodeColor((node: GraphNode) => {
    const baseColor = typeof originalNodeColor === 'function' ? originalNodeColor(node) : getDefaultNodeColor(node);
    if (connectedNodeIds.has(node.id)) {
      return baseColor;
    }
    return addOpacityToColor(baseColor, 0.2);
  });
  
  const originalLinkColor = graph.linkColor();
  graph.linkColor((link: ForceGraphLink) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
    const isSelected = edgesToHighlight.some((e) => 
      (e.from === sourceId && e.to === targetId) || 
      (e.from === targetId && e.to === sourceId)
    );
    
    if (isSelected) {
      return '#fbbf24';
    }
    return typeof originalLinkColor === 'function' ? originalLinkColor(link) : 'rgba(148, 163, 184, 0.2)';
  });
  
  showNotification(`Выделено ${edgesToHighlight.length} связей`, 'success');
}
