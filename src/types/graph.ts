/**
 * Типы для Knowledge Graph системы
 */

export interface GraphNode {
  id: string;
  title: string;
  type: 'blog' | 'cases' | 'services' | 'industries';
  tags: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  source: 'e' | 'o'; // e=explicit, o=outbound
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
