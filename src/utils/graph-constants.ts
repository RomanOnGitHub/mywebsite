/**
 * Константы для графа знаний
 * Централизованное хранение всех магических чисел и строк
 */

export const GRAPH_CONSTANTS = {
  // Debounce таймауты
  DEBOUNCE_FILTER_MS: 150,
  DEBOUNCE_SEARCH_MS: 300,
  
  // Zoom и fit
  ZOOM_FIT_DURATION_MS: 400,
  ZOOM_FIT_DELAY_MS: 100,
  ZOOM_FIT_FALLBACK_MS: 2000,
  
  // Стабилизация графа
  STABILIZATION_ALPHA_THRESHOLD: 0.01,
  STABLE_TICKS_REQUIRED: 5,
  STABILIZATION_CHECK_DELAY_MS: 50,
  
  // Границы и отступы
  BOUNDING_BOX_MARGIN: 30,
  BOUNDING_POSITION_MARGIN_CHECK: 100, // Для валидации сохранённых позиций
  OVERSHOOT_THRESHOLD_PX: 50, // Порог для прямой коррекции позиции
  
  // Коэффициенты коррекции границ
  BOUNDING_CORRECTION_STRENGTH_NORMAL: 0.2,
  BOUNDING_CORRECTION_STRENGTH_STRONG: 0.5,
  
  // Начальные позиции узлов
  NODE_POSITION_RADIUS_FACTOR: 0.15, // Радиус распределения узлов (от размера контейнера)
  NODE_SIZE_MIN: 5,
  NODE_SIZE_MAX: 20,
  NODE_SIZE_CONNECTION_FACTOR: 2, // Множитель для размера узла на основе связей
  
  // Силы D3
  FORCE_CENTER_X: 0.5, // Относительная позиция центра (0.5 = центр)
  FORCE_CENTER_Y: 0.5,
  FORCE_CHARGE_STRENGTH: -300,
  FORCE_LINK_DISTANCE: 100,
  FORCE_COOLDOWN_TICKS: 200,
  
  // Сохранение позиций
  SAVE_POSITIONS_DELAY_MS: 2000,
  SAVE_POSITIONS_CHECK_INTERVAL_MS: 5000,
  POSITION_VALIDATION_MULTIPLIER: 5, // Границы валидации = размер контейнера * множитель
  
  // Размеры по умолчанию
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,
  
  // Цвета узлов
  NODE_COLORS: {
    blog: '#3b82f6',
    cases: '#10b981',
    services: '#f59e0b',
    industries: '#8b5cf6',
    default: '#6b7280',
  } as const,
  
  // Цвета рёбер
  LINK_COLORS: {
    explicit: 'rgba(96, 165, 250, 0.8)', // blue-400
    outbound: 'rgba(148, 163, 184, 0.8)', // slate-400
  } as const,
  
  // Ширина рёбер
  LINK_WIDTH: {
    explicit: 2,
    outbound: 1.5,
  } as const,
  
  // Стрелки
  LINK_ARROW_LENGTH: 6,
  LINK_ARROW_REL_POS: 1,
  
  // История навигации
  NAVIGATION_HISTORY_MAX: 50,
  
  // LocalStorage ключи
  STORAGE_KEY_POSITIONS: (lang: string) => `graph-positions-${lang}`,
} as const;
