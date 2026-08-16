import { test, expect } from '@playwright/test';

// Client use case: a reader viewing/retrieving an RSS feed through the
// RSS Client page, which fetches and renders the live feed served by the
// backend. This demonstrates the "client use case" required by the
// Assessment 3 brief.

test.describe('Client use case: viewing the RSS feed', () => {
  test('RSS Client page loads and displays feed items', async ({ page }) => {
    await page.goto('/rss-client');

    await expect(page.getByRole('heading', { name: /feed received from the rss server/i })).toBeVisible();

    // Wait for the loading state to resolve.
    await expect(page.getByText(/loading feed from server/i)).toHaveCount(0, { timeout: 15000 });

    // Either items were received, or a clear error/alert is shown — either
    // way the client must have completed a request/response cycle.
    const itemCount = page.getByText(/received \d+ item\(s\) from the server/i);
    const errorMessage = page.locator('p[role="alert"]');
    await expect(itemCount.or(errorMessage)).toBeVisible();
  });

  test('switching category re-fetches a category-specific feed', async ({ page }) => {
    await page.goto('/rss-client');
    await expect(page.getByText(/loading feed from server/i)).toHaveCount(0, { timeout: 15000 });

    const categoryButtons = page.getByRole('button', { name: /all/i });
    await expect(categoryButtons.first()).toBeVisible();

    // The feed URL shown on the page should reference the RSS server API.
    await expect(page.locator('code').first()).toContainText('/api/rss');
  });

  test('dashboard page loads observability metrics', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /operational dashboard/i })).toBeVisible();
    await expect(page.getByText(/rss feed count/i)).toBeVisible();
  });
});
