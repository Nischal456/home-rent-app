import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Room from '@/models/Room';

// This line is crucial for Vercel. It prevents caching of stale data,
// ensuring that the bill status is always up-to-date.
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
    // This calls the robust, cached database connection from your lib/dbConnect.ts file.
    await dbConnect();

    // The logic to find the bill in either collection remains the same.
    let bill: any = await RentBill.findById(billId).populate('tenantId').populate('roomId').lean();
    let billType = 'Rent';

    if (!bill) {
      bill = await UtilityBill.findById(billId).populate('tenantId').populate('roomId').lean();
      billType = 'Utility';
    }

    if (!bill) {
      return NextResponse.json({ success: false, message: 'Bill not found.' }, { status: 404 });
    }

    // The response includes the bill data and its type.
    return NextResponse.json({
      success: true,
      data: { ...bill, type: billType },
    });

  } catch (error) {
    console.error(`Error fetching public bill ${billId}:`, error);
    // This is the error that gets triggered if the database connection fails on Vercel.
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

