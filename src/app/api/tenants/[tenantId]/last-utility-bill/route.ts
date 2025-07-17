import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';

export async function GET(request: Request, { params }: { params: { tenantId: string } }) {
  await dbConnect();
  try {
    const { tenantId } = params;
    if (!tenantId) {
      return NextResponse.json({ success: false, message: 'Tenant ID is required.' }, { status: 400 });
    }

    // Find the most recent bill for this tenant by sorting by date descending
    const lastBill = await UtilityBill.findOne({ tenantId }).sort({ billDateAD: -1 });

    if (!lastBill) {
      return NextResponse.json({ success: false, message: 'No previous bill found for this tenant.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lastBill });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
