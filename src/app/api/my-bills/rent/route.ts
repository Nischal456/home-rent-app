
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import { getTokenData } from '@/lib/getTokenData'; // We will create this helper

export async function GET(request: Request) {
  try {
    await dbConnect();
    const tokenData = await getTokenData(request);

    if (!tokenData || tokenData.role !== 'TENANT') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const rentBills = await RentBill.find({ tenantId: tokenData.id }).sort({ billDateAD: -1 });

    return NextResponse.json({ success: true, data: rentBills });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}