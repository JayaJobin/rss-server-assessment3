import { NextRequest, NextResponse } from 'next/server';
import { authorRepository } from '@/app/lib/repositories/authorRepository';
import { incrementRequestCount } from '@/app/lib/requestCounter';
import { corsPreflight } from '@/app/lib/cors';
import { jsonOk, jsonError, withErrorHandling } from '@/app/lib/apiResponse';
import { idParamSchema, authorCreateSchema, authorUpdateSchema } from '@/app/lib/validationSchemas';

export const OPTIONS = corsPreflight;

export async function GET(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('authors.GET')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    if (rawId) {
      const id = idParamSchema.parse(rawId);
      const author = await authorRepository.findById(id);
      if (!author) return jsonError('Author not found', 404);
      return jsonOk(author);
    }
    const authors = await authorRepository.findAll();
    return jsonOk(authors);
  });
}

export async function POST(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('authors.POST')(async () => {
    const body = authorCreateSchema.parse(await request.json());
    try {
      const newAuthor = await authorRepository.create(body);
      return jsonOk(newAuthor, 201);
    } catch {
      return jsonError('Could not create author (email must be unique)', 400);
    }
  });
}

export async function PATCH(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('authors.PATCH')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    if (!rawId) return jsonError('Missing id', 400);
    const id = idParamSchema.parse(rawId);

    const updates = authorUpdateSchema.parse(await request.json());
    try {
      const author = await authorRepository.updateById(id, updates);
      if (!author) return jsonError('Author not found', 404);
      return jsonOk(author);
    } catch {
      return jsonError('Could not update author (email must be unique)', 400);
    }
  });
}

export async function DELETE(request: NextRequest) {
  await incrementRequestCount();
  return withErrorHandling('authors.DELETE')(async () => {
    const rawId = request.nextUrl.searchParams.get('id');
    if (!rawId) return jsonError('Missing id', 400);
    const id = idParamSchema.parse(rawId);

    const deleted = await authorRepository.deleteById(id);
    if (!deleted) return jsonError('Author not found', 404);
    return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
}
