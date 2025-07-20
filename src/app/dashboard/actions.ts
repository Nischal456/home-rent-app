'use server';

import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { createNotification } from '@/lib/createNotification';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import jwt from 'jsonwebtoken';
import { Types, Document } from 'mongoose';

interface TokenPayload {
  id: string;
  fullName: string;
}

// Define a specific type for the User document
interface UserDocument extends Document {
  _id: Types.ObjectId;
  role: string;
}

export async function requestPaymentVerification() {
  try {
    await dbConnect();

    // ✅ FIX: Added 'await'
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Unauthorized: No authentication token found.');
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("Server configuration error: JWT_SECRET is not set.");
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    
    if (!tokenData) {
      throw new Error('Unauthorized or invalid token data.');
    }

    // ✅ FIX: Properly type the result of User.find()
    const admins = await User.find({ role: 'ADMIN' }) as UserDocument[];
    if (!admins.length) {
      throw new Error('No admin users found to notify.');
    }
    
    const rentBills = await RentBill.find({ tenantId: tokenData.id, status: 'DUE' });
    const utilityBills = await UtilityBill.find({ tenantId: tokenData.id, status: 'DUE' });
    const totalDue = rentBills.reduce((acc, bill) => acc + bill.amount, 0) + utilityBills.reduce((acc, bill) => acc + bill.totalAmount, 0);

    if (totalDue <= 0) {
        throw new Error("No pending bills to pay.");
    }

    const newPayment = new Payment({
        tenantId: tokenData.id,
        amount: totalDue,
    });
    await newPayment.save();

    // ✅ FIX: Pass admin._id directly without 'as any'
    const notificationPromises = admins.map(admin => 
      createNotification(
        admin._id,
        'Payment Submitted for Verification',
        `${tokenData.fullName} has submitted a payment of Rs ${totalDue.toLocaleString()} for your verification.`,
        '/dashboard/payments'
      )
    );
    await Promise.all(notificationPromises);

    return { success: true, message: 'Payment verification request sent successfully.' };
  } catch (error) {
    // ✅ FIX: Safely handle the error type
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("Server Action Error:", errorMessage);
    return { success: false, message: errorMessage };
  }
}