'use server'; // <-- This directive is CRITICAL and must be at the very top of the file.

import { cookies } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { createNotification } from '@/lib/createNotification';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  fullName: string;
}

export async function requestPaymentVerification() {
  try {
    await dbConnect();

    // This is the modern, reliable way to get cookies in a Server Action.
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Unauthorized: No authentication token found.');
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    if (!tokenData) {
      throw new Error('Unauthorized or invalid token data.');
    }

    const admins = await User.find({ role: 'ADMIN' });
    if (!admins.length) {
      throw new Error('No admin users found to notify.');
    }
    
    const rentBills = await RentBill.find({ tenantId: tokenData.id, status: 'DUE' });
    const utilityBills = await UtilityBill.find({ tenantId: tokenData.id, status: 'DUE' });
    const totalDue = rentBills.reduce((acc, bill) => acc + bill.amount, 0) + utilityBills.reduce((acc, bill) => acc + bill.totalAmount, 0);

    if (totalDue <= 0) {
        throw new Error("No pending bills to pay.");
    }

    // Create a new payment record
    const newPayment = new Payment({
        tenantId: tokenData.id,
        amount: totalDue,
    });
    await newPayment.save();

    // Notify all admins about the new pending payment
    const notificationPromises = admins.map(admin => 
      createNotification(
        admin._id as any,
        'Payment Submitted for Verification',
        `${tokenData.fullName} has submitted a payment of Rs ${totalDue.toLocaleString()} for your verification.`,
        '/dashboard/payments' // Link admin to the new payments page
      )
    );
    await Promise.all(notificationPromises);

    return { success: true, message: 'Payment verification request sent successfully.' };
  } catch (error: any) {
    console.error("Server Action Error:", error.message);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}