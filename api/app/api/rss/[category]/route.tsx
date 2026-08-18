import { NextRequest, NextResponse } from 'next/server';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { postRepository } from '@/app/lib/repositories/postRepository';
import { requestLogRepository } from '@/app/lib/repositories/requestLogRepository';
import { feedStatusRepository } from '@/app/lib/repositories/feedStatusRepository';
import { incrementRequestCount } from '@/app/lib/requestCounter';
import { buildRssFeed } from '@/app/lib/rss';
import { getClientId } from '@/app/lib/clientId';
import { FeedSource } from '@/app/lib/models';

const tracer = trace.getTracer('rss-server-api');

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;

  return tracer.startActiveSpan(`rss.category.GET`, async (span) => {
    span.setAttribute('rss.category', category);
    try {
      await incrementRequestCount();

      const posts = await postRepository.findByCategoryOrderedByCreatedAt(category);
      span.setAttribute('rss.item_count', posts.length);

      const matchedSource = await FeedSource.findOne({ where: { name: category } });

      const clientId = getClientId(request);
      span.setAttribute('rss.client_id', clientId);

      await requestLogRepository.log({
        path: `/api/rss/${category}`,
        method: 'GET',
        clientId,
        feedSourceId: matchedSource?.id ?? null,
      });

      if (matchedSource) {
        const feedStatus = posts.length > 0 ? 'ok' : 'empty';
        span.setAttribute('rss.feed_status', feedStatus);
        span.setAttribute('rss.feed_source_id', matchedSource.id);

        await feedStatusRepository.upsert({
          feedSourceId: matchedSource.id,
          label: matchedSource.name,
          status: feedStatus,
          message: posts.length > 0 ? null : 'No posts available for this feed yet.',
        });
      } else {
        span.setAttribute('rss.feed_status', 'unknown_category');
      }

      const xml = buildRssFeed(
        posts,
        `RSS Server Feed — ${category}`,
        `Live "${category}" feed generated from the Assessment 2 database`
      );
      span.setAttribute('http.status_code', 200);

      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  });
}
