import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import StaffPayment from '@/models/StaffPayment';
import User from '@/models/User';
import { Types } from 'mongoose';
import { pusherServer } from '@/lib/pusher';
import { createNotification } from '@/lib/createNotification';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const url = new URL(request.url);
    const staffId = url.searchParams.get('staffId');

    const query = staffId ? { staffId: new Types.ObjectId(staffId) } : {};
    
    // Fetch all payroll records, populated with staff details
    const payroll = await StaffPayment.find(query)
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });
      
    return NextResponse.json({ success: true, data: payroll });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { staffId, type, amount, date, remarks, month } = await request.json();

    if (!staffId || !type || !amount) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const targetStaff = await User.findById(staffId);
    if (!targetStaff) {
        return NextResponse.json({ success: false, message: 'Staff member not found.' }, { status: 404 });
    }

    const newPayment = await StaffPayment.create({
      staffId: new Types.ObjectId(staffId),
      type,
      amount,
      date: date ? new Date(date) : new Date(),
      remarks,
      month
    });

    // Save persistent notification to DB so employee sees it in the top Bell
    await createNotification(
      new Types.ObjectId(staffId),
      "💰 Salary Disbursed!",
      `Rs ${Number(amount).toLocaleString()} for ${month}${remarks ? ` - Note: ${remarks}` : ''}`,
      "/dashboard/staff-portal",
      "PAYMENT"
    );

    try {
        await pusherServer.trigger(`staff-channel-${staffId}`, 'payment-received', {
            type,
            amount,
            month,
            remarks,
        });
    } catch(pushError) {
        console.error("Staff Payroll Pusher Error:", pushError);
    }

    return NextResponse.json({ success: true, message: 'Payroll recorded successfully.', data: newPayment });
  } catch (error) {
    console.error("Error recording payroll:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
