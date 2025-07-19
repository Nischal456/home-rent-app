import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { createNotification } from '@/lib/createNotification';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import Payment from '@/models/Payment';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  fullName: string;
}

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    // This is the most reliable way to get the token inside an API route.
    const token = request.cookies.get('token')?.value || '';
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token provided.' }, { status: 401 });
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    if (!tokenData || !tokenData.fullName) {
      return NextResponse.json({ success: false, message: 'Unauthorized or invalid token data.' }, { status: 401 });
    }

    const admins = await User.find({ role: 'ADMIN' });
    if (!admins.length) {
      return NextResponse.json({ success: false, message: 'No admin users found to notify.' }, { status: 404 });
    }
    
    const rentBills = await RentBill.find({ tenantId: tokenData.id, status: 'DUE' });
    const utilityBills = await UtilityBill.find({ tenantId: tokenData.id, status: 'DUE' });
    const totalDue = rentBills.reduce((acc, bill) => acc + bill.amount, 0) + utilityBills.reduce((acc, bill) => acc + bill.totalAmount, 0);

    if (totalDue <= 0) {
        return NextResponse.json({ success: false, message: "No pending bills to pay." }, { status: 400 });
    }

    // Create a new payment record
    const newPayment = new Payment({
        tenantId: tokenData.id,
        amount: totalDue,
    });
    await newPayment.save();

    // Notify all admins
    const notificationPromises = admins.map(admin => 
      createNotification(
        admin._id as any,
        'Payment Submitted for Verification',
        `${tokenData.fullName} has submitted a payment of Rs ${totalDue.toLocaleString()} for your verification.`,
        '/dashboard/payments'
      )
    );
    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true, message: 'Payment verification request sent successfully.' });
  } catch (error: any) {
    console.error("API Error in /api/payments/confirm:", error.message);
    return NextResponse.json({ success: false, message: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
