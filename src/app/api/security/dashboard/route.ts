import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import NepaliDate from 'nepali-date-converter';

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
    let finances: any[] = [];
    let netBalance = 0;
    let totalSalaryPaid = 0;
    let totalAdvanceGiven = 0;
    let totalBonus = 0;
    let currentMonthAdvances = 0;
    let currentMonthSalaryPaid = 0;
    let baseSalary = 25000;

    // Fetch the target staff user document (Security Guard)
    let staffUser = null;
    if (decoded.role === 'ADMIN') {
      staffUser = await User.findOne({ role: 'SECURITY' }).lean();
    } else {
      staffUser = await User.findById(decoded.id).lean();
    }

    if (staffUser) {
      const staffId = staffUser._id;
      const role = staffUser.role;
      if (role === 'CLEANER') baseSalary = 8000;
      else if (role === 'ACCOUNTANT') baseSalary = 15000;

      finances = await StaffPayment.find({ staffId }).populate('staffId', 'fullName').sort({ date: -1 }).lean();

      // Current Nepali month formatting (e.g. "2083-02")
      const nowNp = new NepaliDate();
      const currentMonthStr = `${nowNp.getYear()}-${String(nowNp.getMonth() + 1).padStart(2, '0')}`;
      const uniqueMonths = new Set<string>();

      finances.forEach((record: any) => {
        if (record.type === 'ADVANCE') {
          totalAdvanceGiven += record.amount;
        } else if (record.type === 'SALARY') {
          totalSalaryPaid += record.amount;
        } else if (record.type === 'BONUS') {
          totalBonus += record.amount;
        }

        // Determine Nepali month string (YYYY-MM)
        let monthStr = '';
        if (record.month && typeof record.month === 'string') {
          const match = record.month.match(/^(\d{4}-\d{2})/);
          if (match) {
            monthStr = match[1];
          } else {
            try {
              const npDate = new NepaliDate(new Date(record.date));
              monthStr = `${npDate.getYear()}-${String(npDate.getMonth() + 1).padStart(2, '0')}`;
            } catch (e) {}
          }
        } else {
          try {
            const npDate = new NepaliDate(new Date(record.date));
            monthStr = `${npDate.getYear()}-${String(npDate.getMonth() + 1).padStart(2, '0')}`;
          } catch (e) {}
        }

        if (monthStr) {
          uniqueMonths.add(monthStr);
          if (monthStr === currentMonthStr) {
            if (record.type === 'ADVANCE') {
              currentMonthAdvances += record.amount;
            } else if (record.type === 'SALARY') {
              currentMonthSalaryPaid += record.amount;
            }
          }
        }
      });

      const uniqueMonthsCount = uniqueMonths.size;
      const totalSalaryEarned = (uniqueMonthsCount * baseSalary) + totalBonus;
      netBalance = totalSalaryEarned - (totalAdvanceGiven + totalSalaryPaid);
    }

    const currentMonthReceivable = baseSalary - currentMonthAdvances;

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
        totalSalaryPaid,
        totalAdvanceGiven,
        totalBonus,
        baseSalary,
        currentMonthAdvances,
        currentMonthSalaryPaid,
        currentMonthReceivable,
        activeMaintenance,
        tasks,
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