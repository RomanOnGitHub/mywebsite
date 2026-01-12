/**
 * Утилиты для форматирования данных
 * Заимствовано из ScrewFast-main с улучшениями
 */

/**
 * Форматирует дату в локализованную строку
 * @param date - Дата для форматирования
 * @param locale - Локаль для форматирования (по умолчанию 'ru')
 * @param options - Опции форматирования
 * @returns Отформатированная строка даты
 */
export function formatDate(
  date: Date,
  locale: string = 'ru',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  return new Date(date).toLocaleDateString(locale, options);
}

/**
 * Делает первую букву строки заглавной
 * @param str - Строка для капитализации
 * @returns Строка с заглавной первой буквой
 */
export function capitalize(str: string): string {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Форматирует дату для использования в <time datetime>
 * @param date - Дата для форматирования
 * @returns ISO строка даты
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}
