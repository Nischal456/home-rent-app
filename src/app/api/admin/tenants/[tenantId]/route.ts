import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import { IUser, IRentBill, IUtilityBill } from '@/types';

// This is the App Router's way of handling dynamic GET requests
export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  // --- IMPORTANT: Add your admin authentication logic here ---
  // For example, verify a token from request.headers or cookies
  
  const { tenantId } = params; // Get the tenantId from the URL parameters

  if (!tenantId) {
    return NextResponse.json({ success: false, message: 'Tenant ID is required.' }, { status: 400 });
  }

  try {
    await dbConnect();

    // The database logic remains the same
    const [tenantDetails, rentBills, utilityBills] = await Promise.all([
      User.findById(tenantId).populate('roomId').lean<IUser>(),
      RentBill.find({ tenantId }).sort({ billDateAD: -1 }).lean<IRentBill[]>(),
      UtilityBill.find({ tenantId }).sort({ billDateAD: -1 }).lean<IUtilityBill[]>()
    ]);

    if (!tenantDetails) {
      return NextResponse.json({ success: false, message: 'Tenant not found.' }, { status: 404 });
    }

    // Return the data using NextResponse
    return NextResponse.json({
      success: true,
      data: {
        tenantDetails,
        rentBills,
        utilityBills
      }
    });

  } catch (error) {
    console.error(`Error fetching details for tenant ${tenantId}:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}