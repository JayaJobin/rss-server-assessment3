import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe.serial('Server use case: Feed Source CRUD', () => {
  let createdId: number | undefined;
  const uniqueUrl = `https://example.edu/feeds/playwright-${Date.now()}.xml`;

  test('health check returns 200 OK', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('creates a new feed source', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/feedsources`, {
      data: { name: 'Playwright Test Feed', url: uniqueUrl },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Playwright Test Feed');
    createdId = body.id;
  });

  test('reads back the created feed source', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/feedsources`);
    expect(res.ok()).toBeTruthy();
    const list = await res.json();
    const found = list.find((f: { url: string }) => f.url === uniqueUrl);
    expect(found).toBeTruthy();
    createdId = found.id;
  });

  test('updates the feed source', async ({ request }) => {
    expect(createdId, 'createdId should be set by the earlier create/read step').toBeDefined();
    const res = await request.patch(`${API_BASE_URL}/api/feedsources?id=${createdId}`, {
      data: { name: 'Playwright Test Feed (updated)' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.name).toBe('Playwright Test Feed (updated)');
  });

  test('deletes the feed source', async ({ request }) => {
    expect(createdId, 'createdId should be set by the earlier create/read step').toBeDefined();
    const res = await request.delete(`${API_BASE_URL}/api/feedsources?id=${createdId}`);
    expect(res.status()).toBe(204);
    createdId = undefined;
  });

  test('stats endpoint reports observability metrics', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/stats`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('totalFeedSources');
    expect(body).toHaveProperty('totalApiRequests');
    expect(body).toHaveProperty('requestsPerFeed');
    expect(body).toHaveProperty('feedStatuses');
  });

  test.afterAll(async ({ request }) => {
    if (createdId !== undefined) {
      await request.delete(`${API_BASE_URL}/api/feedsources?id=${createdId}`).catch(() => {});
    }
  });
});
