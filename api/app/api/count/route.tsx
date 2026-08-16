import { getRequestCount, incrementRequestCount } from '@/app/lib/requestCounter';
import { jsonOk, withErrorHandling } from '@/app/lib/apiResponse';
import { corsPreflight } from '@/app/lib/cors';

export const OPTIONS = corsPreflight;

export async function GET() {
  await incrementRequestCount();
  return withErrorHandling('count.GET')(async () => {
    const count = await getRequestCount();
    return jsonOk({ count });
  });
}
