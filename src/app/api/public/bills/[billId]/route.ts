import { NextRequest, NextResponse } from 'next/server';
import { getPublicBill } from '@/lib/getPublicBill';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  const { billId } = params;

  if (!billId) {
    return NextResponse.json({ success: false, message: 'Bill ID is required.' }, { status: 400 });
  }

  try {
    const bill = await getPublicBill(billId);

    if (!bill) {
      return NextResponse.json({ success: false, message: 'Bill not found.' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      data: bill,
    });

    // Fast cache header: fresh for 30s, stale-while-revalidate for 60s
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error: any) {
    console.error(`Error fetching public bill ${billId}:`, error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}