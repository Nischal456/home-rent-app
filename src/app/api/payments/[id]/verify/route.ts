import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment, { IPayment } from '@/models/Payment';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import { createNotification } from '@/lib/createNotification';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import NepaliDate from 'nepali-date-converter';

interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'TENANT';
}

// ✅ FIX: Correctly override the tenantId type using Omit
type PaymentWithTenantID = Omit<IPayment, 'tenantId'> & {
  tenantId: Types.ObjectId;
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    // 1. Verify Admin Authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined.");
      return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Find the Payment Record
    const paymentId = params.id;
    const payment = await Payment.findById(paymentId) as PaymentWithTenantID | null;

    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment record not found.' }, { status: 404 });
    }
    if (payment.status === 'VERIFIED') {
      return NextResponse.json({ success: false, message: 'This payment has already been verified.' }, { status: 400 });
    }

    // 3. Update all of the tenant's DUE bills to PAID
    const todayAD = new Date();
    const todayBS = new NepaliDate(todayAD).format('YYYY-MM-DD');
    
    await RentBill.updateMany(
      { tenantId: payment.tenantId, status: 'DUE' },
      { $set: { status: 'PAID', paidOnBS: todayBS } }
    );
    await UtilityBill.updateMany(
      { tenantId: payment.tenantId, status: 'DUE' },
      { $set: { status: 'PAID', paidOnBS: todayBS } }
    );
    
    // 4. Update the payment status to VERIFIED
    // We need to fetch the original document to save it, as the cast one is just for type checking
    const originalPayment = await Payment.findById(paymentId);
    if (originalPayment) {
        originalPayment.status = 'VERIFIED';
        await originalPayment.save();
    }

    // 5. Notify the Tenant
    await createNotification(
      payment.tenantId,
      'Payment Verified!',
      `Your payment of Rs ${payment.amount.toLocaleString()} has been verified and your bills are now marked as paid. Thank you!`,
      '/dashboard/statement'
    );

    return NextResponse.json({ success: true, message: 'Payment verified successfully.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    console.error(`Error in PATCH /api/payments/${params.id}/verify:`, errorMessage);
    return NextResponse.json({ success: false, message: 'An error occurred during verification.' }, { status: 500 });
  }
}