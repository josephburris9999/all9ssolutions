import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Use GET /api/portal/consultation-requests/{consultationRequestId}/agreement for consultation-scoped agreements.',
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Use POST /api/portal/consultation-requests/{consultationRequestId}/agreement to sign the Client Service Agreement.',
    },
    { status: 410 }
  );
}
