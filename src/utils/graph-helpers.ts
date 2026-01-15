/**
 * Helper функции для работы с минифицированной структурой графа
 * 
 * После минификации JSON структуры поля lang и slug удалены из GraphNode,
 * поэтому они извлекаются из id или контекста.
 */

/**
 * Парсит id узла и извлекает collection и slug
 * 
 * @param id - ID узла в формате "collection/slug" (например, "blog/my-post")
 * @returns Объект с collection и slug
 * 
 * @example
 * parseNodeId("blog/my-post") // { collection: "blog", slug: "my-post" }
 * parseNodeId("cases/test-case") // { collection: "cases", slug: "test-case" }
 */
export function parseNodeId(id: string): { collection: string; slug: string } {
  const parts = id.split('/');
  if (parts.length < 2) {
    // Fallback для некорректных ID
    return { collection: 'blog', slug: id };
  }
  
  const collection = parts[0];
  const slug = parts.slice(1).join('/');
  
  return { collection, slug };
}

/**
 * Извлекает язык из имени файла graph-data
 * 
 * @param fileName - Имя файла (например, "graph-data-ru.json" или "/graph-data-en.json")
 * @returns Код языка или 'ru' по умолчанию
 * 
 * @example
 * getNodeLangFromFileName("graph-data-ru.json") // "ru"
 * getNodeLangFromFileName("/graph-data-en.json") // "en"
 */
export function getNodeLangFromFileName(fileName: string): string {
  const match = fileName.match(/graph-data-([^.]+)\.json/);
  return match ? match[1] : 'ru';
}

/**
 * Извлекает язык из URL запроса
 * 
 * @param url - URL запроса (например, "/graph-data-ru.json")
 * @returns Код языка или 'ru' по умолчанию
 * 
 * @example
 * getNodeLangFromUrl("/graph-data-ru.json") // "ru"
 * getNodeLangFromUrl("https://example.com/graph-data-en.json") // "en"
 */
export function getNodeLangFromUrl(url: string): string {
  return getNodeLangFromFileName(url);
}
