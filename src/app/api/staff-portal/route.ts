import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTask from '@/models/DailyTask';
import StaffPayment from '@/models/StaffPayment';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

    // Fetch tasks specifically targeted to this employee
    const tasks = await DailyTask.find({ assignedTo: userId }).sort({ createdAt: -1 });
    
    // Fetch personal payroll history
    const finances = await StaffPayment.find({ staffId: userId }).sort({ date: -1 });

    // Calculate net balance (Salary vs Advance - maybe not strictly required but good for display)
    let netBalance = 0;
    finances.forEach((f: any) => {
        if (f.type === 'ADVANCE') netBalance -= f.amount;
        else netBalance += f.amount;
    });

    return NextResponse.json({
        success: true,
        data: { userId, tasks, finances, netBalance }
    });

  } catch (error) {
    console.error("Staff Portal API Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
