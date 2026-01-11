/**
 * Утилиты для защиты формы от ботов
 */

const RATE_LIMIT_KEY = 'form_submission_times';
const MIN_FORM_TIME = 3000; // Минимальное время заполнения формы (3 секунды)
const MAX_SUBMISSIONS_PER_HOUR = 5; // Максимум отправок в час
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 час в миллисекундах

interface SubmissionRecord {
  timestamp: number;
  count: number;
}

/**
 * Проверяет rate limiting (ограничение частоты отправок)
 * @returns true если можно отправить, false если превышен лимит
 */
export function checkRateLimit(): { allowed: boolean; message?: string } {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    
    if (!stored) {
      // Первая отправка - сохраняем запись
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
        timestamp: now,
        count: 1,
      }));
      return { allowed: true };
    }
    
    const record: SubmissionRecord = JSON.parse(stored);
    const timeSinceFirst = now - record.timestamp;
    
    if (timeSinceFirst > RATE_LIMIT_WINDOW) {
      // Окно истекло - сбрасываем счетчик
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
        timestamp: now,
        count: 1,
      }));
      return { allowed: true };
    }
    
    // Проверяем количество отправок
    if (record.count >= MAX_SUBMISSIONS_PER_HOUR) {
      const remainingMinutes = Math.ceil((RATE_LIMIT_WINDOW - timeSinceFirst) / (60 * 1000));
      return {
        allowed: false,
        message: `Слишком много запросов. Попробуйте через ${remainingMinutes} минут.`,
      };
    }
    
    // Увеличиваем счетчик
    record.count += 1;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(record));
    return { allowed: true };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // В случае ошибки разрешаем отправку (не блокируем пользователя)
    return { allowed: true };
  }
}

/**
 * Проверяет время заполнения формы
 * @param formStartTime - время начала заполнения формы
 * @returns true если время заполнения достаточное, false если слишком быстро
 */
export function checkFormTime(formStartTime: number): { valid: boolean; message?: string } {
  const timeSpent = Date.now() - formStartTime;
  
  if (timeSpent < MIN_FORM_TIME) {
    return {
      valid: false,
      message: 'Форма заполнена слишком быстро. Пожалуйста, заполните все поля внимательно.',
    };
  }
  
  return { valid: true };
}

/**
 * Инициализирует отслеживание времени заполнения формы
 * @returns timestamp начала заполнения
 */
export function initFormTimer(): number {
  return Date.now();
}

/**
 * Проверяет, что форма отправлена через JavaScript
 * Добавляет скрытое поле с токеном, который проверяется при отправке
 * @returns токен для проверки
 */
export function generateJSToken(): string {
  // Генерируем простой токен на основе времени и случайного числа
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Проверяет валидность JS токена
 * @param token - токен для проверки
 * @param formStartTime - время начала заполнения формы
 * @returns true если токен валиден
 */
export function validateJSToken(token: string, formStartTime: number): boolean {
  if (!token) return false;
  
  // Токен должен содержать timestamp
  const parts = token.split('-');
  if (parts.length < 2) return false;
  
  const tokenTime = parseInt(parts[0], 10);
  if (isNaN(tokenTime)) return false;
  
  // Токен должен быть создан после начала заполнения формы
  // и не слишком старый (не более 10 минут)
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 минут
  
  return tokenTime >= formStartTime && (now - tokenTime) < maxAge;
}
