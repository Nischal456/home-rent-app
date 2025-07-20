import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { createNotification } from '@/lib/createNotification';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import Payment from '@/models/Payment';
import jwt from 'jsonwebtoken';
import { Types, Document } from 'mongoose'; // Import Types and Document

interface TokenPayload {
  id: string;
  fullName: string;
}

// Define a more specific type for your User document
interface UserDocument extends Document {
  _id: Types.ObjectId; // This tells TypeScript _id is an ObjectId
  role: string;
}

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const token = request.cookies.get('token')?.value || '';
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token provided.' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined.");
      return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    if (!tokenData || !tokenData.fullName) {
      return NextResponse.json({ success: false, message: 'Unauthorized or invalid token data.' }, { status: 401 });
    }

    // Cast the result of find() to your new, more specific type
    const admins = await User.find({ role: 'ADMIN' }) as UserDocument[];
    if (!admins.length) {
      return NextResponse.json({ success: false, message: 'No admin users found to notify.' }, { status: 404 });
    }
    
    const rentBills = await RentBill.find({ tenantId: tokenData.id, status: 'DUE' });
    const utilityBills = await UtilityBill.find({ tenantId: tokenData.id, status: 'DUE' });
    const totalDue = rentBills.reduce((acc, bill) => acc + bill.amount, 0) + utilityBills.reduce((acc, bill) => acc + bill.totalAmount, 0);

    if (totalDue <= 0) {
        return NextResponse.json({ success: false, message: "No pending bills to pay." }, { status: 400 });
    }

    const newPayment = new Payment({
        tenantId: tokenData.id,
        amount: totalDue,
    });
    await newPayment.save();

    // Notify all admins
    const notificationPromises = admins.map(admin => 
      createNotification(
        admin._id, // ✅ FIX: Pass the ObjectId directly
        'Payment Submitted for Verification',
        `${tokenData.fullName} has submitted a payment of Rs ${totalDue.toLocaleString()} for your verification.`,
        '/dashboard/payments'
      )
    );
    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true, message: 'Payment verification request sent successfully.' });
  } catch (error) {
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("API Error in /api/payments/confirm:", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}