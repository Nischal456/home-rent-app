import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTask from '@/models/DailyTask';
import StaffPayment from '@/models/StaffPayment';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import NepaliDate from 'nepali-date-converter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, role: string } | null;
    if (!decoded || (decoded.role !== 'ACCOUNTANT' && decoded.role !== 'CLEANER' && decoded.role !== 'SECURITY')) {
      return NextResponse.json({ success: false, message: 'Unauthorized Access' }, { status: 401 });
    }

    const userId = decoded.id;

    // Fetch the staff user details
    const staffUser = await User.findById(userId).lean();
    if (!staffUser) {
      return NextResponse.json({ success: false, message: 'Staff user not found' }, { status: 404 });
    }

    const role = staffUser.role;
    let baseSalary = 25000;
    if (role === 'CLEANER') baseSalary = 8000;
    else if (role === 'ACCOUNTANT') baseSalary = 15000;

    // Fetch tasks specifically targeted to this employee
    const tasks = await DailyTask.find({ assignedTo: userId }).sort({ createdAt: -1 });
    
    // Fetch personal payroll history
    const finances = await StaffPayment.find({ staffId: userId }).sort({ date: -1 }).lean();

    let totalSalaryPaid = 0;
    let totalAdvanceGiven = 0;
    let totalBonus = 0;
    let currentMonthAdvances = 0;
    let currentMonthSalaryPaid = 0;

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
    const netBalance = totalSalaryEarned - (totalAdvanceGiven + totalSalaryPaid);
    const currentMonthReceivable = baseSalary - currentMonthAdvances;

    return NextResponse.json({
        success: true,
        data: {
          userId,
          tasks,
          finances,
          netBalance,
          totalSalaryPaid,
          totalAdvanceGiven,
          totalBonus,
          baseSalary,
          currentMonthAdvances,
          currentMonthSalaryPaid,
          currentMonthReceivable
        }
    });

  } catch (error) {
    console.error("Staff Portal API Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
