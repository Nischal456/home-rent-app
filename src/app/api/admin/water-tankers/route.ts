import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WaterTanker from '@/models/WaterTanker';
import User from '@/models/User';
import Expense from '@/models/Expense';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface TokenPayload {
  id: string;
  role: string;
}

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const tankers = await WaterTanker.find({})
      .populate('addedBy', 'fullName')
      .sort({ entryDate: -1 });

    return NextResponse.json({ success: true, data: tankers });
  } catch (error) {
    console.error("Error fetching water tankers:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token provided.' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { entryDate, vendor, cost, volumeLiters, remarks } = body;

    if (!cost || !vendor) {
      return NextResponse.json({ success: false, message: 'Total Cost and Vendor Name are required.' }, { status: 400 });
    }

    // 1. Create the Water Tanker Log
    const [newTanker] = await WaterTanker.create([{
      entryDate: entryDate ? new Date(entryDate) : new Date(),
      volumeLiters: Number(volumeLiters || 0),
      cost: Number(cost),
      vendor,
      remarks: remarks || '',
      addedBy: decoded.id
    }], { session });

    // 2. Automatically log the financial Expense record (UTILITIES category)
    await Expense.create([{
      amount: Number(cost),
      date: entryDate ? new Date(entryDate) : new Date(),
      category: 'UTILITIES',
      description: `Water Tanker (${volumeLiters}L) - Supplier: ${vendor}`,
      type: 'EXPENSE'
    }], { session });

    await session.commitTransaction();

    return NextResponse.json({ success: true, message: 'Water Tanker and Expense successfully logged.', data: newTanker });

  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error creating water tanker:", error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  } finally {
    session.endSession();
  }
}