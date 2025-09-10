import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // This should point to your new, cached connection file
import User from '@/models/User';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import { IUser, IRentBill, IUtilityBill } from '@/types';

// ✅ THE FIX: This line is crucial for Vercel. It forces this route to be dynamic,
// preventing Vercel from caching the data and ensuring you always get fresh results.
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  // --- IMPORTANT: Add your admin authentication logic here ---
  // For example, you would verify a JWT token from the request headers or cookies.
  
  const { tenantId } = params;

  if (!tenantId) {
    return NextResponse.json({ success: false, message: 'Tenant ID is required.' }, { status: 400 });
  }

  try {
    // This now calls your new, robust database connection utility
    await dbConnect();

    // The concurrent database fetching is efficient and correct
    const [tenantDetails, rentBills, utilityBills] = await Promise.all([
      User.findById(tenantId).populate('roomId').lean<IUser>(),
      RentBill.find({ tenantId }).sort({ billDateAD: -1 }).lean<IRentBill[]>(),
      UtilityBill.find({ tenantId }).sort({ billDateAD: -1 }).lean<IUtilityBill[]>()
    ]);

    if (!tenantDetails) {
      return NextResponse.json({ success: false, message: 'Tenant not found.' }, { status: 404 });
    }

    // The response structure is correct
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