/**
 * Кэш для данных графа знаний с использованием Cache API браузера
 * 
 * Преимущества Cache API:
 * - Нативное кэширование браузера
 * - Работает даже при перезагрузке страницы
 * - Автоматическая инвалидация через Cache-Control headers
 * - Не загрязняет window объект
 * - Поддержка TTL и версионирования
 * 
 * ⚠️ ВАЖНО: Перед коммитом проверьте Network requests в DevTools
 * - Откройте DevTools → Network → фильтр "graph-data"
 * - Убедитесь, что нет дублирования запросов при навигации
 * - Проверьте, что кэш работает (второй запрос должен быть из cache)
 * - Если видите дублирование - проверьте, что все компоненты используют общий кэш
 */

import { type GraphData, type MinifiedGraphData, type GraphNode, type GraphEdge, TYPE_MAPPING } from '@/types/graph';
import { fetchWithTimeout } from './fetch-with-timeout';

// Проверка доступности Cache API
const CACHE_AVAILABLE = typeof window !== 'undefined' && 'caches' in window;

// Версия кэша для инвалидации при обновлении структуры данных
const CACHE_VERSION = 'v1';
const CACHE_NAME = `graph-data-${CACHE_VERSION}`;

// TTL для кэша (5 минут)
const CACHE_TTL = 5 * 60 * 1000;

// Максимальное количество языков в памяти (LRU eviction)
const MAX_CACHED_LANGUAGES = 5;

// Метрики для мониторинга (только в dev режиме)
interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  evictions: number;
}

const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,
  evictions: 0,
};

// In-memory кэш для быстрого доступа (дополнительно к Cache API)
interface CacheEntry {
  data: GraphData;
  timestamp: number;
  url: string;
}

const memoryCache = new Map<string, CacheEntry>();

/**
 * Очистка устаревших записей из памяти
 */
function cleanupMemoryCache(): void {
  const now = Date.now();
  const entries = Array.from(memoryCache.entries());
  
  // Удаляем устаревшие записи
  for (const [key, entry] of entries) {
    if (now - entry.timestamp > CACHE_TTL) {
      memoryCache.delete(key);
      if (import.meta.env.DEV) {
        metrics.evictions++;
      }
    }
  }
  
  // LRU eviction: если записей больше MAX_CACHED_LANGUAGES, удаляем самые старые
  if (memoryCache.size > MAX_CACHED_LANGUAGES) {
    const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = sorted.slice(0, memoryCache.size - MAX_CACHED_LANGUAGES);
    for (const [key] of toRemove) {
      memoryCache.delete(key);
      if (import.meta.env.DEV) {
        metrics.evictions++;
      }
    }
  }
}

/**
 * Получить данные графа с кэшированием
 * 
 * @param lang - Язык для загрузки данных
 * @param forceRefresh - Принудительное обновление кэша
 * @returns Promise с данными графа
 */
