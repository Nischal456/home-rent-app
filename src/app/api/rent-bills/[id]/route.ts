import { NextResponse as RentBillIdNextResponse } from 'next/server';
import dbConnectRentId from '@/lib/dbConnect';
import RentBillId from '@/models/RentBill';
import NepaliDateId from 'nepali-date-converter';
import { createNotification as createRentIdNotification } from '@/lib/createNotification';
import { getTokenData as getRentIdTokenData } from '@/lib/getTokenData';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await dbConnectRentId();
  try {
    const billId = params.id;
    const todayAD = new Date();
    const todayBS = new NepaliDateId(todayAD).format('YYYY-MM-DD');

    const updatedBill = await RentBillId.findByIdAndUpdate(billId, { status: 'PAID', paidOnBS: todayBS }, { new: true });
    
    if (updatedBill) {
        const adminUser = getRentIdTokenData(request);
        await createRentIdNotification(updatedBill.tenantId, 'Rent Bill Paid!', `Your rent bill of Rs ${updatedBill.amount} has been marked as paid. Thank you!`, '/dashboard');
        if (adminUser) {
            await createRentIdNotification(adminUser.id as any, 'Payment Recorded', `You marked a rent bill of Rs ${updatedBill.amount} as paid.`, '/dashboard/rent-bills');
        }
    }
    
    return RentBillIdNextResponse.json({ success: true, message: 'Bill marked as paid', data: updatedBill });
  } catch (error) {
    return RentBillIdNextResponse.json({ success: false, message: 'Error updating bill' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnectRentId();
    try {
        await RentBillId.findByIdAndDelete(params.id);
        return RentBillIdNextResponse.json({ success: true, message: 'Bill deleted successfully' });
    } catch (error) {
        return RentBillIdNextResponse.json({ success: false, message: 'Error deleting bill' }, { status: 500 });
    }
}