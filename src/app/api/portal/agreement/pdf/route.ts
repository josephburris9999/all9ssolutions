import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Use GET /api/portal/consultation-requests/{consultationRequestId}/agreement/pdf to download the Client Service Agreement PDF.',
    },
    { status: 410 }
  );
}
