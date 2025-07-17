import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';
import { getTokenData } from '@/lib/getTokenData';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const tokenData = await getTokenData(request);

    if (!tokenData || tokenData.role !== 'TENANT') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const utilityBills = await UtilityBill.find({ tenantId: tokenData.id }).sort({ billDateAD: -1 });

    return NextResponse.json({ success: true, data: utilityBills });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
