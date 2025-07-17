
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';

export async function GET() {
  await dbConnect();

  try {
    // Calculate total rent due (sum of amounts for all bills with 'DUE' status)
    const rentDueAggregation = await RentBill.aggregate([
      { $match: { status: 'DUE' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRentDue = rentDueAggregation.length > 0 ? rentDueAggregation[0].total : 0;

    // Count active tenants
    const activeTenants = await User.countDocuments({ role: 'TENANT', roomId: { $ne: null } });
    
    // Count unpaid utility bills
    const unpaidUtilityBills = await UtilityBill.countDocuments({ status: 'DUE' });

    // Find the most recent payment (can be from either Rent or Utility)
    const lastRentPayment = await RentBill.findOne({ status: 'PAID' }).sort({ paidOnBS: -1 });
    const lastUtilityPayment = await UtilityBill.findOne({ status: 'PAID' }).sort({ paidOnBS: -1 });

    let lastPayment = { amount: 0, date: 'N/A' };
    // This logic can be improved, but for now, it finds the latest of the two
    if (lastRentPayment && (!lastUtilityPayment || lastRentPayment.paidOnBS! > lastUtilityPayment.paidOnBS!)) {
        lastPayment = { amount: lastRentPayment.amount, date: lastRentPayment.paidOnBS! };
    } else if (lastUtilityPayment) {
        lastPayment = { amount: lastUtilityPayment.totalAmount, date: lastUtilityPayment.paidOnBS! };
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRentDue,
        activeTenants,
        unpaidUtilityBills,
        lastPayment,
      },
    });

  } catch (error) {
    console.error('Error fetching summary data:', error);
    return NextResponse.json({ success: false, message: 'Error fetching summary data' }, { status: 500 });
  }
}
