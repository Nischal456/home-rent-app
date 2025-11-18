import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
// ✅ IMPORT THESE TO ENSURE REGISTRATION
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
    // 1. Connect to the database
    await dbConnect();

    // ✅ CRITICAL FIX: Explicitly "touch" the models to ensure they are registered
    // This forces Mongoose to know about 'User' and 'Room' before populate is called.
    const _userModel = User;
    const _roomModel = Room;

    // 2. Search for the bill (RentBill first)
    let bill: any = await RentBill.findById(billId)
      .populate('tenantId')
      .populate('roomId')
      .lean();
    let billType = 'Rent';

    // 3. If not found, search in UtilityBill
    if (!bill) {
      bill = await UtilityBill.findById(billId)
        .populate('tenantId')
        .populate('roomId')
        .lean();
      billType = 'Utility';
    }

    if (!bill) {
      return NextResponse.json({ success: false, message: 'Bill not found.' }, { status: 404 });
    }

    // 4. Calculate Total Outstanding Balance
    // We wrap this in a try/catch so a calculation error doesn't block the whole bill
    let totalOutstandingDue = 0;
    try {
      if (bill.tenantId && bill.tenantId._id) {
        const tenantId = bill.tenantId._id;
        const [otherRentBills, otherUtilityBills] = await Promise.all([
            RentBill.find({ 
                tenantId: tenantId, 
                _id: { $ne: bill._id }, 
                status: { $in: ['DUE', 'OVERDUE'] } 
            }).lean(),
            UtilityBill.find({ 
                tenantId: tenantId, 
                _id: { $ne: bill._id }, 
                status: { $in: ['DUE', 'OVERDUE'] } 
            }).lean()
        ]);
        
        otherRentBills.forEach(b => totalOutstandingDue += (b as IRentBill).amount);
        otherUtilityBills.forEach(b => totalOutstandingDue += (b as IUtilityBill).totalAmount);
        
        if (bill.status !== 'PAID') {
            const currentBillAmount = billType === 'Rent' ? bill.amount : bill.totalAmount;
            totalOutstandingDue += currentBillAmount;
        }
      }
    } catch (calcError) {
      console.error("Error calculating outstanding balance:", calcError);
      // We don't fail the request here, just default totalOutstandingDue to 0 or current bill amount
    }

    // 5. Return Success Response
    return NextResponse.json({
      success: true,
      data: { 
        ...bill, 
        type: billType,
        totalOutstandingDue,
      },
    });

  } catch (error) {
    console.error(`Error fetching public bill ${billId}:`, error);
    // Return the actual error message to help debugging if it happens again
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message: `DB Error: ${errorMessage}` }, { status: 500 });
  }
}