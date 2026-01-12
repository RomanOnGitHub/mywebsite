/**
 * Типы-обертки для force-graph API
 * Библиотека force-graph не предоставляет TypeScript типы,
 * поэтому создаём собственные интерфейсы для типобезопасности
 */

import type { GraphNode, GraphEdge } from './graph';

export interface ForceGraphLink {
  source: GraphNode | string;
  target: GraphNode | string;
  sourceType?: 'explicit' | 'outbound';
}

export interface ForceGraphInstance {
  graphData(data?: { nodes: GraphNode[]; links: ForceGraphLink[] }): ForceGraphInstance | { nodes: GraphNode[]; links: ForceGraphLink[] };
  width(w: number): ForceGraphInstance;
  height(h: number): ForceGraphInstance;
  nodeLabel(fn: (node: GraphNode) => string): ForceGraphInstance;
  nodeColor(fn: (node: GraphNode) => string): ForceGraphInstance;
  nodeVal(fn: (node: GraphNode) => number): ForceGraphInstance;
  linkWidth(fn: (link: ForceGraphLink) => number): ForceGraphInstance;
  linkColor(fn: (link: ForceGraphLink) => string): ForceGraphInstance;
  linkDirectionalArrowLength(len: number): ForceGraphInstance;
  linkDirectionalArrowRelPos(pos: number): ForceGraphInstance;
  d3Force(name: string, force: unknown): ForceGraphInstance;
  enableZoomInteraction(enabled: boolean): ForceGraphInstance;
  enablePanInteraction(enabled: boolean): ForceGraphInstance;
  cooldownTicks(ticks: number): ForceGraphInstance;
  onNodeClick(fn: (node: GraphNode) => void): ForceGraphInstance;
  onNodeHover(fn: (node: GraphNode | null) => void): ForceGraphInstance;
  onNodeRightClick(fn: (node: GraphNode, event: MouseEvent) => void): ForceGraphInstance;
  onLinkHover(fn: (link: ForceGraphLink | null) => void): ForceGraphInstance;
  zoom(level?: number): number | ForceGraphInstance;
  zoomToFit(duration?: number, padding?: number): ForceGraphInstance;
  centerAt(x: number, y: number, duration?: number): ForceGraphInstance;
  _destructor(): void;
}

export interface ForceLink {
  id(fn: (d: GraphNode | string) => string): ForceLink;
  distance(d: number): ForceLink;
}

export interface ForceManyBody {
  strength(s: number): ForceManyBody;
}

export type ForceCenter = (x: number, y: number) => unknown;