export async function getGraphData(
  lang: string,
  forceRefresh: boolean = false
): Promise<GraphData> {
  // Проверка SSR окружения
  if (typeof window === 'undefined') {
    throw new Error('getGraphData can only be called in browser environment');
  }

  const url = `/graph-data-${lang}.json`;
  
  // Проверка in-memory кэша (быстрый доступ)
  if (!forceRefresh) {
    const memoryEntry = memoryCache.get(lang);
    if (memoryEntry) {
      const age = Date.now() - memoryEntry.timestamp;
      if (age < CACHE_TTL) {
        if (import.meta.env.DEV) {
          metrics.hits++;
        }
        return memoryEntry.data;
      } else {
        // Запись устарела, удаляем
        memoryCache.delete(lang);
      }
    }
  }

  // Если Cache API доступен, используем его
  if (CACHE_AVAILABLE) {
    try {
      const cache = await caches.open(CACHE_NAME);
      
      if (!forceRefresh) {
        // Проверяем кэш браузера
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          // Данные в кэше уже распакованные или нет?
          // Cache API хранит Response объект. Если мы туда положили response.clone(), то там лежит сырой JSON.
          // Сырой JSON теперь минифицирован (MinifiedGraphData).
          // Нам нужно его распаковать (inflate) перед возвратом.

          const minifiedData = await cachedResponse.json() as MinifiedGraphData;
          const cacheDate = cachedResponse.headers.get('date');
          
          // Проверяем TTL
          if (cacheDate) {
            const cacheTimestamp = new Date(cacheDate).getTime();
            const age = Date.now() - cacheTimestamp;
            
            if (age < CACHE_TTL) {
              const data = inflateGraphData(minifiedData);

              // Сохраняем в memory cache для быстрого доступа
              memoryCache.set(lang, {
                data,
                timestamp: Date.now(),
                url,
              });
              
              if (import.meta.env.DEV) {
                metrics.hits++;
              }
              
              cleanupMemoryCache();
              return data;
            }
          }
        }
      }
      
      // Загружаем свежие данные
      if (import.meta.env.DEV) {
        metrics.misses++;
      }
      
      const response = await fetchWithTimeout(url, {}, 10000);
      
      if (!response.ok) {
        throw new Error(`Failed to load graph data: ${response.status} ${response.statusText}`);
      }
      
      // Сохраняем в Cache API (сырой ответ)
      const responseToCache = response.clone();
      await cache.put(url, responseToCache);
      
      const minifiedData = await response.json() as MinifiedGraphData;
      const data = inflateGraphData(minifiedData);

      // Сохраняем в memory cache
      memoryCache.set(lang, {
        data,
        timestamp: Date.now(),
        url,
      });
      
      cleanupMemoryCache();
      return data;
      
    } catch (error) {
      if (import.meta.env.DEV) {
        metrics.errors++;
        console.error('Graph cache error:', error);
      }
      
      // Fallback: если Cache API недоступен или произошла ошибка,
      // пробуем загрузить напрямую
      const response = await fetchWithTimeout(url, {}, 10000);
      if (!response.ok) {
        throw new Error(`Failed to load graph data: ${response.status}`);
      }
      
      const minifiedData = await response.json() as MinifiedGraphData;
      const data = inflateGraphData(minifiedData);
      
      // Сохраняем в memory cache даже при ошибке Cache API
      memoryCache.set(lang, {
        data,
        timestamp: Date.now(),
        url,
      });
      
      return data;
    }
  } else {
    // Fallback: Cache API недоступен, используем только memory cache
    if (import.meta.env.DEV) {
      metrics.misses++;
    }
    
    const response = await fetchWithTimeout(url, {}, 10000);
    if (!response.ok) {
      throw new Error(`Failed to load graph data: ${response.status}`);
    }
    
    const minifiedData = await response.json() as MinifiedGraphData;
    const data = inflateGraphData(minifiedData);
    
    memoryCache.set(lang, {
      data,
      timestamp: Date.now(),
      url,
    });
    
    cleanupMemoryCache();
    return data;
  }
}

/**
 * Очистить кэш для конкретного языка
 * 
 * @param lang - Язык для очистки кэша
 */
export async function clearGraphCache(lang?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  if (lang) {
    // Очистить конкретный язык
    memoryCache.delete(lang);
    
    if (CACHE_AVAILABLE) {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(`/graph-data-${lang}.json`);
    }
  } else {
    // Очистить весь кэш
    memoryCache.clear();
    
    if (CACHE_AVAILABLE) {
      await caches.delete(CACHE_NAME);
    }
  }
}

/**
 * Получить метрики кэша (только в dev режиме)
 */
export function getCacheMetrics(): CacheMetrics | null {
  if (import.meta.env.DEV) {
    return { ...metrics };
  }
  return null;
}

/**
 * Сбросить метрики
 */
export function resetCacheMetrics(): void {
  if (import.meta.env.DEV) {
    metrics.hits = 0;
    metrics.misses = 0;
    metrics.errors = 0;
    metrics.evictions = 0;
  }
}

/**
 * Распаковка минифицированных данных в полный формат
 */
function inflateGraphData(minified: MinifiedGraphData): GraphData {
  const nodes: GraphNode[] = minified.n.map(n => ({
    id: n.i,
    title: n.t,
    type: TYPE_MAPPING[n.c] || 'blog', // fallback to blog if unknown
    tags: n.g || []
  }));

  const edges: GraphEdge[] = minified.e.map(e => ({
    from: e.f,
    to: e.t,
    relation: e.s === 1 ? 'o' : 'e' // 1=o (outbound), 0=e (explicit)
  }));

  return { nodes, edges };
}

// Логирование метрик в dev режиме (каждые 30 секунд)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  setInterval(() => {
    const cacheMetrics = getCacheMetrics();
    if (cacheMetrics && (cacheMetrics.hits > 0 || cacheMetrics.misses > 0)) {
      const total = cacheMetrics.hits + cacheMetrics.misses;
      const hitRate = total > 0 ? ((cacheMetrics.hits / total) * 100).toFixed(1) : '0';
      console.log(`[Graph Cache] Hits: ${cacheMetrics.hits}, Misses: ${cacheMetrics.misses}, Hit Rate: ${hitRate}%, Errors: ${cacheMetrics.errors}, Evictions: ${cacheMetrics.evictions}`);
    }
  }, 30000);
}
