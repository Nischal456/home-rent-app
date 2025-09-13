import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // This MUST point to the cached connection file
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Room from '@/models/Room';

// This line is crucial for Vercel to prevent caching stale data.
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
    // This now calls your new, robust database connection utility.
    await dbConnect();

    // The logic to find the bill remains the same.
    let bill: any = await RentBill.findById(billId).populate('tenantId').populate('roomId').lean();
    let billType = 'Rent';

    if (!bill) {
      bill = await UtilityBill.findById(billId).populate('tenantId').populate('roomId').lean();
      billType = 'Utility';
    }

    if (!bill) {
      return NextResponse.json({ success: false, message: 'Bill not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...bill, type: billType },
    });

  } catch (error) {
    console.error(`Error fetching public bill ${billId}:`, error);
    // This is the error the user sees when the database connection fails.
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

