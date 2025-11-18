import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Room from '@/models/Room';
import { IRentBill, IUtilityBill } from '@/types';

// ✅ FORCE DYNAMIC: Crucial for Vercel to not cache old data
export const dynamic = 'force-dynamic';
// ✅ EXTEND TIMEOUT: Give the database more time to connect on cold starts
export const maxDuration = 60; 

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  const { billId } = params;

  if (!billId) {
    return NextResponse.json({ success: false, message: 'Bill ID is required.' }, { status: 400 });
  }

  try {
    // 1. Establish Database Connection
    await dbConnect();

    // 2. Search for the bill in both collections (Rent or Utility)
    let bill: any = await RentBill.findById(billId).populate('tenantId').populate('roomId').lean();
    let billType = 'Rent';

    if (!bill) {
      bill = await UtilityBill.findById(billId).populate('tenantId').populate('roomId').lean();
      billType = 'Utility';
    }

    if (!bill) {
      return NextResponse.json({ success: false, message: 'Bill not found.' }, { status: 404 });
    }

    // 3. "Next Level" Logic: Calculate Total Outstanding Balance
    // We use try/catch here so if this calculation fails, it doesn't break the whole page
    let totalOutstandingDue = 0;
    try {
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
            totalOutstandingDue += (billType === 'Rent' ? bill.amount : bill.totalAmount);
        }
    } catch (calcError) {
        console.error("Error calculating outstanding balance:", calcError);
        // Continue without crashing, just report 0 outstanding
    }

    // 4. Return the data
    return NextResponse.json({
      success: true,
      data: { 
        ...bill, 
        type: billType,
        totalOutstandingDue,
      },
    });

  } catch (error) {
    console.error(`CRITICAL ERROR fetching public bill ${billId}:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error. Please try refreshing.' }, { status: 500 });
  }
}