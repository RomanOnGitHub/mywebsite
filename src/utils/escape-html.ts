/**
 * Централизованная утилита для экранирования HTML
 * Используется для предотвращения XSS атак
 */

/**
 * Экранирует специальные HTML символы в строке
 * @param text - Текст для экранирования
 * @returns Экранированная строка
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
