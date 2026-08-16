import { NextRequest } from 'next/server';

/**
 * Derives a client identifier for observability purposes.
 *
 * Priority:
 *  1. An explicit `x-client-id` header, if the caller (e.g. the RSS client
 *     page, or a JMeter test plan) sets one — this is the most reliable way
 *     to distinguish simulated clients from each other.
 *  2. The `x-forwarded-for` header (set by most proxies / load balancers).
 *  3. A fallback constant, so requests are still counted even when no
 *     identifying header is present.
 *
 * This is used purely for dashboard/observability metrics (unique client
 * counts, requests-per-client) — it is not used for authentication.
 */
export function getClientId(request: NextRequest): string {
  const explicit = request.headers.get('x-client-id');
  if (explicit) return explicit.slice(0, 100);

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return 'unknown-client';
}
