import { NextRequest, NextResponse } from 'next/server';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { postRepository } from '@/app/lib/repositories/postRepository';
import { requestLogRepository } from '@/app/lib/repositories/requestLogRepository';
import { incrementRequestCount } from '@/app/lib/requestCounter';
import { buildRssFeed } from '@/app/lib/rss';
import { getClientId } from '@/app/lib/clientId';

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

export async function GET(request: NextRequest) {
  return tracer.startActiveSpan('rss.GET', async (span) => {
    try {
      await incrementRequestCount();
      const clientId = getClientId(request);
      span.setAttribute('rss.client_id', clientId);

      const posts = await postRepository.findAllOrderedByCreatedAt();
      span.setAttribute('rss.item_count', posts.length);

      await requestLogRepository.log({
        path: '/api/rss',
        method: 'GET',
        clientId,
        feedSourceId: null,
      });

      const xml = buildRssFeed(posts, 'RSS Server Feed', 'Live feed generated from the Assessment 2 database');
      span.setAttribute('http.status_code', 200);

      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
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
