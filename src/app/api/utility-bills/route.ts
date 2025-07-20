import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';
import User from '@/models/User';
import Room from '@/models/Room';
import NepaliDate from 'nepali-date-converter';
import { createNotification } from '@/lib/createNotification';
import { Types } from 'mongoose'; // Import Types for ObjectId

export async function GET() {
  await dbConnect();
  try {
    // By importing User and Room above, Mongoose is aware of them.
    // The .populate() calls will work without needing to reference the models here.
    const bills = await UtilityBill.find({})
      .populate('tenantId', 'fullName')
      .populate('roomId', 'roomNumber')
      .sort({ billDateAD: -1 });
      
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error("Error fetching utility bills:", error); // Use the error variable
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
        new Types.ObjectId(tenantId), // ✅ FIX: Convert string ID to ObjectId
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