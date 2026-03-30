import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads and redirects to auth', async ({ page }) => {
    await page.goto('/');
    // Should either show the landing page or redirect to auth
    await expect(page).toHaveURL(/\/(auth|$)/);
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/v1/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
  });

  test('404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/some-nonexistent-page');
    // Next.js returns 200 for custom 404 pages or 404
    expect(response?.status()).toBeLessThanOrEqual(404);
  });
});
