import type { GraphData, GraphNode } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';
import { applyFocusMode as applyFocusModeUtil } from '@/utils/graph-highlight';
import { getDefaultNodeColor } from '@/utils/graph-page-ui';

type FocusState = {
  isFocusModeActive: () => boolean;
  setFocusMode: (active: boolean) => void;
  getFocusModeNodes: () => Set<string>;
  setFocusModeNodes: (nodeIds: string[]) => void;
};

type FocusDeps = {
  graph: ForceGraphInstance | null;
  allData: GraphData | null;
  focusState: FocusState;
  focusButtonId?: string;
};

export function applyFocusMode(deps: FocusDeps): void {
  const { graph, allData, focusState } = deps;
  const focusNodes = focusState.getFocusModeNodes();
  if (!graph || !allData || focusNodes.size === 0) return;
  applyFocusModeUtil(graph, allData, focusNodes);
}

export function setFocusNodes(
  nodeIds: string[],
  deps: FocusDeps
): void {
  const { focusState } = deps;
  focusState.setFocusModeNodes(nodeIds);
  if (focusState.isFocusModeActive()) {
    applyFocusMode(deps);
  }
}

export function toggleFocusMode(deps: FocusDeps): void {
  const { graph, allData, focusState, focusButtonId = 'focus-mode' } = deps;
  const newState = !focusState.isFocusModeActive();
  focusState.setFocusMode(newState);
  const focusBtn = document.getElementById(focusButtonId) as HTMLButtonElement | null;
  
  if (newState) {
    const focusNodes = focusState.getFocusModeNodes();
    if (focusNodes.size === 0 && allData) {
      const graphData = graph?.graphData();
      if (graphData && 'nodes' in graphData && Array.isArray(graphData.nodes)) {
        const nodeIds = (graphData.nodes as { id: string }[]).map((n) => n.id);
        focusState.setFocusModeNodes(nodeIds);
      }
    }
    applyFocusMode({ graph, allData, focusState, focusButtonId });
    focusBtn?.classList.add('ring-2', 'ring-purple-400');
  } else {
    focusState.setFocusModeNodes([]);
    if (graph) {
      graph.nodeColor((n: GraphNode) => getDefaultNodeColor(n));
    }
    focusBtn?.classList.remove('ring-2', 'ring-purple-400');
  }
}
