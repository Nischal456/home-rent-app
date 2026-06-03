import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WaterTanker from '@/models/WaterTanker';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  await dbConnect();

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token provided.' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const { id } = params;
    const tanker = await WaterTanker.findById(id);

    if (!tanker) {
      return NextResponse.json({ success: false, message: 'Water tanker record not found.' }, { status: 404 });
    }

    const { amount, date, remarks, receipt, method } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Valid payment amount is required.' }, { status: 400 });
    }

    // 1. Add the new payment to the history
    const paymentRecord = {
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      remarks: remarks || '',
      receipt: receipt || '',
      method: method || 'CASH'
    };

    if (!tanker.paymentHistory) {
      tanker.paymentHistory = [];
    }

    tanker.paymentHistory.push(paymentRecord);

    // 2. Sum up all payments to get the total paid amount
    const totalPaid = tanker.paymentHistory.reduce((sum: number, pay: any) => sum + pay.amount, 0);
    tanker.paidAmount = totalPaid;

    // 3. Save the document, which will trigger the pre-save hook to recalculate remainingAmount and status
    await tanker.save();

    return NextResponse.json({
      success: true,
      message: 'Payment installment recorded successfully.',
      data: tanker
    });

  } catch (error: any) {
    console.error("Error logging payment:", error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}
