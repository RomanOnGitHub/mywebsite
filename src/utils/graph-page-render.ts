import type { GraphNode, GraphData } from '@/types/graph';
import type { 
  ForceGraphInstance, 
  ForceLink, 
  ForceManyBody, 
  ForceCenter,
  ForceGraphLink 
} from '@/types/force-graph';
import { GRAPH_CONSTANTS } from '@/utils/graph-constants';
import { restoreNodePositions, setupPositionSaving } from '@/utils/graph-positions';

type NavigationHistoryLike = {
  addToHistory: (nodeId: string) => void;
};

type GraphForceLibraries = {
  createGraph: (container: HTMLElement) => ForceGraphInstance;
  forceCenter: ForceCenter;
  forceManyBody: () => ForceManyBody;
  forceLink: (links: ForceGraphLink[]) => ForceLink;
};

type GraphRenderCallbacks = {
  highlightConnections: (nodeId: string) => void;
  clearHighlight: () => void;
  showContextMenu: (x: number, y: number) => void;
  setContextMenuNode: (node: GraphNode | null) => void;
  setupZoomControls: () => void;
  setPositionSavingCleanup: (cleanup: (() => void) | null) => void;
};

type GraphRenderParams = {
  data: GraphData;
  autoFit?: boolean;
  useSavedPositions?: boolean;
  graph: ForceGraphInstance | null;
  setGraph: (g: ForceGraphInstance | null) => void;
  setAllData: (d: GraphData | null) => void;
  navigationHistory: NavigationHistoryLike;
  lang: string;
  forceGraph: GraphForceLibraries;
  callbacks: GraphRenderCallbacks;
};

function restoreNodePositionsWithFallback(
  width: number,
  height: number,
  lang: string
): Record<string, { x: number; y: number }> | null {
  return restoreNodePositions(width, height, lang);
}

