import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // This MUST point to the cached connection file
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Room from '@/models/Room';
import { IRentBill, IUtilityBill } from '@/types';

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

    // ✅ FIX: Fetch all other unpaid bills for this tenant, excluding 'PARTIALLY_PAID'
    const tenantId = bill.tenantId._id;
    const [otherRentBills, otherUtilityBills] = await Promise.all([
        RentBill.find({ 
            tenantId: tenantId, 
            _id: { $ne: bill._id }, // Exclude the current bill
            status: { $in: ['DUE', 'OVERDUE'] } // Removed 'PARTIALLY_PAID'
        }).lean(),
        UtilityBill.find({ 
            tenantId: tenantId, 
            _id: { $ne: bill._id }, // Exclude the current bill
            status: { $in: ['DUE', 'OVERDUE'] } // Removed 'PARTIALLY_PAID'
        }).lean()
    ]);
    
    const otherUnpaidBills = [...otherRentBills, ...otherUtilityBills]
        .sort((a, b) => new Date(a.billDateAD).getTime() - new Date(b.billDateAD).getTime());


    return NextResponse.json({
      success: true,
      data: { 
        ...bill, 
        type: billType,
        otherUnpaidBills // Include the other bills in the response
      },
    });

  } catch (error) {
    console.error(`Error fetching public bill ${billId}:`, error);
    // This is the error the user sees when the database connection fails.
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

