import { NextRequest as UtilNextRequest, NextResponse as UtilNextResponse } from 'next/server';
import dbConnectUtil from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';
import NepaliDateUtil from 'nepali-date-converter';
import { createNotification as createUtilNotification } from '@/lib/createNotification';
import jwtUtil from 'jsonwebtoken';

interface UtilTokenPayload {
  id: string;
}

export async function PATCH(request: UtilNextRequest, { params }: { params: { id: string } }) {
  await dbConnectUtil();
  try {
    const billId = params.id;
    const todayAD = new Date();
    const todayBS = new NepaliDateUtil(todayAD).format('YYYY-MM-DD');

    const updatedBill = await UtilityBill.findByIdAndUpdate(
      billId,
      { status: 'PAID', paidOnBS: todayBS },
      { new: true }
    );

    if (!updatedBill) {
      return UtilNextResponse.json({ success: false, message: 'Bill not found' }, { status: 404 });
    }
    
    // --- THE CORE FIX IS HERE ---
    const token = request.cookies.get('token')?.value || '';
    if (token) {
        const adminUser = jwtUtil.verify(token, process.env.JWT_SECRET!) as UtilTokenPayload;
        
        await createUtilNotification(
            updatedBill.tenantId, 
            'Utility Bill Paid!', 
            `Your utility bill of Rs ${updatedBill.totalAmount} has been paid. Thank you!`, 
            '/dashboard'
        );
        
        if (adminUser) {
            await createUtilNotification(
                adminUser.id as any, 
                'Payment Recorded', 
                `You marked a utility bill of Rs ${updatedBill.totalAmount} as paid.`, 
                '/dashboard/utility-bills'
            );
        }
    }
    // --- END OF FIX ---

    return UtilNextResponse.json({ success: true, message: 'Bill marked as paid', data: updatedBill });
  } catch (error) {
    return UtilNextResponse.json({ success: false, message: 'Error updating bill' }, { status: 500 });
  }
}

export async function DELETE(request: UtilNextRequest, { params }: { params: { id: string } }) {
    await dbConnectUtil();
    try {
        const billId = params.id;
        await UtilityBill.findByIdAndDelete(billId);
        return UtilNextResponse.json({ success: true, message: 'Bill deleted successfully' });
    } catch (error) {
        return UtilNextResponse.json({ success: false, message: 'Error deleting bill' }, { status: 500 });
    }
}
