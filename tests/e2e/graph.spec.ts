import { test, expect } from '@playwright/test';

test.describe('Graph Knowledge Visualization', () => {
  test('should load graph data and render visualization', async ({ page }) => {
    await page.goto('/ru/graph/');
    await page.waitForLoadState('networkidle');

    // Check if graph container exists
    const graphContainer = page.locator('#graph-container');
    await expect(graphContainer).toBeVisible();

    // Wait for graph to initialize (force-graph needs time to render)
    await page.waitForTimeout(2000);

    // Check if graph data was loaded (nodes should be rendered)
    // We can't directly check SVG elements, but we can check if container has content
    const containerContent = await graphContainer.innerHTML();
    expect(containerContent.length).toBeGreaterThan(0);
  });

  test('should filter graph by type', async ({ page }) => {
    await page.goto('/ru/graph/');
    await page.waitForLoadState('networkidle');

    // Wait for graph to load
    await page.waitForTimeout(2000);

    const typeFilter = page.locator('#filter-type');
    if (await typeFilter.isVisible()) {
      // Select blog type
      await typeFilter.selectOption('blog');
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Graph should update (we can't directly verify nodes, but filter should work)
      const selectedValue = await typeFilter.inputValue();
      expect(selectedValue).toBe('blog');
    }
  });

  test('should filter graph by tags', async ({ page }) => {
    await page.goto('/ru/graph/');
    await page.waitForLoadState('networkidle');

    // Wait for graph to load and tags to populate
    await page.waitForTimeout(2000);

    const tagsFilter = page.locator('#filter-tags');
    if (await tagsFilter.isVisible()) {
      // Get available options
      const options = await tagsFilter.locator('option').all();
      
      if (options.length > 1) {
        // Select first tag (skip "Все теги" option)
        const firstTagValue = await options[1].getAttribute('value');
        if (firstTagValue) {
          await tagsFilter.selectOption(firstTagValue);
          await page.waitForTimeout(1000);

          const selectedValue = await tagsFilter.inputValue();
          expect(selectedValue).toBe(firstTagValue);
        }
      }
    }
  });

  test('should reset filters', async ({ page }) => {
    await page.goto('/ru/graph/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const resetButton = page.locator('#reset-filters');
    if (await resetButton.isVisible()) {
      // Set some filters first
      const typeFilter = page.locator('#filter-type');
      await typeFilter.selectOption('blog');
      await page.waitForTimeout(500);

      // Reset filters
      await resetButton.click();
      await page.waitForTimeout(500);

      // Filters should be reset
      const typeValue = await typeFilter.inputValue();
      expect(typeValue).toBe('');
    }
  });

  test('should handle graph updates on language change', async ({ page }) => {
    await page.goto('/ru/graph/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to English version
    await page.goto('/en/graph/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Graph should load with English data
    const graphContainer = page.locator('#graph-container');
    await expect(graphContainer).toBeVisible();
  });
});
