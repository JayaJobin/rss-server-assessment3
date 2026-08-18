import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { corsHeaders } from './cors';
import { logger } from './logger';

const tracer = trace.getTracer('rss-server-api');

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: corsHeaders });
}

export function zodErrorResponse(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '(root)';
    fields[key] = issue.message;
  }
  return NextResponse.json(
    { error: 'Validation failed', fields },
    { status: 400, headers: corsHeaders }
  );
}

export function withErrorHandling(spanName = 'api.request') {
  return async (handler: () => Promise<NextResponse>): Promise<NextResponse> => {
    return tracer.startActiveSpan(spanName, async (span) => {
      try {
        const response = await handler();
        span.setAttribute('http.status_code', response.status);
        if (response.status >= 400) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
          logger.warn({ spanName, statusCode: response.status }, 'Request completed with error status');
        } else {
          logger.info({ spanName, statusCode: response.status }, 'Request completed');
        }
        return response;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
        logger.error({ spanName, err: error }, 'Unhandled error in route handler');

        if (error instanceof ZodError) {
          return zodErrorResponse(error);
        }
        return jsonError('Server error', 500);
      } finally {
        span.end();
      }
    });
  };
}
