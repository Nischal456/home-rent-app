import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Payment from '@/models/Payment'; // It's better to get the last payment from a dedicated Payment model if available

// ✅ THE FIX: This line is crucial for Vercel. It forces this route to be dynamic,
// preventing Vercel from caching the data and ensuring you always get fresh results.
export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();

  try {
    // We can run all these database queries concurrently for better performance
    const [
      rentDueAggregation,
      activeTenants,
      unpaidUtilityBills,
      lastPayment,
    ] = await Promise.all([
      RentBill.aggregate([
        { $match: { status: { $in: ['DUE', 'OVERDUE'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.countDocuments({ role: 'TENANT', roomId: { $ne: null } }),
      UtilityBill.countDocuments({ status: { $in: ['DUE', 'OVERDUE'] } }),
      // A more reliable way to find the last payment
      Payment.findOne({ status: 'VERIFIED' }).sort({ createdAt: -1 }).select('amount createdAt').lean()
    ]);

    const summaryData = {
      totalRentDue: rentDueAggregation[0]?.total || 0,
      activeTenants: activeTenants || 0,
      unpaidUtilityBills: unpaidUtilityBills || 0,
      // Provide a clear fallback if no payments have been made yet
      lastPayment: lastPayment 
        ? { amount: lastPayment.amount, date: lastPayment.createdAt.toISOString() } 
        : { amount: 0, date: new Date().toISOString() },
    };
    
    return NextResponse.json({
      success: true,
      data: summaryData,
    });

  } catch (error) {
    console.error('Error fetching summary data:', error);
    return NextResponse.json({ success: false, message: 'Error fetching summary data' }, { status: 500 });
  }
}