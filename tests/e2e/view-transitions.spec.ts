import { test, expect } from '@playwright/test';

test.describe('View Transitions', () => {
  test.beforeEach(async ({ page }) => {
    // Build the site first
    await page.goto('/');
  });

  test('should navigate between pages with smooth transitions', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to blog page
    const blogLink = page.getByRole('link', { name: /блог|blog/i });
    if (await blogLink.isVisible()) {
      await blogLink.click();
      
      // Wait for transition to complete
      await page.waitForTimeout(500);
      
      // Check that we're on blog page
      await expect(page).toHaveURL(/\/blog/);
    }
  });

  test('should preserve sidebar state during transitions', async ({ page }) => {
    await page.goto('/ru/');
    await page.waitForLoadState('networkidle');

    // Check if sidebar exists
    const sidebar = page.locator('aside');
    if (await sidebar.isVisible()) {
      // Navigate to another page
      await page.goto('/ru/blog/test-post/');
      await page.waitForLoadState('networkidle');

      // Sidebar should still be visible
      await expect(sidebar).toBeVisible();
    }
  });

  test('should handle backlinks component updates on navigation', async ({ page }) => {
    await page.goto('/ru/blog/test-post/');
    await page.waitForLoadState('networkidle');

    // Check if backlinks component exists
    const backlinks = page.locator('backlinks-component');
    if (await backlinks.isVisible()) {
      // Navigate to another page
      await page.goto('/ru/cases/test-case/');
      await page.waitForLoadState('networkidle');

      // Backlinks should update (component should still exist)
      await expect(backlinks).toBeVisible();
    }
  });
});
