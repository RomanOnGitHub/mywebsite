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
  relation: 'e' | 'o'; // e=explicit, o=outbound
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Минифицированные типы для JSON payload
export interface MinifiedGraphNode {
  i: string;       // id
  t: string;       // title
  c: number;       // type (collection) -> mapped to index
  g?: string[];    // tags (optional)
}

// Mapping for types to integers
export const TYPE_MAPPING = ['blog', 'cases', 'services', 'industries'] as const;

export interface MinifiedGraphEdge {
  f: string; // from
  t: string; // to
  s: 0 | 1;  // source: 0=e (explicit), 1=o (outbound)
}

export interface MinifiedGraphData {
  n: MinifiedGraphNode[];
  e: MinifiedGraphEdge[];
}
