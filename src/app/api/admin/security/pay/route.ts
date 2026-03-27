import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import StaffPayment from '@/models/StaffPayment';
import Expense from '@/models/Expense';
import User from '@/models/User';
import mongoose from 'mongoose';
import { pusherServer } from '@/lib/pusher';
import { createNotification } from '@/lib/createNotification';

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
    // Using 'SALARY' category to match your Expense Model Enum and keep all staff payments grouped.
    await Expense.create([{
      amount: Number(amount),
      date: paymentDate,
      category: 'SALARY',
      description: `Security Guard - ${type} ${month ? `(${month})` : ''}. ${remarks || ''}`,
      type: 'EXPENSE'
    }], { session });

    await session.commitTransaction();

    // 3. Premium Dynamic Notifications
    let notifTitle = '';
    let notifMessage = '';

    if (type === 'SALARY') {
      notifTitle = 'Salary Credited 💰';
      notifMessage = `Your salary of Rs ${Number(amount).toLocaleString()} for ${month} has been credited.`;
    } else if (type === 'ADVANCE') {
      notifTitle = 'Advance Approved 💸';
      notifMessage = `An advance of Rs ${Number(amount).toLocaleString()} has been issued to you.`;
    } else if (type === 'BONUS') {
      notifTitle = 'Bonus Received 🎉';
      notifMessage = `You received a bonus of Rs ${Number(amount).toLocaleString()}!`;
    } else {
      notifTitle = `Payment Received: ${type}`;
      notifMessage = `You received Rs ${Number(amount).toLocaleString()}.`;
    }

    // Append remarks if they exist
    if (remarks) {
      notifMessage += ` Note: ${remarks}`;
    }

    // Trigger the real-time push notification to the Security Dashboard
    await pusherServer.trigger('security-channel', 'payment-received', {
      title: notifTitle,
      message: notifMessage,
      amount: amount,
      type: type
    });

    // Handle persistent database notification
    await createNotification(
      guard._id as mongoose.Types.ObjectId,
      notifTitle,
      notifMessage,
      '/dashboard/security'
    );


    return NextResponse.json({ success: true });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Pay Staff Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Error' }, { status: 500 });
  } finally {
    session.endSession();
  }
}