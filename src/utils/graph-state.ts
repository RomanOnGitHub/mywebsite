/**
 * Управление состоянием графа знаний
 * Инкапсулирует все глобальные переменные состояния
 */

import type { GraphNode, GraphData } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';

export class GraphStateManager {
  private graph: ForceGraphInstance | null = null;
  private data: GraphData | null = null;
  private highlightedNodeId: string | null = null;
  private contextMenuNode: GraphNode | null = null;
  private focusModeActive: boolean = false;
  private focusModeNodes: Set<string> = new Set();
  
  // Getters
  getGraph(): ForceGraphInstance | null {
    return this.graph;
  }
  
  getData(): GraphData | null {
    return this.data;
  }
  
  getHighlightedNodeId(): string | null {
    return this.highlightedNodeId;
  }
  
  getContextMenuNode(): GraphNode | null {
    return this.contextMenuNode;
  }
  
  isFocusModeActive(): boolean {
    return this.focusModeActive;
  }
  
  getFocusModeNodes(): Set<string> {
    return this.focusModeNodes;
  }
  
  // Setters
  setGraph(graph: ForceGraphInstance | null): void {
    this.graph = graph;
  }
  
  setData(data: GraphData | null): void {
    this.data = data;
  }
  
  setHighlightedNodeId(nodeId: string | null): void {
    this.highlightedNodeId = nodeId;
  }
  
  setContextMenuNode(node: GraphNode | null): void {
    this.contextMenuNode = node;
  }
  
  setFocusMode(active: boolean): void {
    this.focusModeActive = active;
  }
  
  setFocusModeNodes(nodeIds: string[]): void {
    this.focusModeNodes = new Set(nodeIds);
  }
  
  addFocusModeNode(nodeId: string): void {
    this.focusModeNodes.add(nodeId);
  }
  
  removeFocusModeNode(nodeId: string): void {
    this.focusModeNodes.delete(nodeId);
  }
  
  clearFocusModeNodes(): void {
    this.focusModeNodes.clear();
  }
  
  // Проверки
  hasGraph(): boolean {
    return this.graph !== null;
  }
  
  hasData(): boolean {
    return this.data !== null && this.data.nodes.length > 0;
  }
  
  // Очистка
  destroy(): void {
    if (this.graph) {
      this.graph._destructor();
      this.graph = null;
    }
    this.data = null;
    this.highlightedNodeId = null;
    this.contextMenuNode = null;
    this.focusModeActive = false;
    this.focusModeNodes.clear();
  }
  
  // Валидация
  requireGraph(): ForceGraphInstance {
    if (!this.graph) {
      throw new Error('Graph instance is not initialized');
    }
    return this.graph;
  }
  
  requireData(): GraphData {
    if (!this.data || this.data.nodes.length === 0) {
      throw new Error('Graph data is not available');
    }
    return this.data;
  }
}

// Singleton instance
let stateManagerInstance: GraphStateManager | null = null;

export function getGraphState(): GraphStateManager {
  if (!stateManagerInstance) {
    stateManagerInstance = new GraphStateManager();
  }
  return stateManagerInstance;
}

export function resetGraphState(): void {
  if (stateManagerInstance) {
    stateManagerInstance.destroy();
    stateManagerInstance = null;
  }
}
