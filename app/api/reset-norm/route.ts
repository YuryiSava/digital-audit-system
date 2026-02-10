import { resetParsingStatus } from '@/app/actions/norm-library';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const normId = request.nextUrl.searchParams.get('id');
    if (!normId) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const result = await resetParsingStatus(normId);
    return NextResponse.json(result);
}
