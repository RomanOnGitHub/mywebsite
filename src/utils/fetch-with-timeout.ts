/**
 * Утилита для безопасных fetch запросов с timeout и обработкой ошибок
 * 
 * @param url - URL для запроса
 * @param options - Опции fetch (method, headers, body и т.д.)
 * @param timeoutMs - Timeout в миллисекундах (по умолчанию 10000)
 * @returns Promise с Response или выбрасывает ошибку
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      // Пробрасываем network errors и другие ошибки
      throw error;
    }

    throw new Error('Unknown error during fetch');
  }
}
