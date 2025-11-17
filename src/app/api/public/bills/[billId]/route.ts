import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
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
    await dbConnect();

    let bill: any = await RentBill.findById(billId).populate('tenantId').populate('roomId').lean();
    let billType = 'Rent';

    if (!bill) {
      bill = await UtilityBill.findById(billId).populate('tenantId').populate('roomId').lean();
      billType = 'Utility';
    }

    if (!bill) {
      return NextResponse.json({ success: false, message: 'Bill not found.' }, { status: 404 });
    }

    // ✅ "NEXT LEVEL" FEATURE: Fetch all other unpaid bills for this tenant
    const tenantId = bill.tenantId._id;
    const [otherRentBills, otherUtilityBills] = await Promise.all([
        RentBill.find({ 
            tenantId: tenantId, 
            _id: { $ne: bill._id }, // Exclude the current bill
            status: { $in: ['DUE', 'OVERDUE'] } 
        }).lean(),
        UtilityBill.find({ 
            tenantId: tenantId, 
            _id: { $ne: bill._id }, 
            status: { $in: ['DUE', 'OVERDUE'] } 
        }).lean()
    ]);
    
    // Calculate the total outstanding balance
    let totalOutstandingDue = 0;
    
    otherRentBills.forEach(b => totalOutstandingDue += (b as IRentBill).amount);
    otherUtilityBills.forEach(b => totalOutstandingDue += (b as IUtilityBill).totalAmount);
    
    // Add the current bill's amount if it's not paid
    if (bill.status !== 'PAID') {
        const currentBillAmount = billType === 'Rent' ? bill.amount : bill.totalAmount;
        totalOutstandingDue += currentBillAmount;
    }

    return NextResponse.json({
      success: true,
      data: { 
        ...bill, 
        type: billType,
        totalOutstandingDue: totalOutstandingDue, // ✅ Include the total balance
      },
    });

  } catch (error) {
    console.error(`Error fetching public bill ${billId}:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}