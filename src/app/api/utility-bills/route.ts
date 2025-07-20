import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';
import '@/models/User'; // ✅ FIX: Import for side-effects to register schema
import '@/models/Room'; // ✅ FIX: Import for side-effects to register schema
import NepaliDate from 'nepali-date-converter';
import { createNotification } from '@/lib/createNotification';
import { Types } from 'mongoose';

export async function GET() {
  await dbConnect();
  try {
    const bills = await UtilityBill.find({})
      .populate('tenantId', 'fullName')
      .populate('roomId', 'roomNumber')
      .sort({ billDateAD: -1 });
      
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error("Error fetching utility bills:", error);
    return NextResponse.json({ success: false, message: 'Error fetching utility bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    
    const { tenantId, roomId, billingMonthBS, electricity, water, serviceCharge, securityCharge, totalAmount } = body;

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
      water,
      serviceCharge,
      securityCharge,
      totalAmount,
      status: 'DUE',
    });

    await newBill.save();

    await createNotification(
        new Types.ObjectId(tenantId),
        'New Utility Bill',
        `Your utility bill of Rs ${totalAmount.toLocaleString('en-IN')} for ${billingMonthBS} is ready.`,
        '/dashboard'
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