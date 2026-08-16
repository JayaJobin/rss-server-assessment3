import { NextResponse } from 'next/server';
import { corsHeaders, corsPreflight } from '@/app/lib/cors';

export const OPTIONS = corsPreflight;

// The assessment brief specifically says "a healthcheck endpoint where
// /health returns 200 OK". /api/health (see app/api/health/route.tsx)
// covers this too, but this bare /health route exists to match that
// wording literally, in case it's checked directly at this exact path.
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
