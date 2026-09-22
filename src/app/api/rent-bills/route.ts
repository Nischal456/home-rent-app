import { NextResponse as RentBillNextResponse } from 'next/server';
import dbConnectRent from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import '@/models/User'; // ✅ FIX: Import for side-effects to register schema
import '@/models/Room'; // ✅ FIX: Import for side-effects to register schema
import NepaliDate from 'nepali-date-converter';
import { createNotification } from '@/lib/createNotification';
import { Types } from 'mongoose';

import UtilityBill from '@/models/UtilityBill';

export async function GET() {
  await dbConnectRent();
  try {
    const [bills, utilityDues, rentDues] = await Promise.all([
      RentBill.find({})
        .populate('tenantId', 'fullName email phone')
        .populate('roomId', 'roomNumber floor')
        .sort({ billDateAD: -1 })
        .lean(),
      UtilityBill.aggregate([
        { $match: { status: { $in: ['DUE', 'OVERDUE', 'PARTIALLY_PAID'] } } },
        {
          $group: {
            _id: '$tenantId',
            due: { $sum: { $ifNull: ['$remainingAmount', { $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] }] } },
          },
        },
      ]),
      RentBill.aggregate([
        { $match: { status: { $in: ['DUE', 'OVERDUE', 'PARTIALLY_PAID'] } } },
        {
          $group: {
            _id: '$tenantId',
            due: { $sum: { $ifNull: ['$remainingAmount', { $subtract: ['$amount', { $ifNull: ['$paidAmount', 0] }] }] } },
          },
        },
      ]),
    ]);

    const tenantDueMap = new Map<string, number>();
    utilityDues.forEach((d: any) => {
      const id = d._id?.toString();
      if (id) tenantDueMap.set(id, (tenantDueMap.get(id) || 0) + Math.max(0, d.due));
    });
    rentDues.forEach((d: any) => {
      const id = d._id?.toString();
      if (id) tenantDueMap.set(id, (tenantDueMap.get(id) || 0) + Math.max(0, d.due));
    });

    const enrichedBills = bills.map((b: any) => {
      const tenantId = b.tenantId?._id?.toString();
      const thisRem = b.status === 'PAID' ? 0 : (b.remainingAmount ?? (b.amount - (b.paidAmount || 0)));
      return {
        ...b,
        remainingAmount: thisRem,
        totalOutstandingDue: tenantId ? (tenantDueMap.get(tenantId) || 0) : thisRem,
      };
    });

    return RentBillNextResponse.json({ success: true, data: enrichedBills });
  } catch (error) {
    console.error("Error fetching rent bills:", error);
    return RentBillNextResponse.json({ success: false, message: 'Error fetching rent bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnectRent();
  try {
    const body = await request.json();
    const { tenantId, roomId, rentForPeriod, amount, remarks } = body;

    if (!tenantId || !roomId || !rentForPeriod || !amount) {
      return RentBillNextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const todayAD = new Date();
    const todayBS = new NepaliDate(todayAD).format('YYYY-MM-DD');

    const newBill = new RentBill({
      tenantId,
      roomId,
      billDateAD: todayAD,
      billDateBS: todayBS,
      rentForPeriod,
      amount,
      remarks,
      status: 'DUE',
    });
    await newBill.save();

    await createNotification(
        new Types.ObjectId(tenantId),
        'New Rent Bill Created',
        `A new rent bill of Rs ${amount} for "${rentForPeriod}" has been added.`,
        `/bill/${newBill._id}?type=rent`,
        'PAYMENT'
    );

    return RentBillNextResponse.json({ success: true, message: 'Rent bill created successfully', data: newBill }, { status: 201 });
  } catch (error) {
    console.error('Error creating rent bill:', error);
    return RentBillNextResponse.json({ success: false, message: 'Error creating rent bill' }, { status: 500 });
  }
}