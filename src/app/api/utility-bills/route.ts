import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';
import '@/models/User'; // ✅ FIX: Import for side-effects to register schema
import '@/models/Room'; // ✅ FIX: Import for side-effects to register schema
import NepaliDate from 'nepali-date-converter';
import { createNotification } from '@/lib/createNotification';
import { Types } from 'mongoose';

import RentBill from '@/models/RentBill';

export async function GET() {
  await dbConnect();
  try {
    const [bills, utilityDues, rentDues] = await Promise.all([
      UtilityBill.find({})
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
      const thisRem = b.status === 'PAID' ? 0 : (b.remainingAmount ?? (b.totalAmount - (b.paidAmount || 0)));
      return {
        ...b,
        remainingAmount: thisRem,
        totalOutstandingDue: tenantId ? (tenantDueMap.get(tenantId) || 0) : thisRem,
      };
    });

    return NextResponse.json({ success: true, data: enrichedBills });
  } catch (error) {
    console.error("Error fetching utility bills:", error);
    return NextResponse.json({ success: false, message: 'Error fetching utility bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();

    const { tenantId, roomId, billingMonthBS, electricity, threePhase, water, serviceCharge, securityCharge, totalAmount, remarks } = body;

    if (!tenantId || !roomId || !billingMonthBS || totalAmount === undefined || totalAmount === null) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const todayAD = new Date();
    const todayBS = new NepaliDate(todayAD).format('YYYY-MM-DD');

    const newBill = new UtilityBill({
      tenantId,
      roomId,
      billingMonthBS,
      billDateAD: todayAD,
      billDateBS: todayBS,
      electricity,
      threePhase,
      water,
      serviceCharge,
      securityCharge,
      totalAmount,
      status: 'DUE',
      remarks,
    });

    await newBill.save();

    await createNotification(
      new Types.ObjectId(tenantId),
      'New Utility Bill',
      `Your utility bill of Rs ${totalAmount.toLocaleString('en-IN')} for ${billingMonthBS} is ready.`,
      `/bill/${newBill._id}?type=utility`,
      'PAYMENT'
    );

    return NextResponse.json({ success: true, message: 'Utility bill created successfully', data: newBill }, { status: 201 });

  } catch (error) {
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error creating utility bill:', errorMessage);
    return NextResponse.json({ success: false, message: 'Error creating utility bill' }, { status: 500 });
  }
}