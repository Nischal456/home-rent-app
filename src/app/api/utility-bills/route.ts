import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Room from '@/models/Room';
import NepaliDate from 'nepali-date-converter'; // <-- The critical missing import
import { createNotification } from '@/lib/createNotification';

export async function GET() {
  await dbConnect();
  try {
    // Pre-load models to prevent schema errors on populate
    const _ = User;
    const __ = Room;
    const bills = await UtilityBill.find({}).populate('tenantId', 'fullName').populate('roomId', 'roomNumber').sort({ billDateAD: -1 });
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching utility bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    
    const { tenantId, roomId, billingMonthBS, electricity, water, serviceCharge, securityCharge, totalAmount } = body;

    // More robust validation
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

    // Create a notification for the tenant
    await createNotification(
        tenantId,
        'New Utility Bill',
        `Your utility bill of Rs ${totalAmount.toLocaleString('en-IN')} for ${billingMonthBS} is ready.`,
        '/dashboard'
    );

    return NextResponse.json({ success: true, message: 'Utility bill created successfully', data: newBill }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating utility bill:', error.message);
    return NextResponse.json({ success: false, message: 'Error creating utility bill', error: error.message }, { status: 500 });
  }
}
