import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Room from '@/models/Room';
import { IRentBill, IUtilityBill } from '@/types';

// Prevent Vercel from caching this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  const { billId } = params;

  console.log(`[API] Fetching bill: ${billId}`);

  // 1. DEBUG: Check Environment Variable
  if (!process.env.MONGODB_URI) {
    console.error("[API] CRITICAL: MONGODB_URI is undefined.");
    return NextResponse.json({ success: false, message: 'Configuration Error: Database connection string is missing.' }, { status: 500 });
  }

  try {
    // 2. Attempt Database Connection
    console.log("[API] Connecting to database...");
    await dbConnect();
    console.log("[API] Database connected.");

    // 3. Query the Database
    let bill: any = await RentBill.findById(billId).populate('tenantId').populate('roomId').lean();
    let billType = 'Rent';

    if (!bill) {
      bill = await UtilityBill.findById(billId).populate('tenantId').populate('roomId').lean();
      billType = 'Utility';
    }

    if (!bill) {
      console.log(`[API] Bill not found for ID: ${billId}`);
      return NextResponse.json({ success: false, message: 'Bill not found.' }, { status: 404 });
    }

    // 4. Calculate Outstanding Balance
    const tenantId = bill.tenantId._id;
    let totalOutstandingDue = 0;

    try {
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
        console.error("[API] Warning: Failed to calculate outstanding balance", calcError);
        // Non-fatal error, continue
    }

    return NextResponse.json({
      success: true,
      data: { 
        ...bill, 
        type: billType,
        totalOutstandingDue,
      },
    });

  } catch (error: any) {
    // ✅ EXPOSE THE REAL ERROR
    console.error(`[API] FATAL ERROR:`, error);
    
    // Return the specific error message to the frontend for debugging
    return NextResponse.json({ 
        success: false, 
        message: `DB Error: ${error.message}`,
        errorDetails: JSON.stringify(error)
    }, { status: 500 });
  }
}