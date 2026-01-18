/**
 * Управление обработчиками событий для графа знаний
 * Предотвращает memory leaks при View Transitions
 */

export class GraphEventHandlers {
  private handlers: Array<{
    element: Document | HTMLElement;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = [];

  /**
   * Добавить обработчик события с автоматическим отслеживанием
   */
  addEventListener(
    element: Document | HTMLElement,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.handlers.push({ element, event, handler, options });
  }

  /**
   * Удалить конкретный обработчик
   */
  removeEventListener(
    element: Document | HTMLElement,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.removeEventListener(event, handler, options);
    this.handlers = this.handlers.filter(
      (h) =>
        h.element !== element ||
        h.event !== event ||
        h.handler !== handler
    );
  }

  /**
   * Удалить все обработчики
   */
  removeAll(): void {
    this.handlers.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.handlers = [];
  }

  /**
   * Получить количество активных обработчиков
   */
  getCount(): number {
    return this.handlers.length;
  }
}
