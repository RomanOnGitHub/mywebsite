declare module 'force-graph' {
  import type { ForceGraphInstance } from '@/types/force-graph';
  const createGraph: (container: HTMLElement) => ForceGraphInstance;
  export default createGraph;
}

declare module 'd3-force' {
  import type { ForceCenter, ForceManyBody, ForceLink, ForceGraphLink } from '@/types/force-graph';
  export function forceCenter(x?: number, y?: number): ForceCenter;
  export function forceManyBody(): ForceManyBody;
  export function forceLink(links?: ForceGraphLink[]): ForceLink;
}
