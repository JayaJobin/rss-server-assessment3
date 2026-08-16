import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/app/lib/repositories/postRepository';
import { incrementRequestCount } from '@/app/lib/requestCounter';
import { corsPreflight } from '@/app/lib/cors';
import { jsonOk, jsonError, withErrorHandling } from '@/app/lib/apiResponse';
import { idParamSchema, postCreateSchema, postUpdateSchema } from '@/app/lib/validationSchemas';

export const OPTIONS = corsPreflight;

export async function GET(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('posts.GET')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    const slug = request.nextUrl.searchParams.get('slug');

    if (rawId) {
      const id = idParamSchema.parse(rawId);
      const post = await postRepository.findById(id);
      if (!post) return jsonError('Post not found', 404);
      return jsonOk(post);
    }

    if (slug) {
      const post = await postRepository.findBySlug(slug);
      if (!post) return jsonError('Post not found', 404);
      return jsonOk(post);
    }

    const posts = await postRepository.findAll();
    return jsonOk(posts);
  });
}

export async function POST(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('posts.POST')(async () => {
    const body = postCreateSchema.parse(await request.json());
    try {
      const newPost = await postRepository.create(body);
      return jsonOk(newPost, 201);
    } catch {
      return jsonError('Could not create post (slug must be unique)', 400);
    }
  });
}

export async function PATCH(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('posts.PATCH')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    if (!rawId) return jsonError('Missing id', 400);
    const id = idParamSchema.parse(rawId);

    const updates = postUpdateSchema.parse(await request.json());
    const post = await postRepository.updateById(id, updates);
    if (!post) return jsonError('Post not found', 404);
    return jsonOk(post);
  });
}

export async function DELETE(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('posts.DELETE')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    if (!rawId) return jsonError('Missing id', 400);
    const id = idParamSchema.parse(rawId);

    const deleted = await postRepository.deleteById(id);
    if (!deleted) return jsonError('Post not found', 404);
    return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
}
