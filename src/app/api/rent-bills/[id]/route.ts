import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import NepaliDate from 'nepali-date-converter';
import { createNotification } from '@/lib/createNotification';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const billId = params.id;
    const todayAD = new Date();
    const todayBS = new NepaliDate(todayAD).format('YYYY-MM-DD');

    const updatedBill = await RentBill.findByIdAndUpdate(
      billId,
      { status: 'PAID', paidOnBS: todayBS },
      { new: true }
    );

    if (!updatedBill) {
      return NextResponse.json({ success: false, message: 'Bill not found' }, { status: 404 });
    }

    // --- THE CORE FIX IS HERE ---
    // We get the admin's token directly from the request cookies.
    const token = request.cookies.get('token')?.value || '';
    if (token) {
        const adminUser = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        
        // Notify the tenant
        await createNotification(
            updatedBill.tenantId,
            'Rent Bill Paid!',
            `Your rent bill of Rs ${updatedBill.amount} has been marked as paid. Thank you!`,
            '/dashboard'
        );
        // Notify the admin who performed the action
        if (adminUser) {
            await createNotification(
                adminUser.id as any,
                'Payment Recorded',
                `You marked a rent bill of Rs ${updatedBill.amount} as paid.`,
                '/dashboard/rent-bills'
            );
        }
    }
    // --- END OF FIX ---

    return NextResponse.json({ success: true, message: 'Bill marked as paid', data: updatedBill });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error updating bill' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const billId = params.id;
        await RentBill.findByIdAndDelete(billId);
        return NextResponse.json({ success: true, message: 'Bill deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error deleting bill' }, { status: 500 });
    }
}
