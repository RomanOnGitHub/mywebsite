import { fetchWithTimeout } from './fetch-with-timeout';

// Cache to store promises of graph data by URL
// This module will be evaluated once and the cache will persist
// as long as the application (SPA) is running.
// We use a global variable to ensure persistence across module re-evaluations
// which can happen in some HMR or Astro View Transition scenarios.
const globalScope = typeof window !== 'undefined' ? window : globalThis;
const CACHE_KEY = '__GRAPH_CACHE__';

const graphCache = (globalScope as any)[CACHE_KEY] || new Map<string, Promise<any>>();
(globalScope as any)[CACHE_KEY] = graphCache;

/**
 * Fetches and caches graph data for a specific language.
 *
 * @param lang - The language code (e.g., 'ru', 'en')
 * @returns Promise resolving to the graph data
 */
export function getGraphData(lang: string): Promise<any> {
  const url = `/graph-data-${lang}.json`;

  let graphPromise = graphCache.get(url);

  if (!graphPromise) {
    graphPromise = (async () => {
      const res = await fetchWithTimeout(url, {}, 10000);
      return res.json();
    })();

    graphCache.set(url, graphPromise);

    // If the promise fails, remove it from the cache so we can retry later
    graphPromise.catch(() => {
      graphCache.delete(url);
    });
  }

  return graphPromise;
}
