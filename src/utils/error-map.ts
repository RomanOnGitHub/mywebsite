import { z } from 'zod';

/**
 * Friendly error messages для Zod валидации
 */
export const errorMap: z.ZodErrorMap = (issue, ctx) => {
  let message: string;

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') {
        message = 'Поле обязательно для заполнения';
      } else {
        message = `Ожидается ${issue.expected}, получено ${issue.received}`;
      }
      break;
    
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        message = 'Некорректный email адрес';
      } else if (issue.validation === 'url') {
        message = 'Некорректный URL';
      } else {
        message = 'Некорректная строка';
      }
      break;
    
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        message = `Минимальная длина: ${issue.minimum} символов`;
      } else if (issue.type === 'array') {
        message = `Минимум элементов: ${issue.minimum}`;
      } else {
        message = `Минимальное значение: ${issue.minimum}`;
      }
      break;
    
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        message = `Максимальная длина: ${issue.maximum} символов`;
      } else if (issue.type === 'array') {
        message = `Максимум элементов: ${issue.maximum}`;
      } else {
        message = `Максимальное значение: ${issue.maximum}`;
      }
      break;
    
    case z.ZodIssueCode.invalid_date:
      message = 'Некорректная дата';
      break;
    
    case z.ZodIssueCode.custom:
      message = issue.message || 'Ошибка валидации';
      break;
    
    default:
      message = ctx.defaultError;
  }

  return { message };
};

/**
 * Парсинг с friendly error messages
 */
export function parseWithFriendlyErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const friendlyErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      
      throw new Error(
        `Ошибки валидации:\n${friendlyErrors.map(e => `  - ${e.path}: ${e.message}`).join('\n')}`
      );
    }
    throw error;
  }
}
