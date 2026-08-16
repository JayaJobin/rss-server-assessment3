import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/app/lib/repositories/postRepository';
import { requestLogRepository } from '@/app/lib/repositories/requestLogRepository';
import { feedStatusRepository } from '@/app/lib/repositories/feedStatusRepository';
import { incrementRequestCount } from '@/app/lib/requestCounter';
import { buildRssFeed } from '@/app/lib/rss';
import { getClientId } from '@/app/lib/clientId';
import { FeedSource } from '@/app/lib/models';

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
  await incrementRequestCount();

  const { category } = await params;
  const posts = await postRepository.findByCategoryOrderedByCreatedAt(category);

  // A "feed" in this app is a FeedSource whose name matches the category
  // (see /api/simulate). Match case-insensitively so real and simulated
  // traffic both attribute correctly for the dashboard's per-feed metrics.
  const matchedSource = await FeedSource.findOne({ where: { name: category } });

  await requestLogRepository.log({
    path: `/api/rss/${category}`,
    method: 'GET',
    clientId: getClientId(request),
    feedSourceId: matchedSource?.id ?? null,
  });

  if (matchedSource) {
    await feedStatusRepository.upsert({
      feedSourceId: matchedSource.id,
      label: matchedSource.name,
      status: posts.length > 0 ? 'ok' : 'empty',
      message: posts.length > 0 ? null : 'No posts available for this feed yet.',
    });
  }

  const xml = buildRssFeed(
    posts,
    `RSS Server Feed — ${category}`,
    `Live "${category}" feed generated from the Assessment 2 database`
  );

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
