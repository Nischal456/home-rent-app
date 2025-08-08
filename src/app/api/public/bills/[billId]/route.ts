import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Room from '@/models/Room';

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  const { billId } = params;

  if (!billId) {
    return NextResponse.json({ success: false, message: 'Bill ID is required.' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Try to find the bill in either collection, and populate tenant/room info
    let bill: any = await RentBill.findById(billId).populate('tenantId').populate('roomId').lean();
    let billType = 'Rent';

    if (!bill) {
      bill = await UtilityBill.findById(billId).populate('tenantId').populate('roomId').lean();
      billType = 'Utility';
    }

    if (!bill) {
      return NextResponse.json({ success: false, message: 'Bill not found.' }, { status: 404 });
    }

    // Return the combined bill data
    return NextResponse.json({
      success: true,
      data: { ...bill, type: billType },
    });

  } catch (error) {
    console.error("Error fetching public bill:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}