export function renderGraph({
  data,
  autoFit = true,
  useSavedPositions = true,
  graph,
  setGraph,
  setAllData,
  navigationHistory,
  lang,
  forceGraph,
  callbacks,
}: GraphRenderParams): void {
  const container = document.getElementById('graph-container');
  if (!container) return;
  
  let currentGraph = graph;
  
  // Уничтожить предыдущий граф
  if (currentGraph) {
    currentGraph._destructor();
  }
  
  const width = container.offsetWidth || container.clientWidth || GRAPH_CONSTANTS.DEFAULT_WIDTH;
  const height = container.offsetHeight || container.clientHeight || GRAPH_CONSTANTS.DEFAULT_HEIGHT;
  const margin = GRAPH_CONSTANTS.BOUNDING_BOX_MARGIN;
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  if (import.meta.env.DEV) {
    console.log('Graph container:', { width, height, centerX, centerY });
    console.log('Graph data:', { nodes: data.nodes.length, edges: data.edges.length });
  }
  
  if (data.nodes.length === 0) {
    if (import.meta.env.DEV) {
      console.warn('No nodes to display');
    }
    return;
  }
  
  let zoomToFitCalled = false;
  
  const links = data.edges.map((e) => ({
    source: e.from,
    target: e.to,
    sourceType: e.source,
  }));
  
  const nodeSizes = new Map<string, number>();
  data.nodes.forEach((node) => {
    const connections = data.edges.filter((e) => 
      e.from === node.id || e.to === node.id
    ).length;
    const size = Math.max(
      GRAPH_CONSTANTS.NODE_SIZE_MIN, 
      Math.min(GRAPH_CONSTANTS.NODE_SIZE_MAX, connections * GRAPH_CONSTANTS.NODE_SIZE_CONNECTION_FACTOR)
    );
    nodeSizes.set(node.id, size);
  });
  
  const boundingBoxForce = () => {
    let nodes: Array<GraphNode & { x?: number; y?: number; vx?: number; vy?: number }>;
    
    const force = () => {
      nodes.forEach((node) => {
        const nodeSize = nodeSizes.get(node.id) || 10;
        const xMin = margin + nodeSize;
        const xMax = width - margin - nodeSize;
        const yMin = margin + nodeSize;
        const yMax = height - margin - nodeSize;
        
        const overshootX = node.x! < xMin ? xMin - node.x! : (node.x! > xMax ? node.x! - xMax : 0);
        const overshootY = node.y! < yMin ? yMin - node.y! : (node.y! > yMax ? node.y! - yMax : 0);
        
        const correctionStrength = (overshootX > 0 || overshootY > 0) 
          ? GRAPH_CONSTANTS.BOUNDING_CORRECTION_STRENGTH_STRONG 
          : GRAPH_CONSTANTS.BOUNDING_CORRECTION_STRENGTH_NORMAL;
        
        if (node.x! < xMin) {
          node.vx = (node.vx || 0) + (xMin - node.x!) * correctionStrength;
          if (overshootX > GRAPH_CONSTANTS.OVERSHOOT_THRESHOLD_PX) {
            node.x = xMin;
          }
        }
        if (node.x! > xMax) {
          node.vx = (node.vx || 0) + (xMax - node.x!) * correctionStrength;
          if (overshootX > GRAPH_CONSTANTS.OVERSHOOT_THRESHOLD_PX) {
            node.x = xMax;
          }
        }
        if (node.y! < yMin) {
          node.vy = (node.vy || 0) + (yMin - node.y!) * correctionStrength;
          if (overshootY > GRAPH_CONSTANTS.OVERSHOOT_THRESHOLD_PX) {
            node.y = yMin;
          }
        }
        if (node.y! > yMax) {
          node.vy = (node.vy || 0) + (yMax - node.y!) * correctionStrength;
          if (overshootY > GRAPH_CONSTANTS.OVERSHOOT_THRESHOLD_PX) {
            node.y = yMax;
          }
        }
      });
    };
    
    force.initialize = (n: Array<GraphNode & { x?: number; y?: number; vx?: number; vy?: number }>) => {
      nodes = n;
    };
    
    return force;
  };
  
  const stabilizationTracker = () => {
    let nodes: Array<GraphNode & { x?: number; y?: number; vx?: number; vy?: number }>;
    let lastAlpha = 1;
    let stableTicks = 0;
    
    const force = (alpha: number) => {
      if (alpha < GRAPH_CONSTANTS.STABILIZATION_ALPHA_THRESHOLD && 
          lastAlpha < GRAPH_CONSTANTS.STABILIZATION_ALPHA_THRESHOLD) {
        stableTicks++;
        if (stableTicks >= GRAPH_CONSTANTS.STABLE_TICKS_REQUIRED && 
            autoFit && !zoomToFitCalled && currentGraph) {
          zoomToFitCalled = true;
          setTimeout(() => {
            if (currentGraph) {
              currentGraph.zoomToFit(GRAPH_CONSTANTS.ZOOM_FIT_DURATION_MS);
            }
          }, GRAPH_CONSTANTS.ZOOM_FIT_DELAY_MS);
        }
      } else {
        stableTicks = 0;
      }
      lastAlpha = alpha;
    };
    
    force.initialize = (n: Array<GraphNode & { x?: number; y?: number; vx?: number; vy?: number }>) => {
      nodes = n;
      lastAlpha = 1;
      stableTicks = 0;
      zoomToFitCalled = false;
    };
    
    return force;
  };
  
  const savedPositions = useSavedPositions ? restoreNodePositionsWithFallback(width, height, lang) : null;
  let usedSavedPositions = false;
  
  data.nodes.forEach((node, index: number) => {
    if (useSavedPositions && savedPositions && savedPositions[node.id]) {
      const savedX = savedPositions[node.id].x;
      const savedY = savedPositions[node.id].y;
      const marginCheck = GRAPH_CONSTANTS.BOUNDING_POSITION_MARGIN_CHECK;
      
      if (savedX >= -marginCheck && savedX <= width + marginCheck &&
          savedY >= -marginCheck && savedY <= height + marginCheck) {
        node.x = savedX;
        node.y = savedY;
        usedSavedPositions = true;
      } else {
        const angle = (index / data.nodes.length) * Math.PI * 2;
        const radius = Math.min(width, height) * GRAPH_CONSTANTS.NODE_POSITION_RADIUS_FACTOR;
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
      }
    } else {
      const angle = (index / data.nodes.length) * Math.PI * 2;
      const radius = Math.min(width, height) * GRAPH_CONSTANTS.NODE_POSITION_RADIUS_FACTOR;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      
      if (import.meta.env.DEV && index < 3) {
        console.log(`Node ${index} initial position:`, { 
          x: node.x, 
          y: node.y, 
          centerX, 
          centerY, 
          width, 
          height 
        });
      }
    }
    
    node.vx = 0;
    node.vy = 0;
  });
  
  const shouldFitImmediately = usedSavedPositions;
  
  const linksWithNodes: ForceGraphLink[] = links.map(link => {
    const sourceNode = data.nodes.find(n => n.id === link.source);
    const targetNode = data.nodes.find(n => n.id === link.target);
    
    if (!sourceNode || !targetNode) {
      if (import.meta.env.DEV) {
        console.warn('Link references missing node:', { source: link.source, target: link.target });
      }
      return null;
    }
    
    return {
      source: sourceNode,
      target: targetNode,
      sourceType: link.sourceType,
    };
  }).filter((link): link is ForceGraphLink => link !== null);
  
  if (import.meta.env.DEV) {
    console.log('Links with nodes:', linksWithNodes.length, 'out of', links.length);
  }
  
  currentGraph = forceGraph
    .createGraph(container)
    .graphData({ nodes: data.nodes, links: linksWithNodes })
    .width(width)
    .height(height)
    .nodeLabel((n: GraphNode) => n.title)
    .nodeColor((n: GraphNode) => {
      return GRAPH_CONSTANTS.NODE_COLORS[n.type] || GRAPH_CONSTANTS.NODE_COLORS.default;
    })
    .nodeVal((n: GraphNode) => nodeSizes.get(n.id) || 10)
    .linkWidth((link: ForceGraphLink) => {
      return link.sourceType === 'explicit' 
        ? GRAPH_CONSTANTS.LINK_WIDTH.explicit 
        : GRAPH_CONSTANTS.LINK_WIDTH.outbound;
    })
    .linkColor((link: ForceGraphLink) => {
      return link.sourceType === 'explicit'
        ? GRAPH_CONSTANTS.LINK_COLORS.explicit
        : GRAPH_CONSTANTS.LINK_COLORS.outbound;
    })
    .linkDirectionalArrowLength(GRAPH_CONSTANTS.LINK_ARROW_LENGTH)
    .linkDirectionalArrowRelPos(GRAPH_CONSTANTS.LINK_ARROW_REL_POS)
    .d3Force('center', forceGraph.forceCenter(
      width * GRAPH_CONSTANTS.FORCE_CENTER_X, 
      height * GRAPH_CONSTANTS.FORCE_CENTER_Y
    ))
    .d3Force('charge', forceGraph.forceManyBody().strength(GRAPH_CONSTANTS.FORCE_CHARGE_STRENGTH))
    .d3Force('link', forceGraph.forceLink(linksWithNodes).id((d: GraphNode | string) => {
      if (typeof d === 'object' && d && 'id' in d) return d.id;
      return String(d);
    }).distance(GRAPH_CONSTANTS.FORCE_LINK_DISTANCE))
    .d3Force('boundingBox', boundingBoxForce())
    .d3Force('stabilizationTracker', stabilizationTracker())
    .enableZoomInteraction(true)
    .enablePanInteraction(true)
    .cooldownTicks(GRAPH_CONSTANTS.FORCE_COOLDOWN_TICKS)
    .onNodeClick((node: GraphNode) => {
      if (typeof window !== 'undefined' && node) {
        navigationHistory.addToHistory(node.id);
        const url = `/${lang}/${node.id}/`;
        window.location.href = url;
      }
    })
    .onNodeHover((node: GraphNode | null) => {
      if (node) {
        container.style.cursor = 'pointer';
        callbacks.highlightConnections(node.id);
      } else {
        container.style.cursor = 'default';
        callbacks.clearHighlight();
      }
    })
    .onNodeRightClick((node: GraphNode, event: MouseEvent) => {
      event.preventDefault();
      callbacks.setContextMenuNode(node);
      callbacks.showContextMenu(event.clientX, event.clientY);
    })
    .onLinkHover((link: ForceGraphLink | null) => {
      if (link) {
        container.style.cursor = 'pointer';
      }
    });
  
  if (!usedSavedPositions) {
    setTimeout(() => {
      if (currentGraph) {
        const graphData = currentGraph.graphData();
        if (graphData && 'nodes' in graphData) {
          const nodes = graphData.nodes as GraphNode[];
          nodes.forEach((node, index) => {
            if (node.x === undefined || node.y === undefined || 
                isNaN(node.x) || isNaN(node.y) ||
                node.x === 0 || node.y === 0) {
              const angle = (index / nodes.length) * Math.PI * 2;
              const radius = Math.min(width, height) * GRAPH_CONSTANTS.NODE_POSITION_RADIUS_FACTOR;
              node.x = centerX + Math.cos(angle) * radius;
              node.y = centerY + Math.sin(angle) * radius;
              node.vx = 0;
              node.vy = 0;
            }
          });
          currentGraph.graphData({ nodes, links: linksWithNodes });
          setTimeout(() => {
            if (currentGraph) {
              currentGraph.zoomToFit(GRAPH_CONSTANTS.ZOOM_FIT_DURATION_MS);
            }
          }, GRAPH_CONSTANTS.ZOOM_FIT_DELAY_MS);
        }
      }
    }, GRAPH_CONSTANTS.ZOOM_FIT_DELAY_MS);
  }
  
  callbacks.setupZoomControls();
  
  if (shouldFitImmediately && autoFit && currentGraph) {
    setTimeout(() => {
      if (currentGraph) {
        currentGraph.zoomToFit(GRAPH_CONSTANTS.ZOOM_FIT_DURATION_MS);
        zoomToFitCalled = true;
      }
    }, GRAPH_CONSTANTS.ZOOM_FIT_DELAY_MS);
  }
  
  if (currentGraph) {
    callbacks.setPositionSavingCleanup(setupPositionSaving(currentGraph, lang));
  }
  
  if (autoFit) {
    setTimeout(() => {
      if (currentGraph && !zoomToFitCalled) {
        zoomToFitCalled = true;
        currentGraph.zoomToFit(GRAPH_CONSTANTS.ZOOM_FIT_DURATION_MS);
      }
    }, GRAPH_CONSTANTS.ZOOM_FIT_FALLBACK_MS);
  }
  
  setGraph(currentGraph);
  setAllData(data);
}
