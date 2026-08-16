import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/app/lib/repositories/postRepository';
import { requestLogRepository } from '@/app/lib/repositories/requestLogRepository';
import { incrementRequestCount } from '@/app/lib/requestCounter';
import { buildRssFeed } from '@/app/lib/rss';
import { getClientId } from '@/app/lib/clientId';

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
  await incrementRequestCount();
  const posts = await postRepository.findAllOrderedByCreatedAt();
  await requestLogRepository.log({
    path: '/api/rss',
    method: 'GET',
    clientId: getClientId(request),
    feedSourceId: null,
  });
  const xml = buildRssFeed(posts, 'RSS Server Feed', 'Live feed generated from the Assessment 2 database');

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
