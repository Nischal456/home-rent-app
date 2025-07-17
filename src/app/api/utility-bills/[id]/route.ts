import { NextResponse as UtilBillIdNextResponse } from 'next/server';
import dbConnectUtilId from '@/lib/dbConnect';
import UtilityBillId from '@/models/UtilityBill';
import NepaliDateUtilId from 'nepali-date-converter';
import { createNotification as createUtilIdNotification } from '@/lib/createNotification';
import { getTokenData as getUtilIdTokenData } from '@/lib/getTokenData';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await dbConnectUtilId();
  try {
    const billId = params.id;
    const todayAD = new Date();
    const todayBS = new NepaliDateUtilId(todayAD).format('YYYY-MM-DD');
    const updatedBill = await UtilityBillId.findByIdAndUpdate(billId, { status: 'PAID', paidOnBS: todayBS }, { new: true });
    if (updatedBill) {
        const adminUser = getUtilIdTokenData(request);
        await createUtilIdNotification(updatedBill.tenantId, 'Utility Bill Paid!', `Your utility bill of Rs ${updatedBill.totalAmount} has been paid. Thank you!`, '/dashboard');
        if (adminUser) {
            await createUtilIdNotification(adminUser.id as any, 'Payment Recorded', `You marked a utility bill of Rs ${updatedBill.totalAmount} as paid.`, '/dashboard/utility-bills');
        }
    }
    return UtilBillIdNextResponse.json({ success: true, message: 'Bill marked as paid', data: updatedBill });
  } catch (error) {
    return UtilBillIdNextResponse.json({ success: false, message: 'Error updating bill' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnectUtilId();
    try {
        await UtilityBillId.findByIdAndDelete(params.id);
        return UtilBillIdNextResponse.json({ success: true, message: 'Bill deleted successfully' });
    } catch (error) {
        return UtilBillIdNextResponse.json({ success: false, message: 'Error deleting bill' }, { status: 500 });
    }
}