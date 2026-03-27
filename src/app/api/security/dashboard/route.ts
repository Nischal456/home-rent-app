import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Explicitly register models
import User from '@/models/User';
import Room from '@/models/Room';
import WaterTanker from '@/models/WaterTanker';
import StaffPayment from '@/models/StaffPayment';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import Expense from '@/models/Expense';
import DailyTask from '@/models/DailyTask'; // ✅ NEW MODEL

export const dynamic = 'force-dynamic';

interface TokenPayload { id: string; role: string; }

export async function GET(request: NextRequest) {
  await dbConnect();
  const _models = { User, Room, WaterTanker, StaffPayment, MaintenanceRequest, Expense, DailyTask };

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // 1. Fetch Water Logs
    const recentWater = await WaterTanker.find({}).populate('addedBy', 'fullName').sort({ entryDate: -1 }).limit(10).lean();

    // 2. Fetch Finance History & Fix Balance Logic
    let finances;
    let netBalance = 0; // Positive means Admin owes Guard. Negative means Guard took excess advance.

    const financeQuery = decoded.role === 'ADMIN' ? {} : { staffId: decoded.id };
    finances = await StaffPayment.find(financeQuery).populate('staffId', 'fullName').sort({ date: -1 }).lean();

    let totalSalaryPaid = 0;
    let totalAdvanceGiven = 0;

    finances.forEach((record: any) => {
      // ✅ ACCURATE MATH: 
      // Salary logged means the guard EARNED it.
      // Advance logged means the guard TOOK it early.
      if (record.type === 'ADVANCE') totalAdvanceGiven += record.amount;
      else if (record.type === 'SALARY' || record.type === 'BONUS') totalSalaryPaid += record.amount;
    });

    // If Admin pays 25k salary, and gave 5k advance. The net settled balance depends on your accounting.
    // Assuming: Net Balance = Total Earned - Total Advanced
    netBalance = totalSalaryPaid - totalAdvanceGiven;

    // 3. Fetch Active Maintenance
    const activeMaintenance = await MaintenanceRequest.find({ status: { $ne: 'COMPLETED' } })
      .populate('tenantId', 'fullName').populate('roomId', 'roomNumber').sort({ createdAt: -1 }).lean();

    // 4. ✅ NEW: Fetch Daily Tasks (Only Today's and Upcoming)
    // To save memory, we only send the last 30 days of tasks to the client
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await DailyTask.find({ dateAD: { $gte: thirtyDaysAgo } })
      .sort({ dateAD: -1, priority: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        recentWater,
        finances,
        netBalance,
        totalSalaryPaid, // Send these for accurate UI display
        totalAdvanceGiven,
        activeMaintenance,
        tasks, // ✅ Sent to UI
        userRole: decoded.role
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) throw new Error("Unauthorized");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const { cost, volumeLiters } = await request.json();

    if (!cost || !volumeLiters) throw new Error("Cost and Volume are required");

    // 1. Log the Water Tanker
    const newTanker = await WaterTanker.create([{
      cost: Number(cost),
      volumeLiters: Number(volumeLiters),
      addedBy: decoded.id,
      entryDate: new Date()
    }], { session });

    // 2. Automatically create a Financial Expense
    // Ensure 'UTILITIES' matches your Expense model enum
    await Expense.create([{
      amount: Number(cost),
      date: new Date(),
      category: 'UTILITIES',
      description: `Water Tanker (${volumeLiters}L) - Logged by Security`,
      type: 'EXPENSE'
    }], { session });

    await session.commitTransaction();
    return NextResponse.json({ success: true, message: 'Water Tanker & Expense Logged', data: newTanker[0] });

  } catch (error: any) {
    await session.abortTransaction();
    console.error("Security Dashboard POST Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to log water' }, { status: 500 });
  } finally {
    session.endSession();
  }
}