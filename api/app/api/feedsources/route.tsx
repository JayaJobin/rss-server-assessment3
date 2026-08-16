import { NextRequest, NextResponse } from 'next/server';
import { feedSourceRepository } from '@/app/lib/repositories/feedSourceRepository';
import { incrementRequestCount } from '@/app/lib/requestCounter';
import { corsPreflight } from '@/app/lib/cors';
import { jsonOk, jsonError, withErrorHandling } from '@/app/lib/apiResponse';
import { idParamSchema, feedSourceCreateSchema, feedSourceUpdateSchema } from '@/app/lib/validationSchemas';

export const OPTIONS = corsPreflight;

export async function GET(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('feedsources.GET')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    if (rawId) {
      const id = idParamSchema.parse(rawId);
      const source = await feedSourceRepository.findById(id);
      if (!source) return jsonError('FeedSource not found', 404);
      return jsonOk(source);
    }
    const sources = await feedSourceRepository.findAll();
    return jsonOk(sources);
  });
}

export async function POST(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('feedsources.POST')(async () => {
    const body = feedSourceCreateSchema.parse(await request.json());
    try {
      const newSource = await feedSourceRepository.create(body);
      return jsonOk(newSource, 201);
    } catch {
      return jsonError('Could not create feed source (url must be unique)', 400);
    }
  });
}

export async function PATCH(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('feedsources.PATCH')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    if (!rawId) return jsonError('Missing id', 400);
    const id = idParamSchema.parse(rawId);

    const updates = feedSourceUpdateSchema.parse(await request.json());
    try {
      const source = await feedSourceRepository.updateById(id, updates);
      if (!source) return jsonError('FeedSource not found', 404);
      return jsonOk(source);
    } catch {
      return jsonError('Could not update feed source (url must be unique)', 400);
    }
  });
}

export async function DELETE(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('feedsources.DELETE')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    if (!rawId) return jsonError('Missing id', 400);
    const id = idParamSchema.parse(rawId);

    const deleted = await feedSourceRepository.deleteById(id);
    if (!deleted) return jsonError('FeedSource not found', 404);
    return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
}
