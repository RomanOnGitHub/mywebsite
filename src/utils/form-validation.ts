import { z } from 'zod';

/**
 * Zod схема для валидации формы запроса перевода
 * Используется на клиенте для типобезопасной валидации
 */
export const translationRequestSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
  message: z.string().optional(),
  slug: z.string().min(1, 'Slug обязателен'),
  collection: z.string().min(1, 'Collection обязательна'),
  requested_lang: z.string().min(1, 'Язык обязателен'),
});

export type TranslationRequestInput = z.infer<typeof translationRequestSchema>;

/**
 * Валидирует данные формы на клиенте
 * @param data - данные формы
 * @returns результат валидации с ошибками (если есть)
 */
export function validateTranslationRequest(data: unknown): {
  success: boolean;
  data?: TranslationRequestInput;
  errors?: Record<string, string>;
} {
  const result = translationRequestSchema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  // Преобразуем Zod ошибки в объект с полями
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return {
    success: false,
    errors,
  };
}
