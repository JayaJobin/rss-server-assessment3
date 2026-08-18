import { NextRequest } from 'next/server';
import { FeedSource, Author, Post } from '@/app/lib/models';
import { requestLogRepository } from '@/app/lib/repositories/requestLogRepository';
import { feedStatusRepository } from '@/app/lib/repositories/feedStatusRepository';
import { incrementRequestCount } from '@/app/lib/requestCounter';
import { corsPreflight } from '@/app/lib/cors';
import { jsonOk, withErrorHandling } from '@/app/lib/apiResponse';

export const OPTIONS = corsPreflight;

const SEED_FEEDS = [
  { name: 'Campus Announcements', url: 'https://example.edu/feeds/announcements.xml' },
  { name: 'Module 4 Blog', url: 'https://example.edu/feeds/module-4.xml' },
  { name: 'Assessment Updates', url: 'https://example.edu/feeds/assessments.xml' },
  { name: 'LMS Digest', url: 'https://example.edu/feeds/lms-digest.xml' },
  { name: 'External Partner Feed (Demo)', url: 'https://example.edu/feeds/external-partner-demo.xml' },
];

const AUTHORS = [
  { name: 'System Notice', email: 'notices@example.edu' },
  { name: 'Dr. A. Bishop', email: 'a.bishop@example.edu' },
  { name: 'Course Coordinator', email: 'coordinator@example.edu' },
];

const SAMPLE_CLIENTS = ['lms-client-01', 'lms-client-02', 'mobile-app-07', 'browser-widget-03', 'jmeter-load-test'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function POST(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('simulate.POST')(async () => {
    const body = await request.json().catch(() => ({}));
    const postCount = Math.min(Math.max(Number(body.posts) || 20, 1), 200);
    const requestLogCount = Math.min(Math.max(Number(body.requestLogs) || 60, 1), 2000);

    const feedSources: FeedSource[] = [];
    for (const seed of SEED_FEEDS) {
      const [source] = await FeedSource.findOrCreate({ where: { url: seed.url }, defaults: seed });
      feedSources.push(source);
    }

    const authors: Author[] = [];
    for (const seed of AUTHORS) {
      const [author] = await Author.findOrCreate({ where: { email: seed.email }, defaults: seed });
      authors.push(author);
    }

    const postableFeeds = feedSources.slice(0, -2);
    const createdPosts: Post[] = [];
    for (let i = 0; i < postCount; i++) {
      const feed = randomFrom(postableFeeds);
      const author = randomFrom(authors);
      const slugSuffix = `${Date.now()}-${i}-${Math.floor(Math.random() * 100000)}`;
      const post = await Post.create({
        slug: `simulated-${slugSuffix}`,
        title: `Simulated update #${i + 1} from ${feed.name}`,
        author: author.name,
        publishedAt: daysAgo(Math.floor(Math.random() * 14)),
        category: feed.name,
        summary: `Auto-generated simulated record for observability testing (feed: ${feed.name}).`,
        body: `This is a simulated post created by /api/simulate to populate the dashboard with realistic data for Assessment 3 reporting and observability features.`,
        readTime: '1 min read',
        feedSourceId: feed.id,
        authorId: author.id,
      });
      createdPosts.push(post);
    }

    for (let i = 0; i < requestLogCount; i++) {
      const feed = randomFrom(feedSources);
      const client = randomFrom(SAMPLE_CLIENTS);
      await requestLogRepository.log({
        path: `/api/rss/${encodeURIComponent(feed.name)}`,
        method: 'GET',
        clientId: client,
        feedSourceId: feed.id,
        statusCode: 200,
      });
    }

    for (const feed of feedSources) {
      const hasPosts = createdPosts.some((p) => p.feedSourceId === feed.id);
      await feedStatusRepository.upsert({
        feedSourceId: feed.id,
        label: feed.name,
        status: hasPosts ? 'ok' : 'empty',
        message: hasPosts ? null : 'No posts available for this feed yet.',
      });
    }

    const errorFeed = feedSources[feedSources.length - 1];
    await feedStatusRepository.upsert({
      feedSourceId: errorFeed.id,
      label: errorFeed.name,
      status: 'error',
      message: 'Simulated fetch timeout while polling upstream source.',
    });

    return jsonOk({
      message: 'Simulation complete',
      feedSourcesEnsured: feedSources.length,
      postsCreated: createdPosts.length,
      requestLogsCreated: requestLogCount,
    });
  });
}
