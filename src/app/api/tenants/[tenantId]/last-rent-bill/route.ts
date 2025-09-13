import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import User from '@/models/User';
import Room from '@/models/Room'; // Ensure Room model is imported to be registered

export const dynamic = 'force-dynamic'; // Ensures fresh data on every request

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  // Add your admin authentication check here
  
  const { tenantId } = params;
  if (!tenantId) {
    return NextResponse.json({ success: false, message: 'Tenant ID is required.' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Fetch the last bill and tenant details concurrently for performance
    const [lastBill, tenant] = await Promise.all([
      RentBill.findOne({ tenantId }).sort({ billDateAD: -1 }).lean(),
      User.findById(tenantId).populate('roomId').lean()
    ]);
    
    const defaultRentAmount = (tenant?.roomId as any)?.rentAmount || 0;

    return NextResponse.json({ 
        success: true, 
        data: { 
            lastBill, 
            defaultRentAmount 
        } 
    });

  } catch (error) {
    console.error("Error fetching last rent bill:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
