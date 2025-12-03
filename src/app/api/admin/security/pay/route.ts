import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import StaffPayment from '@/models/StaffPayment';
import Expense from '@/models/Expense';
import User from '@/models/User';
import mongoose from 'mongoose';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { type, amount, month, date, remarks } = await request.json();
    
    const guard = await User.findOne({ role: 'SECURITY' });
    if (!guard) throw new Error("No security guard account found.");

    const paymentDate = date ? new Date(date) : new Date();

    // 1. Record the payment to the staff
    await StaffPayment.create([{
        staffId: guard._id,
        type,
        amount: Number(amount),
        month: type === 'SALARY' ? month : undefined,
        date: paymentDate,
        remarks: remarks || ''
    }], { session });

    // 2. Log as an Expense
    // ✅ FIX: Use 'SALARY' category to match your Expense Model Enum
    // For 'ADVANCE', we can categorize it as 'OTHER' or 'SALARY' depending on your preference.
    // Using 'SALARY' keeps all staff payments grouped.
    await Expense.create([{
        amount: Number(amount),
        date: paymentDate,
        category: 'SALARY', 
        description: `Security Guard - ${type} ${month ? `(${month})` : ''}. ${remarks || ''}`,
        type: 'EXPENSE'
    }], { session });

    await session.commitTransaction();

    // 3. Notify Guard
    await pusherServer.trigger('security-channel', 'payment-received', {
        title: `Payment Received: ${type}`,
        message: `You received Rs ${Number(amount).toLocaleString()} (${remarks || 'No remarks'})`,
        amount: amount
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Pay Staff Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Error' }, { status: 500 });
  } finally {
    session.endSession();
  }
}