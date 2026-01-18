/**
 * Экспорт графа в различные форматы
 */

import type { GraphData } from '@/types/graph';
import type { ForceGraphInstance } from '@/types/force-graph';
import { GRAPH_CONSTANTS } from './graph-constants';
import { escapeHtml } from './escape-html';

/**
 * Показать модальное окно экспорта
 */
export function showExportModal(
  graph: ForceGraphInstance | null,
  container: HTMLElement | null,
  lang: string,
  exportGraphAsImage: (
    format: 'png' | 'svg',
    pixelRatio: number,
    theme: 'light' | 'dark',
    watermark: boolean,
    privacyMode: boolean,
    transparentBg: boolean
  ) => Promise<void>
): void {
  if (!graph || !container) return;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.id = 'export-modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl';

  let format: 'png' | 'svg' = 'png';
  let pixelRatio = 2;
  let theme: 'light' | 'dark' =
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let watermark = false;
  let privacyMode = false;
  let transparentBg = false;

  // ⚠️ БЕЗОПАСНОСТЬ: innerHTML используется только со статическими строками
  modalContent.innerHTML = `
    <div class="mb-4">
      <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Настройки экспорта</h2>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Формат:
        </label>
        <select id="export-format" class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="png">PNG</option>
          <option value="svg">SVG</option>
        </select>
      </div>
      
      <div id="pixel-ratio-setting" class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Качество (pixel ratio): <span id="pixel-ratio-value">${escapeHtml(String(pixelRatio))}</span>
        </label>
        <input type="range" id="pixel-ratio-slider" min="0.5" max="5" step="0.1" value="${pixelRatio}" class="w-full">
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Тема:
        </label>
        <select id="export-theme" class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="light">Светлая</option>
          <option value="dark">Тёмная</option>
        </select>
      </div>
      
      <div class="mb-4">
        <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" id="export-watermark" class="mr-2">
          Добавить watermark
        </label>
      </div>
      
      <div class="mb-4">
        <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" id="export-privacy" class="mr-2">
          Режим приватности (затемнить текст)
        </label>
      </div>
      
      <div id="transparent-bg-setting" class="mb-4">
        <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" id="export-transparent" class="mr-2">
          Прозрачный фон
        </label>
      </div>
      
      <div class="flex gap-2 justify-end">
        <button id="export-cancel" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors">
          Отмена
        </button>
        <button id="export-save" class="px-4 py-2 bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white rounded-md transition-colors">
          Экспортировать
        </button>
      </div>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Обработчики событий
  const formatSelect = modalContent.querySelector('#export-format') as HTMLSelectElement;
  const pixelRatioSlider = modalContent.querySelector('#pixel-ratio-slider') as HTMLInputElement;
  const pixelRatioValue = modalContent.querySelector('#pixel-ratio-value') as HTMLElement;
  const pixelRatioSetting = modalContent.querySelector('#pixel-ratio-setting') as HTMLElement;
  const transparentBgSetting = modalContent.querySelector('#transparent-bg-setting') as HTMLElement;

  formatSelect.addEventListener('change', (e) => {
    format = (e.target as HTMLSelectElement).value as 'png' | 'svg';
    if (format === 'svg') {
      pixelRatioSetting.style.display = 'none';
      transparentBgSetting.style.display = 'none';
    } else {
      pixelRatioSetting.style.display = 'block';
      transparentBgSetting.style.display = 'block';
    }
  });

  pixelRatioSlider.addEventListener('input', (e) => {
    pixelRatio = parseFloat((e.target as HTMLInputElement).value);
    pixelRatioValue.textContent = pixelRatio.toFixed(1);
  });

  modalContent.querySelector('#export-cancel')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modalContent.querySelector('#export-save')?.addEventListener('click', async () => {
    theme = (modalContent.querySelector('#export-theme') as HTMLSelectElement).value as 'light' | 'dark';
    watermark = (modalContent.querySelector('#export-watermark') as HTMLInputElement).checked;
    privacyMode = (modalContent.querySelector('#export-privacy') as HTMLInputElement).checked;
    transparentBg = (modalContent.querySelector('#export-transparent') as HTMLInputElement).checked;

    document.body.removeChild(modal);
    await exportGraphAsImage(format, pixelRatio, theme, watermark, privacyMode, transparentBg);
  });

  // Закрыть при клике вне модального окна
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * Экспорт графа в изображение
 */
export async function exportGraphAsImage(
  graph: ForceGraphInstance,
  container: HTMLElement,
  lang: string,
  format: 'png' | 'svg' = 'png',
  pixelRatio: number = 2,
  theme: 'light' | 'dark' = 'light',
  watermark: boolean = false,
  privacyMode: boolean = false,
  transparentBg: boolean = false,
  showNotification: (message: string, type: 'success' | 'warning' | 'error') => void
): Promise<void> {
  try {
    const { toPng, toSvg } = await import('html-to-image');

    // Сохранить текущую тему
    const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';

    // Установить тему для экспорта
    if (theme !== currentTheme) {
      document.body.classList.toggle('theme-dark', theme === 'dark');
      document.body.classList.toggle('theme-light', theme === 'light');
      await new Promise((resolve) =>
        setTimeout(resolve, GRAPH_CONSTANTS.EXPORT_THEME_SWITCH_DELAY_MS)
      );
    }

    // Сбросить zoom для полного отображения
    graph.zoomToFit(GRAPH_CONSTANTS.ZOOM_FIT_DURATION_MS);
    await new Promise((resolve) =>
      setTimeout(resolve, GRAPH_CONSTANTS.EXPORT_ZOOM_FIT_DELAY_MS)
    );

    // Применить privacy mode
    if (privacyMode) {
      container.classList.add('privacy-mode');
    }

    const options: {
      quality: number;
      pixelRatio?: number;
      backgroundColor?: string;
      cacheBust: boolean;
      filter: (node: Node) => boolean;
    } = {
      quality: 1.0,
      pixelRatio: format === 'png' ? pixelRatio : undefined,
      backgroundColor:
        transparentBg && format === 'png'
          ? undefined
          : theme === 'dark'
            ? '#1f2937'
            : '#ffffff',
      cacheBust: true,
      filter: (node: Node) => {
        return (
          !(node as Element).id?.includes('context-menu') &&
          !(node as Element).id?.includes('export-modal')
        );
      },
    };

    const dataUrl =
      format === 'png' ? await toPng(container, options) : await toSvg(container, options);

    // Восстановить тему
    if (theme !== currentTheme) {
      document.body.classList.toggle('theme-dark', currentTheme === 'dark');
      document.body.classList.toggle('theme-light', currentTheme === 'light');
    }

    // Убрать privacy mode
    if (privacyMode) {
      container.classList.remove('privacy-mode');
    }

    // Добавить watermark (если нужно)
    let finalDataUrl = dataUrl;
    if (watermark && format === 'png') {
      // Можно добавить watermark через canvas
      // Пока пропускаем, так как это сложнее
    }

    // Скачать изображение
    const link = document.createElement('a');
    link.download = `graph-knowledge-${lang}-${new Date().toISOString().split('T')[0]}.${format}`;
    link.href = finalDataUrl;
    link.click();

    showNotification('Граф экспортирован!', 'success');
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Export error:', error);
    }
    showNotification('Ошибка экспорта. Проверьте консоль для деталей.', 'error');
  }
}

/**
 * Экспорт графа в JSON
 */
export function exportGraphAsJson(
  allData: GraphData,
  lang: string,
  showNotification: (message: string, type: 'success' | 'warning' | 'error') => void
): void {
  try {
    const exportData = {
      nodes: allData.nodes,
      edges: allData.edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        language: lang,
        nodeCount: allData.nodes.length,
        edgeCount: allData.edges.length,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-knowledge-${lang}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Граф экспортирован в JSON!', 'success');
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Export JSON error:', error);
    }
    showNotification('Ошибка экспорта JSON', 'error');
  }
}
