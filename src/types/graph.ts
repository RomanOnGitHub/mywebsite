/**
 * Типы для Knowledge Graph системы
 */

export interface GraphNode {
  id: string;
  title: string;
  type: 'blog' | 'cases' | 'services' | 'industries';
  lang: string;
  slug: string;
  tags: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  source: 'explicit' | 'outbound';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
