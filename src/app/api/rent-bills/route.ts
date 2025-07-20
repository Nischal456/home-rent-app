import { NextResponse as RentBillNextResponse } from 'next/server';
import dbConnectRent from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import '@/models/User'; // ✅ FIX: Import for side-effects to register schema
import '@/models/Room'; // ✅ FIX: Import for side-effects to register schema
import NepaliDate from 'nepali-date-converter';
import { createNotification } from '@/lib/createNotification';
import { Types } from 'mongoose';

export async function GET() {
  await dbConnectRent();
  try {
    const bills = await RentBill.find({})
      .populate('tenantId', 'fullName')
      .populate('roomId', 'roomNumber')
      .sort({ billDateAD: -1 });

    return RentBillNextResponse.json({ success: true, data: bills });
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
        '/dashboard'
    );

    return RentBillNextResponse.json({ success: true, message: 'Rent bill created successfully', data: newBill }, { status: 201 });
  } catch (error) {
    console.error('Error creating rent bill:', error);
    return RentBillNextResponse.json({ success: false, message: 'Error creating rent bill' }, { status: 500 });
  }
}