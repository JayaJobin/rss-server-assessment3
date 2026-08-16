import { feedSourceRepository } from '@/app/lib/repositories/feedSourceRepository';
import { postRepository } from '@/app/lib/repositories/postRepository';
import { requestLogRepository } from '@/app/lib/repositories/requestLogRepository';
import { feedStatusRepository } from '@/app/lib/repositories/feedStatusRepository';
import { getRequestCount } from '@/app/lib/requestCounter';
import { jsonOk, withErrorHandling } from '@/app/lib/apiResponse';
import { corsPreflight } from '@/app/lib/cors';

export const OPTIONS = corsPreflight;

export async function GET() {
  return withErrorHandling(async () => {
    const [
      totalFeedSources,
      totalPosts,
      totalApiRequests,
      totalLoggedRequests,
      uniqueClientCount,
      requestsPerFeed,
      requestsPerClient,
      feedStatuses,
    ] = await Promise.all([
      feedSourceRepository.count(),
      postRepository.count(),
      getRequestCount(),
      requestLogRepository.totalCount(),
      requestLogRepository.uniqueClientCount(),
      requestLogRepository.requestsPerFeed(),
      requestLogRepository.requestsPerClient(),
      feedStatusRepository.findAll(),
    ]);

    return jsonOk({
      health: 'ok',
      totalFeedSources,
      totalPosts,
      totalApiRequests,
      totalLoggedRequests,
      uniqueClientCount,
      requestsPerFeed,
      requestsPerClient,
      feedStatuses: feedStatuses.map((f) => ({
        feedSourceId: f.feedSourceId,
        label: f.label,
        status: f.status,
        message: f.message,
        lastCheckedAt: f.lastCheckedAt,
      })),
      generatedAt: new Date().toISOString(),
    });
  });
}
